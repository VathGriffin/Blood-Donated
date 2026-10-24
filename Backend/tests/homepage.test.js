const request = require('supertest');
const app = require('../src/app');
const HomepageProfile = require('../src/homepage/homepage.model');
const { createAdmin } = require('./helpers');

describe('homepage profiles', () => {
  test('seeds default profiles on first call', async () => {
    const res = await request(app).get('/api/homepage');
    expect(res.status).toBe(200);
    expect(res.body.length).toBe(3);

    const again = await request(app).get('/api/homepage');
    expect(again.body.length).toBe(3);
  });

  // The homepage shows photos from its offline fallback; if the API's own defaults had none, the
  // cards would lose their photos the moment the backend started running.
  test('seeded default profiles come with a photo', async () => {
    const res = await request(app).get('/api/homepage');
    expect(res.body.every((p) => /^https:\/\//.test(p.photo))).toBe(true);
  });

  test('photo upload/delete requires admin', async () => {
    const [profile] = await HomepageProfile.create([
      { name: 'Test Donor', role: 'Donor', initials: 'TD', color: '#dc2626', bloodType: 'O+', donations: 1, badge: 'New', order: 0 },
    ]);

    const anon = await request(app)
      .post(`/api/homepage/${profile._id}/photo`)
      .attach('photo', Buffer.from('fake-image-bytes'), 'photo.jpg');
    expect(anon.status).toBe(401);

    const { token: adminToken } = await createAdmin();
    const uploaded = await request(app)
      .post(`/api/homepage/${profile._id}/photo`)
      .set('Authorization', `Bearer ${adminToken}`)
      .attach('photo', Buffer.from('fake-image-bytes'), 'photo.jpg');
    expect(uploaded.status).toBe(200);
    expect(uploaded.body.photo).toBeDefined();

    const deleted = await request(app)
      .delete(`/api/homepage/${profile._id}/photo`)
      .set('Authorization', `Bearer ${adminToken}`);
    expect(deleted.status).toBe(200);
    expect(deleted.body.photo).toBeNull();
  });
  test('admin can edit a profile and hide it from the public list', async () => {
    const [profile] = await HomepageProfile.create([
      { name: 'Test Donor', role: 'Donor', initials: 'TD', order: 0 },
    ]);
    const { token: adminToken } = await createAdmin();

    const anon = await request(app).put(`/api/homepage/${profile._id}`).send({ name: 'X' });
    expect(anon.status).toBe(401);

    const edited = await request(app)
      .put(`/api/homepage/${profile._id}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ name: 'Sok Dara', role: 'Volunteer', bio: 'Helps at drives', visible: false });
    expect(edited.status).toBe(200);
    expect(edited.body).toMatchObject({ name: 'Sok Dara', initials: 'SD', role: 'Volunteer', bio: 'Helps at drives', visible: false });

    const blank = await request(app)
      .put(`/api/homepage/${profile._id}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ name: '  ' });
    expect(blank.status).toBe(400);

    const pub = await request(app).get('/api/homepage');
    expect(pub.body.map((p) => p.name)).not.toContain('Sok Dara');

    const all = await request(app).get('/api/homepage/all').set('Authorization', `Bearer ${adminToken}`);
    expect(all.status).toBe(200);
    expect(all.body.map((p) => p.name)).toContain('Sok Dara');
    expect((await request(app).get('/api/homepage/all')).status).toBe(401);
  });
});
