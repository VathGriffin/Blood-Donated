const request = require('supertest');
const app = require('../src/app');
const Appointment = require('../src/appointments/appointment.model');
const Hospital = require('../src/hospital/hospital.model');
const BloodRequest = require('../src/requests/blood-request.model');
const { createAdmin, createHospital, createHospitalStaff, signDonor, signStaff } = require('./helpers');

const appt = (over = {}) => ({
  fullName: 'Sok Dara', email: 'dara@test.com', phone: '0912345678', bloodType: 'O+',
  date: '2027-01-01', time: '10:00 AM', location: 'Somewhere', ...over,
});
const bearer = (token) => ({ Authorization: `Bearer ${token}` });
const donorToken = (email) => signDonor({ id: '64b000000000000000000001', email, fullName: 'Donor' });

describe('GET /api/appointments is no longer public', () => {
  let hospitalA, hospitalB, mine, theirs, otherHospitals;
  beforeEach(async () => {
    hospitalA = await createHospital({ name: 'Hospital A' });
    hospitalB = await createHospital({ name: 'Hospital B' });
    mine = await Appointment.create(appt({ email: 'me@test.com', hospital: hospitalA._id }));
    theirs = await Appointment.create(appt({ email: 'other@test.com', hospital: hospitalB._id }));
    otherHospitals = [mine, theirs];
  });

  test('anonymous visitors get 401 on the list and on a single appointment', async () => {
    expect((await request(app).get('/api/appointments')).status).toBe(401);
    expect((await request(app).get('/api/appointments?email=me@test.com')).status).toBe(401);
    expect((await request(app).get(`/api/appointments/${mine._id}`)).status).toBe(401);
  });

  test('a donor sees only their own appointments, whatever they ask for', async () => {
    const res = await request(app).get('/api/appointments').set(bearer(donorToken('Me@Test.com'))); // case-insensitive
    expect(res.status).toBe(200);
    expect(res.body.map((a) => a._id)).toEqual([String(mine._id)]);

    const own = await request(app).get('/api/appointments?email=me@test.com').set(bearer(donorToken('me@test.com')));
    expect(own.status).toBe(200);
    const other = await request(app).get('/api/appointments?email=other@test.com').set(bearer(donorToken('me@test.com')));
    expect(other.status).toBe(403);
    const byHospital = await request(app).get(`/api/appointments?hospital=${hospitalB._id}`).set(bearer(donorToken('me@test.com')));
    expect(byHospital.status).toBe(403);
  });

  test('a donor can open their own appointment but not someone else\'s (404, so ids can\'t be probed)', async () => {
    const token = donorToken('me@test.com');
    expect((await request(app).get(`/api/appointments/${mine._id}`).set(bearer(token))).status).toBe(200);
    expect((await request(app).get(`/api/appointments/${theirs._id}`).set(bearer(token))).status).toBe(404);
  });

  test('hospital staff see only their own hospital\'s appointments', async () => {
    const { token } = await createHospitalStaff(hospitalA._id);
    const list = await request(app).get('/api/appointments').set(bearer(token));
    expect(list.body.map((a) => a._id)).toEqual([String(mine._id)]);

    const own = await request(app).get(`/api/appointments?hospital=${hospitalA._id}`).set(bearer(token));
    expect(own.status).toBe(200);
    const foreign = await request(app).get(`/api/appointments?hospital=${hospitalB._id}`).set(bearer(token));
    expect(foreign.status).toBe(403);

    expect((await request(app).get(`/api/appointments/${mine._id}`).set(bearer(token))).status).toBe(200);
    expect((await request(app).get(`/api/appointments/${theirs._id}`).set(bearer(token))).status).toBe(404);
  });

  test('a staff token with no hospital cannot list everything', async () => {
    const orphan = signStaff({ _id: '64b0000000000000000000aa', email: 's@test.com', fullName: 'S', role: 'hospital_staff' });
    expect((await request(app).get('/api/appointments').set(bearer(orphan))).status).toBe(403);
  });

  test('an admin sees everything and can filter', async () => {
    const { token } = await createAdmin();
    const all = await request(app).get('/api/appointments').set(bearer(token));
    expect(all.body).toHaveLength(otherHospitals.length);
    const byHospital = await request(app).get(`/api/appointments?hospital=${hospitalB._id}`).set(bearer(token));
    expect(byHospital.body.map((a) => a._id)).toEqual([String(theirs._id)]);
    const byEmail = await request(app).get('/api/appointments?email=OTHER@test.com').set(bearer(token));
    expect(byEmail.body.map((a) => a._id)).toEqual([String(theirs._id)]);
    expect((await request(app).get(`/api/appointments/${theirs._id}`).set(bearer(token))).status).toBe(200);
  });

  test('a stale or garbage token is refused', async () => {
    expect((await request(app).get('/api/appointments').set(bearer('not-a-token'))).status).toBe(401);
  });
});

