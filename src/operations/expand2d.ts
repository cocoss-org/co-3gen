import { Euler, Matrix4, Quaternion, Vector3 } from "three"
import { connect, connectAll } from "."
import { CombinedPrimitive, ComponentType, LinePrimitive, Primitive } from ".."

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
                //TODO: crossings
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

const point2Helper = new Vector3()
const point3Helper = new Vector3()

const quaternionHelper = new Quaternion()
const DEFAULT_QUATERNION = new Quaternion().setFromEuler(new Euler(0, 0, 0))
const _90_DEG_QUATERNION = new Quaternion().setFromEuler(new Euler(0, -Math.PI / 2, 0))

function getPoint(
    line: Primitive,
    getNextPoint: (v1: Vector3, exclude: Vector3, target: Vector3) => boolean,
    prev: boolean,
    by: number,
    target: Vector3
): void {
    line.getPoint(prev ? 1 : 0, target)
    line.getPoint(prev ? 0 : 1, point2Helper)

    const hasNext = getNextPoint(point2Helper, target, point3Helper)

    target.sub(point2Helper)

    if (hasNext) {
        point3Helper.sub(point2Helper)
        target.normalize()
        point3Helper.normalize()
        quaternionHelper.setFromUnitVectors(target, point3Helper)
        quaternionHelper.slerp(DEFAULT_QUATERNION, 0.5)
    } else {
        quaternionHelper.copy(_90_DEG_QUATERNION)
    }
    const angle = quaternionHelper.angleTo(DEFAULT_QUATERNION)
    const distance = by / Math.sin(angle)

    target.applyQuaternion(quaternionHelper)
    target.multiplyScalar(distance)
    target.add(point2Helper)
}

const lookupVector = new Vector3()
const endPoint = new Vector3()

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
                getPoint(line, getNextPoint, true, by, lookupVector)
                getPoint(line, getNextPoint, false, by, endPoint)
                return connect(line, LinePrimitive.fromPoints(new Matrix4(), lookupVector, endPoint), connectAll)
            })
    )
}
