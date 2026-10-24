const request = require('supertest');
const app = require('../src/app');
const Appointment = require('../src/appointments/appointment.model');
const { SLOT_CAPACITY } = require('../src/appointments/availability');
const { createHospital, createAdmin, createHospitalStaff, signDonor } = require('./helpers');

const day = (offset) => new Date(Date.now() + offset * 86400000).toISOString().slice(0, 10);
const DONOR_EMAIL = 'resched.donor@test.com';
const donorToken = (email = DONOR_EMAIL) => signDonor({ id: '64b000000000000000000abc', email, fullName: 'Resched Donor' });

const makeAppt = (hospital, over = {}) => Appointment.create({
  fullName: 'Resched Donor', email: DONOR_EMAIL, phone: '0911000000', bloodType: 'O+',
  date: day(5), time: '09:00 AM', location: hospital.name, hospital: hospital._id,
  status: 'Confirmed', confirmedAt: new Date(), ...over,
});

const ask = (appt, body, token = donorToken()) => request(app)
  .post(`/api/appointments/${appt._id}/reschedule-requests`)
  .set('Authorization', `Bearer ${token}`)
  .send({ date: day(8), time: '10:00 AM', reason: 'I have a family matter that day.', ...body });

const decide = (appt, requestId, token, body) => request(app)
  .patch(`/api/appointments/${appt._id}/reschedule-requests/${requestId}`)
  .set('Authorization', `Bearer ${token}`)
  .send(body);

describe('donor reschedule request (confirmed appointment)', () => {
  test('creates a pending request and leaves the appointment unchanged', async () => {
    const hospital = await createHospital();
    const appt = await makeAppt(hospital);
    const res = await ask(appt);
    expect(res.status).toBe(201);
    expect(res.body.date).toBe(day(5));
    expect(res.body.time).toBe('09:00 AM');
    const [r] = res.body.rescheduleRequests;
    expect(r).toMatchObject({ fromDate: day(5), fromTime: '09:00 AM', toDate: day(8), toTime: '10:00 AM', status: 'Pending' });
  });

  test('validates date, time slot and reason', async () => {
    const hospital = await createHospital();
    const appt = await makeAppt(hospital);
    expect((await ask(appt, { date: '2020-01-01' })).status).toBe(400);
    expect((await ask(appt, { date: 'soon' })).status).toBe(400);
    expect((await ask(appt, { time: '10:15 AM' })).status).toBe(400);
    expect((await ask(appt, { reason: '  ' })).status).toBe(400);
    expect((await ask(appt, { reason: 'x'.repeat(501) })).status).toBe(400);
    expect((await ask(appt, { date: day(5), time: '09:00 AM' })).status).toBe(400); // same as now
    expect((await Appointment.findById(appt._id)).rescheduleRequests).toHaveLength(0);
  });

  test('refuses a second request while one is pending', async () => {
    const hospital = await createHospital();
    const appt = await makeAppt(hospital);
    expect((await ask(appt)).status).toBe(201);
    const again = await ask(appt, { date: day(9) });
    expect(again.status).toBe(409);
    expect((await Appointment.findById(appt._id)).rescheduleRequests).toHaveLength(1);
  });

  test('another donor cannot request a change to someone else\'s appointment', async () => {
    const hospital = await createHospital();
    const appt = await makeAppt(hospital);
    const res = await ask(appt, {}, donorToken('someone.else@test.com'));
    expect(res.status).toBe(404);
  });

  test('refuses after check-in or cancellation', async () => {
    const hospital = await createHospital();
    const checkedIn = await makeAppt(hospital, { status: 'CheckedIn', checkedInAt: new Date() });
    const cancelled = await makeAppt(hospital, { status: 'Cancelled', date: day(6) });
    expect((await ask(checkedIn)).status).toBe(409);
    expect((await ask(cancelled)).status).toBe(409);
  });

  test('refuses a full slot', async () => {
    const hospital = await createHospital();
    const appt = await makeAppt(hospital);
    await Promise.all(Array.from({ length: SLOT_CAPACITY }, (_, i) => makeAppt(hospital, {
      email: `other${i}@test.com`, date: day(8), time: '10:00 AM',
    })));
    const res = await ask(appt);
    expect(res.status).toBe(409);
    expect(res.body.error).toMatch(/fully booked/i);
  });

  test('pending appointments must be changed directly, not by request', async () => {
    const hospital = await createHospital();
    const appt = await makeAppt(hospital, { status: 'Pending', confirmedAt: null });
    const res = await ask(appt);
    expect(res.status).toBe(409);
    expect(res.body.code).toBe('USE_DIRECT_CHANGE');
  });
});

