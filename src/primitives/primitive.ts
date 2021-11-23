import { Matrix4, BufferGeometry, Object3D, Vector3 } from "three"

export const YAXIS = new Vector3(0, 1, 0)
export const ZERO = new Vector3(0, 0, 0)

export function setupObject3D(object: Object3D, matrix: Matrix4): Object3D {
    object.matrixAutoUpdate = false
    object.matrix = matrix
    return object
}

export abstract class Primitive {
    public abstract readonly matrix: Matrix4

    private geometryCache: BufferGeometry | null | undefined = null

    applyMatrix(matrix: Matrix4): Primitive {
        this.matrix.multiply(matrix)
        return this
    }

    getGeometry(clone: boolean): BufferGeometry | undefined {
        if (this.geometryCache === null) {
            this.geometryCache = this.computeGeometry()
        }
        return clone ? this.geometryCache?.clone() : this.geometryCache
    }

    dispose(): void {
        this.geometryCache?.dispose()
    }

    //abstract applyMatrixToGeometry(matrix: Matrix4): void;

    //abstract extrude(extruder: (vec3: Vector3) => void): Primitive
    abstract components(type: "points" | "lines" | "faces"): Array<Primitive>
    abstract toObject3D(): Object3D
    abstract getGeometrySize(target: Vector3): void
    abstract clone(): Primitive
    protected abstract computeGeometry(): BufferGeometry | undefined
}
