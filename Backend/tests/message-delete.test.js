const request = require('supertest');
const app = require('../src/app');
const Message = require('../src/notification/message.model');
const { createAdmin, signDonor } = require('./helpers');

const DONOR_ID = '666666666666666666666666';
const OTHER_DONOR_ID = '777777777777777777777777';
const donorToken = signDonor({ _id: DONOR_ID, id: DONOR_ID, email: 'sok.dara@test.com', fullName: 'Sok Dara' });
const auth = (t) => ({ Authorization: `Bearer ${t}` });

const reply = (adminToken, userId, content) => request(app)
  .post(`/api/messages/reply/${userId}`).set(auth(adminToken))
  .send({ content, userName: 'Sok Dara', userEmail: 'sok.dara@test.com' });

describe('admin deletes their own replies (soft delete)', () => {
  let adminA; let adminB;
  beforeEach(async () => {
    adminA = await createAdmin();
    adminB = await createAdmin({ email: 'admin2@test.com', fullName: 'Second Admin' });
  });

  test('a reply records which admin sent it and is flagged as theirs', async () => {
    const res = await reply(adminA.token, DONOR_ID, 'Hello from A');
    expect(res.status).toBe(201);
    expect(res.body.mine).toBe(true);
    expect(res.body.senderId).toBeUndefined(); // internal field is not exposed
    const stored = await Message.findById(res.body._id).lean();
    expect(String(stored.senderId)).toBe(String(adminA.staff._id));
  });

  test('an admin can delete their own reply; it is soft-deleted and its text is hidden from everyone', async () => {
    const sent = await reply(adminA.token, DONOR_ID, 'Secret wording');
    const del = await request(app).delete(`/api/messages/conversation/${DONOR_ID}/${sent.body._id}`).set(auth(adminA.token));
    expect(del.status).toBe(200);
    expect(del.body.deleted).toBe(true);
    expect(del.body.content).toBe('');

    // Kept in the database for the record, with who deleted it.
    const stored = await Message.findById(sent.body._id).lean();
    expect(stored.content).toBe('Secret wording');
    expect(stored.deletedAt).toBeTruthy();
    expect(String(stored.deletedBy)).toBe(String(adminA.staff._id));

    // The donor sees a deleted placeholder, never the text.
    const mine = await request(app).get('/api/messages/mine').set(auth(donorToken));
    expect(mine.body).toHaveLength(1);
    expect(mine.body[0]).toMatchObject({ deleted: true, content: '' });

    // The admin view and the conversation preview hide it too.
    const convo = await request(app).get(`/api/messages/conversation/${DONOR_ID}`).set(auth(adminA.token));
    expect(convo.body[0]).toMatchObject({ deleted: true, content: '' });
    const list = await request(app).get('/api/messages/conversations').set(auth(adminA.token));
    expect(list.body[0]).toMatchObject({ lastMessage: '', lastDeleted: true });
  });

  test("an admin cannot delete another admin's reply", async () => {
    const sent = await reply(adminA.token, DONOR_ID, 'From A');
    const del = await request(app).delete(`/api/messages/conversation/${DONOR_ID}/${sent.body._id}`).set(auth(adminB.token));
    expect(del.status).toBe(403);
    const stored = await Message.findById(sent.body._id).lean();
    expect(stored.deletedAt).toBeNull();
    const convo = await request(app).get(`/api/messages/conversation/${DONOR_ID}`).set(auth(adminB.token));
    expect(convo.body[0].mine).toBe(false);
  });

  test('an admin cannot delete a donor message (no such permission exists)', async () => {
    const sent = await request(app).post('/api/messages').set(auth(donorToken)).send({ content: 'Donor text' });
    const del = await request(app).delete(`/api/messages/conversation/${DONOR_ID}/${sent.body._id}`).set(auth(adminA.token));
    expect(del.status).toBe(403);
    expect(await Message.countDocuments({ _id: sent.body._id, deletedAt: null })).toBe(1);
  });

  test('an older reply with no recorded sender cannot be deleted by anyone', async () => {
    const legacy = await Message.create({ userId: DONOR_ID, userName: 'Sok Dara', userEmail: 'sok.dara@test.com', content: 'Old reply', sender: 'admin', read: true });
    const del = await request(app).delete(`/api/messages/conversation/${DONOR_ID}/${legacy._id}`).set(auth(adminA.token));
    expect(del.status).toBe(403);
  });

  test('the message must belong to the conversation in the URL; only that one message changes', async () => {
    const a = await reply(adminA.token, DONOR_ID, 'One');
    const b = await reply(adminA.token, DONOR_ID, 'Two');
    const wrong = await request(app).delete(`/api/messages/conversation/${OTHER_DONOR_ID}/${a.body._id}`).set(auth(adminA.token));
    expect(wrong.status).toBe(404);
    await request(app).delete(`/api/messages/conversation/${DONOR_ID}/${a.body._id}`).set(auth(adminA.token));
    const convo = await request(app).get(`/api/messages/conversation/${DONOR_ID}`).set(auth(adminA.token));
    expect(convo.body.map((m) => m.deleted)).toEqual([true, false]); // order kept, the other untouched
    expect(convo.body[1].content).toBe('Two');
    expect(b.status).toBe(201);
  });

  test('deleting twice is handled gracefully', async () => {
    const sent = await reply(adminA.token, DONOR_ID, 'Twice');
    const url = `/api/messages/conversation/${DONOR_ID}/${sent.body._id}`;
    const [first, second] = await Promise.all([
      request(app).delete(url).set(auth(adminA.token)),
      request(app).delete(url).set(auth(adminA.token)),
    ]);
    expect([first.status, second.status]).toEqual([200, 200]);
    expect([first.body.alreadyDeleted, second.body.alreadyDeleted].filter(Boolean)).toHaveLength(1);
  });

  test('invalid ids, unknown messages and non-admins are refused', async () => {
    expect((await request(app).delete(`/api/messages/conversation/not-an-id/${DONOR_ID}`).set(auth(adminA.token))).status).toBe(400);
    expect((await request(app).delete(`/api/messages/conversation/${DONOR_ID}/xyz`).set(auth(adminA.token))).status).toBe(400);
    expect((await request(app).delete(`/api/messages/conversation/${DONOR_ID}/${OTHER_DONOR_ID}`).set(auth(adminA.token))).status).toBe(404);
    const sent = await reply(adminA.token, DONOR_ID, 'x');
    expect((await request(app).delete(`/api/messages/conversation/${DONOR_ID}/${sent.body._id}`)).status).toBe(401);
    expect((await request(app).delete(`/api/messages/conversation/${DONOR_ID}/${sent.body._id}`).set(auth(donorToken))).status).toBe(403);
    expect((await reply(adminA.token, 'bad-id', 'x')).status).toBe(400);
  });
});
