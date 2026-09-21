const request = require('supertest');
const app = require('../src/app');
const Inventory = require('../src/inventory/inventory.model');
const { createHospital, createHospitalStaff } = require('./helpers');

describe('inventory', () => {
  test('GET / auto-seeds the central pool on first call', async () => {
    const res = await request(app).get('/api/inventory');
    expect(res.status).toBe(200);
    expect(res.body.length).toBe(8);
    expect(res.body.every((i) => i.hospital === null)).toBe(true);
  });

  // Regression: status is a schema virtual and used to be dropped by .lean({ virtuals: true }),
  // so every inventory response lacked it and /stats always reported 0 critical.
  test('GET / includes the computed stock status for each blood type', async () => {
    await request(app).get('/api/inventory'); // seed defaults (A+ 45, B- 8, ...)
    await Inventory.updateOne({ bloodType: 'A-', hospital: null }, { units: 0 });
    await Inventory.updateOne({ bloodType: 'B-', hospital: null }, { units: 8 });  // < min 10
    await Inventory.updateOne({ bloodType: 'B+', hospital: null }, { units: 15 }); // < 2 x min
    const res = await request(app).get('/api/inventory');
    const byType = Object.fromEntries(res.body.map((i) => [i.bloodType, i.status]));
    expect(byType['A-']).toBe('empty');
    expect(byType['B-']).toBe('critical');
    expect(byType['B+']).toBe('low');
    expect(byType['O+']).toBe('adequate');
  });

  test('GET /stats counts critical and adequate types from the computed status', async () => {
    await request(app).get('/api/inventory');
    await Inventory.updateOne({ bloodType: 'A-', hospital: null }, { units: 0 });
    const res = await request(app).get('/api/inventory/stats');
    expect(res.status).toBe(200);
    expect(res.body.critical).toBe(2); // A- empty + B- (8 units, min 10) from the seeded defaults
    expect(res.body.adequate).toBeGreaterThan(0);
  });

  test('a hospital\'s own rows carry a status too', async () => {
    const hospital = await createHospital();
    const { token } = await createHospitalStaff(hospital._id);
    await request(app).put('/api/inventory/O-').set('Authorization', `Bearer ${token}`).send({ units: 2 });
    const res = await request(app).get(`/api/inventory?hospital=${hospital._id}`);
    expect(res.body[0].status).toBe('critical');
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

  test('adjust creates the row when a hospital has none yet (the UI\'s "+" flow), instead of 404', async () => {
    const hospital = await createHospital();
    const { token } = await createHospitalStaff(hospital._id);
    const up = await request(app).patch('/api/inventory/AB+/adjust').set('Authorization', `Bearer ${token}`).send({ delta: 3 });
    expect(up.status).toBe(200);
    expect(up.body.units).toBe(3);
    expect(up.body.hospital).toBe(hospital._id.toString());
    // a decrement on a type with no row can't go negative
    const down = await request(app).patch('/api/inventory/O-/adjust').set('Authorization', `Bearer ${token}`).send({ delta: -5 });
    expect(down.status).toBe(200);
    expect(down.body.units).toBe(0);
    // and it stays scoped: the central pool wasn't touched
    expect(await Inventory.findOne({ bloodType: 'AB+', hospital: null })).toBeNull();
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
