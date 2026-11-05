import test from 'node:test';
import assert from 'node:assert/strict';
import {createInitialState} from '../src/game/core/initial-state.ts';
import {habitatBlockerKeys} from '../src/game/world/build-habitat.ts';
import {visitorRoute,visitTarget} from '../src/game/visitors/graph.ts';
import {PRICES} from '../src/game/economy/prices.ts';
import {grovePlan,connector,plannedWorld,plannedCells,plannedScene} from './fixtures/elephant-layout-plan.mjs';

test('south extension design appends 96 cells without moving any of the original 120 tiles or gate',()=>{
  const before=createInitialState().world,next=plannedWorld();
  assert.equal(next.tiles.length,216);assert.deepEqual(next.tiles.slice(0,120),before.tiles);assert.deepEqual(next.gate,before.gate);
  assert.equal(new Set(next.tiles.map(t=>`${t.cell.x},${t.cell.z}`)).size,216);
  for(const t of before.tiles)assert.deepEqual(plannedScene(t.cell),{x:t.cell.x+.5-before.width/2,z:t.cell.z+.5-before.height/2});
});

test('chosen 6×6 footprint has no creek/scenery/gate/connector collision and an outside viewing cell',()=>{
  const world=plannedWorld(),cells=plannedCells(),blockers=habitatBlockerKeys();
  assert.equal(cells.length,36);
  for(const c of cells){assert.ok(c.x>=0&&c.x<world.width&&c.z>=0&&c.z<world.height);assert.equal(blockers.has(`${c.x},${c.z}`),false);const t=world.tiles.find(t=>t.cell.x===c.x&&t.cell.z===c.z);assert.equal(t.terrain,'land');assert.equal(t.path,false);assert.equal(t.occupantId,null);assert.equal(connector.some(p=>p.x===c.x&&p.z===c.z),false);}
  assert.equal(cells.some(c=>c.x===grovePlan.view.x&&c.z===grovePlan.view.z),false);
  assert.ok(cells.some(c=>Math.abs(c.x-grovePlan.view.x)+Math.abs(c.z-grovePlan.view.z)===1));
  assert.ok(plannedCells({x:7,z:13}).some(c=>c.x>=world.width||c.z>=world.height));
});

test('real current four-neighbor visitor graph reaches the planned viewing cell and cannot teleport across a gap',()=>{
  const world=plannedWorld(),cells=plannedCells();
  world.habitats.push({id:'habitat-elephant-plan',cells,viewingCell:null});
  for(const t of world.tiles){if(cells.some(c=>c.x===t.cell.x&&c.z===t.cell.z))t.occupantId='habitat-elephant-plan';if(connector.some(c=>c.x===t.cell.x&&c.z===t.cell.z))t.path=true;}
  const route=visitorRoute(world,world.gate,grovePlan.view);assert.equal(route.length,connector.length+1);
  for(let i=1;i<route.length;i++)assert.equal(Math.abs(route[i].x-route[i-1].x)+Math.abs(route[i].z-route[i-1].z),1);
  assert.equal(visitTarget(world).habitatId,'habitat-elephant-plan');
  world.tiles.find(t=>t.cell.x===1&&t.cell.z===10).path=false;
  assert.deepEqual(visitorRoute(world,world.gate,grovePlan.view),[]);assert.equal(visitTarget(world),null);
});

test('design budget funds this actual connector, essential facilities, first care service and upkeep from zero cash',()=>{
  const facilities=650+2*80+90+170+80+60,path=connector.length*PRICES.path;
  const firstCare=2*8+4+12,firstUpkeep=2*PRICES.maintenance;
  assert.equal(facilities,1210);assert.equal(path,90);
  assert.ok(grovePlan.grant-facilities-path-firstCare-firstUpkeep>0);
});
