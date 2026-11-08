// Same Khmer dates on the server and in browsers without Khmer date data (see the file).
import './khmer-dates';

// Languages the interface is available in. English is the default and the fallback for any
// translation that is genuinely missing.
export const LOCALES = [
  { code: 'en', label: 'EN', name: 'English', intl: 'en-US' },
  { code: 'km', label: 'KH', name: 'ភាសាខ្មែរ', intl: 'km-KH' },
  { code: 'vi', label: 'VN', name: 'Tiếng Việt', intl: 'vi-VN' },
];

export const DEFAULT_LANG = 'en';
const CODES = LOCALES.map((l) => l.code);

/** The saved choice lives in localStorage (the source of truth) and in a cookie of the same
 *  name, so the server can render the first paint in the right language. */
export const LANG_KEY = 'bloodlife-lang';

/** A supported language code, or English for anything else (missing, invalid, tampered). */
export const normalizeLang = (code) => (CODES.includes(code) ? code : DEFAULT_LANG);

export const localeOf = (lang) => LOCALES.find((l) => l.code === normalizeLang(lang));

// The current language for code outside React (date and number helpers in lib/format.js, the
// label getters in lib/inventory.js, …). I18nProvider keeps it in step with the selected language.
// In the browser one variable is enough. On the server many requests render at once, so a shared
// variable would let one visitor's language leak into another's page (and a hydration error);
// there it is kept per request with AsyncLocalStorage, which Next.js provides on the server.
let current = DEFAULT_LANG;
const perRequest = typeof window === 'undefined' && globalThis.AsyncLocalStorage
  ? new globalThis.AsyncLocalStorage() : null;
export const setCurrentLang = (lang) => {
  current = normalizeLang(lang);
  if (perRequest) perRequest.enterWith(current);
};
export const currentLang = () => perRequest?.getStore() ?? current;
export const currentIntlLocale = () => localeOf(currentLang()).intl;
