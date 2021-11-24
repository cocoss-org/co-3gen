import { Canvas } from "@react-three/fiber"
import { Primitive } from "co-3gen"
import dynamic from "next/dynamic"
import { BoxBufferGeometry, Matrix4 } from "three"
import { CSG } from "three-csg-ts"

const OrbitControls = dynamic(
    () => import("@react-three/drei/core/OrbitControls").then((s) => s.OrbitControls) as any,
    { ssr: false }
)



export default function Showcase({ primitive }: { primitive: Primitive }) {
    return (
        <Canvas style={{ minHeight: 500 }}>
            <OrbitControls />
            <gridHelper />
            <primitive object={primitive.toObject3D()} />
        </Canvas>
    )
}
