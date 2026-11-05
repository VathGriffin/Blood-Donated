// A production build without NEXT_PUBLIC_API_URL silently points the site at http://localhost:3001 —
// the visitor's own computer — so every API call fails. Say so loudly in the build log.
if (process.env.NODE_ENV === 'production' && !process.env.NEXT_PUBLIC_API_URL) {
  console.warn(
    '\n\u26a0\ufe0f  NEXT_PUBLIC_API_URL is not set for this production build.\n' +
    '   The site will call http://localhost:3001 and nothing will load.\n' +
    '   Set it (e.g. in Vercel > Project Settings > Environment Variables) to your deployed backend URL, then redeploy.\n'
  );
}

/** @type {import('next').NextConfig} */
const nextConfig = {
  poweredByHeader: false,
  // Basic browser security headers. Camera is allowed for the hospital QR scanner and
  // location for the hospital map / appointment booking; both only for this site.
  async headers() {
    return [{
      source: '/:path*',
      headers: [
        { key: 'X-Content-Type-Options', value: 'nosniff' },
        { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
        { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
        { key: 'Permissions-Policy', value: 'camera=(self), geolocation=(self), microphone=(), payment=()' },
      ],
    }];
  },
  experimental: {
    optimizePackageImports: [
      '@mui/material',
      '@mui/icons-material',
      '@mui/system',
      'recharts',
    ],
  },
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'images.unsplash.com' },
      { protocol: 'https', hostname: 'lh3.googleusercontent.com' },
      { protocol: 'http',  hostname: 'localhost' },
    ],
  },
};

module.exports = nextConfig;
