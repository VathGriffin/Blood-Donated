const request = require('supertest');
const app = require('../src/app');
const { createAdmin, signDonor } = require('./helpers');

const DONOR_ID = '666666666666666666666666';
const donorToken = signDonor({ _id: DONOR_ID, id: DONOR_ID, email: 'sok.dara@test.com', fullName: 'Sok Dara' });

describe('user <-> admin messaging', () => {
  test('a logged-in donor can send and read their own messages', async () => {
    const sent = await request(app)
      .post('/api/messages')
      .set('Authorization', `Bearer ${donorToken}`)
      .send({ content: 'Hello, I have a question.' });
    expect(sent.status).toBe(201);
    expect(sent.body.sender).toBe('user');

    const mine = await request(app).get('/api/messages/mine').set('Authorization', `Bearer ${donorToken}`);
    expect(mine.status).toBe(200);
    expect(mine.body.length).toBe(1);
  });

  test('sending requires being logged in as a donor', async () => {
    const res = await request(app).post('/api/messages').send({ content: 'Hi' });
    expect(res.status).toBe(401);
  });

  test('empty message content is rejected', async () => {
    const res = await request(app)
      .post('/api/messages')
      .set('Authorization', `Bearer ${donorToken}`)
      .send({ content: '   ' });
    expect(res.status).toBe(400);
  });

  test('admin can see conversations and reply', async () => {
    await request(app)
      .post('/api/messages')
      .set('Authorization', `Bearer ${donorToken}`)
      .send({ content: 'Need help with my appointment.' });

    const { token: adminToken } = await createAdmin();
    const conversations = await request(app)
      .get('/api/messages/conversations')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(conversations.status).toBe(200);
    expect(conversations.body.length).toBe(1);

    const reply = await request(app)
      .post(`/api/messages/reply/${DONOR_ID}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ content: 'We can help with that.', userName: 'Sok Dara', userEmail: 'sok.dara@test.com' });
    expect(reply.status).toBe(201);
    expect(reply.body.sender).toBe('admin');
  });

  test('a non-admin cannot view conversations', async () => {
    const res = await request(app).get('/api/messages/conversations').set('Authorization', `Bearer ${donorToken}`);
    expect(res.status).toBe(403);
  });
});
