import type {HabitatKind} from '../game/core/species.ts';
import type {HabitatFocusView} from '../game/render3d/habitat-focus.ts';
import {entryMessages} from './locale.ts';

export const habitatNames: Record<HabitatKind, string> = {'macaw-aviary':'Macaw Aviary','elephant-grove':'Elephant Grove','lion-savanna':'Lion Savanna','giraffe-plains':'Giraffe Plains','zebra-grasslands':'Zebra Grasslands'};
const messages = {
  id: {enter:'Zoom kandang', back:'Kembali ke zoo', mode:'Zoom kandang', fit:'Utuh', reset:'Tampilkan seluruh kandang', help:'Geser untuk melihat isi kandang. Cubit atau gunakan +/− untuk zoom; ↶/↷ untuk memutar. Kehidupan seluruh zoo tetap berjalan.', build:'Atur fasilitas kandang melalui tab Perawatan. Untuk membangun jalur atau memperluas zoo, kembali ke tampilan zoo.'},
  en: {enter:'Zoom habitat', back:'Back to zoo', mode:'Habitat zoom', fit:'Fit', reset:'Fit whole habitat', help:'Drag to explore this habitat. Pinch or use +/− to zoom; ↶/↷ to rotate. Life across the zoo keeps running.', build:'Manage habitat facilities in Care. Return to the zoo view to build paths or expand the zoo.'}
};

/** Presentation-only filtering; existing sections keep their own ready/unlock/transaction gates. */
export function mountHabitatFocusPanel(root:HTMLElement, host:HTMLElement, signal:AbortSignal, actions:{command:(command:'enter'|'exit',id?:string)=>void;description:(value:string|null)=>void}) {
  const enter=document.createElement('button');enter.type='button';enter.dataset.habitatZoom='';enter.hidden=true;root.querySelector('[data-scene-selection]')?.prepend(enter);
  const toolbar=document.createElement('div');toolbar.className='habitat-focus-toolbar';toolbar.dataset.habitatFocusToolbar='';toolbar.hidden=true;
  const label=document.createElement('strong'),back=document.createElement('button');back.type='button';back.dataset.habitatZoomExit='';label.setAttribute('role','status');toolbar.append(label,back);root.querySelector('[data-hud-world]')?.prepend(toolbar);
  const note=document.createElement('p');note.dataset.habitatFocusNote='';note.className='habitat-focus-note';note.hidden=true;root.querySelector('[data-hud-pane="build"]')?.prepend(note);
  const groups:Record<HabitatKind,string>={
    'macaw-aviary':'[data-mission-tools],[data-recovery-tools],[data-bird-tools],[data-food-tools],[data-water-tools],[data-perch-tools],[data-macaw-tools]',
    'elephant-grove':'[data-elephant-recovery],[data-elephant-guide],[data-elephant-missions],[data-elephant-care],[data-elephant-catalog]',
    'lion-savanna':'[data-lion-panel]', 'giraffe-plains':'[data-giraffe-panel]',
    'zebra-grasslands':'[data-zebra-care],[data-zebra-access],[data-zebra-grant-panel],[data-zebra-missions],[data-zebra-recovery],[data-zebra-guide]'
  };
  for(const [kind,selector] of Object.entries(groups))for(const section of root.querySelectorAll<HTMLElement>(selector))section.dataset.focusKind=kind;
  let view:HabitatFocusView={active:false,habitatId:null,kind:null,selectedHabitatId:null,selectedKind:null},ready=false,locale:'id'|'en'='id',wasActive=false,previousGuided='false';
  function render(){
    const active=ready&&view.active&&view.kind!==null,c=messages[locale];
    if(active&&!wasActive){previousGuided=root.dataset.guided??'false';root.dataset.guided='false';root.dispatchEvent(new CustomEvent('hud-reveal',{detail:'care'}));}
    if(!active&&wasActive)root.dataset.guided=ready?previousGuided:'false';
    wasActive=active;
    if(active)root.dataset.habitatFocus=view.kind!;else delete root.dataset.habitatFocus;
    toolbar.hidden=!active;note.hidden=!active;note.textContent=c.build;
    label.textContent=active?c.mode+' · '+habitatNames[view.kind!]:'';back.textContent=c.back;
    enter.hidden=!ready||active||!view.selectedHabitatId;enter.textContent=c.enter;
    enter.setAttribute('aria-label',view.selectedKind?c.enter+' · '+habitatNames[view.selectedKind]:c.enter);
    const reset=root.querySelector<HTMLButtonElement>('[data-camera-command="reset"]');
    if(reset){const text=active?c.reset:entryMessages[locale].cameraReset;reset.textContent=active?c.fit:text;reset.setAttribute('aria-label',text);reset.title=text;}
    root.querySelector('[data-camera-help]')?.replaceChildren(active?c.help:entryMessages[locale].cameraHelp);
    actions.description(active?c.mode+' · '+habitatNames[view.kind!]+'. '+c.help:null);
  }
  enter.addEventListener('click',()=>{if(ready&&view.selectedHabitatId){actions.command('enter',view.selectedHabitatId);host.focus({preventScroll:true});}},{signal});
  back.addEventListener('click',()=>{actions.command('exit');host.focus({preventScroll:true});},{signal});
  toolbar.addEventListener('keydown',event=>{if(event.key==='Escape'&&!root.querySelector('dialog[open]')){event.preventDefault();actions.command('exit');host.focus({preventScroll:true});}},{signal});
  host.addEventListener('scene-habitat-focus-change',event=>{view=(event as CustomEvent<HabitatFocusView>).detail;render();},{signal});
  return {update(nextReady:boolean,nextLocale:'id'|'en'){ready=nextReady;locale=nextLocale;if(!ready)view={active:false,habitatId:null,kind:null,selectedHabitatId:null,selectedKind:null};render();},dispose(){toolbar.remove();enter.remove();note.remove();delete root.dataset.habitatFocus;}};
}
