import { BufferGeometry, Vector3 } from "three"
import { Primitive } from "../primitives"

const vectorHelper = new Vector3()
const sizeHelper = new Vector3()

/*export function Replace(primitive: Primitive, geometry: BufferGeometry): Primitive {
    geometry.computeBoundingBox()
    geometry.boundingBox!.getSize(vectorHelper)
    primitive.getGeometrySize(sizeHelper)
    return new GeometryPrimitive(
        primitive.matrix.clone(),
        geometry.scale(sizeHelper.x / vectorHelper.x, sizeHelper.y / vectorHelper.y, sizeHelper.z / vectorHelper.z)
    )
}*/
