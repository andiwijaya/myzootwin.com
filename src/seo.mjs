export const siteOrigin = 'https://myzootwin.com';

// Keep unfinished sections available to readers without offering them for indexing.
export const unpublishedSections = ['adventures', 'gear', 'pets', 'wildlife'];

/** @param {string} pathname */
export function canonicalPath(pathname) {
  return pathname.replace(/\/+$/, '') + '/';
}

/** @param {string} pathname */
export function isIndexablePath(pathname) {
  const path = canonicalPath(pathname);
  return path !== '/404/' && path !== '/404.html/' &&
    !unpublishedSections.some(section => path === `/${section}/`);
}

/** @param {string} path */
export function siteUrl(path) {
  return new URL(path, siteOrigin).href;
}
