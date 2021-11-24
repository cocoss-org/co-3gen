import { CombinedPrimitive, FacePrimitive, Polygon, Primitive } from ".."
//@ts-ignore
import PolyBool from "polybooljs"
import { Matrix4, Plane, Shape, Vector2, Vector3 } from "three"

PolyBool.epsilon(0.00001);

const helperPlane = new Plane()
const helperMatrix = new Matrix4()

function capitalize(val: string): string {
    return `${val.charAt(0).toUpperCase()}${val.slice(1)}`
}

function multipleBoolean(
    operation: "union" | "intersect" | "difference" | "differenceRev" | "xor",
    main: Segment,
    ...rest: Array<Segment>
): Array<Polygon> {
    let segments = main
    rest.forEach((p) => {
        segments = PolyBool[`select${capitalize(operation)}`](PolyBool.combine(segments, p))
    })
    return segmentToPoly(segments)
}

function segmentToPoly(segments: Segment): Array<Polygon> {
    const result = PolyBool.polygon(segments)
    if (Array.isArray(result)) {
        return result
    }
    return [result]
}

type Segment = {}

export function boolean2d(
    operation: "union" | "intersect" | "difference" | "differenceRev" | "xor",
    p1: Primitive,
    ...primitves: Array<Primitive>
): Primitive {
    const ownPolygons = p1.getPolygons()
    const foreignPolygons = primitves.map((p) => p.getPolygons()).reduce((v1, v2) => v1.concat(v2), [])

    const ownGroups = group(ownPolygons)
    const foreignGroups = group(foreignPolygons)

    const results = ownGroups
        .map<Array<[Polygon, Matrix4]>>(([segment, plane, matrix]) => {
            const matches = foreignGroups.filter(([_p, groupPlane], i) => {
                const match = planeIsEqual(plane, groupPlane)
                if (match) {
                    foreignGroups.splice(i, 1)
                }
                return match
            })
            if (matches.length === 0) {
                return segmentToPoly(segment).map((p: Polygon) => [p, matrix])
            } else {
                return multipleBoolean(operation, segment, ...matches.map(([s]) => s)).map((polygon) => [
                    polygon,
                    matrix,
                ])
            }
        })
        .concat(
            foreignGroups.map<Array<[Polygon, Matrix4]>>(([segment, _, matrix]) =>
                segmentToPoly(segment).map((p: Polygon) => [p, matrix])
            )
        )
        .reduce((v1, v2) => v1.concat(v2), [])

    helperMatrix.copy(p1.matrix).invert()
    return new CombinedPrimitive(
        p1.matrix.clone(),
        results
            .map(([polygons, matrix]) =>
                polygons.regions.map(
                    (polygon) =>
                        new FacePrimitive(
                            matrix.clone().premultiply(helperMatrix),
                            new Shape(polygon.map((position) => new Vector2(...position))) //TODO inverted/holes
                        )
                )
            )
            .reduce((v1, v2) => v1.concat(v2))
    )
}

const helperVector = new Vector3()

function group(group: Array<[Polygon, Matrix4]>): Array<[Segment, Plane, Matrix4, Matrix4]> {
    return group.reduce<Array<[Segment, Plane, Matrix4, Matrix4]>>((prev, [polygon, matrix]) => {
        helperPlane.normal.set(0, 1, 0) //because the face primitive lies in x,z plane
        helperPlane.constant = 0
        helperPlane.applyMatrix4(matrix)
        const group = prev.find(([_polygons, plane]) => planeIsEqual(plane, helperPlane))
        if (group != null) {
            const convertedPolygon: Polygon = {
                regions: polygon.regions.map((region) =>
                    region.map(([x, y]) => {
                        helperVector.set(x, 0, y)
                        helperVector.applyMatrix4(matrix).applyMatrix4(group[3])
                        return [helperVector.x, helperVector.z] as [number, number]
                    })
                ),
                inverted: polygon.inverted,
            }
            group[0] = PolyBool.selectUnion(PolyBool.combine(group[0], PolyBool.segments(convertedPolygon)))
            return prev
        } else {
            return [...prev, [PolyBool.segments(polygon), helperPlane.clone(), matrix, matrix.clone().invert()]]
        }
    }, [])
}

function planeIsEqual(p1: Plane, p2: Plane): boolean {
    return Math.abs(1 - p1.normal.dot(p2.normal)) < 0.001 && Math.abs(p1.constant - p2.constant) < 0.001
}
