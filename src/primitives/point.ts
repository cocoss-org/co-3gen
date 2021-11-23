import { Matrix4, Vector3, Object3D, Points, BufferGeometry, PointsMaterial } from "three"
import { ComponentType, hasComponentType, Primitive, setupObject3D } from "."

export class PointPrimitive extends Primitive {
    constructor(public readonly matrix: Matrix4) {
        super()
    }

    get pointAmount(): number {
        return 1
    }

    getPoint(index: number, target: Vector3): void {
        if (index === 0) {
            target.setFromMatrixPosition(this.matrix)
        } else {
            throw `out of index ${index} when using "getPoint"`
        }
    }

    /*getGeometrySize(target: Vector3): void {
        target.set(0, 0, 0)
    }*/

    protected componentArray(type: number): Primitive[] {
        if (hasComponentType(type, ComponentType.Point)) {
            return [this.clone()]
        } else {
            return []
        }
    }

    boolean(operation: "union" | "intersect" | "difference", _3d: boolean): Primitive {
        throw new Error("Method not implemented.")
    }

    toObject3D(): Object3D {
        return setupObject3D(
            new Points(
                new BufferGeometry().setFromPoints([new Vector3()]),
                new PointsMaterial({
                    color: 0xff0000,
                    size: 0.2,
                })
            ),
            this.matrix
        )
    }

    clone(): Primitive {
        return new PointPrimitive(this.matrix.clone())
    }

    protected computeGeometry(): BufferGeometry | undefined {
        return undefined
    }
}
