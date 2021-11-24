import { Matrix4, Vector3, Object3D, Line, BufferGeometry, LineBasicMaterial } from "three"
import { CombinedPrimitive, ComponentType, hasComponentType, PointPrimitive, Primitive, setupObject3D, YAXIS } from "."
import { computeDirectionMatrix, makeTranslationMatrix } from "../math"
import { Polygon } from "polygon-clipping"

const helperVector = new Vector3()
const helperMatrix = new Matrix4()

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

    get pointAmount(): number {
        return 2
    }
    getPoint(index: number, target: Vector3): void {
        if (index === 0) {
            target.setFromMatrixPosition(this.matrix)
        } else if (index === 1) {
            helperMatrix.copy(this.matrix)
            helperMatrix.multiply(makeTranslationMatrix(this.length, 0, 0))
            target.setFromMatrixPosition(helperMatrix)
        } else {
            throw `out of index ${index} when using "getPoint"`
        }
    }

    /*getGeometrySize(target: Vector3): void {
        target.set(0, this.length, 0)
    }*/

    clone(): Primitive {
        return new LinePrimitive(this.matrix.clone(), this.length)
    }

    protected componentArray(type: number): Primitive[] {
        if (hasComponentType(type, ComponentType.Line)) {
            return [this.clone()]
        } else if (hasComponentType(type, ComponentType.Point)) {
            const end = new PointPrimitive(this.matrix.clone())
            end.applyMatrix(makeTranslationMatrix(this.length, 0, 0))
            return [new PointPrimitive(this.matrix.clone()), end]
        } else {
            return []
        }
    }

    toObject3D(): Object3D {
        return setupObject3D(
            new Line(
                new BufferGeometry().setFromPoints([new Vector3(), new Vector3(this.length, 0, 0)]),
                new LineBasicMaterial({
                    color: 0xff0000,
                })
            ),
            this.matrix
        )
    }

    protected computeGeometry(): BufferGeometry | undefined {
        return undefined
    }

    protected computePolygons(): Array<[Polygon, Matrix4]> {
        return []
    }
}
