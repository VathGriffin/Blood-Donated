const request = require('supertest');
const app = require('../src/app');
const BloodRequest = require('../src/requests/blood-request.model');
const Appointment = require('../src/appointments/appointment.model');
const Donor = require('../src/donor/donor.model');
const Inventory = require('../src/inventory/inventory.model');
const Message = require('../src/notification/message.model');
const { createAdmin, signDonor, createHospital, createHospitalStaff } = require('./helpers');

const DONOR_ID = '666666666666666666666666';
const donorToken = signDonor({ _id: DONOR_ID, id: DONOR_ID, email: 'sok.dara@test.com', fullName: 'Sok Dara' });
const auth = (t) => ({ Authorization: `Bearer ${t}` });

async function seed() {
  await BloodRequest.create({ hospitalName: 'Calmette Hospital', patientName: 'Chan Dara', bloodType: 'O-', unitsNeeded: 2, urgency: 'Critical', reason: 'Surgery' });
  await BloodRequest.create({ hospitalName: 'Calmette Hospital', patientName: 'Srey Mom', bloodType: 'A+', urgency: 'Low', reason: 'Anemia',
    status: 'Cancelled', cancelledAt: new Date(), cancellationReason: 'Found a donor' });
  await Appointment.create({ fullName: 'Vann Nam', email: 'v@test.com', phone: '012345678', bloodType: 'B+', date: '2030-01-05', time: '09:00 AM', location: 'Calmette Hospital' });
  await Donor.create({ fullName: 'Kim Lee', email: 'kim@test.com', phone: '0123456789', bloodType: 'AB-', location: 'Phnom Penh' });
  await Inventory.create({ bloodType: 'O-', hospital: null, units: 3, minUnits: 10 });
  await Inventory.create({ bloodType: 'A+', hospital: null, units: 50, minUnits: 10 });
  await request(app).post('/api/messages').set(auth(donorToken)).send({ content: 'I have a question' });
}

describe('admin notification feed', () => {
  test('lists real events of every kind, newest first, all unread for a new admin', async () => {
    const { token } = await createAdmin();
    await seed();
    const res = await request(app).get('/api/notifications/admin').set(auth(token));
    expect(res.status).toBe(200);
    const types = res.body.items.map((i) => i.type).sort();
    expect(types).toEqual(['appointment', 'cancelled', 'donor', 'message', 'request', 'request', 'stock'].sort());
    expect(res.body.unread).toBe(res.body.items.length);
    const critical = res.body.items.find((i) => i.title === 'Critical blood request');
    expect(critical).toMatchObject({ tone: 'error', href: '/dashboard/admin/requests' });
    // Only the blood type below its minimum produces a stock alert.
    const stock = res.body.items.filter((i) => i.type === 'stock');
    expect(stock).toHaveLength(1);
    expect(stock[0].title).toMatch(/^O- /);
    const times = res.body.items.map((i) => new Date(i.at).getTime());
    expect([...times].sort((a, b) => b - a)).toEqual(times);
  });

  test('marking seen clears the badge for that admin only; newer events become unread again', async () => {
    const a = await createAdmin();
    const b = await createAdmin({ email: 'admin2@test.com' });
    await seed();
    const seen = await request(app).post('/api/notifications/admin/seen').set(auth(a.token));
    expect(seen.status).toBe(200);

    const forA = await request(app).get('/api/notifications/admin').set(auth(a.token));
    expect(forA.body.unread).toBe(0);
    const forB = await request(app).get('/api/notifications/admin').set(auth(b.token));
    expect(forB.body.unread).toBeGreaterThan(0);

    await new Promise((r) => setTimeout(r, 20));
    await request(app).post('/api/messages').set(auth(donorToken)).send({ content: 'Another question' });
    const again = await request(app).get('/api/notifications/admin').set(auth(a.token));
    expect(again.body.unread).toBe(1);
    expect(again.body.items[0]).toMatchObject({ type: 'message', unread: true });
  });

  test('only admins can read or mark the admin feed', async () => {
    const hospital = await createHospital();
    const { token: staffToken } = await createHospitalStaff(hospital._id);
    expect((await request(app).get('/api/notifications/admin')).status).toBe(401);
    expect((await request(app).get('/api/notifications/admin').set(auth(donorToken))).status).toBe(403);
    expect((await request(app).get('/api/notifications/admin').set(auth(staffToken))).status).toBe(403);
    expect((await request(app).post('/api/notifications/admin/seen').set(auth(staffToken))).status).toBe(403);
  });

  test("a deleted admin reply never shows its text in the donor's notifications", async () => {
    const { token } = await createAdmin();
    const sent = await request(app).post(`/api/messages/reply/${DONOR_ID}`).set(auth(token))
      .send({ content: 'Wording we took back', userName: 'Sok Dara', userEmail: 'sok.dara@test.com' });
    await request(app).delete(`/api/messages/conversation/${DONOR_ID}/${sent.body._id}`).set(auth(token));
    const feed = await request(app).get('/api/notifications').set(auth(donorToken));
    expect(JSON.stringify(feed.body)).not.toContain('Wording we took back');
    expect(await Message.countDocuments({ _id: sent.body._id })).toBe(1); // still kept for the record
  });
});
