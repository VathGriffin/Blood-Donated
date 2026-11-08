import API_BASE from '@/lib/config';
import { currentLang, DEFAULT_LANG } from '@/i18n/config';
import { translate } from '@/i18n/translate';
import SERVER from '@/i18n/messages/server';

// The API always answers in English. Look its text up in i18n/messages/server.js (by the English
// value) so the person sees it in their language. Quotes and spacing are ignored when comparing.
const norm = (s) => String(s).replace(/[’‘]/g, "'").replace(/\s+/g, ' ').trim();
const escape = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const EXACT = new Map();
const PATTERNS = [
  // Texts that embed a status or a sentence the frontend can't translate word for word.
  { re: /^This request has already been \w+\.$/i, key: 'requestAlreadyDone', names: [] },
  { re: /^Cannot approve: /i, key: 'cannotApprove', names: [] },
];
for (const [key, text] of Object.entries(SERVER.en)) {
  const names = [...text.matchAll(/\{(\w+)\}/g)].map((m) => m[1]);
  if (!names.length) { EXACT.set(norm(text), key); continue; }
  const source = norm(text).split(/\{\w+\}/).map(escape).join('(.+?)');
  PATTERNS.push({ re: new RegExp(`^${source}$`), key, names });
}

/**
 * `text` (an English message from the API) in `lang`. Unknown texts come back unchanged in
 * English, or as `fallback` in other languages, so the page never mixes two languages.
 */
export function translateServerMessage(text, lang = currentLang(), fallback) {
  if (!text) return fallback ?? text;
  const clean = norm(text);
  const key = EXACT.get(clean);
  if (key) return translate(lang, `server.${key}`);
  for (const p of PATTERNS) {
    const m = clean.match(p.re);
    if (m) return translate(lang, `server.${p.key}`, Object.fromEntries(p.names.map((n, i) => [n, m[i + 1]])));
  }
  return lang === DEFAULT_LANG || !fallback ? text : fallback;
}

// Turns an axios error into text for the user. With no HTTP response at all, the request never
// reached the API (server not running, wrong NEXT_PUBLIC_API_URL, or blocked by CORS), so say so
// instead of a generic "failed" that sends people hunting for a wrong password.
export function apiErrorMessage(err, fallback) {
  const lang = currentLang();
  const data = err?.response?.data;
  if (err?.response) {
    const text = data?.message || data?.error || data?.errors?.[0]?.msg;
    return text ? translateServerMessage(text, lang, fallback) : fallback;
  }
  return translate(lang, 'server.unreachable', { url: API_BASE });
}
