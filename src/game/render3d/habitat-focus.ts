import {Box3, Plane, Vector3, type Material, type Object3D} from 'three';
import type {RuntimeWorld, Point} from '../core/state.ts';
import type {HabitatKind} from '../core/species.ts';
import {sceneOrigin} from '../world/scene-coordinates.ts';
import type {SceneCatalog, SceneIdentity} from './scene-selection.ts';
import type {EditorState} from '../world/editing.ts';

export type FocusHabitat = RuntimeWorld['habitats'][number];
export interface HabitatFocusView {
  active: boolean;
  habitatId: string | null;
  kind: HabitatKind | null;
  selectedHabitatId: string | null;
  selectedKind: HabitatKind | null;
}
export const habitatKind = (home: FocusHabitat): HabitatKind => home.kind ?? 'macaw-aviary';
export const habitatContains = (home: FocusHabitat, cell: Point) => home.cells.some(c => c.x === cell.x && c.z === cell.z);

/** The shared undo slot is available locally only when it restores a facility in this habitat. */
export function habitatUndoAllowed(editor:EditorState,habitatId:string){
  const undo=editor.undo;if(!undo)return false;
  const removed=undo.before.resources.filter(r=>!undo.after.resources.some(a=>a.id===r.id));
  return removed.length===1&&removed[0]!.habitatId===habitatId;
}

/** Resolve tile and object selection against the actual constructed world, including legacy aviaries. */
export function habitatForSelection(world: RuntimeWorld, identity: SceneIdentity | null): FocusHabitat | undefined {
  if (!identity) return;
  const resource = world.resources.find(r => r.id === identity.id);
  return world.habitats.find(h => h.id === identity.id || h.id === resource?.habitatId)
    ?? world.habitats.find(h => habitatContains(h, identity.cell));
}

export function habitatFocusArea(home: FocusHabitat, world: Pick<RuntimeWorld, 'width' | 'height'>) {
  const origin = sceneOrigin(world), x = Math.min(...home.cells.map(c => c.x)), z = Math.min(...home.cells.map(c => c.z));
  return {x: x - origin.x, z: z - origin.z, width: Math.max(...home.cells.map(c => c.x)) + 1 - x, depth: Math.max(...home.cells.map(c => c.z)) + 1 - z};
}

export function habitatFocusBounds(home: FocusHabitat, world: RuntimeWorld, catalog: SceneCatalog) {
  const a = habitatFocusArea(home, world);
  const heights: Record<HabitatKind, number> = {'macaw-aviary': 1.5, 'elephant-grove': 3.2, 'lion-savanna': 2.8, 'giraffe-plains': 4.2, 'zebra-grasslands': 2.6};
  let top = heights[habitatKind(home)];
  for (const [id, identity] of catalog.identities) if (habitatForSelection(world, identity)?.id === home.id) top = Math.max(top, catalog.bounds.get(id)?.max.y ?? 0);
  return new Box3(new Vector3(a.x - .08, -.42, a.z - .08), new Vector3(a.x + a.width + .08, top + .12, a.z + a.depth + .08));
}

/** A reversible render mask. The canonical world and the single simulation are never filtered.
 * World-space planes also isolate merged terrain/foliage batches and their shadow passes.
 * Restore visibility before scene sync so a temporary mask cannot become an object's own state. */
export function createHabitatRenderMask() {
  let home: FocusHabitat | null = null, planes: Plane[] = [];
  let cachedWorld:RuntimeWorld|undefined;
  const owners=new Map<string,boolean>();
  function belongs(identity:SceneIdentity|null,world:RuntimeWorld){
    if(!home||!identity)return false;
    if(cachedWorld!==world){cachedWorld=world;owners.clear();}
    const known=owners.get(identity.id);if(known!==undefined)return known;
    const allowed=habitatForSelection(world,identity)?.id===home.id;owners.set(identity.id,allowed);return allowed;
  }
  const visibility = new Map<Object3D, boolean>();
  const materials = new Map<Material, {planes: Plane[] | null; shadows: boolean; intersection: boolean; release: () => void}>();
  function restoreVisibility() {for (const [object, visible] of visibility) object.visible = visible; visibility.clear();}
  function hide(object: Object3D) {if (!visibility.has(object)) visibility.set(object, object.visible); object.visible = false;}
  function restoreMaterials() {
    for (const [material, value] of materials) {material.clippingPlanes = value.planes; material.clipShadows = value.shadows; material.clipIntersection = value.intersection; material.needsUpdate = true; material.removeEventListener('dispose', value.release);}
    materials.clear();
  }
  function set(next: FocusHabitat | null, world: RuntimeWorld) {
    restoreVisibility(); restoreMaterials(); home = next;owners.clear();cachedWorld=undefined;
    if (!next) {planes = []; return;}
    const a = habitatFocusArea(next, world), pad = .065;
    planes = [new Plane(new Vector3(1, 0, 0), -a.x + pad), new Plane(new Vector3(-1, 0, 0), a.x + a.width + pad), new Plane(new Vector3(0, 0, 1), -a.z + pad), new Plane(new Vector3(0, 0, -1), a.z + a.depth + pad)];
  }
  function clip(material: Material) {
    if (materials.has(material)) return;
    const release = () => materials.delete(material);
    materials.set(material, {planes: material.clippingPlanes, shadows: material.clipShadows, intersection: material.clipIntersection, release});
    material.addEventListener('dispose', release);
    material.clippingPlanes = planes;
    material.clipShadows = true;
    material.clipIntersection = false;
    material.needsUpdate = true;
  }
  function apply(root: Object3D, catalog: SceneCatalog, world: RuntimeWorld, hidden: (Object3D | undefined)[]) {
    if (!home) return;
    for (const object of hidden) if (object) hide(object);
    for (const batch of catalog.batches) {
      // Mixed terrain batches are cut by planes; a wholly unrelated owned mesh need not be submitted.
      if (batch.ranges.length && batch.ranges.every(r => r.id !== null && !belongs(catalog.identities.get(r.id) ?? null,world))) hide(batch.mesh);
    }
    // Hidden habitat branches are skipped by the renderer and shadow pass.
    root.traverseVisible(object => {
      const renderable = object as Object3D & {material?: Material | Material[]; customDepthMaterial?: Material};
      if (Array.isArray(renderable.material)) renderable.material.forEach(clip);
      else if (renderable.material) clip(renderable.material);
      if (renderable.customDepthMaterial) clip(renderable.customDepthMaterial);
    });
  }
  return {set, apply, restoreVisibility, allows: (identity: SceneIdentity, world: RuntimeWorld, point?: {x:number;z:number}) => {
      if (!home) return true;
      if (!belongs(identity,world)) return false;
      if (!point) return true;
      const a = habitatFocusArea(home, world);
      return point.x >= a.x - .065 && point.x <= a.x + a.width + .065 && point.z >= a.z - .065 && point.z <= a.z + a.depth + .065;
    },
    dispose() {restoreVisibility(); restoreMaterials(); home = null; planes = [];},
    inspect: () => ({habitatFocusActive: !!home, habitatFocusPlanes: planes.length, habitatFocusMaskedObjects: visibility.size, habitatFocusMaterials: materials.size})};
}
