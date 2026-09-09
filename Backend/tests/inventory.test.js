const request = require('supertest');
const app = require('../src/app');
const Inventory = require('../src/inventory/inventory.model');
const { createAdmin, createHospital, createHospitalStaff } = require('./helpers');

describe('inventory', () => {
  test('GET / auto-seeds the central pool on first call', async () => {
    const res = await request(app).get('/api/inventory');
    expect(res.status).toBe(200);
    expect(res.body.length).toBe(8);
    expect(res.body.every((i) => i.hospital === null)).toBe(true);
  });

  test('hospital_staff can upsert their own hospital\'s inventory and it stays scoped', async () => {
    const hospital = await createHospital();
    const { token } = await createHospitalStaff(hospital._id);

    const put = await request(app)
      .put('/api/inventory/O+')
      .set('Authorization', `Bearer ${token}`)
      .send({ units: 25 });
    expect(put.status).toBe(200);
    expect(put.body.hospital).toBe(hospital._id.toString());
    expect(put.body.units).toBe(25);

    // central pool should be untouched / independent
    const central = await Inventory.findOne({ bloodType: 'O+', hospital: null });
    expect(central).toBeNull();

    const scoped = await request(app).get(`/api/inventory?hospital=${hospital._id}`);
    expect(scoped.body.find((i) => i.bloodType === 'O+').units).toBe(25);
  });

  test('adjust applies a delta and never goes below zero', async () => {
    const hospital = await createHospital();
    const { token } = await createHospitalStaff(hospital._id);
    await Inventory.create({ bloodType: 'A+', hospital: hospital._id, units: 3 });

    const res = await request(app)
      .patch('/api/inventory/A+/adjust')
      .set('Authorization', `Bearer ${token}`)
      .send({ delta: -10 });
    expect(res.status).toBe(200);
    expect(res.body.units).toBe(0);
  });

  test('a hospital_staff cannot write to another hospital\'s inventory row', async () => {
    const hospitalA = await createHospital({ name: 'Hospital A' });
    const hospitalB = await createHospital({ name: 'Hospital B' });
    await Inventory.create({ bloodType: 'O-', hospital: hospitalB._id, units: 5 });
    const { token } = await createHospitalStaff(hospitalA._id, { email: 'staffA3@test.com' });

    await request(app)
      .put('/api/inventory/O-')
      .set('Authorization', `Bearer ${token}`)
      .send({ units: 999 });

    const untouched = await Inventory.findOne({ bloodType: 'O-', hospital: hospitalB._id });
    expect(untouched.units).toBe(5);
  });
});
