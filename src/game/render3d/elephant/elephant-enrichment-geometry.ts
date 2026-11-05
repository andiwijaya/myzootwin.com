import {BoxGeometry,CylinderGeometry,IcosahedronGeometry} from 'three';
import {Batch} from '../tropical-diorama.ts';
/** Original one-cell ground props; leaf overhang is above the entire articulated elephant envelope. */
export function createElephantEnrichmentGeometry(){
 const shade=new Batch(),log=new Batch();
 shade.add(new CylinderGeometry(.10,.14,2.65,7),'#826647',[0,1.325,0],[1,1,1]);
 shade.add(new IcosahedronGeometry(1,2),'#5c8555',[0,2.95,0],[1.65,.38,1.65]);
 for(const [x,z,size]of [[-.55,0,1],[.55,0,1],[0,.48,.95],[0,-.48,.95]])shade.add(new IcosahedronGeometry(1,1),'#5c8555',[x,2.95,z],[size,.38,size]);
 for(const x of [-.18,.18])shade.add(new BoxGeometry(1,1,1),'#7b6640',[x,.08,0],[.12,.16,.55]);
 log.add(new CylinderGeometry(.47,.47,.025,12),'#8f7955',[0,.015,0],[1,1,1]);
 const trunk=new CylinderGeometry(.20,.23,.86,9);trunk.rotateZ(Math.PI/2);log.add(trunk,'#80613f',[0,.24,0],[1,1,1]);
 for(const x of [-.435,.435]){const end=new CylinderGeometry(.175,.175,.012,9);end.rotateZ(Math.PI/2);log.add(end,'#b79563',[x,.24,0],[1,1,1]);}
 log.add(new BoxGeometry(1,1,1),'#6d884d',[.12,.39,0],[.22,.045,.12]);
 return {shade:shade.geometry(),log:log.geometry()};
}
