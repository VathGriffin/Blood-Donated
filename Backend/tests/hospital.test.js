const request = require('supertest');
const app = require('../src/app');
const Hospital = require('../src/hospital/hospital.model');
const { createAdmin, createHospitalStaff, createHospital } = require('./helpers');

describe('hospital directory', () => {
  test('anyone can list and read hospitals', async () => {
    await createHospital({ name: 'Calmette Hospital' });
    const list = await request(app).get('/api/hospitals');
    expect(list.status).toBe(200);
    expect(list.body.length).toBe(1);

    const one = await request(app).get(`/api/hospitals/${list.body[0]._id}`);
    expect(one.status).toBe(200);
    expect(one.body.name).toBe('Calmette Hospital');
  });

  test('unknown hospital id returns 404', async () => {
    const res = await request(app).get('/api/hospitals/666666666666666666666666');
    expect(res.status).toBe(404);
  });

  test('only admin can create a hospital', async () => {
    const anon = await request(app).post('/api/hospitals').send({ name: 'New Hospital', city: 'Siem Reap' });
    expect(anon.status).toBe(401);

    const { token: staffToken } = await createHospitalStaff((await createHospital())._id);
    const asStaff = await request(app)
      .post('/api/hospitals')
      .set('Authorization', `Bearer ${staffToken}`)
      .send({ name: 'New Hospital', city: 'Siem Reap' });
    expect(asStaff.status).toBe(403);

    const { token: adminToken } = await createAdmin();
    const asAdmin = await request(app)
      .post('/api/hospitals')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ name: 'New Hospital', city: 'Siem Reap' });
    expect(asAdmin.status).toBe(201);
    expect(asAdmin.body.name).toBe('New Hospital');
  });

  test('admin can update and delete a hospital', async () => {
    const hospital = await createHospital();
    const { token: adminToken } = await createAdmin();

    const updated = await request(app)
      .put(`/api/hospitals/${hospital._id}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ city: 'Battambang' });
    expect(updated.status).toBe(200);
    expect(updated.body.city).toBe('Battambang');

    const deleted = await request(app)
      .delete(`/api/hospitals/${hospital._id}`)
      .set('Authorization', `Bearer ${adminToken}`);
    expect(deleted.status).toBe(200);
    expect(await Hospital.findById(hospital._id)).toBeNull();
  });

  test('an admin can save coordinates, and the public list returns them (the booking page uses them for distances)', async () => {
    const { token } = await createAdmin();
    const created = await request(app).post('/api/hospitals').set('Authorization', `Bearer ${token}`)
      .send({ name: 'Located Hospital', city: 'Phnom Penh', location: { lat: 11.5564, lng: 104.9282 } });
    expect(created.status).toBe(201);
    const list = await request(app).get('/api/hospitals');
    const found = list.body.find((h) => h.name === 'Located Hospital');
    expect(found.location).toEqual({ lat: 11.5564, lng: 104.9282 });
  });
});
