const request = require('supertest');
const app = require('../src/app');
const Hospital = require('../src/hospital/hospital.model');
const BloodRequest = require('../src/requests/blood-request.model');
const { createAdmin, createHospitalStaff, signDonor } = require('./helpers');

describe('RBAC — requireRole / optionalAuth', () => {
  test('donor token on a staff-only route -> 403', async () => {
    const donorToken = signDonor({ _id: '507f1f77bcf86cd799439011', email: 'd@test.com', fullName: 'D' });
    const request_ = await BloodRequest.create({
      hospitalName: 'General', patientName: 'P', bloodType: 'O+', unitsNeeded: 1,
      urgency: 'Low', reason: 'test',
    });
    const res = await request(app)
      .patch(`/api/requests/${request_._id}/status`)
      .set('Authorization', `Bearer ${donorToken}`)
      .send({ status: 'Approved' });
    expect(res.status).toBe(403);
  });

  test('hospital_staff token against another hospital\'s resource -> 403', async () => {
    const hospitalA = await Hospital.create({ name: 'Hospital A' });
    const hospitalB = await Hospital.create({ name: 'Hospital B' });
    const { token } = await createHospitalStaff(hospitalA._id);
    const req = await BloodRequest.create({
      hospitalName: 'Hospital B', hospital: hospitalB._id, patientName: 'P', bloodType: 'O+',
      unitsNeeded: 1, urgency: 'Low', reason: 'test', status: 'Pending',
    });
    const res = await request(app)
      .patch(`/api/requests/${req._id}/status`)
      .set('Authorization', `Bearer ${token}`)
      .send({ status: 'Approved' });
    expect(res.status).toBe(403);
  });

  test('missing token -> 401', async () => {
    const res = await request(app).get('/api/staff');
    expect(res.status).toBe(401);
  });

  test('garbage token -> 401', async () => {
    const res = await request(app).get('/api/staff').set('Authorization', 'Bearer not-a-real-token');
    expect(res.status).toBe(401);
  });

  test('admin token -> 200 on an admin-only route', async () => {
    const { token } = await createAdmin();
    const res = await request(app).get('/api/staff').set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
  });
});
