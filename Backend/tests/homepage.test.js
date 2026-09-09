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
});
