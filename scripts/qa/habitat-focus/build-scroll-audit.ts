import type {ZooSave} from '../../../src/game/core/zoo-state.ts';
import {validateSaveV5} from '../../../src/game/persistence/save-v5.ts';
import {lionCopy} from '../../../src/game-entry/lion-copy.ts';
import {giraffeCopy} from '../../../src/game-entry/giraffe-copy.ts';

type Context={root:HTMLElement;host:HTMLElement;read:()=>ZooSave;session:()=>Record<string,number|boolean>|undefined;errors:string[];mode:string};
/** Strict page-position checks, including transient frames and document-bottom clamping. */
export async function runBuildScrollAudit(c:Context){
 const {root,host,mode}=c,out=document.createElement('pre');out.id='qa-build-scroll-result';out.dataset.status='RUNNING';out.textContent='RUNNING';document.querySelector('#qa-actions')!.append(out);
 const checks:{name:string;passed:boolean;detail?:unknown}[]=[],rows:unknown[]=[];
 const bottom=mode.endsWith('bottom'),confirm=mode.startsWith('confirm');
 const delay=(ms:number)=>new Promise<void>(r=>setTimeout(r,ms));
 const frame=()=>new Promise<void>(r=>requestAnimationFrame(()=>r()));
 const visible=(e:Element|null):e is HTMLElement=>!!e&&e.checkVisibility();
 const get=(s:string)=>root.querySelector<HTMLElement>(s);
 const available=(e:HTMLElement|null):e is HTMLButtonElement=>visible(e)&&e instanceof HTMLButtonElement&&!e.matches(':disabled');
 const click=(s:string)=>{const b=get(s);if(!available(b))throw Error('Unavailable '+s);b.click();};
 const wait=async(fn:()=>boolean,label:string,ms=30000)=>{const end=performance.now()+ms;while(!fn()){if(performance.now()>end)throw Error('Timeout '+label);await delay(40);}};
 const busy=()=>Object.entries(c.session()??{}).some(([key,value])=>/Busy$/.test(key)&&value===true);
 const settle=async()=>{await delay(50);await wait(()=>!busy()&&c.session()?.assetsWaiting===false,'commit/assets');await delay(180);};
 const check=(name:string,passed:boolean,detail?:unknown)=>checks.push({name,passed,detail});
 const snap=()=>({y:scrollY,maxScroll:Math.max(0,document.documentElement.scrollHeight-innerHeight),tab:root.dataset.hudTab,kind:root.dataset.habitatFocus??null,paused:root.dataset.sessionPaused,tick:c.session()?.simulationTick});
 const dump=(status:string,error?:unknown)=>{out.dataset.status=status;out.textContent=JSON.stringify({at:new Date().toISOString(),status,error:error?String(error):undefined,mode,scope:'Internal-browser viewport QA, source-owned DOM clicks and frame sampling, actual game commands/renderer/UUID IndexedDB synthetic save. Strict scrollY stability; no allowance for native anchoring or bottom clamping. Not a physical phone.',viewport:{width:innerWidth,height:innerHeight,documentWidth:document.documentElement.scrollWidth},checks,rows,errors:c.errors,final:{...snap(),valid:validateSaveV5(c.read()).ok,canvases:host.querySelectorAll('canvas').length}},null,2);};
 const labels=(prefix:string)=>prefix==='lion'?lionCopy[root.lang==='en'?'en':'id']:giraffeCopy[root.lang==='en'?'en':'id'];
 const find=(scope:Element,label:string)=>[...scope.querySelectorAll<HTMLButtonElement>('button')].find(b=>available(b)&&b.textContent===label)??null;
 async function measure(name:string,button:HTMLButtonElement,run:()=>void,completed:()=>boolean){
  button.scrollIntoView({block:'center',behavior:'instant'});button.focus({preventScroll:true});await frame();
  if(bottom)window.scrollTo({top:document.documentElement.scrollHeight,behavior:'instant'});
  await frame();const box=button.closest<HTMLElement>('.zoo-resource-card,.zoo-builder-catalog,[data-placement-tools]')??get('[data-hud-pane="build"]')!;
  const before=snap(),beforeBoxBottom=box.getBoundingClientRect().bottom,resources=c.read().world.resources.length,ys:number[]=[],boxBottoms:number[]=[];let sampling=true;
  const sample=()=>{ys.push(scrollY);boxBottoms.push(box.getBoundingClientRect().bottom);if(sampling)requestAnimationFrame(sample);};requestAnimationFrame(sample);
  try{
   run();const immediate=snap();await wait(completed,name+' completion');await settle();await delay(850);await frame();
   const after=snap(),afterBoxBottom=box.getBoundingClientRect().bottom;sampling=false;const maxDelta=Math.max(0,...ys.map(y=>Math.abs(y-before.y))),maxContentDelta=Math.max(0,...boxBottoms.map(y=>Math.abs(y-beforeBoxBottom)));
   check(name+' immediate scroll unchanged',Math.abs(immediate.y-before.y)<.5,{before,immediate});
   check(name+' no transient frame movement',ys.length>=2&&maxDelta<.5,{maxDelta,samples:ys.length});
   check(name+' committed scroll unchanged',Math.abs(after.y-before.y)<.5,{before,after});
   check(name+' content following preview stays in place',maxContentDelta<.5&&Math.abs(afterBoxBottom-beforeBoxBottom)<.5,{beforeBoxBottom,afterBoxBottom,maxContentDelta});
   check(name+' document still supports original position',after.maxScroll>=before.y-.5,{before,after});
   check(name+' chosen Build and habitat retained',after.tab==='build'&&after.kind===before.kind);
   check(name+' simulation remains running',after.paused==='false'&&Number(after.tick)>Number(before.tick));
   check(name+' canonical resource count',c.read().world.resources.length===resources+(name.includes(' purchase')?1:0));
   rows.push({name,before,immediate,after,maxDelta,beforeBoxBottom,afterBoxBottom,maxContentDelta,samples:ys.length,resourcesBefore:resources,resourcesAfter:c.read().world.resources.length});
   const target=Math.max(0,after.y-40);window.scrollTo({top:target,behavior:'instant'});await delay(160);
   check(name+' player may scroll afterwards',Math.abs(scrollY-target)<1);dump('RUNNING');
  }finally{sampling=false;}
 }
 try{
  if(!/^(cancel|confirm)-(middle|bottom)$/.test(mode))throw Error('Unsupported strict mode');
  await wait(()=>available(get('[data-continue]')),'Continue');click('[data-continue]');await wait(()=>c.session()?.assetsWaiting===false,'assets',60000);
  if(visible(get('[data-save-resume]')))click('[data-save-resume-button]');if(root.dataset.sessionPaused==='true')click('[data-pause-toggle]');await settle();
  for(const [kind,prefix,start]of [
   ['macaw-aviary','food','[data-food-command="preview"]'],['elephant-grove','elephant','[data-elephant-place="log"]'],
   ['lion-savanna','lion','[data-lion-panel="build"] [data-facility-kind="lion-scent"]'],['giraffe-plains','giraffe','[data-giraffe-panel="build"] [data-facility-kind="giraffe-enrichment"]'],['zebra-grasslands','zebra','[data-zebra-plan="zebra-enrichment"]']
  ]){
   click(`[data-zoo-destination="${kind}"]`);await settle();click('button[data-hud-tab="build"]');await frame();click(start);await settle();
   const scope=get(`[data-${prefix}-panel="build"]`)??get('[data-hud-pane="build"]')!;
   const control=(command:'confirm'|'cancel')=>prefix==='food'?get(`[data-food-command="${command}"]`):prefix==='elephant'?get(`[data-elephant-care-action="${command}"]`):prefix==='zebra'?get(`[data-zebra-preview="${command}"]`):find(scope,labels(prefix)[command]);
   await wait(()=>available(control(confirm?'confirm':'cancel')),kind+' close button');const b=control(confirm?'confirm':'cancel') as HTMLButtonElement,count=c.read().world.resources.length;
   await measure(kind+(confirm?' purchase':' cancel'),b,()=>{const current=control(confirm?'confirm':'cancel');if(!available(current))throw Error('Close control changed '+kind);current.click();},()=>confirm?c.read().world.resources.length===count+1:available(get(start)));
   click('button[data-hud-tab="care"]');await frame();await frame();
   check(kind+' reserved layout released outside Build',get('[data-hud-pane="build"]')!.style.minBlockSize===''&&root.style.minBlockSize==='');
  }
  if(!confirm){
   click('[data-zoo-destination="zoo"]');await settle();click('button[data-hud-tab="build"]');click('[data-placement-command="begin-path"]');await settle();
   const b=get('[data-placement-command="cancel"]') as HTMLButtonElement;
   await measure('Zoo path Escape',b,()=>b.dispatchEvent(new KeyboardEvent('keydown',{key:'Escape',bubbles:true,cancelable:true})),()=>available(get('[data-placement-command="begin-path"]')));
  }
  click('button[data-hud-tab="missions"]');await frame();await frame();
  check('restores document anchoring after leaving Build',document.documentElement.style.getPropertyValue('overflow-anchor')==='');
  check('valid V5 and single renderer',validateSaveV5(c.read()).ok&&host.querySelectorAll('canvas').length===1);
  check('no application errors or horizontal overflow',c.errors.length===0&&document.documentElement.scrollWidth<=innerWidth);
  dump(checks.every(c=>c.passed)?'PASS':'FAIL');
 }catch(error){check('audit exception',false,String(error));dump('FAIL',error);}
 finally{if(root.dataset.sessionPaused==='false'&&available(get('[data-pause-toggle]')))click('[data-pause-toggle]');}
}
