import MESSAGES from './messages';
import { DEFAULT_LANG, normalizeLang } from './config';

// All of one language's texts, by namespace, with English filled in wherever that language has
// no text of its own. Browsers download only this (app/i18n/[lang]/route.js) instead of every
// language at once; the server and the tests read it here directly.

const isPlainObject = (v) => v != null && typeof v === 'object' && !Array.isArray(v);

const withFallback = (own, fallback) => {
  if (!isPlainObject(own) || !isPlainObject(fallback)) return own ?? fallback;
  const out = { ...fallback };
  for (const [k, v] of Object.entries(own)) out[k] = withFallback(v, fallback[k]);
  return out;
};

const cache = {};

export function catalogFor(lang) {
  const code = normalizeLang(lang);
  if (!cache[code]) {
    cache[code] = Object.fromEntries(Object.entries(MESSAGES).map(([ns, langs]) => [
      ns,
      code === DEFAULT_LANG ? langs[DEFAULT_LANG] : withFallback(langs[code], langs[DEFAULT_LANG]),
    ]));
  }
  return cache[code];
}
