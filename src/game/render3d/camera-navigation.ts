export interface CameraFrame {
  width: number; height: number; halfWidth: number; halfHeight: number;
  rightX: number; rightZ: number; upX: number; upZ: number;
  originX: number; originZ: number; mapWidth: number; mapHeight: number;
}
export type CameraCommand = 'zoom-in' | 'zoom-out' | 'reset';
const clamp = (value:number, min:number, max:number) => Math.max(min,Math.min(max,value));

/** Ground-plane navigation only: no simulation, renderer loop, picking or placement. */
export function createCameraNavigation(onChange:()=>void = ()=>{}) {
  let frame:CameraFrame|undefined, zoom=1, x=0, z=0;
  function limits() {
    if(!frame)return {minX:0,maxX:0,minZ:0,maxZ:0};
    const t=1-1/zoom, f=frame;
    // At overview no pan; zoom progressively exposes travel, always inside the map.
    return {minX:(-f.mapWidth/2+.6-f.originX)*t,maxX:(f.mapWidth/2-.6-f.originX)*t,minZ:(-f.mapHeight/2+.6-f.originZ)*t,maxZ:(f.mapHeight/2-.6-f.originZ)*t};
  }
  function commit() {const b=limits();x=clamp(x,b.minX,b.maxX);z=clamp(z,b.minZ,b.maxZ);onChange();}
  function ground(u:number,v:number) {
    const f=frame!;const determinant=f.rightX*f.upZ-f.rightZ*f.upX;
    return {x:(u*f.upZ-f.rightZ*v)/determinant,z:(f.rightX*v-u*f.upX)/determinant};
  }
  function zoomBy(factor:number, anchorX=0, anchorY=0) {
    if(!frame||!Number.isFinite(factor)||factor<=0||![anchorX,anchorY].every(Number.isFinite))return;
    const next=clamp(zoom*factor,1,3),delta=1/zoom-1/next;
    const p=ground(clamp(anchorX,-1,1)*frame.halfWidth*delta,clamp(anchorY,-1,1)*frame.halfHeight*delta);
    x+=p.x;z+=p.z;zoom=next;commit();
  }
  return {
    configure(next:CameraFrame) {
      if(!Object.values(next).every(Number.isFinite)||next.width<=0||next.height<=0||next.halfWidth<=0||next.halfHeight<=0||next.mapWidth<=2||next.mapHeight<=2||Math.abs(next.originX)>next.mapWidth/2-.6||Math.abs(next.originZ)>next.mapHeight/2-.6||Math.abs(next.rightX*next.upZ-next.rightZ*next.upX)<.01)throw new RangeError('Invalid camera frame');
      frame={...next};commit();
    },
    panPixels(dx:number,dy:number) {
      if(!frame||![dx,dy].every(Number.isFinite))return;
      const p=ground(-dx*2*frame.halfWidth/(zoom*frame.width),dy*2*frame.halfHeight/(zoom*frame.height));x+=p.x;z+=p.z;commit();
    },
    zoomBy,
    command(command:CameraCommand) {if(command==='reset'){zoom=1;x=z=0;commit();}else zoomBy(command==='zoom-in'?1.25:.8);},
    inspect:()=>({zoom,x,z,focusX:(frame?.originX??0)+x,focusZ:(frame?.originZ??0)+z,...limits()}),
  };
}
