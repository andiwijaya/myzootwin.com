import {OrthographicCamera,Vector3} from 'three';
import {mountFoundationScene} from '../../src/game/render3d/foundation-scene.ts';
import type {PreviewSession} from '../../src/game/render3d/preview-controller.ts';
import {createTropicalDiorama} from '../../src/game/render3d/tropical-diorama.ts';
import {fitIsometricCamera} from '../../src/game/render3d/isometric-camera.ts';
import {sanctuarySessionFor} from '../../src/game/core/session-state.ts';
import {appendElephantZone} from '../../src/game/world/elephant-expansion.ts';
import {toScene} from '../../src/game/world/scene-coordinates.ts';
import {parseSave} from '../../src/game/persistence/save-v1.ts';
import frozen from '../fixtures/elephant-legacy-v1.json';
const host=document.querySelector<HTMLElement>('#world')!,output=document.querySelector<HTMLElement>('#result')!;
const parsed=parseSave(JSON.stringify(frozen.entries.q04Claimed.state));if(!parsed.ok)throw Error('Invalid frozen source');
const initial=parsed.value;initial.world=appendElephantZone(initial.world);initial.preferences.speed=1;
const store=sanctuarySessionFor(host);store.write(initial);
const scenery=createTropicalDiorama(initial.world),bounds=scenery.bounds.clone();scenery.geometries.forEach(g=>g.dispose());scenery.materials.forEach(m=>m.dispose());
let session:PreviewSession|undefined,lastDisposed:Record<string,number|boolean>|null=null,selected:unknown=null,failure:string|null=null,lastRead=0,maxPending=0;
const pending=new Set<number>();
function update(){output.textContent=JSON.stringify({method:'compiled actual foundation renderer; prebuilt synthetic expanded world; labelled injected picks',at:new Date().toISOString(),width:innerWidth,height:innerHeight,canvas:host.querySelectorAll('canvas').length,pendingRAFs:pending.size,maxPending,selected,failure,session:session?.inspect?.()??null,lastDisposed},null,2);}
const frames={request(callback:FrameRequestCallback){const id=requestAnimationFrame(time=>{pending.delete(id);callback(time);if(time-lastRead>=250){lastRead=time;update();}});pending.add(id);maxPending=Math.max(maxPending,pending.size);return id;},cancel(id:number){pending.delete(id);cancelAnimationFrame(id);}};
function close(){if(session){session.dispose();lastDisposed=session.inspect?.()??null;session=undefined;}update();}
function open(){close();failure=null;selected=null;session=mountFoundationScene(host,kind=>{failure=kind;update();},{stateStore:store,frames});update();}
host.addEventListener('scene-selection-change',event=>{selected=(event as CustomEvent).detail;update();});
function pick(cell:{x:number;z:number}){
  const view=session?.inspect?.(),canvas=host.querySelector('canvas');if(!view||!canvas)return;
  const rect=canvas.getBoundingClientRect(),camera=new OrthographicCamera();fitIsometricCamera(camera,bounds,rect.width/rect.height,Number(view.cameraAzimuth)*Math.PI/180);
  camera.position.add(new Vector3(Number(view.cameraPanX),0,Number(view.cameraPanZ)));camera.zoom=Number(view.cameraZoom);camera.updateProjectionMatrix();camera.updateMatrixWorld(true);
  const p=toScene(cell,initial.world),v=new Vector3(p.x,.055,p.z).project(camera),data={pointerId:7,button:0,buttons:1,clientX:rect.left+(v.x+1)*rect.width/2,clientY:rect.top+(1-v.y)*rect.height/2,bubbles:true,cancelable:true};
  canvas.dispatchEvent(new PointerEvent('pointerdown',data));canvas.dispatchEvent(new PointerEvent('pointerup',{...data,buttons:0}));update();
}
document.querySelector('#open')!.addEventListener('click',open);document.querySelector('#close')!.addEventListener('click',close);
document.querySelector('#rotate')!.addEventListener('click',()=>{session?.camera?.('rotate-right');update();});
document.querySelector('#zoom')!.addEventListener('click',()=>{session?.camera?.('zoom-in');update();});
document.querySelector('#reset')!.addEventListener('click',()=>{session?.camera?.('reset');update();});
document.querySelector('#old')!.addEventListener('click',()=>pick({x:4,z:4}));document.querySelector('#grove')!.addEventListener('click',()=>pick({x:5,z:13}));
window.addEventListener('pagehide',close);open();
