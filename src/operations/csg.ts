/*export function CSGCombine(
  p1: Primitive,
  p2: Primitive,
  applyCSGOperation: (csg1: CSG, csg2: CSG) => CSG
): Primitive {
  matrixHelper.copy(p2.matrix).invert().premultiply(p1.matrix);
  const g1 = p1.getGeometry(false);
  const g2 = p2.getGeometry(true)?.applyMatrix4(matrixHelper);

  if (g1 == null || g2 == null) {
    throw "can't apply csg invert on primitives with no geometry";
  }

  const csg1 = CSG.fromGeometry(g1);
  const csg2 = CSG.fromGeometry(g2);

  //g2?.dispose();

  return new GeometryPrimitive(
    p1.matrix.clone(),
    applyCSGOperation(csg1, csg2).toGeometry(matrixHelper.identity())
  );
}

export function CSGInverse(primitive: Primitive): Primitive {
  const g = primitive.getGeometry(false);
  if (g == null) {
    throw "can't apply csg invert on primitive with no geometry";
  }
  return new GeometryPrimitive(
    primitive.matrix.clone(),
    CSG.fromGeometry(g).inverse().toGeometry(matrixHelper.identity())
  );
}*/