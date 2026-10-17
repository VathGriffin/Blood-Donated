const nodemailer = require('nodemailer');

// Outgoing email over SMTP, configured only through environment variables:
//   SMTP_HOST, SMTP_USER, SMTP_PASS, MAIL_FROM   required
//   SMTP_PORT (default 587), SMTP_SECURE ("true" for port 465 / implicit TLS)   optional
//   APP_URL   public frontend URL used in emailed links; required in production
// Nothing pretends to send: when something is missing, mailStatus() names it and callers say so.
const REQUIRED = ['SMTP_HOST', 'SMTP_USER', 'SMTP_PASS', 'MAIL_FROM'];

const isSet = (name) => typeof process.env[name] === 'string' && process.env[name].trim() !== '';

// Base URL for links in emails. APP_URL wins; otherwise the first concrete FRONTEND_URL entry
// (wildcard preview patterns can't be linked to); in development, the local frontend.
function appUrl() {
  if (isSet('APP_URL')) return process.env.APP_URL.trim().replace(/\/+$/, '');
  const concrete = (process.env.FRONTEND_URL || '').split(',').map((s) => s.trim()).find((s) => s && !s.includes('*'));
  if (concrete) return concrete.replace(/\/+$/, '');
  return process.env.NODE_ENV === 'production' ? null : 'http://localhost:3000';
}

function mailStatus() {
  const missing = REQUIRED.filter((name) => !isSet(name));
  if (!appUrl()) missing.push('APP_URL');
  return { configured: missing.length === 0, missing };
}

let transport = null;
let transportKey = null;

function getTransport() {
  const port = Number(process.env.SMTP_PORT) || 587;
  const key = [process.env.SMTP_HOST, port, process.env.SMTP_USER, process.env.SMTP_SECURE].join('|');
  if (!transport || transportKey !== key) {
    transport = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port,
      secure: process.env.SMTP_SECURE === 'true' || port === 465,
      auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
      // Fail fast rather than holding a request open on an unreachable server.
      connectionTimeout: 10_000,
      greetingTimeout: 10_000,
      socketTimeout: 20_000,
    });
    transportKey = key;
  }
  return transport;
}

async function sendMail({ to, subject, text, html }) {
  const { configured, missing } = mailStatus();
  if (!configured) throw new Error(`Email is not configured (missing ${missing.join(', ')})`);
  return getTransport().sendMail({ from: process.env.MAIL_FROM, to, subject, text, html });
}

module.exports = { mailStatus, sendMail, appUrl };
