import { mountGameEntry } from '../game-entry/game-entry';
import { createZebraIndexedDbBackend } from '../game/persistence/zebra-backend.ts';

function mountPlayRoute(root: HTMLElement) {
  const { protocol, hostname, search } = window.location;
  const params = new URLSearchParams(search);
  const options: NonNullable<Parameters<typeof mountGameEntry>[1]> = { mapFirst: true };
  if (import.meta.env.PUBLIC_MYZOOTWIN_COMMON_ENGINE_QA === '1' &&
      protocol === 'http:' && ['localhost', '127.0.0.1', '[::1]'].includes(hostname)) {
    const sessions = params.getAll('qa-session');
    if (sessions.length) {
      const [session] = sessions;
      if (sessions.length !== 1 || !/^[a-z0-9][a-z0-9-]{7,47}$/.test(session)) {
        const status = root.querySelector('[data-save-status]');
        if (status) status.textContent = 'Use one QA session name of 8–48 lowercase letters, digits or hyphens, starting with a letter or digit.';
        return;
      }
      options.backend = createZebraIndexedDbBackend(window.indexedDB, 'myzootwin-qa-common-engine-v03-' + session);
      options.broadcast = false;
      options.preferenceStorage = null;
    }
  }

  if (params.get('engine') !== 'native') {
    const host = root.querySelector<HTMLElement>('[data-preview-stage]');
    if (!host) throw new Error('Missing MyZooTwin play stage');
    options.loadRenderer = async (stateStore) => {
      const [{ mountFoundationScene }, { createCommonEngineClock }] = await Promise.all([
        import('../game/render3d/foundation-scene'),
        import('../game/core/common-engine-clock.ts'),
      ]);
      return (onFailure) => mountFoundationScene(host, onFailure, {
        stateStore,
        createClock: (step, speed) => {
          const clock = createCommonEngineClock(step, speed);
          host.dataset.simulationRuntime = 'common-engine';
          host.dataset.commonEngineVersion = '0.3.0';
          return clock;
        },
      });
    };
  }

  mountGameEntry(root, options);
}

const root = document.querySelector<HTMLElement>('[data-play-entry]');
if (root && root.dataset.enhanced !== 'true') mountPlayRoute(root);
