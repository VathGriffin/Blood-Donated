const request = require('supertest');
const jwt = require('jsonwebtoken');
const app = require('../src/app');
const Donor = require('../src/donor/donor.model');
const { createAdmin, signDonor } = require('./helpers');

const donorBody = {
  fullName: 'Sok Dara',
  email: 'sok.dara@test.com',
  phone: '0912345678',
  bloodType: 'O+',
  location: 'Phnom Penh',
};

describe('donor CRUD', () => {
  test('creates a donor and issues a scoped photo-upload token', async () => {
    const created = await request(app).post('/api/donors').send(donorBody);
    expect(created.status).toBe(201);
    expect(created.body.photoUploadToken).toBeDefined();
  });

  test('public fetch omits email/phone; staff fetch includes them', async () => {
    const created = await request(app).post('/api/donors').send(donorBody);

    const publicFetch = await request(app).get(`/api/donors/${created.body._id}`);
    expect(publicFetch.status).toBe(200);
    expect(publicFetch.body.email).toBeUndefined();
    expect(publicFetch.body.phone).toBeUndefined();
    expect(publicFetch.body.fullName).toBe(donorBody.fullName);

    const { token: staffToken } = await createAdmin();
    const staffFetch = await request(app)
      .get(`/api/donors/${created.body._id}`)
      .set('Authorization', `Bearer ${staffToken}`);
    expect(staffFetch.body.email).toBe(donorBody.email);
  });

  test('photo upload requires the scoped token or a staff role', async () => {
    const created = await request(app).post('/api/donors').send(donorBody);
    const donorId = created.body._id;

    const rejected = await request(app)
      .post(`/api/donors/${donorId}/photo`)
      .attach('photo', Buffer.from('fake-image-bytes'), 'photo.jpg');
    expect(rejected.status).toBe(401);

    const accepted = await request(app)
      .post(`/api/donors/${donorId}/photo`)
      .set('Authorization', `Bearer ${created.body.photoUploadToken}`)
      .attach('photo', Buffer.from('fake-image-bytes'), 'photo.jpg');
    expect(accepted.status).toBe(200);
    expect(accepted.body.photo).toBeDefined();
  });

  test('a photo-upload token cannot be used against a different donor', async () => {
    const created = await request(app).post('/api/donors').send(donorBody);
    const other = await request(app)
      .post('/api/donors')
      .send({ ...donorBody, email: 'other@test.com' });

    const res = await request(app)
      .post(`/api/donors/${other.body._id}/photo`)
      .set('Authorization', `Bearer ${created.body.photoUploadToken}`)
      .attach('photo', Buffer.from('fake-image-bytes'), 'photo.jpg');
    expect(res.status).toBe(401);
  });

  test('lookup by email', async () => {
    await request(app).post('/api/donors').send(donorBody);
    const res = await request(app).get(`/api/donors/lookup?email=${donorBody.email}`);
    expect(res.body.found).toBe(true);
    expect(res.body.bloodType).toBe('O+');
  });

  test('lookup for unknown email returns found:false', async () => {
    const res = await request(app).get('/api/donors/lookup?email=nobody@test.com');
    expect(res.body.found).toBe(false);
  });
});

describe('donor QR verification', () => {
  test('issues a QR token for the donor themselves and staff can verify it', async () => {
    const donor = await Donor.create(donorBody);
    const donorToken = signDonor(donor);

    const issued = await request(app)
      .get(`/api/donors/${donor._id}/qr-token`)
      .set('Authorization', `Bearer ${donorToken}`);
    expect(issued.status).toBe(200);
    expect(issued.body.token).toBeDefined();

    const { token: staffToken } = await createAdmin();
    const verified = await request(app)
      .post('/api/donors/verify-qr')
      .set('Authorization', `Bearer ${staffToken}`)
      .send({ token: issued.body.token });
    expect(verified.status).toBe(200);
    expect(verified.body.valid).toBe(true);
    expect(verified.body.donor.email).toBe(donorBody.email);
    expect(verified.body.eligibility).toBeDefined();
  });

  test('a donor cannot issue a QR token for someone else\'s profile', async () => {
    const donor = await Donor.create(donorBody);
    const otherDonorToken = signDonor({ _id: 'x', email: 'someone-else@test.com', fullName: 'Other' });
    const res = await request(app)
      .get(`/api/donors/${donor._id}/qr-token`)
      .set('Authorization', `Bearer ${otherDonorToken}`);
    expect(res.status).toBe(403);
  });

  test('rejects an expired QR token', async () => {
    const donor = await Donor.create(donorBody);
    const expiredToken = jwt.sign(
      { sub: donor._id, email: donor.email, type: 'donor_qr' },
      process.env.QR_JWT_SECRET,
      { expiresIn: '-1s' }
    );
    const { token: staffToken } = await createAdmin();
    const res = await request(app)
      .post('/api/donors/verify-qr')
      .set('Authorization', `Bearer ${staffToken}`)
      .send({ token: expiredToken });
    expect(res.status).toBe(400);
    expect(res.body.reason).toBe('expired');
  });

  test('rejects a tampered QR token', async () => {
    const donor = await Donor.create(donorBody);
    const validToken = jwt.sign(
      { sub: donor._id, email: donor.email, type: 'donor_qr' },
      process.env.QR_JWT_SECRET,
      { expiresIn: '180d' }
    );
    const tampered = validToken.slice(0, -2) + (validToken.slice(-2) === 'aa' ? 'bb' : 'aa');
    const { token: staffToken } = await createAdmin();
    const res = await request(app)
      .post('/api/donors/verify-qr')
      .set('Authorization', `Bearer ${staffToken}`)
      .send({ token: tampered });
    expect(res.status).toBe(400);
    expect(res.body.reason).toBe('invalid');
  });
});