describe('GET /api/hospitals only shows the public directory fields to non-admins', () => {
  const PRIVATE = ['email', 'licenseNumber', 'createdAt', 'updatedAt', '__v'];
  let hospital;
  beforeEach(async () => {
    hospital = await Hospital.create({
      name: 'Calmette Hospital', address: 'Monivong Blvd', city: 'Phnom Penh', phone: '023 426 948',
      email: 'private@calmette.org', licenseNumber: 'LIC-777', location: { lat: 11.55, lng: 104.92 },
    });
  });

  test('anonymous list and detail carry only name, address, city, phone and location', async () => {
    const list = await request(app).get('/api/hospitals');
    expect(list.status).toBe(200);
    expect(list.body[0]).toMatchObject({ name: 'Calmette Hospital', address: 'Monivong Blvd', city: 'Phnom Penh', phone: '023 426 948', location: { lat: 11.55, lng: 104.92 } });
    const one = await request(app).get(`/api/hospitals/${hospital._id}`);
    expect(one.status).toBe(200);
    for (const body of [list.body[0], one.body]) for (const field of PRIVATE) expect(body[field]).toBeUndefined();
    expect(JSON.stringify([list.body, one.body])).not.toMatch(/private@calmette|LIC-777/);
  });

  test('hospital staff and donors get the public view too', async () => {
    const { token } = await createHospitalStaff(hospital._id);
    for (const t of [token, donorToken('d@test.com')]) {
      const res = await request(app).get('/api/hospitals').set(bearer(t));
      expect(res.body[0].email).toBeUndefined();
      expect(res.body[0].licenseNumber).toBeUndefined();
    }
  });

  test('an admin still gets every field (the admin Hospitals page needs them)', async () => {
    const { token } = await createAdmin();
    const list = await request(app).get('/api/hospitals').set(bearer(token));
    expect(list.body[0]).toMatchObject({ email: 'private@calmette.org', licenseNumber: 'LIC-777' });
    const one = await request(app).get(`/api/hospitals/${hospital._id}`).set(bearer(token));
    expect(one.body.licenseNumber).toBe('LIC-777');
  });

  test('a bad id is still a clean 400, an unknown one a 404', async () => {
    expect((await request(app).get('/api/hospitals/not-an-id')).status).toBe(400);
    expect((await request(app).get('/api/hospitals/64b0000000000000000000ff')).status).toBe(404);
  });
});

const req_ = (over = {}) => ({
  hospitalName: 'Calmette Hospital', patientName: 'Sensitive Patient', bloodType: 'O+', unitsNeeded: 2,
  urgency: 'High', reason: 'Surgery', contact: '099999999', userEmail: 'me@test.com', ...over,
});

