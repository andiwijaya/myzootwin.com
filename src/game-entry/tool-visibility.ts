/** Read UI attributes only; avoid a layout measurement on every simulation update. */
export function isHudToolVisible(section:HTMLElement|null):boolean{
  if(!section||section.hidden||section.closest<HTMLElement>('[data-hud-pane]')?.hidden)return false;
  const root=section.closest<HTMLElement>('[data-play-entry]'),focus=root?.dataset.habitatFocus,kind=section.dataset.focusKind;
  return !focus||!kind||focus===kind;
}

/** Hidden presenters retain their latest view and draw it when the user opens that panel. */
export function watchHudVisibility(section:HTMLElement|null|undefined,signal:AbortSignal,render:()=>void){
  const root=section?.closest('[data-play-entry]');if(!root)return;
  const observer=new MutationObserver(()=>{if(!signal.aborted)render();});
  observer.observe(root,{attributes:true,attributeFilter:['data-hud-tab','data-habitat-focus','data-hud-active','lang']});
  signal.addEventListener('abort',()=>observer.disconnect(),{once:true});
}
