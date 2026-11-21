import {
  BufferGeometry, Color, CylinderGeometry, Float32BufferAttribute, Group, IcosahedronGeometry,
  InstancedMesh, Mesh, MeshLambertMaterial, Object3D,
} from 'three';
import type { Point } from '../core/state.ts';
import { sceneOrigin, type MapSize } from '../world/scene-coordinates.ts';

const grass = new Color('#8cae6b');
const meadow = new Color('#749951');
const forest = new Color('#4f7f62');
const haze = new Color('#bccdc3');
const linear = (from: number, to: number, fraction: number) => from + (to - from) * fraction;
const unit = (value: number) => Math.min(1, Math.max(0, value));
const smooth = (value: number) => { const t = unit(value); return t * t * (3 - 2 * t); };

function surface(positions: number[], colors: number[], indices: number[]) {
  const geometry = new BufferGeometry();
  geometry.setAttribute('position', new Float32BufferAttribute(positions, 3));
  geometry.setAttribute('color', new Float32BufferAttribute(colors, 3));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  return geometry;
}

function ribbon(points: Point[], width: number, height: number, color: Color) {
  const positions: number[] = [], colors: number[] = [], indices: number[] = [];
  for (const [index, point] of points.entries()) {
    const previous = points[Math.max(0, index - 1)]!, next = points[Math.min(points.length - 1, index + 1)]!;
    const dx = next.x - previous.x, dz = next.z - previous.z, length = Math.hypot(dx, dz);
    for (const side of [-1, 1]) {
      positions.push(point.x - side * dz * width / length, height, point.z + side * dx * width / length);
      colors.push(color.r, color.g, color.b);
    }
    const start = index * 2;
    if (index) indices.push(start - 2, start - 1, start, start, start - 1, start + 1);
  }
  return surface(positions, colors, indices);
}

