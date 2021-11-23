import { Box3, Euler, Matrix4, Quaternion, Vector3 } from "three"

const matrixHelper = new Matrix4()
const vectorHelper = new Vector3()
const vector2Helper = new Vector3()
const vector3Helper = new Vector3()
const eulerHelper = new Euler()

/*export function distanceToInstance(from: Vector3, to: Instance): number {
  let size =
    to.type === "2D" ? sizeHelper.set(to.size.x, 0, to.size.y) : to.size;
  centerHelper.copy(size);
  centerHelper.divideScalar(2);
  box3Helper.setFromCenterAndSize(centerHelper, size);
  matrixHelper.copy(to.matrix).invert();
  vectorHelper.copy(from);
  vectorHelper.applyMatrix4(matrixHelper);
  return box3Helper.distanceToPoint(vectorHelper);
}*/

export function computeDirectionMatrix(
    normalizedXAxis: Vector3,
    normalizedYAxis: Vector3,
    matrix = matrixHelper
): Matrix4 {
    vectorHelper.crossVectors(normalizedXAxis, normalizedYAxis)
    return matrix.makeBasis(normalizedXAxis, normalizedYAxis, vectorHelper)
}

export function makeTranslationMatrix(x: number, y: number, z: number, matrix = matrixHelper): Matrix4 {
    return matrix.makeTranslation(x, y, z)
}

export function makeRotationMatrix(x: number, y: number, z: number, matrix = matrixHelper): Matrix4 {
    return matrix.makeRotationFromEuler(eulerHelper.set(x, y, z))
}

export function makeScaleMatrix(x: number, y: number, z: number, matrix = matrixHelper): Matrix4 {
    return matrix.makeScale(x, y, z)
}

export function makeQuanterionMatrix(quaternion: Quaternion, matrix = matrixHelper): Matrix4 {
    return matrix.makeRotationFromQuaternion(quaternion)
}

/**
 * @returns undefined if the triangle's normal can't be calculated
 */
export function computeNormalVector3(
    p1: Vector3,
    p2: Vector3,
    p3: Vector3,
    target: Vector3 = vectorHelper
): Vector3 | undefined {
    vector2Helper.copy(p2).sub(p1).normalize()
    vector3Helper.copy(p3).sub(p1).normalize()
    if (Math.abs(vector2Helper.dot(vector3Helper) - 1) < 0.0001) {
        return undefined
    }
    vectorHelper.crossVectors(vector2Helper, vector3Helper)
    return target
}
