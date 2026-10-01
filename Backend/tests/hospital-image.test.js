const request = require('supertest');
const fs = require('fs');
const path = require('path');
const app = require('../src/app');
const { createAdmin, createHospital, createHospitalStaff } = require('./helpers');

const uploadsDir = path.join(__dirname, '../uploads');
const onDisk = (url) => fs.existsSync(path.join(uploadsDir, path.basename(url)));
const png = Buffer.from('89504e470d0a1a0a', 'hex'); // just enough to look like a PNG upload
const created = [];
const track = (url) => { if (url) created.push(path.join(uploadsDir, path.basename(url))); return url; };

afterAll(() => created.forEach((f) => { try { fs.unlinkSync(f); } catch { /* already removed */ } }));

const uploadAs = (token, id) => request(app).post(`/api/hospitals/${id}/image`).set('Authorization', `Bearer ${token}`)
  .attach('image', png, { filename: 'front.png', contentType: 'image/png' });

describe('hospital image', () => {
  test('an admin can upload a photo and the public directory returns it', async () => {
    const hospital = await createHospital({ name: 'Calmette Hospital' });
    const { token } = await createAdmin();

    const res = await uploadAs(token, hospital._id);
    expect(res.status).toBe(200);
    expect(track(res.body.image)).toMatch(/^\/uploads\/hospital-.+\.png$/);
    expect(onDisk(res.body.image)).toBe(true);

    const list = await request(app).get('/api/hospitals');
    expect(list.body[0].image).toBe(res.body.image);
  });

  test('hospitals without a photo return an empty image', async () => {
    await createHospital({ name: 'No Photo Hospital' });
    const list = await request(app).get('/api/hospitals');
    expect(list.body[0].image).toBe('');
  });

  test('uploading again replaces the old file; DELETE clears it', async () => {
    const hospital = await createHospital();
    const { token } = await createAdmin();
    const first = await uploadAs(token, hospital._id);
    track(first.body.image);
    await new Promise((r) => setTimeout(r, 5)); // filenames embed a timestamp
    const second = await uploadAs(token, hospital._id);
    track(second.body.image);
    expect(onDisk(first.body.image)).toBe(false);
    expect(onDisk(second.body.image)).toBe(true);

    const del = await request(app).delete(`/api/hospitals/${hospital._id}/image`).set('Authorization', `Bearer ${token}`);
    expect(del.status).toBe(200);
    expect(del.body.image).toBe('');
    expect(onDisk(second.body.image)).toBe(false);
  });

  test('only admins can change the photo', async () => {
    const hospital = await createHospital();
    const anon = await request(app).post(`/api/hospitals/${hospital._id}/image`)
      .attach('image', png, { filename: 'x.png', contentType: 'image/png' });
    expect(anon.status).toBe(401);
    const { token: staffToken } = await createHospitalStaff(hospital._id);
    expect((await uploadAs(staffToken, hospital._id)).status).toBe(403);
  });

  test('an http(s) image URL can be saved, but not a script URL', async () => {
    const hospital = await createHospital();
    const { token } = await createAdmin();
    const ok = await request(app).put(`/api/hospitals/${hospital._id}`).set('Authorization', `Bearer ${token}`)
      .send({ image: 'https://example.org/calmette.jpg' });
    expect(ok.status).toBe(200);
    expect(ok.body.image).toBe('https://example.org/calmette.jpg');

    const bad = await request(app).put(`/api/hospitals/${hospital._id}`).set('Authorization', `Bearer ${token}`)
      .send({ image: 'javascript:alert(1)' });
    expect(bad.status).toBe(400);
  });

  test('non-image uploads are refused', async () => {
    const hospital = await createHospital();
    const { token } = await createAdmin();
    const res = await request(app).post(`/api/hospitals/${hospital._id}/image`).set('Authorization', `Bearer ${token}`)
      .attach('image', Buffer.from('<svg/>'), { filename: 'x.svg', contentType: 'image/svg+xml' });
    expect(res.status).toBe(400);
  });
});
