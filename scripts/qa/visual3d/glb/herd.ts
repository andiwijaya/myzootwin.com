import {AnimationMixer,Box3,Group,LoopOnce,Vector3,SkinnedMesh,type Object3D,type WebGLRenderer,type OrthographicCamera} from 'three';
import type {MasterManifest,MasterPool} from './pool.ts';
import {fitViewerCamera} from '../viewer-math.ts';
type Instance=ReturnType<MasterPool['instantiate']>;
type Context={pool:MasterPool;scene:Object3D;renderer:WebGLRenderer;camera:OrthographicCamera;perch:Group;ground:{position:Vector3;scale:Vector3};target:Vector3;invalidate:()=>void;cancelled:()=>boolean;capture:(name:string)=>Promise<unknown>;save:(name:string,value:unknown)=>Promise<unknown>;};
const resident=(species:string,variant:string)=>species==='macaw'?'macaw-'+(variant==='one'?'1':'2'):species+'-'+variant;
const signature=(i:Instance)=>{const out:number[]=[];i.scene.traverse(o=>{if(o.type==='Bone')out.push(...o.position.toArray(),...o.quaternion.toArray(),...o.scale.toArray());});return out;};
const same=(a:number[],b:number[])=>a.length===b.length&&a.every((n,i)=>Math.abs(n-b[i]!)<1e-10);

/** Concurrent actual GLBs; no engine, save, invented residents or hidden timers. */
export async function inspectHerd(manifest:MasterManifest,context:Context,job:string){
 const records=[];const order=['zebra','giraffe','elephant','lion','macaw'];
 for(const detail of ['high','low']){
  const selected=manifest.assets.filter(a=>a.category==='animal'&&a.detail===detail);if(selected.length!==14)throw Error('Expected all 14 baseline animal variants');
  const root=new Group(),families=new Map<string,Group>(),models:Array<{asset:typeof selected[number];instance:Instance;mixer:AnimationMixer;family:Group}> = [],allBones=new Set<object>();
  context.scene.add(root);context.perch.visible=false;context.ground.position.y=-.001;
  try{
   for(const [row,species]of order.entries()){
    const family=new Group();families.set(species,family);root.add(family);const members=selected.filter(a=>a.species===species);
    for(const [i,asset]of members.entries()){
     if(context.cancelled())throw new DOMException('Herd QA cancelled','AbortError');await context.pool.load(asset.id);const instance=context.pool.instantiate(asset.id);instance.scene.position.set((i-(members.length-1)/2)*2.5,species==='macaw'?.7:0,(row-2)*3.8);family.add(instance.scene);instance.scene.traverse(o=>{if(o.type==='Bone'){if(allBones.has(o))throw Error('Shared concurrent animal bones');allBones.add(o);}});const mixer=new AnimationMixer(instance.scene),clip=instance.animations.find(c=>c.name===(species==='macaw'?'perch':'idle'))??instance.animations[0];if(clip){const action=mixer.clipAction(clip);action.setLoop(LoopOnce,1);action.clampWhenFinished=true;action.play();mixer.setTime(.173*i);}models.push({asset,instance,mixer,family});
     if(species==='macaw'){const perch=context.perch.clone(true);perch.visible=true;perch.position.copy(instance.scene.position);family.add(perch);}
    }
   }
   root.updateMatrixWorld(true);const fit=(group:Group,angle=35)=>{group.updateMatrixWorld(true);group.traverse(o=>{if(o instanceof SkinnedMesh){o.skeleton.update();o.computeBoundingBox();}});const box=new Box3().setFromObject(group);context.target.copy(fitViewerCamera(context.camera,box,768,576,angle,1));const span=box.getSize(new Vector3()).length();context.ground.scale.set(span*3,span*3,1);context.ground.position.x=box.getCenter(new Vector3()).x;context.ground.position.z=box.getCenter(new Vector3()).z;context.invalidate();};
   fit(root);const overview=await context.capture(job+'/herd-'+detail+'/all-14.png'),familiesReviewed=[];
   for(const species of order){for(const [kind,group]of families)group.visible=kind===species;const family=families.get(species)!,members=models.filter(m=>m.asset.species===species),clips=species==='macaw'?['perch','fly','eat','drink','rest']:species==='zebra'?['walk','graze','drink','groom']:species==='giraffe'?['walk','browse','drink','social']:species==='lion'?['walk','eat','rest','scratch','roar']:['walk','eat','drink','bathe','spray','trunk-touch'],captures=[];
    for(const clipName of clips){if(context.cancelled())throw new DOMException('Herd QA cancelled','AbortError');for(const [index,m]of members.entries()){m.mixer.stopAllAction();const clip=m.instance.animations.find(c=>c.name===clipName);if(!clip)throw Error('Missing herd clip '+clipName);const action=m.mixer.clipAction(clip);action.setLoop(LoopOnce,1);action.clampWhenFinished=true;action.play();m.mixer.setTime(clip.duration*(.37+index*.08));m.instance.scene.updateMatrixWorld(true);}fit(family);captures.push({clip:clipName,capture:await context.capture(job+'/herd-'+detail+'/'+species+'-'+clipName+'.png')});}
    if(members.length>1){const first=members[0]!,second=members[1]!,before=signature(second.instance);first.mixer.setTime(.11);first.instance.scene.updateMatrixWorld(true);if(!same(before,signature(second.instance)))throw Error('Concurrent mixer changed another resident');}
    familiesReviewed.push({species,residents:members.map(m=>({id:resident(species,String(m.asset.variant)),masterId:m.asset.id,sha256:m.asset.sha256,bones:signature(m.instance).length/10})),independentPose:true,captures});
   }
   records.push({detail,individuals:models.length,bones:allBones.size,overview,families:familiesReviewed,status:'PASS'});
  }finally{for(const m of models){m.mixer.stopAllAction();m.mixer.uncacheRoot(m.instance.scene);context.pool.release(m.instance);context.pool.evict(m.asset.id);}root.removeFromParent();root.clear();context.renderer.renderLists.dispose();context.perch.visible=false;}
 }
 const result={job,at:new Date().toISOString(),scope:'Concurrent retained animal GLBs, all 14 source baseline identities, high/low and independent explicit-clock mixers; no gameplay/contact acceptance',records,pool:context.pool.inspect()};await context.save(job+'/result.json',result);return result;
}
