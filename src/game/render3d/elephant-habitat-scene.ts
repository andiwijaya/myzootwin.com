import {Box3,BoxGeometry,BufferGeometry,Group,Mesh,MeshStandardMaterial,Vector3} from 'three';
import type {RuntimeWorld} from '../core/state.ts';
import type {SceneCatalog} from './scene-selection.ts';
import {sceneOrigin} from '../world/scene-coordinates.ts';
import {Batch} from './tropical-diorama.ts';

/** Original outdoor enclosure. One reusable batch; care facilities and animals have separate owners. */
export function createElephantHabitatScene(catalog:SceneCatalog){
 const group=new Group(),geometry=new BufferGeometry(),material=new MeshStandardMaterial({vertexColors:true,roughness:1}),mesh=new Mesh(geometry,material),entry={mesh,ranges:[] as import('./scene-selection.ts').FaceOwner[]};
 group.name='Elephant Grove enclosure';mesh.name='Elephant Grove ground and timber fence';mesh.receiveShadow=true;mesh.castShadow=true;mesh.visible=false;group.add(mesh);catalog.batches.push(entry);
 let id:string|null=null,key='',disposed=false,triangles=0;
 function forget(){if(id){catalog.identities.delete(id);catalog.bounds.delete(id);}id=null;}
 return {group,geometry,material,sync(world:RuntimeWorld){
  if(disposed)return;const h=world.habitats.find(h=>'kind'in h&&h.kind==='elephant-grove'),nextKey=JSON.stringify(h?.cells??null);if(nextKey===key&&h?.id===id)return;key=nextKey;forget();
  if(!h){mesh.visible=false;entry.ranges=[];return;}
  id=h.id;const minX=Math.min(...h.cells.map(c=>c.x)),minZ=Math.min(...h.cells.map(c=>c.z)),origin=sceneOrigin(world),x=minX-origin.x+3,z=minZ-origin.z+3,batch=new Batch();batch.owner=h.id;
  const box=(color:string,p:number[],size:number[])=>batch.add(new BoxGeometry(1,1,1),color,p,size);
  for(let row=0;row<6;row++)for(let col=0;col<6;col++)box((row+col)%3===0?'#b7b281':'#bdba89',[x+col-2.5,.055,z+row-2.5],[1,.035,1]);
  for(const side of [-1,1]){
   for(const height of [.28,.60]){box('#88704c',[x+side*2.93,height,z],[.075,.095,5.9]);box('#88704c',[x,height,z+side*2.93],[5.9,.095,.075]);}
   for(let i=0;i<=5;i++){const offset=-2.93+i*5.86/5;box('#685d41',[x+offset,.36,z+side*2.93],[.12,.67,.12]);if(i>0&&i<5)box('#685d41',[x+side*2.93,.36,z+offset],[.12,.67,.12]);}
  }
  const next=batch.geometry();geometry.dispose();geometry.copy(next);next.dispose();entry.ranges=batch.ranges;mesh.visible=true;triangles=batch.positions.length/9;
  catalog.identities.set(h.id,{id:h.id,category:'object',kind:'habitat',habitatKind:'elephant-grove',ordinal:1,cell:{x:minX,z:minZ}});catalog.bounds.set(h.id,new Box3(new Vector3(x-3,.035,z-3),new Vector3(x+3,.70,z+3)));
  for(const cell of h.cells){const tile=catalog.identities.get(`tile-${cell.x}-${cell.z}`);if(tile){tile.kind='habitat';tile.habitatKind='elephant-grove';tile.ordinal=1;}}
  group.updateMatrixWorld(true);
 },dispose(){if(disposed)return;disposed=true;forget();catalog.batches=catalog.batches.filter(b=>b!==entry);group.clear();},inspect:()=>({elephantHabitatMeshes:!disposed&&mesh.visible?1:0,elephantHabitatTriangles:!disposed&&mesh.visible?triangles:0,elephantHabitatSceneDisposed:disposed})};
}
