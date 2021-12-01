import { Matrix4 } from "three"
import { CSG } from "three-csg-ts"
import { Primitive, CombinedPrimitive } from ".."

const helperMatrix = new Matrix4()

export function boolean3d(operation: "union" | "intersect" | "subtract", p1: Primitive, p2: Primitive): Primitive {
    const p1Geometry = p1.getGeometry(false)
    const p2Geometry = p2.getGeometry(false)
    if (p1Geometry == null || p2Geometry == null) {
        return new CombinedPrimitive(new Matrix4(), [p1, p2])
    }
    const ownCSG = CSG.fromGeometry(p1Geometry)
    const foreignCSG = CSG.fromGeometry(p2Geometry)
    const resultCSG = ownCSG[operation](foreignCSG)
    return CombinedPrimitive.fromGeometry(new Matrix4(), resultCSG.toGeometry(new Matrix4()))
}
