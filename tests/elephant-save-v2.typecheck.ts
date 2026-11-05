import type {ZooSaveV1} from '../src/game/core/state.ts';
import type {ZooSaveV2} from '../src/game/core/zoo-state.ts';
import {ZOO_CHECKPOINT_CODEC} from '../src/game/persistence/save-v2.ts';
import {stateFromCheckpoint,type StoredCheckpoint} from '../src/game/persistence/checkpoint.ts';
import {createElephantIndexedDbBackend} from '../src/game/persistence/elephant-backend.ts';
import {createAutosave} from '../src/game/persistence/autosave.ts';
import type {DurableBackend} from '../src/game/persistence/durable-backend.ts';
export function persistedTypes(raw:StoredCheckpoint){
  const full:ZooSaveV2=stateFromCheckpoint(raw,ZOO_CHECKPOINT_CODEC);
  const backend=createElephantIndexedDbBackend(undefined),save=createAutosave(backend,{writer:'type-test'});
  const restored:ZooSaveV2|undefined=save.session.read();
  // @ts-expect-error Full V2 cannot enter a macaw-only renderer through an untyped backend.
  const legacyBackend:DurableBackend=backend;
  // @ts-expect-error Full V2 must never be silently projected to the frozen V1 contract.
  const legacy:ZooSaveV1=full;
  void restored;void legacyBackend;void legacy;
}
