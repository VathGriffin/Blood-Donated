const crypto = require('crypto');
const jwt = require('jsonwebtoken');

// Regenerated every time the server process starts. Admin login tokens carry it (`run`), so
// an admin who signed in before a restart has to sign in again afterwards, while a plain
// browser refresh (same server run) keeps the session. Donor and hospital-staff tokens are
// deliberately not tied to it. In-memory on purpose: it only makes sense for a single
// server process — run several instances and each would reject the others' admin tokens.
const SERVER_RUN_ID = crypto.randomBytes(16).toString('hex');

// Extra claims to put in a staff member's token.
const sessionClaims = (staff) => (staff.role === 'admin' ? { run: SERVER_RUN_ID } : {});

// jwt.verify plus the admin run check — use this instead of jwt.verify wherever a login
// token is accepted, so no route honours an admin token from a previous server run.
function verifySessionToken(token) {
  const decoded = jwt.verify(token, process.env.JWT_SECRET);
  if (decoded.role === 'admin' && decoded.run !== SERVER_RUN_ID) {
    throw Object.assign(
      new Error('Your admin session ended because the server restarted. Please sign in again.'),
      { name: 'SessionEndedError' }
    );
  }
  return decoded;
}

module.exports = { SERVER_RUN_ID, sessionClaims, verifySessionToken };
