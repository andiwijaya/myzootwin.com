import {formatNumber} from './i18n-format.ts';
import { HUD_TABS, isHudTab, nextHudTab, welfareSummary, coinSummary, type HudTab } from './hud-summary.ts';
import type { BirdsView } from '../game/animals/autonomy.ts';
import type { EconomyView } from '../game/economy/spending.ts';
import type { ArrivalView } from '../game/visitors/arrivals.ts';
import type { MissionView } from '../game/missions/engine.ts';
import type { SpeedView } from './speed-panel.ts';
const copy = { en: { actions: 'Game actions', missions: 'Missions', care: 'Care', visitors: 'Guests', build: 'Build', options: 'Options', saveDetails: 'Save details', saved: 'Saved on this device', dirty: 'Changes pending', saving: 'Saving…', error: 'Not saved', conflict: 'Game changed in another tab', unreadable: 'Save needs recovery', unavailable: 'Temporary progress', status: 'Sanctuary status', tools: 'Zoo tools', welfare: 'Welfare {n}%', noBirds: 'No birds', guests: 'Guests {n}', speed: 'Simulation speed {n}×. Open options', done: 'All missions complete', mission: 'Current mission {id}', coins: 'Zoo Coins {n}' }, id: { actions: "Aksi permainan", missions: 'Misi', care: 'Rawat', visitors: 'Tamu', build: 'Bangun', options: 'Opsi', saveDetails: "Detail simpanan", saved: 'Tersimpan di perangkat', dirty: "Menunggu simpan otomatis", saving: 'Menyimpan…', error: 'Belum tersimpan', conflict: "Permainan berubah di tab lain", unreadable: "Simpanan perlu pemulihan", unavailable: 'Progres sementara', status: 'Status suaka', tools: 'Alat suaka', welfare: 'Satwa {n}%', noBirds: 'Belum ada satwa', guests: 'Tamu {n}', speed: 'Kecepatan simulasi {n}×. Buka opsi', done: 'Semua misi selesai', mission: 'Misi saat ini {id}', coins: 'Zoo Coins {n}' } };
/** Reveal before focus/scroll; no simulation state changes live in the HUD. */
export function revealHudTarget(target: Element | null) {
    const root = target?.closest<HTMLElement>('[data-play-entry]'), pane = target?.closest<HTMLElement>('[data-hud-pane]');
    if (root && pane)
        root.dispatchEvent(new CustomEvent('hud-reveal', { detail: pane.dataset.hudPane }));
}
/** Scroll a tool inside its own viewport; avoid moving the world behind the sticky chrome. */
export function scrollHudTarget(target: Element | null | undefined, align: 'start' | 'nearest' = 'nearest') {
    if (!target)
        return;
    const root = target.closest<HTMLElement>('[data-play-entry]');
    if (root?.dataset.hudActive === 'true') {
        const scroller = target.closest<HTMLElement>('[data-hud-panels]');
        if (scroller) {
            const r = target.getBoundingClientRect(), p = scroller.getBoundingClientRect();
            if (align === 'start' || r.top < p.top + 6)
                scroller.scrollTop += r.top - p.top - 6;
            else if (r.bottom > p.bottom - 6)
                scroller.scrollTop += Math.min(r.top - p.top - 6, r.bottom - p.bottom + 6);
        }
        else
            root.scrollIntoView({ block: 'start', behavior: 'instant' });
    }
    else
        target.scrollIntoView({ block: 'nearest', behavior: 'instant' });
}
export function mountHudLayout(root: HTMLElement) {
    const events = new AbortController(), chrome = root.querySelector<HTMLElement>('[data-hud-chrome]'), options = root.querySelector<HTMLDetailsElement>('[data-hud-options]'), tabs = root.querySelector<HTMLElement>('[data-hud-tabs]'), stats = root.querySelector<HTMLElement>('[data-hud-stats]');
    let resizeTimer: ReturnType<typeof setTimeout> | undefined;
    let pointerDown = false;
    let active = false, selected: HudTab = 'missions', disposed = false, balance = 1500, welfare: number | null = null, guests = 0, mission: string | null = 'Q01', speed: 1 | 10 = 1, lastChrome = 0;
    const set = (selector: string, text: string) => {
        const el = root.querySelector(selector);
        if (el && el.textContent !== text)
            el.textContent = text;
    };
    function select(tab: HudTab, focus = false, manual = false) {
        selected = tab;
        for (const name of HUD_TABS) {
            const button = root.querySelector<HTMLButtonElement>(`[data-hud-tab="${name}"]`), pane = root.querySelector<HTMLElement>(`[data-hud-pane="${name}"]`);
            if (button) {
                button.setAttribute('aria-selected', String(name === tab));
                button.tabIndex = name === tab ? 0 : -1;
            }
            if (pane) {
                pane.hidden = active && name !== tab;
                pane.tabIndex = name === tab ? 0 : -1;
            }
        }
        if (manual)
            root.dispatchEvent(new CustomEvent('hud-panel-change', { detail: tab }));
        if (focus)
            root.querySelector<HTMLButtonElement>(`[data-hud-tab="${tab}"]`)?.focus({ preventScroll: true });
        root.dataset.hudTab = tab;
    }
    function measure() {
        if (disposed || !chrome)
            return;
        const h = Math.ceil(chrome.getBoundingClientRect().height);
        if (h !== lastChrome) {
            lastChrome = h;
            root.style.setProperty('--hud-chrome-height', h + 'px');
        }
    }
    function render() {
        if (disposed)
            return;
        const locale = root.lang === 'id' ? 'id' : 'en', c = copy[locale];
        for (const el of root.querySelectorAll<HTMLElement>('[data-hud-text]')) {
            const key = el.dataset.hudText as keyof typeof c;
            if (key in c && el.textContent !== c[key])
                el.textContent = c[key];
        }
        const phase = root.querySelector<HTMLElement>('[data-save-panel]')?.dataset.savePhase;
        if (active && (phase === 'saved' || phase === 'dirty' || phase === 'saving' || phase === 'error' || phase === 'conflict' || phase === 'unreadable' || phase === 'unavailable'))
            set('[data-save-status]', c[phase]);
        set('[data-hud-coins]', coinSummary(balance, locale));
        root.querySelector('[data-hud-coins]')?.setAttribute('aria-label', c.coins.replace('{n}', new Intl.NumberFormat(locale).format(balance)));
        root.querySelector('[data-hud-coins]')?.setAttribute('title', new Intl.NumberFormat(locale).format(balance) + ' ZC');
        set('[data-hud-welfare]', welfare === null ? c.noBirds : c.welfare.replace('{n}', formatNumber(welfare,locale)));
        set('[data-hud-guests]', c.guests.replace('{n}', formatNumber(guests,locale)));
        set('[data-hud-mission]', mission ?? '✓');
        root.querySelector('[data-hud-mission]')?.setAttribute('aria-label', mission ? c.mission.replace('{id}', mission) : c.done);
        set('[data-hud-speed]', speed + '×');
        root.querySelector('[data-hud-speed]')?.setAttribute('aria-label', c.speed.replace('{n}', formatNumber(speed,locale)));
        stats?.setAttribute('aria-label', c.status);
        tabs?.setAttribute('aria-label', c.tools);
        root.querySelector<HTMLElement>('[data-pause-status]')?.setAttribute('id', 'hud-pause-status');
        root.querySelector('[data-pause-toggle]')?.setAttribute('aria-describedby', 'hud-pause-status');
        measure();
    }
    function sync() {
        if (disposed)
            return;
        const was = active, state = root.querySelector('[data-renderer-panel]')?.getAttribute('data-renderer-state');
        active = state === 'ready';
        if (root.dataset.hudActive !== String(active)) {
            root.dataset.hudActive = String(active);
            root.dispatchEvent(new Event('hud-layout-change'));
        }
        if (stats)
            stats.hidden = !active;
        if (tabs)
            tabs.hidden = !active;
        if (options) {
            const saved = root.querySelector<HTMLElement>('[data-save-panel]')?.dataset.hasSave === 'true';
            options.hidden = !active && !saved;
            if (was && !active)
                options.open = false;
        }
        if (was && !active && state === 'closed')
            root.dataset.guided = 'false';
        select(selected);
        render();
        if (active && !was)
            queueMicrotask(() => {
                if (!disposed && active)
                    root.scrollIntoView({ block: 'start', behavior: 'instant' });
            });
        const phase = root.querySelector<HTMLElement>('[data-save-panel]')?.dataset.savePhase;
        if (['error', 'conflict', 'unreadable', 'unavailable'].includes(phase ?? '')) {
            const detail = root.querySelector<HTMLDetailsElement>('[data-hud-save-details]');
            if (detail && !detail.open)
                detail.open = true;
        }
    }
    const observer = new MutationObserver(sync);
    observer.observe(root, { subtree: true, attributes: true, attributeFilter: ['data-renderer-state', 'lang', 'data-save-phase', 'data-has-save'] });
    const resize = new ResizeObserver(measure);
    if (chrome)
        resize.observe(chrome);
    root.addEventListener('scene-economy-change', e => { balance = (e as CustomEvent<EconomyView>).detail.balance; render(); }, { signal: events.signal, capture: true });
    root.addEventListener('scene-birds-change', e => { const v = (e as CustomEvent<BirdsView>).detail; welfare = welfareSummary(v.placed, v.birds); render(); }, { signal: events.signal, capture: true });
    root.addEventListener('scene-visitors-change', e => { guests = (e as CustomEvent<ArrivalView>).detail.active; render(); }, { signal: events.signal, capture: true });
    root.addEventListener('scene-missions-change', e => { mission = (e as CustomEvent<MissionView>).detail.currentId; render(); }, { signal: events.signal, capture: true });
    root.addEventListener('scene-speed-change', e => { speed = (e as CustomEvent<SpeedView>).detail.speed; render(); }, { signal: events.signal, capture: true });
    root.addEventListener('hud-reveal', e => {
        const tab = (e as CustomEvent<unknown>).detail;
        if (isHudTab(tab)) {
            select(tab);
            if (options)
                options.open = false;
        }
    }, { signal: events.signal });
    tabs?.addEventListener('click', e => {
        const b = (e.target as HTMLElement).closest<HTMLButtonElement>('[data-hud-tab]');
        if (b && isHudTab(b.dataset.hudTab))
            select(b.dataset.hudTab, false, true);
    }, { signal: events.signal });
    tabs?.addEventListener('keydown', e => {
        const target = (e.target as HTMLElement).closest('[data-hud-tab]');
        if (!target)
            return;
        const next = nextHudTab(selected, e.key);
        if (next) {
            e.preventDefault();
            e.stopPropagation();
            select(next, true, true);
        }
    }, { signal: events.signal });
    root.addEventListener('click', e => {
        // Focusing a sticky toolbar control can reveal the site's preceding header.
        // Re-align after the action, without trapping ordinary page scrolling.
        if ((e.target as HTMLElement).closest('[data-hud-chrome], [data-hud-tabs], [data-hud-pane]'))
            queueMicrotask(() => {
                if (!disposed && active && !root.querySelector('dialog[open]'))
                    root.scrollIntoView({ block: 'start', behavior: 'instant' });
            });
        if ((e.target as HTMLElement).closest('[data-onboarding-exit]')) {
            select('build', false, true);
            if (options)
                options.open = false;
        }
    }, { signal: events.signal, capture: true });
    root.addEventListener('focusin', e => {
        const target = e.target as HTMLElement;
        // Never move a native pointer target between its down and up events.
        // Pointer actions align after click; keyboard/programmatic focus aligns here.
        if (pointerDown || !target.closest('[data-hud-chrome], [data-hud-tabs], [data-hud-pane]'))
            return;
        queueMicrotask(() => {
            if (!disposed && active && !root.querySelector('dialog[open]')) {
                root.scrollIntoView({ block: 'start', behavior: 'instant' });
                if (target.closest('[data-hud-pane]'))
                    scrollHudTarget(target);
            }
        });
    }, { signal: events.signal });
    root.querySelector<HTMLElement>('[data-hud-panels]')?.addEventListener('keydown', e => {
        const target = e.target as HTMLElement;
        if (e.altKey || e.ctrlKey || e.metaKey || target.closest('input, select, textarea, [contenteditable="true"]'))
            return;
        const pane = target.closest<HTMLElement>('[data-hud-pane]');
        if (!pane || !active)
            return;
        const scroller = pane.closest<HTMLElement>('[data-hud-panels]');
        if (!scroller)
            return;
        const key = e.key, page = Math.max(44, scroller.clientHeight - 44);
        const step = key === 'PageDown' ? page : key === 'PageUp' ? -page : target === pane && key === 'ArrowDown' ? 44 : target === pane && key === 'ArrowUp' ? -44 : null;
        if (step !== null || (target === pane && (key === 'Home' || key === 'End'))) {
            e.preventDefault();
            e.stopPropagation();
            scroller.scrollTop = key === 'Home' ? 0 : key === 'End' ? scroller.scrollHeight : scroller.scrollTop + (step ?? 0);
        }
    }, { signal: events.signal });
    root.addEventListener('keydown', e => {
        if (e.key === 'Escape' && options?.open && !root.querySelector('dialog[open]')) {
            e.preventDefault();
            e.stopPropagation();
            options.open = false;
            options.querySelector<HTMLElement>('summary')?.focus();
        }
    }, { signal: events.signal, capture: true });
    root.addEventListener('pointerdown', e => {
        pointerDown = true;
        if (options?.open && !options.contains(e.target as Node) && !root.querySelector('dialog[open]')) {
            options.open = false;
            if ((e.target as HTMLElement).closest('[data-preview-stage]')) {
                e.preventDefault();
                e.stopPropagation();
            }
        }
    }, { signal: events.signal, capture: true });
    window.addEventListener('pointerup', () => { pointerDown = false; }, { signal: events.signal, capture: true });
    window.addEventListener('pointercancel', () => { pointerDown = false; }, { signal: events.signal, capture: true });
    window.addEventListener('blur', () => { pointerDown = false; }, { signal: events.signal });
    options?.addEventListener('toggle', () => {
        if (options.open)
            root.dispatchEvent(new Event('hud-input-cancel'));
    }, { signal: events.signal });
    root.addEventListener('scene-selection-change', e => {
        if ((e as CustomEvent<unknown>).detail) {
            select('build');
            queueMicrotask(() => {
                if (!disposed) {
                    const panel = root.querySelector<HTMLElement>('[data-scene-selection]');
                    if (panel && !panel.hidden)
                        scrollHudTarget(panel);
                }
            });
        }
    }, { signal: events.signal, capture: true });
    window.addEventListener('resize', () => {
        if (!active || disposed)
            return;
        root.dispatchEvent(new Event('hud-input-cancel'));
        if (resizeTimer)
            clearTimeout(resizeTimer);
        resizeTimer = setTimeout(() => {
            resizeTimer = undefined;
            if (!disposed && active) {
                measure();
                root.scrollIntoView({ block: 'start', behavior: 'instant' });
            }
        }, 60);
    }, { signal: events.signal });
    sync();
    return { dispose() {
            if (disposed)
                return;
            disposed = true;
            if (options)
                options.open = false;
            if (stats)
                stats.hidden = true;
            if (tabs)
                tabs.hidden = true;
            events.abort();
            observer.disconnect();
            resize.disconnect();
            root.style.removeProperty('--hud-chrome-height');
            delete root.dataset.hudActive;
            delete root.dataset.hudTab;
            for (const pane of root.querySelectorAll<HTMLElement>('[data-hud-pane]'))
                pane.hidden = false;
        } };
}
