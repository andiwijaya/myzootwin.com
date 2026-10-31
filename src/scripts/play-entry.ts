import { entryMessages, isEntryLocale, readEntryLocale, saveEntryLocale, type EntryLocale, type EntryMessage } from '../game-entry/locale';
import { mountPreviewPanel } from '../game-entry/preview-panel';

const root = document.querySelector<HTMLElement>('[data-play-entry]');

if (root && root.dataset.enhanced !== 'true') {
  root.dataset.enhanced = 'true';
  let storage: Storage | undefined;
  try { storage = window.localStorage; } catch { /* Storage may be blocked. */ }
  const initial = readEntryLocale(storage, navigator.language);
  let preferenceState: 'ready' | 'saved' | 'temporary' = !initial.storageAvailable ? 'temporary' : initial.source === 'saved' ? 'saved' : 'ready';
  const select = root.querySelector<HTMLSelectElement>('[data-entry-language]');
  const status = root.querySelector<HTMLElement>('[data-preference-status]');
  const preview = mountPreviewPanel(root);

  function render(locale: EntryLocale) {
    if (!root) return;
    const copy = entryMessages[locale];
    root.lang = locale;
    document.documentElement.lang = locale;
    document.title = copy.pageTitle;
    for (const element of root.querySelectorAll('[data-entry-text]')) {
      const key = element.getAttribute('data-entry-text') as EntryMessage;
      if (key in copy) element.textContent = copy[key];
    }
    for (const selector of ['meta[name="description"]', 'meta[property="og:description"]', 'meta[name="twitter:description"]']) {
      document.querySelector<HTMLMetaElement>(selector)?.setAttribute('content', copy.description);
    }
    for (const selector of ['meta[property="og:title"]', 'meta[name="twitter:title"]']) {
      document.querySelector<HTMLMetaElement>(selector)?.setAttribute('content', copy.pageTitle);
    }
    if (select) select.value = locale;
    if (status) status.textContent = copy[preferenceState === 'saved' ? 'preferenceSaved' : preferenceState === 'temporary' ? 'preferenceTemporary' : 'preferenceReady'];
    preview.setLocale(locale);
  }

  render(initial.locale);

  select?.addEventListener('change', () => {
    if (!isEntryLocale(select.value)) return;
    preferenceState = saveEntryLocale(storage, select.value) ? 'saved' : 'temporary';
    render(select.value);
  });

  for (const button of root.querySelectorAll<HTMLButtonElement>('[data-open-dialog]')) {
    button.disabled = false;
    button.addEventListener('click', () => {
      const dialog = root.querySelector<HTMLDialogElement>(`#${button.dataset.openDialog}`);
      if (!dialog || dialog.open) return;
      if (typeof dialog.showModal === 'function') dialog.showModal();
      else dialog.setAttribute('open', '');
      preview.setPaused(true);
      dialog.querySelector<HTMLElement>('[data-dialog-heading]')?.focus();
    });
  }
  for (const button of root.querySelectorAll<HTMLButtonElement>('[data-close-dialog]')) {
    button.addEventListener('click', () => {
      const dialog = button.closest('dialog');
      if (!dialog) return;
      if (typeof dialog.close === 'function') dialog.close();
      else { dialog.removeAttribute('open'); preview.setPaused(false); }
    });
  }
  for (const dialog of root.querySelectorAll<HTMLDialogElement>('dialog')) {
    dialog.addEventListener('close', () => preview.setPaused(false));
  }
}
