// Locale-aware formatting that works the same in English, Khmer and Vietnamese, using the
// browser's built-in Intl data (no extra libraries).

const UNITS = [
  ['year', 365 * 86400],
  ['month', 30 * 86400],
  ['week', 7 * 86400],
  ['day', 86400],
  ['hour', 3600],
  ['minute', 60],
];

import { LOCALES } from './config';
import { translate } from './translate';

const cache = {};
const rtf = (intl) => (cache[intl] ||= new Intl.RelativeTimeFormat(intl, { numeric: 'auto' }));

// Chromium browsers ship without Khmer relative-time data and silently answer in English, while
// the server answers in Khmer. Khmer therefore always uses common.relative.* (same text on both
// sides); other languages use the browser's Intl when it has the language.
const supported = {};
const browserHas = (intl) => !intl.startsWith('km') && (supported[intl] ??= Intl.RelativeTimeFormat.supportedLocalesOf([intl]).length > 0
  && new Intl.RelativeTimeFormat(intl).resolvedOptions().locale.split('-')[0] === intl.split('-')[0]);
const own = (intl, value, unit) => {
  const lang = LOCALES.find((l) => l.intl === intl)?.code || 'en';
  if (value === 0) return translate(lang, 'common.relative.now');
  const count = Math.abs(value);
  return translate(lang, `common.relative.${value < 0 ? 'past' : 'future'}`, { amount: translate(lang, `common.relative.units.${unit}`, { count }) });
};
const format = (intl, value, unit) => (browserHas(intl) ? rtf(intl).format(value, unit) : own(intl, value, unit));

/** "3 weeks ago" / "in 2 days" (or the same in Khmer or Vietnamese); '' for a missing or invalid date. */
export function formatRelative(date, intl, now = Date.now()) {
  const t = new Date(date).getTime();
  if (!date || Number.isNaN(t)) return '';
  const seconds = Math.round((t - now) / 1000);
  for (const [unit, size] of UNITS) {
    if (Math.abs(seconds) >= size) return format(intl, Math.round(seconds / size), unit);
  }
  return format(intl, 0, 'second'); // "now"
}
