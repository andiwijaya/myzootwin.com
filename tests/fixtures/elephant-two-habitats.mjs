import assert from 'node:assert/strict';
import {elephantHome} from './elephant-home.mjs';
import {createSimulation} from '../../src/game/core/simulation.ts';
export const ELEPHANT_CONNECTOR=[{x:1,z:9},{x:1,z:10},{x:2,z:10},{x:2,z:11},{x:2,z:12},{x:2,z:13}];
/** Actual shared player commands and original sanitized save, no generated owner-data clone or fabricated ticket. */
export function twoHabitatSimulation({connect=true,...options}={}){const sim=createSimulation(elephantHome(options));sim.visitors(false);if(connect)for(const cell of ELEPHANT_CONNECTOR)assert.ok(sim.buildPath(cell,sim.commandRevision()).ok);for(let i=0;i<2500&&sim.visitorView().active;i++)sim.advance(100);assert.equal(sim.visitorView().active,0);return sim;}
