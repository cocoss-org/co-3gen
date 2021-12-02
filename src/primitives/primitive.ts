import { Matrix4, BufferGeometry, Object3D, Vector3 } from "three"
import { CombinedPrimitive } from "."
import { CSG } from "three-csg-ts"
import { primitives, utils, geometries } from "@jscad/modeling"

export type Polygon = geometries.geom2.Geom2

export const YAXIS = new Vector3(0, 1, 0)
export const ZERO = new Vector3(0, 0, 0)
const helperMatrix = new Matrix4()

export function setupObject3D(object: Object3D, matrix: Matrix4): Object3D {
    object.matrixAutoUpdate = false
    object.matrix = matrix
    return object
}

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
    private polygonsCache: Array<[Polygon, Matrix4]> | null = null
    private csgCache: CSG | null | undefined = null

    applyMatrix(matrix: Matrix4): Primitive {
        this.matrix.multiply(matrix)
        this.geometryCache = null
        this.csgCache = null
        return this
    }

    /**
     * @returns global geometry (matrix is applied)
     */
    getGeometry(clone: boolean): BufferGeometry | undefined {
        if (this.geometryCache === null) {
            this.geometryCache = this.computeGeometry()
            this.geometryCache?.applyMatrix4(this.matrix)
        }
        return clone ? this.geometryCache?.clone() : this.geometryCache
    }

    /**
     * @returns local polygoin (matrix is NOT applied)
     */
    getPolygons(): Array<[Polygon, Matrix4]> {
        if (this.polygonsCache === null) {
            this.polygonsCache = this.computePolygons()
        }
        return this.polygonsCache
    }

    /**
     * @returns global CSG (matrix is applied)
     */
    getCSG(clone: boolean): CSG | undefined {
        if (this.csgCache === null) {
            const geometry = this.getGeometry(false)
            this.csgCache = geometry == null ? undefined : CSG.fromGeometry(geometry)
        }
        return clone ? this.csgCache?.clone() : this.csgCache
    }

    dispose(): void {
        this.geometryCache?.dispose()
        this.geometryCache = null
        this.csgCache = null
        this.polygonsCache = null
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

    setMatrix(matrix: Matrix4): Primitive {
        return new CombinedPrimitive(matrix, this.componentArray(0b111))
    }

    //abstract applyMatrixToGeometry(matrix: Matrix4): void;

    abstract get pointAmount(): number

    /**
     * @param target global point of the primitive
     */
    abstract getPoint(index: number, target: Vector3): void

    protected abstract componentArray(type: number): Array<Primitive>
    abstract toObject3D(): Object3D
    abstract clone(): Primitive
    protected abstract computeGeometry(): BufferGeometry | undefined
    protected abstract computePolygons(): Array<[Polygon, Matrix4]>
}
