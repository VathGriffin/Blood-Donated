'use client';
import { Fragment, Suspense, createContext, use, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import GlobalStyles from '@mui/material/GlobalStyles';
import { LANG_KEY, localeOf, normalizeLang, setCurrentLang } from './config';
import { hasCatalog, translate } from './translate';
import { formatRelative } from './format';
import { loadCatalog } from './load-catalog';

// Runs `fn` once `lang`'s texts are ready: right away when they already are, so switching to a
// language used before is instant.
const whenLoaded = (lang, fn) => (hasCatalog(lang) ? fn() : loadCatalog(lang).then(fn));

const I18nContext = createContext(null);

const saveLang = (lang) => {
  try { localStorage.setItem(LANG_KEY, lang); } catch { /* storage blocked: the cookie still keeps it */ }
  document.cookie = `${LANG_KEY}=${lang}; path=/; max-age=31536000; SameSite=Lax`;
  document.documentElement.lang = lang;
};

/**
 * The selected interface language for the whole app. `initialLang` comes from the cookie the
 * server read (app/layout.jsx), so the first paint is already in the saved language. The choice
 * is kept in localStorage and that cookie, so it survives navigation, refresh, signing in or out
 * and browser restarts; it is never reset on route changes.
 */
export function I18nProvider({ initialLang, children }) {
  const [lang, setLangState] = useState(() => normalizeLang(initialLang));
  setCurrentLang(lang); // for date/number helpers outside React, before children render

  // Visitors whose choice is in localStorage but not (yet) in the cookie, e.g. a cleared cookie.
  useEffect(() => {
    let stored = null;
    try { stored = localStorage.getItem(LANG_KEY); } catch { /* storage blocked */ }
    const wanted = stored ? normalizeLang(stored) : lang;
    saveLang(wanted);
    if (wanted === lang) return;
    // The server rendered this page in another language (the cookie was missing or different;
    // its <html lang> says which). Switching here, while React may still be hydrating parts of the
    // page, would make that HTML disagree with the browser's render. Reload once instead, now that
    // the cookie is fixed, so the server renders the right language. Without server HTML (or with
    // cookies blocked) there is nothing to clash with, so switch in place.
    const serverRendered = document.documentElement.getAttribute('data-lang-ssr') === lang;
    let reloaded = false;
    try { reloaded = sessionStorage.getItem('bloodlife-lang-reload') === wanted; } catch { /* storage blocked */ }
    if (serverRendered && !reloaded && document.cookie.includes(`${LANG_KEY}=${wanted}`)) {
      try { sessionStorage.setItem('bloodlife-lang-reload', wanted); } catch { /* storage blocked */ }
      window.location.reload();
      return;
    }
    whenLoaded(wanted, () => setLangState(wanted));
    // Runs once on mount; later changes go through setLang.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Another tab changed the language.
  useEffect(() => {
    const onStorage = (e) => {
      if (e.key !== LANG_KEY || !e.newValue) return;
      const code = normalizeLang(e.newValue);
      whenLoaded(code, () => setLangState(code));
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  const setLang = useCallback((next) => {
    const code = normalizeLang(next);
    saveLang(code);
    // Download the new language first, so the page switches in one step instead of blanking.
    whenLoaded(code, () => setLangState(code));
  }, []);

  const value = useMemo(() => {
    const intl = localeOf(lang).intl;
    return {
      lang,
      intl,
      setLang,
      t: (key, vars) => translate(lang, key, vars),
      // Text with React elements inside it: rich('layout.footer.madeBy', { heart: <Icon /> }).
      // Plain values in `vars` are filled in first; `nodes` replace the remaining {placeholders}.
      rich: (key, nodes, vars) => translate(lang, key, vars).split(/(\{\w+\})/).map((part, i) => {
        const name = part.match(/^\{(\w+)\}$/)?.[1];
        return name && name in nodes ? <Fragment key={i}>{nodes[name]}</Fragment> : part;
      }),
      formatRelative: (date) => formatRelative(date, intl),
      formatNumber: (n, opts) => (n == null || Number.isNaN(Number(n)) ? '—' : Number(n).toLocaleString(intl, opts)),
    };
  }, [lang, setLang]);

  return (
    <I18nContext.Provider value={value}>
      {/* Khmer script needs taller lines, and the tight negative letter spacing used for Latin
          headings breaks its stacked vowels and subscripts. */}
      <GlobalStyles styles={{
        'html[lang="km"] body': { lineHeight: 1.75 },
        'html[lang="km"] :is(h1,h2,h3,h4,h5,h6,.MuiTypography-root)': { letterSpacing: '0 !important', lineHeight: 1.6 },
      }} />
      {/* On the first load the browser downloads this language's texts (preloaded by
          app/layout.jsx). Until then the server's HTML stays on screen. */}
      <Suspense fallback={null}>
        <CatalogGate lang={lang}>{children}</CatalogGate>
      </Suspense>
    </I18nContext.Provider>
  );
}

function CatalogGate({ lang, children }) {
  use(loadCatalog(lang));
  return children;
}

/** { lang, intl, setLang, t, rich, formatNumber, formatRelative } for the selected language. */
export function useI18n() {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error('useI18n must be used inside <I18nProvider>');
  return ctx;
}

/** Shorthand when only the translate function is needed. */
export const useT = () => useI18n().t;
