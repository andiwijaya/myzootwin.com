import type { createAutosave } from '../game/persistence/autosave.ts';
import type { RecoveryInspection } from '../game/persistence/durable-backend.ts';
type Locale = 'id' | 'en';
const messages = { en: { review: 'Check save / recovery options', download: 'Download preserved recovery copy', titleMigrate: 'Update the saved format', titleRestore: 'Restore a previous checkpoint', migrate: 'This is an older storage format from this game. Your coins, missions, animals and settings stay unchanged.', restore: 'The current save is damaged. Restore the validated previous checkpoint shown below. Progress after that checkpoint will not be added.', preserve: 'The current save and its previous checkpoint are kept as one recovery copy. This replaces an earlier recovery copy, if present; download that earlier copy first if you want to keep it.', confirmMigrate: 'Update saved format', confirmRestore: 'Restore this checkpoint', cancel: 'Keep everything unchanged', summary: 'Checkpoint: {time}s played · {coins} ZC · {missions} missions · {birds} birds', legacy: 'An older saved format needs updating before Continue.', future: 'This save uses an unsupported version. Keep it and open it with a compatible game version; automatic replacement is blocked.', none: 'No safe automatic recovery is available. Your stored data is kept unchanged.', unavailable: 'Recovery could not access storage. Nothing has been replaced; try again.', failed: 'Recovery did not complete. The stored original and previous checkpoint are unchanged. Check storage or reload if another tab changed it.', done: 'Saved format is ready. Continue opens the checkpoint paused.', prepared: 'Recovery copy is prepared. Complete or cancel the save in your browser.' }, id: { review: 'Periksa save / opsi pemulihan', download: 'Unduh salinan pemulihan yang disimpan', titleMigrate: 'Perbarui format save', titleRestore: 'Pulihkan checkpoint sebelumnya', migrate: 'Ini format penyimpanan lama dari game ini. Progres, koin, misi, satwa dan pengaturan tetap sama.', restore: 'Save saat ini rusak. Pulihkan checkpoint valid sebelumnya yang ditampilkan di bawah. Progres setelah checkpoint itu tidak ditambahkan.', preserve: 'Save saat ini beserta checkpoint sebelumnya disimpan sebagai satu salinan pemulihan. Salinan pemulihan yang lebih lama, jika ada, diganti; unduh salinan lama itu dahulu jika ingin menyimpannya.', confirmMigrate: 'Perbarui format save', confirmRestore: 'Pulihkan checkpoint ini', cancel: 'Biarkan semuanya tetap', summary: 'Checkpoint: {time}d dimainkan · {coins} ZC · {missions} misi · {birds} burung', legacy: 'Format save lama perlu diperbarui sebelum Lanjutkan.', future: 'Versi save belum didukung. Data tetap disimpan; buka dengan versi game yang sesuai. Penggantian otomatis diblokir.', none: 'Tidak ada pemulihan otomatis yang aman. Data tersimpan tetap utuh.', unavailable: 'Pemulihan belum bisa mengakses penyimpanan. Tidak ada data diganti; coba lagi.', failed: 'Pemulihan belum selesai. Data asal dan checkpoint sebelumnya tetap utuh. Periksa penyimpanan atau muat ulang jika tab lain mengubahnya.', done: 'Format save siap. Lanjutkan membuka checkpoint dalam keadaan dijeda.', prepared: 'Salinan pemulihan disiapkan. Selesaikan atau batalkan penyimpanan melalui browser.' } };
export function mountRecoveryPanel(root: HTMLElement, options: {
    save: ReturnType<typeof createAutosave>;
    locale: () => Locale;
    pause: () => void;
    closeGame: () => void;
    restored: () => void;
    allowDownload?: boolean;
}) {
    const review = root.querySelector<HTMLButtonElement>('[data-save-recovery-review]'), download = root.querySelector<HTMLButtonElement>('[data-save-recovery-download]'), dialog = root.querySelector<HTMLDialogElement>('[data-save-recovery-dialog]'), confirm = root.querySelector<HTMLButtonElement>('[data-save-recovery-confirm]'), cancel = root.querySelector<HTMLButtonElement>('[data-save-recovery-cancel]'), note = root.querySelector<HTMLElement>('[data-save-recovery-note]');
    const events = new AbortController();
    let chosen: RecoveryInspection | null = null, busy = false, notice: 'unavailable' | 'failed' | 'done' | 'prepared' | null = null, objectUrl: string | undefined, releaseTimer: ReturnType<typeof setTimeout> | undefined, disposed = false;
    const text = (selector: string, value: string) => root.querySelector(selector)?.replaceChildren(value);
    function render() {
        if (disposed)
            return;
        const v = options.save.view(), c = messages[options.locale()], r = v.recovery;
        if (review) {
            review.textContent = c.review;
            review.hidden = !(v.phase === 'unreadable' || r?.kind === 'migrate' || r?.kind === 'restore');
            review.disabled = busy || v.recoveryBusy;
        }
        if (download) {
            download.textContent = c.download;
            download.hidden = options.allowDownload === false || !r?.hasPreserved;
            download.disabled = busy;
        }
        if (note) {
            note.textContent = notice ? c[notice] : r?.kind === 'migrate' ? c.legacy : r?.kind === 'blocked' ? (r.problem === 'unsupported-format' || r.problem === 'unsupported-schema' ? c.future : c.none) : '';
            note.hidden = !note.textContent;
        }
        if (!dialog)
            return;
        const migrate = chosen?.kind === 'migrate';
        text('[data-save-recovery-title]', c[migrate ? 'titleMigrate' : 'titleRestore']);
        text('[data-save-recovery-explanation]', c[migrate ? 'migrate' : 'restore']);
        text('[data-save-recovery-preserve]', c.preserve);
        const s = chosen?.source;
        text('[data-save-recovery-summary]', s ? c.summary.replace('{time}', String(s.tick / 10)).replace('{coins}', String(s.currency)).replace('{missions}', String(s.missions)).replace('{birds}', String(s.birds)) : '');
        if (confirm) {
            confirm.textContent = c[migrate ? 'confirmMigrate' : 'confirmRestore'];
            confirm.disabled = busy || !chosen?.quote;
        }
        if (cancel) {
            cancel.textContent = c.cancel;
            cancel.disabled = busy;
        }
    }
    review?.addEventListener('click', async () => {
        if (busy || disposed)
            return;
        busy = true;
        notice = null;
        render();
        chosen = await options.save.reviewRecovery();
        busy = false;
        if (disposed)
            return;
        if (chosen?.quote && dialog) {
            options.pause();
            dialog.showModal();
            render();
            root.querySelector<HTMLElement>('[data-save-recovery-title]')?.focus();
        }
        else {
            notice = chosen?.kind === 'blocked' ? null : chosen ? 'failed' : 'unavailable';
            render();
        }
    }, { signal: events.signal });
    confirm?.addEventListener('click', async () => {
        if (busy || !chosen?.quote || disposed)
            return;
        busy = true;
        render();
        options.closeGame();
        const ok = await options.save.recover(chosen.quote);
        busy = false;
        chosen = null;
        if (disposed)
            return;
        notice = ok ? 'done' : 'failed';
        dialog?.close();
        if (ok)
            options.restored();
        render();
    }, { signal: events.signal });
    cancel?.addEventListener('click', () => {
        if (busy)
            return;
        chosen = null;
        notice = null;
        dialog?.close();
        render();
    }, { signal: events.signal });
    dialog?.addEventListener('cancel', e => {
        if (busy)
            e.preventDefault();
        else {
            chosen = null;
            notice = null;
        }
    }, { signal: events.signal });
    const release = () => {
        if (objectUrl)
            URL.revokeObjectURL(objectUrl);
        objectUrl = undefined;
        if (releaseTimer)
            clearTimeout(releaseTimer);
        releaseTimer = undefined;
    };
    download?.addEventListener('click', async () => {
        if (options.allowDownload === false || busy || disposed)
            return;
        busy = true;
        render();
        try {
            const value = await options.save.exportRecoveryCopy();
            if (disposed)
                return;
            release();
            objectUrl = URL.createObjectURL(new Blob([value], { type: 'application/json' }));
            const a = document.createElement('a');
            a.href = objectUrl;
            a.download = 'myzootwin-recovery-copy.json';
            a.click();
            releaseTimer = setTimeout(release, 1000);
            notice = 'prepared';
        }
        catch {
            notice = 'unavailable';
        }
        finally {
            busy = false;
            render();
        }
    }, { signal: events.signal });
    return { render, dispose() {
            disposed = true;
            events.abort();
            release();
            if (dialog?.open)
                dialog.close();
        } };
}
