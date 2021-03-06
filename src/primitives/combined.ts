import { Matrix4, Object3D, BufferGeometry, Vector3, Plane } from "three"
import { FacePrimitive, Polygon, Primitive, setupObject3D } from "."
import { mergeBufferGeometries, mergeVertices } from "three/examples/jsm/utils/BufferGeometryUtils"
import { filterNull, getTrianglesFromGeometry } from ".."
import { boolean2d } from "../operations/boolean2d"

const helperPlane = new Plane()
const helperMatrix = new Matrix4()

export class CombinedPrimitive extends Primitive {
    constructor(public readonly matrix: Matrix4, private readonly primitives: Array<Primitive>) {
        super()
    }

    get pointAmount(): number {
        return this.primitives.reduce((prev, p) => prev + p.pointAmount, 0)
    }

    static fromGeometry(matrix: Matrix4, geometry: BufferGeometry): Primitive {
        const triangles = getTrianglesFromGeometry(geometry)
        if (triangles.length === 0) {
            return new CombinedPrimitive(matrix, [])
        }
        return boolean2d(
            "union",
            ...(triangles.map((triangle) => {
                helperPlane.setFromCoplanarPoints(triangle.a, triangle.b, triangle.c)
                return FacePrimitive.fromPointsOnPlane(matrix.clone(), helperPlane, [
                    triangle.a,
                    triangle.b,
                    triangle.c,
                ])
            }) as [Primitive])
        )
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
        throw new Error(`out of index ${index} when using "getPoint"`)
    }

    componentArray(type: number): Array<Primitive> {
        const results = this.primitives
            .map((primitive) => primitive["componentArray"](type))
            .reduce((v1, v2) => v1.concat(v2), [])
        results.forEach((p) => p.matrix.premultiply(this.matrix))
        return results
    }

    computeObject3D(): Object3D {
        const object3d = setupObject3D(new Object3D(), this.matrix)
        this.primitives.forEach((primitive) => object3d.add(primitive.getObject3D(true)))
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
        const disposableBuffers = this.primitives.map((primitive) => primitive.getGeometry(false)).filter(filterNull)
        if (disposableBuffers.length === 0) {
            return undefined
        }
        const merged = mergeBufferGeometries(disposableBuffers)!
        const result = mergeVertices(merged, 0.001)
        merged.dispose()
        return result
    }

    protected computePolygons(): Array<[Polygon, Matrix4]> {
        return this.primitives
            .map((primitive) =>
                primitive
                    .getPolygons()
                    .map<[Polygon, Matrix4]>(([polygon, matrix]) => [polygon, matrix.clone().premultiply(this.matrix)])
            )
            .reduce((v1, v2) => v1.concat(v2), [])
    }
}
