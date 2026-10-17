const request = require('supertest');
const bcrypt = require('bcryptjs');

// Capture outgoing mail instead of talking to an SMTP server.
const sent = [];
jest.mock('../src/common/mailer', () => {
  const actual = jest.requireActual('../src/common/mailer');
  return { ...actual, sendMail: jest.fn(async (msg) => { sent.push(msg); }) };
});

const app = require('../src/app');
const PasswordReset = require('../src/staff/password-reset.model');
const StaffUser = require('../src/staff/staff.model');
const { createAdmin, createHospitalStaff, createHospital } = require('./helpers');

const SMTP = { SMTP_HOST: 'smtp.test', SMTP_USER: 'u', SMTP_PASS: 'p', MAIL_FROM: 'BloodLife <no-reply@test>', APP_URL: 'https://app.test' };
const flush = () => new Promise((r) => setTimeout(r, 50)); // the email is sent after the response
const linkToken = (msg) => msg.text.match(/#token=([A-Za-z0-9_-]+)/)[1];
const requestReset = (email) => request(app).post('/api/staff/password-reset/request').send({ email });
const reset = (token, password) => request(app).post('/api/staff/password-reset/reset').send({ token, password });
const login = (email, password) => request(app).post('/api/staff/login').send({ email, password });

let saved;
beforeEach(() => { sent.length = 0; saved = { ...process.env }; Object.assign(process.env, SMTP); });
afterEach(() => { process.env = saved; });

async function hospitalStaff(email = 'nurse@calmette.kh') {
  const { staff } = await createHospitalStaff((await createHospital())._id, { email, password: await bcrypt.hash('oldpassword1', 10) });
  return staff;
}

describe('when email is not configured', () => {
  beforeEach(() => { for (const k of Object.keys(SMTP)) delete process.env[k]; });

  test('status says so and names the missing settings', async () => {
    const res = await request(app).get('/api/staff/password-reset/status');
    expect(res.body.available).toBe(false);
    expect(res.body.missing).toEqual(['SMTP_HOST', 'SMTP_USER', 'SMTP_PASS', 'MAIL_FROM']);
  });

  test('a request is refused with 503 instead of pretending to send, for any address', async () => {
    await hospitalStaff();
    const known = await requestReset('nurse@calmette.kh');
    const unknown = await requestReset('nobody@nowhere.kh');
    expect(known.status).toBe(503);
    expect(known.body).toEqual(unknown.body); // still reveals nothing about which emails exist
    expect(known.body.message).toMatch(/not set up/);
    await flush();
    expect(sent).toHaveLength(0);
    expect(await PasswordReset.countDocuments()).toBe(0);
  });
});

describe('requesting a reset link', () => {
  test('status is available when configured', async () => {
    expect((await request(app).get('/api/staff/password-reset/status')).body).toEqual({ available: true });
  });

  test('known and unknown emails get the identical generic answer', async () => {
    await hospitalStaff();
    const known = await requestReset('Nurse@Calmette.kh');
    const unknown = await requestReset('nobody@nowhere.kh');
    expect(known.status).toBe(200);
    expect(known.body).toEqual(unknown.body);
    await flush();
    expect(sent).toHaveLength(1);
    expect(sent[0].to).toBe('nurse@calmette.kh');
    expect(sent[0].text).toMatch(/^[\s\S]*https:\/\/app\.test\/hospital\/reset-password#token=/);
  });

  test('only a hash of the token is stored, with a 30-minute expiry', async () => {
    await hospitalStaff();
    await requestReset('nurse@calmette.kh'); await flush();
    const token = linkToken(sent[0]);
    const doc = await PasswordReset.findOne().lean();
    expect(doc.tokenHash).not.toContain(token);
    expect(doc.tokenHash).toMatch(/^[a-f0-9]{64}$/);
    const minutes = (new Date(doc.expiresAt) - Date.now()) / 60000;
    expect(minutes).toBeGreaterThan(29);
    expect(minutes).toBeLessThanOrEqual(30);
  });

  test('admin accounts cannot be reset from the hospital portal', async () => {
    await createAdmin({ email: 'boss@bloodlife.kh' });
    expect((await requestReset('boss@bloodlife.kh')).status).toBe(200);
    await flush();
    expect(sent).toHaveLength(0);
  });

  test('a second request within a minute sends nothing more', async () => {
    await hospitalStaff();
    await requestReset('nurse@calmette.kh'); await flush();
    await requestReset('nurse@calmette.kh'); await flush();
    expect(sent).toHaveLength(1);
  });

  test('a newer link replaces the older one', async () => {
    await hospitalStaff();
    await requestReset('nurse@calmette.kh'); await flush();
    const first = linkToken(sent[0]);
    await PasswordReset.collection.updateMany({}, { $set: { createdAt: new Date(Date.now() - 2 * 60 * 1000) } }); // past the 1-minute cooldown
    await requestReset('nurse@calmette.kh'); await flush();
    const second = linkToken(sent[1]);
    expect((await reset(first, 'brandnewpass1')).status).toBe(400);
    expect((await reset(second, 'brandnewpass1')).status).toBe(200);
  });

  test('a malformed email is a 400', async () => {
    expect((await requestReset('not-an-email')).status).toBe(400);
    expect((await request(app).post('/api/staff/password-reset/request').send({ email: { $gt: '' } })).status).toBe(400);
  });
});

describe('using a reset link', () => {
  async function issued() {
    const staff = await hospitalStaff();
    await requestReset('nurse@calmette.kh'); await flush();
    return { staff, token: linkToken(sent[0]) };
  }

  test('verify reports a live link without using it up', async () => {
    const { token } = await issued();
    expect((await request(app).post('/api/staff/password-reset/verify').send({ token })).body).toEqual({ valid: true });
    expect((await request(app).post('/api/staff/password-reset/verify').send({ token })).body).toEqual({ valid: true });
    expect((await request(app).post('/api/staff/password-reset/verify').send({ token: 'nope' })).body).toEqual({ valid: false });
  });

  test('sets the new password: new one signs in, old one no longer does', async () => {
    const { token } = await issued();
    const res = await reset(token, 'brandnewpass1');
    expect(res.status).toBe(200);
    expect((await login('nurse@calmette.kh', 'brandnewpass1')).status).toBe(200);
    expect((await login('nurse@calmette.kh', 'oldpassword1')).status).toBe(401);
    await flush();
    expect(sent.at(-1).subject).toMatch(/password was changed/);
  });

  test('works only once', async () => {
    const { token } = await issued();
    expect((await reset(token, 'brandnewpass1')).status).toBe(200);
    const again = await reset(token, 'anotherpass12');
    expect(again.status).toBe(400);
    expect(again.body.message).toMatch(/invalid or has expired/);
    expect((await login('nurse@calmette.kh', 'brandnewpass1')).status).toBe(200);
  });

  test('two simultaneous uses: exactly one wins', async () => {
    const { token } = await issued();
    const results = await Promise.all([reset(token, 'firstpass123'), reset(token, 'secondpass12')]);
    expect(results.map((r) => r.status).sort()).toEqual([200, 400]);
  });

  test('expired links are refused', async () => {
    const { token } = await issued();
    await PasswordReset.updateMany({}, { expiresAt: new Date(Date.now() - 1000) });
    expect((await reset(token, 'brandnewpass1')).status).toBe(400);
    expect((await login('nurse@calmette.kh', 'oldpassword1')).status).toBe(200);
  });

  test('password rules match the rest of the app and do not spend the link', async () => {
    const { token } = await issued();
    expect((await reset(token, 'short')).status).toBe(400);
    expect((await reset(token, 'x'.repeat(73))).status).toBe(400);
    expect((await reset(token, 'brandnewpass1')).status).toBe(200);
  });

  test('bad input shapes are 400s, not crashes', async () => {
    expect((await reset('', 'brandnewpass1')).status).toBe(400);
    expect((await request(app).post('/api/staff/password-reset/reset').send({ token: { $ne: '' }, password: 'brandnewpass1' })).status).toBe(400);
    expect((await reset('made-up-token', 'brandnewpass1')).status).toBe(400);
  });

  test('a link for an account that was deleted is refused', async () => {
    const { staff, token } = await issued();
    await StaffUser.deleteOne({ _id: staff._id });
    expect((await reset(token, 'brandnewpass1')).status).toBe(400);
  });
});
