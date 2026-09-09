process.env.JWT_SECRET = 'test-jwt-secret';
process.env.QR_JWT_SECRET = 'test-qr-jwt-secret';
process.env.NODE_ENV = 'test';

const { MongoMemoryServer } = require('mongodb-memory-server');
const mongoose = require('mongoose');
const { connect } = require('../src/config/database');

let mongod;

beforeAll(async () => {
  mongod = await MongoMemoryServer.create();
  await connect(mongod.getUri());
});

afterEach(async () => {
  const collections = await mongoose.connection.db.collections();
  for (const collection of collections) await collection.deleteMany({});
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongod.stop();
});
