import {MeshStandardMaterial,Vector3} from 'three';
import {createZebraRig,createZebraGeometry} from '../../../src/game/render3d/zebra/rig.ts';
import {createGiraffeRig,createGiraffeGeometry} from '../../../src/game/render3d/giraffe/rig.ts';
import {createLionRig,createLionGeometry} from '../../../src/game/render3d/lion/rig.ts';
import {createElephantRig} from '../../../src/game/render3d/elephant/elephant-rig.ts';
import {ellipsoid as E,implicitSkin,appendEllipsoid as oval,appendTube as tube} from './geometry.mjs';
import {applyAnimalPose} from '../../../src/game/render3d/glb/articulation.ts';

export function contract(species,variant=0){const material=new MeshStandardMaterial();let rig,oldGeometry;
 if(species==='elephant')rig=createElephantRig(variant?'Nara':'Ayu',material);
 else{const asset=species==='zebra'?createZebraGeometry('zebra-zaki',true):species==='giraffe'?createGiraffeGeometry(true):createLionGeometry(variant===0);oldGeometry=asset.geometry;rig=species==='zebra'?createZebraRig(oldGeometry,material):species==='giraffe'?createGiraffeRig(oldGeometry,material):createLionRig(oldGeometry,material);}
 const joints=[...rig.bones].map(([name,b])=>({name,parent:b.parent?.isBone?b.parent.name:null,at:b.getWorldPosition(new Vector3()).toArray()}));
 const original=rig;return{rig:{...original,apply(p){applyAnimalPose(species,original.mesh,original.bones,p);}},joints,dispose(){original.dispose();oldGeometry?.dispose();material.dispose();}};
}

export const definitions={
 zebra:{variants:['zaki','zuri','mira','kira'],scientificName:'Equus quagga',bounds:[[-.38,-.12,-.82],[.38,1.93,1.01]],clips:['idle','walk','trot','graze','drink','rest','follow-herd','groom','enrich'],shapes:[
 E([0,1.005,-.09],[.242,.286,.423]),E([0,1.03,-.35],[.228,.27,.236]),E([0,1.065,.22],[.208,.297,.221]),E([0,1.255,.31],[.127,.309,.150],'neck',.32),E([0,1.40,.586],[.101,.224,.108],'head',-.70),E([0,1.268,.746],[.105,.073,.112],'head'),
 ],leg:{x:.16,z:[.24,-.34],hip:.87,knee:.45,foot:.045,upper:[.058,.235,.07],lower:[.032,.207,.040],hoof:[.050,.044,.067]}},
 giraffe:{variants:['dira','sora','lila'],scientificName:'Giraffa sp.',bounds:[[-.47,-.12,-.90],[.47,3.34,1.03]],clips:['idle','walk','browse','drink','rest','ruminate','social','enrich'],shapes:[
 E([0,1.365,-.04],[.23,.304,.438]),E([0,1.36,-.34],[.209,.265,.236]),E([0,1.48,.17],[.185,.27,.19]),E([0,1.88,.26],[.125,.48,.147],'neckLower'),E([0,2.43,.28],[.092,.49,.115],'neckUpper'),E([0,2.82,.35],[.113,.126,.210],'head',-.13),E([0,2.728,.543],[.096,.079,.106],'head')
 ],leg:{x:.18,z:[.30,-.34],hip:1.25,knee:.62,foot:.07,upper:[.056,.34,.070],lower:[.031,.285,.038],hoof:[.046,.067,.067]}},
 elephant:{variants:['ayu','nara'],scientificName:'Elephas maximus',bounds:[[-.88,-.14,-1.24],[.88,2.04,1.56]],clips:['idle','walk','eat','drink','bathe','spray','rest','enrich','trunk-touch'],shapes:[
 E([0,1.075,-.08],[.525,.53,.80]),E([0,1.08,-.53],[.47,.48,.43]),E([0,1.28,.43],[.34,.33,.35]),E([-.13,1.50,.68],[.256,.32,.316],'head'),E([.13,1.50,.68],[.256,.32,.316],'head'),E([0,1.30,.81],[.275,.244,.26],'head')
 ],leg:{x:.35,z:[.43,-.49],hip:.98,knee:.53,foot:.17,upper:[.165,.26,.178],lower:[.143,.20,.15],hoof:[.190,.116,.216]}},
 lion:{variants:['raka','sena','tala'],scientificName:'Panthera leo',bounds:[[-.43,-.08,-1.04],[.43,.99,.77]],clips:['idle','walk','eat','drink','rest','climb-ramp','lookout','roar','descend','sniff','scratch','nuzzle'],shapes:[
 E([0,.455,-.055],[.142,.148,.34]),E([0,.48,.19],[.15,.205,.15]),E([0,.43,-.30],[.142,.16,.19]),E([0,.58,.235],[.119,.14,.12],'head'),E([0,.615,.34],[.116,.115,.126],'head'),E([-.045,.533,.453],[.062,.055,.086],'head'),E([.045,.533,.453],[.062,.055,.086],'head')
 ],leg:{x:.13,z:[.19,-.21],hip:.38,knee:.20,foot:.055,upper:[.052,.114,.067],lower:[.033,.095,.039],hoof:[.063,.050,.079]}}
};

