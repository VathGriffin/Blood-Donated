import { DEFAULT_LANG, localeOf, normalizeLang } from './config';

// Each language's texts (see catalog.js). In the browser a language is added once its file has
// downloaded (load-catalog.js); on the server every language is read straight from the source,
// which `typeof window` keeps out of the browser bundle.
const catalogs = {};

export const addCatalog = (lang, data) => { catalogs[normalizeLang(lang)] = data; };

const catalogOf = (lang) => {
  if (catalogs[lang]) return catalogs[lang];
  if (typeof window === 'undefined') {
    catalogs[lang] = require('./catalog').catalogFor(lang);
    return catalogs[lang];
  }
  return undefined;
};

/** Whether `lang`'s texts are ready to use (always on the server). */
export const hasCatalog = (lang) => catalogOf(normalizeLang(lang)) != null;

const lookup = (lang, key) => {
  const [ns, ...path] = key.split('.');
  let node = catalogOf(lang)?.[ns];
  for (const part of path) node = node?.[part];
  return node;
};

const interpolate = (text, vars) =>
  text.replace(/\{(\w+)\}/g, (whole, name) => (vars[name] != null ? String(vars[name]) : whole));

const pluralRules = {};
const pluralOf = (lang, count) => {
  const intl = localeOf(lang).intl;
  pluralRules[intl] ||= new Intl.PluralRules(intl);
  return pluralRules[intl].select(count);
};

/**
 * Translates `key` ("namespace.path.to.text") into `lang`, filling {placeholders} from `vars`.
 * A plural text is an object { one, other }, picked by `vars.count`. A key missing in Khmer or
 * Vietnamese falls back to English; a key missing everywhere returns the key itself, so it is
 * visible instead of silently empty (the message tests fail on those).
 */
export function translate(lang, key, vars = {}) {
  const code = normalizeLang(lang);
  let text = lookup(code, key);
  if (text == null && code !== DEFAULT_LANG) text = lookup(DEFAULT_LANG, key);
  if (text == null) return key;
  if (typeof text === 'object' && !Array.isArray(text) && 'other' in text) {
    text = text[pluralOf(code, vars.count ?? 0)] ?? text.other;
  }
  return typeof text === 'string' ? interpolate(text, vars) : text;
}
