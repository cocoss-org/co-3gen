import { Matrix4, Object3D, BufferGeometry, Vector3 } from "three"
import { Primitive, setupObject3D } from "."
import { mergeBufferGeometries } from "three/examples/jsm/utils/BufferGeometryUtils"

export class CombinedPrimitive extends Primitive {
    constructor(public readonly matrix: Matrix4, private readonly primitives: Array<Primitive>) {
        super()
    }

    get pointAmount(): number {
        return this.primitives.reduce((prev, p) => prev + p.pointAmount, 0)
    }

    getPoint(index: number, target: Vector3): void {
        let offset = 0
        for (let i = 0; i < this.primitives.length; i++) {
            const amount = this.primitives[i].pointAmount
            if (offset <= index && index < offset + amount) {
                this.primitives[i].getPoint(index - offset, target)
                target.applyMatrix4(this.matrix)
                return
            }
            offset += amount
        }
        throw `out of index ${index} when using "getPoint"`
    }

    boolean(operation: "union" | "intersect" | "difference", _3d: boolean): Primitive {
        throw new Error("Method not implemented.")
    }

    componentArray(type: number): Array<Primitive> {
        let results = this.primitives
            .map((primitive) => primitive["componentArray"](type))
            .reduce((v1, v2) => v1.concat(v2))
        results.forEach((p) => p.matrix.premultiply(this.matrix))
        return results
    }

    toObject3D(): Object3D {
        const object3d = setupObject3D(new Object3D(), this.matrix)
        this.primitives.forEach((primitive) => object3d.add(primitive.toObject3D()))
        return object3d
    }

    /*    getGeometrySize(target: Vector3): void {
        box3Helper.makeEmpty()
        this.primitives.forEach((primitive) => {
            primitive.getGeometrySize(helperVector)
            helperVector.applyMatrix4(primitive.matrix)
            box3Helper.expandByPoint(helperVector)
        })
        box3Helper.getSize(target)
    }*/

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
        if (disposableBuffers.length === 0) {
            return undefined
        }
        const result = mergeBufferGeometries(disposableBuffers)!
        disposableBuffers.forEach((buffer) => buffer.dispose())
        return result
    }
}

function filterNull<T>(val: T | null | undefined): val is T {
    return val != null
}
