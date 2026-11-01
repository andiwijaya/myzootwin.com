import type { createAutosave } from '../game/persistence/autosave.ts';
import type { RestartInspection } from '../game/persistence/durable-backend.ts';
type Locale = 'en' | 'id';
const copy = {
    en: { reset: 'Restart sanctuary', undo: 'Restore pre-restart game', resetTitle: 'Start a new sanctuary?', undoTitle: 'Restore your pre-restart sanctuary?', resetInfo: 'This replaces the current game with a fresh sanctuary and 1,500 Zoo Coins. Your language and other settings stay; speed starts at 1×.', undoInfo: 'This replaces the current game with the pre-restart checkpoint below. Progress is restored, never merged or rewarded again.', preserve: 'Your current valid game is kept in one pre-restart backup on this device. A later confirmed restart replaces that backup. No cloud copy is created.', undoPreserve: 'The pre-restart backup remains stored and is marked restored. The current checkpoint becomes previous-good. This restore can be confirmed only once.', confirm: 'Confirm restart', confirmUndo: 'Restore this game', cancel: 'Keep current game', summary: 'Checkpoint: {time}s played · {coins} ZC · {missions} missions · {birds} birds', failed: 'No restart completed. Your last valid game and backup are kept. Save current progress or reload if another tab changed it.', done: 'Restart saved. Continue opens the fresh sanctuary paused; your previous game can be restored here.', restored: 'Pre-restart game restored. Continue opens it paused; no offline progress was added.' },
    id: { reset: 'Mulai ulang suaka', undo: 'Pulihkan game sebelum mulai ulang', resetTitle: 'Mulai suaka baru?', undoTitle: 'Pulihkan suaka sebelum mulai ulang?', resetInfo: 'Game saat ini diganti dengan suaka baru dan 1.500 Zoo Coins. Bahasa dan pengaturan lain tetap; kecepatan dimulai pada 1×.', undoInfo: 'Game saat ini diganti dengan checkpoint sebelum mulai ulang di bawah. Progres dipulihkan, tidak digabung atau diberi hadiah lagi.', preserve: 'Game valid saat ini disimpan sebagai satu cadangan sebelum mulai ulang di perangkat ini. Mulai ulang berikut yang dikonfirmasi mengganti cadangan itu. Tidak ada salinan cloud.', undoPreserve: 'Cadangan sebelum mulai ulang tetap disimpan dan ditandai sudah dipulihkan. Checkpoint saat ini menjadi cadangan sebelumnya. Pemulihan ini hanya bisa dikonfirmasi sekali.', confirm: 'Konfirmasi mulai ulang', confirmUndo: 'Pulihkan game ini', cancel: 'Pertahankan game saat ini', summary: 'Checkpoint: {time}d dimainkan · {coins} ZC · {missions} misi · {birds} burung', failed: 'Mulai ulang belum selesai. Game valid terakhir dan cadangan tetap disimpan. Simpan progres atau muat ulang jika tab lain mengubahnya.', done: 'Mulai ulang tersimpan. Lanjutkan membuka suaka baru yang dijeda; game sebelumnya dapat dipulihkan di sini.', restored: 'Game sebelum mulai ulang dipulihkan. Lanjutkan membukanya dalam keadaan dijeda; tidak ada progres offline.' }
};
export function mountRestartPanel(root: HTMLElement, options: {
    save: ReturnType<typeof createAutosave>;
    locale: () => Locale;
    pause: () => void;
    closeGame: () => void;
    replaced: () => void;
}) {
    const reset = root.querySelector<HTMLButtonElement>('[data-reset-review]'), undo = root.querySelector<HTMLButtonElement>('[data-reset-undo]'), dialog = root.querySelector<HTMLDialogElement>('[data-reset-dialog]'), confirm = root.querySelector<HTMLButtonElement>('[data-reset-confirm]'), cancel = root.querySelector<HTMLButtonElement>('[data-reset-cancel]'), note = root.querySelector<HTMLElement>('[data-reset-note]');
    const events = new AbortController();
    let chosen: RestartInspection | null = null, busy = false, disposed = false, notice: 'failed' | 'done' | 'restored' | null = null;
    const text = (key: string, value: string) => root.querySelector(key)?.replaceChildren(value);
    function render() {
        if (disposed)
            return;
        const c = copy[options.locale()], v = options.save.view();
        if (reset) {
            reset.hidden = !v.hasSave;
            reset.disabled = busy || v.restartBusy || v.recoveryBusy || ['loading', 'unreadable', 'conflict', 'unavailable'].includes(v.phase);
            reset.textContent = c.reset;
        }
        if (undo) {
            undo.hidden = !v.restartAvailable;
            undo.disabled = busy || v.restartBusy || v.recoveryBusy || ['loading', 'unreadable', 'conflict', 'unavailable'].includes(v.phase);
            undo.textContent = c.undo;
        }
        if (note) {
            note.hidden = !notice;
            note.textContent = notice ? c[notice] : '';
        }
        const restoring = chosen?.kind === 'undo-reset', s = chosen?.source;
        text('[data-reset-title]', restoring ? c.undoTitle : c.resetTitle);
        text('[data-reset-info]', restoring ? c.undoInfo : c.resetInfo);
        text('[data-reset-preserve]', restoring ? c.undoPreserve : c.preserve);
        text('[data-reset-summary]', s ? c.summary.replace('{time}', String(s.tick / 10)).replace('{coins}', String(s.currency)).replace('{missions}', String(s.missions)).replace('{birds}', String(s.birds)) : '');
        if (confirm) {
            confirm.textContent = restoring ? c.confirmUndo : c.confirm;
            confirm.disabled = busy || !chosen?.quote;
        }
        if (cancel) {
            cancel.textContent = c.cancel;
            cancel.disabled = busy;
        }
    }
    async function review(kind: 'reset' | 'undo-reset') {
        if (busy || disposed)
            return;
        options.pause();
        busy = true;
        notice = null;
        render();
        chosen = await options.save.reviewRestart(kind);
        busy = false;
        if (disposed)
            return;
        if (chosen?.quote && dialog) {
            render();
            dialog.showModal();
            cancel?.focus();
        }
        else {
            notice = 'failed';
            render();
        }
    }
    reset?.addEventListener('click', () => void review('reset'), { signal: events.signal });
    undo?.addEventListener('click', () => void review('undo-reset'), { signal: events.signal });
    cancel?.addEventListener('click', () => {
        if (busy)
            return;
        chosen = null;
        dialog?.close();
        render();
    }, { signal: events.signal });
    dialog?.addEventListener('cancel', e => {
        if (busy)
            e.preventDefault();
        else
            chosen = null;
    }, { signal: events.signal });
    confirm?.addEventListener('click', async () => {
        if (busy || !chosen?.quote || disposed)
            return;
        const restoring = chosen.kind === 'undo-reset', quote = chosen.quote;
        busy = true;
        render();
        const pending = options.save.restart(quote);
        options.closeGame();
        const ok = await pending;
        busy = false;
        chosen = null;
        if (disposed)
            return;
        notice = ok ? (restoring ? 'restored' : 'done') : 'failed';
        dialog?.close();
        if (ok)
            options.replaced();
        render();
    }, { signal: events.signal });
    render();
    return { render, dispose() {
            disposed = true;
            events.abort();
            if (dialog?.open)
                dialog.close();
        } };
}
