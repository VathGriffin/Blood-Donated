import { cookies } from 'next/headers';
import { LANG_KEY, normalizeLang } from './config';
import { translate } from './translate';

/** The visitor's saved language, read on the server from the language cookie. */
export async function serverLang() {
  const jar = await cookies();
  return normalizeLang(jar.get(LANG_KEY)?.value);
}

/**
 * `generateMetadata` for a page whose browser-tab title is titles.<key>, so the title is in the
 * same language as the page. Usage: `export const generateMetadata = pageTitle('about');`
 */
export const pageTitle = (key, extra = {}) => async () => ({ ...extra, title: translate(await serverLang(), `titles.${key}`) });
