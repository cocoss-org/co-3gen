import { Euler, Matrix4, Plane, Sphere, Vector2, Vector3 } from "three"
import { boolean3d, connect, connectByIndex, getBoundingSphere } from "."
import { CombinedPrimitive, FacePrimitive, makeScaleMatrix, makeTranslationMatrix, Primitive, YAXIS } from ".."

const helperPlane = new Plane()
helperPlane.constant = 0

export function split(
    primitive: Primitive,
    basePoint: Vector3,
    baseNormal: Vector3,
    point: Vector3,
    normal: Vector3,
    radius: number
) {
    const points = [
        new Vector2(radius, radius),
        new Vector2(radius, -radius),
        new Vector2(-radius, -radius),
        new Vector2(-radius, radius),
    ]

    helperPlane.normal.copy(baseNormal)
    const firstPlane = FacePrimitive.fromPointsAndPlane(
        makeTranslationMatrix(basePoint.x, basePoint.y, basePoint.z, new Matrix4()),
        helperPlane,
        points
    )

    helperPlane.normal.copy(normal)
    const secondPlane = FacePrimitive.fromPointsAndPlane(
        makeTranslationMatrix(point.x, point.y, point.z, new Matrix4()),
        helperPlane,
        points
    )

    const seperator = new CombinedPrimitive(new Matrix4(), [
        //connect(firstPlane, secondPlane, connectByIndex),
        firstPlane,//.applyMatrix(makeScaleMatrix(-1, 1, 1)),
        secondPlane,
    ])

    return seperator

    return [boolean3d("intersect", primitive, seperator), boolean3d("subtract", primitive, seperator)]
}

export enum Axis {
    X,
    Y,
    Z,
}

export function splitAxis(primitive: Primitive, by: number, axis: Axis) {}

const vectorHelper = new Vector3()

const basePoint = new Vector3()
const baseNormal = new Vector3()
const point = new Vector3()
const normal = new Vector3()

const fromEuler = new Euler()
const toEuler = new Euler()

export function splitAngle(primitive: Primitive, from: number, to: number, position: Vector3, axis: Axis) {
    let radius = 0
    const amount = primitive.pointAmount
    for (let i = 0; i < amount; i++) {
        primitive.getPoint(i, vectorHelper)
        const d = position.distanceTo(vectorHelper)
        if (d > radius) {
            radius = d
        }
    }

    setEuler(from, axis, fromEuler)
    setAxis(axis, baseNormal)
    baseNormal.applyEuler(fromEuler)

    setEuler(to, axis, toEuler)
    setAxis(axis, normal)
    normal.applyEuler(toEuler)

    basePoint.copy(baseNormal).multiplyScalar(radius)
    basePoint.add(position)
    point.copy(normal).multiplyScalar(radius)
    position.add(position)

    return split(primitive, basePoint, baseNormal, point, normal, radius / 2)
}

function setAxis(axis: Axis, vector: Vector3) {
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
