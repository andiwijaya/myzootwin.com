import assert from 'node:assert/strict';
import test from 'node:test';
import { Matrix4, Raycaster, Vector3 } from 'three';
import { createTropicalSurroundings } from '../src/game/render3d/tropical-surroundings.ts';
import { sceneOrigin } from '../src/game/world/scene-coordinates.ts';

test('meadow covers the zoo interior when a habitat mask hides the playable terrain', () => {
  const map = { width: 24, height: 26, gate: { x: 0, z: 12 } };
  const origin = sceneOrigin(map);
  const surroundings = createTropicalSurroundings(map);
  try {
    surroundings.group.updateMatrixWorld(true);
    const ground = surroundings.group.getObjectByName('Meadow and forested ridges');
    const ray = new Raycaster(new Vector3(), new Vector3(0, -1, 0));
    for (const x of [-.01, .01, 6, 12, 18, 23.99, 24.01]) {
      for (const z of [-.01, .01, 9, 17, 25.99, 26.01]) {
        ray.ray.origin.set(x - origin.x, 2, z - origin.z);
        const [hit] = ray.intersectObject(ground, false);
        assert.ok(hit && hit.point.y >= 0 && hit.point.y < .022, `Meadow gap at ${x}×${z}`);
      }
    }
  } finally {
    surroundings.dispose();
  }
});

test('forest trunks touch the rendered terrain on both starter and expanded maps', () => {
  const maps = [
    { width: 12, height: 12, gate: { x: 0, z: 6 } },
    { width: 24, height: 26, gate: { x: 0, z: 12 } },
  ];
  const down = new Vector3(0, -1, 0);
  const ray = new Raycaster();
  const matrix = new Matrix4();
  for (const map of maps) {
    const surroundings = createTropicalSurroundings(map);
    try {
      surroundings.group.updateMatrixWorld(true);
      const ground = surroundings.group.getObjectByName('Meadow and forested ridges');
      const trunks = surroundings.group.getObjectByName('Forest trunks');
      assert.ok(trunks.count > 50);
      for (let index = 0; index < trunks.count; index++) {
        trunks.getMatrixAt(index, matrix);
        const base = new Vector3(0, -.5, 0).applyMatrix4(matrix);
        ray.set(new Vector3(base.x, 30, base.z), down);
        const [contact] = ray.intersectObject(ground, false);
        assert.ok(contact && base.y <= contact.point.y + .005, `Floating tree ${index} on ${map.width}×${map.height}`);
      }
    } finally {
      surroundings.dispose();
    }
  }
});
