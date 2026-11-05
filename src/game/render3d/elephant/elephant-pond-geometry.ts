import {CircleGeometry,CylinderGeometry,SphereGeometry} from 'three';
import {Batch} from '../tropical-diorama.ts';
/** Shallow game-scale source, wholly within its one authoritative cell; no vertical wall to walk through. */
export const ELEPHANT_POND_VISUAL=Object.freeze({waterBase:.085,waterRise:.01,radius:.49});
export function createElephantPondGeometry(){
 const b=new Batch();b.add(new CylinderGeometry(.45,.42,.07,16),'#95805c',[0,.04,0]);
 for(let i=0;i<8;i++){const a=i*Math.PI/4;b.add(new SphereGeometry(1,6,3),i%2?'#a69b7a':'#8d9279',[Math.sin(a)*.415,.073,Math.cos(a)*.415],[.063,.034,.063]);}
 const water=new CircleGeometry(.35,16);water.rotateX(-Math.PI/2);
 return {body:b.geometry(),water};
}
