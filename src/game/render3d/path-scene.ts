import {sceneOrigin} from '../world/scene-coordinates.ts';
import {BoxGeometry,BufferGeometry,Group,Mesh,MeshStandardMaterial} from 'three';
import {Batch} from './tropical-diorama.ts';
import {analyzePaths} from '../world/paths.ts';
import {cellKey} from '../world/placement-preview.ts';
import type {RuntimeWorld} from '../core/state.ts';
import type {SceneCatalog} from './scene-selection.ts';
/** One reusable geometry/material for all player path tiles and the viewing marker. */
export function createPathScene(catalog:SceneCatalog){
 const group=new Group(),geometry=new BufferGeometry(),material=new MeshStandardMaterial({vertexColors:true,roughness:1}),mesh=new Mesh(geometry,material),entry={mesh,ranges:[] as import('./scene-selection.ts').FaceOwner[]};
 mesh.receiveShadow=true;group.name='Visitor path topology';mesh.name='Player paths';mesh.visible=false;group.add(mesh);catalog.batches.push(entry);let disposed=false,tiles=0,revision=0;
 return {group,geometry,material,sync(world:RuntimeWorld){
  if(disposed)return;const topology=analyzePaths(world),reachable=new Set(topology.reachable.map(cellKey)),batch=new Batch();tiles=0;
  const box=(color:string,x:number,y:number,z:number,scale:number[])=>batch.add(new BoxGeometry(1,1,1),color,[x,y,z],scale);
  for(const tile of world.tiles){
   const id=`tile-${tile.cell.x}-${tile.cell.z}`,identity=catalog.identities.get(id);if(!identity)continue;
   if(!tile.path&&tile.occupantId===null){identity.kind=tile.terrain;identity.ordinal=0;delete identity.connected;delete identity.habitatKind;const bounds=catalog.bounds.get(id);if(bounds)bounds.max.y=.055;}
   if(tile.path){identity.kind='path';identity.ordinal=0;identity.connected=reachable.has(cellKey(tile.cell));const bounds=catalog.bounds.get(id);if(bounds)bounds.max.y=.1;}
   if(!tile.path||cellKey(tile.cell)===cellKey(world.gate))continue;
   const x=tile.cell.x+.5-sceneOrigin(world).x,z=tile.cell.z+.5-sceneOrigin(world).z;batch.owner=id;tiles++;
   box(identity.connected?'#e3c78e':'#b9ac91',x,.055,z,[.95,.065,.95]);
   for(const dz of [-.29,0,.29])box(identity.connected?'#eed9ad':'#d1c5aa',x,.09,z+dz,[.83,.008,.018]);
  }
  for(const access of topology.habitats){const identity=catalog.identities.get(access.habitatId);if(identity)identity.connected=access.connected;
   if(!access.viewingCell)continue;const p=access.viewingCell,x=p.x+.5-sceneOrigin(world).x,z=p.z+.5-sceneOrigin(world).z;batch.owner=`tile-${p.x}-${p.z}`;
   box('#497b69',x+.32,.22,z+.32,[.055,.27,.055]);box('#77ad87',x+.32,.35,z+.32,[.27,.13,.04]);
  }
  const next=batch.geometry();geometry.dispose();geometry.copy(next);next.dispose();entry.ranges=batch.ranges;mesh.visible=batch.positions.length>0;group.updateMatrixWorld(true);revision++;
 },dispose(){if(disposed)return;disposed=true;catalog.batches=catalog.batches.filter(b=>b!==entry);group.clear();},inspect:()=>({pathSceneDisposed:disposed,pathMeshes:disposed||!mesh.visible?0:1,renderedPathTiles:disposed?0:tiles,pathSceneRevision:revision})};
}
