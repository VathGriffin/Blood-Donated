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

  test('register stores the optional profile fields and returns them', async () => {
    const res = await request(app).post('/api/user/register').send({
      fullName: 'Sok Dara', email: 'dara@test.com', password: 'secret123',
      phone: '+855 12 345 678', dateOfBirth: '1999-04-20', bloodType: 'O+', location: 'Phnom Penh',
    });
    expect(res.status).toBe(201);
    expect(res.body.user).toMatchObject({ phone: '+855 12 345 678', bloodType: 'O+', location: 'Phnom Penh' });
    expect(new Date(res.body.user.dateOfBirth).getUTCFullYear()).toBe(1999);
    expect(res.body.user.password).toBeUndefined();
  });

  test('register still works with only name, email and password', async () => {
    const res = await request(app).post('/api/user/register').send({
      fullName: 'Plain User', email: 'plain@test.com', password: 'secret123',
    });
    expect(res.status).toBe(201);
    expect(res.body.user).toMatchObject({ bloodType: '', location: '', dateOfBirth: null });
  });

  test('register rejects an invalid blood type, phone or date of birth', async () => {
    const base = { fullName: 'X Y', email: 'bad@test.com', password: 'secret123' };
    const future = new Date(Date.now() + 86400000 * 30).toISOString().slice(0, 10);
    for (const extra of [{ bloodType: 'Z+' }, { phone: 'abc' }, { dateOfBirth: 'not-a-date' }, { dateOfBirth: future }]) {
      const res = await request(app).post('/api/user/register').send({ ...base, ...extra });
      expect(res.status).toBe(400);
    }
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
