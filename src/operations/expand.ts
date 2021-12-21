import expansions from "@jscad/modeling/src/operations/expansions"
import primitives from "@jscad/modeling/src/primitives"
import { Matrix4, Plane, Quaternion, Vector2Tuple, Vector3 } from "three"
import { boolean2d, groupInPolygons } from "."
import { ComponentType, FacePrimitive, LinePrimitive, planeToQuanternion, Primitive } from ".."

const quaternionHelper = new Quaternion()

export function expand(primitive: Primitive, plane: Plane, delta: number) {
    const lines = primitive["componentArray"](ComponentType.Line)

    const grouped = groupInPolygons(lines, true) as Array<Array<LinePrimitive>>

    planeToQuanternion(plane, quaternionHelper)
    quaternionHelper.invert()

    const faces = grouped.map((group) => expandConnectedLines(quaternionHelper, group, delta))
    return boolean2d("union", faces[0], ...faces.slice(1))
}

const vec3Helper = new Vector3()

function projectPoint(primitive: Primitive, index: number, quaternion: Quaternion): Vector2Tuple {
    primitive.getPoint(index, vec3Helper)
    vec3Helper.applyQuaternion(quaternion)
    return [vec3Helper.x, vec3Helper.z]
}

function expandConnectedLines(quaternion: Quaternion, lines: Array<LinePrimitive>, delta: number): Primitive {
    const points = [projectPoint(lines[0], 0, quaternion), ...lines.map((line) => projectPoint(line, 1, quaternion))]

    return FacePrimitive.fromPolygon(
        new Matrix4(),
        expansions.expand(
            {
                delta,
                corners: "round",
            },
            primitives.line(points)
        )
    )
}
