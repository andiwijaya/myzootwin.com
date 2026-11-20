import { mountGameEntry } from './game-entry';
import { createCommonEngineClock } from '../game/core/common-engine-clock.ts';
import { createZebraIndexedDbBackend } from '../game/persistence/zebra-backend.ts';

export function mountCommonEnginePilot(root: HTMLElement, sessions: string[]) {
  const session = sessions.length === 1 ? sessions[0] : '';
  if (!/^[a-z0-9][a-z0-9-]{7,47}$/.test(session)) {
    const status = root.querySelector('[data-save-status]');
    if (status) status.textContent = 'Use one QA session name of 8–48 lowercase letters, digits or hyphens, starting with a letter or digit.';
    return;
  }

  const database = 'myzootwin-qa-common-engine-v03-' + session;
  const host = root.querySelector<HTMLElement>('[data-preview-stage]');
  if (!host) throw new Error('Missing Common Engine pilot stage');

  mountGameEntry(root, {
    backend: createZebraIndexedDbBackend(window.indexedDB, database),
    broadcast: false,
    preferenceStorage: null,
    loadRenderer: async (stateStore) => {
      const { mountFoundationScene } = await import('../game/render3d/foundation-scene');
      return (onFailure) => mountFoundationScene(host, onFailure, {
        stateStore,
        createClock: (step, speed) => {
          const clock = createCommonEngineClock(step, speed);
          host.dataset.commonEnginePilot = '0.3.0';
          return clock;
        },
      });
    },
  });
}
