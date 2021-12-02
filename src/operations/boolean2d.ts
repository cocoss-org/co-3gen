import { CombinedPrimitive, FacePrimitive, Polygon, Primitive } from ".."
import { Matrix4, Path, Plane, Shape, Vector2, Vector3 } from "three"
import { primitives, booleans } from "@jscad/modeling"
import type { Vec2 } from "@jscad/modeling/src/maths/vec2"

const helperPlane = new Plane()
const helperMatrix = new Matrix4()

export function boolean2d(operation: keyof typeof booleans, p1: Primitive, ...primitves: Array<Primitive>): Primitive {
    const ownPolygons = p1.getPolygons()
    const foreignPolygons = primitves.map((p) => p.getPolygons()).reduce((v1, v2) => v1.concat(v2), [])

    const ownGroups = group(ownPolygons)
    const foreignGroups = group(foreignPolygons)

    const results = ownGroups
        .map<[Polygon, Matrix4]>(([polygon, plane, matrix]) => {
            const matches = foreignGroups.filter(([_p, groupPlane], i) => {
                const match = planeIsEqual(plane, groupPlane)
                if (match) {
                    foreignGroups.splice(i, 1)
                }
                return match
            })
            if (matches.length === 0) {
                return [polygon, matrix]
            } else {
                return [booleans[operation](polygon, ...matches.map(([s]) => s)), matrix]
            }
        })
        .concat(foreignGroups.map<[Polygon, Matrix4]>(([segment, _, matrix]) => [segment, matrix]))

    helperMatrix.copy(p1.matrix).invert()
    return new CombinedPrimitive(
        p1.matrix.clone(),
        results
            .filter(([polygon]) => polygon.sides.length > 2)
            .map(([polygon, matrix]) => {
                const [points, ...holes] = getClosedPaths(polygon.sides)
                const shape = new Shape(points)
                shape.holes = holes.map((points) => new Path(points))
                return new FacePrimitive(matrix.clone().premultiply(helperMatrix), shape)
            })
    )
}

function getClosedPaths(sides: Array<[Vec2, Vec2]>): Array<Array<Vector2>> {
    const sidesCopy = [...sides]
    const closedPaths: Array<Array<Vector2>> = []
    let index = 0
    while (sidesCopy.length > 0) {
        if (closedPaths[index] == null) {
            closedPaths[index] = [new Vector2(...sidesCopy[0][0]), new Vector2(...sidesCopy[0][1])]
            sidesCopy.splice(0, 1)
        }

        const nextPointIndex = getNextPoint(last(closedPaths[index]), sidesCopy)

        if (nextPointIndex == null) {
            index++
            continue
        }

        const [next, i] = nextPointIndex
        sidesCopy.splice(i, 1)

        if (distance(closedPaths[index][0], next) < 0.001) {
            index++
        } else {
            closedPaths[index].push(new Vector2(...next))
        }
    }
    return closedPaths
}

function last<T>(array: Array<T>): T {
    return array[array.length - 1]
}

function getNextPoint(last: Vector2, edges: Array<[Vec2, Vec2]>): [Vec2, number] | undefined {
    for (let i = 0; i < edges.length; i++) {
        const [v1, v2] = edges[i]
        if (distance(last, v1) < 0.001) {
            return [v2, i]
        }
        if (distance(last, v2) < 0.001) {
            return [v1, i]
        }
    }
    return undefined
}

function distance(vec: Vector2, [x2, y2]: Vec2): number {
    const x = vec.x - x2
    const y = vec.y - y2
    return Math.sqrt(x * x + y * y)
}

const helperVector = new Vector3()

function group(group: Array<[Polygon, Matrix4]>): Array<[Polygon, Plane, Matrix4, Matrix4]> {
    return group.reduce<Array<[Polygon, Plane, Matrix4, Matrix4]>>((prev, [polygon, matrix]) => {
        helperPlane.normal.set(0, 1, 0) //because the face primitive lies in x,z plane
        helperPlane.constant = 0
        helperPlane.applyMatrix4(matrix)
        const group = prev.find(([_polygons, plane]) => planeIsEqual(plane, helperPlane))
        if (group != null) {
            if (polygon.sides.length <= 2) {
                return prev
            }
            const convertedPolygon: Polygon = primitives.polygon({
                points: polygon.sides.map(([[x, y]]) => {
                    helperVector.set(x, 0, y)
                    helperVector.applyMatrix4(matrix).applyMatrix4(group[3])
                    return [helperVector.x, helperVector.z] as Vec2
                }),
            })
            group[0] = booleans.union(group[0], convertedPolygon)
            return prev
        } else {
            return [...prev, [polygon, helperPlane.clone(), matrix, matrix.clone().invert()]]
        }
    }, [])
}

function planeIsEqual(p1: Plane, p2: Plane): boolean {
    return Math.abs(1 - p1.normal.dot(p2.normal)) < 0.001 && Math.abs(p1.constant - p2.constant) < 0.001
}
