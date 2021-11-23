import { Matrix4, Vector3, Object3D, Points, BufferGeometry } from "three"
import { Primitive, setupObject3D, ZERO } from "."
import { LinePrimitive } from "./line"

const vectorHelper = new Vector3()

export class PointPrimitive extends Primitive {
    constructor(public readonly matrix: Matrix4) {
        super()
    }

    getGeometrySize(target: Vector3): void {
        target.set(0, 0, 0)
    }

    extrude(extruder: (vec3: Vector3) => void): Primitive {
        extruder(vectorHelper.set(0, 0, 0))
        return LinePrimitive.fromPoints(this.matrix.clone(), ZERO, vectorHelper)
    }

    components(type: "points" | "lines" | "faces"): Primitive[] {
        if (type === "points") {
            return [this.clone()]
        } else {
            return []
        }
    }
    toObject3D(): Object3D {
        return setupObject3D(new Points(new BufferGeometry().setFromPoints([new Vector3()])), this.matrix)
    }

    clone(): Primitive {
        return new PointPrimitive(this.matrix.clone())
    }

    protected computeGeometry(): BufferGeometry | undefined {
        return undefined
    }
}
