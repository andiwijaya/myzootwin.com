import {mountZebraMaintenance} from './zebra-page.ts';
// Standalone unpublished maintenance entry, separate from normal Astro routes.
mountZebraMaintenance(document.querySelector<HTMLElement>('[data-maintenance-page]')!);
