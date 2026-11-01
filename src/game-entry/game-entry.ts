import { mountRecoveryPanel } from './recovery-panel.ts';
import { entryMessages, isEntryLocale, readEntryLocale, saveEntryLocale, type EntryLocale, type EntryMessage } from './locale';
import { mountPreviewPanel } from './preview-panel';
import { createAutosave } from '../game/persistence/autosave.ts';
import { createIndexedDbBackend, type DurableBackend } from '../game/persistence/durable-backend.ts';
function browserFactory() {
    try {
        return window.indexedDB;
    }
    catch {
        return undefined;
    }
}
const mounted = new WeakMap<HTMLElement, {
    dispose: () => void;
}>();
export function mountGameEntry(root: HTMLElement, options: {
    backend?: DurableBackend;
    broadcast?: boolean;
    allowRecoveryDownload?: boolean;
} = {}) {
    mounted.get(root)?.dispose();
    let disposed = false;
    root.dataset.enhanced = 'true';
    let storage: Storage | undefined;
    try {
        storage = window.localStorage;
    }
    catch { /* Storage may be blocked. */ }
    const initial = readEntryLocale(storage, navigator.language);
    let preferenceState: 'ready' | 'saved' | 'temporary' = !initial.storageAvailable ? 'temporary' : initial.source === 'saved' ? 'saved' : 'ready';
    const select = root.querySelector<HTMLSelectElement>('[data-entry-language]');
    const status = root.querySelector<HTMLElement>('[data-preference-status]');
    let preview: ReturnType<typeof mountPreviewPanel> | undefined;
    let locale: EntryLocale = initial.locale;
    let resumePending = false;
    let recoveryPanel: ReturnType<typeof mountRecoveryPanel> | undefined;
    const events = new AbortController();
    let channel: BroadcastChannel | undefined;
    const writer = crypto.randomUUID();
    const durable = createAutosave(options.backend ?? createIndexedDbBackend(browserFactory()), { writer, changed: () => {
            if (disposed)
                return;
            if (['conflict', 'unreadable'].includes(durable.view().phase))
                preview?.setPaused(true);
            render(locale);
        }, committed: (revision, generation) => channel?.postMessage({ writer, revision, generation }) });
    function render(language: EntryLocale) {
        if (disposed)
            return;
        locale = language;
        const copy = entryMessages[locale];
        root.lang = locale;
        document.documentElement.lang = locale;
        document.title = copy.pageTitle;
        for (const element of root.querySelectorAll('[data-entry-text]')) {
            const key = element.getAttribute('data-entry-text') as EntryMessage;
            if (key in copy)
                element.textContent = copy[key];
        }
        for (const selector of ['meta[name="description"]', 'meta[property="og:description"]', 'meta[name="twitter:description"]']) {
            document.querySelector<HTMLMetaElement>(selector)?.setAttribute('content', copy.description);
        }
        for (const selector of ['meta[property="og:title"]', 'meta[name="twitter:title"]']) {
            document.querySelector<HTMLMetaElement>(selector)?.setAttribute('content', copy.pageTitle);
        }
        if (select)
            select.value = locale;
        if (status)
            status.textContent = copy[preferenceState === 'saved' ? 'preferenceSaved' : preferenceState === 'temporary' ? 'preferenceTemporary' : 'preferenceReady'];
        preview?.setLocale(locale);
        preview?.refresh();
        renderSave();
        recoveryPanel?.render();
    }
    root.addEventListener('entry-locale-request', event => {
        const value = (event as CustomEvent<unknown>).detail;
        if (!isEntryLocale(value))
            return;
        preferenceState = saveEntryLocale(storage, value) ? 'saved' : 'temporary';
        render(value);
    }, { signal: events.signal });
    select?.addEventListener('change', () => {
        if (!isEntryLocale(select.value))
            return;
        preferenceState = saveEntryLocale(storage, select.value) ? 'saved' : 'temporary';
        render(select.value);
    }, { signal: events.signal });
    for (const button of root.querySelectorAll<HTMLButtonElement>('[data-open-dialog]')) {
        button.disabled = false;
        button.addEventListener('click', () => {
            const dialog = root.querySelector<HTMLDialogElement>(`#${button.dataset.openDialog}`);
            if (!dialog || dialog.open)
                return;
            if (typeof dialog.showModal === 'function')
                dialog.showModal();
            else
                dialog.setAttribute('open', '');
            preview?.setPaused(true);
            dialog.querySelector<HTMLElement>('[data-dialog-heading]')?.focus();
        }, { signal: events.signal });
    }
    for (const button of root.querySelectorAll<HTMLButtonElement>('[data-close-dialog]')) {
        button.addEventListener('click', () => {
            const dialog = button.closest('dialog');
            if (!dialog)
                return;
            if (typeof dialog.close === 'function')
                dialog.close();
            else {
                dialog.removeAttribute('open');
                preview?.setPaused(resumePending || ['conflict', 'unreadable'].includes(durable.view().phase));
            }
        }, { signal: events.signal });
    }
    for (const dialog of root.querySelectorAll<HTMLDialogElement>('dialog')) {
        dialog.addEventListener('close', () => preview?.setPaused(resumePending || ['conflict', 'unreadable'].includes(durable.view().phase)), { signal: events.signal });
    }
    const copySave = { en: { loading: 'Checking local progress...', empty: 'No saved sanctuary yet. Play to begin.', available: 'Saved sanctuary found on this device. Continue to open it.', dirty: 'Changes pending. Autosave will update shortly.', saving: 'Saving local progress...', saved: 'Progress saved on this device.', unavailable: 'Local storage is unavailable. Progress is temporary for this visit.', unreadable: 'Stored progress cannot be read. It has been kept unchanged; starting over is blocked to protect it.', error: 'Progress is not saved. The last good save is kept.', conflict: 'Another tab changed this sanctuary. This tab is paused; reload the saved progress before playing.', retry: 'Retry saving / storage', reload: 'Reload saved progress', resume: 'Resume zoo', resumeNote: 'Your saved world is loaded and paused. Nothing progressed while you were away.', detail: 'Last save: {time} · {coins} ZC · {missions} missions · {birds} birds. This device only; no cloud backup.' }, id: { loading: 'Memeriksa progres lokal...', empty: 'Belum ada suaka tersimpan. Main untuk memulai.', available: 'Suaka tersimpan ditemukan di perangkat ini. Lanjutkan untuk membukanya.', dirty: 'Ada perubahan. Autosave akan segera diperbarui.', saving: 'Menyimpan progres lokal...', saved: 'Progres tersimpan di perangkat ini.', unavailable: 'Penyimpanan lokal tidak tersedia. Progres hanya sementara selama kunjungan ini.', unreadable: 'Progres tersimpan tidak dapat dibaca. Data tetap utuh; mulai baru diblokir untuk melindunginya.', error: 'Progres belum tersimpan. Save terakhir yang valid tetap disimpan.', conflict: 'Tab lain mengubah suaka ini. Tab ini dijeda; muat ulang progres tersimpan sebelum bermain.', retry: 'Coba lagi simpan / akses', reload: 'Muat ulang progres tersimpan', resume: 'Lanjut bermain', resumeNote: 'Dunia tersimpan sudah dimuat dan dijeda. Tidak ada progres selama kamu pergi.', detail: 'Save terakhir: {time} · {coins} ZC · {missions} misi · {birds} burung. Hanya perangkat ini; tanpa cadangan cloud.' } };
    function renderSave() {
        const view = durable.view(), c = copySave[locale], panel = root.querySelector<HTMLElement>('[data-save-panel]');
        if (!panel)
            return;
        panel.dataset.savePhase = view.phase;
        panel.dataset.savedGeneration = view.generation;
        panel.dataset.savedTick = String(view.savedTick ?? -1);
        panel.dataset.savedRevision = String(view.revision);
        panel.dataset.savedCurrency = String(view.savedCurrency ?? -1);
        panel.dataset.savedMissions = String(view.savedMissions ?? -1);
        panel.dataset.savedBirds = String(view.savedBirds ?? -1);
        panel.dataset.saveActive = String(view.active);
        panel.dataset.hasSave = String(view.hasSave);
        panel.dataset.resumePending = String(resumePending);
        panel.setAttribute('aria-label', locale === 'id' ? 'Progres game lokal' : 'Local game progress');
        root.querySelector('[data-save-status]')?.replaceChildren(c[view.phase]);
        const detail = root.querySelector('[data-save-detail]');
        detail?.replaceChildren(view.savedAt === null ? '' : c.detail.replace('{time}', new Intl.DateTimeFormat(locale, { hour: '2-digit', minute: '2-digit', second: '2-digit' }).format(view.savedAt)).replace('{coins}', String(view.savedCurrency)).replace('{missions}', String(view.savedMissions)).replace('{birds}', String(view.savedBirds)));
        const bad = ['error', 'unreadable', 'conflict', 'unavailable'].includes(view.phase), error = root.querySelector<HTMLElement>('[data-save-error]');
        if (error) {
            error.hidden = !bad;
            const text = bad ? c[view.phase] : '';
            if (error.textContent !== text)
                error.textContent = text;
        }
        const retry = root.querySelector<HTMLButtonElement>('[data-save-retry]');
        if (retry) {
            retry.hidden = !bad || ['conflict', 'unreadable'].includes(view.phase);
            retry.textContent = c.retry;
        }
        const reload = root.querySelector<HTMLButtonElement>('[data-save-reload]');
        if (reload) {
            reload.hidden = view.phase !== 'conflict';
            reload.textContent = c.reload;
        }
        const continueButton = root.querySelector<HTMLButtonElement>('[data-continue]');
        if (continueButton)
            continueButton.disabled = resumePending || view.recoveryBusy || Boolean(view.recovery && view.recovery.kind !== 'none') || ['loading', 'unreadable', 'conflict'].includes(view.phase) || (!view.hasSave && !view.active);
        for (const selector of ['[data-onboarding-start]', '[data-preview-open]']) {
            const b = root.querySelector<HTMLButtonElement>(selector);
            if (b)
                b.disabled = resumePending || !durable.canOpen();
        }
        const gate = root.querySelector<HTMLElement>('[data-save-resume]');
        if (gate)
            gate.hidden = !resumePending;
        root.querySelector('[data-save-resume-note]')?.replaceChildren(c.resumeNote);
        root.querySelector('[data-save-resume-button]')?.replaceChildren(c.resume);
        for (const selector of ['[data-guide-layout]', '[data-speed-tools]', '[data-guide-toolbar]']) {
            const el = root.querySelector<HTMLElement>(selector);
            if (el)
                el.inert = resumePending || ['conflict', 'unreadable'].includes(view.phase);
        }
    }
    root.querySelector('[data-continue]')?.addEventListener('click', async () => {
        if (disposed || resumePending)
            return;
        if (!await durable.continueSaved())
            return;
        resumePending = true;
        renderSave();
        await preview?.openGame(true);
        if (disposed)
            return;
        render(locale);
        root.querySelector<HTMLElement>('[data-save-resume-button]')?.focus();
    }, { signal: events.signal });
    root.querySelector('[data-save-resume-button]')?.addEventListener('click', () => {
        if (!resumePending || ['conflict', 'unreadable'].includes(durable.view().phase))
            return;
        resumePending = false;
        preview?.setPaused(false);
        render(locale);
    }, { signal: events.signal });
    root.querySelector('[data-save-retry]')?.addEventListener('click', () => { void durable.retry(); }, { signal: events.signal });
    root.querySelector('[data-save-reload]')?.addEventListener('click', () => window.location.reload(), { signal: events.signal });
    document.addEventListener('visibilitychange', () => {
        if (document.hidden)
            void durable.flush();
    }, { signal: events.signal });
    window.addEventListener('pagehide', () => { void durable.flush(); }, { signal: events.signal });
    if (options.broadcast !== false && typeof BroadcastChannel !== 'undefined') {
        channel = new BroadcastChannel('myzootwin-progress-v1');
        channel.addEventListener('message', event => {
            const value = event.data;
            if (value?.writer !== writer && Number.isSafeInteger(value?.revision))
                durable.externalRevision(value.revision, typeof value.generation === 'string' ? value.generation : undefined);
        }, { signal: events.signal });
    }
    recoveryPanel = mountRecoveryPanel(root, { save: durable, allowDownload: options.allowRecoveryDownload !== false, locale: () => locale, pause: () => preview?.setPaused(true), closeGame: () => { resumePending = false; preview?.close(); }, restored: () => { locale = durable.savedLocale() ?? locale; render(locale); } });
    const ready = (async () => {
        await durable.load();
        if (disposed)
            return;
        locale = durable.savedLocale() ?? locale;
        preview = mountPreviewPanel(root, { stateStore: durable.session, canOpen: () => durable.canOpen(), beforeOpen: () => durable.view().active || durable.startNew(locale) });
        render(locale);
    })();
    const handle = { ready, dispose() {
            if (disposed)
                return;
            disposed = true;
            recoveryPanel?.dispose();
            preview?.dispose();
            durable.dispose();
            channel?.close();
            channel = undefined;
            events.abort();
            delete root.dataset.enhanced;
            mounted.delete(root);
        }, inspect: () => durable.inspect() };
    mounted.set(root, handle);
    return handle;
}
