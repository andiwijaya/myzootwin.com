import {Box3,BoxGeometry,BufferGeometry,CylinderGeometry,Float32BufferAttribute,Group,IcosahedronGeometry,Mesh,MeshStandardMaterial} from 'three';
import type {RuntimeWorld} from '../../core/state.ts';
import type {LionResource} from '../../core/species.ts';
import type {SceneCatalog} from '../scene-selection.ts';
import {Batch} from '../tropical-diorama.ts';
import {sceneOrigin} from '../../world/scene-coordinates.ts';
export function createLionWorldScene(catalog:SceneCatalog){
 const group=new Group();group.name='Lion Savanna';const material=new MeshStandardMaterial({vertexColors:true,roughness:1}),models=new Map<string,{mesh:Mesh;key:string;entry:SceneCatalog['batches'][number]}>();let disposed=false;
 const remove=(id:string)=>{const old=models.get(id);if(!old)return;old.mesh.geometry.dispose();group.remove(old.mesh);catalog.batches=catalog.batches.filter(b=>b!==old.entry);catalog.identities.delete(id);catalog.bounds.delete(id);models.delete(id);};
 const install=(id:string,key:string,batch:Batch)=>{const prior=models.get(id);if(prior?.key===key)return;if(prior)remove(id);const geometry=batch.geometry(),mesh=new Mesh(geometry,material),entry={mesh,ranges:batch.ranges};mesh.castShadow=true;mesh.receiveShadow=true;group.add(mesh);models.set(id,{mesh,key,entry});catalog.batches.push(entry);catalog.bounds.set(id,new Box3().setFromObject(mesh));};
 return {group,sync(world:RuntimeWorld,wildflowers=false){if(disposed)return;const h=world.habitats.find(h=>h.kind==='lion-savanna'),resources=world.resources.filter((r):r is LionResource=>r.kind.startsWith('lion-')),active=new Set([...(h?[h.id]:[]),...resources.map(r=>r.id),...(h&&wildflowers?['lion-wildflowers']:[])]);for(const id of models.keys())if(!active.has(id))remove(id);const origin=sceneOrigin(world);
  if(h){const habitatKey=JSON.stringify(h.cells);if(models.get(h.id)?.key!==habitatKey){const batch=new Batch();batch.owner=h.id;const x=Math.min(...h.cells.map(c=>c.x))-origin.x,z=Math.min(...h.cells.map(c=>c.z))-origin.z;const box=(color:string,p:number[],scale:number[])=>batch.add(new BoxGeometry(1,1,1),color,p,scale);
   for(let row=0;row<7;row++)for(let col=0;col<7;col++)box((row+col)%3?'#c5b179':'#b9a66e',[x+col+.5,.052,z+row+.5],[1,.03,1]);
   for(const side of [0,7]){for(const y of [.22,.48,.74]){box('#5a5747',[x+side,y,z+3.5],[.065,.055,7]);box('#5a5747',[x+3.5,y,z+side],[7,.055,.065]);}for(let i=0;i<=7;i++){box('#6c6147',[x+i,.43,z+side],[.11,.83,.11]);if(i>0&&i<7)box('#6c6147',[x+side,.43,z+i],[.11,.83,.11]);}}
   install(h.id,habitatKey,batch);}const x=Math.min(...h.cells.map(c=>c.x))-origin.x,z=Math.min(...h.cells.map(c=>c.z))-origin.z;catalog.identities.set(h.id,{id:h.id,category:'object',kind:'habitat',habitatKind:'lion-savanna',ordinal:1,connected:Boolean(h.viewingCell),cell:{x:x+origin.x,z:z+origin.z}});for(const c of h.cells){const tile=catalog.identities.get(`tile-${c.x}-${c.z}`);if(tile){tile.kind='habitat';tile.habitatKind='lion-savanna';}}
  }
  if(h&&wildflowers){const key=JSON.stringify(h.cells);if(models.get('lion-wildflowers')?.key!==key){const batch=new Batch();batch.owner=h.id;const x=Math.min(...h.cells.map(c=>c.x))-origin.x,z=Math.min(...h.cells.map(c=>c.z))-origin.z;for(let i=0;i<12;i++){const px=x+.25+(i%6)*1.28,pz=z+(i<6?.25:6.75);batch.add(new CylinderGeometry(.012,.016,.13,5),'#718348',[px,.13,pz]);batch.add(new IcosahedronGeometry(.055,0),i%2?'#ead784':'#f5ead2',[px,.23,pz]);}install('lion-wildflowers',key,batch);}}
  for(const [i,r] of resources.entries()){const key=JSON.stringify(r),prior=models.get(r.id);if(prior?.key===key)continue;const batch=new Batch();batch.owner=r.id;const x=r.cell.x+.5-origin.x,z=r.cell.z+.5-origin.z,box=(color:string,p:number[],size:number[])=>batch.add(new BoxGeometry(1,1,1),color,p,size),stone=(color:string,p:number[],size:number[])=>batch.add(new IcosahedronGeometry(1,0),color,p,size);
   if(r.kind==='lion-meat'||r.kind==='lion-water'){
    box('#807f6e',[x,.21,z],[.55,.35,.55]);for(const port of r.approaches){const dx=r.cell.x+.5-port.x,dz=r.cell.z+.5-port.z,d=Math.hypot(dx,dz),px=port.x+dx/d*.5-origin.x,pz=port.z+dz/d*.5-origin.z;box('#b5ad8c',[px,.18,pz],[.35,.15,.35]);box(r.stock>0?(r.kind==='lion-meat'?'#b98565':'#5daeb1'):'#7d786a',[px,.265,pz],[.29,.035,.29]);}
   }else if(r.kind==='lion-kopje'){
    const points=[[-.5,0,-.5],[.5,0,-.5],[-.5,.65,-.5],[.5,.65,-.5],[-.5,.65,0],[.5,.65,0],[-.5,0,2],[.5,0,2]],faces=[[0,2,3],[0,3,1],[2,4,5],[2,5,3],[4,6,7],[4,7,5],[0,6,4],[0,4,2],[1,3,5],[1,5,7]],positions=faces.flatMap(face=>face.flatMap(i=>[points[i]![0]!+x,points[i]![1]!+.079,points[i]![2]!+z]));const geometry=new BufferGeometry();geometry.setAttribute('position',new Float32BufferAttribute(positions,3));geometry.computeVertexNormals();batch.add(geometry,'#9d977f',[0,0,0]);
   }else if(r.kind==='lion-den'){
    stone('#9f977b',[x,.31,z],[.58,.38,.58]);batch.add(new CylinderGeometry(.055,.09,1.2,6),'#806444',[x, .62,z]);stone('#74825a',[x,1.22,z],[1.55,.20,1.55]);stone('#87935f',[x+.4,1.33,z-.2],[1.15,.17,.95]);
   }else if(r.kind==='lion-scent'){box('#a8a76e',[x,.09,z],[.7,.06,.7]);for(const side of [-1,1])stone(r.stock?'#809454':'#9a986c',[x+side*.16,.16,z],[.15,.17,.19]);}
   else{batch.add(new CylinderGeometry(.16,.20,.7,8).rotateZ(Math.PI/2),'#896745',[x,.24,z]);for(const side of [-1,1])box('#b59a70',[x+side*.16,.4,z],[.025,.02,.26]);}
   install(r.id,key,batch);catalog.identities.set(r.id,{id:r.id,category:'object',kind:'lion-facility',facilityKind:r.kind,stock:r.stock,capacity:r.capacity,ordinal:i+1,cell:{...r.cell}});
  }
 },dispose(){if(disposed)return;disposed=true;for(const id of [...models.keys()])remove(id);material.dispose();group.clear();},inspect:()=>({lionWorldMeshes:models.size,lionWorldMaterials:disposed?0:1,lionWorldDisposed:disposed})};
}
