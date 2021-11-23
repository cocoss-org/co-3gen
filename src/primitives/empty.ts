import { Matrix4, Vector3, Object3D, BufferGeometry } from "three"
import { Primitive, setupObject3D } from "."

export class EmptyPrimitive extends Primitive {
    constructor(public matrix: Matrix4, public readonly size: Vector3) {
        super()
    }

    /*extrude(extruder: (vec3: Vector3) => void): Primitive {
        const resultSize = this.size.clone()
        resultSize.y += by
        return new EmptyPrimitive(this.matrix.clone(), resultSize)
    }*/

    components(type: "points" | "lines" | "faces"): Primitive[] {
        return []
    }
    toObject3D(): Object3D {
        return setupObject3D(new Object3D(), this.matrix)
    }

    getGeometrySize(target: Vector3): void {
        target.copy(this.size)
    }

    clone(): Primitive {
        return new EmptyPrimitive(this.matrix.clone(), this.size.clone())
    }

    computeGeometry(): BufferGeometry | undefined {
        return undefined
    }
}
