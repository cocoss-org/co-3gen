import { Matrix4, BufferGeometry, Object3D, Vector3 } from "three"
import { CombinedPrimitive } from "."

export const YAXIS = new Vector3(0, 1, 0)
export const ZERO = new Vector3(0, 0, 0)
const helperMatrix = new Matrix4()

export function setupObject3D(object: Object3D, matrix: Matrix4): Object3D {
    object.matrixAutoUpdate = false
    object.matrix = matrix
    return object
}

export type PrimitiveConnectSelect = (
    primitive: Primitive,
    primitiveIndex: number,
    option: Primitive,
    optionIndex: number
) => boolean

export const ComponentType = {
    Face: 0b100,
    Line: 0b010,
    Point: 0b001,
}

export function hasComponentType(type: number, componentType: number): boolean {
    return (type & componentType) === componentType
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

    components(type: number, select?: (primtive: Primitive) => boolean): Primitive {
        let primitives = this.componentArray(type)
        if (select != null) {
            primitives = primitives.filter(select)
        }
        helperMatrix.copy(this.matrix)
        helperMatrix.invert()
        primitives.forEach((primitive) => primitive.matrix.premultiply(helperMatrix))
        return new CombinedPrimitive(this.matrix.clone(), primitives)
    }

    //abstract applyMatrixToGeometry(matrix: Matrix4): void;

    abstract get pointAmount(): number
    abstract getPoint(index: number, target: Vector3): void

    protected abstract componentArray(type?: number): Array<Primitive>
    abstract boolean(operation: "union" | "intersect" | "difference", _3d: boolean): Primitive
    abstract toObject3D(): Object3D
    abstract clone(): Primitive
    protected abstract computeGeometry(): BufferGeometry | undefined
}