export function mammal(species,variant,low,joints){const def=definitions[species],shapes=[...def.shapes],leg=def.leg,names=['foreLeft','foreRight','hindLeft','hindRight'];
 for(let i=0;i<4;i++){
  const n=names[i],x=(i%2?-1:1)*leg.x*(species==='elephant'?-1:1),z=leg.z[i<2?0:1],footJoint=n+(species==='elephant'?'Foot':species==='lion'?'Paw':'Hoof');
  if(species==='elephant')shapes.push(E([x,.60,z],[.16,.50,.17],n));
  else if(species==='lion')shapes.push(E([x,i<2?.29:.32,z],i<2?[.042,.105,.048]:[.067,.14,.086],n),E([x,.20,z],[.033,.038,.036],n+'Knee'),E([x,.128,z+.01],[.027,.078,.033],n+'Knee'));
  else shapes.push(E([x,(leg.hip+leg.knee)/2,z],leg.upper,n),E([x,leg.knee,z],[leg.lower[0]*1.25,leg.lower[0]*1.5,leg.lower[2]*1.3],n+'Knee'),E([x,(leg.knee+leg.foot)/2,z+.007],leg.lower,n+'Knee'));
  shapes.push(E([x,species==='elephant'?.115:leg.foot,z+.025],species==='elephant'?[.190,.105,.216]:leg.hoof,footJoint));if(species==='giraffe'&&i<2)shapes.push(E([x*.9,1.26,z-.02],[.078,.18,.10],n));
 }
 const data=implicitSkin(shapes,def.bounds,joints,low),add=(p,r,j,c=null,a=0)=>oval(data,p,r,j,joints,c,low,a);
 if(species==='elephant')for(let v=0;v<data.bindings.length;v++){const p=data.vertices.slice(v*3,v*3+3);if(p[1]>.91)continue;let best=0,d=Infinity;for(let i=0;i<4;i++){const x=(i%2?1:-1)*leg.x,z=leg.z[i<2?0:1],next=(p[0]-x)**2+(p[2]-z)**2;if(next<d){d=next;best=i;}}if(d<.22**2){const t=Math.max(0,Math.min(1,(.65-p[1])/.23));data.bindings[v]={indices:[joints.findIndex(j=>j.name===names[best]),joints.findIndex(j=>j.name===names[best]+'Knee')],weights:[1-t,t]};}}
 // The entire sole belongs to its foot joint so IK cannot shear a planted hoof/paw.
 for(let v=0;v<data.bindings.length;v++){const p=data.vertices.slice(v*3,v*3+3);if(p[1]>leg.foot+.085)continue;let best=-1,distance=Infinity;for(let i=0;i<4;i++){const x=(i%2?-1:1)*leg.x*(species==='elephant'?-1:1),z=leg.z[i<2?0:1]+.025,d=(p[0]-x)**2+(p[2]-z)**2;if(d<distance){distance=d;best=i;}}if(distance<(leg.hoof[0]*1.5)**2){const suffix=species==='elephant'?'Foot':species==='lion'?'Paw':'Hoof';data.bindings[v]={indices:[joints.findIndex(j=>j.name===names[best]+suffix)],weights:[1]};}}
 if(species==='zebra'){
  for(const sign of [-1,1]){const ear=sign===1?'earLeft':'earRight';add([sign*.094,1.630,.408],[.046,.138,.032],ear);add([sign*.094,1.643,.438],[.026,.092,.008],ear,'#8a7f74');add([sign*.095,1.479,.504],[.018,.021,.020],'head','#514336');add([sign*.109,1.481,.511],[.010,.013,.013],'head','#121916');add([sign*.117,1.486,.517],[.0025,.0035,.004],'head','#eee4cb');add([sign*.071,1.289,.842],[.019,.014,.007],'head','#181d1c');}
  add([0,1.218,.738],[.087,.030,.112],'jaw','#5d584e');
  tube(data,[[0,1.11,.13],[0,1.25,.15],[0,1.43,.23],[0,1.54,.30]],[.020,.023,.021,.010],'neck',joints,'#30312b',low);
  tube(data,[[0,1.02,-.49],[0,.91,-.57],[0,.75,-.58],[0,.61,-.61]],[.021,.019,.016,.012],'tail',joints,'#d7d0ba',low);add([0,.59,-.61],[.036,.080,.031],'tail','#2b2b27');
 }else if(species==='giraffe'){
  for(const sign of [-1,1]){add([sign*.17,2.915,.267],[.122,.061,.047],'head',null,sign*.2);add([sign*.175,2.92,.306],[.083,.034,.010],'head','#c4a886');tube(data,[[sign*.064,2.90,.30],[sign*.068,3.03,.29],[sign*.067,3.09,.29]],[.029,.024,.030],'head',joints,'#a47d4e',low);add([sign*.067,3.10,.29],[.033,.040,.032],'head','#4c3c2b');add([sign*.103,2.846,.433],[.026,.032,.031],'head','#423123');add([sign*.12,2.85,.438],[.014,.021,.018],'head','#181b18');add([sign*.13,2.858,.446],[.003,.005,.005],'head','#e9ddc1');add([sign*.065,2.75,.632],[.020,.012,.009],'head','#564532');}
  add([0,2.687,.54],[.079,.029,.086],'jaw','#b69b72');add([0,2.699,.64],[.018,.012,.085],'tongue','#6b5763');tube(data,[[0,1.3,-.43],[0,1.04,-.58],[0,.76,-.62]],[.022,.017,.012],'tail',joints,'#b9a276',low);add([0,.7,-.63],[.042,.10,.037],'tail','#493d2c');
  const maneStart=data.bindings.length;tube(data,[[0,1.6,.095],[0,1.8,.11],[0,2.0,.13],[0,2.2,.15],[0,2.45,.16],[0,2.75,.16]],[.024,.023,.022,.020,.018,.007],'neckUpper',joints,'#6b4930',low);for(let i=maneStart;i<data.bindings.length;i++){const t=Math.max(0,Math.min(1,(data.vertices[i*3+1]-1.9)/.42));data.bindings[i]={indices:[joints.findIndex(j=>j.name==='neckLower'),joints.findIndex(j=>j.name==='neckUpper')],weights:[1-t,t]};}
 }else if(species==='elephant'){
  for(const sign of [-1,1]){const ear=sign<0?'earLeft':'earRight';add([sign*.486,1.42,.60],[.205,.282,.043],ear,null,-.1);add([sign*.297,1.49,.95],[.039,.031,.024],'head','#696964');add([sign*.31,1.49,.975],[.020,.018,.012],'head','#282d2b');add([sign*.319,1.499,.987],[.005,.005,.003],'head','#d7cfba');}
  const trunk=joints.filter(j=>j.name.startsWith('trunk')),points=[],radii=[];for(let r=0;r<=56;r++){const t=r/56*7,i=Math.min(6,Math.floor(t)),f=t-i;points.push(trunk[i].at.map((v,k)=>v+(trunk[i+1].at[k]-v)*f));radii.push(.119-r/56*.070);}const start=data.bindings.length;tube(data,points,radii,'trunk0',joints,null,low);for(let i=start;i<data.bindings.length;i++){const p=data.vertices.slice(i*3,i*3+3);let best=0,d=Infinity;for(let r=0;r<points.length;r++){const n=points[r].reduce((v,x,k)=>v+(x-p[k])**2,0);if(n<d){best=r;d=n;}}const t=best/56*7,a=Math.min(6,Math.floor(t));data.bindings[i]={indices:[joints.findIndex(j=>j.name==='trunk'+a),joints.findIndex(j=>j.name==='trunk'+(a+1))],weights:[1-(t-a),t-a]};}
  const tip=joints.find(j=>j.name==='trunk7').at;add(tip,[.052,.049,.059],'trunk7');add([tip[0],tip[1]+.018,tip[2]+.049],[.019,.025,.030],'trunk7','#8a8880');for(const s of [-1,1])add([s*.018,tip[1]-.015,tip[2]+.044],[.010,.009,.009],'trunk7','#414640');
  add([0,1.10,.969],[.125,.023,.035],'head','#575b55');
  for(let i=0;i<4;i++){const x=(i%2?1:-1)*leg.x,z=leg.z[i<2?0:1];for(let n=0;n<4;n++){const t=(n-1.5)*.37;add([x+Math.sin(t)*.155,.079,z+.038+Math.cos(t)*.198],[.035,.031,.023],names[i]+'Foot','#c3baaa');}}
  tube(data,[[0,.98,-.78],[0,.75,-.89],[0,.4,-1.0]],[.022,.019,.015],'tail',joints,'#85857f',low);add([0,.34,-1.015],[.04,.09,.035],'tailTip','#4c504b');
 }else{
  for(const sign of [-1,1]){add([sign*.110,.705,.287],[.052,.052,.025],'head','#af8c56');add([sign*.113,.707,.31],[.031,.031,.008],'head','#5c4938');add([sign*.09,.63,.42],[.017,.015,.012],'head','#423a2c');add([sign*.099,.631,.426],[.009,.009,.008],'head','#b49e52');add([sign*.105,.631,.432],[.003,.008,.003],'head','#202521');add([sign*.107,.635,.434],[.002,.002,.002],'head','#f4e2b7');add([sign*.041,.523,.510],[.048,.029,.023],'head','#dbcfb3');}
  add([0,.540,.537],[.034,.020,.015],'head','#564b42');add([0,.49,.454],[.076,.027,.073],'jaw','#c5ae86');
  for(const sign of [-1,1])for(let n=0;n<3;n++){tube(data,[[sign*.052,.532-n*.008,.477],[sign*.12,.532-n*.012,.48],[sign*.2,.537-n*.019,.46]],[.0012,.001,.0002],'head',joints,'#ded8c4',low);}
  if(variant===0){add([0,.586,.205],[.190,.220,.194],'head','#84613b');for(let r=0;r<(low?24:48);r++){const a=r*Math.PI*2/(low?24:48),u=Math.sin(a),v=Math.cos(a);tube(data,[[u*.17,.586+v*.19,.27],[u*.187,.586+v*.215,.19],[u*.184,.586+v*.211,.095]],[.010,.008,.0007],'head',joints,r%4?'#785736':'#937048',low);}}
  tube(data,[[0,.40,-.30],[0,.38,-.48],[.025,.31,-.67],[.04,.32,-.81]],[.019,.017,.013,.011],'tail',joints,'#ae8f5c',low);add([.04,.32,-.83],[.029,.032,.051],'tail','#4b4031');
  for(let i=0;i<4;i++){const x=(i%2?-1:1)*leg.x,z=leg.z[i<2?0:1];for(let n=0;n<3;n++)add([x+(n-1)*.027,.05,z+.088],[.018,.034,.018],names[i]+'Paw','#b59866');}
 }
 return{data,bounds:def.bounds};
}
