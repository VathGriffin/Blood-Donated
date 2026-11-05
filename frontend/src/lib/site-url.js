// Public address of the website, used for the sitemap and link previews.
// Vercel sets VERCEL_PROJECT_PRODUCTION_URL automatically; NEXT_PUBLIC_SITE_URL overrides it.
const raw =
  process.env.NEXT_PUBLIC_SITE_URL ||
  (process.env.VERCEL_PROJECT_PRODUCTION_URL && `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`) ||
  'http://localhost:3000';

export const SITE_URL = raw.replace(/\/+$/, '');
