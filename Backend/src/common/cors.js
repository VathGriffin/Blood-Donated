// Which browser origins may call this API.
//
// FRONTEND_URL may hold several origins separated by commas. An entry may contain "*", which
// matches exactly one hostname label (letters, digits, hyphens) — that is what Vercel's per-deploy
// preview URLs need, e.g.  https://blood-donated-*-yourteam.vercel.app  — while still refusing
// look-alikes such as https://blood-donated-x.evil.com or a different scheme.
const DEV_ORIGINS = ['http://localhost:3000', 'http://localhost:3002', 'http://localhost:3003'];

const escapeRegex = (text) => text.replace(/[.+?^${}()|[\]\\]/g, '\\$&');

function toMatcher(entry) {
  const cleaned = entry.trim().replace(/\/+$/, ''); // a trailing slash is a common paste mistake
  if (!cleaned.includes('*')) return (origin) => origin === cleaned;
  const pattern = new RegExp(`^${cleaned.split('*').map(escapeRegex).join('[a-z0-9-]+')}$`, 'i');
  return (origin) => pattern.test(origin);
}

function buildOriginChecker(frontendUrl = '') {
  const configured = frontendUrl.split(',').map((s) => s.trim()).filter(Boolean);
  const matchers = [...DEV_ORIGINS, ...configured].map(toMatcher);
  // No Origin header = not a browser cross-site request (curl, server-to-server, same-origin): allow.
  return (origin) => !origin || matchers.some((matches) => matches(origin));
}

// Adapter for the `cors` package's function form.
const corsOrigin = (frontendUrl) => {
  const isAllowed = buildOriginChecker(frontendUrl);
  return (origin, callback) => callback(null, isAllowed(origin));
};

module.exports = { buildOriginChecker, corsOrigin };