describe('hospital decision on a reschedule request', () => {
  test('approval moves the appointment and records the reviewer', async () => {
    const hospital = await createHospital();
    const { staff, token } = await createHospitalStaff(hospital._id);
    const appt = await makeAppt(hospital);
    const { body } = await ask(appt);
    const requestId = body.rescheduleRequests[0]._id;

    const res = await decide(appt, requestId, token, { decision: 'approve' });
    expect(res.status).toBe(200);
    expect(res.body.date).toBe(day(8));
    expect(res.body.time).toBe('10:00 AM');
    expect(res.body.status).toBe('Confirmed');
    expect(res.body.rescheduledAt).toBeTruthy();
    const r = res.body.rescheduleRequests[0];
    expect(r.status).toBe('Approved');
    expect(String(r.reviewedBy)).toBe(String(staff._id));
    expect(r.reviewedAt).toBeTruthy();
    expect(r.fromDate).toBe(day(5)); // history keeps the original

    // A decided request can't be decided again.
    expect((await decide(appt, requestId, token, { decision: 'reject' })).status).toBe(409);
  });

  test('rejection keeps the original appointment and the note', async () => {
    const hospital = await createHospital();
    const { token } = await createHospitalStaff(hospital._id);
    const appt = await makeAppt(hospital);
    const { body } = await ask(appt);
    const res = await decide(appt, body.rescheduleRequests[0]._id, token, { decision: 'reject', note: 'We are closed that day.' });
    expect(res.status).toBe(200);
    expect(res.body.date).toBe(day(5));
    expect(res.body.time).toBe('09:00 AM');
    expect(res.body.rescheduleRequests[0]).toMatchObject({ status: 'Rejected', decisionNote: 'We are closed that day.' });
    // The donor may ask again after a rejection.
    expect((await ask(appt, { date: day(9) })).status).toBe(201);
  });

  test('approval re-checks availability on the server', async () => {
    const hospital = await createHospital();
    const { token } = await createHospitalStaff(hospital._id);
    const appt = await makeAppt(hospital);
    const { body } = await ask(appt);
    // The slot fills up after the donor asked.
    await Promise.all(Array.from({ length: SLOT_CAPACITY }, (_, i) => makeAppt(hospital, {
      email: `late${i}@test.com`, date: day(8), time: '10:00 AM',
    })));
    const res = await decide(appt, body.rescheduleRequests[0]._id, token, { decision: 'approve' });
    expect(res.status).toBe(409);
    expect(res.body.code).toBe('SLOT_UNAVAILABLE');
    const reloaded = await Appointment.findById(appt._id);
    expect(reloaded.date).toBe(day(5));
    expect(reloaded.rescheduleRequests[0].status).toBe('Pending');
  });

  test('staff of another hospital and donors cannot decide', async () => {
    const hospitalA = await createHospital({ name: 'Hospital A' });
    const hospitalB = await createHospital({ name: 'Hospital B' });
    const { token: otherStaff } = await createHospitalStaff(hospitalB._id, { email: 'b.staff@test.com' });
    const appt = await makeAppt(hospitalA);
    const { body } = await ask(appt);
    const requestId = body.rescheduleRequests[0]._id;
    expect((await decide(appt, requestId, otherStaff, { decision: 'approve' })).status).toBe(403);
    expect((await decide(appt, requestId, donorToken(), { decision: 'approve' })).status).toBe(403);
    expect((await Appointment.findById(appt._id)).date).toBe(day(5));
  });

  test('admin can decide any hospital\'s request', async () => {
    const hospital = await createHospital();
    const { token } = await createAdmin();
    const appt = await makeAppt(hospital);
    const { body } = await ask(appt);
    const res = await decide(appt, body.rescheduleRequests[0]._id, token, { decision: 'approve' });
    expect(res.status).toBe(200);
    expect(res.body.rescheduleRequests[0].reviewerRole).toBe('admin');
  });

  test('check-in closes a pending request', async () => {
    const hospital = await createHospital();
    const { token } = await createHospitalStaff(hospital._id);
    const appt = await makeAppt(hospital);
    await ask(appt);
    const res = await request(app).patch(`/api/appointments/${appt._id}/check-in`).set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.rescheduleRequests[0].status).toBe('Withdrawn');
  });

  test('the donor feed reports the decision', async () => {
    const hospital = await createHospital();
    const { token } = await createHospitalStaff(hospital._id);
    const appt = await makeAppt(hospital);
    const { body } = await ask(appt);
    await decide(appt, body.rescheduleRequests[0]._id, token, { decision: 'approve' });
    const feed = await request(app).get('/api/notifications').set('Authorization', `Bearer ${donorToken()}`);
    expect(feed.status).toBe(200);
    expect(feed.body.items.map((i) => i.title)).toContain('Hospital approved the new date');
  });
});

