import {sceneOrigin} from '../world/scene-coordinates.ts';
import {BoxGeometry,CylinderGeometry,Group,LatheGeometry,Mesh,MeshStandardMaterial,SphereGeometry,Vector2} from 'three';
import {Batch} from './tropical-diorama.ts';
import type {WorldState} from '../core/state.ts';
import {feederAnchor} from '../animals/feeding.ts';
export const FEEDER_LIFT=.04;
/** Original two-port feeding station. Geometry is reused; stock only changes fruit visibility. */
export function createFeederScene(){
 const group=new Group();group.name='Two-port macaw feeder';let geometry:ReturnType<Batch['geometry']>|undefined,material:MeshStandardMaterial|undefined,station:Mesh|undefined,fruitGeometry:SphereGeometry|undefined,fruitMaterial:MeshStandardMaterial|undefined,fruits:Mesh[]=[];
 function allocate(){
 const batch=new Batch(),scale=.62;
 const add=(g:Parameters<Batch['add']>[0],c:string,p:number[],s:number[])=>batch.add(g,c,p,s);
 for(const x of [-.5,.5]){add(new LatheGeometry([[0,.01],[.09,.01],[.13,.06],[.13,.085],[.103,.085],[.08,.03],[0,.03]].map(p=>new Vector2(...p)),12),'#bf8662',[x,.079+.15*scale+FEEDER_LIFT,.7844],[scale,scale,scale]);add(new CylinderGeometry(.055,.075,.16+FEEDER_LIFT/scale,8),'#99754e',[x,.079+.08*scale+FEEDER_LIFT/2,.7844],[scale,scale,scale]);}
 add(new BoxGeometry(1,1,1),'#b99a66',[0,.10,.7844],[1.35,.035,.08]);
 geometry=batch.geometry();material=new MeshStandardMaterial({vertexColors:true,roughness:1});station=new Mesh(geometry,material);group.add(station);
 fruitGeometry=new SphereGeometry(.021,7,5);fruitMaterial=new MeshStandardMaterial({color:'#e9a53b',flatShading:true,roughness:1});
 fruits=Array.from({length:8},(_,i)=>{const m=new Mesh(fruitGeometry,fruitMaterial),port=i%2,mouth=Math.floor(i/2);m.position.set((port===0?-.5:.5)+(mouth===0?0:mouth%2?-.024:.024),.079+.213*scale+FEEDER_LIFT+(mouth>1?.018:0),.7844+(mouth<2?-.016:.022));group.add(m);return m;});
 }
 function release(){group.clear();geometry?.dispose();material?.dispose();fruitGeometry?.dispose();fruitMaterial?.dispose();geometry=undefined;material=undefined;station=undefined;fruitGeometry=undefined;fruitMaterial=undefined;fruits=[];}
 let disposed=false,active=false;
 function sync(world:WorldState,preview:boolean,valid=true){if(disposed)return;const h=world.habitats[0],r=world.resources.find(r=>r.kind==='food');active=Boolean(r||preview&&h);group.visible=active;if(!active){if(station)release();return;}if(!station)allocate();const anchor=r?.cell??feederAnchor(h!);group.position.set(anchor.x+1-sceneOrigin(world).x,0,anchor.z-sceneOrigin(world).z);material!.transparent=preview;material!.opacity=preview?.42:1;material!.depthWrite=!preview;material!.color.set(preview?(valid?'#8bd5a1':'#e58c79'):'#ffffff');fruits.forEach((m,i)=>{m.visible=!preview&&Math.floor(i/2)<(r?.portions?.[i%2]??0);});group.updateMatrixWorld(true);}
 return {group,sync,dispose(){if(disposed)return;disposed=true;release();active=false;},inspect:()=>({feederVisible:active,feederSceneDisposed:disposed,feederOwnedMaterials:station?2:0,feederGeometries:station?2:0,feederTriangles:!geometry?0:geometry.getAttribute('position').count/3,feederBowl1Fruit:fruits.filter((m,i)=>m.visible&&i%2===0).length,feederBowl2Fruit:fruits.filter((m,i)=>m.visible&&i%2===1).length,feederFruitCount:disposed?0:fruits.filter(m=>m.visible).length})};
}
