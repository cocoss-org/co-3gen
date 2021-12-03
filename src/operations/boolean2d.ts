import { CombinedPrimitive, FacePrimitive, Polygon, Primitive } from ".."
import { Box2, Matrix4, Path, Plane, Shape, Vector2, Vector3 } from "three"
import { primitives, booleans, transforms } from "@jscad/modeling"
import pointInPolygon from "point-in-polygon"
import type { Vec2 } from "@jscad/modeling/src/maths/vec2"
import { polygon } from "@jscad/modeling/src/primitives"

const helperPlane = new Plane()

function multipleOperations(operation: keyof typeof booleans, ...polygons: Array<Polygon>) {
    return polygons.reduce<undefined | Polygon>(
        (prev, polygon) => (prev == null ? polygon : booleans[operation](prev, polygon)),
        undefined
    )
}

export function boolean2d(operation: keyof typeof booleans, p1: Primitive, ...primitves: Array<Primitive>): Primitive {
    const ownPolygons = p1.getPolygons()
    const foreignPolygons = primitves.map((p) => p.getPolygons()).reduce((v1, v2) => v1.concat(v2), [])

    const ownGroups = group(ownPolygons)
    const foreignGroups = group(foreignPolygons)

    const results = ownGroups
        .map<[Polygon, Matrix4]>(([polygons, plane, matrix, invertedMatrix]) => {
            const matches = foreignGroups.filter(([_p, groupPlane], i) => {
                const match = planeIsEqual(plane, groupPlane)
                if (match) {
                    foreignGroups.splice(i, 1)
                }
                return match
            })
            if (matches.length === 0) {
                return [booleans.union(...polygons), matrix]
            } else {
                const resultPolygon = booleans[operation](
                    booleans.union(...polygons),
                    ...matches
                        .map(([polygons, _, matrix]) =>
                            polygons.map((polygon) => convertPolygon(polygon, matrix, invertedMatrix))
                        )
                        .reduce((v1, v2) => v1.concat(v2), [])
                )
                return [resultPolygon, matrix]
            }
        })
        .concat(foreignGroups.map<[Polygon, Matrix4]>(([polygon, _, matrix]) => [booleans.union(...polygon), matrix]))

    return new CombinedPrimitive(
        new Matrix4(),
        results
            .filter(([polygon]) => polygon.sides.length > 2)
            .map(([polygon, matrix]) => FacePrimitive.fromPolygon(matrix.clone(), polygon))
    )
}

const helperVector = new Vector3()

function group(group: Array<[Polygon, Matrix4]>): Array<[Array<Polygon>, Plane, Matrix4, Matrix4]> {
    return group.reduce<Array<[Array<Polygon>, Plane, Matrix4, Matrix4]>>((prev, [polygon, matrix]) => {
        helperPlane.normal.set(0, 1, 0) //because the face primitive lies in x,z plane
        helperPlane.constant = 0
        helperPlane.applyMatrix4(matrix)
        const group = prev.find(([_polygons, plane]) => planeIsEqual(plane, helperPlane))
        if (group != null) {
            if (polygon.sides.length <= 2) {
                return prev
            }
            const convertedPolygon: Polygon = convertPolygon(polygon, matrix, group[3])
            group[0].push(convertedPolygon)
            return prev
        } else {
            return [...prev, [[polygon], helperPlane.clone(), matrix, matrix.clone().invert()]]
        }
    }, [])
}

function convertPolygon(polygon: Polygon, matrix: Matrix4, toInvertMatrix: Matrix4) {
    return primitives.polygon({
        points: polygon.sides.map(([[x, y]]) => {
            helperVector.set(x, 0, y)
            helperVector.applyMatrix4(matrix).applyMatrix4(toInvertMatrix)
            return [helperVector.x, helperVector.z] as Vec2
        }),
    })
}

function planeIsEqual(p1: Plane, p2: Plane): boolean {
    return Math.abs(1 - p1.normal.dot(p2.normal)) < 0.00001 && Math.abs(p1.constant - p2.constant) < 0.00001
}
