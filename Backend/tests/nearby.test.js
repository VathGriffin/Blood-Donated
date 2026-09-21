const request = require('supertest');
const app = require('../src/app');
const nearbyRoutes = require('../src/nearby/nearby.routes');

const overpassReply = (elements) => ({ ok: true, status: 200, json: async () => ({ elements }) });
const sampleElements = [
  { type: 'node', id: 1, lat: 11.55, lon: 104.92, tags: { amenity: 'hospital', name: 'Calmette Hospital', 'addr:street': 'Monivong Blvd', phone: '+855 23 426 948' } },
  { type: 'way', id: 2, center: { lat: 11.56, lon: 104.93 }, tags: { amenity: 'clinic', name: 'Naga Clinic' } },
  { type: 'node', id: 3, lat: 11.57, lon: 104.94, tags: { amenity: 'hospital' } }, // unnamed → dropped
  { type: 'node', id: 4, lat: 11.55, lon: 104.92, tags: { amenity: 'hospital', name: 'Calmette Hospital' } }, // duplicate → dropped
];
const URL_OK = '/api/nearby/hospitals?lat=11.5564&lng=104.9282';

describe('GET /api/nearby/hospitals', () => {
  let fetchSpy;
  beforeEach(() => {
    nearbyRoutes.clearCache();
    fetchSpy = jest.spyOn(global, 'fetch');
    jest.spyOn(console, 'warn').mockImplementation(() => {});
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });
  afterEach(() => jest.restoreAllMocks());

  test('returns parsed, de-duplicated hospitals and identifies itself to Overpass', async () => {
    fetchSpy.mockResolvedValueOnce(overpassReply(sampleElements));
    const res = await request(app).get(URL_OK);

    expect(res.status).toBe(200);
    expect(res.body.stale).toBe(false);
    expect(res.body.hospitals.map((h) => h.name)).toEqual(['Calmette Hospital', 'Naga Clinic']);
    expect(res.body.hospitals[0]).toMatchObject({ type: 'Hospital', address: 'Monivong Blvd', pos: [11.55, 104.92] });
    expect(res.body.hospitals[1]).toMatchObject({ type: 'Clinic', pos: [11.56, 104.93] });

    const [, options] = fetchSpy.mock.calls[0];
    expect(options.method).toBe('POST');
    expect(options.headers['User-Agent']).toMatch(/BloodLife/);
  });

  test('falls back to the next server when the first fails', async () => {
    fetchSpy
      .mockResolvedValueOnce({ ok: false, status: 429, json: async () => ({}) })
      .mockRejectedValueOnce(new Error('network down'))
      .mockResolvedValueOnce(overpassReply(sampleElements));
    const res = await request(app).get(URL_OK);

    expect(res.status).toBe(200);
    expect(res.body.hospitals).toHaveLength(2);
    expect(fetchSpy).toHaveBeenCalledTimes(3);
  });

  test('skips a server that just failed and starts with the one that last worked', async () => {
    fetchSpy
      .mockRejectedValueOnce(new Error('504'))          // main server overloaded
      .mockResolvedValueOnce(overpassReply(sampleElements)); // mirror answers
    await request(app).get(URL_OK);
    const [mainUrl] = fetchSpy.mock.calls[0];
    const [mirrorUrl] = fetchSpy.mock.calls[1];
    expect(mirrorUrl).not.toBe(mainUrl);

    // a different area (cache miss): must go straight to the mirror, not retry the failed server first
    fetchSpy.mockResolvedValueOnce(overpassReply(sampleElements));
    await request(app).get('/api/nearby/hospitals?lat=13.3671&lng=103.8448');
    expect(fetchSpy).toHaveBeenCalledTimes(3);
    expect(fetchSpy.mock.calls[2][0]).toBe(mirrorUrl);
  });

  test('treats an Overpass "remark" (query ran out of time) as a failure', async () => {
    fetchSpy
      .mockResolvedValueOnce({ ok: true, status: 200, json: async () => ({ elements: [], remark: 'runtime error: timeout' }) })
      .mockResolvedValueOnce(overpassReply(sampleElements));
    const res = await request(app).get(URL_OK);
    expect(res.body.hospitals).toHaveLength(2);
  });

  test('serves repeat requests for the same area from cache', async () => {
    fetchSpy.mockResolvedValueOnce(overpassReply(sampleElements));
    await request(app).get(URL_OK);
    const second = await request(app).get(URL_OK);

    expect(second.status).toBe(200);
    expect(second.body.hospitals).toHaveLength(2);
    expect(fetchSpy).toHaveBeenCalledTimes(1);
  });

  test('returns 502 with a readable message when every server fails', async () => {
    fetchSpy.mockRejectedValue(new Error('offline'));
    const res = await request(app).get(URL_OK);

    expect(res.status).toBe(502);
    expect(res.body.message).toMatch(/temporarily unavailable/i);
    expect(res.body.error).toBe(res.body.message);
  });

  test('serves expired cache with stale:true when every server is down', async () => {
    fetchSpy.mockResolvedValueOnce(overpassReply(sampleElements));
    await request(app).get(URL_OK);

    const realNow = Date.now();
    jest.spyOn(Date, 'now').mockReturnValue(realNow + 11 * 60 * 1000); // past the 10-minute TTL
    fetchSpy.mockRejectedValue(new Error('offline'));
    const res = await request(app).get(URL_OK);

    expect(res.status).toBe(200);
    expect(res.body.stale).toBe(true);
    expect(res.body.hospitals).toHaveLength(2);
  });

  test('rejects missing or invalid coordinates with 400 and never calls Overpass', async () => {
    for (const q of ['', '?lat=abc&lng=1', '?lat=11.5', '?lat=999&lng=104']) {
      const res = await request(app).get(`/api/nearby/hospitals${q}`);
      expect(res.status).toBe(400);
    }
    expect(fetchSpy).not.toHaveBeenCalled();
  });
});
