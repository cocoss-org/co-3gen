import {
    FacePrimitive,
    getTrianglesFromGeometry,
    CombinedPrimitive,
    ComponentType,
    makeTranslationMatrix,
    connect,
    makeRotationMatrix,
    Primitive,
} from "co-3gen"
import { BoxBufferGeometry, BufferGeometry, Matrix4, Plane, Shape, Vector2, Vector3 } from "three"

const geometry = new BoxBufferGeometry()

const triangles = getTrianglesFromGeometry(geometry)

const planeHelper = new Plane()
/*export const faces = new CombinedPrimitive(
    new Matrix4(),
    triangles.map((triangle) => {
        triangle.getPlane(planeHelper)
        return FacePrimitive.fromPointsOnPlane(new Matrix4(), planeHelper, [triangle.a, triangle.b, triangle.c])
    })
).components(ComponentType.Line)*/

let previous = new FacePrimitive(
    new Matrix4(),
    new Shape([new Vector2(-0.5, 0.5), new Vector2(0.5, 0.5), new Vector2(0.5, -0.5), new Vector2(-0.5, -0.5)])
).components(ComponentType.Line)

const results: Array<Primitive> = []

for(let i = 0; i < 10; i++) {
    const current = previous.clone().applyMatrix(makeTranslationMatrix(0, 1, 0)).applyMatrix(makeRotationMatrix(0, Math.PI / 8, 0))
    results.push(connect(previous, current))
    previous = current
}

export const faces = new CombinedPrimitive(new Matrix4(), results).components(ComponentType.Line)
