const request = require('supertest');
const app = require('../src/app');
const BloodRequest = require('../src/requests/blood-request.model');
const Inventory = require('../src/inventory/inventory.model');
const Donor = require('../src/donor/donor.model');
const { signDonor, createHospital, createHospitalStaff } = require('./helpers');

const DONOR = { _id: '666666666666666666666666', email: 'requester@test.com', fullName: 'Requester' };
const donorToken = signDonor(DONOR);
const otherToken = signDonor({ _id: '777777777777777777777777', email: 'other@test.com', fullName: 'Other' });

const inDays = (n) => new Date(Date.now() + n * 86400000).toISOString();
const submit = (body, token = donorToken) => {
  const r = request(app).post('/api/requests');
  if (token) r.set('Authorization', `Bearer ${token}`);
  return r.send(body);
};

let hospital;
let form;
beforeEach(async () => {
  hospital = await createHospital({ name: 'Calmette Hospital' });
  form = {
    hospitalId: String(hospital._id), patientName: 'Sok Dara', patientAge: 32, bloodType: 'O+',
    component: 'Whole Blood', unitsNeeded: 2, urgency: 'High', requiredBy: inDays(3),
    reason: 'Emergency surgery', contact: '0912345678',
  };
});

describe('submitting a blood request', () => {
  test('a valid request is saved as Pending, owned by the signed-in donor and linked to the hospital', async () => {
    const res = await submit({ ...form, userEmail: 'someone-else@test.com', status: 'Approved' });
    expect(res.status).toBe(201);
    expect(res.body).toMatchObject({
      status: 'Pending', userEmail: DONOR.email, hospital: String(hospital._id), hospitalName: 'Calmette Hospital',
      patientAge: 32, component: 'Whole Blood', unitsNeeded: 2,
    });
    expect(new Date(res.body.requiredBy).toISOString()).toBe(form.requiredBy);
  });

  test('the hospital name comes from the registered hospital, not the client', async () => {
    const res = await submit({ ...form, hospitalName: 'Made Up Hospital' });
    expect(res.status).toBe(201);
    expect(res.body.hospitalName).toBe('Calmette Hospital');
  });

  test('an unknown or malformed hospital id is refused', async () => {
    expect((await submit({ ...form, hospitalId: '64b000000000000000000009' })).status).toBe(400);
    expect((await submit({ ...form, hospitalId: 'not-an-id' })).status).toBe(400);
    expect(await BloodRequest.countDocuments()).toBe(0);
  });

  test('age, component and required-by are optional', async () => {
    const { patientAge, component, requiredBy, ...rest } = form;
    const res = await submit({ ...rest, patientAge: null, requiredBy: null });
    expect(res.status).toBe(201);
    expect(res.body).toMatchObject({ patientAge: null, component: 'Whole Blood', requiredBy: null });
  });

  test.each([
    ['blood type', { bloodType: 'Z+' }],
    ['component', { component: 'Bone Marrow' }],
    ['zero units', { unitsNeeded: 0 }],
    ['too many units', { unitsNeeded: 11 }],
    ['fractional units', { unitsNeeded: 1.5 }],
    ['urgency', { urgency: 'Whenever' }],
    ['age', { patientAge: 130 }],
    ['negative age', { patientAge: -1 }],
    ['date text', { requiredBy: 'tomorrow' }],
    ['past date', { requiredBy: inDays(-2) }],
    ['date too far ahead', { requiredBy: inDays(400) }],
    ['missing patient', { patientName: '   ' }],
    ['missing reason', { reason: '' }],
    ['over-long reason', { reason: 'x'.repeat(1001) }],
  ])('rejects an invalid %s with a readable message', async (_, change) => {
    const res = await submit({ ...form, ...change });
    expect(res.status).toBe(400);
    expect(typeof res.body.message).toBe('string');
    expect(await BloodRequest.countDocuments()).toBe(0);
  });

  test('the same request sent twice in a row is stored once', async () => {
    const [a, b] = [await submit(form), await submit({ ...form, patientName: ' sok dara ' })];
    expect(a.status).toBe(201);
    expect(b.status).toBe(409);
    expect(b.body.duplicateOf).toBe(a.body._id);
    expect(await BloodRequest.countDocuments()).toBe(1);
  });

  test('a different donor, patient or blood type is not treated as a duplicate', async () => {
    expect((await submit(form)).status).toBe(201);
    expect((await submit(form, otherToken)).status).toBe(201);
    expect((await submit({ ...form, patientName: 'Another Patient' })).status).toBe(201);
    expect((await submit({ ...form, bloodType: 'A+' })).status).toBe(201);
  });

  test('re-submitting after the earlier request was cancelled is allowed', async () => {
    const first = await submit(form);
    await BloodRequest.updateOne({ _id: first.body._id }, { status: 'Cancelled' });
    expect((await submit(form)).status).toBe(201);
  });

  test('submitting does not touch inventory or the donor record', async () => {
    await Inventory.create({ bloodType: 'O+', hospital: hospital._id, units: 9 });
    const lastDonation = new Date('2026-01-15T00:00:00Z');
    await Donor.create({
      fullName: 'Requester', email: DONOR.email, phone: '0912345678', bloodType: 'O+', location: 'Phnom Penh',
      lastDonation, donationCount: 4,
    });

    expect((await submit(form)).status).toBe(201);

    expect((await Inventory.findOne({ bloodType: 'O+', hospital: hospital._id })).units).toBe(9);
    const donor = await Donor.findOne({ email: DONOR.email }).lean();
    expect(donor.donationCount).toBe(4);
    expect(donor.lastDonation.toISOString()).toBe(lastDonation.toISOString());
  });

  test("the new request reaches that hospital's staff, and only its owner among donors", async () => {
    const created = (await submit(form)).body;
    const { token: staffToken } = await createHospitalStaff(hospital._id);
    const staffList = await request(app).get('/api/requests').set('Authorization', `Bearer ${staffToken}`);
    expect(staffList.body.map((r) => r._id)).toContain(created._id);

    const mine = await request(app).get('/api/requests').set('Authorization', `Bearer ${donorToken}`);
    expect(mine.body.map((r) => r._id)).toEqual([created._id]);
    const theirs = await request(app).get('/api/requests').set('Authorization', `Bearer ${otherToken}`);
    expect(theirs.body).toEqual([]);
    expect((await request(app).get(`/api/requests/${created._id}`).set('Authorization', `Bearer ${otherToken}`)).status).toBe(404);
    expect((await request(app).get('/api/requests')).status).toBe(401);
  });

  test('the older name-only form still works', async () => {
    const { hospitalId, ...rest } = form;
    const res = await submit({ ...rest, hospitalName: 'calmette hospital' });
    expect(res.status).toBe(201);
    expect(res.body.hospital).toBe(String(hospital._id));
  });
});

