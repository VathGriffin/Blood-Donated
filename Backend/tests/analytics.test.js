const request = require('supertest');
const app = require('../src/app');
const BloodRequest = require('../src/requests/blood-request.model');
const { createAdmin } = require('./helpers');

// Regression test for a confirmed bug: analytics.routes.js used to query
// status:'pending'/'fulfilled' and urgency:'critical' (lowercase) against a
// schema whose real enum values are capitalized, so these counts were always 0.
describe('analytics — request status/urgency accuracy', () => {
  test('pending, urgent and fulfilled counts reflect real capitalized data', async () => {
    const base = { hospitalName: 'General', patientName: 'P', bloodType: 'O+', unitsNeeded: 1, reason: 'test' };
    await BloodRequest.create([
      { ...base, urgency: 'Low', status: 'Pending' },
      { ...base, urgency: 'Critical', status: 'Pending' },
      { ...base, urgency: 'Critical', status: 'Pending' },
      { ...base, urgency: 'Medium', status: 'Fulfilled' },
      { ...base, urgency: 'Low', status: 'Rejected' },
    ]);

    const { token } = await createAdmin();
    const res = await request(app).get('/api/analytics').set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.overview.totalRequests).toBe(5);
    expect(res.body.overview.pendingRequests).toBe(3);
    expect(res.body.overview.urgentRequests).toBe(2);
    expect(res.body.overview.fulfilledRequests).toBe(1);
    expect(res.body.overview.fulfillmentRate).toBe(20);
  });
});
