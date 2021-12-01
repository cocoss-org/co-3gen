import { Euler, Matrix4, Quaternion, Vector3 } from "three"
import { Primitive, ComponentType, CombinedPrimitive } from ".."

//TODO: by per edge
/*export function outline(primitive: Primitive, outlineRotations: Array<number>, by: number) {
    const lines = primitive["componentArray"](ComponentType.Line)
    const corners = computeCorners(lines)
    return new CombinedPrimitive(
        new Matrix4(),
        lines.reduce<Array<Primitive>>((prev, polygon) => prev.concat(outlinePolygon(polygon, by)), [])
    )
}

const eulerHelper = new Euler()
const matrixHelper = new Matrix4()
const transformationMatrixHelper = new Matrix4()

function outlineLine(
    line: Primitive,
    corners: Array<[Vector3, Array<Vector3>]>,
    outlineRotations: Array<number>,
    by: number
): Array<Primitive> {
    return outlineRotations.map((rotation) => {
        eulerHelper.set(rotation, 0, 0)

        matrixHelper.identity()
        matrixHelper.makeTranslation(0, 0, by)

        transformationMatrixHelper.makeRotationFromEuler(eulerHelper)
        matrixHelper.multiply(transformationMatrixHelper)
        
        matrixHelper.multiply(line.matrix)

        return null as any
    })
}

const vectorHelper1 = new Vector3()
const vectorHelper2 = new Vector3()

const directionHelper = new Vector3()

export function computeCorners(lines: Array<Primitive>): Array<[Vector3, Array<Vector3>]> {
    const result: Array<[Vector3, Array<Vector3>]> = []

    function insert(point1: Vector3, point2: Vector3) {
        directionHelper.copy(point2).sub(point1)
        directionHelper.normalize()

        let entry = result.find(([v]) => v.distanceTo(point1) < 0.001)

        if (entry == null) {
            entry = [point1.clone(), []]
            result.push(entry)
        }

        entry.push(directionHelper.clone())
    }

    lines.forEach((line) => {
        line.getPoint(0, vectorHelper1)
        line.getPoint(1, vectorHelper2)
        insert(vectorHelper1, vectorHelper2)
        insert(vectorHelper2, vectorHelper1)
    })

    return result
}*/
