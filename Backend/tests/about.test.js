const request = require('supertest');
const fs = require('fs');
const path = require('path');
const app = require('../src/app');
const { createAdmin, createHospitalStaff, createHospital, signDonor } = require('./helpers');

const uploadsDir = path.join(__dirname, '../uploads');
const onDisk = (photoUrl) => fs.existsSync(path.join(uploadsDir, path.basename(photoUrl)));
const png = Buffer.from('89504e470d0a1a0a', 'hex');
const created = [];
const track = (photoUrl) => { if (photoUrl) created.push(path.join(uploadsDir, path.basename(photoUrl))); return photoUrl; };
afterAll(() => created.forEach((f) => { try { fs.unlinkSync(f); } catch { /* already removed */ } }));

const upload = (token) => request(app).post('/api/about/creator-photo').set('Authorization', `Bearer ${token}`)
  .attach('photo', png, { filename: 'me.png', contentType: 'image/png' });

describe('About page creator photo', () => {
  test('there is no photo until an admin uploads one', async () => {
    const res = await request(app).get('/api/about');
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ creatorPhoto: null });
  });

  test('an admin can upload a photo, and the public About page sees it', async () => {
    const { token } = await createAdmin();
    const res = await upload(token);
    expect(res.status).toBe(200);
    expect(track(res.body.creatorPhoto)).toMatch(/^\/uploads\/about-creator-.+\.png$/);
    expect(onDisk(res.body.creatorPhoto)).toBe(true);
    expect((await request(app).get('/api/about')).body.creatorPhoto).toBe(res.body.creatorPhoto);
  });

  test('uploading again replaces the photo and deletes the old file', async () => {
    const { token } = await createAdmin();
    const first = await upload(token);
    track(first.body.creatorPhoto);
    const second = await upload(token);
    track(second.body.creatorPhoto);
    expect(second.body.creatorPhoto).not.toBe(first.body.creatorPhoto);
    expect(onDisk(first.body.creatorPhoto)).toBe(false);
    expect(onDisk(second.body.creatorPhoto)).toBe(true);
  });

  test('DELETE removes the photo from the page and from disk', async () => {
    const { token } = await createAdmin();
    const up = await upload(token);
    track(up.body.creatorPhoto);
    const del = await request(app).delete('/api/about/creator-photo').set('Authorization', `Bearer ${token}`);
    expect(del.status).toBe(200);
    expect(del.body.creatorPhoto).toBeNull();
    expect(onDisk(up.body.creatorPhoto)).toBe(false);
    expect((await request(app).get('/api/about')).body.creatorPhoto).toBeNull();
  });

  test('DELETE with no photo set is harmless', async () => {
    const { token } = await createAdmin();
    const del = await request(app).delete('/api/about/creator-photo').set('Authorization', `Bearer ${token}`);
    expect(del.status).toBe(200);
    expect(del.body.creatorPhoto).toBeNull();
  });

  test('only admins can change the photo', async () => {
    expect((await upload('')).status).toBe(401);
    const donor = signDonor({ id: '64b000000000000000000001', email: 'jane@test.com' });
    expect((await upload(donor)).status).toBe(403);
    const { token } = await createHospitalStaff((await createHospital())._id);
    expect((await upload(token)).status).toBe(403);
    expect((await request(app).delete('/api/about/creator-photo').set('Authorization', `Bearer ${token}`)).status).toBe(403);
  });

  test('non-image files are rejected', async () => {
    const { token } = await createAdmin();
    const res = await request(app).post('/api/about/creator-photo').set('Authorization', `Bearer ${token}`)
      .attach('photo', Buffer.from('<svg/>'), { filename: 'x.svg', contentType: 'image/svg+xml' });
    expect(res.status).toBe(400);
    const missing = await request(app).post('/api/about/creator-photo').set('Authorization', `Bearer ${token}`);
    expect(missing.status).toBe(400);
  });
});
