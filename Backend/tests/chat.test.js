const request = require('supertest');
const app = require('../src/app');

describe('chatbot endpoint', () => {
  test('rejects a request with no messages array', async () => {
    const res = await request(app).post('/api/chat').send({});
    expect(res.status).toBe(400);
  });

  test('rejects an empty messages array', async () => {
    const res = await request(app).post('/api/chat').send({ messages: [] });
    expect(res.status).toBe(400);
  });

  test('reports unconfigured when no ANTHROPIC_API_KEY is set', async () => {
    // The test environment never sets ANTHROPIC_API_KEY (see tests/setup.js),
    // so the route should degrade gracefully instead of crashing.
    const res = await request(app)
      .post('/api/chat')
      .send({ messages: [{ role: 'user', content: 'Hello' }] });
    expect(res.status).toBe(503);
    expect(res.body.configured).toBe(false);
  });
});
