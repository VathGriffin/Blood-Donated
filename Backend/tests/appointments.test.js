const request = require('supertest');
const app = require('../src/app');
const Donor = require('../src/donor/donor.model');
const Appointment = require('../src/appointments/appointment.model');
const { createHospital, createAdmin, createHospitalStaff } = require('./helpers');

describe('appointment confirm + check-in', () => {
  test('confirm then check-in updates donation history on the matching donor', async () => {
    const hospital = await createHospital();
    const { token } = await createHospitalStaff(hospital._id);

    const donor = await Donor.create({
      fullName: 'Appt Donor', email: 'appt.donor@test.com', phone: '0987654321',
      bloodType: 'B-', location: 'Phnom Penh', donationCount: 2,
    });

    const appt = await Appointment.create({
      fullName: donor.fullName, email: donor.email, phone: donor.phone, bloodType: 'B-',
      date: '2026-09-01', time: '10:00', location: hospital.name, hospital: hospital._id,
      status: 'Pending',
    });

    const confirm = await request(app)
      .put(`/api/appointments/${appt._id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ status: 'Confirmed' });
    expect(confirm.status).toBe(200);
    expect(confirm.body.status).toBe('Confirmed');

    const checkIn = await request(app)
      .patch(`/api/appointments/${appt._id}/check-in`)
      .set('Authorization', `Bearer ${token}`);
    expect(checkIn.status).toBe(200);
    expect(checkIn.body.status).toBe('CheckedIn');

    const reloadedDonor = await Donor.findById(donor._id);
    expect(reloadedDonor.donationCount).toBe(3);
    expect(reloadedDonor.donationHistory.length).toBe(1);
    expect(reloadedDonor.lastDonation).toBeTruthy();
  });

  test('cannot check in the same appointment twice', async () => {
    const hospital = await createHospital();
    const { token } = await createHospitalStaff(hospital._id);
    const appt = await Appointment.create({
      fullName: 'X', email: 'x@test.com', phone: '0911111111', bloodType: 'O-',
      date: '2026-09-02', time: '11:00', location: hospital.name, hospital: hospital._id,
      status: 'CheckedIn', checkedInAt: new Date(),
    });
    const res = await request(app)
      .patch(`/api/appointments/${appt._id}/check-in`)
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(400);
  });

  test('hospital_staff cannot check in another hospital\'s appointment', async () => {
    const hospitalA = await createHospital({ name: 'Hospital A' });
    const hospitalB = await createHospital({ name: 'Hospital B' });
    const { token } = await createHospitalStaff(hospitalA._id, { email: 'staffA2@test.com' });
    const appt = await Appointment.create({
      fullName: 'Y', email: 'y@test.com', phone: '0922222222', bloodType: 'AB-',
      date: '2026-09-03', time: '12:00', location: hospitalB.name, hospital: hospitalB._id,
      status: 'Pending',
    });
    const res = await request(app)
      .patch(`/api/appointments/${appt._id}/check-in`)
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(403);
  });
});

describe('POST /api/appointments (public booking)', () => {
  const future = () => new Date(Date.now() + 5 * 86400000).toISOString().slice(0, 10);
  const booking = (over = {}) => ({
    fullName: 'Sok Dara', email: 'dara@test.com', phone: '0912345678', bloodType: 'O+',
    date: future(), time: '10:00 AM', location: 'Somewhere', ...over,
  });

  test('links the booking to a real hospital and uses that hospital\'s name as the location', async () => {
    const hospital = await createHospital({ name: 'Calmette Hospital' });
    const res = await request(app).post('/api/appointments').send(booking({ hospital: String(hospital._id), location: 'client-typed text' }));
    expect(res.status).toBe(201);
    expect(String(res.body.hospital)).toBe(String(hospital._id));
    expect(res.body.location).toBe('Calmette Hospital');

    // ...which is what makes it visible to that hospital's staff dashboard
    const { token } = await createHospitalStaff(hospital._id);
    const list = await request(app).get('/api/appointments').set('Authorization', `Bearer ${token}`);
    expect(list.body.map((a) => a._id)).toContain(res.body._id);
  });

  test('still accepts a plain center name when no hospital id is given', async () => {
    const res = await request(app).post('/api/appointments').send(booking({ location: 'Calmette Hospital' }));
    expect(res.status).toBe(201);
    expect(res.body.hospital).toBeNull();
    expect(res.body.location).toBe('Calmette Hospital');
  });

  test('a visitor cannot set status, check-in fields or an id', async () => {
    const res = await request(app).post('/api/appointments').send(booking({
      status: 'CheckedIn', checkedInAt: '2020-01-01', checkedInBy: '64b000000000000000000001', _id: '64b000000000000000000002',
    }));
    expect(res.status).toBe(201);
    expect(res.body.status).toBe('Pending');
    expect(res.body.checkedInAt).toBeNull();
    expect(res.body.checkedInBy).toBeNull();
    expect(res.body._id).not.toBe('64b000000000000000000002');
  });

  test('rejects an unknown or malformed hospital id', async () => {
    for (const hospital of ['64b0000000000000000000ff', 'not-an-id']) {
      const res = await request(app).post('/api/appointments').send(booking({ hospital }));
      expect(res.status).toBe(400);
      expect(res.body.error).toMatch(/could not be found/i);
    }
  });

  test('rejects past, impossible and malformed dates, and malformed times', async () => {
    for (const date of ['2020-01-01', '2026-02-30', 'tomorrow', '', undefined]) {
      expect((await request(app).post('/api/appointments').send(booking({ date }))).status).toBe(400);
    }
    for (const time of ['10:00', 'noon', '', undefined]) {
      expect((await request(app).post('/api/appointments').send(booking({ time }))).status).toBe(400);
    }
  });

  test('still enforces the required contact fields', async () => {
    const res = await request(app).post('/api/appointments').send(booking({ email: undefined }));
    expect(res.status).toBe(400);
  });
});

describe('PUT /api/appointments/:id (status changes)', () => {
  const makeAppt = (hospital, over = {}) => Appointment.create({
    fullName: 'Status Donor', email: 'status@test.com', phone: '0933333333', bloodType: 'A+',
    date: '2026-09-05', time: '09:00 AM', location: hospital.name, hospital: hospital._id,
    status: 'Pending', ...over,
  });

  test('admin can confirm and cancel an appointment', async () => {
    const hospital = await createHospital();
    const { token } = await createAdmin();
    const appt = await makeAppt(hospital);
    for (const status of ['Confirmed', 'Cancelled', 'Pending']) {
      const res = await request(app).put(`/api/appointments/${appt._id}`)
        .set('Authorization', `Bearer ${token}`).send({ status });
      expect(res.status).toBe(200);
      expect(res.body.status).toBe(status);
    }
  });

  test('ignores every field except status', async () => {
    const hospitalA = await createHospital({ name: 'Hospital A' });
    const hospitalB = await createHospital({ name: 'Hospital B' });
    const { token } = await createHospitalStaff(hospitalA._id, { email: 'staffput@test.com' });
    const appt = await makeAppt(hospitalA);
    const res = await request(app).put(`/api/appointments/${appt._id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ status: 'Confirmed', hospital: hospitalB._id, email: 'someone@else.com', checkedInAt: new Date() });
    expect(res.status).toBe(200);
    const reloaded = await Appointment.findById(appt._id);
    expect(String(reloaded.hospital)).toBe(String(hospitalA._id));
    expect(reloaded.email).toBe('status@test.com');
    expect(reloaded.checkedInAt).toBeNull();
  });

  test('refuses CheckedIn and unknown statuses — check-in has its own endpoint', async () => {
    const hospital = await createHospital();
    const { token } = await createAdmin();
    const appt = await makeAppt(hospital);
    for (const status of ['CheckedIn', 'Completed', undefined]) {
      const res = await request(app).put(`/api/appointments/${appt._id}`)
        .set('Authorization', `Bearer ${token}`).send({ status });
      expect(res.status).toBe(400);
    }
    expect((await Appointment.findById(appt._id)).status).toBe('Pending');
  });

  test('a checked-in appointment can no longer be changed', async () => {
    const hospital = await createHospital();
    const { token } = await createAdmin();
    const appt = await makeAppt(hospital, { status: 'CheckedIn', checkedInAt: new Date() });
    const res = await request(app).put(`/api/appointments/${appt._id}`)
      .set('Authorization', `Bearer ${token}`).send({ status: 'Cancelled' });
    expect(res.status).toBe(409);
  });
});

describe('DELETE /api/appointments/:id', () => {
  test('only an admin can delete', async () => {
    const hospital = await createHospital();
    const staff = await createHospitalStaff(hospital._id, { email: 'staffdel@test.com' });
    const admin = await createAdmin();
    const appt = await Appointment.create({
      fullName: 'Del', email: 'del@test.com', phone: '0944444444', bloodType: 'O+',
      date: '2026-09-06', time: '09:00 AM', location: hospital.name, hospital: hospital._id,
    });
    const asStaff = await request(app).delete(`/api/appointments/${appt._id}`).set('Authorization', `Bearer ${staff.token}`);
    expect(asStaff.status).toBe(403);
    const asAdmin = await request(app).delete(`/api/appointments/${appt._id}`).set('Authorization', `Bearer ${admin.token}`);
    expect(asAdmin.status).toBe(200);
    expect(await Appointment.findById(appt._id)).toBeNull();
  });
});
