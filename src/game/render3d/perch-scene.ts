import {sceneOrigin} from '../world/scene-coordinates.ts';
import {CylinderGeometry,Group,IcosahedronGeometry,Mesh,MeshStandardMaterial} from 'three';
import {Batch} from './tropical-diorama.ts';
import {BIRD_PERCH_HEIGHT,perchAnchor,reachablePerch} from '../animals/resting.ts';
import type {WorldState} from '../core/state.ts';
/** Original two supported branches and leafy resting garden. Benefits are owned exclusively by simulation. */
export function createPerchScene(){
 const group=new Group(),leaves=new Group();group.name='Leafy rest perches';leaves.name='Rest foliage';let baseGeometry:ReturnType<Batch['geometry']>|undefined,leafGeometry:ReturnType<Batch['geometry']>|undefined,material:MeshStandardMaterial|undefined,base:Mesh|undefined;let active=false,disposed=false;
 function allocate(){const b=new Batch(),l=new Batch(),y=.079+BIRD_PERCH_HEIGHT-.035*.62,z=.5-.025*.62;
  for(const x of [-.5,.5]){b.add(new CylinderGeometry(.035*.62,.035*.62,.34,8).rotateZ(Math.PI/2),'#99754e',[x,y,z]);for(const dx of [-.15,.15]){b.add(new CylinderGeometry(.014,.014,y-.079,8),'#99754e',[x+dx,.079+(y-.079)/2,z]);b.add(new CylinderGeometry(.026,.026,.018,8).rotateZ(Math.PI/2),'#9eb577',[x+dx,y,z]);}}
  b.add(new CylinderGeometry(.10,.08,.12,8),'#bf8662',[0,.139,.22]);b.add(new CylinderGeometry(.089,.089,.01,8),'#735d44',[0,.204,.22]);b.add(new CylinderGeometry(.014,.02,.30,7),'#8f7651',[0,.355,.22]);
  for(const [x,y,z,s]of [[-.055,.48,.20,.09],[.05,.52,.24,.09],[0,.60,.21,.08],[-.04,.57,.19,.07],[.045,.59,.23,.065]])l.add(new IcosahedronGeometry(1,0),x<0?'#6c9e61':'#8ab371',[x,y,z],[s,s*.7,s*.65],x*4);
  baseGeometry=b.geometry();leafGeometry=l.geometry();material=new MeshStandardMaterial({vertexColors:true,roughness:1});base=new Mesh(baseGeometry,material);leaves.add(new Mesh(leafGeometry,material));group.add(base,leaves);
 }
 function release(){group.clear();leaves.clear();baseGeometry?.dispose();leafGeometry?.dispose();material?.dispose();baseGeometry=undefined;leafGeometry=undefined;material=undefined;base=undefined;}
 function sync(w:WorldState,preview:boolean,valid=true){if(disposed)return;const h=w.habitats[0],r=h?reachablePerch(w,h):undefined;active=Boolean(r||preview&&h);group.visible=active;if(!active){if(base)release();return;}if(!base)allocate();const p=perchAnchor(h!);group.position.set(p.x+1-sceneOrigin(w).x,0,p.z-sceneOrigin(w).z);material!.transparent=preview;material!.opacity=preview?.42:1;material!.depthWrite=!preview;material!.color.set(preview?(valid?'#8bd5a1':'#e58c79'):'#ffffff');group.updateMatrixWorld(true);}
 function update(time:number,exploring:number,reducedMotion:boolean){if(disposed||!active)return;leaves.rotation.z=!reducedMotion&&exploring>0?.018*Math.sin(time/600):0;}
 return {group,sync,update,dispose(){if(disposed)return;disposed=true;active=false;release();},inspect:()=>({restKitVisible:active,perchSceneDisposed:disposed,perchOwnedMaterials:base?1:0,perchGeometries:base?2:0,perchTriangles:baseGeometry&&leafGeometry?(baseGeometry.getAttribute('position').count+leafGeometry.getAttribute('position').count)/3:0,leafSway:leaves.rotation.z})};
}
