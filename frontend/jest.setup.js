// jsdom has no matchMedia (MUI's useMediaQuery needs it). Tests pick the screen width with
// window.__setViewportWidth(px); the default is a desktop width.
let viewportWidth = 1280;
const listeners = new Set();

const evaluate = (query) => {
  const max = query.match(/max-width:\s*([\d.]+)px/);
  const min = query.match(/min-width:\s*([\d.]+)px/);
  return (!max || viewportWidth <= Number(max[1])) && (!min || viewportWidth >= Number(min[1]));
};

window.matchMedia = (query) => {
  const mql = {
    media: query,
    get matches() { return evaluate(query); },
    onchange: null,
    addEventListener: (_, cb) => listeners.add(cb),
    removeEventListener: (_, cb) => listeners.delete(cb),
    addListener: (cb) => listeners.add(cb),
    removeListener: (cb) => listeners.delete(cb),
    dispatchEvent: () => false,
  };
  return mql;
};

window.__setViewportWidth = (px) => {
  viewportWidth = px;
  listeners.forEach((cb) => cb());
};

// Browsers download each language's texts (i18n/load-catalog.js); tests have them all up front.
const { LOCALES } = require('@/i18n/config');
const { catalogFor } = require('@/i18n/catalog');
const { addCatalog } = require('@/i18n/translate');
LOCALES.forEach(({ code }) => addCatalog(code, catalogFor(code)));
