process.env.JWT_SECRET = 'test-jwt-secret';
process.env.QR_JWT_SECRET = 'test-qr-jwt-secret';
process.env.NODE_ENV = 'test';

const fs = require('fs');
const path = require('path');
const { MongoMemoryServer } = require('mongodb-memory-server');
const mongoose = require('mongoose');
const { connect } = require('../src/config/database');

// Upload tests write real files into Backend/uploads. Remember what was there before this test
// file started and delete only what it added, so runs don't pile up files (and never touch
// anything that was already in the folder, e.g. real photos from a dev database).
const uploadsDir = path.join(__dirname, '../uploads');
const listUploads = () => (fs.existsSync(uploadsDir) ? fs.readdirSync(uploadsDir) : []);
let uploadsBefore;

let mongod;

beforeAll(async () => {
  uploadsBefore = new Set(listUploads());
  mongod = await MongoMemoryServer.create();
  await connect(mongod.getUri());
});

afterEach(async () => {
  const collections = await mongoose.connection.db.collections();
  for (const collection of collections) await collection.deleteMany({});
});

afterAll(async () => {
  for (const name of listUploads()) {
    if (name !== '.gitkeep' && !uploadsBefore.has(name)) {
      try { fs.unlinkSync(path.join(uploadsDir, name)); } catch { /* already removed */ }
    }
  }
  await mongoose.disconnect();
  await mongod.stop();
});
