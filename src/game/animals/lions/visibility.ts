import type {RuntimeState,Point} from '../../core/state.ts';
import type {LionAnimal} from '../../core/species.ts';
/** The shade's central opaque stone can conceal a resting lion from a particular outside viewer. */
export function lionVisible(s:RuntimeState,a:LionAnimal,viewer:Point):boolean{
 if(a.currentBehavior!=='rest')return true;const den=s.world.resources.find(r=>r.kind==='lion-den'&&r.habitatId===a.habitatId);if(!den)return true;const c={x:den.cell.x+.5,z:den.cell.z+.5},dx=a.position.x-viewer.x,dz=a.position.z-viewer.z,length=dx*dx+dz*dz,t=length?((c.x-viewer.x)*dx+(c.z-viewer.z)*dz)/length:0;
 return !(t>0&&t<1&&Math.hypot(viewer.x+dx*t-c.x,viewer.z+dz*t-c.z)<.58);
}
