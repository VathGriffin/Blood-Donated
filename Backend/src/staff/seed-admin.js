const StaffUser = require('./staff.model');

// Idempotent bootstrap: creates the first admin StaffUser from env vars if none exists yet.
async function seedAdmin() {
  const { ADMIN_EMAIL, ADMIN_PASSWORD_HASH } = process.env;
  if (!ADMIN_EMAIL || !ADMIN_PASSWORD_HASH) return;

  const existingAdmin = await StaffUser.findOne({ role: 'admin' });
  if (existingAdmin) return;

  await StaffUser.create({
    fullName: 'Administrator',
    email: ADMIN_EMAIL.toLowerCase(),
    password: ADMIN_PASSWORD_HASH,
    role: 'admin',
  });
  console.log(`✅ Seeded admin StaffUser (${ADMIN_EMAIL})`);
}

module.exports = seedAdmin;
