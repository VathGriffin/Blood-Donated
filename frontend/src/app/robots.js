import { SITE_URL } from '@/lib/site-url';

export default function robots() {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      // Private pages: staff dashboards, donor account pages and sign-in screens.
      disallow: ['/dashboard/', '/admin', '/hospital/', '/profile', '/qr-card', '/notification', '/ai-chat',
        '/my-appointments', '/my-requests', '/requests', '/donor-directory'],
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
