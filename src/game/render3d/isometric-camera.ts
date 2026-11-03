import { Box3, OrthographicCamera, Vector3 } from 'three';

/** Base 3/4 overview; navigation applies bounded ground-plane translation and zoom. */
export function fitIsometricCamera(camera: OrthographicCamera, bounds: Box3, aspect: number, azimuth = 0) {
  const center = bounds.getCenter(new Vector3());
  if(!Number.isFinite(azimuth))throw new RangeError('Invalid camera azimuth');
  const offset=new Vector3(14,13,16).applyAxisAngle(new Vector3(0,1,0),azimuth);
  camera.position.copy(center).add(offset);
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
  return {halfWidth:halfHeight*aspect,halfHeight,originX:center.x-offset.x*center.y/offset.y,originZ:center.z-offset.z*center.y/offset.y};
}
