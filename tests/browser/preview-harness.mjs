import { runSelectionDomScenarios,selectGateForFixture } from './selection-dom-scenarios.mjs';
import { runCameraDomScenarios, beginInjectedCameraGesture } from './camera-dom-scenarios.mjs';
import { createFrameMetrics, legacyMemory, probeStatus } from './frame-metrics.mjs';
import { mountPreviewPanel } from '../../src/game-entry/preview-panel.ts';
import { mountFoundationScene } from '../../src/game/render3d/foundation-scene.ts';

const root=document.querySelector('[data-play-entry]');
const markup=root.innerHTML;
const output=document.querySelector('#qa-diagnostics');
let handle, previousHandle, mode='native', locale='en', releaseDelayed, fault;
let loads=0, active=0, maxActive=0, disposed=0, maxPending=0, lastDisposed=null, faultSource='none';
const pending=new Set();
const metrics=createFrameMetrics();
let lastReadout=0,readoutWrites=0,probeTimer,probe={status:'UNRUN'},heapSnapshots=[];
const heap=()=>{try{return legacyMemory(performance.memory);}catch{return legacyMemory(undefined);}};
function endProbe(reason){if(probeTimer)clearTimeout(probeTimer);probeTimer=undefined;if(probe.status==='COLLECTING')probe={...probe,status:reason,finishedAt:new Date().toISOString(),metrics:metrics.summary()};}
function update(){readoutWrites++;lastReadout=performance.now();output.textContent=JSON.stringify({mode,loads,activeSessions:active,maxActiveSessions:maxActive,pendingRAFs:pending.size,maxPendingRAFs:maxPending,canvasCount:root.querySelectorAll('canvas').length,state:handle?.inspect().state??'unmounted',session:handle?.inspect().session??null,lastDisposed,disposedSessions:disposed,faultSource,viewport:{width:innerWidth,height:innerHeight,dpr:devicePixelRatio,visibility:document.visibilityState},metrics:metrics.summary(),readoutWrites,probe,heap:heap(),heapSnapshots});}
const frames={
  request(callback){const id=requestAnimationFrame(time=>{pending.delete(id);const start=performance.now();callback(time);metrics.record(time,performance.now()-start);if(performance.now()-lastReadout>=250)update();});pending.add(id);maxPending=Math.max(maxPending,pending.size);return id;},
  cancel(id){pending.delete(id);cancelAnimationFrame(id);update();},
};
function factory(onFailure){
  endProbe('ABORTED_NEW_SESSION');metrics.reset();
  fault=onFailure;
  const options={frames};
  if(mode==='unsupported')options.createContext=()=>null;
  if(mode==='init-error')options.createRenderer=()=>{throw Error('injected constructor error');};
  const native=mountFoundationScene(root.querySelector('[data-preview-stage]'),onFailure,options);
  active++;maxActive=Math.max(maxActive,active);let ended=false;
  return {
    setPaused:value=>native.setPaused?.(value),
    camera:value=>native.camera?.(value),
    clearSelection:()=>native.clearSelection?.(),
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
document.querySelector('#qa-context').addEventListener('click',()=>{endProbe('ABORTED_CONTEXT');const gl=root.querySelector('canvas')?.getContext('webgl2');const ext=gl?.getExtension('WEBGL_lose_context');faultSource=ext?'injected WEBGL_lose_context':'extension unavailable';ext?.loseContext();update();});
document.querySelector('#qa-render').addEventListener('click',()=>{faultSource='injected render failure callback';fault?.('render');update();});
document.querySelector('#qa-unmount').addEventListener('click',()=>{endProbe('ABORTED_UNMOUNT');handle?.dispose();handle=undefined;root.replaceChildren();update();});
document.querySelector('#qa-remount').addEventListener('click',mount);
document.querySelector('#qa-pause').addEventListener('click',()=>{endProbe('ABORTED_PAUSE');handle?.setPaused(true);update();});
document.querySelector('#qa-resume').addEventListener('click',()=>{handle?.setPaused(false);update();});
document.querySelector('#qa-probe').addEventListener('click',()=>{
  endProbe('ABORTED_REPLACED');metrics.reset();
  probe={status:'COLLECTING',startedAt:new Date().toISOString(),startedPerfMs:performance.now(),startReadoutWrites:readoutWrites,startVisibility:document.visibilityState};
  probeTimer=setTimeout(()=>{probeTimer=undefined;probe={...probe,status:probeStatus({callbacks:metrics.summary().callbacksObserved,active:handle?.inspect().state.status==='ready'&&!handle?.inspect().session?.simulationPaused,visible:document.visibilityState==='visible',elapsedMs:performance.now()-probe.startedPerfMs}),elapsedMs:performance.now()-probe.startedPerfMs,readoutWritesDuringProbe:readoutWrites-probe.startReadoutWrites,finishedAt:new Date().toISOString(),metrics:metrics.summary()};update();},5000);
  update();
});
document.querySelector('#qa-memory').addEventListener('click',()=>{if(heapSnapshots.length>=16){probe={...probe,heapSnapshotBudgetExceeded:true};}else heapSnapshots.push({observedAt:new Date().toISOString(),state:handle?.inspect().state,heap:heap()});update();});
document.querySelector('#qa-stale').addEventListener('click',()=>{previousHandle?.dispose();update();});
document.querySelector('#qa-id').addEventListener('click',()=>{locale='id';handle?.setLocale(locale);update();});
document.querySelector('#qa-en').addEventListener('click',()=>{locale='en';handle?.setLocale(locale);update();});
document.querySelector('#qa-camera').addEventListener('click',()=>{const result=runCameraDomScenarios(root,()=>handle?.inspect().session,value=>handle?.setPaused(value));document.querySelector('#qa-camera-results').textContent=JSON.stringify(result);update();});
document.querySelector('#qa-camera-held').addEventListener('click',()=>{beginInjectedCameraGesture(root);update();});
document.querySelector('#qa-selection').addEventListener('click',()=>{let result;try{result=runSelectionDomScenarios(root,()=>handle?.inspect().session,value=>handle?.setPaused(value),value=>{locale=value;handle?.setLocale(value);});}catch(error){result={status:'FAIL',error:String(error)};}document.querySelector('#qa-selection-results').textContent=JSON.stringify(result);update();});
document.querySelector('#qa-select-gate').addEventListener('click',()=>{try{selectGateForFixture(root,()=>handle?.inspect().session);}catch(error){document.querySelector('#qa-selection-results').textContent=JSON.stringify({status:'FAIL',error:String(error)});}update();});
const observer=new MutationObserver(update);
observer.observe(root,{subtree:true,childList:true,attributes:true,attributeFilter:['data-renderer-state']});
const onVisibility=()=>{if(document.hidden){endProbe('ABORTED_HIDDEN');update();}};
document.addEventListener('visibilitychange',onVisibility);
window.addEventListener('pagehide',()=>{endProbe('ABORTED_PAGEHIDE');document.removeEventListener('visibilitychange',onVisibility);observer.disconnect();handle?.dispose();});
root.addEventListener('click',()=>queueMicrotask(()=>{if(handle?.inspect().state.status!=='ready')endProbe('ABORTED_CLOSED');update();}));
mount();