describe('GET /api/requests is no longer public', () => {
  let hospitalA, hospitalB, mine, theirs;
  beforeEach(async () => {
    hospitalA = await createHospital({ name: 'Hospital A' });
    hospitalB = await createHospital({ name: 'Hospital B' });
    mine = await BloodRequest.create(req_({ userEmail: 'me@test.com', hospital: hospitalA._id }));
    theirs = await BloodRequest.create(req_({ userEmail: 'other@test.com', hospital: hospitalB._id, patientName: 'Other Patient' }));
  });

  test('anonymous visitors get 401 and never see patient details', async () => {
    for (const url of ['/api/requests', '/api/requests?email=me@test.com', `/api/requests?hospital=${hospitalA._id}`, `/api/requests/${mine._id}`]) {
      const res = await request(app).get(url);
      expect(res.status).toBe(401);
      expect(JSON.stringify(res.body)).not.toMatch(/Sensitive Patient|099999999/);
    }
  });

  test('a donor sees only requests filed under their own account', async () => {
    const token = donorToken('Me@Test.com');
    const list = await request(app).get('/api/requests').set(bearer(token));
    expect(list.body.map((r) => r._id)).toEqual([String(mine._id)]);
    expect((await request(app).get('/api/requests?email=other@test.com').set(bearer(token))).status).toBe(403);
    expect((await request(app).get(`/api/requests?hospital=${hospitalB._id}`).set(bearer(token))).status).toBe(403);
    expect((await request(app).get(`/api/requests/${mine._id}`).set(bearer(token))).status).toBe(200);
    expect((await request(app).get(`/api/requests/${theirs._id}`).set(bearer(token))).status).toBe(404);
  });

  test('hospital staff see only their own hospital\'s requests', async () => {
    const { token } = await createHospitalStaff(hospitalA._id);
    const list = await request(app).get('/api/requests').set(bearer(token));
    expect(list.body.map((r) => r._id)).toEqual([String(mine._id)]);
    expect((await request(app).get(`/api/requests?hospital=${hospitalA._id}`).set(bearer(token))).status).toBe(200);
    expect((await request(app).get(`/api/requests?hospital=${hospitalB._id}`).set(bearer(token))).status).toBe(403);
    expect((await request(app).get(`/api/requests/${theirs._id}`).set(bearer(token))).status).toBe(404);
    const orphan = signStaff({ _id: '64b0000000000000000000aa', email: 's@test.com', fullName: 'S', role: 'hospital_staff' });
    expect((await request(app).get('/api/requests').set(bearer(orphan))).status).toBe(403);
  });

  test('an admin sees everything and can filter', async () => {
    const { token } = await createAdmin();
    expect((await request(app).get('/api/requests').set(bearer(token))).body).toHaveLength(2);
    const byHospital = await request(app).get(`/api/requests?hospital=${hospitalB._id}`).set(bearer(token));
    expect(byHospital.body.map((r) => r._id)).toEqual([String(theirs._id)]);
    expect((await request(app).get(`/api/requests/${theirs._id}`).set(bearer(token))).status).toBe(200);
  });
});

describe('POST /api/requests only saves the fields a requester may set', () => {
  const submit = (body, token) => {
    const r = request(app).post('/api/requests');
    if (token) r.set(bearer(token));
    return r.send(body);
  };
  const form = { hospitalName: 'Calmette Hospital', patientName: 'Sok Dara', bloodType: 'O+', unitsNeeded: 2, urgency: 'High', reason: 'Surgery', contact: '0912345678' };

  test('status, fulfilment fields, photo and hospital link cannot be forced by a visitor', async () => {
    const hospital = await createHospital();
    const res = await submit({
      ...form, status: 'Fulfilled', fulfilledAt: '2020-01-01', fulfilledBy: '64b000000000000000000001',
      photo: '/uploads/evil.png', hospital: String(hospital._id), _id: '64b000000000000000000002',
    });
    expect(res.status).toBe(201);
    expect(res.body).toMatchObject({ status: 'Pending', fulfilledAt: null, fulfilledBy: null, photo: null, hospital: null });
    expect(res.body._id).not.toBe('64b000000000000000000002');
  });

  test('a visitor cannot file a request into someone else\'s profile', async () => {
    const res = await submit({ ...form, userEmail: 'victim@test.com' });
    expect(res.status).toBe(201);
    expect(res.body.userEmail).toBe('');
  });

  test('a signed-in donor\'s request is tied to their token email, whatever the body says', async () => {
    const res = await submit({ ...form, userEmail: 'victim@test.com' }, donorToken('me@test.com'));
    expect(res.body.userEmail).toBe('me@test.com');
    const mine = await request(app).get('/api/requests').set(bearer(donorToken('me@test.com')));
    expect(mine.body.map((r) => r._id)).toContain(res.body._id);
  });

  test('validation still applies', async () => {
    expect((await submit({ ...form, bloodType: 'Z+' })).status).toBe(400);
    expect((await submit({ ...form, patientName: '' })).status).toBe(400);
  });
});
