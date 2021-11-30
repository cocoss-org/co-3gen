import { Euler, Matrix4, Quaternion, Vector3 } from "three"
import { connect, connectAll } from "."
import { CombinedPrimitive, ComponentType, filterNull, LinePrimitive, Primitive } from ".."

function createLineLookup(
    linePrimitives: Array<Primitive>
): (lookup: Vector3, exclude: Vector3, target: Vector3) => boolean {
    const lookup: Array<[Vector3, Array<Vector3>]> = []

    function insert(v1: Vector3, v2: Vector3) {
        let entry = lookup.find(([v]) => v.distanceTo(v1) < 0.001)
        if (entry == null) {
            entry = [v1, []]
            lookup.push(entry)
        }
        entry[1].push(v2)
    }

    function get(v1: Vector3, exclude: Vector3, target: Vector3): boolean {
        const entry = lookup.find(([v]) => v.distanceTo(v1) < 0.001)?.[1] ?? []
        for (const v of entry) {
            if (v.distanceTo(exclude) > 0.001) {
                target.copy(v)
                return true
            }
        }
        return false
    }

    linePrimitives.forEach((linePrimitive) => {
        const v1 = new Vector3()
        const v2 = new Vector3()
        linePrimitive.getPoint(0, v1)
        linePrimitive.getPoint(1, v2)
        insert(v1, v2)
        insert(v2, v1)
    })

    return get
}

const point3Helper = new Vector3()

const DEFAULT_QUATERNION = new Quaternion().setFromEuler(new Euler(0, 0, 0))
const _90_DEG_QUATERNION = new Quaternion().setFromEuler(new Euler(0, -Math.PI / 2, 0))

function getPointsAndQuaternion(
    getNextPoint: (v1: Vector3, exclude: Vector3, target: Vector3) => boolean,
    newPointTarget: Vector3,
    cornerTarget: Vector3,
    quaternionTarget: Quaternion
): boolean {
    const hasNext = getNextPoint(cornerTarget, newPointTarget, point3Helper)

    if (!hasNext) {
        return false
    }

    newPointTarget.sub(cornerTarget)

    point3Helper.sub(cornerTarget)
    newPointTarget.normalize()
    point3Helper.normalize()
    quaternionTarget.setFromUnitVectors(newPointTarget, point3Helper)

    return true
}

function calculatePoint(quaternion: Quaternion, newPointTarget: Vector3, corner: Vector3, by: number) {
    quaternion.slerp(DEFAULT_QUATERNION, 0.5)

    const angle = quaternion.angleTo(DEFAULT_QUATERNION)
    const distance = by / Math.sin(angle)

    newPointTarget.applyQuaternion(quaternion)
    newPointTarget.multiplyScalar(distance)
    newPointTarget.add(corner)
}

const startPoint = new Vector3()
const endPoint = new Vector3()

const startQuaternion = new Quaternion()
const endQuaternion = new Quaternion()

const point1Helper = new Vector3()
const point2Helper = new Vector3()

export function expand2d(primitive: Primitive, by: number): Primitive {
    const lines = primitive["componentArray"](ComponentType.Line)
    if (lines.length === 0) {
        return new CombinedPrimitive(new Matrix4(), [])
    }
    const getNextPoint = createLineLookup(lines)
    return new CombinedPrimitive(
        new Matrix4(),
        lines
            .filter((line) => line.pointAmount === 2)
            .map((line) => {
                //TODO invert when by < 0
                line.getPoint(0, point2Helper)
                line.getPoint(1, point1Helper)

                startPoint.copy(point1Helper)
                endPoint.copy(point2Helper)

                const hasPrev = getPointsAndQuaternion(getNextPoint, startPoint, point2Helper, startQuaternion)
                const hasNext = getPointsAndQuaternion(getNextPoint, endPoint, point1Helper, endQuaternion)

                if (!hasPrev && !hasNext) {
                    return undefined
                }

                if (!hasPrev) {
                    //TODO
                }

                if (!hasNext) {
                    //TODO
                }

                if (startPoint.dot(endPoint) < 0) {
                    endQuaternion.conjugate()
                }

                calculatePoint(startQuaternion, startPoint, point2Helper, by)
                calculatePoint(endQuaternion, endPoint, point1Helper, by)

                return connect(line, LinePrimitive.fromPoints(new Matrix4(), startPoint, endPoint), connectAll)
            })
            .filter(filterNull)
    )
}
