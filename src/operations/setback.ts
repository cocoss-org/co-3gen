import { Euler, Line, Matrix4, Quaternion, Vector3 } from "three"
import { CombinedPrimitive, ComponentType, connect, LinePrimitive, Primitive } from ".."

const DEFAULT_QUATERNION = new Quaternion().setFromEuler(new Euler(0, 0, 0))

//todo: by per edge
export function setback(primitive: Primitive, by: number) {
    const lines = primitive["componentArray"](ComponentType.Line)
    const polygons = groupInPolygons(lines)
    return new CombinedPrimitive(
        new Matrix4(),
        polygons.reduce<Array<Primitive>>((prev, polygon) => prev.concat(setbackPolygon(polygon, by)), [])
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

function setbackPolygon(polygon: Array<[Primitive, Vector3]>, by: number): Array<Primitive> {
    let innerPoints: Array<Vector3> = []
    const outerPoints: Array<Vector3> = []

    let innerDistance = 0
    let outerDistance = 0

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
        const distance = by / Math.sin(angle)

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

        outerDistance += prevOuterPoint.distanceTo(outerPoint)
        innerDistance += prevInnerPoint.distanceTo(innerPoint)

        prevInnerPoint.copy(innerPoint)
        prevOuterPoint.copy(outerPoint)

        innerPoints.push(innerPoint.clone())
        outerPoints.push(outerPoint.clone())
    }

    if (innerDistance > outerDistance) {
        innerPoints = outerPoints
    }

    return innerPoints.map((_, i) => {
        //TODO: invert when by < 0
        currentHelper.copy(innerPoints[i])
        nextHelper.copy(innerPoints[(i + 1) % innerPoints.length])
        return connect(polygon[i][0], LinePrimitive.fromPoints(new Matrix4(), currentHelper, nextHelper))
    })
}

const vectorHelper = new Vector3()

function groupInPolygons(lines: Array<Primitive>): Array<Array<[Primitive, Vector3]>> {
    const result: Array<Array<[Primitive, Vector3]>> = []
    let ends: Array<Vector3>
    let i = 0
    lines.forEach((line) => {
        if (result[i] == null) {
            result[i] = []
            ends = []
        }

        line.getPoint(0, vectorHelper)
        result[i].push([line, vectorHelper.clone()])

        line.getPoint(1, vectorHelper)
        ends.push(vectorHelper.clone())

        if (isClosed(result[i], ends)) {
            i++
        }
    })
    if (result[i] != null) {
        throw `unable to setback unclosed polygons`
    }
    return result
}

function isClosed(starts: Array<[Primitive, Vector3]>, ends: Array<Vector3>): boolean {
    if (ends.length != starts.length) {
        return false
    }
    for (let i = 0; i < ends.length; i++) {
        if (ends.find((v) => v.distanceTo(starts[i][1]) < 0.001) == null) {
            return false
        }
    }
    return true
}
