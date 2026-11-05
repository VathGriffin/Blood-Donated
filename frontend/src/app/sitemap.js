import { SITE_URL } from '@/lib/site-url';

// Public pages only; account and dashboard pages are left out on purpose.
const PAGES = [
  ['/', 1, 'daily'],
  ['/donate', 0.9, 'monthly'],
  ['/appointments', 0.9, 'monthly'],
  ['/donors', 0.8, 'daily'],
  ['/map', 0.8, 'weekly'],
  ['/assistant', 0.7, 'monthly'],
  ['/about', 0.6, 'monthly'],
  ['/contact', 0.5, 'yearly'],
  ['/login', 0.4, 'yearly'],
  ['/register', 0.4, 'yearly'],
  ['/privacy', 0.2, 'yearly'],
  ['/terms', 0.2, 'yearly'],
];

export default function sitemap() {
  return PAGES.map(([path, priority, changeFrequency]) => ({
    url: `${SITE_URL}${path}`,
    changeFrequency,
    priority,
  }));
}
