/** Ephemeral page-local navigation signals. No transport, storage, identity or save data. */
export type SiteSource = 'home' | 'learn' | 'game-guide' | 'nav';
export function siteNavigation(href: string | null, source: string | null) {
  if (!['home', 'learn', 'game-guide', 'nav'].includes(source ?? '')) return null;
  const destination = href === '/play/' ? 'play' : href === '/learn/' ? 'learn' : null;
  return destination ? Object.freeze({ destination, source: source as SiteSource }) : null;
}
const mounted = new WeakMap<Document | HTMLElement, () => void>();
export function mountSiteEvents(root: Document | HTMLElement) {
  const existing = mounted.get(root); if (existing) return existing;
  const controller = new AbortController();
  root.addEventListener('click', (event: Event) => {
    if (event.defaultPrevented || !(event.target instanceof Element)) return;
    if (event instanceof MouseEvent && (event.button !== 0 || event.ctrlKey || event.metaKey || event.altKey || event.shiftKey)) return;
    const link = event.target.closest<HTMLAnchorElement>('a[data-site-source]');
    if (!link || !root.contains(link)) return;
    const detail = siteNavigation(link.getAttribute('href'), link.getAttribute('data-site-source'));
    if (detail) link.dispatchEvent(new CustomEvent('myzootwin:navigate', { bubbles: true, detail }));
  }, { signal: controller.signal });
  let disposed = false;
  const dispose = () => {
    if (disposed) return;
    disposed = true; controller.abort();
    if (mounted.get(root) === dispose) mounted.delete(root);
  };
  mounted.set(root, dispose); return dispose;
}
