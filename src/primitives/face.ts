import {
    Matrix4,
    Shape,
    Vector2,
    Vector3,
    BufferGeometry,
    ShapeBufferGeometry,
    Object3D,
    Mesh,
    Quaternion,
    MeshBasicMaterial,
    Plane,
    DoubleSide,
} from "three"
import {
    CombinedPrimitive,
    ComponentType,
    hasComponentType,
    LinePrimitive,
    PointPrimitive,
    Primitive,
    setupObject3D,
    YAXIS,
} from "."
import { makeQuanterionMatrix, makeTranslationMatrix } from "../math"
import { Polygon, Pair } from "polygon-clipping"
import { getTrianglesFromGeometry } from ".."

const helperVector = new Vector3()
const helper2Vector = new Vector3()
const quaternionHelper = new Quaternion()

/**
 * face in x, z axis
 */
export class FacePrimitive extends Primitive {
    private points = this.shape.getPoints(5)

    //TODO: holes

    constructor(public readonly matrix: Matrix4, private readonly shape: Shape) {
        super()
    }

    get pointAmount(): number {
        return this.points.length
    }

    getPoint(index: number, target: Vector3): void {
        const p = this.points[index]
        if (p == null) {
            throw `out of index ${index} when using "getPoint"`
        }
        target.set(p.x, 0, p.y)
        target.applyMatrix4(this.matrix)
    }

    static fromPointsOnPlane(matrix: Matrix4, plane: Plane, points: Array<Vector3>): Primitive {
        quaternionHelper.setFromUnitVectors(plane.normal, YAXIS)
        const shape = new Shape(
            points.map((point) => {
                const p = point.clone().applyQuaternion(quaternionHelper)
                return new Vector2(p.x, p.z)
            })
        )
        return new FacePrimitive(
            matrix
                .multiply(makeQuanterionMatrix(quaternionHelper.invert()))
                .multiply(makeTranslationMatrix(0, -plane.constant, 0)),
            shape
        )
    }

    /*static fromLengthAndHeight(matrix: Matrix4, x: number, z: number, yUp: boolean = false): FacePrimitive {
        if (yUp) {
            matrix.multiply(helperMatrix.makeRotationX(-Math.PI / 2))
        }
        const points = [new Vector2(x, 0), new Vector2(x, z), new Vector2(0, z), new Vector2(0, 0)]
        const shape = new Shape(points)
        return new FacePrimitive(matrix, shape)
    }*/

    /*getGeometrySize(target: Vector3): void {
        boxHelper.setFromPoints(this.shape.getPoints()).getSize(vec2Helper)
        target.set(vec2Helper.x, 0, vec2Helper.y)
    }*/

    clone(): Primitive {
        return new FacePrimitive(this.matrix.clone(), this.shape.clone())
    }

    protected computeGeometry(): BufferGeometry | undefined {
        const geometry = new ShapeBufferGeometry(this.shape)
        let temp: number
        for (let i = 0; i < geometry.index!.count; i += 3) {
            // swap the first and third values
            temp = geometry.index!.getX(i)
            geometry.index!.setX(i, geometry.index!.getX(i + 2))
            geometry.index!.setX(i + 2, temp)
        }
        geometry.rotateX(Math.PI / 2)
        return geometry
    }

    protected computePolygons(): Array<[Polygon, Matrix4]> {
        return [[[this.points.map<Pair>((p) => [p.x, p.y])], this.matrix]]
    }

    /*extrude(extruder: (vec3: Vector3) => void): Primitive {
        invertMatrix.copy(this.matrix).invert()
        const points = this.shape.extractPoints(5).shape
        return new CombinedPrimitive(this.matrix.clone(), [
            bottom,
            ...points.map((p1, i) => {
                const p2 = points[(i + 1) % points.length]
                helperVector.set(p2.x - p1.x, 0, p2.y - p1.y)
                const length = helperVector.length()
                const matrix = makeTranslationMatrix(p1.x, 0, p1.y, new Matrix4())
                matrix.multiply(computeDirectionMatrix(helperVector.normalize(), YAXIS))
                return FacePrimitive.fromLengthAndHeight(matrix, length, by, true)
            }),
            top,
        ])
    }*/

    protected componentArray(type: number): Array<Primitive> {
        if (hasComponentType(type, ComponentType.Face)) {
            return [this.clone()]
        } else if (hasComponentType(type, ComponentType.Line)) {
            const points = this.shape.extractPoints(5).shape
            return points.map((p1, i) => {
                const p2 = points[(i + 1) % points.length]
                return LinePrimitive.fromPoints(
                    this.matrix.clone(),
                    helperVector.set(p1.x, 0, p1.y),
                    helper2Vector.set(p2.x, 0, p2.y)
                )
            })
        } else if (hasComponentType(type, ComponentType.Point)) {
            return this.shape
                .extractPoints(5)
                .shape.map(
                    (point) =>
                        new PointPrimitive(this.matrix.clone().multiply(makeTranslationMatrix(point.x, 0, point.y)))
                )
        } else {
            return []
        }
    }

    toObject3D(): Object3D {
        return setupObject3D(
            new Mesh(
                this.getGeometry(false),
                new MeshBasicMaterial({
                    color: 0xff0000
                })
            ),
            new Matrix4()
        )
    }
}
