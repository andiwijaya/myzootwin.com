import type {ZooSave} from '../../../src/game/core/zoo-state.ts';
import {validateSaveV5} from '../../../src/game/persistence/save-v5.ts';
import {lionCopy} from '../../../src/game-entry/lion-copy.ts';
import {giraffeCopy} from '../../../src/game-entry/giraffe-copy.ts';

type Context={root:HTMLElement;host:HTMLElement;read:()=>ZooSave;session:()=>Record<string,number|boolean>|undefined;errors:string[]};
type Check={name:string;passed:boolean;detail?:unknown};

/** Repeated real UI previews must plateau, then release all reserved space on navigation. */
export async function runBuildRepeatAudit(c:Context){
 const {root,host}=c,output=document.createElement('pre');output.id='qa-build-repeat-result';output.hidden=true;output.dataset.status='RUNNING';document.querySelector('#qa-actions')!.append(output);
 const checks:Check[]=[],cycles:unknown[]=[],routes:unknown[]=[],habitats:unknown[]=[];
 const delay=(ms:number)=>new Promise<void>(r=>setTimeout(r,ms)),frame=()=>new Promise<void>(r=>requestAnimationFrame(()=>r()));
 const get=(selector:string)=>root.querySelector<HTMLElement>(selector);
 const available=(e:HTMLElement|null):e is HTMLButtonElement=>!!e&&e instanceof HTMLButtonElement&&e.checkVisibility()&&!e.disabled;
 const check=(name:string,passed:boolean,detail?:unknown)=>checks.push({name,passed,detail});
 const wait=async(test:()=>boolean,name:string)=>{const deadline=performance.now()+45000;while(!test()){if(performance.now()>deadline)throw Error('Timeout '+name);await delay(40);}};
 const settle=async()=>{await delay(50);await wait(()=>c.session()?.assetsWaiting===false&&!Object.entries(c.session()??{}).some(([key,value])=>/Busy$/.test(key)&&value===true),'assets/commit');await delay(150);};
 const click=(selector:string)=>{const button=get(selector);if(!available(button))throw Error('Unavailable '+selector);button.click();};
 const snapshot=(button?:HTMLElement)=>{
  const pane=get(`[data-hud-pane="${root.dataset.hudTab}"]`)!,rect=pane.getBoundingClientRect();
  const leaves=[...pane.querySelectorAll<HTMLElement>('p,h3,h4,button,summary,small,li,dt,dd')].filter(e=>e.checkVisibility()&&e.getBoundingClientRect().height>1&&e.getBoundingClientRect().width>1);
  const bottom=leaves.length?Math.max(...leaves.map(e=>e.getBoundingClientRect().bottom)):rect.bottom;
  return {y:scrollY,pageHeight:document.documentElement.scrollHeight,rootHeight:root.getBoundingClientRect().height,paneHeight:rect.height,paneBottom:rect.bottom,tail:rect.bottom-bottom,buttonTop:button?.getBoundingClientRect().top,
   reserved:[root,...root.querySelectorAll<HTMLElement>('[data-hud-pane="build"],[data-hud-pane="build"] [style]')].filter(e=>!!e.style.getPropertyValue('min-block-size')).length,
   anchor:document.documentElement.style.getPropertyValue('overflow-anchor'),tab:root.dataset.hudTab,kind:root.dataset.habitatFocus??null,paused:root.dataset.sessionPaused,tick:Number(c.session()?.simulationTick),canvas:host.querySelectorAll('canvas').length};
 };
 type Snapshot=ReturnType<typeof snapshot>;
 const clean=(s:Snapshot)=>s.reserved===0&&s.anchor==='';
 const receipt=(status:string,error?:unknown)=>{output.dataset.status=status;output.textContent=JSON.stringify({at:new Date().toISOString(),status,error:error?String(error):undefined,
  method:'Codex internal-browser phone viewport, real UI/renderer/canonical commits, UUID synthetic V5 save with closed entrance. Hidden QA receipt has no layout footprint. Ten cancel cycles per habitat at middle/bottom positions, followed by navigation, purchase and navigation again. Not a physical phone.',
  viewport:{width:innerWidth,height:innerHeight,documentWidth:document.documentElement.scrollWidth},repeatsPerHabitat:10,checks,cycles,routes,habitats,errors:c.errors,final:{...snapshot(),valid:validateSaveV5(c.read()).ok}},null,2);};
 async function closePreview(name:string,button:HTMLButtonElement,done:()=>boolean,purchase:boolean,firstClosed:Snapshot|null,position:'middle'|'bottom'){
  button.scrollIntoView({block:'center',behavior:'instant'});button.focus({preventScroll:true});if(position==='bottom')window.scrollTo({top:document.documentElement.scrollHeight,behavior:'instant'});await frame();
  const before=snapshot(),resources=c.read().world.resources.length,ys:number[]=[],bottoms:number[]=[];let sampling=true;
  const sample=()=>{ys.push(scrollY);bottoms.push(get('[data-hud-pane="build"]')!.getBoundingClientRect().bottom);if(sampling)requestAnimationFrame(sample);};requestAnimationFrame(sample);
  button.dispatchEvent(new PointerEvent('pointerdown',{bubbles:true,cancelable:true,pointerType:'touch',pointerId:71,isPrimary:true,button:0,buttons:1}));
  button.dispatchEvent(new PointerEvent('pointerup',{bubbles:true,cancelable:true,pointerType:'touch',pointerId:71,isPrimary:true,button:0,buttons:0}));button.click();const immediate=snapshot();
  await wait(done,name+' closed');await settle();await delay(400);await frame();const after=snapshot();sampling=false;
  const maxScrollDelta=Math.max(Math.abs(immediate.y-before.y),Math.abs(after.y-before.y),...ys.map(y=>Math.abs(y-before.y)));
  const maxContentDelta=Math.max(Math.abs(after.paneBottom-before.paneBottom),...bottoms.map(y=>Math.abs(y-before.paneBottom)));
  const growth=firstClosed?{root:after.rootHeight-firstClosed.rootHeight,page:after.pageHeight-firstClosed.pageHeight,pane:after.paneHeight-firstClosed.paneHeight,tail:after.tail-firstClosed.tail}:null;
  check(name+' keeps scroll on every sampled frame',maxScrollDelta<.5&&ys.length>=1,{maxScrollDelta,samples:ys.length});
  check(name+' keeps content below preview fixed',maxContentDelta<.5,{maxContentDelta});
  check(name+' closed footprint does not accumulate',!growth||Object.values(growth).every(value=>value<.5),growth);
  check(name+' retains only bounded reservation',after.reserved>0&&after.anchor==='none'&&(!firstClosed||after.reserved<=firstClosed.reserved));
  check(name+' keeps Build, habitat and animation active',after.tab==='build'&&after.kind===before.kind&&after.paused==='false'&&after.canvas===1&&after.tick>before.tick);
  check(name+' canonical resource delta',c.read().world.resources.length===resources+(purchase?1:0));
  const target=Math.max(0,after.y-32);window.scrollTo({top:target,behavior:'instant'});await delay(100);check(name+' player remains free to scroll',Math.abs(scrollY-target)<1);
  cycles.push({name,purchase,position,before,immediate,after,firstClosed,growth,maxScrollDelta,maxContentDelta,samples:ys.length,resourcesBefore:resources,resourcesAfter:c.read().world.resources.length});receipt('RUNNING');return after;
 }
 async function navigate(name:string,selector:string,tab:string,kind:string|null){
  const button=get(selector);if(!available(button))throw Error('Missing navigation '+selector);button.scrollIntoView({block:'center',behavior:'instant'});button.focus({preventScroll:true});await frame();
  const before=snapshot(button),ys:number[]=[],tops:number[]=[];let sampling=true;
  const sample=()=>{ys.push(scrollY);tops.push(button.getBoundingClientRect().top);if(sampling)requestAnimationFrame(sample);};requestAnimationFrame(sample);
  button.dispatchEvent(new PointerEvent('pointerdown',{bubbles:true,cancelable:true,pointerType:'touch',pointerId:72,isPrimary:true,button:0,buttons:1}));
  button.dispatchEvent(new PointerEvent('pointerup',{bubbles:true,cancelable:true,pointerType:'touch',pointerId:72,isPrimary:true,button:0,buttons:0}));button.click();await settle();const immediate=snapshot(button);await delay(400);await frame();const after=snapshot(button);sampling=false;
  const maxScrollDelta=Math.max(Math.abs(after.y-before.y),...ys.map(y=>Math.abs(y-before.y))),maxControlDelta=Math.max(Math.abs(after.buttonTop!-before.buttonTop!),...tops.map(y=>Math.abs(y-before.buttonTop!)));
  check(name+' correct chosen tab and habitat',after.tab===tab&&after.kind===kind&&after.paneHeight>0);
  check(name+' restores natural layout and anchoring',clean(immediate)&&clean(after));
  check(name+' no excessive empty panel tail',after.tail<100,{tail:after.tail});
  check(name+' no scroll or toolbar movement',maxScrollDelta<.5&&maxControlDelta<.5&&ys.length>=1,{maxScrollDelta,maxControlDelta});
  check(name+' no delayed automatic switch',immediate.tab===after.tab&&immediate.kind===after.kind);
  routes.push({name,before,immediate,after,maxScrollDelta,maxControlDelta,samples:ys.length});receipt('RUNNING');
 }
 async function tour(name:string,kind:string,next:string){
  const probe=get('button[data-hud-tab="missions"]') as HTMLButtonElement;probe.scrollIntoView({block:'center',behavior:'instant'});probe.focus({preventScroll:true});await frame();const before=snapshot();
  probe.dispatchEvent(new PointerEvent('pointerdown',{bubbles:true,cancelable:true,pointerType:'touch',pointerId:73,isPrimary:true,button:0,buttons:1}));await frame();probe.dispatchEvent(new PointerEvent('pointercancel',{bubbles:true,cancelable:true,pointerType:'touch',pointerId:73,isPrimary:true,button:0,buttons:0}));const cancelled=snapshot();
  check(name+' aborted navigation touch retains footprint',cancelled.rootHeight===before.rootHeight&&cancelled.pageHeight===before.pageHeight&&cancelled.reserved===before.reserved&&Math.abs(cancelled.y-before.y)<.5,{before,cancelled});
  for(const tab of['missions','care','visitors','build'])await navigate(name+' '+tab,`button[data-hud-tab="${tab}"]`,tab,kind);
  await navigate(name+' next habitat',`[data-zoo-destination="${next}"]`,'build',next);
  await navigate(name+' return habitat',`[data-zoo-destination="${kind}"]`,'build',kind);
  await navigate(name+' Zoo','[data-zoo-destination="zoo"]','build',null);
  await navigate(name+' Zoo to habitat',`[data-zoo-destination="${kind}"]`,'build',kind);
 }
 try{
  await wait(()=>available(get('[data-continue]')),'Continue');click('[data-continue]');await wait(()=>c.session()?.assetsWaiting===false,'initial assets');
  if(get('[data-save-resume]')?.checkVisibility())click('[data-save-resume-button]');if(root.dataset.sessionPaused==='true')click('[data-pause-toggle]');await settle();await document.fonts.ready;
  const cases=[['macaw-aviary','food','[data-food-command="preview"]'],['elephant-grove','elephant','[data-elephant-place="log"]'],['lion-savanna','lion','[data-lion-panel="build"] [data-facility-kind="lion-scent"]'],['giraffe-plains','giraffe','[data-giraffe-panel="build"] [data-facility-kind="giraffe-enrichment"]'],['zebra-grasslands','zebra','[data-zebra-plan="zebra-enrichment"]']];
  for(const[index,[kind,prefix,start]]of cases.entries()){
   click(`[data-zoo-destination="${kind}"]`);await settle();click('button[data-hud-tab="build"]');await frame();const natural=snapshot();let firstClosed:Snapshot|null=null;
   const control=(command:'cancel'|'confirm')=>prefix==='food'?get(`[data-food-command="${command}"]`):prefix==='elephant'?get(`[data-elephant-care-action="${command}"]`):prefix==='zebra'?get(`[data-zebra-preview="${command}"]`):[...get(`[data-${prefix}-panel="build"]`)!.querySelectorAll<HTMLButtonElement>('button')].find(b=>available(b)&&b.textContent===(prefix==='lion'?lionCopy:giraffeCopy)[root.lang==='en'?'en':'id'][command])??null;
   for(let cycle=1;cycle<=10;cycle++){
    click(start);await settle();await wait(()=>available(control('cancel')),kind+' Cancel');const position=cycle%2?'middle':'bottom';
    const closed=await closePreview(kind+' cancel '+cycle,control('cancel') as HTMLButtonElement,()=>available(get(start)),false,firstClosed,position);firstClosed??=closed;
   }
   await tour(kind+' after repeat',kind,cases[(index+1)%cases.length]![0]!);const restored=snapshot();
   check(kind+' returns to original natural Build height',clean(restored)&&Math.abs(restored.rootHeight-natural.rootHeight)<.5&&Math.abs(restored.paneHeight-natural.paneHeight)<.5,{natural,restored});
   click(start);await settle();await wait(()=>available(control('confirm')),kind+' Confirm');const resources=c.read().world.resources.length;
   await closePreview(kind+' purchase after repeats',control('confirm') as HTMLButtonElement,()=>c.read().world.resources.length===resources+1,true,null,'bottom');
   await tour(kind+' after purchase',kind,cases[(index+1)%cases.length]![0]!);habitats.push({kind,natural,firstClosed,restored,final:snapshot()});
   check(kind+' final Build is clean',clean(snapshot())&&snapshot().tail<100);receipt('RUNNING');
  }
  check('all final V5 data valid and no application errors',validateSaveV5(c.read()).ok&&c.errors.length===0);
  check('phone layout has no horizontal overflow',document.documentElement.scrollWidth<=innerWidth);
  receipt(checks.every(check=>check.passed)?'PASS':'FAIL');
 }catch(error){check('repeat audit exception',false,String(error));receipt('FAIL',error);}
 finally{if(root.dataset.sessionPaused==='false'&&available(get('[data-pause-toggle]')))click('[data-pause-toggle]');}
}
