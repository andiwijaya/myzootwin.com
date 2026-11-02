import {readVisualSettings,type VisualSettings} from '../game/core/visual-settings.ts';
import {mountVisualSettings} from './visual-settings-panel.ts';
import {chooseGameLocale} from './i18n-format.ts';
import {formatNumber} from './i18n-format.ts';
import { mountHudLayout } from './hud-layout.ts';
import { createPauseGate } from './pause-gate.ts';
import { mountRestartPanel } from './restart-panel.ts';
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
    preferenceStorage?: Pick<Storage, 'getItem' | 'setItem'> | null;
    browserLanguage?: string;
} = {}) {
    mounted.get(root)?.dispose();
    let disposed = false;
    root.dataset.enhanced = 'true';
    let storage: Pick<Storage, 'getItem' | 'setItem'> | undefined;
    try {
        storage = 'preferenceStorage' in options ? options.preferenceStorage ?? undefined : window.localStorage;
    }
    catch { /* Storage may be blocked. */ }
    const initial = readEntryLocale(storage, options.browserLanguage ?? navigator.language);
    let preferenceState: 'ready' | 'saved' | 'temporary' = !initial.storageAvailable ? 'temporary' : initial.source === 'saved' ? 'saved' : 'ready';
    const select = root.querySelector<HTMLSelectElement>('[data-entry-language]');
    const status = root.querySelector<HTMLElement>('[data-preference-status]');
    let preview: ReturnType<typeof mountPreviewPanel> | undefined;
    let locale: EntryLocale = initial.locale;
    let manualLocale = initial.source === 'saved';
    let visualChoice:VisualSettings|null=readVisualSettings(storage);
    let visualPanel:ReturnType<typeof mountVisualSettings>|undefined;
    let resumePending = false;
    let recoveryPanel: ReturnType<typeof mountRecoveryPanel> | undefined;
    let restartPanel: ReturnType<typeof mountRestartPanel> | undefined;
    const pauseGate = createPauseGate(value => { preview?.setPaused(value); renderPause(); });
    const events = new AbortController();
    let channel: BroadcastChannel | undefined;
    const writer = crypto.randomUUID();
    const durable = createAutosave(options.backend ?? createIndexedDbBackend(browserFactory()), { writer, changed: () => {
            if (disposed)
                return;
            syncPause();
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
        for (const element of root.querySelectorAll<HTMLElement>('[data-entry-aria]')) { const key = element.dataset.entryAria as EntryMessage; if(key in copy)element.setAttribute('aria-label',copy[key]); }
        if (select) { select.value = locale; select.setAttribute('aria-label',copy.language); }
        if (status)
            status.textContent = copy[preferenceState === 'saved' ? 'preferenceSaved' : preferenceState === 'temporary' ? 'preferenceTemporary' : 'preferenceReady'];
        preview?.setLocale(locale);
        preview?.refresh();
        renderSave();
        recoveryPanel?.render();
        restartPanel?.render();
        visualPanel?.render();
    }
    root.addEventListener('entry-locale-request', event => {
        const value = (event as CustomEvent<unknown>).detail;
        if (!isEntryLocale(value))
            return;
        manualLocale = true;
        preferenceState = saveEntryLocale(storage, value) ? 'saved' : 'temporary';
        render(value);
    }, { signal: events.signal });
    select?.addEventListener('change', () => {
        if (!isEntryLocale(select.value))
            return;
        manualLocale = true;
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
            syncPause();
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
                syncPause();
            }
        }, { signal: events.signal });
    }
    for (const dialog of root.querySelectorAll<HTMLDialogElement>('dialog')) {
        dialog.addEventListener('close', () => syncPause(), { signal: events.signal });
    }
    const copySave = { en: { loading: 'Checking local progress...', empty: 'No saved sanctuary yet. Play to begin.', available: 'Saved sanctuary found on this device. Continue to open it.', dirty: 'Changes pending. Autosave will update shortly.', saving: 'Saving local progress...', saved: 'Progress saved on this device.', unavailable: 'Local storage is unavailable. Progress is temporary for this visit.', unreadable: 'Stored progress cannot be read. It has been kept unchanged; starting over is blocked to protect it.', error: 'Progress is not saved. The last good save is kept.', conflict: 'Another tab changed this sanctuary. This tab is paused; reload the saved progress before playing.', retry: 'Retry saving / storage', reload: 'Reload saved progress', resume: 'Resume zoo', resumeNote: 'Your saved world is loaded and paused. Nothing progressed while you were away.', detail: 'Last save: {time} · {coins} ZC · {missions} missions · {birds} birds. This device only; no cloud backup.' }, id: { loading: 'Memeriksa progres lokal...', empty: 'Belum ada suaka tersimpan. Main untuk memulai.', available: 'Suaka tersimpan ditemukan di perangkat ini. Lanjutkan untuk membukanya.', dirty: "Ada perubahan. Simpan otomatis akan segera diperbarui.", saving: 'Menyimpan progres lokal...', saved: 'Progres tersimpan di perangkat ini.', unavailable: 'Penyimpanan lokal tidak tersedia. Progres hanya sementara selama kunjungan ini.', unreadable: 'Progres tersimpan tidak dapat dibaca. Data tetap utuh; mulai baru diblokir untuk melindunginya.', error: "Progres belum tersimpan. Simpanan terakhir yang valid tetap disimpan.", conflict: 'Tab lain mengubah suaka ini. Tab ini dijeda; muat ulang progres tersimpan sebelum bermain.', retry: 'Coba lagi simpan / akses', reload: 'Muat ulang progres tersimpan', resume: 'Lanjut bermain', resumeNote: 'Dunia tersimpan sudah dimuat dan dijeda. Tidak ada progres selama kamu pergi.', detail: "Simpanan terakhir: {time} · {coins} ZC · {missions} misi · {birds} burung. Hanya perangkat ini; tanpa cadangan daring." } };
    function renderSave() {
        syncPause();
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
        detail?.replaceChildren(view.savedAt === null ? '' : c.detail.replace('{time}', new Intl.DateTimeFormat(locale, { hour: '2-digit', minute: '2-digit', second: '2-digit' }).format(view.savedAt)).replace('{coins}', formatNumber(view.savedCurrency,locale)).replace('{missions}', formatNumber(view.savedMissions,locale)).replace('{birds}', formatNumber(view.savedBirds,locale)));
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
            continueButton.disabled = resumePending || view.recoveryBusy || view.restartBusy || Boolean(view.recovery && view.recovery.kind !== 'none') || ['loading', 'unreadable', 'conflict'].includes(view.phase) || (!view.hasSave && !view.active);
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
        gateGameplay(pauseGate.paused(), resumePending || ['conflict','unreadable'].includes(view.phase) || view.restartBusy);
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
        pauseGate.resume();
        syncPause();
        render(locale);
    }, { signal: events.signal });
    root.querySelector('[data-save-retry]')?.addEventListener('click', () => { void durable.retry(); }, { signal: events.signal });
    root.querySelector('[data-save-reload]')?.addEventListener('click', () => window.location.reload(), { signal: events.signal });
    document.addEventListener('visibilitychange', () => {
        if (document.hidden) {
            pauseGate.hold('background', true);
            syncPause();
            void durable.flush();
        }
        else
            syncPause();
    }, { signal: events.signal });
    window.addEventListener('pagehide', () => { pauseGate.hold('background', true); syncPause(); void durable.flush(); }, { signal: events.signal });
    if (options.broadcast !== false && typeof BroadcastChannel !== 'undefined') {
        channel = new BroadcastChannel('myzootwin-progress-v1');
        channel.addEventListener('message', event => {
            const value = event.data;
            if (value?.writer !== writer && Number.isSafeInteger(value?.revision))
                durable.externalRevision(value.revision, typeof value.generation === 'string' ? value.generation : undefined);
        }, { signal: events.signal });
    }
    recoveryPanel = mountRecoveryPanel(root, { save: durable, allowDownload: options.allowRecoveryDownload !== false, locale: () => locale, pause: () => pauseGate.hold('dialog', true), closeGame: () => { resumePending = false; preview?.close(); }, restored: () => { locale = chooseGameLocale(locale, manualLocale, durable.savedLocale()); render(locale); } });
    function gateGameplay(paused: boolean, hard: boolean) {
        const hud = root.dataset.hudActive === 'true';
        const layout = root.querySelector<HTMLElement>('[data-guide-layout]'), stage = root.querySelector<HTMLElement>('[data-preview-stage]');
        if (layout) layout.inert = hud ? hard : paused;
        if (stage) stage.inert = hud && paused;
        for (const gate of root.querySelectorAll<HTMLFieldSetElement>('[data-hud-controls]')) gate.disabled = hud && paused;
        const speed = root.querySelector<HTMLElement>('[data-speed-tools]'), toolbar = root.querySelector<HTMLElement>('[data-guide-toolbar]');
        if (speed) speed.inert = paused;
        if (toolbar) toolbar.inert = hard;
    }
    function syncPause() {
        const v = durable.view();
        pauseGate.update({ continue: resumePending, dialog: Boolean(root.querySelector('#play-help[open],#play-settings[open],[data-save-recovery-dialog][open],[data-reset-dialog][open]')), storage: ['conflict', 'unreadable'].includes(v.phase), restart: v.restartBusy });
        renderPause();
    }
    function renderPause() {
        if (disposed)
            return;
        const panel = root.querySelector<HTMLElement>('[data-session-panel]'), toggle = root.querySelector<HTMLButtonElement>('[data-pause-toggle]'), status = root.querySelector<HTMLElement>('[data-pause-status]');
        const v = durable.view(), dialogOpen = Boolean(root.querySelector('dialog[open]')), paused = pauseGate.paused() || dialogOpen, ready = preview?.inspect().state.status === 'ready', blocked = ['conflict', 'unreadable'].includes(v.phase) || v.restartBusy;
        root.dataset.sessionPaused = String(paused);
        root.dataset.pauseReasons = [...pauseGate.reasons(), ...(dialogOpen && !pauseGate.has('dialog') ? ['dialog'] : [])].join(',');
        if (panel) {
            panel.hidden = !v.active || !ready || resumePending;
            panel.setAttribute('aria-label', locale === 'id' ? 'Kontrol sesi' : 'Session controls');
        }
        if (toggle) {
            toggle.textContent = locale === 'id' ? (paused ? 'Lanjut bermain' : 'Jeda suaka') : (paused ? 'Resume zoo' : 'Pause zoo');
            toggle.disabled = blocked || Boolean(root.querySelector('dialog[open]'));
            toggle.setAttribute('aria-pressed', String(paused));
        }
        if (status)
            status.textContent = locale === 'id' ? (pauseGate.has('background') ? 'Dijeda saat kamu pergi. Lanjutkan saat siap; tidak ada progres offline.' : paused ? 'Suaka dijeda. Satwa, pengunjung, uang dan misi tidak berjalan.' : 'Suaka berjalan. Jeda kapan saja untuk berhenti dengan aman.') : (pauseGate.has('background') ? 'Paused while you were away. Resume when ready; no offline progress.' : paused ? 'Zoo paused. Animals, visitors, money and missions are frozen.' : 'Zoo running. Pause any time to stop safely.');
        gateGameplay(pauseGate.paused(), resumePending || blocked);
    }
    root.querySelector('[data-pause-toggle]')?.addEventListener('click', () => {
        if (['conflict', 'unreadable'].includes(durable.view().phase) || durable.view().restartBusy || root.querySelector('dialog[open]'))
            return;
        if (pauseGate.paused()) {
            resumePending = false;
            pauseGate.resume();
        }
        else
            pauseGate.hold('manual', true);
        syncPause();
        renderSave();
    }, { signal: events.signal });
    root.addEventListener('hud-layout-change',syncPause,{signal:events.signal});
    const pauseObserver = new MutationObserver(syncPause);
    pauseObserver.observe(root, { subtree: true, attributes: true, attributeFilter: ['open', 'data-renderer-state'] });
    if (document.hidden)
        pauseGate.hold('background', true);
    restartPanel = mountRestartPanel(root, { save: durable, locale: () => locale, pause: () => pauseGate.hold('manual', true), closeGame: () => { resumePending = false; preview?.close(); }, replaced: () => { locale = chooseGameLocale(locale, manualLocale, durable.savedLocale()); render(locale); } });
    const hudLayout = mountHudLayout(root);
    const ready = (async () => {
        await durable.load();
        if (disposed)
            return;
        locale = chooseGameLocale(locale, manualLocale, durable.savedLocale());
        preview = mountPreviewPanel(root, { stateStore: durable.session, canOpen: () => durable.canOpen(), beforeOpen: () => durable.view().active || durable.startNew(locale) });
        preview.setPaused(pauseGate.paused());
        const currentVisual=()=>visualChoice??durable.savedVisualSettings()??{graphics:'auto' as const,reducedMotion:false};
        visualPanel=mountVisualSettings(root,storage,{locale:()=>locale,current:currentVisual,apply:value=>{visualChoice={...value};preview?.setVisualSettings(value);}});
        preview.setVisualSettings(currentVisual());
        render(locale);
    })();
    const handle = { ready, dispose() {
            if (disposed)
                return;
            disposed = true;
            visualPanel?.dispose();
            hudLayout.dispose();
            pauseObserver.disconnect();
            restartPanel?.dispose();
            recoveryPanel?.dispose();
            preview?.dispose();
            durable.dispose();
            channel?.close();
            channel = undefined;
            events.abort();
            delete root.dataset.enhanced;
            mounted.delete(root);
        }, inspect: () => durable.inspect(), inspectRenderer: () => preview?.inspect() };
    mounted.set(root, handle);
    return handle;
}
