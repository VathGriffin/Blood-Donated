const request = require('supertest');
const app = require('../src/app');
const { createAdmin, createHospitalStaff, createHospital } = require('./helpers');

describe('chatbot status', () => {
  test('requires admin auth', async () => {
    const res = await request(app).get('/api/chat/status');
    expect(res.status).toBe(401);
  });

  test('reports not configured when GEMINI_API_KEY is unset', async () => {
    const { token } = await createAdmin();
    const res = await request(app).get('/api/chat/status').set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.configured).toBe(false);
    expect(res.body.model).toBeDefined();
  });

  test('hospital_staff cannot view AI status', async () => {
    const { token } = await createHospitalStaff((await createHospital())._id);
    const res = await request(app).get('/api/chat/status').set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(403);
  });
});

describe('chatbot endpoint', () => {
  test('rejects a request with no message', async () => {
    const res = await request(app).post('/api/chat').send({});
    expect(res.status).toBe(400);
  });

  test('rejects an empty message', async () => {
    const res = await request(app).post('/api/chat').send({ message: '', history: [] });
    expect(res.status).toBe(400);
  });

  test('reports unconfigured when no GEMINI_API_KEY is set', async () => {
    // The test environment never sets GEMINI_API_KEY (see tests/setup.js),
    // so the route should degrade gracefully instead of crashing.
    const res = await request(app)
      .post('/api/chat')
      .send({ message: 'Hello', history: [] });
    expect(res.status).toBe(503);
    expect(res.body.configured).toBe(false);
  });
});
