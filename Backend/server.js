const dotenv = require('dotenv');
dotenv.config();

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
    if (err.codeName !== 'IndexNotFound') console.error('Index cleanup check failed:', err.message);
  }
}

connect().then(async () => {
  await dropStaleInventoryIndex();
  await seedAdmin().catch((err) => console.error('Admin seed failed:', err.message));
});

app.listen(PORT, () => console.log(`🚀 BloodLife API v2.0 running at http://localhost:${PORT}`));
