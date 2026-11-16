type HeldSize={element:HTMLElement;value:string;priority:string;height:number};

/** Keep flowing phone Build panels at their pre-action height until explicit navigation. */
export function mountBuildScrollStability(root:HTMLElement,signal:AbortSignal){
 const pane=root.querySelector<HTMLElement>('[data-hud-pane="build"]'),scroller=pane?.closest<HTMLElement>('[data-hud-panels]');
 if(!pane||!scroller)return;
 const documentStyle=root.ownerDocument.documentElement.style;
 const held:HeldSize[]=[];let scope:string|null=null,anchor:{value:string;priority:string}|null=null,width=window.innerWidth;
 const key=()=>root.dataset.zooScope??'';
 const active=()=>root.dataset.hudActive==='true'&&root.dataset.hudTab==='build'&&root.hasAttribute('data-zoo-scope')&&window.innerWidth<900&&getComputedStyle(scroller).overflowY==='visible';
 const restore=(style:CSSStyleDeclaration,name:string,value:string,priority:string)=>{if(value)style.setProperty(name,value,priority);else style.removeProperty(name);};
 function release(){
  for(const h of held)restore(h.element.style,'min-block-size',h.value,h.priority);
  held.length=0;scope=null;
  if(anchor){restore(documentStyle,'overflow-anchor',anchor.value,anchor.priority);anchor=null;}
 }
 function hold(element:HTMLElement){
  const style=getComputedStyle(element),rect=element.getBoundingClientRect();
  const edges=style.boxSizing==='border-box'?0:['paddingTop','paddingBottom','borderTopWidth','borderBottomWidth'].reduce((n,k)=>n+(Number.parseFloat(style[k as keyof CSSStyleDeclaration] as string)||0),0);
  const height=Math.max(0,rect.height-edges);let entry=held.find(h=>h.element===element);
  if(!entry){entry={element,value:element.style.getPropertyValue('min-block-size'),priority:element.style.getPropertyPriority('min-block-size'),height};held.push(entry);}
  entry.height=Math.max(entry.height,height);element.style.setProperty('min-block-size',entry.height+'px');
 }
 function preserve(event:Event){
  const target=event.target;if(!(target instanceof Element))return;
  // A touch can become a swipe and be cancelled; release only when navigation is activated.
  if(target.closest('[data-zoo-destination],[data-zoo-back],button[data-hud-tab]')){if(event.type==='click')release();return;}
  const escape=event instanceof KeyboardEvent&&event.key==='Escape';
  if(event.type==='keydown'&&!escape)return;
  if(!target.closest('[data-hud-pane="build"]')||(!escape&&!target.closest('button'))||!active())return;
  if(scope!==null&&scope!==key())release();scope=key();
  // Prevent anchor adjustments and preserve enough document height for bottom-of-page actions.
  // No scroll restoration loop: the player remains free to scroll after the action.
  if(!anchor){anchor={value:documentStyle.getPropertyValue('overflow-anchor'),priority:documentStyle.getPropertyPriority('overflow-anchor')};documentStyle.setProperty('overflow-anchor','none');}
  // Reserve each enclosing preview/card, so content below it also keeps its screen position.
  for(let box=target.closest<HTMLElement>('.zoo-resource-card,.zoo-builder-catalog,[data-placement-tools]');box&&box!==pane;box=box.parentElement?.closest<HTMLElement>('.zoo-resource-card,.zoo-builder-catalog,[data-placement-tools]')??null){
   for(const card of box.querySelectorAll<HTMLElement>('.zoo-resource-card'))if(card.checkVisibility())hold(card);
   hold(box);
  }
  hold(pane!);hold(root);
 }
 root.addEventListener('pointerdown',preserve,{capture:true,signal});
 root.addEventListener('click',preserve,{capture:true,signal});
 root.addEventListener('keydown',preserve,{capture:true,signal});
 const observer=new MutationObserver(()=>{if(scope!==null&&(!active()||scope!==key()))release();});
 observer.observe(root,{attributes:true,attributeFilter:['data-hud-tab','data-zoo-scope','data-hud-active']});
 window.addEventListener('resize',()=>{if(width!==window.innerWidth){width=window.innerWidth;release();}},{signal});
 signal.addEventListener('abort',()=>{observer.disconnect();release();},{once:true});
}
