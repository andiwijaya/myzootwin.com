export type PauseReason = 'continue' | 'manual' | 'background' | 'dialog' | 'storage' | 'restart';
/** Independent owners cannot resume another owner's hold. Background remains paused until explicit Resume. */
export function createPauseGate(changed: (paused: boolean) => void) {
    const reasons = new Set<PauseReason>();
    let last = false;
    function notify() {
        const next = reasons.size > 0;
        if (next !== last) {
            last = next;
            changed(next);
        }
    }
    return {
        update(values: Partial<Record<PauseReason, boolean>>) {
            for (const [reason, value] of Object.entries(values)) {
                if (value)
                    reasons.add(reason as PauseReason);
                else
                    reasons.delete(reason as PauseReason);
            }
            notify();
        },
        hold(reason: PauseReason, value: boolean) {
            if (value)
                reasons.add(reason);
            else
                reasons.delete(reason);
            notify();
        },
        resume() { reasons.delete('manual'); reasons.delete('background'); reasons.delete('continue'); notify(); },
        paused: () => reasons.size > 0,
        has: (reason: PauseReason) => reasons.has(reason),
        reasons: () => [...reasons],
    };
}
