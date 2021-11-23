import {
    Matrix4,
    Shape,
    Vector2,
    Vector3,
    BufferGeometry,
    ShapeBufferGeometry,
    Object3D,
    Mesh,
    Box3,
    Box2,
    Triangle,
    Quaternion,
} from "three"
import { LinePrimitive, PointPrimitive, Primitive, setupObject3D, YAXIS } from "."
import { makeQuanterionMatrix, makeTranslationMatrix } from "../math"

const boxHelper = new Box2()
const vec2Helper = new Vector2()
const helperVector = new Vector3()
const helper2Vector = new Vector3()
const quaternionHelper = new Quaternion()

/**
 * face in x, z axis
 */
export class FacePrimitive extends Primitive {
    constructor(public readonly matrix: Matrix4, private readonly shape: Shape) {
        super()
    }

    static fromPlanarTriangles(matrix: Matrix4, normal: Vector3, triangles: Array<Triangle>): Primitive {
        quaternionHelper.setFromUnitVectors(normal, YAXIS)
        const points = triangles
            .map((t) => [t.a, t.b, t.c])
            .reduce((v1, v2) => v1.concat(v2))
            .map((p) => {
                p.applyQuaternion(quaternionHelper)
                return new Vector2(p.x, p.z)
            })
        return new FacePrimitive(matrix.multiply(makeQuanterionMatrix(quaternionHelper.invert())), new Shape(points))
    }

    /*static fromLengthAndHeight(matrix: Matrix4, x: number, z: number, yUp: boolean = false): FacePrimitive {
        if (yUp) {
            matrix.multiply(helperMatrix.makeRotationX(-Math.PI / 2))
        }
        const points = [new Vector2(x, 0), new Vector2(x, z), new Vector2(0, z), new Vector2(0, 0)]
        const shape = new Shape(points)
        return new FacePrimitive(matrix, shape)
    }*/

    getGeometrySize(target: Vector3): void {
        boxHelper.setFromPoints(this.shape.getPoints()).getSize(vec2Helper)
        target.set(vec2Helper.x, 0, vec2Helper.y)
    }

    clone(): Primitive {
        return new FacePrimitive(this.matrix.clone(), this.shape.clone())
    }

    protected computeGeometry(): BufferGeometry | undefined {
        return new ShapeBufferGeometry(this.shape).rotateX(Math.PI / 2)
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

    components(type: "points" | "lines" | "faces"): Primitive[] {
        switch (type) {
            case "points":
                return this.shape
                    .extractPoints(5)
                    .shape.map(
                        (point) =>
                            new PointPrimitive(this.matrix.clone().multiply(makeTranslationMatrix(point.x, 0, point.y)))
                    )
            case "lines":
                const points = this.shape.extractPoints(5).shape
                return points.map((p1, i) => {
                    const p2 = points[(i + 1) % points.length]
                    return LinePrimitive.fromPoints(
                        this.matrix.clone(),
                        helperVector.set(p1.x, 0, p1.y),
                        helper2Vector.set(p2.x, 0, p2.y)
                    )
                })
            case "faces":
                return [this.clone()]
        }
    }

    toObject3D(): Object3D {
        return setupObject3D(new Mesh(this.getGeometry(false)), this.matrix)
    }
}

function trianglesToPrimitives(matrix: Matrix4, triangles: Array<Triangle>): Array<Primitive> {
    const subGroupes = triangles.reduce((prev, triangle) => {
        triangle.getNormal(helperVector)
        const group = prev.find((group) => Math.abs(group.normal.dot(helperVector)) < 0.001)
        if (group != null) {
            group.triangles.push(triangle)
            return prev
        } else {
            return [
                ...prev,
                {
                    normal: new Vector3().copy(helperVector),
                    triangles: [triangle],
                },
            ]
        }
    }, [] as Array<{ triangles: Array<Triangle>; normal: Vector3 }>)
    return subGroupes.map((group) => FacePrimitive.fromPlanarTriangles(matrix, group.normal, group.triangles))
}
