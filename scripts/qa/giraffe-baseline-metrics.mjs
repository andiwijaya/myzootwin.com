import {readFileSync,writeFileSync} from 'node:fs';
import {performance} from 'node:perf_hooks';
import {createSimulation} from '../../src/game/core/simulation.ts';
import {serializeSaveV3} from '../../src/game/persistence/save-v3.ts';
import {createTropicalDiorama} from '../../src/game/render3d/tropical-diorama.ts';
const frozen=JSON.parse(readFileSync('tests/fixtures/giraffe-v3-golden.json')),sim=createSimulation(frozen.state),scene=createTropicalDiorama(frozen.state.world);
try {
 const catalog=[...scene.catalog.identities].map(([id,identity])=>{const b=scene.catalog.bounds.get(id);return {id,identity,bounds:b?{min:b.min.toArray(),max:b.max.toArray()}:null};});
 sim.setSpeed(1);const start=performance.now();for(let i=0;i<1000;i++)sim.advance(100);
 const report={at:new Date().toISOString(),scope:'Synthetic Node simulation CPU and original geometry catalog only; no browser/FPS claim',source:'7a945f80349f8aa4e94e348cdfaa37ef184d4bc4',ticks:1000,elapsedMs:performance.now()-start,saveChars:serializeSaveV3(sim.snapshot()).length,heap:process.memoryUsage(),catalog};
 writeFileSync('docs/qa/giraffe-baseline/scene-performance.json',JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify({...report,catalog:catalog.length}));
} finally {sim.dispose();for(const g of scene.geometries)g.dispose();for(const m of scene.materials)m.dispose();}
