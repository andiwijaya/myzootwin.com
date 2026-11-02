import type {AnalyticsRuntime} from './consent.ts';
import {pagePrivacy} from '../site-policy.ts';
export const validMeasurementId = (value: string): boolean => /^G-[A-Z0-9]{4,32}$/.test(value);
export function analyticsConfiguration(location: string, title: string) {
  const url = new URL(location);
  if (url.protocol !== 'https:' && url.protocol !== 'http:') throw Error('Unsupported location');
  return {send_page_view: false, allow_google_signals: false, allow_ad_personalization_signals: false,
    page_location: url.origin + url.pathname, page_referrer: '', page_title: title};
}
type GoogleWindow = Window & {dataLayer?: unknown[]; gtag?: (...args: unknown[]) => void; [key: `ga-disable-${string}`]: boolean};
/** Basic loading boundary: no provider script/commands until the controller confirms opt-in. */
export function createGoogleAnalytics(win: Window, doc: Document, id: string): AnalyticsRuntime {
  const google = win as GoogleWindow;
  let script: HTMLScriptElement | undefined, cancelLoad: (() => void) | undefined, started = false;
  if (validMeasurementId(id)) google[`ga-disable-${id}`] = true;
  function clearCookies() {
    // These are provider cookie names, never game saves or menu preferences.
    try {
      const names = doc.cookie.split(';').map(x => x.trim().split('=')[0]).filter(x => x === '_ga' || x.startsWith('_ga_') || x === '_gid' || x === '_gat' || x.startsWith('_gat_'));
      const domains = ['', ...(win.location.hostname === 'myzootwin.com' || win.location.hostname.endsWith('.myzootwin.com') ? ['myzootwin.com', '.myzootwin.com'] : [])];
      for (const name of names) for (const domain of domains) doc.cookie = `${name}=; Max-Age=0; Path=/; SameSite=Lax${domain ? '; Domain=' + domain : ''}`;
    } catch {/* A browser may deny cookie access; tag loading remains stopped. */}
  }
  return {
    start() {
      if (started || !validMeasurementId(id) || pagePrivacy(win.location.pathname, true).game || win.location.search || win.location.hash) return Promise.reject(Error('Ineligible page'));
      started = true;
      google[`ga-disable-${id}`] = false;
      google.dataLayer ??= [];
      function gtag(..._args: unknown[]) {google.dataLayer!.push(arguments);}
      google.gtag = gtag;
      const denied = {analytics_storage: 'denied', ad_storage: 'denied', ad_user_data: 'denied', ad_personalization: 'denied'};
      gtag('consent', 'default', denied);
      gtag('consent', 'update', {...denied, analytics_storage: 'granted'});
      gtag('js', new Date());
      const config = analyticsConfiguration(win.location.href, doc.title);
      gtag('config', id, config);
      gtag('event', 'page_view', {page_location: config.page_location, page_referrer: '', page_title: config.page_title, send_to: id});
      return new Promise<void>((resolve, reject) => {
        script = doc.createElement('script'); script.async = true; script.referrerPolicy = 'no-referrer';
        script.dataset.myzooAnalytics = 'true'; script.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(id)}`;
        const active = script;
        active.onload = () => {cancelLoad = undefined; resolve();};
        active.onerror = () => {cancelLoad = undefined; reject(Error('Optional analytics unavailable'));};
        cancelLoad = () => {active.onload = null; active.onerror = null; reject(Error('Cancelled'));};
        doc.head.append(active);
      });
    },
    stop(clear) {
      if (validMeasurementId(id)) google[`ga-disable-${id}`] = true;
      cancelLoad?.(); cancelLoad = undefined; script?.remove(); script = undefined;
      if (clear) clearCookies();
      // No denied-consent command/ping: a successful persisted withdrawal reloads the document.
    }
  };
}
