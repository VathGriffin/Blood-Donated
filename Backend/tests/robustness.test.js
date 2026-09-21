const request = require('supertest');
const app = require('../src/app');
const { createAdmin, signDonor } = require('./helpers');

const bearer = (token) => ({ Authorization: `Bearer ${token}` });
const donorToken = () => signDonor({ id: '64b000000000000000000001', email: 'me@test.com', fullName: 'Me' });
const isClientError = (status) => status >= 400 && status < 500;

describe('requests that are not JSON objects get a 4xx, never a 500', () => {
  const endpoints = [
    ['post', '/api/appointments'], ['post', '/api/contacts'], ['post', '/api/donors'], ['post', '/api/requests'],
    ['post', '/api/user/register'], ['post', '/api/user/login'], ['post', '/api/user/google'], ['post', '/api/user/facebook'],
    ['post', '/api/staff/login'], ['post', '/api/chat'],
  ];

  test.each(endpoints)('%s %s with Content-Type text/plain', async (method, path) => {
    const res = await request(app)[method](path).set('Content-Type', 'text/plain').send('hello');
    expect(isClientError(res.status)).toBe(true);
  });

  test.each(endpoints)('%s %s with no body at all', async (method, path) => {
    const res = await request(app)[method](path);
    expect(isClientError(res.status)).toBe(true);
  });

  test.each([['null'], ['"just a string"'], ['12345'], ['[1,2,3]'], ['[]']])('a JSON body of %s', async (raw) => {
    for (const path of ['/api/appointments', '/api/user/login', '/api/contacts', '/api/chat']) {
      const res = await request(app).post(path).set('Content-Type', 'application/json').send(raw);
      expect(isClientError(res.status)).toBe(true);
    }
  });

  test('authenticated routes are covered too (profile, messages, staff self-service)', async () => {
    const { token } = await createAdmin();
    for (const [method, path, t] of [
      ['put', '/api/user/profile', donorToken()], ['post', '/api/messages', donorToken()],
      ['patch', '/api/staff/me', token], ['patch', '/api/staff/me/password', token], ['post', '/api/staff', token],
    ]) {
      const res = await request(app)[method](path).set(bearer(t)).set('Content-Type', 'text/plain').send('hello');
      expect(isClientError(res.status)).toBe(true);
    }
  });

  test('the assistant endpoint answers 400 for a non-JSON body', async () => {
    const res = await request(app).post('/api/chat').set('Content-Type', 'text/plain').send('hi');
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/messages/i);
  });
});

describe('text fields must be text', () => {
  const weird = [{ $gt: '' }, { $ne: null }, ['a', 'b'], 12345, true, {}];

  test.each(weird)('login with email/password = %j is a 400', async (value) => {
    for (const path of ['/api/user/login', '/api/staff/login']) {
      const asEmail = await request(app).post(path).send({ email: value, password: 'secret123' });
      expect(asEmail.status).toBe(400);
      expect(asEmail.body.message).toMatch(/email must be text/);
      const asPassword = await request(app).post(path).send({ email: 'a@b.co', password: value });
      expect(asPassword.status).toBe(400);
      expect(asPassword.body.message).toMatch(/password must be text/);
    }
  });

  test.each(weird)('register, contact and profile reject %j as text fields', async (value) => {
    expect((await request(app).post('/api/user/register').send({ fullName: value, email: 'a@b.co', password: 'secret123' })).status).toBe(400);
    expect((await request(app).post('/api/contacts').send({ fullName: 'A', email: 'a@b.co', message: value })).status).toBe(400);
    expect((await request(app).put('/api/user/profile').set(bearer(donorToken())).send({ fullName: value })).status).toBe(400);
    const { token } = await createAdmin();
    expect((await request(app).patch('/api/staff/me').set(bearer(token)).send({ fullName: value })).status).toBe(400);
    expect((await request(app).patch('/api/staff/me/password').set(bearer(token)).send({ currentPassword: value, newPassword: 'newpassword1' })).status).toBe(400);
  });

  test('a NoSQL-injection style login is refused before it reaches the database', async () => {
    const res = await request(app).post('/api/staff/login').send({ email: { $gt: '' }, password: { $gt: '' } });
    expect(res.status).toBe(400);
  });

  test('null and missing values keep their normal handling, and valid input is untouched', async () => {
    expect((await request(app).post('/api/user/login').send({ email: null, password: null })).status).toBe(400);
    const ok = await request(app).post('/api/user/register').send({ fullName: 'Valid User', email: 'valid@test.com', password: 'secret123' });
    expect(ok.status).toBe(201);
    const login = await request(app).post('/api/user/login').send({ email: 'valid@test.com', password: 'secret123' });
    expect(login.status).toBe(200);
  });

  test('file uploads (multipart) still work through the guard', async () => {
    const created = await request(app).post('/api/donors')
      .send({ fullName: 'Sok Dara', email: 'up@test.com', phone: '0912345678', bloodType: 'O+', location: 'Phnom Penh' });
    const up = await request(app).post(`/api/donors/${created.body._id}/photo`).set(bearer(created.body.photoUploadToken))
      .attach('photo', Buffer.from('89504e470d0a1a0a', 'hex'), { filename: 'p.png', contentType: 'image/png' });
    expect(up.status).toBe(200);
    const fs = require('fs'); const path = require('path');
    try { fs.unlinkSync(path.join(__dirname, '../uploads', path.basename(up.body.photo))); } catch { /* cleaned by setup too */ }
  });
});
