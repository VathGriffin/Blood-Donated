const request = require('supertest');
const app = require('../src/app');
const BloodRequest = require('../src/requests/blood-request.model');
const { signDonor, createAdmin, createHospital, createHospitalStaff } = require('./helpers');

const OWNER = { _id: '666666666666666666666666', email: 'owner@test.com', fullName: 'Owner' };
const ownerToken = signDonor(OWNER);
const otherToken = signDonor({ _id: '777777777777777777777777', email: 'other@test.com', fullName: 'Other' });

const makeRequest = (overrides = {}) => BloodRequest.create({
  hospitalName: 'Calmette Hospital', patientName: 'Dara', bloodType: 'A+', unitsNeeded: 1,
  urgency: 'High', reason: 'Surgery', userEmail: OWNER.email, ...overrides,
});
const cancel = (id, token = ownerToken, body = {}) =>
  request(app).patch(`/api/requests/${id}/cancel`).set('Authorization', `Bearer ${token}`).send(body);

describe('cancelling a blood request', () => {
  test('the owner can cancel a pending request, with an optional reason', async () => {
    const r = await makeRequest();
    const res = await cancel(r._id, ownerToken, { reason: '  Found a donor in the family  ' });
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('Cancelled');
    expect(res.body.cancellationReason).toBe('Found a donor in the family');
    expect(res.body.cancelledAt).toBeTruthy();

    const mine = await request(app).get('/api/requests').set('Authorization', `Bearer ${ownerToken}`);
    expect(mine.body[0].status).toBe('Cancelled');
  });

  test('the reason is optional', async () => {
    const r = await makeRequest();
    const res = await cancel(r._id);
    expect(res.status).toBe(200);
    expect(res.body.cancellationReason).toBe('');
  });

  test("someone else's request looks like it doesn't exist and is left untouched", async () => {
    const r = await makeRequest();
    const res = await cancel(r._id, otherToken);
    expect(res.status).toBe(404);
    expect((await BloodRequest.findById(r._id)).status).toBe('Pending');
  });

  test('requests filed without an account cannot be cancelled by any donor', async () => {
    const r = await makeRequest({ userEmail: '' });
    expect((await cancel(r._id)).status).toBe(404);
  });

  test('needs a donor login — staff and anonymous callers are refused', async () => {
    const r = await makeRequest();
    expect((await request(app).patch(`/api/requests/${r._id}/cancel`)).status).toBe(401);
    const { token: adminToken } = await createAdmin();
    expect((await cancel(r._id, adminToken)).status).toBe(403);
  });

  test.each([
    ['Approved', /already been approved/],
    ['Rejected', /can't be cancelled/],
    ['Fulfilled', /can't be cancelled/],
  ])('a %s request cannot be cancelled', async (status, message) => {
    const r = await makeRequest({ status });
    const res = await cancel(r._id);
    expect(res.status).toBe(409);
    expect(res.body.error).toMatch(message);
    expect((await BloodRequest.findById(r._id)).status).toBe(status);
  });

  test('cancelling twice is refused, and simultaneous attempts only cancel once', async () => {
    const r = await makeRequest();
    const results = await Promise.all([cancel(r._id), cancel(r._id), cancel(r._id)]);
    expect(results.map((x) => x.status).sort()).toEqual([200, 409, 409]);
    const again = await cancel(r._id);
    expect(again.status).toBe(409);
    expect(again.body.error).toMatch(/already been cancelled/);
  });

  test('an over-long or non-text reason is rejected', async () => {
    const r = await makeRequest();
    expect((await cancel(r._id, ownerToken, { reason: 'x'.repeat(501) })).status).toBe(400);
    expect((await cancel(r._id, ownerToken, { reason: { $gt: '' } })).status).toBe(400);
    expect((await BloodRequest.findById(r._id)).status).toBe('Pending');
  });

  test('an invalid id is a 404, not a server error', async () => {
    expect((await cancel('not-an-id')).status).toBe(404);
  });

  test('staff cannot approve or reopen a cancelled request', async () => {
    const hospital = await createHospital();
    const r = await makeRequest({ hospital: hospital._id });
    await cancel(r._id);
    const { token: staffToken } = await createHospitalStaff(hospital._id);
    for (const status of ['Approved', 'Pending', 'Rejected']) {
      const res = await request(app).patch(`/api/requests/${r._id}/status`).set('Authorization', `Bearer ${staffToken}`).send({ status });
      expect(res.status).toBe(409);
    }
    expect((await BloodRequest.findById(r._id)).status).toBe('Cancelled');
  });
});
