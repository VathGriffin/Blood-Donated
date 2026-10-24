process.env.FRONTEND_URL = 'https://app.example.com/, https://blood-donated-*-team.vercel.app';
process.env.TRUST_PROXY = '1';

const request = require('supertest');
const app = require('../src/app');
const { buildOriginChecker } = require('../src/common/cors');

describe('buildOriginChecker', () => {
  test('always allows local development and requests without an Origin header', () => {
    const allowed = buildOriginChecker('');
    expect(allowed('http://localhost:3000')).toBe(true);
    expect(allowed('http://127.0.0.1:3000')).toBe(true);
    expect(allowed(undefined)).toBe(true);
    expect(allowed('https://evil.com')).toBe(false);
  });

  test('accepts several comma-separated origins and forgives a trailing slash', () => {
    const allowed = buildOriginChecker('https://app.example.com/, https://other.example.org');
    expect(allowed('https://app.example.com')).toBe(true);
    expect(allowed('https://other.example.org')).toBe(true);
    expect(allowed('https://third.example.net')).toBe(false);
  });

  test('a "*" matches one hostname label, so Vercel preview URLs work', () => {
    const allowed = buildOriginChecker('https://blood-donated-*-vithvaths-projects.vercel.app');
    expect(allowed('https://blood-donated-8c3p73j9p-vithvaths-projects.vercel.app')).toBe(true);
    expect(allowed('https://blood-donated-abc123-vithvaths-projects.vercel.app')).toBe(true);
  });

  test('a wildcard entry still refuses look-alikes, other schemes and extra labels', () => {
    const allowed = buildOriginChecker('https://blood-donated-*-vithvaths-projects.vercel.app');
    for (const origin of [
      'http://blood-donated-8c3p73j9p-vithvaths-projects.vercel.app',                        // wrong scheme
      'https://blood-donated-8c3p73j9p-vithvaths-projects.vercel.app.evil.com',              // suffix trick
      'https://evil.com/blood-donated-8c3p73j9p-vithvaths-projects.vercel.app',              // path trick
      'https://blood-donated-a.b-vithvaths-projects.vercel.app',                             // "*" must not span a dot
      'https://blood-donated--vithvaths-projects.vercel.app',                                // "*" needs at least one character
      'https://blood-donated-8c3p73j9p-other-projects.vercel.app',                           // another team
    ]) {
      expect(allowed(origin)).toBe(false);
    }
  });

  test('regex characters in a configured origin are treated literally', () => {
    const allowed = buildOriginChecker('https://a.b.com');
    expect(allowed('https://aXb.com')).toBe(false); // the "." is not a wildcard
  });
});

describe('the API applies it', () => {
  test('a configured origin, including a Vercel preview, gets CORS headers', async () => {
    for (const origin of ['https://app.example.com', 'https://blood-donated-8c3p73j9p-team.vercel.app']) {
      const res = await request(app).get('/').set('Origin', origin);
      expect(res.headers['access-control-allow-origin']).toBe(origin);
    }
  });

  test('an unknown origin gets none, so the browser blocks it', async () => {
    const res = await request(app).get('/').set('Origin', 'https://evil.com');
    expect(res.status).toBe(200); // the server still answers; the browser is what enforces CORS
    expect(res.headers['access-control-allow-origin']).toBeUndefined();
  });

  test('TRUST_PROXY is applied so each visitor is rate-limited by their own IP behind a host proxy', () => {
    expect(app.get('trust proxy')).toBe(1);
  });
});
