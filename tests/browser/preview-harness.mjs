import { mountPreviewPanel } from '../../src/game-entry/preview-panel.ts';
import { mountFoundationScene } from '../../src/game/render3d/foundation-scene.ts';

const root=document.querySelector('[data-play-entry]');
const markup=root.innerHTML;
const output=document.querySelector('#qa-diagnostics');
let handle, previousHandle, mode='native', locale='en', releaseDelayed, fault;
let loads=0, active=0, maxActive=0, disposed=0, maxPending=0, lastDisposed=null, faultSource='none';
const pending=new Set();
function update(){output.textContent=JSON.stringify({mode,loads,activeSessions:active,maxActiveSessions:maxActive,pendingRAFs:pending.size,maxPendingRAFs:maxPending,canvasCount:root.querySelectorAll('canvas').length,state:handle?.inspect().state??'unmounted',session:handle?.inspect().session??null,lastDisposed,disposedSessions:disposed,faultSource});}
const frames={
  request(callback){const id=requestAnimationFrame(time=>{pending.delete(id);callback(time);update();});pending.add(id);maxPending=Math.max(maxPending,pending.size);update();return id;},
  cancel(id){pending.delete(id);cancelAnimationFrame(id);update();},
};
function factory(onFailure){
  fault=onFailure;
  const options={frames};
  if(mode==='unsupported')options.createContext=()=>null;
  if(mode==='init-error')options.createRenderer=()=>{throw Error('injected constructor error');};
  const native=mountFoundationScene(root.querySelector('[data-preview-stage]'),onFailure,options);
  active++;maxActive=Math.max(maxActive,active);let ended=false;
  return {
    setPaused:value=>native.setPaused?.(value),
    inspect:()=>native.inspect?.(),
    dispose(){if(ended)return;ended=true;native.dispose();active--;disposed++;lastDisposed=native.inspect?.();update();},
  };
}
async function load(){
  loads++;update();
  if(mode==='load-error')throw Error('injected import failure');
  if(mode==='slow')return new Promise(resolve=>{releaseDelayed=()=>resolve(factory);});
  return factory;
}
function mount(){if(!root.firstElementChild)root.innerHTML=markup;previousHandle=handle;handle=mountPreviewPanel(root,{loadRenderer:load});handle.setLocale(locale);update();}
document.querySelector('#qa-apply').addEventListener('click',()=>{mode=document.querySelector('#qa-mode').value;faultSource=mode==='native'?'none':mode;mount();});
document.querySelector('#qa-release').addEventListener('click',()=>{releaseDelayed?.();releaseDelayed=undefined;queueMicrotask(update);});
document.querySelector('#qa-context').addEventListener('click',()=>{const gl=root.querySelector('canvas')?.getContext('webgl2');const ext=gl?.getExtension('WEBGL_lose_context');faultSource=ext?'injected WEBGL_lose_context':'extension unavailable';ext?.loseContext();update();});
document.querySelector('#qa-render').addEventListener('click',()=>{faultSource='injected render failure callback';fault?.('render');update();});
document.querySelector('#qa-unmount').addEventListener('click',()=>{handle?.dispose();handle=undefined;root.replaceChildren();update();});
document.querySelector('#qa-remount').addEventListener('click',mount);
document.querySelector('#qa-pause').addEventListener('click',()=>{handle?.setPaused(true);update();});
document.querySelector('#qa-resume').addEventListener('click',()=>{handle?.setPaused(false);update();});
document.querySelector('#qa-stale').addEventListener('click',()=>{previousHandle?.dispose();update();});
document.querySelector('#qa-id').addEventListener('click',()=>{locale='id';handle?.setLocale(locale);update();});
document.querySelector('#qa-en').addEventListener('click',()=>{locale='en';handle?.setLocale(locale);update();});
const observer=new MutationObserver(update);
observer.observe(root,{subtree:true,childList:true,attributes:true,attributeFilter:['data-renderer-state']});
window.addEventListener('pagehide',()=>{observer.disconnect();handle?.dispose();});
root.addEventListener('click',()=>queueMicrotask(update));
mount();
