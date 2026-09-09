const request = require('supertest');
const jwt = require('jsonwebtoken');
const app = require('../src/app');
const { createAdmin } = require('./helpers');

describe('staff login', () => {
  test('logs in with correct credentials', async () => {
    await createAdmin({ email: 'boss@test.com' });
    const res = await request(app).post('/api/staff/login').send({ email: 'boss@test.com', password: 'password123' });
    expect(res.status).toBe(200);
    expect(res.body.token).toBeDefined();
    expect(res.body.staff.role).toBe('admin');
  });

  test('rejects wrong password', async () => {
    await createAdmin({ email: 'boss2@test.com' });
    const res = await request(app).post('/api/staff/login').send({ email: 'boss2@test.com', password: 'wrongpass' });
    expect(res.status).toBe(401);
  });

  test('rejects unknown email', async () => {
    const res = await request(app).post('/api/staff/login').send({ email: 'nobody@test.com', password: 'password123' });
    expect(res.status).toBe(401);
  });
});

describe('donor account auth', () => {
  test('register issues a donor-role token', async () => {
    const res = await request(app).post('/api/user/register').send({
      fullName: 'Jane Donor',
      email: 'jane@test.com',
      password: 'secret123',
    });
    expect(res.status).toBe(201);
    const decoded = jwt.decode(res.body.token);
    expect(decoded.role).toBe('donor');
  });

  test('login issues a donor-role token', async () => {
    await request(app).post('/api/user/register').send({
      fullName: 'Jane Donor',
      email: 'jane2@test.com',
      password: 'secret123',
    });
    const res = await request(app).post('/api/user/login').send({ email: 'jane2@test.com', password: 'secret123' });
    expect(res.status).toBe(200);
    const decoded = jwt.decode(res.body.token);
    expect(decoded.role).toBe('donor');
  });
});
