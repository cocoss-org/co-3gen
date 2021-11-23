import { Matrix4 } from "three"
import { Primitive } from "../primitives"

export function Transform(primitive: Primitive, matrix: Matrix4, clone: boolean): Primitive {
    const result = clone ? primitive.clone() : primitive
    primitive.applyMatrix(matrix)
    return result
}
