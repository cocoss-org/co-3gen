import { Box3, Sphere, Vector3 } from "three"
import { Primitive } from ".."

export function getBoundingSphere(primitive: Primitive, sphere: Sphere) {
    sphere.setFromPoints(
        new Array(primitive.pointAmount).fill(null).map((_, i) => {
            const vector = new Vector3()
            primitive.getPoint(i, vector)
            return vector
        })
    )
}

export function getBoundingBox(primitive: Primitive, box: Box3) {
    box.setFromPoints(
        new Array(primitive.pointAmount).fill(null).map((_, i) => {
            const vector = new Vector3()
            primitive.getPoint(i, vector)
            return vector
        })
    )
}
