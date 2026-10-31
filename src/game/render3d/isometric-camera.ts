import { Box3, OrthographicCamera, Vector3 } from 'three';

/** Base 3/4 overview; navigation applies bounded ground-plane translation and zoom. */
export function fitIsometricCamera(camera: OrthographicCamera, bounds: Box3, aspect: number) {
  const center = bounds.getCenter(new Vector3());
  camera.position.copy(center).add(new Vector3(14, 13, 16));
  camera.lookAt(center);
  camera.updateMatrixWorld(true);
  let halfWidth = 0, halfHeight = 0;
  for (const x of [bounds.min.x, bounds.max.x]) for (const y of [bounds.min.y, bounds.max.y]) for (const z of [bounds.min.z, bounds.max.z]) {
    const point = new Vector3(x, y, z).applyMatrix4(camera.matrixWorldInverse);
    halfWidth = Math.max(halfWidth, Math.abs(point.x));
    halfHeight = Math.max(halfHeight, Math.abs(point.y));
  }
  halfHeight = Math.max(halfHeight, halfWidth / Math.max(.01, aspect)) * 1.09;
  camera.left = -halfHeight * aspect; camera.right = halfHeight * aspect;
  camera.top = halfHeight; camera.bottom = -halfHeight;
  camera.near = .1; camera.far = 100; camera.updateProjectionMatrix();
  return {halfWidth:halfHeight*aspect,halfHeight};
}
