import { mountGameEntry } from '../game-entry/game-entry';

const root = document.querySelector<HTMLElement>('[data-play-entry]');
if (root && root.dataset.enhanced !== 'true') {
  const { protocol, hostname, search } = window.location;
  const sessions = new URLSearchParams(search).getAll('qa-session');
  if (import.meta.env.PUBLIC_MYZOOTWIN_COMMON_ENGINE_QA === '1' &&
      protocol === 'http:' && ['localhost', '127.0.0.1', '[::1]'].includes(hostname) && sessions.length) {
    void import('../game-entry/common-engine-pilot').then(({ mountCommonEnginePilot }) => mountCommonEnginePilot(root, sessions));
  } else {
    mountGameEntry(root);
  }
}
