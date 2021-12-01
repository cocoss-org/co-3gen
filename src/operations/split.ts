import { Euler, Matrix4, Plane, Sphere, Vector2, Vector3 } from "three"
import { boolean3d, connect, connectByIndex, getBoundingSphere } from "."
import { CombinedPrimitive, FacePrimitive, makeScaleMatrix, makeTranslationMatrix, Primitive, YAXIS } from ".."

const helperPlane = new Plane()

const vectorHelper = new Vector3()
const projectedPoint = new Vector3()

function getDepthAndRadius(
    primitive: Primitive,
    point: Vector3,
    normal: Vector3,
    radius: number | undefined
): [number, number] {
    helperPlane.setFromNormalAndCoplanarPoint(normal, point)
    let resultRadius = radius ?? 0
    let depth = 0
    const amount = primitive.pointAmount
    for (let i = 0; i < amount; i++) {
        primitive.getPoint(i, vectorHelper)
        const d = helperPlane.distanceToPoint(vectorHelper)
        if (d < 0) {
            helperPlane.projectPoint(vectorHelper, projectedPoint)
            const r = projectedPoint.distanceTo(point)
            if (radius == null || r < radius) {
                resultRadius = Math.max(resultRadius, r)
                if (d < depth) {
                    depth = d
                }
            }
        }
    }
    return [resultRadius, depth]
}

function _split(primitive: Primitive, point: Vector3, normal: Vector3, radius: number, depth: number) {
    if (depth >= 0) {
        return [primitive, new CombinedPrimitive(new Matrix4(), [])]
    }

    const points = [
        new Vector2(radius, radius),
        new Vector2(radius, -radius),
        new Vector2(-radius, -radius),
        new Vector2(-radius, radius),
    ]

    helperPlane.normal.copy(normal)

    helperPlane.constant = 0
    const firstPlane = FacePrimitive.fromPointsAndPlane(
        makeTranslationMatrix(point.x, point.y, point.z, new Matrix4()),
        helperPlane,
        points
    )

    helperPlane.constant = depth
    const secondPlane = FacePrimitive.fromPointsAndPlane(
        makeTranslationMatrix(point.x, point.y, point.z, new Matrix4()),
        helperPlane,
        points
    )

    firstPlane.applyMatrix(makeScaleMatrix(-1, 1, 1))
    secondPlane.applyMatrix(makeScaleMatrix(-1, 1, 1))

    const seperator = new CombinedPrimitive(new Matrix4(), [
        connect(secondPlane, firstPlane, connectByIndex),
        firstPlane.applyMatrix(makeScaleMatrix(-1, 1, 1)),
        secondPlane,
    ])

    //return [primitive, seperator]

    return [boolean3d("intersect", primitive, seperator), boolean3d("subtract", primitive, seperator)]
}

const sphere = new Sphere()

export function split(primitive: Primitive, point: Vector3, normal: Vector3, radius?: number) {
    const [resultRadius, depth] = getDepthAndRadius(primitive, point, normal, radius)
    return _split(primitive, point, normal, resultRadius, depth)
}

export enum Axis {
    X,
    Y,
    Z,
}

const normalHelper = new Vector3()
const pointHelper = new Vector3()

export function splitAxis(primitive: Primitive, by: number, axis: Axis, radius?: number) {
    getBoundingSphere(primitive, sphere)
    setAxis(axis, normalHelper)
    pointHelper.copy(normalHelper).multiplyScalar(sphere.radius)
    pointHelper.add(sphere.center)
    const [resultRadius, depth] = getDepthAndRadius(primitive, pointHelper, normalHelper, radius)
    pointHelper.copy(normalHelper).multiplyScalar(sphere.radius + depth + by)
    pointHelper.add(sphere.center)
    return _split(primitive, pointHelper, normalHelper, resultRadius, -by)
}

const eulerHelper = new Euler()

export function splitAngle(
    primitive: Primitive,
    from: number,
    to: number,
    point: Vector3,
    axis: Axis,
    radius?: number
) {
    setRotationAxis(axis, normalHelper)
    setEuler(from, axis, eulerHelper)
    normalHelper.applyEuler(eulerHelper)
    const [resultRadius1, depth1] = getDepthAndRadius(primitive, point, normalHelper, radius)
    const [outerFrom, innerFrom] = _split(primitive, point, normalHelper, resultRadius1, depth1)

    setRotationAxis(axis, normalHelper)
    setEuler(to, axis, eulerHelper)
    normalHelper.applyEuler(eulerHelper)
    const [resultRadius2, depth2] = getDepthAndRadius(primitive, point, normalHelper, radius)
    const [innerTo, outerTo] = _split(primitive, point, normalHelper, resultRadius2, depth2)
    return [boolean3d("intersect", innerFrom, innerTo), boolean3d("union", outerFrom, outerTo)]
}

function setRotationAxis(axis: Axis, vector: Vector3) {
    vector.set(0, 0, 0)
    switch (axis) {
        case Axis.X:
            vector.y = 1
            break
        case Axis.Y:
            vector.z = 1
            break
        case Axis.Z:
            vector.x = 1
            break
    }
}

function setAxis(axis: Axis, vector: Vector3) {
    vector.set(0, 0, 0)
    switch (axis) {
        case Axis.X:
            vector.x = 1
            break
        case Axis.Y:
            vector.y = 1
            break
        case Axis.Z:
            vector.z = 1
            break
    }
}

function setEuler(angle: number, axis: Axis, euler: Euler) {
    euler.set(0, 0, 0)
    switch (axis) {
        case Axis.X:
            euler.x = angle
            break
        case Axis.Y:
            euler.y = angle
            break
        case Axis.Z:
            euler.z = angle
            break
    }
}
