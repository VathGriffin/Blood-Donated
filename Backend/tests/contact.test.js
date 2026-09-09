const request = require('supertest');
const app = require('../src/app');
const { createAdmin } = require('./helpers');

describe('contact messages', () => {
  test('anyone can submit a contact message', async () => {
    const res = await request(app).post('/api/contacts').send({
      fullName: 'Sok Dara', email: 'sok.dara@test.com', message: 'How do I register as a donor?',
    });
    expect(res.status).toBe(201);
    expect(res.body.email).toBe('sok.dara@test.com');
  });

  test('rejects a submission missing required fields', async () => {
    const res = await request(app).post('/api/contacts').send({ fullName: 'Sok Dara' });
    expect(res.status).toBe(400);
  });

  test('only admin can list, update, and delete messages', async () => {
    const created = await request(app).post('/api/contacts').send({
      fullName: 'Sok Dara', email: 'sok.dara@test.com', message: 'Hello',
    });

    const anonList = await request(app).get('/api/contacts');
    expect(anonList.status).toBe(401);

    const { token: adminToken } = await createAdmin();
    const list = await request(app).get('/api/contacts').set('Authorization', `Bearer ${adminToken}`);
    expect(list.status).toBe(200);
    expect(list.body.length).toBe(1);

    const updated = await request(app)
      .put(`/api/contacts/${created.body._id}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ message: 'Updated message text' });
    expect(updated.status).toBe(200);
    expect(updated.body.message).toBe('Updated message text');

    const deleted = await request(app)
      .delete(`/api/contacts/${created.body._id}`)
      .set('Authorization', `Bearer ${adminToken}`);
    expect(deleted.status).toBe(200);
  });
});
