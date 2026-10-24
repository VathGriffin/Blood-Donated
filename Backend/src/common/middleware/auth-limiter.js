const rateLimit = require('express-rate-limit');

const isDev = process.env.NODE_ENV !== 'production';

// Stricter limit for credential-guessing-prone endpoints (login/register) —
// scope this to those specific routes, never a whole router, or normal
// authenticated traffic on other routes under the same mount gets throttled too.
// A 15-minute window allowing `max` requests per IP in production (effectively unlimited in
// development); `body` is the JSON sent once the limit is hit.
const createLimiter = (max, body) => rateLimit({ windowMs: 15 * 60 * 1000, max: isDev ? 1000 : max, message: body });

const authLimiter = createLimiter(10, { error: 'Too many login attempts, please try again later.' });

module.exports = { authLimiter, createLimiter };
