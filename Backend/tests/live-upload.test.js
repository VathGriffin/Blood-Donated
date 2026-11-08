const fs = require('fs');
const path = require('path');
const request = require('supertest');
const app = require('../src/app');
const Donor = require('../src/donor/donor.model');
const { liveUpload, liveUploadChecker } = require('../src/common/live-upload');

const UPLOADS = path.join(__dirname, '../uploads');
const KEPT = 'live-upload-test-kept.jpg';

beforeAll(() => fs.writeFileSync(path.join(UPLOADS, KEPT), 'x'));
afterAll(() => fs.rmSync(path.join(UPLOADS, KEPT), { force: true }));

test('the list checker gives the same answers as the single-photo check', async () => {
  const photos = [`/uploads/${KEPT}`, '/uploads/live-upload-test-gone.jpg', 'https://example.com/a.jpg', null, '', 42];
  const check = await liveUploadChecker(photos);
  expect(photos.map(check)).toEqual(photos.map(liveUpload));
  expect(photos.map(check)).toEqual([`/uploads/${KEPT}`, null, 'https://example.com/a.jpg', null, null, null]);
});

test('without any uploaded photos the folder is not read at all', async () => {
  const spy = jest.spyOn(fs.promises, 'readdir');
  const check = await liveUploadChecker([null, 'https://example.com/a.jpg']);
  expect(check('https://example.com/a.jpg')).toBe('https://example.com/a.jpg');
  expect(spy).not.toHaveBeenCalled();
  spy.mockRestore();
});

test('the public donor list keeps existing photos and drops missing ones', async () => {
  const base = { email: 'a@test.com', phone: '0912345678', bloodType: 'O+', location: 'Phnom Penh' };
  await Donor.create([
    { ...base, fullName: 'Has Photo', photo: `/uploads/${KEPT}` },
    { ...base, fullName: 'Lost Photo', email: 'b@test.com', photo: '/uploads/live-upload-test-gone.jpg' },
  ]);
  const res = await request(app).get('/api/donors');
  expect(res.status).toBe(200);
  const byName = Object.fromEntries(res.body.map((d) => [d.fullName, d]));
  expect(byName['Has Photo'].photo).toBe(`/uploads/${KEPT}`);
  expect(byName['Lost Photo'].photo).toBeNull();
  expect(byName['Has Photo'].phone).toBeUndefined(); // still public fields only
});
