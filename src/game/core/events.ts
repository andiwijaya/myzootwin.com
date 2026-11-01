export type SimulationEvent =
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
