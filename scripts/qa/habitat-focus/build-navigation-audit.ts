import type {ZooSave} from '../../../src/game/core/zoo-state.ts';
import {validateSaveV5} from '../../../src/game/persistence/save-v5.ts';
import {lionCopy} from '../../../src/game-entry/lion-copy.ts';
import {giraffeCopy} from '../../../src/game-entry/giraffe-copy.ts';

type Context={root:HTMLElement;host:HTMLElement;mode:string;read:()=>ZooSave;session:()=>Record<string,number|boolean>|undefined;errors:string[]};
/** Follow real preview completion with tab/habitat navigation and a cancelled touch gesture. */
export async function runBuildNavigationAudit(c:Context){
 const {root,host,mode}=c,out=document.createElement('pre');out.id='qa-build-navigation-result';out.dataset.status='RUNNING';out.textContent='RUNNING';document.querySelector('#qa-actions')!.append(out);
 const checks:{name:string;passed:boolean;detail?:unknown}[]=[],rows:unknown[]=[];
 const confirm=mode.startsWith('confirm'),habitat=mode.endsWith('habitat');
 const pause=(ms:number)=>new Promise<void>(r=>setTimeout(r,ms)),frame=()=>new Promise<void>(r=>requestAnimationFrame(()=>r()));
 const get=(s:string)=>root.querySelector<HTMLElement>(s),visible=(e:Element|null):e is HTMLElement=>!!e&&e.checkVisibility();
 const available=(b:HTMLElement|null):b is HTMLButtonElement=>visible(b)&&b instanceof HTMLButtonElement&&!b.matches(':disabled');
 const wait=async(fn:()=>boolean,label:string)=>{const end=performance.now()+30000;while(!fn()){if(performance.now()>end)throw Error('Timeout '+label);await pause(40);}};
 const click=(s:string)=>{const b=get(s);if(!available(b))throw Error('Unavailable '+s);b.click();};
 const settle=async()=>{await pause(50);await wait(()=>!Object.entries(c.session()??{}).some(([key,value])=>/Busy$/.test(key)&&value===true)&&c.session()?.assetsWaiting===false,'commit/assets');await pause(150);};
 const snap=(button?:HTMLElement)=>{const pane=get(`[data-hud-pane="${root.dataset.hudTab}"]`),rect=pane?.getBoundingClientRect(),leaves=pane?[...pane.querySelectorAll<HTMLElement>('p,h3,h4,button,summary,small,li,dt,dd')].filter(e=>visible(e)&&e.getBoundingClientRect().height>1&&e.getBoundingClientRect().width>1):[],bottom=leaves.length?Math.max(...leaves.map(e=>e.getBoundingClientRect().bottom)):rect?.bottom??0;return {y:scrollY,pageHeight:document.documentElement.scrollHeight,rootHeight:root.getBoundingClientRect().height,buttonTop:button?.getBoundingClientRect().top,tab:root.dataset.hudTab,kind:root.dataset.habitatFocus??null,scope:root.dataset.zooScope,paused:root.dataset.sessionPaused,reserved:[root,...root.querySelectorAll<HTMLElement>('[data-hud-pane="build"],[data-hud-pane="build"] [style]')].filter(e=>!!e.style.getPropertyValue('min-block-size')).length,anchor:document.documentElement.style.getPropertyValue('overflow-anchor'),paneVisible:!!rect&&rect.height>0,paneTailGap:(rect?.bottom??0)-bottom,canvas:host.querySelectorAll('canvas').length};};
 const check=(name:string,passed:boolean,detail?:unknown)=>checks.push({name,passed,detail});
 const dump=(status:string,error?:unknown)=>{out.dataset.status=status;out.textContent=JSON.stringify({at:new Date().toISOString(),status,error:error?String(error):undefined,mode,scope:'Codex internal-browser viewport; actual source UI/renderer/commands in UUID IndexedDB with synthetic closed-entrance fixture. Real purchases/cancellations followed by visible tab/destination controls. Includes touch pointerdown/pointercancel before committed navigation. Not a physical phone.',viewport:{width:innerWidth,height:innerHeight,documentWidth:document.documentElement.scrollWidth},checks,rows,errors:c.errors,final:{...snap(),valid:validateSaveV5(c.read()).ok}},null,2);};
 const clean=(s:ReturnType<typeof snap>)=>s.reserved===0&&s.anchor==='';
 async function navigate(name:string,button:HTMLButtonElement,expectedTab:string,expectedKind:string|null){
  button.scrollIntoView({block:'center',behavior:'instant'});button.focus({preventScroll:true});await frame();const before=snap(button),samples:{y:number;top:number;tab:string|undefined;kind:string|null}[]=[];let sampling=true;
  const sample=()=>{samples.push({y:scrollY,top:button.getBoundingClientRect().top,tab:root.dataset.hudTab,kind:root.dataset.habitatFocus??null});if(sampling)requestAnimationFrame(sample);};requestAnimationFrame(sample);
  button.dispatchEvent(new PointerEvent('pointerdown',{bubbles:true,cancelable:true,pointerType:'touch',pointerId:51,isPrimary:true,button:0,buttons:1}));
  const down=snap(button);button.dispatchEvent(new PointerEvent('pointerup',{bubbles:true,cancelable:true,pointerType:'touch',pointerId:51,isPrimary:true,button:0,buttons:0}));button.click();await settle();const immediate=snap(button);await pause(500);await frame();const after=snap(button);sampling=false;
  const dy=Math.max(0,...samples.map(s=>Math.abs(s.y-before.y))),dt=Math.max(0,...samples.map(s=>Math.abs(s.top-(before.buttonTop??s.top))));
  check(name+' reaches selected tab and habitat',after.tab===expectedTab&&after.kind===expectedKind&&after.paneVisible);
  check(name+' releases every reserved box and anchoring',clean(immediate)&&clean(after),{immediate,after});
  check(name+' has no excessive blank panel tail',after.paneTailGap<100,{gap:after.paneTailGap});
  check(name+' keeps visible navigation position',Math.abs(after.y-before.y)<.5&&dy<.5&&dt<.5,{before,down,after,dy,dt});
  check(name+' has no delayed switch',immediate.tab===after.tab&&immediate.kind===after.kind);
  rows.push({name,before,down,immediate,after,maxScrollDelta:dy,maxControlDelta:dt,samples:samples.length});dump('RUNNING');
 }
 try{
  if(!/^(cancel|confirm)-(menu|habitat)$/.test(mode))throw Error('Unknown navigation mode');
  await wait(()=>available(get('[data-continue]')),'Continue');click('[data-continue]');await wait(()=>c.session()?.assetsWaiting===false,'assets');if(visible(get('[data-save-resume]')))click('[data-save-resume-button]');if(root.dataset.sessionPaused==='true')click('[data-pause-toggle]');await settle();
  const cases=[['macaw-aviary','food','[data-food-command="preview"]'],['elephant-grove','elephant','[data-elephant-place="log"]'],['lion-savanna','lion','[data-lion-panel="build"] [data-facility-kind="lion-scent"]'],['giraffe-plains','giraffe','[data-giraffe-panel="build"] [data-facility-kind="giraffe-enrichment"]'],['zebra-grasslands','zebra','[data-zebra-plan="zebra-enrichment"]']];
  for(const [index,[kind,prefix,start]]of cases.entries()){
   click(`[data-zoo-destination="${kind}"]`);await settle();click('button[data-hud-tab="build"]');click(start);await settle();
   const section=get(`[data-${prefix}-panel="build"]`)??get('[data-hud-pane="build"]')!,command=confirm?'confirm':'cancel';
   const close=()=>prefix==='food'?get(`[data-food-command="${command}"]`):prefix==='elephant'?get(`[data-elephant-care-action="${command}"]`):prefix==='zebra'?get(`[data-zebra-preview="${command}"]`):[...section.querySelectorAll<HTMLButtonElement>('button')].find(b=>available(b)&&b.textContent===(prefix==='lion'?lionCopy:giraffeCopy)[root.lang==='en'?'en':'id'][command])??null;
   await wait(()=>available(close()),kind+' close control');close()!.scrollIntoView({block:'center',behavior:'instant'});await frame();const count=c.read().world.resources.length,beforeClose=snap();(close()as HTMLButtonElement).click();await wait(()=>confirm?c.read().world.resources.length===count+1:available(get(start)),kind+' closed');await settle();
   const afterClose=snap();check(kind+' close preserves page',Math.abs(beforeClose.y-afterClose.y)<.5,{beforeClose,afterClose});check(kind+' closed preview retains its space',afterClose.reserved>0&&afterClose.anchor==='none');
   // A swipe may begin over a navigation button and be cancelled without activating it.
   const probe=get('button[data-hud-tab="missions"]') as HTMLButtonElement;probe.scrollIntoView({block:'center',behavior:'instant'});probe.focus({preventScroll:true});await frame();const preTouch=snap(probe);
   probe.dispatchEvent(new PointerEvent('pointerdown',{bubbles:true,cancelable:true,pointerType:'touch',pointerId:52,isPrimary:true,button:0,buttons:1}));await frame();probe.dispatchEvent(new PointerEvent('pointercancel',{bubbles:true,cancelable:true,pointerType:'touch',pointerId:52,isPrimary:true,button:0,buttons:0}));const cancelledTouch=snap(probe);
   check(kind+' cancelled navigation touch does not change layout',cancelledTouch.reserved===preTouch.reserved&&cancelledTouch.pageHeight===preTouch.pageHeight&&cancelledTouch.tab===preTouch.tab&&Math.abs(cancelledTouch.y-preTouch.y)<.5,{preTouch,cancelledTouch});
   if(habitat){const next=cases[(index+1)%cases.length]![0]!;await navigate(kind+' to '+next,get(`[data-zoo-destination="${next}"]`)as HTMLButtonElement,'build',next);await navigate(next+' back to '+kind,get(`[data-zoo-destination="${kind}"]`)as HTMLButtonElement,'build',kind);await navigate(kind+' to Zoo',get('[data-zoo-destination="zoo"]')as HTMLButtonElement,'build',null);await navigate('Zoo to '+kind,get(`[data-zoo-destination="${kind}"]`)as HTMLButtonElement,'build',kind);}
   else{const tabs=['missions','care','visitors'],offset=(index+(innerWidth===390?2:0)+(confirm?1:0))%3;for(let i=0;i<3;i++){const tab=tabs[(offset+i)%3]!;await navigate(kind+' '+tab,get(`button[data-hud-tab="${tab}"]`)as HTMLButtonElement,tab,kind);}await navigate(kind+' return Build',get('button[data-hud-tab="build"]')as HTMLButtonElement,'build',kind);}
   check(kind+' return Build has natural layout',clean(snap())&&snap().paneTailGap<100);check(kind+' running simulation and one canvas',root.dataset.sessionPaused==='false'&&host.querySelectorAll('canvas').length===1);
  }
  check('valid V5 and no app errors',validateSaveV5(c.read()).ok&&c.errors.length===0);check('no horizontal overflow',document.documentElement.scrollWidth<=innerWidth);dump(checks.every(c=>c.passed)?'PASS':'FAIL');
 }catch(error){check('audit exception',false,String(error));dump('FAIL',error);}
 finally{if(root.dataset.sessionPaused==='false'&&available(get('[data-pause-toggle]')))click('[data-pause-toggle]');}
}
