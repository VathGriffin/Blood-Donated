const request = require('supertest');
const app = require('../src/app');
const User = require('../src/users/user.model');
const Message = require('../src/notification/message.model');
const Appointment = require('../src/appointments/appointment.model');
const BloodRequest = require('../src/requests/blood-request.model');
const { signDonor, createAdmin } = require('./helpers');

const iso = (daysFromToday) => {
  const d = new Date(); d.setDate(d.getDate() + daysFromToday);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

async function donor(email = 'sok.dara@test.com') {
  const user = await User.create({ fullName: 'Sok Dara', email });
  return { user, token: signDonor(user) };
}
const appt = (overrides) => Appointment.create({
  fullName: 'Sok Dara', email: 'sok.dara@test.com', phone: '012', bloodType: 'O+',
  date: iso(10), time: '09:00 AM', location: 'Calmette Hospital', ...overrides,
});
const feed = (token) => request(app).get('/api/notifications').set('Authorization', `Bearer ${token}`);

describe('donor notifications', () => {
  test('requires a donor login', async () => {
    expect((await request(app).get('/api/notifications')).status).toBe(401);
    const { token } = await createAdmin();
    expect((await feed(token)).status).toBe(403);
  });

  test('an account with no activity has an empty feed', async () => {
    const { token } = await donor();
    const res = await feed(token);
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ items: [], unread: 0, seenAt: null });
  });

  test('admin replies, appointment and request status changes, and reminders appear — newest first', async () => {
    const { user, token } = await donor();
    await Message.create({ userId: user._id, userName: 'Sok Dara', userEmail: user.email, content: 'Thanks for your question!', sender: 'admin', read: true });
    await Message.create({ userId: user._id, userName: 'Sok Dara', userEmail: user.email, content: 'My own message', sender: 'user' });
    await appt({ status: 'Confirmed' });
    await appt({ date: iso(1), time: '08:00 AM' }); // pending, tomorrow -> reminder only
    await appt({ status: 'Pending' }); // pending, far away -> nothing
    await BloodRequest.create({ hospitalName: 'Calmette Hospital', patientName: 'Dara', bloodType: 'A+', urgency: 'High', reason: 'Surgery', userEmail: user.email, status: 'Approved' });
    await BloodRequest.create({ hospitalName: 'Calmette Hospital', patientName: 'Dara', bloodType: 'A+', urgency: 'High', reason: 'Surgery', userEmail: user.email });

    const res = await feed(token);
    const types = res.body.items.map((i) => i.type).sort();
    expect(types).toEqual(['appointment', 'message', 'reminder', 'request']);
    expect(res.body.items.find((i) => i.type === 'reminder').title).toBe('Your appointment is tomorrow');
    expect(res.body.items.find((i) => i.type === 'message').body).toBe('Thanks for your question!');
    expect(res.body.unread).toBe(4);
    const times = res.body.items.map((i) => new Date(i.at).getTime());
    expect([...times].sort((a, b) => b - a)).toEqual(times);
  });

  test("another donor's records never appear", async () => {
    const { token } = await donor();
    const other = await User.create({ fullName: 'Other', email: 'other@test.com' });
    await Message.create({ userId: other._id, userName: 'Other', userEmail: other.email, content: 'Private', sender: 'admin' });
    await appt({ email: 'other@test.com', status: 'Confirmed' });
    expect((await feed(token)).body.items).toEqual([]);
  });

  test('marking as seen clears the unread count until something new happens', async () => {
    const { user, token } = await donor();
    await appt({ status: 'Confirmed' });
    expect((await feed(token)).body.unread).toBe(1);

    const seen = await request(app).post('/api/notifications/seen').set('Authorization', `Bearer ${token}`);
    expect(seen.status).toBe(200);
    const after = await feed(token);
    expect(after.body.unread).toBe(0);
    expect(after.body.items[0].unread).toBe(false);

    await new Promise((r) => setTimeout(r, 5));
    await Message.create({ userId: user._id, userName: 'Sok Dara', userEmail: user.email, content: 'New reply', sender: 'admin' });
    const later = await feed(token);
    expect(later.body.unread).toBe(1);
    expect(later.body.items[0]).toMatchObject({ type: 'message', unread: true });
  });
});
