import {Group,Mesh} from 'three';
import {MACAW_PIVOTS,type MacawAssets,type MacawPart} from './macaw-geometry.ts';
import type {MacawPose} from './macaw-animation.ts';
/** Independent transforms; immutable geometry/material borrowed from one explicitly owned asset set. */
export function createMacawRig(assets:MacawAssets){
 const root=new Group(),motion=new Group(),body=new Group();root.name='Ara ararauna';root.add(motion);motion.add(body);
 const mesh=(name:MacawPart)=>{const m=new Mesh(assets.geometries[name],assets.material);m.name=name;m.receiveShadow=true;return m;};
 body.position.set(...MACAW_PIVOTS.body);body.add(mesh('body'));
 const pivot=(name:keyof typeof MACAW_PIVOTS)=>{const p=new Group(),v=MACAW_PIVOTS[name];p.name=name;p.position.set(v[0],v[1]-MACAW_PIVOTS.body[1],v[2]);body.add(p);return p;};
 const head=pivot('head');head.add(mesh('head'));const lids=mesh('eyelids');head.add(lids);
 const jaw=new Group();jaw.position.set(0,MACAW_PIVOTS.jaw[1]-MACAW_PIVOTS.head[1],MACAW_PIVOTS.jaw[2]-MACAW_PIVOTS.head[2]);jaw.add(mesh('jaw'));head.add(jaw);
 const left=pivot('wingLeft'),right=pivot('wingRight');left.add(mesh('wingLeft'));right.add(mesh('wingRight'));
 const foreLeft=new Group(),foreRight=new Group();foreLeft.position.set(-.22,-.012,-.035);foreRight.position.set(.22,-.012,-.035);foreLeft.add(mesh('foreLeft'));foreRight.add(mesh('foreRight'));left.add(foreLeft);right.add(foreRight);
 const tail=pivot('tail');tail.add(mesh('tail'));
 const feet=[new Group(),new Group()];const footMeshes=feet.map((p,i)=>{p.position.set(i===0?-.075:.075,0,.025);const m=mesh('gripFoot');p.add(m);motion.add(p);return m;});let disposed=false;
 function apply(p:MacawPose){if(disposed)return;motion.position.y=p.lift;body.position.y=.16+p.bob;body.rotation.x=p.bodyPitch;head.rotation.set(p.headPitch,p.headYaw,0);jaw.rotation.x=p.jaw;tail.rotation.x=p.tailPitch;left.rotation.z=p.wingLeft;right.rotation.z=p.wingRight;foreLeft.rotation.y=p.elbowLeft;foreRight.rotation.y=p.elbowRight;feet[0].position.y=p.leftLift;feet[1].position.y=p.rightLift;feet[0].position.z=.025+p.leftStep;feet[1].position.z=.025+p.rightStep;for(const [i,foot]of feet.entries()){foot.rotation.x=p.footPitch;footMeshes[i].geometry=assets.geometries[p.grip>=.5?'gripFoot':'flatFoot'];}lids.visible=p.eyesClosed>.5;root.updateMatrixWorld(true);}
 return {root,apply,dispose(){if(disposed)return;disposed=true;root.clear();},inspect:()=>({macawRigDisposed:disposed,macawRigMeshes:disposed?0:10+(lids.visible?1:0),macawFootGrip:footMeshes[0].geometry===assets.geometries.gripFoot})};
}
