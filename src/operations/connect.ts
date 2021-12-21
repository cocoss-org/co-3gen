import { Matrix4, Plane, Vector3 } from "three"
import { Primitive, ComponentType, CombinedPrimitive, LinePrimitive, FacePrimitive, filterNull } from ".."
import { boolean2d } from "./boolean2d"

export type PrimitiveConnectSelect = (
    primitives: Array<Primitive>,
    options: Array<Primitive>
) => Array<[Primitive, Primitive]>

const matrixHelper = new Matrix4()
const planeHelper = new Plane()

function connectPoint(matrix: Matrix4, points: [Vector3, Vector3], invertFace: boolean): Primitive {
    if (invertFace) {
        points.reverse()
    }
    matrixHelper.copy(matrix).invert()
    points.forEach((p) => p.applyMatrix4(matrixHelper))
    return LinePrimitive.fromPoints(matrix.clone(), ...points)
}

function connectLine(matrix: Matrix4, points: [Vector3, Vector3, Vector3], invertFace: boolean): Primitive {
    if (invertFace) {
        points.reverse()
    }
    matrixHelper.copy(matrix).invert()
    points.forEach((p) => p.applyMatrix4(matrixHelper))
    planeHelper.setFromCoplanarPoints(...points)
    return FacePrimitive.fromPointsOnPlane(matrix.clone(), planeHelper, points)
}

const primitiveCenter = new Vector3()
const optionCenter = new Vector3()

export const connectNearest: PrimitiveConnectSelect = (primitives, options) => {
    return primitives
        .map<[Primitive, Primitive] | undefined>((primitive) => {
            if (!getCenter(primitive, primitiveCenter)) {
                return undefined
            }
            let nearest: Primitive | undefined = undefined
            let neatestDistance = Number.MAX_SAFE_INTEGER
            for (let i = 0; i < options.length; i++) {
                const dis = distance(options[i])
                if (dis == null) {
                    continue
                }
                if (dis < neatestDistance) {
                    nearest = options[i]
                    neatestDistance = dis
                }
            }
            if (nearest == null) {
                return
            }
            return [primitive, nearest]
        })
        .filter(filterNull)
}

function distance(option: Primitive): number | undefined {
    if (!getCenter(option, optionCenter)) {
        return undefined
    }
    return primitiveCenter.distanceTo(optionCenter)
}

const vectorHelper = new Vector3()

function getCenter(primitive: Primitive, target: Vector3): boolean {
    const pointAmount = primitive.pointAmount
    if (pointAmount <= 0) {
        return false
    }
    primitive.getPoint(0, target)
    for (let i = 1; i < pointAmount; i++) {
        primitive.getPoint(0, vectorHelper)
        target.add(vectorHelper)
    }
    target.divideScalar(pointAmount)
    return true
}

export const connectByIndex: PrimitiveConnectSelect = (primitives, options) => {
    return new Array(Math.min(primitives.length, options.length)).fill(null).map((_, i) => [primitives[i], options[i]])
}

export const connectAll: PrimitiveConnectSelect = (primitives, options) => {
    return primitives
        .map((primitive) => options.map<[Primitive, Primitive]>((option) => [primitive, option]))
        .reduce((v1, v2) => v1.concat(v2))
}

const vectors = new Array(4).fill(null).map(() => new Vector3())

export function connect(
    p1: Primitive,
    p2: Primitive,
    select: PrimitiveConnectSelect = connectNearest,
    invertFace = false
): Primitive {
    const foreignPrimitives = p2["componentArray"](ComponentType.Line | ComponentType.Point)
    const ownPrimitives = p1["componentArray"](ComponentType.Line | ComponentType.Point)

    const matches = select(ownPrimitives, foreignPrimitives).map(([ownPrimitive, foreignPrimitive]) => {
        const ownPointAmount = ownPrimitive.pointAmount
        const pointAmountSum = foreignPrimitive.pointAmount + ownPointAmount
        const getPoint = _getPoint.bind(null, ownPointAmount, ownPrimitive, foreignPrimitive)
        if (pointAmountSum === 2) {
            return connectPoint(ownPrimitive.matrix, [getPoint(0), getPoint(1)], invertFace)
        } else if (pointAmountSum === 3) {
            return connectLine(ownPrimitive.matrix, [getPoint(0), getPoint(1), getPoint(2)], invertFace)
        } else if (pointAmountSum === 4) {
            return boolean2d(
                "union",
                connectLine(ownPrimitive.matrix, [getPoint(0), getPoint(3), getPoint(2)], invertFace),
                connectLine(ownPrimitive.matrix, [getPoint(0), getPoint(1), getPoint(3)], invertFace)
            )
        } else {
            throw new Error(`can connect ${pointAmountSum} points`)
        }
    })

    matrixHelper.copy(p1.matrix)
    matrixHelper.invert()
    matches.forEach((primitive) => primitive.matrix.premultiply(matrixHelper))

    return new CombinedPrimitive(p1.matrix.clone(), matches)
}

function _getPoint(p1PointAmount: number, p1: Primitive, p2: Primitive, index: number): Vector3 {
    if (index >= p1PointAmount) {
        p2.getPoint(index - p1PointAmount, vectors[index])
    } else {
        p1.getPoint(index, vectors[index])
    }
    return vectors[index]
}
