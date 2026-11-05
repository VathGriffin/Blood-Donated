const request = require('supertest');
const app = require('../src/app');
const BloodRequest = require('../src/requests/blood-request.model');
const Appointment = require('../src/appointments/appointment.model');
const Inventory = require('../src/inventory/inventory.model');
const { createAdmin, createHospital, createHospitalStaff, signDonor } = require('./helpers');

const auth = (t) => ({ Authorization: `Bearer ${t}` });
const today = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};
const appt = (hospital, extra = {}) => ({
  fullName: 'Vann Nam', email: 'v@test.com', phone: '0123456789', bloodType: 'B+', date: '2030-01-05', time: '09:00 AM',
  location: 'Calmette Hospital', hospital, ...extra,
});

async function seed(mine, other) {
  await BloodRequest.create({ hospital: mine, hospitalName: 'Calmette Hospital', patientName: 'Chan Dara', bloodType: 'O-', unitsNeeded: 2, urgency: 'Critical', reason: 'Surgery' });
  await BloodRequest.create({ hospital: mine, hospitalName: 'Calmette Hospital', patientName: 'Srey Mom', bloodType: 'A+', urgency: 'Low', reason: 'Anemia',
    status: 'Cancelled', cancelledAt: new Date(), cancellationReason: 'Found a donor' });
  await Appointment.create(appt(mine));
  await Appointment.create(appt(mine, { fullName: 'Keo Sophal', email: 'k@test.com', status: 'Cancelled', cancelledAt: new Date(), cancelledBy: 'donor', cancellationReason: 'Sick' }));
  await Appointment.create(appt(mine, { fullName: 'Today Donor', email: 't@test.com', date: today(), status: 'Pending' }));
  await Appointment.create(appt(mine, {
    fullName: 'Lim Bopha', email: 'l@test.com', status: 'Confirmed',
    rescheduleRequests: [{ fromDate: '2030-01-05', fromTime: '09:00 AM', toDate: '2030-01-07', toTime: '10:00 AM', reason: 'Work' }],
  }));
  await Inventory.create({ bloodType: 'O-', hospital: mine, units: 2, minUnits: 10 });
  await Inventory.create({ bloodType: 'A+', hospital: mine, units: 40, minUnits: 10 });
  // Another hospital's activity must never appear.
  await BloodRequest.create({ hospital: other, hospitalName: 'Other Hospital', patientName: 'Not Mine', bloodType: 'AB+', urgency: 'Critical', reason: 'x' });
  await Appointment.create(appt(other, { fullName: 'Not Mine', email: 'n@test.com' }));
  await Inventory.create({ bloodType: 'B-', hospital: other, units: 0, minUnits: 10 });
}

describe('hospital staff notification feed', () => {
  test('lists real events for the staff member’s own hospital only, newest first', async () => {
    const mine = await createHospital();
    const other = await createHospital({ name: 'Other Hospital' });
    const { token } = await createHospitalStaff(mine._id);
    await seed(mine._id, other._id);

    const res = await request(app).get('/api/notifications/hospital').set(auth(token));
    expect(res.status).toBe(200);
    const titles = res.body.items.map((i) => i.title);
    expect(titles).toEqual(expect.arrayContaining([
      'Critical blood request', 'Blood request cancelled by the requester', 'New appointment booked',
      'Donor cancelled an appointment', 'Donor asked to reschedule', '1 donor booked for today', 'O- stock is critically low',
    ]));
    expect(JSON.stringify(res.body)).not.toMatch(/Not Mine|AB\+|B- is out of stock/);
    expect(res.body.items.filter((i) => i.type === 'stock')).toHaveLength(1); // A+ is above its minimum
    expect(res.body.items.every((i) => i.href.startsWith('/dashboard/hospital/'))).toBe(true);
    expect(res.body.unread).toBe(res.body.items.length);
    const times = res.body.items.map((i) => new Date(i.at).getTime());
    expect([...times].sort((a, b) => b - a)).toEqual(times);
  });

  test('marking seen clears the badge for that staff member only; new events are unread again', async () => {
    const mine = await createHospital();
    const a = await createHospitalStaff(mine._id);
    const b = await createHospitalStaff(mine._id, { email: 'staff2@test.com' });
    await BloodRequest.create({ hospital: mine._id, hospitalName: 'Calmette Hospital', patientName: 'Chan Dara', bloodType: 'O-', urgency: 'High', reason: 'x' });

    expect((await request(app).post('/api/notifications/hospital/seen').set(auth(a.token))).status).toBe(200);
    expect((await request(app).get('/api/notifications/hospital').set(auth(a.token))).body.unread).toBe(0);
    expect((await request(app).get('/api/notifications/hospital').set(auth(b.token))).body.unread).toBe(1);

    await new Promise((r) => setTimeout(r, 20));
    await Appointment.create(appt(mine._id, { fullName: 'New Booker', email: 'nb@test.com' }));
    const again = await request(app).get('/api/notifications/hospital').set(auth(a.token));
    expect(again.body.unread).toBe(1);
    expect(again.body.items[0]).toMatchObject({ title: 'New appointment booked', unread: true });
  });

  test('only hospital staff can read or mark the hospital feed', async () => {
    const { token: adminToken } = await createAdmin();
    const donorToken = signDonor({ _id: '666666666666666666666666', id: '666666666666666666666666', email: 'd@test.com', fullName: 'D' });
    expect((await request(app).get('/api/notifications/hospital')).status).toBe(401);
    expect((await request(app).get('/api/notifications/hospital').set(auth(adminToken))).status).toBe(403);
    expect((await request(app).get('/api/notifications/hospital').set(auth(donorToken))).status).toBe(403);
    expect((await request(app).post('/api/notifications/hospital/seen').set(auth(donorToken))).status).toBe(403);
  });
});
