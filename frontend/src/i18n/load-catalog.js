import { normalizeLang } from './config';
import { addCatalog, hasCatalog } from './translate';

// Where the browser downloads one language's texts (app/i18n/[lang]/route.js). The version
// changes whenever a translation changes (next.config.js), so the file can be cached for good.
export const catalogUrl = (lang) =>
  `/i18n/${normalizeLang(lang)}?v=${process.env.NEXT_PUBLIC_I18N_VERSION || 'dev'}`;

const pending = {};

const download = async (lang) => {
  // A dropped connection gets a couple more tries before giving up.
  for (let attempt = 0; ; attempt++) {
    try {
      const res = await fetch(catalogUrl(lang));
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      addCatalog(lang, await res.json());
      return;
    } catch (err) {
      if (attempt >= 2) {
        // The page still works: missing texts show their key until the next load.
        console.error(`Could not load the "${lang}" translations:`, err);
        return;
      }
      await new Promise((r) => setTimeout(r, 500 * (attempt + 1)));
    }
  }
};

/**
 * A promise that resolves once `lang`'s texts are ready. Already-loaded languages give a promise
 * that is already marked fulfilled, so React's `use()` reads it without suspending.
 */
export function loadCatalog(lang) {
  const code = normalizeLang(lang);
  if (!pending[code]) {
    if (hasCatalog(code)) {
      pending[code] = Object.assign(Promise.resolve(), { status: 'fulfilled', value: undefined });
    } else {
      // Marked fulfilled once downloaded, before anyone waiting on it runs (this callback is
      // attached first). Otherwise use() would suspend on it once more after switching to this
      // language, and Suspense would blank the whole page for a moment.
      const p = download(code);
      p.then(() => Object.assign(p, { status: 'fulfilled', value: undefined }));
      pending[code] = p;
    }
  }
  return pending[code];
}
