const path = require('path');
const dotenv = require('dotenv');
// Backend/.env (see README). Resolved from this file, so it works from any working directory.
// On a host there is no file — the dashboard's variables are already in process.env, and dotenv never overrides those.
dotenv.config({ path: path.join(__dirname, '.env') });

const { checkEnv, connect } = require('./src/config/database');
const { missing, warnings } = checkEnv();
warnings.forEach((w) => console.warn(`⚠️  ${w}`));
if (missing.length) {
  console.error(`❌ Missing required environment variable(s): ${missing.join(', ')}. Set them in your host's dashboard (see Deployment in README.md).`);
  process.exit(1);
}

const mongoose = require('mongoose');
const app = require('./src/app');
const seedAdmin = require('./src/staff/seed-admin');
const Inventory = require('./src/inventory/inventory.model');
const { linkUnassignedRequests } = require('./src/requests/link-hospital');

const PORT = process.env.PORT || 3001;

// Migration: the inventory collection used to have a standalone unique index on
// bloodType alone (pre-hospital-scoping). That's now a compound {hospital,bloodType}
// index, but Mongoose's autoIndex only adds missing indexes — it never drops stale
// ones — so the old index would silently block per-hospital inventory rows on any
// database created before this change. Dropping it is a no-op if it's already gone.
async function dropStaleInventoryIndex() {
  try {
    await Inventory.collection.dropIndex('bloodType_1');
    console.log('🔧 Dropped stale bloodType_1 index on inventory collection');
  } catch (err) {
    // A brand-new database has no inventory collection yet (NamespaceNotFound) — nothing to drop.
    if (!['IndexNotFound', 'NamespaceNotFound'].includes(err.codeName)) console.error('Index cleanup check failed:', err.message);
  }
}

// Older builds seeded the central pool with made-up unit counts (A+ 45, A- 12, …). Rows nobody
// has edited since (updatedBy is still 'system') are reset to 0 so only recorded stock is shown.
const OLD_SEED_UNITS = { 'A+': 45, 'A-': 12, 'B+': 28, 'B-': 8, 'AB+': 62, 'AB-': 18, 'O+': 74, 'O-': 22 };
async function clearSeededInventory() {
  try {
    const { modifiedCount } = await Inventory.updateMany(
      { hospital: null, updatedBy: 'system', $or: Object.entries(OLD_SEED_UNITS).map(([bloodType, units]) => ({ bloodType, units })) },
      { units: 0 }
    );
    if (modifiedCount) console.log(`🔧 Reset ${modifiedCount} seeded inventory rows to 0 units`);
  } catch (err) {
    console.error('Seeded inventory cleanup failed:', err.message);
  }
}

// Kept so a shutdown can wait for these startup tasks instead of closing the connection under them.
const startup = connect().then(async () => {
  // connect() swallows a failed connection so the API can still serve /api/chat;
  // running the migration/seed against a dead connection would only add noise.
  if (mongoose.connection.readyState !== 1) return;
  await dropStaleInventoryIndex();
  await clearSeededInventory();
  // Requests filed before they were linked to a hospital never reached that hospital's dashboard.
  await linkUnassignedRequests()
    .then((n) => { if (n) console.log(`🔧 Linked ${n} blood request(s) to their hospital`); })
    .catch((err) => console.error('Linking blood requests to hospitals failed:', err.message));
  await seedAdmin().catch((err) => console.error('Admin seed failed:', err.message));
});

// Express 5 also invokes this callback with the error when listen fails, so skip the banner then
const server = app.listen(PORT, (err) => {
  if (!err) console.log(`🚀 BloodLife API v2.0 running at http://localhost:${PORT}`);
});

server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`❌ Port ${PORT} is already in use. Stop the other process or set a different PORT in Backend/.env.`);
  } else {
    console.error('❌ Server failed to start:', err.message);
  }
  process.exit(1);
});

// Hosts stop the old instance with SIGTERM on every deploy/restart: finish in-flight requests and
// close the database connection instead of dropping them mid-way. Forced exit after 10 s.
const shutdown = (signal) => {
  console.log(`${signal} received — shutting down`);
  setTimeout(() => process.exit(1), 10_000).unref();
  server.close(() => startup.finally(() => mongoose.connection.close()).finally(() => process.exit(0)));
};
['SIGTERM', 'SIGINT'].forEach((signal) => process.once(signal, () => shutdown(signal)));

// An unhandled rejection outside a request (e.g. a background job) would otherwise
// take the process down with a bare stack trace; log it so the cause is visible.
process.on('unhandledRejection', (reason) => {
  console.error('[unhandledRejection]', reason instanceof Error ? reason.stack : reason);
});
