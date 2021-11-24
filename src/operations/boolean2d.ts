import { CombinedPrimitive, FacePrimitive, Primitive } from ".."
import Operations, { MultiPolygon, Polygon, union, Pair, Ring } from "polygon-clipping"
import { Matrix4, Plane, Shape, Vector2, Vector3 } from "three"

const helperPlane = new Plane()
const helperMatrix = new Matrix4()

export function boolean2d(
    operation: "intersection" | "xor" | "union" | "difference",
    p1: Primitive,
    ...primitves: Array<Primitive>
): Primitive {
    const ownPolygons = p1.getPolygons()
    const foreignPolygons = primitves.map((p) => p.getPolygons()).reduce((v1, v2) => v1.concat(v2), [])

    const ownGroups = group(ownPolygons)
    const foreignGroups = group(foreignPolygons)

    const results = ownGroups
        .map<[MultiPolygon, Matrix4]>(([polygons, plane, matrix]) => {
            const matches = foreignGroups.filter(([_p, groupPlane], i) => {
                const match = planeIsEqual(plane, groupPlane)
                if (match) {
                    foreignGroups.splice(i, 1)
                }
                return match
            })
            if (matches.length === 0) {
                return [polygons, matrix]
            } else {
                return [Operations[operation](polygons, ...matches.map(([p]) => p)), matrix]
            }
        })
        .concat(foreignGroups.map<[MultiPolygon, Matrix4]>(([p, _, matrix]) => [p, matrix]))

    console.log(results.reduce((prev, r) => prev + r[0].length, 0))

    helperMatrix.copy(p1.matrix).invert()
    return new CombinedPrimitive(
        p1.matrix.clone(),
        results
            .map(([polygons, matrix]) =>
                polygons.map(
                    (polgygon) =>
                        new FacePrimitive(
                            matrix.clone().premultiply(helperMatrix),
                            new Shape(polgygon[0].map((pair) => new Vector2(...pair))) //TODO holes
                        )
                )
            )
            .reduce((v1, v2) => v1.concat(v2))
    )
}

const helperVector = new Vector3()

function group(group: Array<[Polygon, Matrix4]>): Array<[MultiPolygon, Plane, Matrix4, Matrix4]> {
    return group.reduce<Array<[MultiPolygon, Plane, Matrix4, Matrix4]>>((prev, [polygon, matrix]) => {
        helperPlane.normal.set(0, 1, 0) //because the face primitive lies in x,z plane
        helperPlane.constant = 0
        helperPlane.applyMatrix4(matrix)
        const group = prev.find(([_polygons, plane]) => planeIsEqual(plane, helperPlane))
        if (group != null) {
            const convertedPolygon = polygon.map((ring) =>
                ring.map<Pair>(([x, y]) => {
                    helperVector.set(x, 0, y)
                    helperVector.applyMatrix4(matrix).applyMatrix4(group[3])
                    return [helperVector.x, helperVector.z]
                })
            )
            group[0] = union(group[0], convertedPolygon)
            return prev
        } else {
            return [...prev, [[polygon], helperPlane.clone(), matrix, matrix.clone().invert()]]
        }
    }, [])
}

function planeIsEqual(p1: Plane, p2: Plane): boolean {
    return Math.abs(1 - p1.normal.dot(p2.normal)) < 0.001 && Math.abs(p1.constant - p2.constant) < 0.001
}
