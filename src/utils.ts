import { BufferAttribute, BufferGeometry, InterleavedBufferAttribute, Shape, Triangle, Vector3 } from "three"

export function getTrianglesFromGeometry(bufferGeometry: BufferGeometry): Array<Triangle> {
    const index = bufferGeometry.getIndex()
    const position = bufferGeometry.getAttribute("position")
    let toTriangle = (
        index != null ? getTriangleFromIndexGeometry.bind(null, index) : getTriangleFromUnindexGeometry
    ).bind(null, position)
    return new Array((index?.count ?? position.count) / 3).fill(null).map((_, i) => toTriangle(i * 3))
}

function getTriangleFromIndexGeometry(
    index: BufferAttribute,
    position: BufferAttribute | InterleavedBufferAttribute,
    i: number
): Triangle {
    return new Triangle(
        getVector3FromBuffer(position, index.getX(i)),
        getVector3FromBuffer(position, index.getX(i + 1)),
        getVector3FromBuffer(position, index.getX(i + 2))
    )
}
function getTriangleFromUnindexGeometry(position: BufferAttribute | InterleavedBufferAttribute, i: number): Triangle {
    return new Triangle(
        getVector3FromBuffer(position, i),
        getVector3FromBuffer(position, i + 1),
        getVector3FromBuffer(position, i + 2)
    )
}

function getVector3FromBuffer(position: BufferAttribute | InterleavedBufferAttribute, i: number): Vector3 {
    return new Vector3(position.getX(i), position.getY(i), position.getZ(i))
}
