import {zooUiCopy} from './zoo-ui-copy.ts';
import type {HabitatKind} from '../game/core/species.ts';
import type {ZooOverview} from '../game/core/zoo-overview.ts';
import type {HabitatFocusView} from '../game/render3d/habitat-focus.ts';
import type {SpeedView} from './speed-panel.ts';
import {scrollHudTarget} from './hud-layout.ts';

/** UI state only. All navigation, construction, and care remain native scene commands. */
export function mountFarmUi(root:HTMLElement){
  const events=new AbortController();let overview:ZooOverview={animals:0,habitats:[]},kind:HabitatKind|null=null,paused=true,speed=1,panOpen=false,notice=false;
  const set=(selector:string,value:string)=>{const el=root.querySelector(selector);if(el&&el.textContent!==value)el.textContent=value;};
  const ready=()=>root.querySelector('[data-renderer-panel]')?.getAttribute('data-renderer-state')==='ready';
  function render(){
    const locale=root.lang==='id'?'id':'en',c=zooUiCopy[locale],active=ready();
    root.dataset.zooScope=kind??'zoo';
    for(const el of root.querySelectorAll<HTMLElement>('[data-zoo-copy]')){const key=el.dataset.zooCopy as keyof typeof c;const value=c[key];if(typeof value==='string'&&el.textContent!==value)el.textContent=value;}
    const controls=root.querySelector<HTMLElement>('[data-zoo-controls]');if(controls)controls.hidden=!active;
    set('[data-hud-animals]',new Intl.NumberFormat(locale).format(overview.animals));
    set('[data-zoo-session-status]',paused?c.paused:speed+'×');
    root.querySelector('[data-zoo-session-status]')?.setAttribute('aria-label',(paused?c.paused:c.running)+' · '+speed+'×');
    set('[data-zoo-current-area]',kind?c.names[kind]:c.whole);
    set('[data-zoo-panel-title]',kind?c.names[kind]:c.overview);
    set('[data-zoo-build-label]',kind?c.buildHome:c.buildZoo);
    const nav=root.querySelector('[data-zoo-navigation]');nav?.setAttribute('aria-label',c.destinations);
    for(const button of root.querySelectorAll<HTMLButtonElement>('[data-zoo-destination]')){
      const target=button.dataset.zooDestination as HabitatKind|'zoo',built=target==='zoo'||overview.habitats.some(h=>h.kind===target),selected=target===(kind??'zoo');
      const name=target==='zoo'?c.zoo:c.names[target];button.setAttribute('aria-pressed',String(selected));button.disabled=!active;
      button.dataset.locked=String(!built);button.setAttribute('aria-label',name+(built?'':' · '+c.locked));
      const label=button.querySelector('[data-zoo-destination-label]');if(label)label.textContent=name;
      const lock=button.querySelector<HTMLElement>('[data-zoo-locked]');if(lock){lock.hidden=built;lock.textContent=c.locked;}
    }
    const note=root.querySelector<HTMLElement>('[data-zoo-navigation-note]');if(note){note.hidden=!notice;note.textContent=c.lockedNote;}
    const guestNote=root.querySelector<HTMLElement>('[data-zoo-guests-scope]');if(guestNote){guestNote.hidden=root.dataset.hudTab!=='visitors';guestNote.textContent=c.allGuests;}
    const pan=root.querySelector<HTMLButtonElement>('[data-zoo-pan-toggle]');if(pan){pan.disabled=!active;pan.setAttribute('aria-expanded',String(panOpen));pan.setAttribute('aria-label',c.pan);pan.title=c.pan;}
    const pad=root.querySelector<HTMLElement>('[data-zoo-pan-pad]');if(pad)pad.hidden=!panOpen||!active;
    for(const [value,key]of [['pan-left','panLeft'],['pan-right','panRight'],['pan-up','panUp'],['pan-down','panDown']]as const){const b=root.querySelector(`[data-camera-command="${value}"]`);b?.setAttribute('aria-label',c[key]);b?.setAttribute('title',c[key]);}
    const back=root.querySelector<HTMLButtonElement>('[data-habitat-zoom-exit]');if(back){back.hidden=false;back.disabled=!kind;back.setAttribute('aria-label',c.back);back.title=c.back;}
    const reset=root.querySelector<HTMLButtonElement>('[data-camera-command="reset"]');if(reset){reset.textContent=c.fit;reset.setAttribute('aria-label',kind?(locale==='id'?'Tampilkan seluruh kandang':'Fit whole habitat'):c.whole);}
    root.querySelector('[data-zoo-build]')?.toggleAttribute('disabled',!active);
  }
  root.addEventListener('scene-zoo-overview-change',e=>{overview=(e as CustomEvent<ZooOverview>).detail;render();},{signal:events.signal,capture:true});
  root.addEventListener('scene-habitat-focus-change',e=>{const v=(e as CustomEvent<HabitatFocusView>).detail;kind=v.active?v.kind:null;notice=false;panOpen=false;render();},{signal:events.signal,capture:true});
  root.addEventListener('scene-speed-change',e=>{const v=(e as CustomEvent<SpeedView>).detail;paused=v.paused;speed=v.speed;if(paused)panOpen=false;render();},{signal:events.signal,capture:true});
  root.addEventListener('scene-habitat-tap',e=>{const id=(e as CustomEvent<{habitatId:string}>).detail.habitatId;if(kind||!ready()||!overview.habitats.some(h=>h.id===id))return;e.preventDefault();root.dispatchEvent(new Event('hud-input-cancel'));root.dispatchEvent(new CustomEvent('zoo-ui-navigate',{detail:id}));},{signal:events.signal});
  root.addEventListener('click',e=>{
    const target=e.target instanceof Element?e.target:null,b=target?.closest<HTMLButtonElement>('[data-zoo-destination]');
    if(b&&!b.disabled){
      const destination=b.dataset.zooDestination as HabitatKind|'zoo',home=overview.habitats.find(h=>h.kind===destination);
      root.dispatchEvent(new Event('hud-input-cancel'));
      if(destination!=='zoo'&&!home){
        root.dispatchEvent(new CustomEvent('zoo-ui-navigate',{detail:null}));notice=true;
        root.dispatchEvent(new CustomEvent('hud-reveal',{detail:'build'}));
        const selectors:Record<HabitatKind,string>={'macaw-aviary':'[data-placement-tools]','elephant-grove':'[data-elephant-catalog]','lion-savanna':'[data-lion-panel="build"]','giraffe-plains':'[data-giraffe-panel="build"]','zebra-grasslands':'[data-zebra-grant-panel]'};
        scrollHudTarget(root.querySelector(selectors[destination]),'start');
      }else{notice=false;root.dispatchEvent(new CustomEvent('zoo-ui-navigate',{detail:home?.id??null}));}
      render();
    }
    if(target?.closest('[data-zoo-build]')){notice=false;root.dispatchEvent(new Event('hud-input-cancel'));root.dispatchEvent(new CustomEvent('hud-reveal',{detail:'build'}));render();if(window.innerWidth<900)root.querySelector('.zoo-notes-heading')?.scrollIntoView({block:'start',behavior:'instant'});}
    if(target?.closest('[data-zoo-pan-toggle]')){panOpen=!panOpen;root.dispatchEvent(new Event('hud-input-cancel'));if(panOpen&&Number(root.querySelector<HTMLElement>('[data-preview-stage]')?.dataset.cameraZoom??1)<=1)root.querySelector<HTMLButtonElement>('[data-camera-command="zoom-in"]')?.click();render();}
  },{signal:events.signal});
  root.querySelector('[data-zoo-navigation]')?.addEventListener('keydown',event=>{const e=event as KeyboardEvent;if(!['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','Home','End'].includes(e.key))return;const buttons=[...root.querySelectorAll<HTMLButtonElement>('[data-zoo-destination]')],current=buttons.indexOf(e.target as HTMLButtonElement);if(current<0)return;e.preventDefault();const next=e.key==='Home'?0:e.key==='End'?buttons.length-1:(current+(['ArrowLeft','ArrowUp'].includes(e.key)?buttons.length-1:1))%buttons.length;buttons[next]?.focus();},{signal:events.signal});
  const observer=new MutationObserver(render);observer.observe(root,{subtree:true,attributes:true,attributeFilter:['lang','data-renderer-state','data-hud-tab']});
  render();return{dispose(){events.abort();observer.disconnect();delete root.dataset.zooScope;}};
}
