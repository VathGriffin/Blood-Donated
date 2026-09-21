const path = require('path');
const dotenv = require('dotenv');
// Backend/.env (see README). Resolved from this file, so it works from any working directory.
// On a host there is no file — the dashboard's variables are already in process.env, and dotenv never overrides those.
dotenv.config({ path: path.join(__dirname, '.env') });

const mongoose = require('mongoose');
const app = require('./src/app');
const { connect } = require('./src/config/database');
const seedAdmin = require('./src/staff/seed-admin');
const Inventory = require('./src/inventory/inventory.model');

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

connect().then(async () => {
  // connect() swallows a failed connection so the API can still serve /api/chat;
  // running the migration/seed against a dead connection would only add noise.
  if (mongoose.connection.readyState !== 1) return;
  await dropStaleInventoryIndex();
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

// An unhandled rejection outside a request (e.g. a background job) would otherwise
// take the process down with a bare stack trace; log it so the cause is visible.
process.on('unhandledRejection', (reason) => {
  console.error('[unhandledRejection]', reason instanceof Error ? reason.stack : reason);
});
