const request = require('supertest');
const fs = require('fs');
const path = require('path');
const app = require('../src/app');
const { createAdmin, signDonor } = require('./helpers');

const uploadsDir = path.join(__dirname, '../uploads');
const onDisk = (photoUrl) => fs.existsSync(path.join(uploadsDir, path.basename(photoUrl)));
const png = Buffer.from('89504e470d0a1a0a', 'hex'); // just enough to look like a PNG upload
const created = [];
const track = (photoUrl) => { if (photoUrl) created.push(path.join(uploadsDir, path.basename(photoUrl))); return photoUrl; };

afterAll(() => created.forEach((f) => { try { fs.unlinkSync(f); } catch { /* already removed */ } }));

describe('staff profile photo', () => {
  test('an admin can upload a photo; /me and login-style payloads return it', async () => {
    const { token } = await createAdmin();
    const res = await request(app).post('/api/staff/me/photo').set('Authorization', `Bearer ${token}`)
      .attach('photo', png, { filename: 'me.png', contentType: 'image/png' });
    expect(res.status).toBe(200);
    expect(track(res.body.photo)).toMatch(/^\/uploads\/staff-.+\.png$/);
    expect(onDisk(res.body.photo)).toBe(true);

    const me = await request(app).get('/api/staff/me').set('Authorization', `Bearer ${token}`);
    expect(me.body.photo).toBe(res.body.photo);
  });

  test('uploading again replaces the photo and deletes the old file', async () => {
    const { token } = await createAdmin();
    const send = () => request(app).post('/api/staff/me/photo').set('Authorization', `Bearer ${token}`)
      .attach('photo', png, { filename: 'me.png', contentType: 'image/png' });
    const first = await send();
    track(first.body.photo);
    await new Promise((r) => setTimeout(r, 5)); // filenames embed a timestamp
    const second = await send();
    track(second.body.photo);

    expect(second.body.photo).not.toBe(first.body.photo);
    expect(onDisk(first.body.photo)).toBe(false);
    expect(onDisk(second.body.photo)).toBe(true);
  });

  test('DELETE removes the photo from the account and from disk', async () => {
    const { token } = await createAdmin();
    const up = await request(app).post('/api/staff/me/photo').set('Authorization', `Bearer ${token}`)
      .attach('photo', png, { filename: 'me.png', contentType: 'image/png' });
    track(up.body.photo);

    const del = await request(app).delete('/api/staff/me/photo').set('Authorization', `Bearer ${token}`);
    expect(del.status).toBe(200);
    expect(del.body.photo).toBeNull();
    expect(onDisk(up.body.photo)).toBe(false);
  });

  test('a script-carrying upload cannot be stored under a dangerous extension', async () => {
    const { token } = await createAdmin();

    // "evil.html" sent as an image is stored by its verified type, so it is served as a PNG, never as HTML
    const disguised = await request(app).post('/api/staff/me/photo').set('Authorization', `Bearer ${token}`)
      .attach('photo', Buffer.from('<script>alert(1)</script>'), { filename: 'evil.html', contentType: 'image/png' });
    expect(disguised.status).toBe(200);
    track(disguised.body.photo);
    expect(disguised.body.photo).toMatch(/\.png$/);
    expect(disguised.body.photo).not.toMatch(/html/i);

    // SVG can carry scripts and is rejected outright; so is anything that is not an image
    for (const [filename, contentType] of [['x.svg', 'image/svg+xml'], ['x.txt', 'text/plain'], ['x.html', 'text/html']]) {
      const res = await request(app).post('/api/staff/me/photo').set('Authorization', `Bearer ${token}`)
        .attach('photo', Buffer.from('<svg/>'), { filename, contentType });
      expect(res.status).toBe(400);
      expect(res.body.message).toMatch(/JPG, PNG, WebP or GIF/);
    }
  });

  test('a file over 10 MB is rejected with 413', async () => {
    const { token } = await createAdmin();
    const res = await request(app).post('/api/staff/me/photo').set('Authorization', `Bearer ${token}`)
      .attach('photo', Buffer.alloc(10 * 1024 * 1024 + 1024), { filename: 'big.png', contentType: 'image/png' });
    expect(res.status).toBe(413);
    expect(res.body.message).toMatch(/too large/i);
  });

  test('requires a staff login: anonymous is 401 and a donor token is 403', async () => {
    const anon = await request(app).post('/api/staff/me/photo').attach('photo', png, { filename: 'a.png', contentType: 'image/png' });
    expect(anon.status).toBe(401);
    const donor = await request(app).post('/api/staff/me/photo').set('Authorization', `Bearer ${signDonor({ id: '64b000000000000000000001', email: 'd@test.com', fullName: 'Donor' })}`)
      .attach('photo', png, { filename: 'a.png', contentType: 'image/png' });
    expect(donor.status).toBe(403);
    expect((await request(app).delete('/api/staff/me/photo')).status).toBe(401);
  });

  test('no file is a 400', async () => {
    const { token } = await createAdmin();
    const res = await request(app).post('/api/staff/me/photo').set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(400);
  });
});
