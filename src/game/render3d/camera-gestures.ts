export interface CameraPointer { id:number; x:number; y:number; }
interface HeldPointer extends CameraPointer {startX:number;startY:number;dragged:boolean;}
export interface GestureTarget {panPixels(dx:number,dy:number):void;zoomBy(factor:number,anchorX:number,anchorY:number):void;}

/** Input grammar shared by mouse/touch. A tap is a future picking seam, never a pan. */
export function createCameraGestures(target:GestureTarget, rect:()=>{left:number;top:number;width:number;height:number}, onTap?:(point:CameraPointer)=>void) {
  const held=new Map<number,HeldPointer>();let pair:{x:number;y:number;distance:number}|undefined;
  const valid=(p:CameraPointer)=>Number.isInteger(p.id)&&p.id>=0&&Number.isFinite(p.x)&&Number.isFinite(p.y);
  function samplePair() {const [a,b]=[...held.values()];return {x:(a.x+b.x)/2,y:(a.y+b.y)/2,distance:Math.hypot(a.x-b.x,a.y-b.y)};}
  function remove(id:number,cancelled:boolean) {
    const p=held.get(id);if(!p)return;held.delete(id);
    if(!cancelled&&!p.dragged)onTap?.({id:p.id,x:p.x,y:p.y});
    if(pair){pair=undefined;for(const remaining of held.values()){remaining.dragged=true;remaining.startX=remaining.x;remaining.startY=remaining.y;}}
  }
  return {
    down(p:CameraPointer) {if(!valid(p)||held.has(p.id)||held.size>=2)return false;held.set(p.id,{...p,startX:p.x,startY:p.y,dragged:false});if(held.size===2){for(const p of held.values())p.dragged=true;pair=samplePair();}return true;},
    move(p:CameraPointer) {
      const old=held.get(p.id);if(!old||!valid(p))return;
      const previous={x:old.x,y:old.y};old.x=p.x;old.y=p.y;
      if(held.size===2) {
        const next=samplePair(),before=pair!;pair=next;const bounds=rect();
        target.panPixels(next.x-before.x,next.y-before.y);
        if(before.distance>6&&next.distance>6&&bounds.width>0&&bounds.height>0)target.zoomBy(next.distance/before.distance,(next.x-bounds.left)/bounds.width*2-1,1-(next.y-bounds.top)/bounds.height*2);
      } else {
        if(!old.dragged&&Math.hypot(p.x-old.startX,p.y-old.startY)<6)return;
        target.panPixels(p.x-(old.dragged?previous.x:old.startX),p.y-(old.dragged?previous.y:old.startY));old.dragged=true;
      }
    },
    up(p:CameraPointer) {if(valid(p)) {this.move(p);remove(p.id,false);}},
    cancel:(id:number)=>remove(id,true),
    cancelAll(){held.clear();pair=undefined;},
    ids:()=>[...held.keys()],
    inspect:()=>({pointers:held.size,pinching:held.size===2}),
  };
}
