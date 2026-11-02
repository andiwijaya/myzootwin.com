import {Box3,BoxGeometry,BufferGeometry,Float32BufferAttribute,Group,LineBasicMaterial,LineSegments,Mesh,MeshStandardMaterial,Vector3} from 'three';
import {Batch} from './tropical-diorama.ts';
import type {WorldState} from '../core/state.ts';
import type {SceneCatalog} from './scene-selection.ts';
/** Original compact enclosed aviary. Animal instances and resource facilities have separate owners. */
export function createHabitatScene(catalog:SceneCatalog,register:(geometry:BufferGeometry,material:MeshStandardMaterial|LineBasicMaterial)=>void){
  const group=new Group();group.name='Constructed macaw habitat';let ids:string[]=[],disposed=false;
  const wood=new Mesh(new BufferGeometry(),new MeshStandardMaterial({vertexColors:true,roughness:1}));
  const wire=new LineSegments(new BufferGeometry(),new LineBasicMaterial({color:'#57735e',transparent:true,opacity:.20,depthWrite:false}));
  wood.castShadow=true;wood.receiveShadow=true;
  register(wood.geometry,wood.material);register(wire.geometry,wire.material);
  function clear(){for(const id of ids){catalog.identities.delete(id);catalog.bounds.delete(id);}catalog.batches=catalog.batches.filter(b=>b.mesh!==wood);ids=[];group.clear();wood.geometry.dispose();wire.geometry.dispose();}
  function sync(world:WorldState){
    if(disposed)return;
    if(ids.length&&(!world.habitats.length||world.habitats[0].id!==ids[0]))clear();
    for(const habitat of world.habitats){
      if(ids.includes(habitat.id))continue;
      const ordinal=ids.length+1,minX=Math.min(...habitat.cells.map(c=>c.x)),minZ=Math.min(...habitat.cells.map(c=>c.z));
      const x=minX-world.width/2+1,z=minZ-world.height/2+1,batch=new Batch();batch.owner=habitat.id;
      const box=(color:string,p:number[],scale:number[])=>batch.add(new BoxGeometry(1,1,1),color,p,scale);
      box('#c6ca9a',[x,.055,z],[1.96,.045,1.96]);
      // Continuous perimeter sill and upper rails; closed mesh roof keeps future short flights contained.
      for(const side of [-1,1]){
        box('#8c724d',[x+side*.96,.12,z],[.075,.12,1.98]);box('#8c724d',[x,.12,z+side*.96],[1.98,.12,.075]);
        box('#725c3e',[x+side*.96,1.12,z],[.065,.07,1.98]);box('#725c3e',[x,1.12,z+side*.96],[1.98,.07,.065]);
      }
      for(const dx of [-.96,0,.96])for(const dz of [-.96,.96])box('#a17c4c',[x+dx,.6,z+dz],[.075,1.12,.075]);
      for(const dz of [0])for(const dx of [-.96,.96])box('#a17c4c',[x+dx,.6,z+dz],[.075,1.12,.075]);
      // A closed keeper door on the near side, with a visible latch; no visitor route is implied.
      for(const dx of [-.27,.27])box('#654c32',[x+dx,.59,z+.96],[.04,1,.035]);
      for(const y of [.19,1.02])box('#654c32',[x,y,z+.96],[.58,.04,.035]);
      box('#e5bc65',[x+.18,.59,z+.982],[.07,.045,.025]);
      const mesh=wood,next=batch.geometry();mesh.geometry.dispose();mesh.geometry.copy(next);next.dispose();mesh.name=habitat.id;group.add(mesh);
      catalog.batches.push({mesh,ranges:batch.ranges});
      const bounds=new Box3(new Vector3(x-1,.035,z-1),new Vector3(x+1,1.18,z+1));
      catalog.identities.set(habitat.id,{id:habitat.id,category:'object',kind:'habitat',ordinal,cell:{x:minX,z:minZ}});catalog.bounds.set(habitat.id,bounds);
      for(const cell of habitat.cells){const tile=catalog.identities.get(`tile-${cell.x}-${cell.z}`);if(tile){tile.kind='habitat';tile.ordinal=ordinal;}}
      const lines:number[]=[];const line=(a:number[],b:number[])=>lines.push(...a,...b);
      for(let i=0;i<=8;i++){
        const t=-.94+i*1.88/8;
        for(const side of [-.94,.94]){line([x+t,.19,z+side],[x+t,1.09,z+side]);line([x+side,.19,z+t],[x+side,1.09,z+t]);}
        line([x+t,1.12,z-.94],[x+t,1.12,z+.94]);line([x-.94,1.12,z+t],[x+.94,1.12,z+t]);
      }
      for(let j=0;j<=4;j++){const y=.19+j*.225;for(const side of [-.94,.94]){line([x-.94,y,z+side],[x+.94,y,z+side]);line([x+side,y,z-.94],[x+side,y,z+.94]);}}
      const netGeometry=new BufferGeometry();netGeometry.setAttribute('position',new Float32BufferAttribute(lines,3));
      const net=wire;net.geometry.dispose();net.geometry.copy(netGeometry);netGeometry.dispose();net.name='Enclosing wire and roof';group.add(net);
      ids.push(habitat.id);group.updateMatrixWorld(true);
    }
  }
  return {group,sync,dispose(){if(disposed)return;disposed=true;clear();},inspect:()=>({habitatMeshes:disposed?0:ids.length,habitatSceneDisposed:disposed})};
}
