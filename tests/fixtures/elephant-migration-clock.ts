import type {ZooSaveV1} from '../../src/game/core/state.ts';
import {createSimulation} from '../../src/game/core/simulation.ts';
import {migrateSaveV1,legacySimulationState,ZOO_CHECKPOINT_CODEC,serializeSaveV2} from '../../src/game/persistence/save-v2.ts';
import {coherentMoney,totals} from '../../src/game/economy/journal.ts';
import {validatePathPlacement} from '../../src/game/world/paths.ts';
import {validateSave} from '../../src/game/persistence/save-v1.ts';

const check=(value:unknown,message:string)=>{if(!value)throw Error(message);};
const same=(a:unknown,b:unknown)=>JSON.stringify(a)===JSON.stringify(b);
const projected=(value:ZooSaveV1)=>{const s=structuredClone(value);s.world.height=10;s.world.tiles=s.world.tiles.slice(0,120);return s;};
/** Regression baseline before EH2 commands: two real macaws, no elephant gameplay claim.
 * A reference test simulator is compared with a repeatedly migrated/reloaded simulator.
 * Production still owns one simulation; no test loop is imported into the product. */
export function runMigrationClockSoak(input:unknown,ticks=18000,reloadEvery=300){
  if(!Number.isSafeInteger(ticks)||ticks<1||ticks>36000||!Number.isSafeInteger(reloadEvery)||reloadEvery<1)throw Error('Bounded QA options required');
  const validated=validateSave(input);if(!validated.ok)throw Error('Invalid QA source');const source=validated.value;
  const first=migrateSaveV1(source);if(!first.ok)throw Error('Invalid QA source');
  const reference=createSimulation(source);let migrated=createSimulation(legacySimulationState(first.value));
  let reloads=0,edits=0,pauses=0,careCommands=0,maxPayload=0,maxJournal=0,disposedSubscribers=0;
  const initialCompactions=source.economy.checkpoint.compactions,initialCommand=source.economy.nextCommand;
  const world=reference.worldSnapshot(),cell=world.tiles.find(t=>validatePathPlacement(world,t.cell).reason==='ready'&&world.habitats.every(h=>h.cells.every(c=>Math.abs(c.x-t.cell.x)+Math.abs(c.z-t.cell.z)>1)))?.cell;
  try{
    for(let i=0;i<ticks;i++){
      const rate=i%600<300?1:10;reference.setSpeed(rate);migrated.setSpeed(rate);
      if(i%10===0)for(const kind of ['food','water'] as const){const a=reference[kind+'View' as 'foodView'|'waterView'](),b=migrated[kind+'View' as 'foodView'|'waterView']();check(same(a,b),'Care view diverged');if(a.exists&&a.stock<=2&&reference.inspect().currency>=(kind==='food'?8:4)){const x=reference[kind]('refill',a.revision,reference.commandRevision()),y=migrated[kind]('refill',b.revision,migrated.commandRevision());check(same(x,y),'Care command diverged');if(x.ok)careCommands++;}}
      if(cell&&i%30===0&&reference.inspect().currency>=15){const x=reference.buildPath(cell,reference.commandRevision()),y=migrated.buildPath(cell,migrated.commandRevision());check(x.ok&&y.ok&&!x.duplicate&&!y.duplicate,'QA edit setup failed');const a=reference.quoteRemoval({kind:'path',cell}),b=migrated.quoteRemoval({kind:'path',cell});check(a.ok&&b.ok,'QA edit quote failed');if(!a.ok||!b.ok)throw Error('Missing edit quote');const op=`edit-${(i+1).toString(16).padStart(32,'0')}`;check(reference.remove(a.quote,op).ok&&migrated.remove(b.quote,op).ok,'QA edit refund failed');edits+=2;}
      reference.advance(100/rate);for(const fraction of [.17,.23,.60])migrated.advance(100/rate*fraction);
      check(reference.inspect().tick===source.tick+i+1&&migrated.inspect().tick===source.tick+i+1,'Extra or missing fixed tick');
      maxJournal=Math.max(maxJournal,migrated.inspect().journalRetained);
      if((i+1)%reloadEvery===0||i===ticks-1){
        const expected=reference.snapshot(),snapshot=migrated.snapshot();check(same(projected(snapshot),expected),'Legacy state diverged before migration');
        migrated.setPaused(true);reference.setPaused(true);const before=JSON.stringify(migrated.snapshot());migrated.advance(86400000);migrated.frame(86400000+i);reference.advance(86400000);reference.frame(86400000+i);check(JSON.stringify(migrated.snapshot())===before,'Paused/offline advancement');pauses++;
        const full=migrateSaveV1(snapshot);if(!full.ok)throw Error(`Migration failed at ${full.path}`);const payload=serializeSaveV2(full.value);maxPayload=Math.max(maxPayload,payload.length);const loaded=ZOO_CHECKPOINT_CODEC.parse(payload);if(!loaded.ok)throw Error(`Reload failed at ${loaded.path}`);check(loaded.value.elephantGrove.grant===null&&loaded.value.animals.length===2,'Migration granted money/residents');check(coherentMoney(loaded.value),'Unbalanced migrated ledger');
        migrated.dispose();check(migrated.inspect().subscribers===0,'Disposed test subscriber leaked');disposedSubscribers+=migrated.inspect().subscribers;
        migrated=createSimulation(legacySimulationState(loaded.value));migrated.setPaused(true);const restored=JSON.stringify(migrated.snapshot());migrated.frame(999999999);migrated.advance(999999999);check(JSON.stringify(migrated.snapshot())===restored,'Cold Continue advanced offline');migrated.setPaused(false);migrated.frame(999999999);check(migrated.inspect().tick===snapshot.tick,'First resumed frame advanced');reference.setPaused(false);
        check(same(projected(migrated.snapshot()),expected),'Legacy state diverged after cold Continue');reloads++;
        if(edits>0){const prior=JSON.stringify(migrated.snapshot());check(!migrated.buildPath(cell!,initialCommand).ok,'Stale pre-checkpoint command replayed');check(JSON.stringify(migrated.snapshot())===prior,'Rejected stale command mutated state');}
      }
    }
    const final=migrateSaveV1(migrated.snapshot());if(!final.ok)throw Error('Final migration invalid');const finance=totals(final.value);check(final.value.currency===Object.values(finance.amounts).reduce((n,v)=>n+v,0),'Money conservation failed');
    return {save:final.value,summary:{scope:'Migrated legacy macaw clock/ledger regression; no elephant FSM or active wall-time soak',ticks,simulatedMinutes:ticks/600,reloads,pauses,editTransactions:edits,careCommands,newCompactions:final.value.economy.checkpoint.compactions-initialCompactions,maxJournal,maxPayload,currency:final.value.currency,ticketAdmissions:finance.counts.ticket,legacyClaims:final.value.missions.completedIds.length,grant:final.value.elephantGrove.grant,disposedSubscribers,referenceExact:true}};
  }finally{reference.dispose();migrated.dispose();}
}
