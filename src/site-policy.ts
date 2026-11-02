/** Eligibility is not consent: journal analytics may load only after verified opt-in. */
export const GAME_CSP = "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; font-src 'self'; connect-src 'self'; media-src 'self' blob:; object-src 'none'; base-uri 'self'; form-action 'none'";
export function pagePrivacy(pathname: string, analyticsConfigured: boolean) {
  const game = pathname === '/play' || pathname === '/play/';
  return { game, analytics: !game && analyticsConfigured, remoteFonts: false,
    csp: game ? GAME_CSP : null, referrer: game ? 'no-referrer' : null };
}
