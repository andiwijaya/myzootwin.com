import type {ZooSave} from '../../../src/game/core/zoo-state.ts';
import {validateSaveV5} from '../../../src/game/persistence/save-v5.ts';
import {lionCopy,lionReviewCopy} from '../../../src/game-entry/lion-copy.ts';
import {giraffeCopy} from '../../../src/game-entry/giraffe-copy.ts';
import {habitatKind} from '../../../src/game/render3d/habitat-focus.ts';

type Context={root:HTMLElement;host:HTMLElement;seed:string;read:()=>ZooSave;session:()=>Record<string,number|boolean>|undefined;selectHome:(kind:string)=>Promise<void>;pickPath:()=>Promise<boolean>;chooseAnchor:()=>Promise<boolean>;errors:string[]};
type Check={name:string;passed:boolean;detail?:unknown};
/** Isolated source-owned QA: actual UI commands, DOM/focus/scroll and durable renderer. */
export async function runMenuAudit(c:Context){
 const {root,host,seed}=c,output=document.createElement('pre');output.id='qa-menu-audit-result';output.textContent='RUNNING';document.querySelector('#qa-actions')!.append(output);
 const checks:Check[]=[],actions:unknown[]=[],inventory:unknown[]=[],scrolls:{target:string;world:boolean}[]=[],focuses:{target:string;world:boolean}[]=[];let measuring=false,currentAction='startup',locale:'id'|'en'='id';
 const pause=(ms=100)=>new Promise<void>(resolve=>setTimeout(resolve,ms));
 const wait=async(p:()=>boolean,label:string,ms=30000)=>{const end=performance.now()+ms;while(!p()){if(performance.now()>end)throw Error('Timeout '+label);await pause(50);}};
 const visible=(e:Element|null):e is HTMLElement=>!!e&&e.checkVisibility();
 const get=(s:string)=>root.querySelector<HTMLElement>(s);
 const available=(b:HTMLElement|null):b is HTMLButtonElement=>visible(b)&&b instanceof HTMLButtonElement&&!b.matches(':disabled');
 const click=(s:string)=>{const b=get(s);if(!available(b))throw Error('Unavailable '+s);b.click();};
 const describe=(e:Element)=>e===root?'play-root':e===host?'world':e.getAttribute('data-hud-pane')??e.getAttribute('data-focus-kind')??e.getAttribute('data-zebra-preview')??e.className??e.tagName;
 const oldScroll=Element.prototype.scrollIntoView,oldFocus=HTMLElement.prototype.focus;
 Element.prototype.scrollIntoView=function(...args){if(measuring&&root.contains(this))scrolls.push({target:String(describe(this)),world:this===host||this===root});return oldScroll.apply(this,args);};
 HTMLElement.prototype.focus=function(...args){if(measuring&&root.contains(this))focuses.push({target:String(describe(this)),world:this===host||this===root});return oldFocus.apply(this,args);};
 const dump=(status:string,error?:unknown)=>{output.dataset.status=status;output.textContent=JSON.stringify({at:new Date().toISOString(),status,error:error?String(error):undefined,seed,currentAction,scope:'Actual game controls and renderer; whole synthetic V5 starting save in UUID IndexedDB. DOM clicks and source instrumentation. Explicit navigation may reveal its labelled target; transactions must keep the panel. Native bottom clamping when preview content closes is recorded separately. Not a physical phone or unlock-progression claim.',viewport:{width:innerWidth,height:innerHeight,documentWidth:document.documentElement.scrollWidth},checks,actions,inventory,errors:[...c.errors],final:{valid:validateSaveV5(c.read()).ok,canvases:host.querySelectorAll('canvas').length,paused:root.dataset.sessionPaused,tab:root.dataset.hudTab,kind:root.dataset.habitatFocus??null}},null,2);};
 const check=(name:string,passed:boolean,detail?:unknown)=>checks.push({name,passed,detail});
 async function settle(){await pause(40);await wait(()=>!Object.entries(c.session()??{}).some(([key,value])=>/Busy$/.test(key)&&value===true),'commit');await wait(()=>c.session()?.assetsWaiting!==true,'action assets',60000);await pause(240);await wait(()=>!Object.entries(c.session()??{}).some(([key,value])=>/Busy$/.test(key)&&value===true),'settled commit');}
 const snap=(b:HTMLElement)=>({y:scrollY,top:b.getBoundingClientRect().top,maxScroll:Math.max(0,document.documentElement.scrollHeight-innerHeight),tab:root.dataset.hudTab,kind:root.dataset.habitatFocus??null,worldBottom:host.getBoundingClientRect().bottom+scrollY,command:c.read().economy.nextCommand});
 async function act(name:string,target:string|HTMLElement,contract:'stay'|'navigate'|'dialog'='stay',completed?:()=>boolean){
  currentAction=name;const b=typeof target==='string'?get(target):target;
  if(!available(b))throw Error('Unavailable action '+name+' '+target);
  if(!b.closest('dialog')){b.scrollIntoView({block:'center',behavior:'instant'});b.focus({preventScroll:true});await pause(80);}
  const before=snap(b);scrolls.length=0;focuses.length=0;measuring=true;b.click();await settle();if(completed){await wait(completed,name+' canonical commit');await settle();}const after=snap(b);measuring=false;
  const worldCalls=scrolls.filter(x=>x.world),worldFocus=focuses.filter(x=>x.world),connected=b.isConnected&&visible(b);
  if(contract!=='navigate'){
   check(name+' keeps chosen menu and habitat',after.tab===before.tab&&after.kind===before.kind,{before,after});
   check(name+' does not force scroll or world focus',scrolls.length===0&&worldCalls.length===0&&worldFocus.length===0,{scrolls:[...scrolls],focuses:[...focuses]});
   const nativeClamp=before.y>after.maxScroll&&Math.abs(after.y-after.maxScroll)<2;
   check(name+' keeps the viewed panel',Math.abs(after.y-before.y)<3||(connected&&Math.abs(after.top-before.top)<3)||nativeClamp||(!connected&&after.y>before.worldBottom-80),{before,after,connected,nativeClamp});
  }
  const stableTab=root.dataset.hudTab,stableKind=root.dataset.habitatFocus;await pause(300);
  check(name+' has no delayed menu switch',root.dataset.hudTab===stableTab&&root.dataset.habitatFocus===stableKind);
  actions.push({name,contract,button:b.textContent?.trim(),attributes:Object.fromEntries([...b.attributes].filter(a=>a.name.startsWith('data-')).map(a=>[a.name,a.value])),before,after,scrolls:[...scrolls],focuses:[...focuses]});dump('RUNNING');
 }
 async function context(kind:string,pane:string){
  if(root.querySelector('dialog[open]'))throw Error('Unclosed modal');
  click(`[data-zoo-destination="${kind}"]`);await settle();click(`button[data-hud-tab="${pane}"]`);await pause();
 }
 function listInventory(kind:string,pane:string){
  inventory.push({kind,pane,buttons:[...root.querySelectorAll<HTMLButtonElement>(`[data-hud-pane="${pane}"] button`)].filter(visible).map(b=>({text:b.textContent?.trim(),label:b.getAttribute('aria-label'),disabled:b.matches(':disabled'),attributes:Object.fromEntries([...b.attributes].filter(a=>a.name.startsWith('data-')).map(a=>[a.name,a.value]))}))});
 }
 const find=(scope:HTMLElement,label:string)=>[...scope.querySelectorAll<HTMLButtonElement>('button')].find(b=>available(b)&&b.textContent===label)??null;
 async function dialogs(kind:string,resource:string){
  const opener=get(`[data-${resource}-remove]`);if(!available(opener))return;
  await act(kind+' review '+resource,opener,'dialog');check(resource+' modal opens',!!get(`[data-${resource}-dialog]`)?.hasAttribute('open'));
  await act(kind+' keep '+resource,`[data-${resource}-keep]`,'dialog');
  await act(kind+' review delete '+resource,`[data-${resource}-remove]`,'dialog');
  await act(kind+' confirm delete '+resource,`[data-${resource}-remove-confirm]`,'dialog');
 }
 try{
  await wait(()=>!root.querySelector<HTMLButtonElement>('[data-continue]')!.disabled,'Continue');click('[data-continue]');await wait(()=>c.session()?.assetsWaiting===false,'assets',60000);
  if(visible(get('[data-save-resume]')))click('[data-save-resume-button]');if(root.dataset.sessionPaused==='true')click('[data-pause-toggle]');await wait(()=>c.session()?.simulationPaused===false,'resume');
  locale=root.lang==='id'?'id':'en';
  const kinds=['zoo',...c.read().world.habitats.map(h=>habitatKind(h))];
  for(const kind of [...new Set(kinds)])for(const pane of ['missions','care','visitors','build']){await context(kind,pane);listInventory(kind,pane);}
  if(seed==='full'){
   for(const kind of [...new Set(kinds)]){
    await context(kind,'visitors');for(const command of ['close','open','focus','follow'])if(available(get(`[data-visitors-command="${command}"]`))){await act(kind+' guests '+command,`[data-visitors-command="${command}"]`,command==='focus'||command==='follow'?'navigate':'stay');if(root.dataset.habitatFocus!== (kind==='zoo'?undefined:kind))await context(kind,'visitors');}
   }
   await context('zoo','build');
   if(await c.pickPath()){
    for(const pane of ['missions','care','visitors','build'])await act('selected object keeps chosen '+pane,`button[data-hud-tab="${pane}"]`,'navigate');
    if(available(get('[data-edit-remove]'))){await act('selected path removal review','[data-edit-remove]','dialog');if(get('[data-edit-dialog]')?.hasAttribute('open'))await act('selected path removal cancel','[data-edit-cancel]','dialog');}
    if(available(get('[data-clear-selection]')))await act('clear selected object','[data-clear-selection]');
   }else check('select actual path through visible triangles',false);
   for(const b of [...root.querySelectorAll<HTMLButtonElement>('[data-hud-pane="build"] button')].filter(b=>available(b)&&/^(Fokus|Lihat|Focus|View)/.test(b.textContent??''))){if(available(b)){await act('build navigation '+b.textContent,b,'navigate');await context('zoo','build');}}
   for(const b of [...root.querySelectorAll<HTMLButtonElement>('[data-hud-pane="build"] button')].filter(b=>available(b)&&/^(Rencanakan jalur luar|Review next path tile|Plan outside)/.test(b.textContent??''))){await act('plan outside viewing route',b,'navigate');if(available(get('[data-placement-command="confirm"]')))await act('confirm outside viewing route','[data-placement-command="confirm"]');else if(available(get('[data-placement-command="cancel"]')))await act('cancel outside viewing route','[data-placement-command="cancel"]');await context('zoo','build');}
   if(available(get('[data-studio-command="open"]'))){await act('open macaw study','[data-studio-command="open"]','navigate');for(const command of ['pause','habitat','detail'])if(available(get(`[data-studio-command="${command}"]`)))await act('macaw study '+command,`[data-studio-command="${command}"]`,command==='pause'?'stay':'navigate');if(available(get('[data-studio-command="close"]')))await act('close macaw study','[data-studio-command="close"]','navigate');}
   for(const kind of kinds.filter(k=>k!=='zoo')){
    await context(kind,'care');
    const prefix=kind==='elephant-grove'?'elephant':kind==='lion-savanna'?'lion':kind==='giraffe-plains'?'giraffe':kind==='zebra-grasslands'?'zebra':'macaw';
    if(prefix==='zebra'&&available(get('[data-zebra-recovery-review]'))){await act('review Zebra care step','[data-zebra-recovery-review]','navigate');await context(kind,'care');}
    const care=get(`[data-${prefix}-panel="care"]`)??get(`[data-${prefix}-care]`)??get('[data-bird-tools]')!;
    for(const summary of [...care.querySelectorAll('summary')].filter(visible)){summary.click();await pause(30);summary.click();check(prefix+' condition details retain menu',root.dataset.hudTab==='care');}
    const refills=prefix==='macaw'?['[data-food-command="refill"]','[data-water-command="refill"]']:[...care.querySelectorAll<HTMLButtonElement>('button')].filter(b=>available(b)&&/^(Isi ulang|Refill)/.test(b.textContent??''));
    for(const [i,b]of refills.entries())if(available(typeof b==='string'?get(b):b))await act(prefix+' refill '+i,b);
    if(prefix==='macaw'){
     for(const b of [...root.querySelectorAll<HTMLButtonElement>('[data-animal-info]')].filter(available)){await act('inspect '+b.dataset.animalInfo,b,'navigate');if(available(get('[data-care-dismiss]')))await act('dismiss '+b.dataset.animalInfo,'[data-care-dismiss]');}
     for(const resource of ['food','water','perch'])await dialogs(prefix,resource);
    }else{
     const buttons=[...care.querySelectorAll<HTMLButtonElement>('button')].filter(b=>available(b)&&/^(Hapus|Remove)/.test(b.textContent??''));
     let confirmed=false;
     for(const [i,b]of buttons.entries())if(available(b)){
      await act(prefix+' remove review '+i,b,prefix==='elephant'?'dialog':'stay');
      const keep=()=>prefix==='elephant'?get('[data-edit-cancel]'):prefix==='zebra'?get('[data-zebra-remove-cancel]'):find(care,prefix==='lion'?lionReviewCopy[locale].cancel:giraffeCopy[locale].keep);
      if(available(keep())){
       await act(prefix+' remove cancel '+i,keep()!,prefix==='elephant'?'dialog':'stay');
       if(!confirmed){
        await act(prefix+' review confirmation '+i,b,prefix==='elephant'?'dialog':'stay');
        const confirm=prefix==='elephant'?get('[data-edit-confirm]'):prefix==='zebra'?get('[data-zebra-remove-confirm]'):find(care,prefix==='lion'?lionReviewCopy[locale].confirm:giraffeCopy[locale].removeConfirm);
        if(available(confirm)){const count=c.read().world.resources.length;await act(prefix+' confirm removal',confirm,prefix==='elephant'?'dialog':'stay');check(prefix+' actual removal commits',c.read().world.resources.length===count-1);confirmed=true;if(prefix==='elephant'){await context(kind,'build');if(available(get('[data-edit-undo]'))){await act('undo elephant removal','[data-edit-undo]');check('Undo restores removed facility',c.read().world.resources.length===count);}await context(kind,'care');}}
       }
      }
     }
    }
   }
   await context('zoo','missions');
   for(const selector of ['[data-thriving-action]','[data-elephant-guide-action]','[data-elephant-guide-focus="grove"]','[data-elephant-guide-focus="aviary"]','[data-elephant-recovery-action]'])if(available(get(selector))){await act('mission navigation '+selector,selector,'navigate');await context('zoo','missions');}
   await context('zoo','build');if(available(get('[data-edit-undo]')))await act('undo facility removal','[data-edit-undo]');
   await context('macaw-aviary','care');for(const command of ['reserve','welcome'])if(available(get(`[data-birds-command="${command}"]`)))await act('bird '+command,`[data-birds-command="${command}"]`);
  }else if(seed==='slots'){
   for(const [kind,prefix,start]of [
    ['macaw-aviary','food','[data-food-command="preview"]'],['elephant-grove','elephant','[data-elephant-place="log"]'],
    ['lion-savanna','lion','[data-lion-panel="build"] [data-facility-kind="lion-scent"]'],['giraffe-plains','giraffe','[data-giraffe-panel="build"] [data-facility-kind="giraffe-enrichment"]'],['zebra-grasslands','zebra','[data-zebra-plan="zebra-enrichment"]']
   ]){
    await context(kind,'build');await act(prefix+' plan',start,'navigate');
    const scope=get(`[data-${prefix}-panel="build"]`)??get('[data-hud-pane="build"]')!;
    const control=(command:string)=>prefix==='food'?get(`[data-food-command="${command}"]`):prefix==='elephant'?get(`[data-elephant-care-action="${command}"]`):prefix==='zebra'?get(`[data-zebra-preview="${command}"]`):find(scope,(prefix==='lion'?lionCopy[locale]:giraffeCopy[locale])[command as 'confirm'|'cancel'|'left'|'right'|'up'|'down']);
    for(const direction of ['left','up','down','right'])if(available(control(direction)))await act(prefix+' move '+direction,control(direction)!);
    if(available(control('cancel')))await act(prefix+' cancel preview',control('cancel')!);
    await act(prefix+' plan again',start,'navigate');await wait(()=>available(control('confirm')),prefix+' confirm ready',30000);
    const count=c.read().world.resources.length;await act(prefix+' confirm construction',control('confirm')!);check(prefix+' actual facility constructed',c.read().world.resources.length===count+1);
   }
   await context('zoo','build');for(const command of ['begin-path','left','up','down','right','cancel'])if(available(get(`[data-placement-command="${command}"]`)))await act('path '+command,`[data-placement-command="${command}"]`,command==='begin-path'?'navigate':'stay');
  }else if(seed==='recovery'){
   await context('zoo','care');await act('support review','[data-recovery-review]','dialog');await act('support cancel','[data-recovery-cancel]','dialog');await act('support review again','[data-recovery-review]','dialog');await act('support confirm','[data-recovery-confirm]','dialog');
  }else{
   const grant=seed.endsWith('Grant'),pane=grant||seed==='fresh'?'build':'missions';await context('zoo',pane);
   const selectors:Record<string,string>={q01:'[data-mission-claim]',q04:'[data-mission-claim]',eh:'[data-eh-claim]',lq:'[data-lion-panel="missions"] button',gq:'[data-giraffe-panel="missions"] button',zq:'[data-zebra-mission]',elephantGrant:'[data-elephant-grant-claim]',lionGrant:'[data-lion-panel="build"] button',giraffeGrant:'[data-giraffe-panel="build"] button',zebraGrant:'[data-zebra-grant]'};
   if(seed!=='fresh'){
    const selector=selectors[seed],b=[...root.querySelectorAll<HTMLButtonElement>(selector)].find(available);if(!b)throw Error('No ready claim '+seed);
    const proof=()=>{const s=c.read();if(s.schemaVersion!==5)throw Error('V5 claim audit required');return JSON.stringify(seed==='elephantGrant'?s.elephantGrove.grant:seed==='lionGrant'?s.lionSavanna.grant:seed==='giraffeGrant'?s.giraffePlains.grant:seed==='zebraGrant'?s.zebraGrasslands.grant:seed==='eh'?s.elephantGrove.missions.rewards:seed==='lq'?s.lionSavanna.missions.rewards:seed==='gq'?s.giraffePlains.missions.rewards:seed==='zq'?s.zebraGrasslands.missions.rewards:s.missions.rewards);};
    const before=proof();await act(seed+' actual claim',b,'stay',()=>proof()!==before);check(seed+' claim records canonical reward proof',proof()!==before);
   }
   if(grant){
    const selector=seed==='elephantGrant'?'[data-elephant-build]':seed==='zebraGrant'?'[data-zebra-build]':seed==='lionGrant'?'[data-lion-panel="build"] button':'[data-giraffe-panel="build"] button';
    const b=[...root.querySelectorAll<HTMLButtonElement>(selector)].find(b=>available(b)&&/(Rencanakan|Bangun kandang|Bangun habitat|Plan.*habitat)/.test(b.textContent??''));if(!b)throw Error('No available habitat planning control '+seed);await act(seed+' habitat preview',b,'navigate');
    if(available(get('[data-placement-command="cancel"]')))await act(seed+' cancel habitat','[data-placement-command="cancel"]');
    if(b&&available(b)){
     await act(seed+' plan habitat again',b,'navigate');if(!await c.chooseAnchor())throw Error('Cannot choose legal habitat cells '+seed);await wait(()=>available(get('[data-placement-command="confirm"]')),seed+' habitat ready');
     const count=c.read().world.habitats.length;await act(seed+' construct habitat','[data-placement-command="confirm"]','stay',()=>c.read().world.habitats.length===count+1);check(seed+' actual habitat built',c.read().world.habitats.length===count+1);
     const prefix=seed.slice(0,-5),kind=prefix==='elephant'?'elephant-grove':prefix==='lion'?'lion-savanna':prefix==='giraffe'?'giraffe-plains':'zebra-grasslands';
     await context(kind,'build');
     for(let i=0;i<2;i++){
      const welcome=prefix==='elephant'?get('[data-elephant-welcome]'):prefix==='zebra'?get('[data-zebra-welcome]'):[...root.querySelectorAll<HTMLButtonElement>(`[data-${prefix}-panel="build"] button`)].find(b=>available(b)&&/^(Sambut|Welcome)/.test(b.textContent??''))??null;
      if(available(welcome))await act(prefix+' welcome '+i,welcome);
     }
     const catalog=[...root.querySelectorAll<HTMLButtonElement>(prefix==='elephant'?'[data-elephant-place]':prefix==='zebra'?'[data-zebra-plan]':`[data-${prefix}-panel="build"] [data-facility-kind]`)].filter(available);
     for(const start of catalog)if(available(start)){
      const scope=get(`[data-${prefix}-panel="build"]`)??get('[data-hud-pane="build"]')!;
      const confirm=()=>prefix==='elephant'?get('[data-elephant-care-action="confirm"]'):prefix==='zebra'?get('[data-zebra-preview="confirm"]'):find(scope,(prefix==='lion'?lionCopy[locale]:giraffeCopy[locale]).confirm);
      const cancel=()=>prefix==='elephant'?get('[data-elephant-care-action="cancel"]'):prefix==='zebra'?get('[data-zebra-preview="cancel"]'):find(scope,(prefix==='lion'?lionCopy[locale]:giraffeCopy[locale]).cancel);
      const failed=()=>[...scope.querySelectorAll<HTMLElement>('.zoo-builder-catalog [role="status"], [data-elephant-care-preview-status]')].some(e=>visible(e)&&/stale|changed|unavailable|insufficient|retry|not saved|failed|berubah|belum cukup|tidak tersedia|gagal|belum disimpan|penghuni|occupied/i.test(e.textContent??''));
      const count=c.read().world.resources.length;
      let gated=false;
      for(let attempt=0;attempt<3&&c.read().world.resources.length===count;attempt++){
       await act(prefix+' catalog '+start.textContent+' attempt '+attempt,start,'navigate');
       const gate=[...scope.querySelectorAll<HTMLElement>('[role="status"],p')].find(e=>visible(e)&&/enrichment opens after|pengayaan.*(?:terbuka|diklaim)/i.test(e.textContent??''));
       const lockedConfirm=[...scope.querySelectorAll<HTMLButtonElement>('button')].find(b=>visible(b)&&b.textContent===(prefix==='giraffe'?giraffeCopy[locale]:lionCopy[locale]).confirm);
       if(gate&&lockedConfirm?.disabled){gated=true;check(prefix+' optional facility shows mission gate',!!gate.textContent?.trim());if(available(cancel()))await act(prefix+' cancel mission-gated preview',cancel()!);break;}
       await wait(()=>available(confirm()),prefix+' catalog confirm',30000);
       await act(prefix+' purchase '+start.textContent+' attempt '+attempt,confirm()!,'stay',()=>c.read().world.resources.length===count+1||failed());
       if(c.read().world.resources.length===count&&available(cancel())){check(prefix+' rejected placement shows feedback',failed());await act(prefix+' review changed placement',cancel()!);}
      }
      check(prefix+' catalog commits facility or explains mission gate',c.read().world.resources.length===count+1||gated);
     }
    }
   }else if(seed==='fresh'){
    await act('fresh plan macaw habitat','[data-placement-command="begin"]','navigate');if(!await c.chooseAnchor())throw Error('Cannot choose legal macaw cells');await wait(()=>available(get('[data-placement-command="confirm"]')),'macaw habitat ready');await act('fresh construct macaw habitat','[data-placement-command="confirm"]');
    await context('macaw-aviary','care');if(available(get('[data-birds-command="welcome"]')))await act('fresh welcome macaws','[data-birds-command="welcome"]');
    await context('macaw-aviary','build');
    for(const resource of ['food','water','perch']){
     await act('fresh plan '+resource,`[data-${resource}-command="preview"]`,'navigate');await wait(()=>available(get(`[data-${resource}-command="confirm"]`)),resource+' ready');await act('fresh construct '+resource,`[data-${resource}-command="confirm"]`);
    }
   }
  }
  check('valid V5 and one renderer after actions',validateSaveV5(c.read()).ok&&host.querySelectorAll('canvas').length===1);
  check('no horizontal overflow',document.documentElement.scrollWidth<=innerWidth);check('no application errors',c.errors.length===0);
  dump(checks.every(x=>x.passed)?'PASS':'FAIL');
 }catch(error){checks.push({name:'audit exception',passed:false,detail:String(error)});dump('FAIL',error);}
 finally{measuring=false;Element.prototype.scrollIntoView=oldScroll;HTMLElement.prototype.focus=oldFocus;if(root.dataset.sessionPaused==='false'&&available(get('[data-pause-toggle]')))click('[data-pause-toggle]');}
}
