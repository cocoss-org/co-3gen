import { Matrix4, Vector3 } from "three"
import { makeTranslationMatrix } from ".."
import { Primitive } from "../primitives"

export enum Axis {
    X,
    Y,
    Z,
}

const axisKey: { [axis in Axis]: "x" | "y" | "z" } = {
    [Axis.X]: "x",
    [Axis.Y]: "y",
    [Axis.Z]: "z",
}

function getValueOnAxis(vector: Vector3, axis: Axis): number {
    return vector[axisKey[axis]]
}

function setValueOnAxis(vector: Vector3, axis: Axis, value: number): void {
    vector[axisKey[axis]] = value
}

const restSize = new Vector3()
const moveVector = new Vector3()
const vectorHelper = new Vector3()

export function Split(
    primitive: Primitive,
    axis: Axis,
    generatePrimitive: (matrix: Matrix4, index: number, x: number, y: number, z: number) => Primitive
): Array<Primitive> {
    primitive.getGeometrySize(restSize)
    let i = 0
    const generatedPrimitives: Array<Primitive> = []
    moveVector.set(0, 0, 0)
    while (getValueOnAxis(restSize, axis) > 0) {
        const matrix = primitive.matrix.clone()
        matrix.multiply(makeTranslationMatrix(moveVector.x, moveVector.y, moveVector.z))
        const generatedPrimitive = generatePrimitive(matrix, i, restSize.x, restSize.y, restSize.z)
        generatedPrimitive.getGeometrySize(vectorHelper)
        generatedPrimitives.push(generatedPrimitive)
        i++
        const primtiveSizeOnAxis = getValueOnAxis(vectorHelper, axis)
        setValueOnAxis(restSize, axis, getValueOnAxis(restSize, axis) - primtiveSizeOnAxis)
        setValueOnAxis(moveVector, axis, getValueOnAxis(moveVector, axis) + primtiveSizeOnAxis)
    }
    return generatedPrimitives
}
