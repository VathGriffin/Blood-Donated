const request = require('supertest');
const app = require('../src/app');
const Donor = require('../src/donor/donor.model');
const BloodRequest = require('../src/requests/blood-request.model');
const Hospital = require('../src/hospital/hospital.model');
const { createAdmin, createHospitalStaff, createHospital } = require('./helpers');

describe('public homepage stats', () => {
  test('is available without authentication and returns only aggregate counts', async () => {
    await Donor.create({ fullName: 'Private Person', email: 'private@test.com', phone: '0911111111', bloodType: 'O+', location: 'PP', donationCount: 2 });
    await Donor.create({ fullName: 'Other Person', email: 'other@test.com', phone: '0922222222', bloodType: 'A-', location: 'PP', donationCount: 3 });
    await Hospital.create([{ name: 'Calmette' }, { name: 'Royal PP' }, { name: 'Khmer-Soviet' }]);
    const base = { hospitalName: 'Calmette', patientName: 'Secret Patient', bloodType: 'O+', unitsNeeded: 1, urgency: 'High', reason: 'x' };
    await BloodRequest.create([{ ...base, status: 'Fulfilled' }, { ...base, status: 'Fulfilled' }, { ...base, status: 'Pending' }]);

    const res = await request(app).get('/api/stats/public');
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ donors: 2, donations: 5, hospitals: 3, fulfilledRequests: 2 });
    // nothing personal leaks
    const text = JSON.stringify(res.body);
    expect(text).not.toMatch(/Private Person|private@test|Secret Patient|0911111111/);
  });

  test('returns zeros on an empty database', async () => {
    const res = await request(app).get('/api/stats/public');
    expect(res.body).toEqual({ donors: 0, donations: 0, hospitals: 0, fulfilledRequests: 0 });
  });

  test('the admin stats endpoint is still protected', async () => {
    expect((await request(app).get('/api/stats')).status).toBe(401);
  });
});

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

  test('reports total donations (sum of donor donationCount), partner hospitals, and units on recent requests', async () => {
    await Donor.create({ fullName: 'A', email: 'a@test.com', phone: '0911111111', bloodType: 'O+', location: 'PP', donationCount: 3 });
    await Donor.create({ fullName: 'B', email: 'b@test.com', phone: '0922222222', bloodType: 'A-', location: 'PP', donationCount: 4 });
    await Hospital.create([{ name: 'Calmette' }, { name: 'Royal PP' }]);
    await BloodRequest.create({ hospitalName: 'Calmette', patientName: 'P', bloodType: 'O+', unitsNeeded: 5, urgency: 'High', reason: 'x' });

    const { token } = await createAdmin();
    const res = await request(app).get('/api/stats').set('Authorization', `Bearer ${token}`);
    expect(res.body.donations.total).toBe(7);
    expect(res.body.hospitals.total).toBe(2);
    expect(res.body.recentRequests[0].unitsNeeded).toBe(5);
  });

  test('donations total is 0 with no donors', async () => {
    const { token } = await createAdmin();
    const res = await request(app).get('/api/stats').set('Authorization', `Bearer ${token}`);
    expect(res.body.donations.total).toBe(0);
    expect(res.body.hospitals.total).toBe(0);
  });
});