describe('status changes by staff', () => {
  const make = (status) => BloodRequest.create({
    hospitalName: hospital.name, hospital: hospital._id, patientName: 'Dara', bloodType: 'O+', unitsNeeded: 2,
    urgency: 'High', reason: 'Surgery', userEmail: DONOR.email, status,
  });

  test.each(['Cancelled', 'Fulfilled'])('a %s request cannot be moved by PATCH /status or PUT', async (status) => {
    const { token } = await createHospitalStaff(hospital._id);
    const r = await make(status);
    const patch = await request(app).patch(`/api/requests/${r._id}/status`).set('Authorization', `Bearer ${token}`).send({ status: 'Pending' });
    const put = await request(app).put(`/api/requests/${r._id}`).set('Authorization', `Bearer ${token}`).send({ status: 'Approved' });
    expect(patch.status).toBe(409);
    expect(put.status).toBe(409);
    expect((await BloodRequest.findById(r._id)).status).toBe(status);
  });

  test('PUT cannot mark a request Fulfilled (that must go through /fulfill, which deducts stock)', async () => {
    await Inventory.create({ bloodType: 'O+', hospital: hospital._id, units: 9 });
    const { token } = await createHospitalStaff(hospital._id);
    const r = await make('Approved');
    const res = await request(app).put(`/api/requests/${r._id}`).set('Authorization', `Bearer ${token}`)
      .send({ status: 'Fulfilled', fulfilledAt: new Date().toISOString(), userEmail: 'someone@else.com' });
    expect(res.status).toBe(400);
    const after = await BloodRequest.findById(r._id);
    expect(after).toMatchObject({ status: 'Approved', fulfilledAt: null, userEmail: DONOR.email });
    expect((await Inventory.findOne({ bloodType: 'O+', hospital: hospital._id })).units).toBe(9);
  });

  test('PUT still approves a pending request and edits ordinary fields, and validates them', async () => {
    const { token } = await createHospitalStaff(hospital._id);
    const r = await make('Pending');
    const ok = await request(app).put(`/api/requests/${r._id}`).set('Authorization', `Bearer ${token}`)
      .send({ status: 'Approved', reason: 'Updated reason', userEmail: 'ignored@test.com' });
    expect(ok.status).toBe(200);
    expect(ok.body).toMatchObject({ status: 'Approved', reason: 'Updated reason', userEmail: DONOR.email });
    const bad = await request(app).put(`/api/requests/${r._id}`).set('Authorization', `Bearer ${token}`).send({ component: 'Bone Marrow' });
    expect(bad.status).toBe(400);
  });
});
