const request = require('supertest');
const app = require('../src/app');
const statsRoutes = require('../src/dashboard/stats.routes');
const Hospital = require('../src/hospital/hospital.model');
const BloodRequest = require('../src/requests/blood-request.model');
const Inventory = require('../src/inventory/inventory.model');
const Appointment = require('../src/appointments/appointment.model');

beforeEach(() => statsRoutes.clearInsightsCache());

describe('GET /api/stats/hospital-insights', () => {
  test('is public and returns zeroed, complete figures on an empty database', async () => {
    const res = await request(app).get('/api/stats/hospital-insights');
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ hospitals: 0, hospitalsReportingStock: 0, topHospitals: [] });
    expect(res.body.requests).toMatchObject({ total: 0, fulfilled: 0 });
    expect(res.body.requests.byBloodType).toHaveLength(8);
    expect(res.body.requests.byUrgency.map((u) => u.urgency)).toEqual(['Critical', 'High', 'Medium', 'Low']);
    expect(res.body.stock).toMatchObject({ totalUnits: 0, status: { adequate: 0, low: 0, critical: 0, empty: 0 } });
    expect(res.body.stock.byBloodType).toHaveLength(8);
  });

  test('aggregates requests, stock and appointments across hospitals', async () => {
    const [a, b] = await Hospital.create([{ name: 'Calmette Hospital', city: 'Phnom Penh' }, { name: 'Angkor Hospital', city: 'Siem Reap' }]);
    const req = (over) => ({ hospitalName: 'x', patientName: 'p', bloodType: 'O+', urgency: 'High', reason: 'r', ...over });
    await BloodRequest.create([
      req({ hospital: a._id, status: 'Fulfilled' }),
      req({ hospital: a._id, status: 'Fulfilled', urgency: 'Critical', bloodType: 'A+' }),
      req({ hospital: b._id, status: 'Pending' }),
      req({ hospital: null, status: 'Rejected', urgency: 'Low' }),
    ]);
    await Inventory.create([
      { hospital: a._id, bloodType: 'O-', units: 4, minUnits: 10 },   // critical
      { hospital: a._id, bloodType: 'A+', units: 15, minUnits: 10 },  // low
      { hospital: b._id, bloodType: 'A+', units: 50, minUnits: 10 },  // adequate
      { hospital: b._id, bloodType: 'B+', units: 0, minUnits: 10 },   // empty
    ]);
    const appt = { fullName: 'n', email: 'a@b.co', phone: '0123456789', bloodType: 'O+', date: '2026-01-01', time: '09:00', location: 'l' };
    await Appointment.create([{ ...appt, status: 'CheckedIn' }, { ...appt, status: 'Pending' }]);

    const { body } = await request(app).get('/api/stats/hospital-insights');
    expect(body.hospitals).toBe(2);
    expect(body.hospitalsReportingStock).toBe(2);
    expect(body.requests).toMatchObject({ total: 4, fulfilled: 2, rejected: 1, pending: 1 });
    expect(body.requests.byUrgency.find((u) => u.urgency === 'Critical').count).toBe(1);
    expect(body.requests.byBloodType.find((t) => t.type === 'O+').count).toBe(3);
    expect(body.stock.totalUnits).toBe(69);
    expect(body.stock.byBloodType.find((t) => t.type === 'A+').units).toBe(65);
    expect(body.stock.status).toEqual({ adequate: 1, low: 1, critical: 1, empty: 1 });
    expect(body.appointments).toEqual({ total: 2, checkedIn: 1 });
    expect(body.topHospitals[0]).toEqual({ name: 'Calmette Hospital', city: 'Phnom Penh', requests: 2, fulfilled: 2 });
  });

  test('exposes no personal or contact details', async () => {
    await Hospital.create({ name: 'H', city: 'C', email: 'secret@hospital.org', phone: '012345678', licenseNumber: 'LIC-999' });
    await BloodRequest.create({ hospitalName: 'x', patientName: 'Sensitive Patient', bloodType: 'O+', urgency: 'High', reason: 'r', contact: '099999999', userEmail: 'p@x.co' });
    const text = JSON.stringify((await request(app).get('/api/stats/hospital-insights')).body);
    for (const leak of ['secret@hospital.org', '012345678', 'LIC-999', 'Sensitive Patient', '099999999', 'p@x.co']) {
      expect(text).not.toContain(leak);
    }
  });
});
