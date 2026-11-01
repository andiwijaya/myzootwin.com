import {satisfactionFixture,runSatisfactionDomScenarios} from './visitor-satisfaction-dom-scenarios.mjs';
import {runVisitorNavigationDomScenarios} from './visitor-navigation-dom-scenarios.mjs';
import {runVisitorDomScenarios} from './visitor-dom-scenarios.mjs';
import {welfareFixture,runWelfareDomScenarios} from './welfare-dom-scenarios.mjs';
import{runRestDomScenarios}from'./resting-dom-scenarios.mjs';
import{runWaterDomScenarios}from'./watering-dom-scenarios.mjs';
import{runFeedingDomScenarios}from'./feeding-dom-scenarios.mjs';
import{runAnimalDomScenarios}from'./animal-dom-scenarios.mjs';
import{runMacawDomScenarios}from'./macaw-dom-scenarios.mjs';
import{runEditingDomScenarios}from'./editing-dom-scenarios.mjs';
import{runPathDomScenarios}from'./path-dom-scenarios.mjs';
import {sanctuarySessionFor} from '../../src/game/core/session-state.ts';
import {runPlacementDomScenarios} from './placement-dom-scenarios.mjs';
import { runSelectionDomScenarios,selectGateForFixture } from './selection-dom-scenarios.mjs';
import { runCameraDomScenarios, beginInjectedCameraGesture } from './camera-dom-scenarios.mjs';
import { createFrameMetrics, legacyMemory, probeStatus, isRenderProbeActive } from './frame-metrics.mjs';
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
  const options={frames,stateStore:sanctuarySessionFor(root)};
  if(mode==='unsupported')options.createContext=()=>null;
  if(mode==='init-error')options.createRenderer=()=>{throw Error('injected constructor error');};
  const native=mountFoundationScene(root.querySelector('[data-preview-stage]'),onFailure,options);
  active++;maxActive=Math.max(maxActive,active);let ended=false;
  return {
    setPaused:value=>native.setPaused?.(value),
    food:(command,revision)=>native.food?.(command,revision),
    water:(command,revision)=>native.water?.(command,revision),
    perch:(command,revision)=>native.perch?.(command,revision),
    birds:command=>native.birds?.(command),
    visitors:command=>native.visitors?.(command),
    studio:(command,value)=>native.studio?.(command,value),
    camera:value=>native.camera?.(value),
    clearSelection:()=>native.clearSelection?.(),
    placement:(command,revision)=>native.placement?.(command,revision),
    quoteRemoval:target=>native.quoteRemoval?.(target),edit:(command,quote)=>native.edit?.(command,quote),
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
  const s=handle?.inspect().session;
  probe={scope:s?.macawStudioActive?(s.macawStudioInHabitat?'macaw-habitat-scale':'macaw-studio-detail'):'world-foundation',simulationPausedAtStart:s?.simulationPaused??null,status:'COLLECTING',startedAt:new Date().toISOString(),startedPerfMs:performance.now(),startReadoutWrites:readoutWrites,startVisibility:document.visibilityState};
  probeTimer=setTimeout(()=>{probeTimer=undefined;probe={...probe,status:probeStatus({callbacks:metrics.summary().callbacksObserved,active:isRenderProbeActive(handle?.inspect().state.status,handle?.inspect().session),visible:document.visibilityState==='visible',elapsedMs:performance.now()-probe.startedPerfMs}),elapsedMs:performance.now()-probe.startedPerfMs,readoutWritesDuringProbe:readoutWrites-probe.startReadoutWrites,finishedAt:new Date().toISOString(),metrics:metrics.summary()};update();},5000);
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
const placementRun=document.createElement('button');placementRun.id='qa-placement';placementRun.textContent='Run injected placement checks';document.querySelector('#qa-selection').after(placementRun);
const placementOutput=document.createElement('output');placementOutput.id='qa-placement-results';placementRun.after(placementOutput);
placementRun.addEventListener('click',async()=>{let result;try{result=await runPlacementDomScenarios(root,()=>handle?.inspect().session,value=>handle?.setPaused(value),value=>{locale=value;handle?.setLocale(value);});}catch(error){result={status:'FAIL',error:String(error)};}placementOutput.textContent=JSON.stringify(result);update();});
const pathRun=document.createElement('button');pathRun.id='qa-path';pathRun.textContent='Run injected path checks';document.querySelector('#qa-placement').after(pathRun);
const pathOutput=document.createElement('output');pathOutput.id='qa-path-results';pathRun.after(pathOutput);
pathRun.addEventListener('click',async()=>{let result;try{result=await runPathDomScenarios(root,()=>handle?.inspect().session,value=>handle?.setPaused(value),value=>{locale=value;handle?.setLocale(value);});}catch(error){result={status:'FAIL',error:String(error)};}pathOutput.textContent=JSON.stringify(result);update();});
const editRun=document.createElement('button');editRun.id='qa-edit';editRun.textContent='Run injected editing checks';pathRun.after(editRun);
const editOutput=document.createElement('output');editOutput.id='qa-edit-results';editRun.after(editOutput);
editRun.addEventListener('click',async()=>{let result;try{result=await runEditingDomScenarios(root,()=>handle?.inspect().session,value=>{locale=value;handle?.setLocale(value);});}catch(error){result={status:'FAIL',error:String(error)};}editOutput.textContent=JSON.stringify(result);update();});
const macawRun=document.createElement('button');macawRun.id='qa-macaw';macawRun.textContent='Run injected macaw checks';editRun.after(macawRun);
const macawOutput=document.createElement('output');macawOutput.id='qa-macaw-results';macawRun.after(macawOutput);
macawRun.addEventListener('click',async()=>{if(macawRun.disabled)return;macawRun.disabled=true;macawOutput.textContent=JSON.stringify({status:'RUNNING'});let result;try{result=await runMacawDomScenarios(root,()=>handle?.inspect().session,value=>{locale=value;handle?.setLocale(value);});}catch(error){result={status:'FAIL',error:String(error)};}macawOutput.textContent=JSON.stringify(result);macawRun.disabled=false;update();});
const animalRun=document.createElement('button');animalRun.id='qa-animals';animalRun.textContent='Run live two-bird checks';macawRun.after(animalRun);
const animalOutput=document.createElement('output');animalOutput.id='qa-animal-results';animalRun.after(animalOutput);
animalRun.addEventListener('click',async()=>{animalOutput.textContent=JSON.stringify({status:'RUNNING'});const result=await runAnimalDomScenarios(root,()=>handle?.inspect().session,value=>handle?.setPaused(value),value=>{locale=value;handle?.setLocale(value);});animalOutput.textContent=JSON.stringify(result);update();});
const feedingRun=document.createElement('button');feedingRun.id='qa-feeding';feedingRun.textContent='Run real-time feeding checks';animalRun.after(feedingRun);
const feedingOutput=document.createElement('output');feedingOutput.id='qa-feeding-results';feedingRun.after(feedingOutput);
feedingRun.addEventListener('click',async()=>{feedingOutput.textContent=JSON.stringify({status:'RUNNING'});const result=await runFeedingDomScenarios(root,()=>handle?.inspect().session,value=>handle?.setPaused(value),value=>{locale=value;handle?.setLocale(value);});feedingOutput.textContent=JSON.stringify(result);update();});
const waterRun=document.createElement('button');waterRun.id='qa-water';waterRun.textContent='Run real-time water checks';feedingRun.after(waterRun);
const waterOutput=document.createElement('output');waterOutput.id='qa-water-results';waterRun.after(waterOutput);
waterRun.addEventListener('click',async()=>{waterOutput.textContent=JSON.stringify({status:'RUNNING'});const result=await runWaterDomScenarios(root,()=>handle?.inspect().session,value=>handle?.setPaused(value),value=>{locale=value;handle?.setLocale(value);});waterOutput.textContent=JSON.stringify(result);update();});
const eatingFreeze=document.createElement('button');eatingFreeze.id='qa-feeding-freeze';eatingFreeze.textContent='Pause next real eating pose';feedingRun.after(eatingFreeze);
const eatingOutput=document.createElement('output');eatingOutput.id='qa-feeding-freeze-results';eatingFreeze.after(eatingOutput);
eatingFreeze.addEventListener('click',async()=>{handle?.setPaused(false);eatingOutput.textContent=JSON.stringify({status:'WAITING_FOR_NATIVE_EATING_FRAME'});const start=performance.now(),entered=[null,null];while(performance.now()-start<35000){await new Promise(r=>requestAnimationFrame(r));const s=handle?.inspect().session;if(!s)break;for(let i=0;i<2;i++){const eat=s[`bird${i+1}Phase`]===8;if(eat&&entered[i]===null)entered[i]=s.simulationTick;if(!eat)entered[i]=null;}if(entered.some(t=>t!==null&&s.simulationTick-t>=13)){handle?.setPaused(true);eatingOutput.textContent=JSON.stringify({status:'OBSERVED_AND_PAUSED',method:'real simulation reached eat, then QA pause; no pose/state/time injection',observedAt:new Date().toISOString(),session:handle?.inspect().session});update();return;}}eatingOutput.textContent=JSON.stringify({status:'UNRUN_TIMEOUT_NO_EATING_FRAME'});update();});
const waterFreeze=document.createElement('button');waterFreeze.id='qa-water-freeze';waterFreeze.textContent='Pause next real drinking pose';waterRun.after(waterFreeze);
const waterFreezeOutput=document.createElement('output');waterFreezeOutput.id='qa-water-freeze-results';waterFreeze.after(waterFreezeOutput);
waterFreeze.addEventListener('click',async()=>{handle?.setPaused(false);waterFreezeOutput.textContent=JSON.stringify({status:'WAITING_FOR_NATIVE_DRINKING_FRAME'});const start=performance.now(),entered=[null,null];while(performance.now()-start<35000){await new Promise(r=>requestAnimationFrame(r));const s=handle?.inspect().session;if(!s)break;for(let i=0;i<2;i++){const eat=s[`bird${i+1}Phase`]===11;if(eat&&entered[i]===null)entered[i]=s.simulationTick;if(!eat)entered[i]=null;}if(entered.some(t=>t!==null&&s.simulationTick-t>=4)){handle?.setPaused(true);waterFreezeOutput.textContent=JSON.stringify({status:'OBSERVED_AND_PAUSED',method:'real simulation reached drink, then QA pause; no pose/state/time injection',observedAt:new Date().toISOString(),session:handle?.inspect().session});update();return;}}waterFreezeOutput.textContent=JSON.stringify({status:'UNRUN_TIMEOUT_NO_DRINKING_FRAME'});update();});
const restRun=document.createElement('button');restRun.id='qa-rest';restRun.textContent='Run real rest and enrichment checks';waterRun.after(restRun);
const restOutput=document.createElement('output');restOutput.id='qa-rest-results';restRun.after(restOutput);
restRun.addEventListener('click',async()=>{restOutput.textContent=JSON.stringify({status:'RUNNING'});const result=await runRestDomScenarios(root,()=>handle?.inspect().session,value=>handle?.setPaused(value),value=>{locale=value;handle?.setLocale(value);});restOutput.textContent=JSON.stringify(result);update();});
for(const [name,phase]of [['rest',18],['enrich',19]]){const button=document.createElement('button');button.id=`qa-${name}-freeze`;button.textContent=`Pause next real ${name} pose`;restRun.after(button);const out=document.createElement('output');out.id=`qa-${name}-freeze-results`;button.after(out);button.addEventListener('click',async()=>{handle?.setPaused(false);out.textContent=JSON.stringify({status:'WAITING_FOR_REAL_'+name.toUpperCase()});const start=performance.now(),entered=[null,null];while(performance.now()-start<90000){await new Promise(r=>requestAnimationFrame(r));const s=handle?.inspect().session;if(!s)break;for(let i=0;i<2;i++){const active=s[`bird${i+1}Phase`]===phase;if(active&&entered[i]===null)entered[i]=s.simulationTick;if(!active)entered[i]=null;}if(entered.some(t=>t!==null&&s.simulationTick-t>=4)){handle?.setPaused(true);out.textContent=JSON.stringify({status:'OBSERVED_AND_PAUSED',method:'Real simulation reached '+name+', then QA pause after4ticks; no state/time/pose injection',observedAt:new Date().toISOString(),session:handle?.inspect().session});update();return;}}out.textContent=JSON.stringify({status:'UNRUN_TIMEOUT_NO_'+name.toUpperCase()});update();});}
async function seedWelfare(name){endProbe('ABORTED_INJECTED_WELFARE_SEED');handle?.close();sanctuarySessionFor(root).write(welfareFixture(name));sanctuarySessionFor(root).writeEditor({revision:0,undo:null});handle?.setPaused(true);root.querySelector('[data-preview-open]').click();for(let i=0;i<4;i++)await new Promise(r=>requestAnimationFrame(r));handle?.setPaused(true);update();}
const welfareRun=document.createElement('button');welfareRun.id='qa-welfare';welfareRun.textContent='Run labelled injected welfare checks';restRun.after(welfareRun);const welfareOutput=document.createElement('output');welfareOutput.id='qa-welfare-results';welfareRun.after(welfareOutput);welfareRun.addEventListener('click',async()=>{welfareOutput.textContent=JSON.stringify({status:'RUNNING'});const result=await runWelfareDomScenarios(root,()=>handle?.inspect().session,v=>handle?.setPaused(v),v=>{locale=v;handle?.setLocale(v);},seedWelfare,async()=>{handle?.close();mount();handle?.setPaused(true);root.querySelector('[data-preview-open]').click();for(let i=0;i<4;i++)await new Promise(r=>requestAnimationFrame(r));update();});welfareOutput.textContent=JSON.stringify(result);update();});
for(const name of ['critical','healthy']){const b=document.createElement('button');b.id='qa-welfare-'+name;b.textContent='Inject '+name+' welfare fixture (QA only)';welfareRun.after(b);b.addEventListener('click',()=>void seedWelfare(name));}
// QA-only document visibility override: exercises the real visibility listener without
// claiming the isolated browser physically backgrounded a tab. Never ships in dist.
const visibilityDescriptors={hidden:Object.getOwnPropertyDescriptor(document,'hidden'),visibilityState:Object.getOwnPropertyDescriptor(document,'visibilityState')};
let injectedHidden=false;
function restoreVisibility(){for(const key of ['hidden','visibilityState']){const descriptor=visibilityDescriptors[key];if(descriptor)Object.defineProperty(document,key,descriptor);else delete document[key];}injectedHidden=false;document.dispatchEvent(new Event('visibilitychange'));update();}
for(const hidden of [true,false]){const button=document.createElement('button');button.id=hidden?'qa-hidden':'qa-visible';button.textContent=hidden?'Inject document hidden (QA only)':'Restore native visibility (QA only)';document.querySelector('#qa-toolbar').append(button);button.addEventListener('click',()=>{if(hidden){Object.defineProperty(document,'hidden',{configurable:true,get:()=>true});Object.defineProperty(document,'visibilityState',{configurable:true,get:()=>'hidden'});injectedHidden=true;document.dispatchEvent(new Event('visibilitychange'));update();}else restoreVisibility();});}
window.addEventListener('pagehide',()=>{if(injectedHidden)restoreVisibility();},{once:true});
const visitorRun=document.createElement('button');visitorRun.id='qa-visitors';visitorRun.textContent='Run real entrance-arrival checks';welfareRun.after(visitorRun);const visitorOutput=document.createElement('output');visitorOutput.id='qa-visitors-results';visitorRun.after(visitorOutput);visitorRun.addEventListener('click',async()=>{if(visitorRun.disabled)return;visitorRun.disabled=true;visitorOutput.textContent=JSON.stringify({status:'RUNNING'});try{visitorOutput.textContent=JSON.stringify(await runVisitorDomScenarios(root,()=>handle?.inspect().session,v=>handle?.setPaused(v),v=>{locale=v;handle?.setLocale(v);}));}finally{visitorRun.disabled=false;update();}});
const navRun=document.createElement('button');navRun.id='qa-visitor-navigation';navRun.textContent='Run real visitor path/view/return checks';visitorOutput.after(navRun);const navOutput=document.createElement('output');navOutput.id='qa-visitor-navigation-results';navRun.after(navOutput);navRun.addEventListener('click',async()=>{if(navRun.disabled)return;navRun.disabled=true;navOutput.textContent=JSON.stringify({status:'RUNNING'});try{navOutput.textContent=JSON.stringify(await runVisitorNavigationDomScenarios(root,()=>handle?.inspect().session,v=>handle?.setPaused(v),v=>{locale=v;handle?.setLocale(v);}));}finally{navRun.disabled=false;update();}});
async function seedSatisfaction(name){endProbe('ABORTED_EXPLICIT_SATISFACTION_SEED');handle?.close();sanctuarySessionFor(root).write(satisfactionFixture(name));sanctuarySessionFor(root).writeEditor({revision:0,undo:null});handle?.setPaused(true);root.querySelector('[data-preview-open]').click();for(let i=0;i<4;i++)await new Promise(r=>requestAnimationFrame(r));handle?.setPaused(true);update();}
const satRun=document.createElement('button');satRun.id='qa-satisfaction';satRun.textContent='Run labelled visitor satisfaction checks';navOutput.after(satRun);const satOutput=document.createElement('output');satOutput.id='qa-satisfaction-results';satRun.after(satOutput);satRun.addEventListener('click',async()=>{if(satRun.disabled)return;satRun.disabled=true;satOutput.textContent=JSON.stringify({status:'RUNNING'});try{satOutput.textContent=JSON.stringify(await runSatisfactionDomScenarios(root,()=>handle?.inspect().session,v=>handle?.setPaused(v),v=>{locale=v;handle?.setLocale(v);},seedSatisfaction,async()=>{handle?.close();mount();handle?.setPaused(true);root.querySelector('[data-preview-open]').click();for(let i=0;i<4;i++)await new Promise(r=>requestAnimationFrame(r));update();}));}finally{satRun.disabled=false;update();}});
// Approved local fixture orchestration: actual product/scenario buttons, no browser driver.
const chainRun=document.createElement('button');chainRun.id='qa-chain';chainRun.textContent='Run fresh sequential regression chain (QA only)';document.querySelector('#qa-toolbar').append(chainRun);
const chainOutput=document.createElement('output');chainOutput.id='qa-chain-results';chainOutput.style.display='block';chainRun.after(chainOutput);
chainRun.addEventListener('click',async()=>{if(chainRun.disabled)return;chainRun.disabled=true;const steps=[];let current='opening';chainOutput.textContent=JSON.stringify({status:'RUNNING',current,steps});
 const pairs=[['camera','camera'],['selection','selection'],['placement','placement'],['path','path'],['edit','edit'],['macaw','macaw'],['animals','animal'],['feeding','feeding'],['water','water'],['rest','rest'],['welfare','welfare'],['visitors','visitors'],['visitor-navigation','visitor-navigation'],['satisfaction','satisfaction']];
 const result=id=>{try{return JSON.parse(document.querySelector('#qa-'+id+'-results').textContent);}catch{return {status:'UNRUN'};}};
 const wait=async(predicate,budget)=>{const end=performance.now()+budget;while(performance.now()<end){if(predicate())return;await new Promise(r=>requestAnimationFrame(r));}throw Error('Bounded QA chain timeout: '+current);};
 try{if(handle?.inspect().state.status!=='closed'||pairs.some(([,id])=>result(id).status!=='UNRUN'))throw Error('Use a fresh fixture page for the chain');root.querySelector('[data-preview-open]').click();await wait(()=>handle?.inspect().state.status==='ready',20000);
  for(const[buttonId,outputId]of pairs){current=outputId;const start=performance.now();document.querySelector('#qa-'+buttonId).click();await wait(()=>['PASS','FAIL'].includes(result(outputId).status),outputId==='rest'?330000:outputId==='visitor-navigation'||outputId==='satisfaction'?330000:180000);const r=result(outputId);steps.push({id:outputId,status:r.status,cases:r.cases?.length??0,elapsedMs:performance.now()-start});chainOutput.textContent=JSON.stringify({status:'RUNNING',current,steps});if(r.status!=='PASS')throw Error(outputId+': '+r.error);}
  chainOutput.textContent=JSON.stringify({status:'PASS',method:'fresh sequential labelled fixture buttons; real fixed ticks; no accelerated time/state injection',steps});
 }catch(error){handle?.setPaused(true);chainOutput.textContent=JSON.stringify({status:'FAIL',current,error:String(error),steps,diagnostics:handle?.inspect().session});}
 finally{chainRun.disabled=false;update();}
});
const observer=new MutationObserver(update);
observer.observe(root,{subtree:true,childList:true,attributes:true,attributeFilter:['data-renderer-state']});
const onVisibility=()=>{if(document.hidden){endProbe('ABORTED_HIDDEN');update();}};
document.addEventListener('visibilitychange',onVisibility);
window.addEventListener('pagehide',()=>{endProbe('ABORTED_PAGEHIDE');document.removeEventListener('visibilitychange',onVisibility);observer.disconnect();handle?.dispose();});
root.addEventListener('click',()=>queueMicrotask(()=>{if(handle?.inspect().state.status!=='ready')endProbe('ABORTED_CLOSED');update();}));
mount();
