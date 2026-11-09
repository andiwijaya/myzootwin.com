type Pointer={id:number;x:number;y:number};
type Options={panel:HTMLElement;host:HTMLElement;status:HTMLElement;canRun():boolean;session():Readonly<Record<string,unknown>>|undefined;after():void};
const keys=['cameraZoom','cameraPanX','cameraPanZ','cameraAzimuth','cameraPointers','cameraPinching','selectionActive','selectionRevision','placementConfirmations','zebraCarePreviewActive','commandRevision','currency'];
/** Explicit untrusted DOM input regression; no physical/native touch claim. */
export function installQaPointerProbes(o:Options){
 const events=new AbortController(),records:unknown[]=[],buttons:HTMLButtonElement[]=[];let held:Pointer[]=[],disposed=false;
 const summary=()=>{const s=o.session()??{};return Object.fromEntries(keys.filter(k=>k in s).map(k=>[k,s[k]]));};
 function send(canvas:HTMLCanvasElement,type:string,p:Pointer){canvas.dispatchEvent(new PointerEvent(type,{bubbles:true,cancelable:true,pointerId:p.id,pointerType:'touch',button:0,buttons:type==='pointerup'||type==='pointercancel'?0:1,clientX:p.x,clientY:p.y,isPrimary:p.id===900001}));}
 function run(action:'pinch'|'hold'|'release'){
  const canvas=o.host.querySelector('canvas');if(disposed||!canvas||!o.canRun()||records.length>=24){o.status.textContent='Pointer probe refused: use actual Resume with the manual0ms driver outside Studio; bounded24records.';return;}
  if(action!=='release'&&(held.length||Number(o.session()?.cameraPointers??0)!==0)){o.status.textContent='Release held QA pointers before another probe';return;}
  const before=summary(),b=canvas.getBoundingClientRect(),x=b.left+b.width/2,y=b.top+b.height/2;
  if(action==='release'){for(const p of held)send(canvas,'pointerup',p);held=[];}
  else{held=[{id:900001,x:x-35,y},{id:900002,x:x+35,y}];for(const p of held)send(canvas,'pointerdown',p);if(action==='pinch'){held=[{id:900001,x:x-65,y:y+8},{id:900002,x:x+65,y:y+8}];for(const p of held)send(canvas,'pointermove',p);for(const p of held)send(canvas,'pointerup',p);held=[];}}
  records.push({action,at:new Date().toISOString(),trusted:false,method:'EXPLICIT QA PointerEvent injection on original canvas listeners; synthetic pointers cannot establish native capture. No replacement input/gameplay/time.',before,after:summary()});o.status.textContent='Explicit untrusted pointer probe: '+action;o.after();
 }
 for(const [action,text]of [['pinch','Synthetic two-pointer pinch (QA)'],['hold','Hold synthetic touch pair (QA)'],['release','Release late synthetic pointers (QA)']]as const){const b=document.createElement('button');b.type='button';b.dataset.qaPointerProbe=action;b.textContent=text;b.addEventListener('click',()=>run(action),{signal:events.signal});o.panel.append(b);buttons.push(b);}
 return{inspect:()=>({scope:'Explicit untrusted DOM pointer probes; not physical touch/native capture',records:[...records],held:held.length,disposed}),dispose(){if(disposed)return;const canvas=o.host.querySelector('canvas');if(canvas)for(const p of held)send(canvas,'pointercancel',p);held=[];disposed=true;events.abort();for(const b of buttons)b.remove();}};
}
