const rateLimit = require('express-rate-limit');

const isDev = process.env.NODE_ENV !== 'production';

// Stricter limit for credential-guessing-prone endpoints (login/register) —
// scope this to those specific routes, never a whole router, or normal
// authenticated traffic on other routes under the same mount gets throttled too.
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: isDev ? 1000 : 10,
  message: { error: 'Too many login attempts, please try again later.' },
});

module.exports = { authLimiter };
