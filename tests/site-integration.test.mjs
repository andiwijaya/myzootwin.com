import test from 'node:test';import assert from 'node:assert/strict';
import {siteNavigation} from '../src/site-events.ts';
test('local navigation telemetry accepts only fixed destinations and sources without URLs, identifiers or arbitrary payload',()=>{
 for(const source of ['home','learn','game-guide','nav'])for(const [path,destination]of[['/play/','play'],['/learn/','learn']]){
  const result=siteNavigation(path,source);assert.deepEqual(result,{destination,source});assert.ok(Object.isFrozen(result));assert.deepEqual(Object.keys(result),['destination','source']);
 }
 for(const path of [null,'https://myzootwin.com/play/','/play/?save=private','javascript:alert(1)','//example.invalid/','/animals/'])assert.equal(siteNavigation(path,'home'),null);
 for(const source of [null,'private-player-name','home<script>','__proto__'])assert.equal(siteNavigation('/play/',source),null);
});
