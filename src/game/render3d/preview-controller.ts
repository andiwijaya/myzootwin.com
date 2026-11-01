import type {GuideCommand} from '../missions/onboarding.ts';
import type {MissionQuote} from '../missions/engine.ts';
import type {RecoveryQuote} from '../economy/recovery.ts';
import type {PerchCommand} from '../animals/resting.ts';
import type {FoodCommand} from '../animals/feeding.ts';
import type {BirdCommand} from '../animals/autonomy.ts';
import type {StudioCommand} from './macaw/studio-contract.ts';
import type {EditTarget,RemovalQuote,EditView} from '../world/editing.ts';
import type { PlacementCommand } from '../world/placement-preview.ts';
import type { CameraCommand } from './camera-navigation.ts';
export type PreviewFailureKind = 'unsupported' | 'load' | 'init' | 'context-lost' | 'render';
export type PreviewState =
  | { status: 'closed' | 'loading' | 'ready' }
  | { status: 'unsupported' }
  | { status: 'error'; reason: Exclude<PreviewFailureKind, 'unsupported'> };

export class PreviewFailure extends Error {
  readonly kind: PreviewFailureKind;
  constructor(kind: PreviewFailureKind) { super(kind); this.name = 'PreviewFailure'; this.kind = kind; }
}

export interface PreviewSession {
  speed?(value:1|10):void;
  guide?(command:GuideCommand,revision?:number):void;
  claimMission?(quote:MissionQuote):void;
  recoveryQuote?():RecoveryQuote|undefined;
  recover?(quote:RecoveryQuote):void;
  dispose(): void;
  visitors?(command:'open'|'close'|'focus'|'follow'):void;
  birds?(command:BirdCommand):void;
  food?(command:FoodCommand,revision?:number):void;
  water?(command:FoodCommand,revision?:number):void;
  perch?(command:PerchCommand,revision?:number):void;
  studio?(command:StudioCommand,value?:string):void;
  camera?(command:CameraCommand):void;
  clearSelection?():void;
  quoteRemoval?(target:EditTarget):{ok:true;quote:RemovalQuote}|{ok:false;reason:NonNullable<EditView['reason']>};
  edit?(command:'remove'|'undo',quote?:RemovalQuote):void;
  placement?(command:PlacementCommand,revision?:number):void;
  setPaused?(paused: boolean): void;
  inspect?(): Record<string, number | boolean>;
}

export type PreviewFactory = (onFailure: (kind: PreviewFailureKind) => void) => PreviewSession;
export type PreviewLoader = () => Promise<PreviewFactory>;

/** Owns exactly one session, including cancellation of late lazy-load results. */
export function createPreviewController(load: PreviewLoader, onState: (state: PreviewState) => void) {
  let state: PreviewState = { status: 'closed' };
  let session: PreviewSession | undefined;
  let generation = 0;
  let disposed = false;
  let paused = false;

  function emit(next: PreviewState) { state = next; onState(next); }
  function release() { const old = session; session = undefined; old?.dispose(); }
  function fail(token: number, kind: PreviewFailureKind) {
    if (disposed || token !== generation) return;
    generation++;
    release();
    emit(kind === 'unsupported' ? { status: 'unsupported' } : { status: 'error', reason: kind });
  }

  function close() {
    generation++;
    release();
    emit({ status: 'closed' });
  }

  onState(state);
  return {
    async open() {
      if (disposed || state.status === 'loading' || state.status === 'ready') return;
      const token = ++generation;
      release();
      emit({ status: 'loading' });
      let factory: PreviewFactory;
      try { factory = await load(); }
      catch { fail(token, 'load'); return; }
      if (disposed || token !== generation) return;
      try {
        const created = factory((kind) => fail(token, kind));
        if (disposed || token !== generation) { created.dispose(); return; }
        session = created;
        session.setPaused?.(paused);
        emit({ status: 'ready' });
      } catch (error) {
        fail(token, error instanceof PreviewFailure ? error.kind : 'init');
      }
    },
    close,
    setPaused(value: boolean) { paused = value; session?.setPaused?.(value); },
    dispose() { if (disposed) return; close(); disposed = true; },
    getState: () => state,
    inspectSession: () => session?.inspect?.(),
    speed(value:number){if(!paused&&state.status==='ready'&&(value===1||value===10))session?.speed?.(value);},
    perch(command:PerchCommand,revision?:number){if(!paused&&state.status==='ready')session?.perch?.(command,revision);},
    water(command:FoodCommand,revision?:number){if(!paused&&state.status==='ready')session?.water?.(command,revision);},
    food(command:FoodCommand,revision?:number){if(!paused&&state.status==='ready')session?.food?.(command,revision);},
    birds(command:BirdCommand){if(!paused&&state.status==='ready')session?.birds?.(command);},
    studio(command:StudioCommand,value?:string){if(!paused&&state.status==='ready')session?.studio?.(command,value);},
    guide(command:GuideCommand,revision?:number){if(!paused&&state.status==='ready')session?.guide?.(command,revision);},
    claimMission(quote:MissionQuote){if(!paused&&state.status==='ready')session?.claimMission?.(quote);},
    recoveryQuote:()=>!paused&&state.status==='ready'?session?.recoveryQuote?.():undefined,
    recover(quote:RecoveryQuote){if(!paused&&state.status==='ready')session?.recover?.(quote);},
    visitors(command:'open'|'close'|'focus'|'follow'){if(!paused&&state.status==='ready')session?.visitors?.(command);},
    camera(command:CameraCommand) {if(!paused&&state.status==='ready')session?.camera?.(command);},
    clearSelection(){if(!paused&&state.status==='ready')session?.clearSelection?.();},
    quoteRemoval:(target:EditTarget)=>!paused&&state.status==='ready'?session?.quoteRemoval?.(target):undefined,
    edit(command:'remove'|'undo',quote?:RemovalQuote){if(!paused&&state.status==='ready')session?.edit?.(command,quote);},
    placement(command:PlacementCommand,revision?:number){if(!paused&&state.status==='ready')session?.placement?.(command,revision);},
  };
}
