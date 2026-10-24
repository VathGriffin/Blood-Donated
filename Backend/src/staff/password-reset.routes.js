const express = require('express');
const crypto  = require('crypto');
const bcrypt  = require('bcryptjs');
const router  = express.Router();
const StaffUser = require('./staff.model');
const PasswordReset = require('./password-reset.model');
const { mailStatus, sendMail, appUrl } = require('../common/mailer');
const { sendError } = require('../common/middleware/error-handler');
const { createLimiter } = require('../common/middleware/auth-limiter');
const { newPasswordError } = require('./password-rules');

// Self-service password reset for hospital staff (the hospital portal's "Forgot password?").
// Admin accounts are deliberately not resettable by email.
const TOKEN_TTL_MINUTES = 30;
const RESEND_COOLDOWN_MS = 60 * 1000;
const resetLimiter = createLimiter(5, { message: 'Too many password reset attempts. Please try again later.' });

const GENERIC_SENT = 'If an account with that email exists, we have sent a link to reset its password. The link expires in 30 minutes.';
const INVALID_LINK = 'This reset link is invalid or has expired. Please request a new one.';
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const hashToken = (token) => crypto.createHash('sha256').update(token).digest('hex');
const escapeHtml = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

const notConfigured = (missing) => ({
  message: 'Password reset by email is not set up on this server yet, so no email can be sent. '
    + 'Please contact a BloodLife administrator to reset your password.',
  missing,
});

// Creates the link and emails it. Runs after the response is sent, so the reply (and its timing)
// is the same whether or not the address belongs to an account. Failures are logged, never shown.
async function issueResetLink(email) {
  const staff = await StaffUser.findOne({ email, role: 'hospital_staff' }).select('_id email fullName').lean();
  if (!staff) return;

  const recent = await PasswordReset.findOne({ staff: staff._id }).sort({ createdAt: -1 }).lean();
  if (recent && Date.now() - new Date(recent.createdAt).getTime() < RESEND_COOLDOWN_MS) return; // no mail-bombing

  const token = crypto.randomBytes(32).toString('base64url');
  await PasswordReset.deleteMany({ staff: staff._id }); // only the newest link works
  await PasswordReset.create({
    staff: staff._id,
    tokenHash: hashToken(token),
    expiresAt: new Date(Date.now() + TOKEN_TTL_MINUTES * 60 * 1000),
  });

  // The token travels in the URL fragment: browsers never send it to a server or in a Referer.
  const link = `${appUrl()}/hospital/reset-password#token=${token}`;
  const name = staff.fullName || 'there';
  await sendMail({
    to: staff.email,
    subject: 'Reset your BloodLife hospital portal password',
    text: `Hi ${name},\n\nSomeone asked to reset the password for your BloodLife hospital portal account. `
      + `To choose a new password, open this link within ${TOKEN_TTL_MINUTES} minutes:\n\n${link}\n\n`
      + 'The link works once. If you did not ask for this, ignore this email — your password stays the same.\n\nBloodLife AI',
    html: `<p>Hi ${escapeHtml(name)},</p>`
      + '<p>Someone asked to reset the password for your BloodLife hospital portal account.</p>'
      + `<p><a href="${escapeHtml(link)}" style="display:inline-block;padding:12px 22px;background:#1565c0;color:#fff;border-radius:8px;text-decoration:none;font-weight:600">Choose a new password</a></p>`
      + `<p>This link expires in ${TOKEN_TTL_MINUTES} minutes and works once. If you did not ask for this, ignore this email — your password stays the same.</p>`
      + '<p>BloodLife AI</p>',
  });
}

// GET whether reset emails can be sent, and if not, which settings are missing.
router.get('/status', (req, res) => {
  const { configured, missing } = mailStatus();
  res.json(configured ? { available: true } : { available: false, ...notConfigured(missing) });
});

// POST { email } — always the same answer for any well-formed address.
router.post('/request', resetLimiter, async (req, res) => {
  const email = typeof req.body.email === 'string' ? req.body.email.trim().toLowerCase() : '';
  if (!EMAIL_RE.test(email)) return res.status(400).json({ message: 'Please enter a valid email address.' });

  const { configured, missing } = mailStatus();
  if (!configured) {
    console.warn(`⚠️  Password reset requested but email is not configured (missing ${missing.join(', ')}).`);
    return res.status(503).json(notConfigured(missing));
  }

  res.json({ message: GENERIC_SENT });
  issueResetLink(email).catch((err) => console.error('Password reset email failed:', err.message));
});

// POST { token } — lets the reset page say up front that a link is dead. Doesn't use it up.
// The token goes in the body, not the query string, so request logs never record it.
router.post('/verify', resetLimiter, async (req, res) => {
  try {
    const token = typeof req.body.token === 'string' ? req.body.token : '';
    const found = token && await PasswordReset.exists({ tokenHash: hashToken(token), expiresAt: { $gt: new Date() } });
    res.json({ valid: !!found });
  } catch (err) {
    sendError(res, err, req);
  }
});

// POST { token, password } — sets the new password and spends the link.
router.post('/reset', resetLimiter, async (req, res) => {
  const { token, password } = req.body;
  if (!token || !password) return res.status(400).json({ message: 'Token and new password are required.' });
  const invalid = newPasswordError(password);
  if (invalid) return res.status(400).json({ message: invalid });
  try {
    // Atomic find-and-delete: two simultaneous submissions can't both use the same link.
    const reset = await PasswordReset.findOneAndDelete({ tokenHash: hashToken(token), expiresAt: { $gt: new Date() } }).lean();
    if (!reset) return res.status(400).json({ message: INVALID_LINK });

    const staff = await StaffUser.findOne({ _id: reset.staff, role: 'hospital_staff' });
    if (!staff) return res.status(400).json({ message: INVALID_LINK });
    staff.password = await bcrypt.hash(password, 10);
    await staff.save();
    await PasswordReset.deleteMany({ staff: staff._id });

    res.json({ message: 'Your password has been reset. You can now sign in with your new password.' });
    sendMail({
      to: staff.email,
      subject: 'Your BloodLife hospital portal password was changed',
      text: `Hi ${staff.fullName || 'there'},\n\nThe password for your BloodLife hospital portal account was just changed using a reset link. `
        + 'If this was not you, contact a BloodLife administrator straight away.\n\nBloodLife AI',
    }).catch((err) => console.error('Password-changed notice failed:', err.message));
  } catch (err) {
    sendError(res, err, req);
  }
});

module.exports = router;
