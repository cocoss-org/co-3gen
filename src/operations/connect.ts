import { Matrix4, Plane, Vector3 } from "three"
import { Primitive, PrimitiveConnectSelect, ComponentType, CombinedPrimitive, LinePrimitive, FacePrimitive } from ".."
import { boolean2d } from "./boolean2d"

const matrixHelper = new Matrix4()
const planeHelper = new Plane()

function connectPoint(matrix: Matrix4, points: [Vector3, Vector3]): Primitive {
    matrixHelper.copy(matrix).invert()
    points.forEach((p) => p.applyMatrix4(matrixHelper))
    return LinePrimitive.fromPoints(matrix.clone(), ...points)
}

function connectLine(matrix: Matrix4, points: [Vector3, Vector3, Vector3]): Primitive {
    matrixHelper.copy(matrix).invert()
    points.forEach((p) => p.applyMatrix4(matrixHelper))
    planeHelper.setFromCoplanarPoints(...points)
    return FacePrimitive.fromPointsOnPlane(matrix.clone(), planeHelper, points)
}

export function connectSelectDefault(
    primitive: Primitive,
    primitiveIndex: number,
    option: Primitive,
    optionIndex: number
): boolean {
    return primitiveIndex === optionIndex
}

//TODO: enable connect nearest by offering all input arrays to the selection algorithm

export function connectSelectAll(primitive: Primitive, primitiveIndex: number, option: Primitive, optionIndex: number) {
    return true
}

const vectors = new Array(4).fill(null).map(() => new Vector3())

export function connect(
    p1: Primitive,
    p2: Primitive,
    select: PrimitiveConnectSelect = connectSelectDefault
): Primitive {
    const foreignPrimitives = p2["componentArray"](ComponentType.Line | ComponentType.Point)
    const ownPrimitives = p1["componentArray"](ComponentType.Line | ComponentType.Point)

    const matches = ownPrimitives
        .map((ownPrimitive, ownPrimitiveIndex) =>
            foreignPrimitives
                .filter((foreignPrimitive, foreignPrimitivesIndex) =>
                    select(ownPrimitive, ownPrimitiveIndex, foreignPrimitive, foreignPrimitivesIndex)
                )
                .map((foreignPrimitive) => {
                    const ownPointAmount = ownPrimitive.pointAmount
                    const pointAmountSum = foreignPrimitive.pointAmount + ownPointAmount
                    const getPoint = _getPoint.bind(null, ownPointAmount, ownPrimitive, foreignPrimitive)
                    if (pointAmountSum === 2) {
                        return connectPoint(ownPrimitive.matrix, [getPoint(0), getPoint(1)])
                    } else if (pointAmountSum === 3) {
                        return connectLine(ownPrimitive.matrix, [getPoint(0), getPoint(1), getPoint(2)])
                    } else if (pointAmountSum === 4) {
                        return boolean2d(
                            "union",
                            connectLine(ownPrimitive.matrix, [getPoint(0), getPoint(3), getPoint(2)]),
                            connectLine(ownPrimitive.matrix, [getPoint(0), getPoint(1), getPoint(3)])
                        )
                    } else {
                        throw `can connect ${pointAmountSum} points`
                    }
                })
        )
        .reduce((v1, v2) => v1.concat(v2), [])

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
