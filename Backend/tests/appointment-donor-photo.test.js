const request = require('supertest');
const app = require('../src/app');
const Donor = require('../src/donor/donor.model');
const User = require('../src/users/user.model');
const Appointment = require('../src/appointments/appointment.model');
const { createHospital, createAdmin } = require('./helpers');

const book = (hospital, email) => Appointment.create({
  fullName: 'Photo Donor', email, phone: '0987654321', bloodType: 'O+',
  date: '2026-11-01', time: '10:00 AM', location: hospital.name, hospital: hospital._id,
});

describe('appointments include the donor photo', () => {
  test('uses the donor account photo when there is no donor record photo', async () => {
    const hospital = await createHospital();
    const { token } = await createAdmin();
    await User.create({ fullName: 'Photo Donor', email: 'photo.user@test.com', password: 'Secret123!', photo: '/uploads/user.jpg' });
    const appt = await book(hospital, 'photo.user@test.com');

    const list = await request(app).get('/api/appointments').set('Authorization', `Bearer ${token}`);
    expect(list.status).toBe(200);
    expect(list.body.find((a) => a._id === String(appt._id)).donorPhoto).toBe('/uploads/user.jpg');

    const one = await request(app).get(`/api/appointments/${appt._id}`).set('Authorization', `Bearer ${token}`);
    expect(one.body.donorPhoto).toBe('/uploads/user.jpg');
  });

  test('prefers the donor record photo, and is null when there is none', async () => {
    const hospital = await createHospital();
    const { token } = await createAdmin();
    await Donor.create({ fullName: 'D', email: 'photo.donor@test.com', phone: '0987654321', bloodType: 'O+', location: 'PP', photo: '/uploads/donor.jpg' });
    await User.create({ fullName: 'D', email: 'photo.donor@test.com', password: 'Secret123!', photo: '/uploads/user.jpg' });
    await book(hospital, 'photo.donor@test.com');
    await book(hospital, 'nophoto@test.com');

    const res = await request(app).get('/api/appointments').set('Authorization', `Bearer ${token}`);
    const byEmail = Object.fromEntries(res.body.map((a) => [a.email, a.donorPhoto]));
    expect(byEmail['photo.donor@test.com']).toBe('/uploads/donor.jpg');
    expect(byEmail['nophoto@test.com']).toBeNull();
  });
});
