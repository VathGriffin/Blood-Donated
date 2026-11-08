const fs = require('fs');
const path = require('path');
const request = require('supertest');
const app = require('../src/app');
const BloodRequest = require('../src/requests/blood-request.model');
const { createAdmin, createHospital, createHospitalStaff } = require('./helpers');

const UPLOADS = path.join(__dirname, '../uploads');

let hospital;
let base;
beforeEach(async () => {
  hospital = await createHospital({ name: 'Calmette Hospital' });
  base = await BloodRequest.create({
    hospitalName: 'Calmette Hospital', hospital: hospital._id, patientName: 'Sok Dara', bloodType: 'O+',
    unitsNeeded: 2, urgency: 'High', reason: 'Emergency surgery', contact: '0912345678',
  });
});

const put = (token, body) => request(app).put(`/api/requests/${base._id}`).set('Authorization', `Bearer ${token}`).send(body);

describe('editing a blood request (PUT /api/requests/:id)', () => {
  test('applies the same field rules as a new request', async () => {
    const { token } = await createAdmin();
    for (const body of [
      { patientName: '   ' },
      { patientName: 'x'.repeat(101) },
      { reason: '' },
      { reason: 'x'.repeat(1001) },
      { contact: 'x'.repeat(101) },
      { hospitalName: '  ' },
      { unitsNeeded: 0 },
      { unitsNeeded: 11 },
      { urgency: 'Extreme' },
      { bloodType: 'C+' },
    ]) {
      const res = await put(token, body);
      expect([res.status, body]).toEqual([400, body]);
    }
    const after = await BloodRequest.findById(base._id).lean();
    expect(after).toMatchObject({ patientName: 'Sok Dara', reason: 'Emergency surgery', unitsNeeded: 2, urgency: 'High' });
  });

  test('trims text and saves a valid edit', async () => {
    const { token } = await createAdmin();
    const res = await put(token, { patientName: '  Sok Dara Jr  ', unitsNeeded: 3, urgency: 'Critical', reason: ' Updated ' });
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ patientName: 'Sok Dara Jr', unitsNeeded: 3, urgency: 'Critical', reason: 'Updated' });
  });

  test('cannot point the photo at another upload (which a later photo upload would delete)', async () => {
    const victim = path.join(UPLOADS, 'request-edit-test-victim.jpg');
    fs.writeFileSync(victim, 'x');
    try {
      const { token } = await createHospitalStaff(hospital._id);
      const res = await put(token, { photo: '/uploads/request-edit-test-victim.jpg' });
      expect(res.status).toBe(400);
      expect((await BloodRequest.findById(base._id)).photo).toBeNull();

      await request(app).post(`/api/requests/${base._id}/photo`).set('Authorization', `Bearer ${token}`)
        .attach('photo', Buffer.from([0xff, 0xd8, 0xff, 0xd9]), { filename: 'p.jpg', contentType: 'image/jpeg' });
      expect(fs.existsSync(victim)).toBe(true);
    } finally {
      fs.rmSync(victim, { force: true });
      const { photo } = (await BloodRequest.findById(base._id)) || {};
      if (photo) fs.rmSync(path.join(UPLOADS, path.basename(photo)), { force: true });
    }
  });

  test('removing the photo (photo: null) still works', async () => {
    await BloodRequest.updateOne({ _id: base._id }, { photo: '/uploads/request-gone.jpg' });
    const { token } = await createAdmin();
    const res = await put(token, { photo: null });
    expect(res.status).toBe(200);
    expect(res.body.photo).toBeNull();
  });

  test('a malformed id is a client error, not a server error', async () => {
    const { token } = await createAdmin();
    const edit = await request(app).put('/api/requests/not-an-id').set('Authorization', `Bearer ${token}`).send({ reason: 'x' });
    const del = await request(app).delete('/api/requests/not-an-id').set('Authorization', `Bearer ${token}`);
    expect([edit.status, del.status]).toEqual([400, 400]);
  });

  test('an approve/reject-only edit (what the admin page sends) still works', async () => {
    const { token } = await createAdmin();
    const res = await put(token, { status: 'Approved' });
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('Approved');
  });

  test('hospital staff cannot delete a request', async () => {
    const { token } = await createHospitalStaff(hospital._id);
    const res = await request(app).delete(`/api/requests/${base._id}`).set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(403);
    expect(await BloodRequest.exists({ _id: base._id })).toBeTruthy();
  });
});
