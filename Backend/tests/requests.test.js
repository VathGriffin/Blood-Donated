const request = require('supertest');
const app = require('../src/app');
const Inventory = require('../src/inventory/inventory.model');
const BloodRequest = require('../src/requests/blood-request.model');
const { createAdmin, createHospital, createHospitalStaff } = require('./helpers');

describe('blood request fulfillment -> inventory decrement', () => {
  test('approve then fulfill decrements matching inventory by unitsNeeded', async () => {
    const hospital = await createHospital();
    await Inventory.create({ bloodType: 'O+', hospital: hospital._id, units: 10 });
    const { token: staffToken } = await createHospitalStaff(hospital._id);

    const req = await BloodRequest.create({
      hospitalName: hospital.name, hospital: hospital._id, patientName: 'Patient',
      bloodType: 'O+', unitsNeeded: 3, urgency: 'High', reason: 'surgery', status: 'Pending',
    });

    const approve = await request(app)
      .patch(`/api/requests/${req._id}/status`)
      .set('Authorization', `Bearer ${staffToken}`)
      .send({ status: 'Approved' });
    expect(approve.status).toBe(200);

    const fulfill = await request(app)
      .patch(`/api/requests/${req._id}/fulfill`)
      .set('Authorization', `Bearer ${staffToken}`);
    expect(fulfill.status).toBe(200);
    expect(fulfill.body.status).toBe('Fulfilled');

    const inv = await Inventory.findOne({ bloodType: 'O+', hospital: hospital._id });
    expect(inv.units).toBe(7);
  });

  test('fulfilling with insufficient inventory returns 409 and does not change status', async () => {
    const hospital = await createHospital();
    await Inventory.create({ bloodType: 'A-', hospital: hospital._id, units: 1 });
    const { token: staffToken } = await createHospitalStaff(hospital._id);

    const req = await BloodRequest.create({
      hospitalName: hospital.name, hospital: hospital._id, patientName: 'Patient',
      bloodType: 'A-', unitsNeeded: 5, urgency: 'Critical', reason: 'trauma', status: 'Approved',
    });

    const res = await request(app)
      .patch(`/api/requests/${req._id}/fulfill`)
      .set('Authorization', `Bearer ${staffToken}`);
    expect(res.status).toBe(409);

    const reloaded = await BloodRequest.findById(req._id);
    expect(reloaded.status).toBe('Approved');
  });

  test('hospital_staff cannot fulfill another hospital\'s request', async () => {
    const hospitalA = await createHospital({ name: 'Hospital A' });
    const hospitalB = await createHospital({ name: 'Hospital B' });
    await Inventory.create({ bloodType: 'B+', hospital: hospitalB._id, units: 10 });
    const { token: staffAToken } = await createHospitalStaff(hospitalA._id, { email: 'staffA@test.com' });

    const req = await BloodRequest.create({
      hospitalName: hospitalB.name, hospital: hospitalB._id, patientName: 'Patient',
      bloodType: 'B+', unitsNeeded: 2, urgency: 'Medium', reason: 'anemia', status: 'Approved',
    });

    const res = await request(app)
      .patch(`/api/requests/${req._id}/fulfill`)
      .set('Authorization', `Bearer ${staffAToken}`);
    expect(res.status).toBe(403);
  });

  test('admin can fulfill any hospital\'s request', async () => {
    const hospital = await createHospital();
    await Inventory.create({ bloodType: 'AB+', hospital: hospital._id, units: 5 });
    const { token: adminToken } = await createAdmin();

    const req = await BloodRequest.create({
      hospitalName: hospital.name, hospital: hospital._id, patientName: 'Patient',
      bloodType: 'AB+', unitsNeeded: 2, urgency: 'Low', reason: 'planned', status: 'Approved',
    });

    const res = await request(app)
      .patch(`/api/requests/${req._id}/fulfill`)
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
  });
});
