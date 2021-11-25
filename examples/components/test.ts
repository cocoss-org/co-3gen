import {
    FacePrimitive,
    getTrianglesFromGeometry,
    CombinedPrimitive,
    ComponentType,
    makeTranslationMatrix,
    connect,
    makeRotationMatrix,
    Primitive,
    boolean3d,
    makeScaleMatrix,
    boolean2d,
} from "co-3gen"
import { BoxBufferGeometry, Matrix4, Plane, Shape, Vector2 } from "three"

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

for (let i = 0; i < 10; i++) {
    const current = previous
        .clone()
        .applyMatrix(makeTranslationMatrix(0, 1, 0))
        .applyMatrix(makeRotationMatrix(0, 0.2, 0))
        .applyMatrix(makeScaleMatrix(0.9, 0.9, 0.9))
    results.push(connect(previous, current))
    previous = current
}

export const faces = new CombinedPrimitive(new Matrix4(), results) //.components(ComponentType.Line)

const x = CombinedPrimitive.fromGeometry(new Matrix4(), new BoxBufferGeometry())
//
const y = CombinedPrimitive.fromGeometry(new Matrix4(), new BoxBufferGeometry())
    .applyMatrix(makeScaleMatrix(1.2, 0.8, 1.2))
    .applyMatrix(makeRotationMatrix(0, Math.PI / 4, 0))

const k = boolean3d("subtract", x, y)

const h = boolean3d("union", k, k.clone().applyMatrix(makeTranslationMatrix(1, 0, 0)))

export const test2 = boolean3d("union", h, h.clone().applyMatrix(makeTranslationMatrix(0, 0, 1))) //.components(ComponentType.Line)

const outer = new FacePrimitive(
    new Matrix4(),
    new Shape([new Vector2(-1, 1), new Vector2(1, 1), new Vector2(1, -1), new Vector2(-1, -1)])
)

const inner = new FacePrimitive(
    new Matrix4(),
    new Shape([new Vector2(-0.5, 0.5), new Vector2(0.5, 0.5), new Vector2(0.5, -0.5), new Vector2(-0.5, -0.5)])
)

const bottom = boolean2d("difference", outer, inner)
const top = bottom.clone().applyMatrix(makeTranslationMatrix(0, 1, 0))

export const test3 = new CombinedPrimitive(new Matrix4(), [
    connect(bottom, top),
    top,
    bottom.applyMatrix(makeScaleMatrix(1, -1, 1)),
])//.components(ComponentType.Line)
