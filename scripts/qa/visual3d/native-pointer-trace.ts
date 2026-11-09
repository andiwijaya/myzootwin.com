/** QA-only passive observation. No event injection, cancellation, commands or timers. */
export function traceNativePointers(host:HTMLElement){
 const events=new AbortController(),records:unknown[]=[];
 for(const type of ['pointerdown','pointerup','pointercancel'] as const)host.addEventListener(type,event=>{
  if(!(event.target instanceof HTMLCanvasElement))return;
  const r=event.target.getBoundingClientRect();
  records.push({type,trusted:event.isTrusted,pointerType:event.pointerType,id:event.pointerId,x:event.clientX,y:event.clientY,rect:{left:r.left,top:r.top,width:r.width,height:r.height},camera:{zoom:host.dataset.cameraZoom,azimuth:host.dataset.cameraAzimuth,panX:host.dataset.cameraPanX,panZ:host.dataset.cameraPanZ},selectedId:host.dataset.selectedId??null});
  if(records.length>32)records.shift();
 },{signal:events.signal,passive:true});
 return{inspect:()=>structuredClone(records),dispose:()=>events.abort()};
}
