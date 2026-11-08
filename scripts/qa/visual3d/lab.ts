import {WebGLRenderer,Mesh,SkinnedMesh,InstancedMesh,Sprite,Points,type Scene,type Camera,type Material,type Texture,type BufferGeometry,type Skeleton} from 'three';
import {mountFoundationScene} from '../../../src/game/render3d/foundation-scene.ts';
import type {PreviewSession} from '../../../src/game/render3d/preview-controller.ts';
import type {ZooSave} from '../../../src/game/core/zoo-state.ts';
import type {EditorState} from '../../../src/game/world/editing.ts';
import {validateSaveV4} from '../../../src/game/persistence/save-v4.ts';
import {loadVisualFixture} from './fixture.ts';
import {stateFingerprint as hash} from './state-fingerprint.ts';
import {runtimeProvenance} from './runtime-provenance.ts';
import {resetVisualConstructions} from './tagging.ts';

declare const __VIS3D_SOURCE__:string,__VIS3D_SOURCE_FINGERPRINT__:string,__VIS3D_FIXTURE_HASH__:string;
const stage=document.querySelector<HTMLElement>('#stage')!,out=document.querySelector<HTMLElement>('#result')!,status=document.querySelector<HTMLElement>('#status')!,open=document.querySelector<HTMLButtonElement>('#open')!,close=document.querySelector<HTMLButtonElement>('#close')!;
const errors:string[]=[],pending=new Set<number>();let session:PreviewSession|undefined,renderer:WebGLRenderer|undefined,world:Scene|undefined,camera:Camera|undefined,owners=0,maxOwners=0,submissions=0,editor:EditorState|undefined,latest:ZooSave|undefined,retired:Record<string,number|boolean>[]=[];
const recordError=(e:unknown)=>{if(errors.length<20)errors.push(String(e));};
window.addEventListener('error',e=>recordError(e.message));window.addEventListener('unhandledrejection',e=>recordError(e.reason));
const fixture=await loadVisualFixture();latest=structuredClone(fixture.state);
function catalogue(){
 const geometries=new Set<BufferGeometry>(),materials=new Set<Material>(),textures=new Set<Texture>(),skeletons=new Set<Skeleton>(),names:string[]=[];let meshes=0,skinned=0,instances=0,sprites=0,points=0;
 world?.traverse(o=>{if(o.name)names.push(o.name);if(o instanceof Mesh){meshes++;geometries.add(o.geometry);for(const m of Array.isArray(o.material)?o.material:[o.material]){materials.add(m);for(const v of Object.values(m))if(v&&typeof v==='object'&&'isTexture'in v)textures.add(v as Texture);}}if(o instanceof SkinnedMesh){skinned++;skeletons.add(o.skeleton);if(o.skeleton.boneTexture)textures.add(o.skeleton.boneTexture);}if(o instanceof InstancedMesh)instances+=o.count;if(o instanceof Sprite)sprites++;if(o instanceof Points)points++;});
 return {meshes,skinned,instancedInstances:instances,sprites,points,uniqueGeometries:geometries.size,uniqueMaterials:materials.size,explicitOrSkeletonTextures:textures.size,skeletons:skeletons.size,cameraType:camera?.type,rendererGeometries:renderer?.info.memory.geometries,provenance:runtimeProvenance(world),names};
}
async function report(){
 const checked=latest&&validateSaveV4(latest);out.textContent=JSON.stringify({at:new Date().toISOString(),source:__VIS3D_SOURCE__,sourceFingerprint:__VIS3D_SOURCE_FINGERPRINT__,fixtureId:'frozen-earned-v4',fixtureFileHash:__VIS3D_FIXTURE_HASH__,database:fixture.database,revision:fixture.revision,scope:'QA-only actual mountFoundationScene with strict-valid synthetic V4, no mock engine, no player DB',runner:'internal-browser-only',physicalDevice:false,presentedFps:null,presentedFpsStatus:'UNMEASURED',viewport:{width:innerWidth,height:innerHeight,documentWidth:document.documentElement.scrollWidth},state:{schema:latest?.schemaVersion,tick:latest?.tick,cash:latest?.currency,habitats:latest?.world.habitats.length,residents:latest?.animals.length,sha256:await hash(latest),fixtureSha256:await hash(fixture.state),valid:checked?.ok===true},owners,maxOwners,pendingRafCallbacks:pending.size,submissions,renderer:session?.inspect?.(),runtime:catalogue(),retired,errors},null,2);
}
function dispose(){if(session){session.dispose();retired.push(session.inspect?.()??{});if(retired.length>20)retired.shift();session=undefined;owners--;world=undefined;camera=undefined;renderer=undefined;}open.disabled=false;close.disabled=true;status.textContent='Scene ditutup · database QA dipertahankan';void report();}
function mount(){
 if(session||owners)return;
 try{
  latest=structuredClone(fixture.state);editor=undefined;resetVisualConstructions();
  const created=mountFoundationScene(stage,reason=>{recordError(reason);status.textContent='Renderer gagal: '+reason;},{stateStore:{read:()=>structuredClone(latest),write:s=>{const check=validateSaveV4(s);if(!check.ok)throw Error('Production emitted invalid V4');latest=structuredClone(s);},readEditor:()=>editor,writeEditor:s=>{editor=structuredClone(s);}},frames:{request(fn){const id=requestAnimationFrame(t=>{pending.delete(id);fn(t);});pending.add(id);return id;},cancel(id){pending.delete(id);cancelAnimationFrame(id);}},createRenderer(canvas,context){
   const real=new WebGLRenderer({canvas,context,antialias:true,alpha:false});renderer=real;const render=real.render.bind(real);real.render=(scene,view)=>{world=scene as Scene;camera=view;render(scene,view);submissions++;};return real;
  }});
  session=created;owners++;maxOwners=Math.max(maxOwners,owners);created.setPaused?.(true);open.disabled=true;close.disabled=false;status.textContent='Scene produksi siap · 4 habitat / 10 satwa · dijeda';void report();
 }catch(e){recordError(e);status.textContent='Tidak dapat membuka renderer produksi';void report();}
}
open.addEventListener('click',mount);close.addEventListener('click',dispose);document.querySelector('#inspect')!.addEventListener('click',()=>{void report();});
window.addEventListener('pagehide',()=>{dispose();fixture.close();},{once:true});status.textContent='Fixture V4 valid · siap dibuka';void report();
