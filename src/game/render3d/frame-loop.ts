export interface FrameDriver {
  request(callback: (time: number) => void): number;
  cancel(id: number): void;
}

/** One visual RAF chain. No simulation time or gameplay rules live here. */
export function createFrameLoop(driver: FrameDriver, render: (time: number) => void, onError: () => void) {
  let running = false;
  let disposed = false;
  let pending: number | undefined;
  let generation = 0;

  function stop() {
    generation++;
    running = false;
    if (pending !== undefined) driver.cancel(pending);
    pending = undefined;
  }

  function schedule(token: number) {
    if (!running || disposed || token !== generation) return;
    try {
      pending = driver.request((time) => {
        if (!running || disposed || token !== generation) return;
        pending = undefined;
        try { render(time); }
        catch {
          stop();
          disposed = true;
          onError();
          return;
        }
        if (token === generation) schedule(token);
      });
    } catch {
      stop();
      disposed = true;
      onError();
    }
  }

  return {
    start() {
      if (running || disposed) return;
      running = true;
      schedule(++generation);
    },
    stop,
    dispose() { stop(); disposed = true; },
    inspect: () => ({ running, disposed, pendingFrames: pending === undefined ? 0 : 1 }),
  };
}
