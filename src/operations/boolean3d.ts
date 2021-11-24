import { Matrix4 } from "three"
import { CSG } from "three-csg-ts"
import { Primitive, CombinedPrimitive } from ".."

const helperMatrix = new Matrix4()

export function boolean3d(operation: "union" | "intersect" | "subtract", p1: Primitive, p2: Primitive): Primitive {
    const p1Geometry = p1.getGeometry(false)
    const p2Geometry = p2.getGeometry(false)
    if (p1Geometry == null || p2Geometry == null) {
        throw `unable to execute 3d "${operation}" because of missing geometry`
    }
    const ownCSG = CSG.fromGeometry(p1Geometry)
    const foreignCSG = CSG.fromGeometry(p2Geometry)
    const resultCSG = ownCSG[operation](foreignCSG)
    return CombinedPrimitive.fromGeometry(p1.matrix.clone(), resultCSG.toGeometry(p1.matrix))
}
