import {Box3,BoxGeometry,Group,Mesh,MeshStandardMaterial} from 'three';
import type {RuntimeWorld} from '../../core/state.ts';import type {SceneCatalog} from '../scene-selection.ts';
import {Batch} from '../tropical-diorama.ts';import {sceneOrigin} from '../../world/scene-coordinates.ts';
/** Original procedural8x8 grass and fence, bound only to an actually paid canonical habitat.
 * The authoritative codec/ground margin controls collision; no render-time construction. */
export function createZebraWorldScene(catalog:SceneCatalog){
 const group=new Group();group.name='Zebra Grasslands';let material:MeshStandardMaterial|undefined;let model:{id:string;key:string;mesh:Mesh;entry:SceneCatalog['batches'][number]}|undefined,disposed=false;const tagged=new Set<string>();
 function remove(){if(!model)return;model.mesh.geometry.dispose();group.remove(model.mesh);catalog.batches=catalog.batches.filter(b=>b!==model!.entry);catalog.identities.delete(model.id);catalog.bounds.delete(model.id);model=undefined;}
 return{group,sync(world:RuntimeWorld){if(disposed)return;const h=world.habitats.find(h=>h.kind==='zebra-grasslands'),origin=sceneOrigin(world),key=h?JSON.stringify(h.cells):null;
  if(model&&(!h||model.id!==h.id||model.key!==key))remove();const cells=new Set(h?.cells.map(c=>`tile-${c.x}-${c.z}`)??[]);for(const id of tagged)if(!cells.has(id)){const tile=catalog.identities.get(id),t=world.tiles.find(t=>id===`tile-${t.cell.x}-${t.cell.z}`);if(tile&&t){tile.kind=t.path?'path':t.terrain;delete tile.habitatKind;}tagged.delete(id);}if(!h)return;
  const x=Math.min(...h.cells.map(c=>c.x))-origin.x,z=Math.min(...h.cells.map(c=>c.z))-origin.z;
  if(!model){const batch=new Batch();batch.owner=h.id;const box=(color:string,p:number[],size:number[])=>batch.add(new BoxGeometry(1,1,1),color,p,size);
   for(let row=0;row<8;row++)for(let col=0;col<8;col++)box((row+col)%3?'#b7be82':'#aab879',[x+col+.5,.052,z+row+.5],[1,.03,1]);
   for(const side of [0,8]){for(const y of [.4,.85,1.3]){box('#776b49',[x+side,y,z+4],[.065,.055,8]);box('#776b49',[x+4,y,z+side],[8,.055,.065]);}for(let i=0;i<=8;i++){box('#998357',[x+i,.72,z+side],[.10,1.45,.10]);if(i>0&&i<8)box('#998357',[x+side,.72,z+i],[.10,1.45,.10]);}}
   material??=new MeshStandardMaterial({vertexColors:true,roughness:1});const mesh=new Mesh(batch.geometry(),material),entry={mesh,ranges:batch.ranges};mesh.castShadow=true;mesh.receiveShadow=true;group.add(mesh);model={id:h.id,key:key!,mesh,entry};catalog.batches.push(entry);catalog.bounds.set(h.id,new Box3().setFromObject(mesh));
  }
  catalog.identities.set(h.id,{id:h.id,category:'object',kind:'habitat',habitatKind:'zebra-grasslands',ordinal:1,connected:Boolean(h.viewingCell),cell:{x:x+origin.x,z:z+origin.z}});for(const c of h.cells){const tile=catalog.identities.get(`tile-${c.x}-${c.z}`);if(tile){tile.kind='habitat';tile.habitatKind='zebra-grasslands';tagged.add(tile.id);}}
 },dispose(){if(disposed)return;disposed=true;remove();material?.dispose();group.clear();},inspect:()=>({zebraWorldMeshes:model?1:0,zebraWorldMaterials:disposed||!material?0:1,zebraWorldDisposed:disposed})};
}
