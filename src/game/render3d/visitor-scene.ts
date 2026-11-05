import {sceneOrigin} from '../world/scene-coordinates.ts';
import {BoxGeometry,CylinderGeometry,IcosahedronGeometry,CircleGeometry,Color,Float32BufferAttribute,Group,Mesh,MeshStandardMaterial,MeshBasicMaterial,Matrix4,Vector3,type BufferGeometry} from 'three';
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';
import {arrivalAge,ARRIVAL_RULES} from '../visitors/arrivals.ts';
import type {Visitor,Point} from '../core/state.ts';

/** Original texture-free, shared low-poly people. Five coloured rig meshes + one contact shade each. */
export function createVisitorScene(){
 const group=new Group();group.name='Entrance visitors';let visibleCap=3;let disposed=false,lastSyncTick=-1,pool:ReturnType<typeof assets>|undefined;
 const people=new Map<string,{root:Group;body:Mesh;arms:Mesh[];legs:Mesh[];previous:Vector3;current:Vector3;age:number;heading:number;walking:boolean}>();
 function assets(){const geometries:BufferGeometry[]=[],material=new MeshStandardMaterial({vertexColors:true,roughness:.95,flatShading:true}),shade=new MeshBasicMaterial({color:'#314b38',transparent:true,opacity:.13,depthWrite:false});
  function part(g:BufferGeometry,color:string,x:number,y:number,z:number){const n=g.index?g.toNonIndexed():g;const c=new Color(color),v=n.getAttribute('position');n.setAttribute('color',new Float32BufferAttribute(Array.from({length:v.count},()=>[c.r,c.g,c.b]).flat(),3));n.applyMatrix4(new Matrix4().makeTranslation(x,y,z));if(n!==g)g.dispose();return n;}
  function merged(parts:BufferGeometry[]){const g=mergeGeometries(parts,false);parts.forEach(p=>p.dispose());if(!g)throw Error('Visitor geometry merge failed');geometries.push(g);return g;}
  const skins=['#a96f4a','#e0ae82','#79533f'],shirts=['#e49c4b','#578b9d','#a86b89'];
  const bodies=skins.map((skin,i)=>merged([part(new BoxGeometry(.14,.25,.10),shirts[i],0,.4,0),part(new CylinderGeometry(.025,.025,.04,6),skin,0,.535,0),part(new IcosahedronGeometry(.065,1),skin,0,.60,0),part(new CylinderGeometry(.071,.071,.045,8),'#53614d',0,.66,0),part(new CylinderGeometry(.095,.095,.009,8),'#dcc38a',0,.638,0),part(new BoxGeometry(.082,.12,.04),'#8d7751',0,.41,-.067),part(new BoxGeometry(.012,.012,.008),'#243e38',-.025,.605,.059),part(new BoxGeometry(.012,.012,.008),'#243e38',.025,.605,.059)]));
  const arms=skins.map((skin,i)=>merged([part(new BoxGeometry(.038,.10,.043),shirts[i],0,-.05,0),part(new BoxGeometry(.03,.085,.032),skin,0,-.142,0),part(new IcosahedronGeometry(.022,0),skin,0,-.19,0)]));
  const leg=merged([part(new BoxGeometry(.042,.22,.048),'#526b6c',0,-.11,0),part(new BoxGeometry(.057,.05,.086),'#504b40',0,-.235,.015)]),shadow=new CircleGeometry(.12,10);geometries.push(shadow);
  return {bodies,arms,leg,shadow,material,shade,geometries};
 }
 function make(id:string,serial:number){pool??=assets();const p=pool,style=(serial-1)%3,root=new Group();root.name=id;const body=new Mesh(p.bodies[style],p.material);root.add(body);
  const arms=[-1,1].map(sign=>{const mesh=new Mesh(p.arms[style],p.material);mesh.position.set(sign*.092,.49,0);root.add(mesh);return mesh;});
  const legs=[-1,1].map(sign=>{const mesh=new Mesh(p.leg,p.material);mesh.position.set(sign*.042,.26,0);root.add(mesh);return mesh;});
  const shadow=new Mesh(p.shadow,p.shade);shadow.rotation.x=-Math.PI/2;shadow.position.y=.001;root.add(shadow);group.add(root);return {root,body,arms,legs,previous:new Vector3(),current:new Vector3(),age:0,heading:Math.PI,walking:false};
 }
 return {group,sync(visitors:Visitor[],width:number,height:number,tick:number,gate:Point={x:1,z:8}){if(disposed||tick===lastSyncTick)return;lastSyncTick=tick;const active=new Set(visitors.filter(v=>v.arrival).map(v=>v.id));for(const[id,p]of people)if(!active.has(id)){group.remove(p.root);p.root.clear();people.delete(id);}
  for(const v of visitors){if(!v.arrival)continue;let p=people.get(v.id);const point=new Vector3(v.position.x-sceneOrigin({width,height}).x,Math.floor(v.position.x)===gate.x&&Math.floor(v.position.z)===gate.z?.073:.0945,v.position.z-sceneOrigin({width,height}).z);if(!p){p=make(v.id,v.arrival.serial);p.previous.copy(point);people.set(v.id,p);}else p.previous.copy(p.current);p.current.copy(point);p.age=arrivalAge(v,tick);p.heading=v.journey?.heading??(p.age<ARRIVAL_RULES.leaveAt?Math.PI:0);p.walking=p.previous.distanceToSquared(p.current)>1e-12;}
 },update(alpha:number,timeMs:number,reducedMotion=false){if(disposed)return;let visibleIndex=0;for(const p of people.values()){p.root.visible=visibleIndex++<visibleCap;const walking=p.walking,phase=timeMs*.01+p.age*.03,swing=walking&&!reducedMotion?Math.sin(phase)*.12:0;p.root.position.lerpVectors(p.previous,p.current,Math.min(1,Math.max(0,alpha)));p.root.position.y+=Math.abs(swing)*.06;p.root.rotation.y=p.heading;p.legs.forEach((m,i)=>m.rotation.x=swing*(i?1:-1));p.arms.forEach((m,i)=>m.rotation.x=-swing*2*(i?1:-1));}},
 setVisibleCap(value:number){visibleCap=value;let index=0;for(const p of people.values())p.root.visible=index++<visibleCap;},
 inspect:()=>({visibleVisitorModels:[...people.values()].filter(p=>p.root.visible).length,visitorModels:people.size,visitorGeometries:disposed?0:pool?.geometries.length??0,visitorOwnedMaterials:disposed||!pool?0:2,visitorModelTriangles:!disposed&&pool?pool.bodies[0].getAttribute('position').count/3+2*pool.arms[0].getAttribute('position').count/3+2*pool.leg.getAttribute('position').count/3+10:0,visitorTextures:0,visitorSceneDisposed:disposed}),
 dispose(){if(disposed)return;disposed=true;group.clear();people.clear();pool?.geometries.forEach(g=>g.dispose());pool?.material.dispose();pool?.shade.dispose();pool=undefined;}
 };
}
