import { Euler, Matrix4, Quaternion, Vector3 } from "three"
import { connect, connectAll, groupInPolygons } from "."
import { Primitive, ComponentType, CombinedPrimitive, LinePrimitive } from ".."

const DEFAULT_QUATERNION = new Quaternion().setFromEuler(new Euler(0, 0, 0))

//TODO: by per edge
export function outline(primitive: Primitive, by: number, invertFace: boolean = false) {
    const lines = primitive["componentArray"](ComponentType.Line)
    const polygons = groupInPolygons(lines)
    return new CombinedPrimitive(
        new Matrix4(),
        polygons.reduce<Array<Primitive>>((prev, polygon) => prev.concat(outlinePolygon(polygon, by, invertFace)), [])
    )
}

const prevHelper = new Vector3()
const currentHelper = new Vector3()
const nextHelper = new Vector3()

const quaternionHelper = new Quaternion()

const pointHelper1 = new Vector3()
const pointHelper2 = new Vector3()

const lineNormalHelper = new Vector3()
const poin1LineNormalHelper = new Vector3()

const prevInnerPoint = new Vector3()
const prevOuterPoint = new Vector3()

function outlinePolygon(polygon: Array<[Primitive, Vector3]>, by: number, invertFace: boolean): Array<Primitive> {
    const side1Points: Array<Vector3> = []
    const side2Points: Array<Vector3> = []

    for (let i = 0; i < polygon.length; i++) {
        prevHelper.copy(polygon[(i - 1 + polygon.length) % polygon.length][1])
        currentHelper.copy(polygon[i][1])
        nextHelper.copy(polygon[(i + 1) % polygon.length][1])
        prevHelper.sub(currentHelper)
        nextHelper.sub(currentHelper)

        prevHelper.normalize()
        nextHelper.normalize()

        lineNormalHelper.copy(prevHelper)

        quaternionHelper.setFromUnitVectors(prevHelper, nextHelper)
        quaternionHelper.slerp(DEFAULT_QUATERNION, 0.5)

        prevHelper.applyQuaternion(quaternionHelper)

        const angle = quaternionHelper.angleTo(DEFAULT_QUATERNION)
        const distance = by / 2 / Math.sin(angle)

        pointHelper1.copy(prevHelper)
        pointHelper2.copy(prevHelper)

        pointHelper1.multiplyScalar(distance)
        pointHelper1.add(currentHelper)

        pointHelper2.multiplyScalar(-distance)
        pointHelper2.add(currentHelper)

        poin1LineNormalHelper.copy(prevInnerPoint).sub(pointHelper1).normalize()

        const prevHelperInside = Math.abs(lineNormalHelper.dot(poin1LineNormalHelper) - 1) < 0.0001

        const innerPoint: Vector3 = prevHelperInside ? pointHelper1 : pointHelper2
        const outerPoint: Vector3 = prevHelperInside ? pointHelper2 : pointHelper1

        prevInnerPoint.copy(innerPoint)
        prevOuterPoint.copy(outerPoint)

        side1Points.push(innerPoint.clone())
        side2Points.push(outerPoint.clone())
    }

    return side1Points.map((_, i) => {
        return connect(
            LinePrimitive.fromPoints(new Matrix4(), side1Points[i], side1Points[(i + 1) % side1Points.length]),
            LinePrimitive.fromPoints(new Matrix4(), side2Points[i], side2Points[(i + 1) % side2Points.length]),
            connectAll,
            invertFace
        )
    })
}
