const request = require('supertest');
const bcrypt = require('bcryptjs');
const app = require('../src/app');
const StaffUser = require('../src/staff/staff.model');
const { createAdmin, createHospitalStaff, createHospital, signStaff } = require('./helpers');

describe('self-service profile update', () => {
  test('a staff member can update their own display name', async () => {
    const { staff, token } = await createAdmin();
    const res = await request(app)
      .patch('/api/staff/me')
      .set('Authorization', `Bearer ${token}`)
      .send({ fullName: 'Updated Name' });
    expect(res.status).toBe(200);
    expect(res.body.fullName).toBe('Updated Name');

    const reloaded = await StaffUser.findById(staff._id);
    expect(reloaded.fullName).toBe('Updated Name');
  });

  test('rejects an empty fullName', async () => {
    const { token } = await createAdmin();
    const res = await request(app)
      .patch('/api/staff/me')
      .set('Authorization', `Bearer ${token}`)
      .send({ fullName: '   ' });
    expect(res.status).toBe(400);
  });

  test('requires authentication', async () => {
    const res = await request(app).patch('/api/staff/me').send({ fullName: 'X' });
    expect(res.status).toBe(401);
  });

  test('a hospital_staff account can also update their own name', async () => {
    const hospital = await createHospital();
    const { token } = await createHospitalStaff(hospital._id);
    const res = await request(app)
      .patch('/api/staff/me')
      .set('Authorization', `Bearer ${token}`)
      .send({ fullName: 'Hospital Staffer' });
    expect(res.status).toBe(200);
  });
});

describe('self-service password change', () => {
  test('changes the password when the current one is correct', async () => {
    const { staff, token } = await createAdmin();
    const res = await request(app)
      .patch('/api/staff/me/password')
      .set('Authorization', `Bearer ${token}`)
      .send({ currentPassword: 'password123', newPassword: 'newSecurePass1' });
    expect(res.status).toBe(200);

    const reloaded = await StaffUser.findById(staff._id);
    expect(await bcrypt.compare('newSecurePass1', reloaded.password)).toBe(true);
  });

  test('rejects an incorrect current password', async () => {
    const { token } = await createAdmin();
    const res = await request(app)
      .patch('/api/staff/me/password')
      .set('Authorization', `Bearer ${token}`)
      .send({ currentPassword: 'wrong-password', newPassword: 'newSecurePass1' });
    expect(res.status).toBe(401);
  });

  test('rejects a new password shorter than 8 characters', async () => {
    const { token } = await createAdmin();
    const res = await request(app)
      .patch('/api/staff/me/password')
      .set('Authorization', `Bearer ${token}`)
      .send({ currentPassword: 'password123', newPassword: 'short' });
    expect(res.status).toBe(400);
  });

  test('does not let one staff member change another\'s password via /me', async () => {
    const { staff: staffA } = await createAdmin();
    const staffBToken = signStaff({ _id: '666666666666666666666666', email: 'b@test.com', fullName: 'B', role: 'admin' });
    // Even with a token that isn't staffA's, /me/password only ever targets req.auth.id,
    // so it can't be used to change staffA's password.
    const res = await request(app)
      .patch('/api/staff/me/password')
      .set('Authorization', `Bearer ${staffBToken}`)
      .send({ currentPassword: 'password123', newPassword: 'newSecurePass1' });
    expect(res.status).toBe(404); // staffBToken's id doesn't exist as a real account

    const reloaded = await StaffUser.findById(staffA._id);
    expect(await bcrypt.compare('password123', reloaded.password)).toBe(true);
  });
});
