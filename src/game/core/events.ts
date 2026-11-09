export type SimulationEvent =
  | {type:'zebra-mission-claimed';missionId:import('./zebra-state.ts').ZebraMissionId;amount:number;tick:number;gameTimeMs:number}
  | {type:'zebra-groomed';animalIds:[string,string];eventId:string;tick:number;gameTimeMs:number}
  | {type:'zebra-trotted';animalId:string;eventId:string;distance:number;tick:number;gameTimeMs:number}
  | {type:'zebra-grazed';animalId:string;resourceId:string;eventId:string;tick:number;gameTimeMs:number}
  | {type:'zebra-drank';animalId:string;resourceId:string;eventId:string;tick:number;gameTimeMs:number}
  | {type:'zebra-rested'|'zebra-enriched';animalId:string;resourceId:string;eventId:string;tick:number;gameTimeMs:number}
  | {type:'zebra-care-changed';resourceId:string;tick:number;gameTimeMs:number}
  | {type:'zebras-welcomed';tick:number;gameTimeMs:number}
  | {type:'giraffe-mission-claimed';missionId:import('./giraffe-state.ts').GiraffeMissionId;amount:number;tick:number;gameTimeMs:number}
  | {type:'giraffe-grant-claimed';amount:number;tick:number;gameTimeMs:number}
  | {type:'giraffes-welcomed';tick:number;gameTimeMs:number}
  | {type:'giraffe-care-changed';resourceId:string;tick:number;gameTimeMs:number}
  | {type:'giraffe-browsed'|'giraffe-enriched';animalId:string;resourceId:string;eventId:string;tick:number;gameTimeMs:number}
  | {type:'giraffe-socialized';animalId:string;companionId:string;eventId:string;tick:number;gameTimeMs:number}
  | {type:'lion-mission-claimed';missionId:import('./zoo-state.ts').LionMissionId;amount:number;tick:number;gameTimeMs:number}
  | {type:'lion-grant-claimed';amount:number;tick:number;gameTimeMs:number}
  | {type:'lions-welcomed';tick:number;gameTimeMs:number}
  | {type:'lion-care-changed';resourceId:string;tick:number;gameTimeMs:number}
  | {type:'lion-roared'|'lion-investigated-scent'|'lion-scratched';animalId:string;resourceId:string;eventId:string;tick:number;gameTimeMs:number}
  | {type:'lion-socialized';animalId:string;companionId:string;eventId:string;tick:number;gameTimeMs:number}
  | {type:'eh-mission-claimed';missionId:import('./zoo-state.ts').ElephantMissionId;amount:number;tick:number;gameTimeMs:number}
  | {type:'elephant-socialized';animalId:string;companionId:string;socialCount:number;eventId:string;tick:number;gameTimeMs:number}
  | {type:'elephant-bathed';animalId:string;resourceId:string;bathCount:number;eventId:string;tick:number;gameTimeMs:number}
  | {type:'elephant-enriched';animalId:string;resourceId:string;enrichedTicks:number;eventId:string;tick:number;gameTimeMs:number}
  | {type:'elephant-care-changed';resourceId:string;tick:number;gameTimeMs:number}
  | {type:'elephants-welcomed';tick:number;gameTimeMs:number}
  | {type:'conservation-grant-claimed';amount:number;tick:number;gameTimeMs:number}
  | {type:"preferences-changed";tick:number;gameTimeMs:number}
  | {type:"speed-changed";speed:import("./state.ts").SimulationSpeed;tick:number;gameTimeMs:number}
  | {type:"mission-claimed";missionId:import("./state.ts").MissionId;amount:number;tick:number;gameTimeMs:number}
  | {type:"recovery-changed";tick:number;gameTimeMs:number}
  | {readonly type:'economy-changed';readonly tick:number;readonly gameTimeMs:number}
  | {type:'visitor-admitted';visitorId:string;admissionId:string;amount:number;tick:number;gameTimeMs:number}
  | {type:'visitor-viewed';visitorId:string;habitatId:string;tick:number;gameTimeMs:number}
  | {type:'visitor-entrance-changed';tick:number;gameTimeMs:number}
  | {type:'perch-changed';tick:number;gameTimeMs:number}
  | {type:'water-changed';tick:number;gameTimeMs:number}
  | {type:'animal-drank';animalId:string;resourceId:string;tick:number;gameTimeMs:number}
  | {type:'food-changed';tick:number;gameTimeMs:number}
  | {type:'animal-fed';animalId:string;resourceId:string;tick:number;gameTimeMs:number}
  | {type:'birds-changed';tick:number;gameTimeMs:number}
  | {type:'world-edited';tick:number;gameTimeMs:number}
  | { type: 'tick'; tick: number; gameTimeMs: number; randomSample: number }
  | { type: 'path-built'; cell:{x:number;z:number}; tick:number; gameTimeMs:number }
  | { type: 'habitat-built'; habitatId:string; tick:number; gameTimeMs:number }
  | { type: 'reset'; tick: number; gameTimeMs: number };

/** A disposed bus cannot retain subscribers or accept new ones. */
export function createEventBus<T>() {
  const listeners = new Set<(event: T) => void>();
  let disposed = false;
  let listenerErrors = 0;
  return {
    subscribe(listener: (event: T) => void) {
      if (!disposed) listeners.add(listener);
      return () => { listeners.delete(listener); };
    },
    emit(event: T) {
      if (disposed) return;
      for (const listener of [...listeners]) {
        if (!listeners.has(listener)) continue;
        try { listener(event); } catch { listenerErrors++; }
      }
    },
    dispose() { disposed = true; listeners.clear(); },
    inspect: () => ({ subscribers: listeners.size, listenerErrors, disposed }),
  };
}
