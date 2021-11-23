import { Matrix4, Vector3, Object3D, Line, BufferGeometry } from "three"
import { PointPrimitive, Primitive, setupObject3D, YAXIS } from "."
import { computeDirectionMatrix, makeTranslationMatrix } from "../math"

console.log(PointPrimitive)

const helperVector = new Vector3()

/**
 * line in x direction
 */
export class LinePrimitive extends Primitive {
    constructor(public readonly matrix: Matrix4, private readonly length: number) {
        super()
    }

    static fromPoints(matrix: Matrix4, p1: Vector3, p2: Vector3): LinePrimitive {
        matrix.multiply(makeTranslationMatrix(p1.x, p1.y, p1.z))
        helperVector.copy(p2).sub(p1)
        const length = helperVector.length()
        matrix.multiply(computeDirectionMatrix(helperVector.divideScalar(length), YAXIS))
        return new LinePrimitive(matrix, length)
    }

    getGeometrySize(target: Vector3): void {
        target.set(0, this.length, 0)
    }

    clone(): Primitive {
        return new LinePrimitive(this.matrix.clone(), this.length)
    }

    /*extrude(extruder: (vec3: Vector3) => void): Primitive {
        return FacePrimitive.fromPoints()
    }*/

    components(type: "points" | "lines" | "faces"): Primitive[] {
        switch (type) {
            case "faces":
                return []
            case "lines":
                return [this.clone()]
            case "points":
                const end = new PointPrimitive(this.matrix.clone())
                end.applyMatrix(makeTranslationMatrix(0, this.length, 0))
                return [new PointPrimitive(this.matrix.clone()), end]
        }
    }

    toObject3D(): Object3D {
        return setupObject3D(
            new Line(new BufferGeometry().setFromPoints([new Vector3(), new Vector3(0, this.length, 0)])),
            this.matrix
        )
    }

    protected computeGeometry(): BufferGeometry | undefined {
        return undefined
    }
}
