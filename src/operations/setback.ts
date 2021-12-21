import { Euler, Line, Matrix4, Quaternion, Vector3 } from "three"
import { CombinedPrimitive, ComponentType, connect, connectAll, LinePrimitive, Primitive } from ".."

const DEFAULT_QUATERNION = new Quaternion().setFromEuler(new Euler(0, 0, 0))

//TODO: by per edge
export function setback(primitive: Primitive, by: number) {
    const polygons = groupInPolygons(primitive["componentArray"](ComponentType.Line))
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

function setbackPolygon(polygon: Array<Primitive>, by: number): Array<Primitive> {
    let innerPoints: Array<Vector3> = []
    const outerPoints: Array<Vector3> = []

    let innerDistance = 0
    let outerDistance = 0

    for (let i = 0; i < polygon.length; i++) {
        polygon[i].getPoint(0, prevHelper)
        polygon[i].getPoint(1, currentHelper)
        polygon[(i + 1) % polygon.length].getPoint(1, nextHelper)
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

    if (innerDistance > outerDistance == by >= 0) {
        innerPoints = outerPoints
    }

    return innerPoints.map((_, i) => {
        return connect(
            polygon[i],
            LinePrimitive.fromPoints(
                new Matrix4(),
                innerPoints[(i - 1 + innerPoints.length) % innerPoints.length],
                innerPoints[i]
            ),
            connectAll,
            by < 0
        )
    })
}

export function groupInPolygons(lines: Array<Primitive>, keepUnclosed: boolean = false): Array<Array<Primitive>> {
    const linesCopy = [...lines]
    const result: Array<Array<Primitive>> = []
    let i = 0
    while (linesCopy.length > 0) {
        if (result[i] == null) {
            result[i] = [linesCopy[0]]
            linesCopy.splice(0, 1)
        }

        const nextLineIndex = linesCopy.findIndex((line) => isNextLine(last(result[i]), line))

        if (nextLineIndex === -1) {
            if (keepUnclosed) {
                i++
            } else {
                result.splice(i, 1)
            }
            continue
        }

        const nextLine = linesCopy[nextLineIndex]
        linesCopy.splice(nextLineIndex, 1)

        result[i].push(nextLine)

        if (isNextLine(last(result[i]), result[i][0])) {
            i++
        }
    }
    if (result[i] != null && !keepUnclosed) {
        result.splice(i, 1)
    }
    return result
}

function last<T>(array: Array<T>): T {
    return array[array.length - 1]
}

const vectorHelper1 = new Vector3()
const vectorHelper2 = new Vector3()

function isNextLine(p1: Primitive, p2: Primitive) {
    p1.getPoint(1, vectorHelper1)
    p2.getPoint(0, vectorHelper2)
    return vectorHelper1.distanceTo(vectorHelper2) < 0.001
}
