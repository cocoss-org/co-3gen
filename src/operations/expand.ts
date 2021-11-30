import { ComponentType, Primitive } from "..";

export function expand(primitive: Primitive) {
    const lines = primitive["componentArray"](ComponentType.Line)

}