describe('donor direct change, withdraw and cancel', () => {
  test('a pending appointment moves straight away and keeps history', async () => {
    const hospital = await createHospital();
    const appt = await makeAppt(hospital, { status: 'Pending', confirmedAt: null });
    const res = await request(app).patch(`/api/appointments/${appt._id}/schedule`)
      .set('Authorization', `Bearer ${donorToken()}`).send({ date: day(7), time: '02:00 PM' });
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ date: day(7), time: '02:00 PM', status: 'Pending' });
    expect(res.body.rescheduleRequests[0]).toMatchObject({ fromDate: day(5), toDate: day(7), status: 'Approved', reviewerRole: 'system' });
  });

  test('a confirmed appointment cannot be moved directly', async () => {
    const hospital = await createHospital();
    const appt = await makeAppt(hospital);
    const res = await request(app).patch(`/api/appointments/${appt._id}/schedule`)
      .set('Authorization', `Bearer ${donorToken()}`).send({ date: day(7), time: '02:00 PM' });
    expect(res.status).toBe(409);
    expect(res.body.code).toBe('NEEDS_REQUEST');
    expect((await Appointment.findById(appt._id)).date).toBe(day(5));
  });

  test('a donor cannot double-book a day', async () => {
    const hospital = await createHospital();
    const appt = await makeAppt(hospital, { status: 'Pending', confirmedAt: null });
    await makeAppt(hospital, { date: day(7), time: '11:00 AM' });
    const res = await request(app).patch(`/api/appointments/${appt._id}/schedule`)
      .set('Authorization', `Bearer ${donorToken()}`).send({ date: day(7), time: '02:00 PM' });
    expect(res.status).toBe(409);
  });

  test('withdrawing a pending request', async () => {
    const hospital = await createHospital();
    const appt = await makeAppt(hospital);
    const { body } = await ask(appt);
    const id = body.rescheduleRequests[0]._id;
    const res = await request(app).delete(`/api/appointments/${appt._id}/reschedule-requests/${id}`)
      .set('Authorization', `Bearer ${donorToken()}`);
    expect(res.status).toBe(200);
    expect(res.body.rescheduleRequests[0].status).toBe('Withdrawn');
    expect((await request(app).delete(`/api/appointments/${appt._id}/reschedule-requests/${id}`)
      .set('Authorization', `Bearer ${donorToken()}`)).status).toBe(409);
  });

  test('cancel: own appointment only, closes open requests, not after check-in', async () => {
    const hospital = await createHospital();
    const appt = await makeAppt(hospital);
    await ask(appt);
    expect((await request(app).post(`/api/appointments/${appt._id}/cancel`)
      .set('Authorization', `Bearer ${donorToken('intruder@test.com')}`)).status).toBe(404);
    const res = await request(app).post(`/api/appointments/${appt._id}/cancel`)
      .set('Authorization', `Bearer ${donorToken()}`).send({ reason: 'Feeling unwell' });
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ status: 'Cancelled', cancelledBy: 'donor', cancellationReason: 'Feeling unwell' });
    expect(res.body.rescheduleRequests[0].status).toBe('Withdrawn');

    const done = await makeAppt(hospital, { status: 'CheckedIn', checkedInAt: new Date(), date: day(6) });
    expect((await request(app).post(`/api/appointments/${done._id}/cancel`)
      .set('Authorization', `Bearer ${donorToken()}`)).status).toBe(409);
  });
});

describe('GET /api/appointments/availability', () => {
  test('reports remaining places per slot', async () => {
    const hospital = await createHospital();
    await makeAppt(hospital, { date: day(8), time: '10:00 AM' });
    const res = await request(app).get(`/api/appointments/availability?hospital=${hospital._id}&date=${day(8)}`);
    expect(res.status).toBe(200);
    const slot = res.body.slots.find((s) => s.time === '10:00 AM');
    expect(slot).toMatchObject({ booked: 1, remaining: SLOT_CAPACITY - 1, available: true });
    expect(res.body.slots[0]).not.toHaveProperty('email');
  });

  test('rejects a bad hospital or date', async () => {
    expect((await request(app).get('/api/appointments/availability?hospital=nope&date=2030-01-01')).status).toBe(400);
    const hospital = await createHospital();
    expect((await request(app).get(`/api/appointments/availability?hospital=${hospital._id}&date=2020-01-01`)).status).toBe(400);
  });
});
