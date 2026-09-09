const request = require('supertest');
const app = require('../src/app');
const Donor = require('../src/donor/donor.model');
const BloodRequest = require('../src/requests/blood-request.model');
const { createAdmin, createHospitalStaff, createHospital } = require('./helpers');

describe('admin dashboard stats', () => {
  test('requires authentication', async () => {
    const res = await request(app).get('/api/stats');
    expect(res.status).toBe(401);
  });

  test('non-admin roles are forbidden', async () => {
    const { token: staffToken } = await createHospitalStaff((await createHospital())._id);
    const res = await request(app).get('/api/stats').set('Authorization', `Bearer ${staffToken}`);
    expect(res.status).toBe(403);
  });

  test('admin gets aggregated counts', async () => {
    await Donor.create({ fullName: 'A', email: 'a@test.com', phone: '0911111111', bloodType: 'O+', location: 'PP', available: true });
    await Donor.create({ fullName: 'B', email: 'b@test.com', phone: '0922222222', bloodType: 'A-', location: 'PP', available: false });
    await BloodRequest.create({
      hospitalName: 'Calmette', patientName: 'P', bloodType: 'O+',
      unitsNeeded: 2, urgency: 'Critical', reason: 'surgery', status: 'Pending',
    });

    const { token: adminToken } = await createAdmin();
    const res = await request(app).get('/api/stats').set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
    expect(res.body.donors.total).toBe(2);
    expect(res.body.donors.available).toBe(1);
    expect(res.body.requests.total).toBe(1);
    expect(res.body.requests.critical).toBe(1);
    expect(Array.isArray(res.body.bloodTypeBreakdown)).toBe(true);
    expect(Array.isArray(res.body.recentDonors)).toBe(true);
  });
});
