import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {Box3,Vector3,OrthographicCamera} from 'three';
import {elephantOnboardingView} from '../src/game/missions/elephant-onboarding.ts';
import {presentElephantOnboarding} from '../src/game-entry/elephant-onboarding-panel.ts';
import {createSimulation} from '../src/game/core/simulation.ts';
import {migrateSaveV1,serializeSaveV2,parseSaveV2} from '../src/game/persistence/save-v2.ts';
import {prepareConservationGrant} from '../src/game/economy/conservation-grant.ts';
import {prepareElephantConstruction} from '../src/game/economy/elephant-construction.ts';
import {elephantHome} from './fixtures/elephant-home.mjs';
import {twoHabitatSimulation} from './fixtures/elephant-two-habitats.mjs';
import {runMixedLegacyTrace} from './fixtures/elephant-legacy-regression.ts';
import {createCameraNavigation} from '../src/game/render3d/camera-navigation.ts';
import {mountCameraControls} from '../src/game/render3d/camera-controls.ts';
import {sceneOrigin} from '../src/game/world/scene-coordinates.ts';
const frozen=JSON.parse(readFileSync(new URL('./fixtures/elephant-legacy-v1.json',import.meta.url),'utf8'));
const tick=(s,n)=>{for(let i=0;i<n;i++)s.advance(100);};
test('old new/partial/Q04ready saves keep the original first-run guide; only an actually claimed Q04opens the four optional Grove hints',()=>{
 for(const id of ['new','midQ02','midVisitor','q04Ready']){const state=migrateSaveV1(frozen.entries[id].state).value,before=serializeSaveV2(state),v=elephantOnboardingView(state);assert.equal(v.active,false,id);assert.equal(v.focus.grove,null);assert.equal(serializeSaveV2(state),before);}
 let s=migrateSaveV1(frozen.entries.q04Claimed.state).value;assert.equal(elephantOnboardingView(s).stage,'home');assert.deepEqual(elephantOnboardingView(s).focus.grove,{x:3,z:11,width:6,depth:6});assert.ok(elephantOnboardingView(s).focus.aviary);s=prepareConservationGrant(s,{command:s.economy.nextCommand}).state;assert.equal(elephantOnboardingView(s).stage,'home');s=prepareElephantConstruction(s,{x:3,z:11},'habitat-guide-test',s.economy.nextCommand).state;const v=elephantOnboardingView(s);assert.equal(v.stage,'care');assert.equal(v.welcomed,false);assert.equal(v.steps.length,4);assert.equal(v.steps[0].done,true);assert.match(presentElephantOnboarding(v,'en').hint,/free welcome/);
});
test('placing and filling supplies never completes the care hint; actual consumption moves to real route then guest guidance',()=>{
 const sim=createSimulation(elephantHome());assert.equal(sim.elephantOnboardingView().stage,'care');tick(sim,1200);const v=sim.elephantOnboardingView();assert.equal(v.stage,'path');assert.ok(sim.elephantSnapshot().animals.every(a=>a.foodEaten>0&&a.waterDrunk>0));sim.dispose();const connected=twoHabitatSimulation();tick(connected,1200);assert.equal(connected.elephantOnboardingView().stage,'visitors');assert.equal(connected.elephantOnboardingView().open,false);assert.equal(connected.elephantOnboardingView().viewed,false);connected.dispose();
});
test('returning completed mixed saves derive completed hints after cold without replay or hidden advancement; a genuinely broken path becomes contextual help again',()=>{
 const r=runMixedLegacyTrace(frozen.entries.q04Claimed.state,1800),sim=createSimulation(r.mixed),view=sim.elephantOnboardingView();assert.equal(view.stage,'done');assert.ok(view.steps.every(s=>s.done));const before=serializeSaveV2(sim.snapshot());for(let i=0;i<100;i++)for(const l of ['id','en'])presentElephantOnboarding(sim.elephantOnboardingView(),l);assert.equal(serializeSaveV2(sim.snapshot()),before);const cold=createSimulation(parseSaveV2(before).value);assert.deepEqual(cold.elephantOnboardingView(),view);cold.setPaused(true);cold.advance(86400000);assert.equal(serializeSaveV2(cold.snapshot()),before);const broken=sim.snapshot();for(const t of broken.world.tiles)if(t.cell.z===10)t.path=false;assert.equal(elephantOnboardingView(broken).stage,'path');sim.dispose();cold.dispose();
});
test('all guide stages have complete honest paired IDEN hints/action labels without raw IDs, forced articles or a fabricated refund/grant',()=>{
 const sim=createSimulation(elephantHome()),v=sim.elephantOnboardingView();for(const stage of ['home','care','path','visitors','done'])for(const locale of ['id','en']){const input={...v,stage},before=JSON.stringify(input),p=presentElephantOnboarding(input,locale);assert.ok(p.title&&p.intro&&p.hint&&p.action&&p.grove&&p.aviary);assert.equal(p.rows.length,4);assert.ok(p.rows.every(r=>r.text));assert.doesNotMatch(Object.values(p).filter(x=>typeof x==='string').join(' '),/undefined|\{|https?:|elephant-ayu/);assert.equal(JSON.stringify(input),before);}sim.dispose();
});
class Element extends EventTarget{style={};dataset={};captured=new Set();getBoundingClientRect(){return{left:0,top:0,width:500,height:350};}focus(){}setPointerCapture(id){this.captured.add(id);}hasPointerCapture(id){return this.captured.has(id);}releasePointerCapture(id){this.captured.delete(id);}}
test('whole-habitat camera focus fits actual Grove/aviary ground and actor height at all eight rotations and phone/desktop aspects, without changing the world',()=>{
 const old=globalThis.window;globalThis.window=new EventTarget();const state=elephantHome(),before=serializeSaveV2(state),origin=sceneOrigin(state.world),bounds=new Box3(new Vector3(-6,-.4,-5),new Vector3(6,3.8,13));try{for(const [width,height]of [[900,600],[360,490],[580,240]]){const host=new Element(),canvas=new Element(),camera=new OrthographicCamera(),c=mountCameraControls(host,canvas,camera,bounds,state.world);c.resize(width,height);for(let angle=0;angle<8;angle++){for(const a of Object.values(elephantOnboardingView(state).focus)){const area={...a,x:a.x-origin.x,z:a.z-origin.z};c.focusArea(area);const v=c.inspect();assert.ok(v.cameraZoom>=1&&v.cameraZoom<=3);for(const x of [area.x,area.x+area.width])for(const z of [area.z,area.z+area.depth])for(const y of [0,2.8]){const p=new Vector3(x,y,z).project(camera);assert.ok(Math.abs(p.x)<=1.001&&Math.abs(p.y)<=1.001,JSON.stringify({width,height,angle,area,p,v}));}}c.command('rotate-right');}const stable=c.inspect();c.setEnabled(false);c.focusArea({x:0,z:0,width:6,depth:6});assert.equal(c.inspect().cameraZoom,stable.cameraZoom);c.dispose();}assert.equal(serializeSaveV2(state),before);}finally{globalThis.window=old;}
});
test('new area focus rejects nonfinite or negative dimensions and preserves existing close-up focus and reset semantics',()=>{
 const n=createCameraNavigation();n.configure({width:500,height:350,halfWidth:10,halfHeight:7,rightX:.75,rightZ:-.66,upX:-.35,upZ:-.4,originX:-1,originZ:-1.2,mapWidth:12,mapHeight:18,mapCenterX:0,mapCenterZ:4});n.focus({x:0,z:1});assert.equal(n.inspect().zoom,2.5);const before=n.inspect();for(const a of [{x:NaN,z:0,width:6,depth:6},{x:0,z:0,width:0,depth:6},{x:0,z:0,width:6,depth:-1}]){n.focusArea(a);assert.deepEqual(n.inspect(),before);}n.focusArea({x:-3,z:6,width:6,depth:6});n.command('reset');assert.equal(n.inspect().zoom,1);assert.equal(n.inspect().x,0);assert.equal(n.inspect().z,0);
});
