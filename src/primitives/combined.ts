import { Matrix4, Object3D, Mesh, Vector3, BufferGeometry, Box3 } from "three"
import { Primitive, setupObject3D } from "."
import { mergeBufferGeometries } from "three/examples/jsm/utils/BufferGeometryUtils"

const box3Helper = new Box3()
const helperVector = new Vector3()

export class CombinedPrimitive extends Primitive {
    constructor(public readonly matrix: Matrix4, private readonly primitives: Array<Primitive>) {
        super()
    }

    /*extrude(matrix: Matrix4): Primitive {
        return new CombinedPrimitive(
            this.matrix.clone(),
            this.primitives.map((primitive) => primitive.extrude(by))
        )
    }*/

    components(type: "points" | "lines" | "faces"): Primitive[] {
        const results = this.primitives.map((primitive) => primitive.components(type)).reduce((v1, v2) => v1.concat(v2))
        results.forEach((p) => p.matrix.premultiply(this.matrix))
        return results
    }

    toObject3D(): Object3D {
        return setupObject3D(new Mesh(this.getGeometry(false)), this.matrix)
    }

    getGeometrySize(target: Vector3): void {
        box3Helper.makeEmpty()
        this.primitives.forEach((primitive) => {
            primitive.getGeometrySize(helperVector)
            helperVector.applyMatrix4(primitive.matrix)
            box3Helper.expandByPoint(helperVector)
        })
        box3Helper.getSize(target)
    }

    clone(): Primitive {
        return new CombinedPrimitive(
            this.matrix.clone(),
            this.primitives.map((primitive) => primitive.clone())
        )
    }

    protected computeGeometry(): BufferGeometry | undefined {
        const disposableBuffers = this.primitives
            .map((primitive) => primitive.getGeometry(true)?.applyMatrix4(primitive.matrix))
            .filter(filterNull)
        const result = mergeBufferGeometries(disposableBuffers)!
        disposableBuffers.forEach((buffer) => buffer.dispose())
        return result
    }
}

function filterNull<T>(val: T | null | undefined): val is T {
    return val != null
}