/** Render-only scenery. The world grid, navigation bounds and picking catalog keep their original extent. */
export function createTropicalSurroundings(map: MapSize & { gate: Point }) {
  const group = new Group();
  group.name = 'Tropical Creek surroundings';
  const origin = sceneOrigin(map);
  const left = -origin.x, right = map.width - origin.x, north = -origin.z, south = map.height - origin.z;
  const centerX = (left + right) / 2, centerZ = (north + south) / 2;
  const material = new MeshLambertMaterial({ vertexColors: true });
  const positions: number[] = [], colors: number[] = [], indices: number[] = [];
  const segments = 16;
  const rim = Array.from({length: segments * 4}, (_, index) => {
    const fraction = (index % segments) / segments;
    if (index < segments) return { x: linear(left, right, fraction), z: north };
    if (index < segments * 2) return { x: right, z: linear(north, south, fraction) };
    if (index < segments * 3) return { x: linear(right, left, fraction), z: south };
    return { x: left, z: linear(south, north, fraction) };
  });

  function contour(point: Point, distance: number) {
    const x = point.x - centerX, z = point.z - centerZ, radius = Math.hypot(x, z);
    const angle = Math.atan2(z, x);
    const ridge = .52 + .26 * Math.cos(angle * 3 + .8) + .22 * Math.sin(angle * 7 - .5);
    const roll = Math.sin(angle * 6 + distance * .33) * .65 + Math.cos(angle * 11 - distance * .49) * .35;
    const height = .018 - .065 * smooth(distance / 4) +
      smooth((distance - 8) / 12) * (.65 + ridge * 2.9 + roll * .8) +
      smooth((distance - 19) / 23) * (2.1 + ridge * 5.8);
    return { x: point.x + x / radius * distance, z: point.z + z / radius * distance, height, roll };
  }

  for (const [ring, distance] of [0, 1.2, 3, 6, 10, 15, 23, 34, 48, 70].entries()) {
    for (const [index, edge] of rim.entries()) {
      const point = contour(edge, distance);
      positions.push(point.x, point.height, point.z);
      const variation = Math.sin(point.x * .48 + point.z * .37) * .08;
      const tint = grass.clone().lerp(meadow, smooth(distance / 6) * (.68 + .26 * point.roll + variation));
      tint.lerp(forest, smooth((distance - 5) / 16) * (.65 + .25 * point.roll));
      tint.lerp(haze, smooth((distance - 19) / 29) * .74);
      colors.push(tint.r, tint.g, tint.b);
      if (ring) {
        const start = (ring - 1) * rim.length, next = (index + 1) % rim.length;
        indices.push(start + index, start + next, start + index + rim.length,
          start + next, start + next + rim.length, start + index + rim.length);
      }
    }
  }
  const ground = new Mesh(surface(positions, colors, indices), material);
  ground.name = 'Meadow and forested ridges';
  group.add(ground);

  const channel = Array.from({length: 27}, (_, index) => {
    const progress = index / 26;
    return { x: linear(left - 9, right + 9, progress),
      z: north - 3.4 - 1.2 * Math.cos(progress * Math.PI * 3) - .7 * Math.sin(progress * Math.PI * 5) };
  });
  const gateZ = map.gate.z + .5 - origin.z;
  const trail = Array.from({length: 11}, (_, index) => ({
    x: left - index * .65,
    z: gateZ + Math.sin(index * .14) * 1.25,
  }));
  const bank = new Mesh(ribbon(channel, .73, .028, new Color('#b5bc8d')), material);
  const creek = new Mesh(ribbon(channel, .57, .032, new Color('#609e94')), material);
  const water = new Mesh(ribbon(channel, .33, .034, new Color('#43898b')), material);
  const entry = new Mesh(ribbon(trail, .36, .026, new Color('#cbb589')), material);
  bank.name = 'Far creek bank';
  creek.name = 'Far creek shallows';
  water.name = 'Far creek current';
  entry.name = 'Trail toward the sanctuary';
  group.add(bank, creek, water, entry);

  const trees = rim.flatMap((edge, index) => [0, 1].flatMap(row => {
    const distance = row ? 13.5 + (index * 19 % 29) * .48 : 3.6 + (index * 17 % 19) * .48;
    const split = rim[(index + 1) % rim.length]!;
    const treeRim = row ? {x: linear(edge.x, split.x, .46), z: linear(edge.z, split.z, .46)} : edge;
    const point = contour(treeRim, distance);
    const acrossCreek = point.z < north && point.z > north - 6.7;
    const atEntrance = point.x < left && Math.abs(point.z - gateZ) < 2.3;
    if (acrossCreek || atEntrance || index % 11 === 7) return [];
    return [{ ...point, groundHeight: point.height, base: index % 2 === row,
      height: 1.1 + (index * 13 % 17) * .1, distant: row > 0 }];
  })).sort((a, b) => Number(b.base) - Number(a.base));
  const common = trees.filter(tree => tree.base).length;
  const trunkGeometry = new CylinderGeometry(.047, .086, 1, 5);
  const crownGeometry = new IcosahedronGeometry(1, 0);
  const treeMaterial = new MeshLambertMaterial();
  const trunks = new InstancedMesh(trunkGeometry, treeMaterial, trees.length);
  const crowns = new InstancedMesh(crownGeometry, treeMaterial, trees.length * 2);
  trunks.name = 'Forest trunks';
  crowns.name = 'Forest canopy';
  const transform = new Object3D();
  const wood = new Color('#7f6b4e');
  const foliage = ['#507e51', '#608c58', '#628c50', '#3f7957'].map(tint => new Color(tint));
  for (const [index, tree] of trees.entries()) {
    transform.position.set(tree.x, tree.groundHeight + tree.height * .43, tree.z);
    transform.scale.set(1, tree.height * .95, 1);
    transform.rotation.set(0, index * 1.2, .05 * Math.sin(index));
    transform.updateMatrix();
    trunks.setMatrixAt(index, transform.matrix);
    trunks.setColorAt(index, wood);
    for (let layer = 0; layer < 2; layer++) {
      const size = tree.height * (layer ? .30 : .41);
      transform.position.set(tree.x + size * layer * .45, tree.groundHeight + tree.height * (.84 + layer * .23), tree.z);
      transform.scale.set(size, size * .65, size * .83);
      transform.rotation.set(.13, index * 2.1 + layer, -.12);
      transform.updateMatrix();
      crowns.setMatrixAt(index * 2 + layer, transform.matrix);
      const tint = foliage[(index + layer) % foliage.length]!;
      crowns.setColorAt(index * 2 + layer, tree.distant ? tint.clone().lerp(haze, .24) : tint);
    }
  }
  trunks.computeBoundingSphere();
  crowns.computeBoundingSphere();
  group.add(trunks, crowns);
  return {
    group,
    setLowGraphics(low: boolean) {
      const count = low ? common : trees.length;
      trunks.count = count;
      crowns.count = count * 2;
    },
    dispose() {
      group.removeFromParent();
      group.clear();
      for (const mesh of [ground, bank, creek, water, entry]) mesh.geometry.dispose();
      trunks.dispose();
      crowns.dispose();
      trunkGeometry.dispose();
      crownGeometry.dispose();
      treeMaterial.dispose();
      material.dispose();
    },
  };
}
