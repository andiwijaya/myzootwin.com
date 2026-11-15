import {type Group} from 'three';
type Port={slot:number;bowlScale:number;waterY:number;waterBaseY:number;waterLevelRange:number;waterMouth:number[]};
/** QA adapter for retained named parts. All dimensions come from the imported GLB extras. */
export function applyMasterStock(group:Group,stock:readonly number[]){
 if(stock.length!==2||stock.some(n=>!Number.isInteger(n)||n<0||n>4))throw new RangeError('Stock must be two integers from 0 to 4');
 let ports:Port[]|undefined;group.traverse(o=>{ports??=o.userData.originalFixtureAsset?.contacts?.ports;});
 const changes:{name:string;visible:boolean;position:number[];scale:number[]}[]=[];
 group.traverse(o=>{let m=o.name.match(/^food-portion-(\d)-(\d)$/);if(m)o.visible=Number(m[2])<stock[Number(m[1])];else if((m=o.name.match(/^food-fill-(\d)$/)))o.visible=stock[Number(m[1])]>0;else if((m=o.name.match(/^water-port-(\d)$/))){
  const slot=Number(m[1]),p=ports?.[slot],surface=o.userData.fixtureWaterSurface;if(!p||!surface)throw Error('Missing retained water anchors');
  const y=(p.waterY-p.waterLevelRange*(1-stock[slot]/4)-p.waterBaseY)/p.bowlScale,profile=[[.015,.049],[.026,.062],[.051,.071],[.059,.073]],upper=profile.findIndex(r=>r[0]>=y),i=upper<1?1:upper,a=profile[i-1],b=profile[i],t=Math.max(0,Math.min(1,(y-a[0])/(b[0]-a[0]))),radius=(a[1]+(b[1]-a[1])*t)*p.bowlScale*Math.cos(Math.PI/surface.segments)-.00012,ratio=radius/surface.baseRadiusM;
  o.visible=stock[slot]>0;o.scale.set(ratio,1,ratio);o.position.set(p.waterMouth[0]*(1-ratio),-p.waterLevelRange*(1-stock[slot]/4),p.waterMouth[2]*(1-ratio));
 }else return;
 changes.push({name:o.name,visible:o.visible,position:o.position.toArray(),scale:o.scale.toArray()});});group.updateMatrixWorld(true);return changes;
}
