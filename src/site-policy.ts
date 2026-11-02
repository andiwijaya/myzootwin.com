/** Game data stays local. Journal integration is retained separately. */
export const GAME_CSP = "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; font-src 'self'; connect-src 'self'; media-src 'self' blob:; object-src 'none'; base-uri 'self'; form-action 'none'";
export function pagePrivacy(pathname: string, analyticsConfigured: boolean) {
  const game = pathname === '/play' || pathname === '/play/';
  return { game, analytics: !game && analyticsConfigured, remoteFonts: !game,
    csp: game ? GAME_CSP : null, referrer: game ? 'no-referrer' : null };
}
