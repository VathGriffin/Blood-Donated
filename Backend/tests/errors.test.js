const request = require('supertest');
const app = require('../src/app');
const { sendError } = require('../src/common/middleware/error-handler');
const { createAdmin } = require('./helpers');

describe('error handling', () => {
  test('a malformed id is a 400 that does not leak Mongoose internals', async () => {
    const { token } = await createAdmin(); // /api/requests/:id needs a login
    for (const path of ['/api/donors/not-an-id', '/api/hospitals/123', '/api/requests/zzz']) {
      const res = await request(app).get(path).set('Authorization', `Bearer ${token}`);
      expect(res.status).toBe(400);
      expect(res.body.message).toBe('Invalid id');
      expect(res.body.error).toBe('Invalid id');
      expect(JSON.stringify(res.body)).not.toMatch(/Cast to ObjectId|model/i);
    }
  });

  test('unknown routes return a JSON 404 instead of an HTML page', async () => {
    for (const path of ['/api/nope', '/nothing']) {
      const res = await request(app).get(path);
      expect(res.status).toBe(404);
      expect(res.headers['content-type']).toMatch(/json/);
      expect(res.body.message).toMatch(/not found/i);
    }
  });

  test('validation errors are a 400 with readable field messages', async () => {
    const res = await request(app).post('/api/donors').send({});
    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/required/i);
  });

  test('a malformed JSON body is a 400', async () => {
    const res = await request(app).post('/api/donors').set('Content-Type', 'application/json').send('{bad');
    expect(res.status).toBe(400);
  });

  test('a non-image upload is a 400', async () => {
    const created = await request(app).post('/api/donors').send({
      fullName: 'Sok Dara', email: 'err.test@test.com', phone: '0912345678', bloodType: 'O+', location: 'Phnom Penh',
    });
    const auth = `Bearer ${created.body.photoUploadToken}`;
    const url = `/api/donors/${created.body._id}/photo`;

    const notImage = await request(app).post(url).set('Authorization', auth)
      .attach('photo', Buffer.from('x'), { filename: 'a.txt', contentType: 'text/plain' });
    expect(notImage.status).toBe(400);
  });
});

describe('sendError', () => {
  const mockRes = () => {
    const res = { headersSent: false };
    res.status = jest.fn().mockReturnValue(res);
    res.json = jest.fn().mockReturnValue(res);
    return res;
  };
  let errorSpy;
  beforeEach(() => { errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {}); });
  afterEach(() => { errorSpy.mockRestore(); process.env.NODE_ENV = 'test'; });

  test('unknown errors are 500s that hide internals in production but are logged', () => {
    process.env.NODE_ENV = 'production';
    const res = mockRes();
    sendError(res, new Error('connection to 10.0.0.5:27017 refused'), { method: 'GET', originalUrl: '/api/x' });
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json.mock.calls[0][0].message).toBe('Internal server error');
    expect(errorSpy).toHaveBeenCalled();
  });

  test('maps duplicate-key, JWT and multer size errors to their proper status', () => {
    const cases = [
      [{ code: 11000, keyPattern: { email: 1 } }, 409],
      [{ name: 'TokenExpiredError', message: 'jwt expired' }, 401],
      [{ name: 'MulterError', code: 'LIMIT_FILE_SIZE', message: 'File too large' }, 413],
    ];
    for (const [err, status] of cases) {
      const res = mockRes();
      sendError(res, Object.assign(new Error(err.message || 'x'), err));
      expect(res.status).toHaveBeenCalledWith(status);
    }
  });
});
