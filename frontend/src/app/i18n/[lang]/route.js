import { LOCALES } from '@/i18n/config';
import { catalogFor } from '@/i18n/catalog';

// One language's interface texts as JSON (/i18n/en, /i18n/km, /i18n/vi), built once at build
// time. Browsers load only the language in use instead of every language bundled into the page
// code. The URL carries a version (i18n/load-catalog.js), so browsers may keep it for a year.
export const dynamic = 'force-static';
export const dynamicParams = false;

export const generateStaticParams = () => LOCALES.map(({ code }) => ({ lang: code }));

export async function GET(_req, { params }) {
  const { lang } = await params;
  return Response.json(catalogFor(lang), {
    headers: {
      'Cache-Control': process.env.NODE_ENV === 'production'
        ? 'public, max-age=31536000, immutable'
        : 'no-store',
    },
  });
}
