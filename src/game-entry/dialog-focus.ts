/** Keep keyboard navigation inside the active modal; Escape remains the native close action. */
export function containDialogFocus(root: HTMLElement, signal: AbortSignal) {
  root.addEventListener('keydown', event => {
    if (event.key !== 'Tab' || event.defaultPrevented || event.ctrlKey || event.altKey || event.metaKey) return;
    const dialogs = [...root.querySelectorAll<HTMLDialogElement>('dialog[open]')];
    const active = root.ownerDocument.activeElement;
    const dialog = dialogs.find(d => active && d.contains(active)) ?? dialogs.at(-1);
    if (!dialog) return;
    const controls = [...dialog.querySelectorAll<HTMLElement>('a[href],button,input,select,textarea,summary,[tabindex]')]
      .filter(el => el.tabIndex >= 0 && !el.matches(':disabled') && !el.closest('[hidden],[inert],[aria-hidden="true"]')
        && el.getClientRects().length > 0 && getComputedStyle(el).visibility !== 'hidden');
    const index = controls.indexOf(active as HTMLElement);
    if (index >= 0 && (event.shiftKey ? index > 0 : index < controls.length - 1)) return;
    event.preventDefault();
    const target = event.shiftKey ? controls.at(-1) : controls[0];
    (target ?? dialog.querySelector<HTMLElement>('[tabindex="-1"]') ?? dialog).focus();
  }, { signal });
}
