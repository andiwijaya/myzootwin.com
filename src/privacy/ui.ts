import {createConsent, CONSENT_KEY, type ConsentStorage, type AnalyticsRuntime, type ConsentView} from './consent.ts';
import {createGoogleAnalytics, validMeasurementId} from './google.ts';
import {privacyEnglish, privacyIndonesian} from './locale.ts';
import {containDialogFocus} from '../game-entry/dialog-focus.ts';
import {pagePrivacy} from '../site-policy.ts';
type PrivacyHandle = {consent: ReturnType<typeof createConsent>; inspect: () => ConsentView & {reason: 'game' | 'unconfigured' | 'browser' | 'url' | null; configured: boolean; game: boolean}; dispose: () => void};
const mounted = new WeakMap<HTMLElement, PrivacyHandle>();
export function mountSitePrivacy(root: HTMLElement, options: {storage?: ConsentStorage; analytics?: AnalyticsRuntime; reload?: () => void; locale?: () => 'en' | 'id'; privacySignal?: boolean} = {}) {
  const current = mounted.get(root); if (current) return current;
  const handle = mountNew(root, options); mounted.set(root, handle); return handle;
}
function mountNew(root: HTMLElement, options: {storage?: ConsentStorage; analytics?: AnalyticsRuntime; reload?: () => void; locale?: () => 'en' | 'id'; privacySignal?: boolean}): PrivacyHandle {
  const doc = root.ownerDocument, win = doc.defaultView!;
  const events = new AbortController(), dialog = root.querySelector<HTMLDialogElement>('dialog')!;
  const id = root.dataset.analyticsId ?? '', configured = validMeasurementId(id);
  const game = root.dataset.game === 'true' || pagePrivacy(win.location.pathname, true).game;
  const privacySignal = options.privacySignal ?? ((win.navigator as Navigator & {globalPrivacyControl?: boolean}).globalPrivacyControl === true || win.navigator.doNotTrack === '1');
  const reason = game ? 'game' : !configured ? 'unconfigured' : privacySignal ? 'browser' : win.location.search || win.location.hash ? 'url' : null;
  const eligible = reason === null;
  let storage: ConsentStorage | undefined;
  try {storage = 'storage' in options ? options.storage : win.localStorage;} catch {/* Fail closed. */}
  let opener: HTMLElement | null = null, last: ConsentView;
  const language = () => options.locale?.() ?? ((doc.querySelector('[data-play-entry]')?.getAttribute('lang') ?? doc.documentElement.lang) === 'id' ? 'id' : 'en');
  const copy = () => language() === 'id' ? privacyIndonesian : privacyEnglish;
  function render(view: ConsentView) {
    last = view; const strings = copy(); root.lang = language();
    for (const node of root.querySelectorAll<HTMLElement>('[data-privacy-text]')) {
      const key = node.dataset.privacyText as keyof typeof strings; node.textContent = strings[key];
    }
    const message = view.fault ? strings[view.fault] : view.reloading ? strings.applying : view.phase === 'starting' ? strings.starting : view.choice === 'allowed' ? strings.on : strings[view.choice];
    for (const node of root.querySelectorAll<HTMLElement>('[data-privacy-status]')) node.textContent = message;
    const note = root.querySelector<HTMLElement>('[data-privacy-reason]')!; note.hidden = reason === null; note.textContent = reason ? strings[reason] : '';
    root.querySelector<HTMLElement>('[data-privacy-banner]')!.hidden = game || !configured || (view.choice !== 'unknown' && !['storage','invalid','reload'].includes(view.fault ?? ''));
    for (const button of root.querySelectorAll<HTMLButtonElement>('[data-site-choice]')) {
      button.disabled = view.reloading || (button.dataset.siteChoice === 'allowed' ? !configured || privacySignal || (view.choice === 'allowed' && !view.fault) : view.choice === 'denied' && !view.fault);
    }
  }
  const consent = createConsent({storage, eligible, analytics: options.analytics ?? createGoogleAnalytics(win, doc, id), reload: options.reload ?? (() => win.location.reload()), changed: render});
  for (const button of doc.querySelectorAll<HTMLButtonElement>('[data-open-site-privacy]')) button.disabled = false;
  for (const button of root.querySelectorAll<HTMLButtonElement>('[data-site-review]')) button.disabled = false;
  containDialogFocus(root, events.signal);
  doc.addEventListener('click', event => {
    const target = event.target instanceof Element ? event.target.closest<HTMLElement>('[data-open-site-privacy],[data-site-review]') : null;
    if (!target) return;
    opener = target; render(last); if (!dialog.open) {dialog.showModal(); doc.dispatchEvent(new Event('myzootwin:privacy-modal'));} dialog.querySelector<HTMLElement>('h2')!.focus();
  }, {signal: events.signal});
  root.addEventListener('click', event => {
    const target = event.target instanceof Element ? event.target.closest<HTMLElement>('[data-site-choice],[data-site-close]') : null;
    if (!target) return;
    if (target.hasAttribute('data-site-close')) dialog.close();
    else if (target.dataset.siteChoice === 'allowed' || target.dataset.siteChoice === 'denied') consent.choose(target.dataset.siteChoice);
  }, {signal: events.signal});
  dialog.addEventListener('close', () => {doc.dispatchEvent(new Event('myzootwin:privacy-modal')); if (opener?.isConnected) opener.focus();}, {signal: events.signal});
  win.addEventListener('storage', event => {if (event.key === CONSENT_KEY || event.key === null) consent.refresh();}, {signal: events.signal});
  win.addEventListener('pageshow', () => consent.refresh(), {signal: events.signal});
  let disposed = false;
  const handle: PrivacyHandle = {consent, inspect: () => ({...consent.view(), reason, configured, game}), dispose() {
    if (disposed) return; disposed = true; if (dialog.open) {dialog.close(); doc.dispatchEvent(new Event('myzootwin:privacy-modal'));} events.abort(); consent.dispose();
    if (mounted.get(root) === handle) mounted.delete(root);
  }};
  return handle;
}
