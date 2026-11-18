export interface CameraPointer { id:number; x:number; y:number; pointerType?:string; }
export type CameraDragMode = 'pan' | 'rotate';
interface HeldPointer extends CameraPointer {startX:number;startY:number;appliedX:number;appliedY:number;travel:number;started:number;dragged:boolean;}
export interface GestureTarget {
  panPixels(dx:number,dy:number):void;
  zoomBy(factor:number,anchorX:number,anchorY:number):void;
  rotateBy?(degrees:number):void;
  panZoomPixels?(dx:number,dy:number,factor:number,anchorX:number,anchorY:number):void;
}
export interface CameraGestureOptions {requestFrame?:()=>void;now?:()=>number;onTapStart?:(point:CameraPointer)=>void;}

/** Raw pointers own the gesture immediately; camera work can be consumed once per visual frame. */
export function createCameraGestures(target:GestureTarget, rect:()=>{left:number;top:number;width:number;height:number}, onTap?:(point:CameraPointer)=>void, dragMode:()=>CameraDragMode=()=> 'pan', options:CameraGestureOptions={}) {
  const held=new Map<number,HeldPointer>(),now=options.now??(()=>performance.now());
  let pair:{x:number;y:number;distance:number}|undefined,bounds:ReturnType<typeof rect>|undefined,dirty=false,updates=0,moves=0,taps=0,suppressedTaps=0;
  const valid=(p:CameraPointer)=>Number.isInteger(p.id)&&p.id>=0&&Number.isFinite(p.x)&&Number.isFinite(p.y);
  function samplePair() {const [a,b]=[...held.values()];return {x:(a.x+b.x)/2,y:(a.y+b.y)/2,distance:Math.hypot(a.x-b.x,a.y-b.y)};}
  function flush() {
    if(!dirty||!bounds)return false;dirty=false;
    if(held.size===2&&pair){
      const next=samplePair(),before=pair;pair=next;
      const dx=next.x-before.x,dy=next.y-before.y,factor=before.distance>6&&next.distance>6?next.distance/before.distance:1;
      if(dx===0&&dy===0&&factor===1)return false;
      const ax=(next.x-bounds.left)/bounds.width*2-1,ay=1-(next.y-bounds.top)/bounds.height*2;
      if(target.panZoomPixels)target.panZoomPixels(dx,dy,factor,ax,ay);
      else{if(dx||dy)target.panPixels(dx,dy);if(factor!==1)target.zoomBy(factor,ax,ay);}
    }else if(held.size===1){
      const p=held.values().next().value!;if(!p.dragged)return false;
      const dx=p.x-p.appliedX,dy=p.y-p.appliedY;p.appliedX=p.x;p.appliedY=p.y;
      if(p.pointerType==='touch'||dragMode()==='rotate'){if(dx===0)return false;target.rotateBy?.(-dx/bounds.width*180);}
      else{if(dx===0&&dy===0)return false;target.panPixels(dx,dy);}
    }else return false;
    updates++;return true;
  }
  function move(p:CameraPointer,schedule=true) {
    const old=held.get(p.id);if(!old||!valid(p))return;
    const distance=Math.hypot(p.x-old.x,p.y-old.y);if(distance===0)return;
    moves++;old.travel+=distance;old.x=p.x;old.y=p.y;
    if(!old.dragged&&(Math.hypot(p.x-old.startX,p.y-old.startY)>=4||old.travel>=8))old.dragged=true;
    if(held.size===1&&!old.dragged)return;
    dirty=true;if(schedule){if(options.requestFrame)options.requestFrame();else flush();}
  }
  function remove(id:number,cancelled:boolean) {
    const p=held.get(id);if(!p)return;
    const elapsed=now()-p.started,tap=!cancelled&&!p.dragged&&elapsed>=0&&elapsed<=300;
    held.delete(id);
    if(tap){taps++;onTap?.({id:p.id,x:p.startX,y:p.startY,...(p.pointerType?{pointerType:p.pointerType}:{})});}else suppressedTaps++;
    dirty=false;
    if(pair){pair=undefined;for(const remaining of held.values()){remaining.dragged=true;remaining.startX=remaining.appliedX=remaining.x;remaining.startY=remaining.appliedY=remaining.y;}}
    if(!held.size)bounds=undefined;
  }
  return {
    down(p:CameraPointer) {
      if(!valid(p)||held.has(p.id)||held.size>=2)return false;
      if(!held.size){const next=rect();if(![next.left,next.top,next.width,next.height].every(Number.isFinite)||next.width<=0||next.height<=0)return false;bounds=next;}
      else flush();
      held.set(p.id,{...p,startX:p.x,startY:p.y,appliedX:p.x,appliedY:p.y,travel:0,started:now(),dragged:false});
      if(held.size===1&&p.pointerType==='touch')options.onTapStart?.({...p});
      if(held.size===2){for(const p of held.values())p.dragged=true;pair=samplePair();}return true;
    },
    move,
    flush,
    up(p:CameraPointer) {if(valid(p)&&held.has(p.id)){move(p,false);flush();remove(p.id,false);}},
    cancel:(id:number)=>remove(id,true),
    cancelAll(){suppressedTaps+=held.size;held.clear();pair=undefined;bounds=undefined;dirty=false;},
    ids:()=>[...held.keys()],
    inspect:()=>({pointers:held.size,pinching:held.size===2,pending:dirty,updates,moves,taps,suppressedTaps}),
  };
}
