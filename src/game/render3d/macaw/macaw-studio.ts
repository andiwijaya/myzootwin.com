import {CircleGeometry,Color,CylinderGeometry,Float32BufferAttribute,Group,LatheGeometry,Mesh,OrthographicCamera,SphereGeometry,Vector2,type BufferGeometry} from 'three';
import type {WorldState} from '../../core/state.ts';
import {createMacawAssets,MACAW_SCALE,type MacawAssets} from './macaw-geometry.ts';
import {createMacawRig} from './macaw-rig.ts';
import {createMacawAnimator,isMacawClip,type MacawPose} from './macaw-animation.ts';
import {MACAW_ANGLES,type StudioCommand,type StudioView} from './studio-contract.ts';
/** Presentation-only original model preview. Does not place an animal or mutate game/save data. */
export function createMacawStudio(world:()=>WorldState,onChange:(view:StudioView)=>void,reducedMotion:()=>boolean){
 const group=new Group(),camera=new OrthographicCamera();group.name='Macaw model and animation preview';group.visible=false;
 let view:StudioView={active:false,habitat:false,clip:'perch',angle:'quarter',motionPaused:false,canHabitat:false};
 let assets:MacawAssets|undefined,rig:ReturnType<typeof createMacawRig>|undefined,animator:ReturnType<typeof createMacawAnimator>|undefined;
 let stage:Group|undefined,perch:Mesh|undefined,supports:Mesh[]=[],cup:Mesh|undefined,water:Mesh|undefined,fruit:Mesh[]=[],floor:Mesh|undefined,shadow:Mesh|undefined,cupStand:Mesh|undefined;
 let disposed=false,lastFrame:number|null=null,aspect=1,geometryBytes=0,triangles=0;const geometries:BufferGeometry[]=[];
 function emit(){view.canHabitat=world().habitats.length>0;onChange({...view});}
 function colored(g:BufferGeometry,color:string){const c=new Color(color),p=g.getAttribute('position'),values:number[]=[];for(let i=0;i<p.count;i++)values.push(c.r,c.g,c.b);g.setAttribute('color',new Float32BufferAttribute(values,3));geometries.push(g);return g;}
 function allocate(){
  assets=createMacawAssets();rig=createMacawRig(assets);animator=createMacawAnimator();stage=new Group();stage.add(rig.root);group.add(stage);
  const mesh=(g:BufferGeometry)=>new Mesh(g,assets!.material);
  floor=mesh(colored(new CylinderGeometry(.78,.82,.035,24),'#dce8c2'));floor.position.y=-.0175;stage.add(floor);
  shadow=mesh(colored(new CircleGeometry(.16,20),'#bacd9e'));shadow.rotation.x=-Math.PI/2;shadow.scale.y=.6;shadow.position.set(0,.002,.025);stage.add(shadow);
  const branch=colored(new CylinderGeometry(.035,.035,.48,10),'#9a7951');perch=mesh(branch);perch.rotation.z=Math.PI/2;perch.position.z=.025;stage.add(perch);
  const pole=colored(new CylinderGeometry(.022,.028,1,7),'#a88456');supports=[mesh(pole),mesh(pole)];supports.forEach((m,i)=>{m.position.x=i===0?-.20:.20;m.position.z=.025;stage!.add(m);});
  cup=mesh(colored(new LatheGeometry([[0,.01],[.09,.01],[.13,.06],[.13,.085],[.103,.085],[.08,.03],[0,.03]].map(p=>new Vector2(...p)),14),'#bf8662'));cup.position.set(0,.15,.62);stage.add(cup);
  cupStand=mesh(colored(new CylinderGeometry(.055,.075,.16,9),'#a88456'));cupStand.position.set(0,.08,.62);stage.add(cupStand);
  water=mesh(colored(new CircleGeometry(.089,16),'#53b4ce'));water.rotation.x=-Math.PI/2;water.position.set(0,.209,.62);stage.add(water);
  const fruitGeometry=colored(new SphereGeometry(.025,7,5),'#eb9d39');fruit=[mesh(fruitGeometry),mesh(fruitGeometry),mesh(fruitGeometry)];fruit.forEach((m,i)=>{m.position.set((i-1)*.035,.213,.62+(i%2)*.025);stage!.add(m);});
  triangles=assets.inspect().macawTriangles;geometryBytes=[...Object.values(assets.geometries),...geometries].reduce((n,g)=>n+Object.values(g.attributes).reduce((a,x)=>a+x.array.byteLength,0)+(g.index?.array.byteLength??0),0);
 }
 function frameCamera(){const angle={quarter:-.68,front:0,side:-Math.PI/2,back:Math.PI}[view.angle];const halfHeight=Math.max(.90,.9/aspect);camera.left=-halfHeight*aspect;camera.right=halfHeight*aspect;camera.top=halfHeight;camera.bottom=-halfHeight;camera.near=.01;camera.far=20;camera.position.set(Math.sin(angle)*3,1.65,Math.cos(angle)*3);camera.lookAt(0,.62,.04);camera.updateProjectionMatrix();camera.updateMatrixWorld(true);}
 function apply(pose:MacawPose){
  if(!rig||!stage||!perch||!cup||!water||!floor)return;
  rig.apply(pose);const time=animator!.inspect().timeMs/1000;
  const movement=view.clip==='walk'?.22*Math.sin(time*.8):view.clip==='fly'?.12*Math.sin(time*.6):0;
  rig.root.position.set(movement,pose.grip*.42,0);if(shadow)shadow.position.x=movement;rig.root.rotation.y=view.clip==='walk'?.20*Math.cos(time*.8):0;
  const height=pose.grip*.42;perch.position.y=height-.035;perch.visible=height>.09;
  for(const support of supports){support.visible=height>.09;support.scale.y=Math.max(.001,height-.035);support.position.y=(height-.035)/2;}
  const feeding=view.clip==='eat'||view.clip==='drink';cup.visible=feeding;if(cupStand)cupStand.visible=feeding;water.visible=view.clip==='drink';fruit.forEach(m=>{m.visible=view.clip==='eat';});
  const w=world(),habitat=w.habitats[0];
  if(view.habitat&&habitat){const x=Math.min(...habitat.cells.map(c=>c.x))+1-w.width/2,z=Math.min(...habitat.cells.map(c=>c.z))+1-w.height/2;stage.scale.setScalar(MACAW_SCALE);stage.position.set(x,.079,z);floor.visible=false;}
  else {stage.scale.setScalar(1);stage.position.set(0,0,0);floor.visible=true;}
  group.updateMatrixWorld(true);
 }
 function release(){rig?.dispose();animator?.dispose();assets?.dispose();for(const g of geometries)g.dispose();geometries.length=0;group.clear();rig=undefined;animator=undefined;assets=undefined;stage=undefined;perch=undefined;supports=[];fruit=[];floor=undefined;shadow=undefined;cupStand=undefined;cup=undefined;water=undefined;lastFrame=null;}
 function command(command:StudioCommand,value?:string){
  if(disposed)return;
  if(command==='close'){if(!view.active)return;release();view={...view,active:false,habitat:false};group.visible=false;emit();return;}
  if(command==='open'){if(view.active)return;allocate();view={active:true,habitat:false,clip:'perch',angle:'quarter',motionPaused:reducedMotion(),canHabitat:world().habitats.length>0};group.visible=true;}
  else if(!view.active)return;
  else if(command==='clip'){if(!isMacawClip(value))return;view.clip=value;animator!.setClip(value,view.motionPaused);}
  else if(command==='angle'){if(!MACAW_ANGLES.includes(value as typeof view.angle))return;view.angle=value as typeof view.angle;}
  else if(command==='pause'){view.motionPaused=!view.motionPaused;lastFrame=null;}
  else if(command==='habitat'){if(!world().habitats.length)return;view.habitat=true;}
  else if(command==='detail')view.habitat=false;
  frameCamera();apply(animator!.pose());emit();
 }
 return {group,camera,command,view:()=>({...view}),resize(width:number,height:number){if(width>0&&height>0){aspect=width/height;frameCamera();}},
  setRunning(running:boolean){if(!running)lastFrame=null;},
  pauseForReducedMotion(){if(view.active&&!view.motionPaused){view.motionPaused=true;lastFrame=null;emit();}},
  frame(timestamp:number){if(!view.active||view.motionPaused||disposed)return;if(!Number.isFinite(timestamp)||timestamp<0)throw new RangeError('Invalid studio timestamp');const delta=lastFrame===null?0:Math.max(0,timestamp-lastFrame);lastFrame=lastFrame===null?timestamp:Math.max(timestamp,lastFrame);animator!.advance(delta);apply(animator!.pose());},
  dispose(){if(disposed)return;release();disposed=true;view.active=false;group.visible=false;},
  inspect:()=>({macawStudioActive:view.active,macawStudioInHabitat:view.habitat,macawStudioMotionPaused:view.motionPaused,macawStudioDisposed:disposed,macawClipIndex:['perch','walk','hop','fly','eat','drink','rest'].indexOf(view.clip),macawAngleIndex:MACAW_ANGLES.indexOf(view.angle),macawAnimationTimeMs:animator?.inspect().timeMs??0,macawStageGeometries:geometries.length,macawOwnedMaterialsLive:assets?1:0,macawGeometryBytes:assets?geometryBytes:0,macawModelTriangles:triangles,...(assets?.inspect()??{macawAssetGeometries:0,macawMaterials:0,macawTextures:0}),...(rig?.inspect()??{macawRigMeshes:0,macawRigDisposed:true})})};
}
