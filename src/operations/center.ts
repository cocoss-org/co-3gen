import { Vector3 } from "three"
import { makeTranslationMatrix } from ".."
import { Primitive, PointPrimitive } from "../primitives"

const vectorHelper = new Vector3()

export function CenterPoint(primtive: Primitive): Primitive {
    const result = new PointPrimitive(primtive.matrix)
    primtive.getGeometrySize(vectorHelper)
    vectorHelper.divideScalar(2)
    result.applyMatrix(makeTranslationMatrix(vectorHelper.x, vectorHelper.y, vectorHelper.z))
    return result
}
