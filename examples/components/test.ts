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
    PointPrimitive,
    connectAll,
    sample2d,
    LinePrimitive,
    split,
    setback,
    splitAxis,
    Axis,
    splitAngle,
} from "co-3gen"
import {
    BoxBufferGeometry,
    Matrix4,
    Plane,
    PlaneBufferGeometry,
    Shape,
    SphereBufferGeometry,
    TorusBufferGeometry,
    Vector2,
    Vector3,
} from "three"
import { booleans, primitives, expansions } from "@jscad/modeling"

export const test0 = new FacePrimitive(
    new Matrix4(),
    new Shape([new Vector2(-1, 1), new Vector2(1, 1), new Vector2(2, -1), new Vector2(0, 0)])
) //.components(ComponentType.Line)

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

for (let i = 0; i < 100; i++) {
    const current = previous
        .clone()
        .applyMatrix(makeTranslationMatrix(0, 0.1, 0))
        .applyMatrix(makeRotationMatrix(0, (2.1 * Math.PI) / 4, 0))
        .applyMatrix(makeScaleMatrix(0.99, 0.99, 0.99))
    results.push(connect(previous, current))
    previous = current
}

export const test1 = new CombinedPrimitive(new Matrix4(), results) //.components(ComponentType.Line)

const x = CombinedPrimitive.fromGeometry(new Matrix4(), new BoxBufferGeometry())
//
const y = CombinedPrimitive.fromGeometry(new Matrix4(), new BoxBufferGeometry())
    //.applyMatrix(makeTranslationMatrix(1.3, 0, 0))
    .applyMatrix(makeScaleMatrix(1.2, 0.8, 1.2))
    .applyMatrix(makeRotationMatrix(0, Math.PI / 4, 0))

const k = boolean3d("subtract", x, y)

const h = boolean3d("union", k, k.clone().applyMatrix(makeTranslationMatrix(1, 0, 0)))

export const test2 = boolean3d("union", h, h.clone().applyMatrix(makeTranslationMatrix(0, 0, 1))).components(
    ComponentType.Line
)

const outer = new FacePrimitive(
    new Matrix4(),
    new Shape([new Vector2(-1, 1), new Vector2(1, 1), new Vector2(1, -1), new Vector2(-1, -1)])
)

const inner = new FacePrimitive(
    new Matrix4(),
    new Shape([new Vector2(-0.5, 0.5), new Vector2(0.5, 0.5), new Vector2(0.5, -0.5), new Vector2(-0.5, -0.5)])
)

const bottom = boolean2d("subtract", outer, inner)
const top = bottom.clone().applyMatrix(makeTranslationMatrix(0, 1, 0))

export const test3 = new CombinedPrimitive(new Matrix4(), [
    //bottom,
    connect(top, bottom),
    top,
    bottom.applyMatrix(makeScaleMatrix(1, -1, 1)),
]) //.components(ComponentType.Line)

const o = new FacePrimitive(
    new Matrix4(),
    new Shape([new Vector2(-1, 1), new Vector2(1, 1), new Vector2(1, -1), new Vector2(-1, -1)])
)

const j = new PointPrimitive(makeTranslationMatrix(0, 1, 0, new Matrix4()))

const f = new CombinedPrimitive(new Matrix4(), [
    connect(o, j, connectAll),
    o.clone().applyMatrix(makeScaleMatrix(-1, 1, 1)),
])

const p = new CombinedPrimitive(
    new Matrix4(),
    new Array(1000).fill(null).map(() => {
        const r = sample2d(f)
        return connect(r, r.clone().applyMatrix(makeTranslationMatrix(0, 0.3, 0)))
    })
)

export const test4 = p

const r = new FacePrimitive(
    new Matrix4(),
    new Shape([new Vector2(-2, 2), new Vector2(2, 2), new Vector2(10, -2), new Vector2(-0.5, -0.5)])
)

//r.applyMatrix(makeRotationMatrix(0, Math.PI / 4, 0))

const u = new CombinedPrimitive(new Matrix4(), [
    LinePrimitive.fromPoints(new Matrix4(), new Vector3(0, 1, 0), new Vector3(0, 0, 2)),
    LinePrimitive.fromPoints(new Matrix4(), new Vector3(0, 0, 2), new Vector3(2, 0, 2)),
    LinePrimitive.fromPoints(new Matrix4(), new Vector3(2, 0, 2), new Vector3(2, 0, 0)),
    LinePrimitive.fromPoints(new Matrix4(), new Vector3(2, 0, 0), new Vector3(0, 1, 0)),
])

/**
 * new CombinedPrimitive(new Matrix4(), [
    setback(u, -0.5), //.components(ComponentType.Line),
    setback(u, 0.5), //.components(ComponentType.Line),
])
 */

const stairAmount = 20

const stairHeight = 0.1

const zz = boolean2d("subtract", outer, inner)
const mm = zz.clone().applyMatrix(makeTranslationMatrix(0, stairHeight, 0))

const pp = CombinedPrimitive.fromGeometry(new Matrix4(), new BoxBufferGeometry(1, stairHeight, 1)).setMatrix(
    makeTranslationMatrix(0, stairHeight / 2, 0, new Matrix4())
)

const uu = CombinedPrimitive.fromGeometry(new Matrix4(), new BoxBufferGeometry(0.5, stairHeight, 0.5)).setMatrix(
    makeTranslationMatrix(0, stairHeight / 2, 0, new Matrix4())
)

const ff = CombinedPrimitive.fromGeometry(
    new Matrix4(),
    new BoxBufferGeometry(0.5, stairHeight * stairAmount, 0.5)
).setMatrix(makeTranslationMatrix(0, (stairHeight * stairAmount) / 2, 0, new Matrix4()))

let tt: Primitive = boolean3d("subtract", pp, uu)

const stair: Array<Primitive> = []

const angle = (Math.PI * 2) / stairAmount

for (let i = 0; i < stairAmount; i++) {
    const dd = splitAngle(tt, i * angle, (i + 1) * angle, new Vector3(), Axis.Y)
    dd[0].applyMatrix(makeTranslationMatrix(0, stairHeight * i, 0))
    stair.push(dd[0])
}

export const test5 = new CombinedPrimitive(new Matrix4(), [ff, ...stair]) //new CombinedPrimitive(new Matrix4(), stair)

export const test6 = boolean2d("intersect", FacePrimitive.fromPolygon(
    new Matrix4(),
    expansions.expand(
        {
            delta: 0.2,
            corners: "round",
        },
        primitives.line([
            [1, -1],
            [0, 0],
            [1, 1],
            [2, 1],
            [2, 2],
            [3, 4],
        ])
    )
), FacePrimitive.fromPolygon(
    new Matrix4(),
    expansions.expand(
        {
            delta: 0.2,
            corners: "round",
        },
        primitives.line([
            [1, 1],
            [-2, 3],
            [-2, 4],
            [-3, 4],
        ])
    )
))
