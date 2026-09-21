const request = require('supertest');
const jwt = require('jsonwebtoken');
const app = require('../src/app');
const { SERVER_RUN_ID } = require('../src/common/session');
const { createAdmin, createHospital, createHospitalStaff, signDonor } = require('./helpers');

// Signs a token the way a login would, but lets the test choose the server-run claim.
const adminToken = (admin, run) =>
  jwt.sign({ id: admin._id, email: admin.email, fullName: admin.fullName, role: 'admin', ...(run ? { run } : {}) },
    process.env.JWT_SECRET, { expiresIn: '7d' });

describe('admin sessions end when the server restarts', () => {
  test('admin login issues a token tied to this server run, and it keeps working (a browser refresh)', async () => {
    await createAdmin();
    const login = await request(app).post('/api/staff/login').send({ email: 'admin@test.com', password: 'password123' });
    expect(login.status).toBe(200);
    expect(jwt.decode(login.body.token).run).toBe(SERVER_RUN_ID);

    // same token, presented again and again — like reloading the dashboard
    for (let i = 0; i < 3; i++) {
      const me = await request(app).get('/api/staff/me').set('Authorization', `Bearer ${login.body.token}`);
      expect(me.status).toBe(200);
    }
  });

  test('an admin token from a previous server run is refused with a clear message', async () => {
    const { staff } = await createAdmin();
    const stale = adminToken(staff, 'a-previous-server-run');
    const res = await request(app).get('/api/staff/me').set('Authorization', `Bearer ${stale}`);
    expect(res.status).toBe(401);
    expect(res.body.message).toMatch(/server restarted.*sign in again/i);
  });

  test('an admin token with no run claim at all (issued before this rule) is refused too', async () => {
    const { staff } = await createAdmin();
    const res = await request(app).get('/api/staff/me').set('Authorization', `Bearer ${adminToken(staff)}`);
    expect(res.status).toBe(401);
  });

  test('a stale admin token is refused on admin-only routes and on the donor photo upload check', async () => {
    const { staff } = await createAdmin();
    const stale = adminToken(staff, 'old-run');
    expect((await request(app).get('/api/staff').set('Authorization', `Bearer ${stale}`)).status).toBe(401);
    expect((await request(app).get('/api/stats').set('Authorization', `Bearer ${stale}`)).status).toBe(401);

    const donor = await request(app).post('/api/donors')
      .send({ fullName: 'A B', email: 'ab@test.com', phone: '0912345678', bloodType: 'O+', location: 'Phnom Penh' });
    const upload = await request(app).post(`/api/donors/${donor.body._id}/photo`).set('Authorization', `Bearer ${stale}`)
      .attach('photo', Buffer.from('x'), { filename: 'p.png', contentType: 'image/png' });
    expect(upload.status).toBe(401);
  });

  test('hospital staff and donor sessions are NOT affected by a server restart', async () => {
    const hospital = await createHospital();
    const { token: staffToken } = await createHospitalStaff(hospital._id);
    expect(jwt.decode(staffToken).run).toBeUndefined();
    expect((await request(app).get('/api/staff/me').set('Authorization', `Bearer ${staffToken}`)).status).toBe(200);

    const donorToken = signDonor({ id: '64b000000000000000000001', email: 'd@test.com', fullName: 'Donor' });
    expect((await request(app).get('/api/user/me').set('Authorization', `Bearer ${donorToken}`)).status).not.toBe(401);
  });
});
