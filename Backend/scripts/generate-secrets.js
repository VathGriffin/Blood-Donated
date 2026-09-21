#!/usr/bin/env node
// Prints ready-to-paste values for the API's secret settings:
//   node scripts/generate-secrets.js
// It asks for the admin password (hidden as you type) and prints a bcrypt hash of it — the
// password itself is never stored or printed. Paste the output into your host's environment
// variables (or Backend/.env). Run it again for new values; never commit the output.
const crypto = require('crypto');
const readline = require('readline');
const bcrypt = require('bcryptjs');

function askHidden(question) {
  return new Promise((resolve) => {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout, terminal: process.stdin.isTTY });
    if (process.stdin.isTTY) {
      rl._writeToOutput = (text) => { if (text.includes(question)) rl.output.write(text); }; // hide the typed characters
    }
    rl.question(question, (answer) => { rl.close(); if (process.stdin.isTTY) process.stdout.write('\n'); resolve(answer); });
  });
}

(async () => {
  const password = await askHidden('Admin password to hash (min 8 characters): ');
  if (password.length < 8) {
    console.error('Use at least 8 characters.');
    process.exit(1);
  }
  const random = () => crypto.randomBytes(48).toString('base64url');
  console.log('\n# Paste these into your environment variables:\n');
  console.log(`JWT_SECRET=${random()}`);
  console.log(`QR_JWT_SECRET=${random()}`);
  console.log(`ADMIN_PASSWORD_HASH=${bcrypt.hashSync(password, 10)}`);
  console.log('\n# Also set ADMIN_EMAIL (the admin login), MONGO_URI and FRONTEND_URL.\n');
})();
