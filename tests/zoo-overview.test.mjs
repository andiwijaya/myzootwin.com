import test from 'node:test';
import assert from 'node:assert/strict';
import {createInitialState} from '../src/game/core/initial-state.ts';
import {zooOverview} from '../src/game/core/zoo-overview.ts';
import {careMetricValue} from '../src/game-entry/care-metrics.ts';
import {preparedZebraCare} from './helpers/zebra-care-play.mjs';

test('global animal total excludes reserve and unknown habitats without changing any save values',()=>{
  const initial=createInitialState(),before=structuredClone(initial);
  assert.deepEqual(zooOverview(initial),{animals:0,habitats:[]});assert.deepEqual(initial,before);
  const sim=preparedZebraCare();try{
    const state=sim.snapshot(),original=structuredClone(state),view=zooOverview(state);
    assert.equal(view.animals,14);assert.equal(view.habitats.length,5);
    assert.deepEqual(view.habitats.map(h=>h.animals),[2,2,3,3,4]);
    state.animals[0].habitatId=null;state.animals[1].habitatId='missing-habitat';
    assert.equal(zooOverview(state).animals,12);assert.deepEqual(sim.snapshot(),original);
  }finally{sim.dispose();}
});

test('care gauges preserve raw direction: hunger/thirst rise toward urgent, welfare/energy fall toward urgent',()=>{
  for(const kind of ['hunger','thirst']){
    assert.deepEqual(careMetricValue(kind,90),{value:90,lower:true,level:'urgent'});
    assert.equal(careMetricValue(kind,0).level,'good');
  }
  for(const kind of ['welfare','energy']){
    assert.deepEqual(careMetricValue(kind,10),{value:10,lower:false,level:'urgent'});
    assert.equal(careMetricValue(kind,100).level,'good');
  }
  assert.equal(careMetricValue('hunger',140).value,100);assert.equal(careMetricValue('energy',-20).value,0);
});
