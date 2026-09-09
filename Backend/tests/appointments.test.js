const request = require('supertest');
const app = require('../src/app');
const Donor = require('../src/donor/donor.model');
const Appointment = require('../src/appointments/appointment.model');
const { createHospital, createHospitalStaff } = require('./helpers');

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
