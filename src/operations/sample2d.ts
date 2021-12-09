import { Intersection, Matrix4, Object3D, Quaternion, Raycaster, Sphere, Vector3 } from "three"
import { CombinedPrimitive, makeQuanterionMatrix, makeTranslationMatrix, PointPrimitive, Primitive, YAXIS } from ".."

function getBoundingSphere(primitive: Primitive, target: Sphere): boolean {
    const pointAmount = primitive.pointAmount
    if (pointAmount <= 0) {
        return false
    }
    const points = new Array(pointAmount).fill(null).map((_, i) => {
        const p = new Vector3()
        primitive.getPoint(i, p)
        return p
    })
    target.setFromPoints(points)
    return true
}

const helperSphere = new Sphere()
const raycaster = new Raycaster()

const originHelper = new Vector3()
const directionHelper = new Vector3()
const TAU = Math.PI * 2

const helperVector = new Vector3()
const helperQuaternion = new Quaternion()

const MINIUS_Z = new Vector3(0, 0, -1)

export function sample2d(primitive: Primitive, maxTries: number = 1000): Primitive {
    if (!getBoundingSphere(primitive, helperSphere)) {
        return new CombinedPrimitive(primitive.matrix.clone(), [])
    }
    const hits: Intersection<Object3D<Event>>[] = []
    let tries = 0

    const object = primitive.getObject3D(false)

    while (hits.length === 0) {
        if (tries >= maxTries) {
            console.warn(`returned empty primitive after trying to sample from primitive ${maxTries} times`)
            return new CombinedPrimitive(primitive.matrix.clone(), [])
        }

        //from: https://github.com/pmndrs/maath/blob/main/packages/maath/src/random/index.ts
        const u = Math.random()
        const v = Math.random()

        const theta = Math.acos(2 * v - 1)
        const phi = TAU * u

        //point on sphere w. radius 1
        originHelper.set(Math.sin(theta) * Math.cos(phi), Math.sin(theta) * Math.sin(phi), Math.cos(theta))

        //vector from point on norm sphere to center (normed direction vector)
        directionHelper.copy(originHelper).multiplyScalar(-1)

        //point on helperSphere
        originHelper.multiplyScalar(raycaster.near + helperSphere.radius)
        originHelper.add(helperSphere.center)

        //from: https://github.com/pmndrs/maath/blob/main/packages/maath/src/random/index.ts
        //offset
        const r = helperSphere.radius * Math.sqrt(Math.random())
        const t = Math.random() * TAU

        helperQuaternion.setFromUnitVectors(MINIUS_Z, directionHelper)

        helperVector.set(Math.sin(t) * r, Math.cos(t) * r, 0)
        helperVector.applyQuaternion(helperQuaternion)
        originHelper.add(helperVector)

        raycaster.set(originHelper, directionHelper)

        raycaster.intersectObject(object, true, hits)
        tries++
    }
    const i = Math.floor(Math.random() * hits.length)
    const hit = hits[i]
    const matrix = makeTranslationMatrix(hit.point.x, hit.point.y, hit.point.z, new Matrix4())
    if (hit.face != null) {
        helperQuaternion.setFromUnitVectors(YAXIS, hit.face.normal)
        matrix.multiply(makeQuanterionMatrix(helperQuaternion))
    }
    return new PointPrimitive(matrix)
}
