const express = require('express');
const router = express.Router();

// Public Overpass (OpenStreetMap) servers. Any one of them is regularly slow,
// rate-limited or down (the main one often answers 504 when busy), so they are
// tried in turn until one answers.
const ENDPOINTS = [
  'https://overpass-api.de/api/interpreter',
  'https://lz4.overpass-api.de/api/interpreter',
  'https://overpass.openstreetmap.fr/api/interpreter',
  'https://overpass.osm.ch/api/interpreter',
  'https://overpass.private.coffee/api/interpreter',
  'https://overpass.kumi.systems/api/interpreter',
];
const COOLDOWN_MS = 2 * 60 * 1000; // skip a server that just failed instead of waiting on it again
const ATTEMPT_TIMEOUT_MS = 8000;
const TOTAL_BUDGET_MS = 20000;
const CACHE_TTL_MS = 10 * 60 * 1000;
const CACHE_MAX_ENTRIES = 200;
// Overpass asks clients to identify themselves and rejects generic ones (HTTP 406),
// which is one reason calling it straight from the browser was unreliable.
const USER_AGENT = 'BloodLifeCambodia/2.0 (blood donation platform; ITC graduation project)';

const cache = new Map(); // "lat,lng" (~1 km cell) -> { t, hospitals }
const failedAt = new Map(); // endpoint -> time of its last failure
let lastGood = null;        // endpoint that answered most recently

// nwr: hospitals are often mapped as buildings (ways), not just points.
const buildQuery = (lat, lng) =>
  `[out:json][timeout:20];(nwr["amenity"="hospital"](around:15000,${lat},${lng});nwr["amenity"="clinic"](around:10000,${lat},${lng}););out tags center 150;`;

function parseHospitals(elements = []) {
  const seen = new Set();
  const out = [];
  for (const el of elements) {
    const lat = el.lat ?? el.center?.lat;
    const lon = el.lon ?? el.center?.lon;
    const tags = el.tags;
    if (lat == null || lon == null || !tags?.name) continue;
    const dedupe = `${tags.name.toLowerCase()}|${lat.toFixed(3)}|${lon.toFixed(3)}`;
    if (seen.has(dedupe)) continue;
    seen.add(dedupe);
    out.push({
      id: `${el.type}-${el.id}`,
      name: tags.name,
      pos: [lat, lon],
      address: [tags['addr:street'], tags['addr:city']].filter(Boolean).join(', ') || tags['addr:full'] || '',
      phone: tags.phone || tags['contact:phone'] || '',
      type: tags.amenity === 'hospital' ? 'Hospital' : 'Clinic',
    });
  }
  return out;
}

// Healthy servers first, the one that last worked at the front; servers still in
// cooldown go last, so they are only tried when nothing else is left.
function orderedEndpoints() {
  const now = Date.now();
  const healthy = ENDPOINTS.filter((e) => !(failedAt.get(e) > now - COOLDOWN_MS));
  const cooling = ENDPOINTS.filter((e) => !healthy.includes(e));
  if (lastGood && healthy.includes(lastGood)) healthy.unshift(...healthy.splice(healthy.indexOf(lastGood), 1));
  return [...healthy, ...cooling];
}

async function queryOverpass(lat, lng) {
  const started = Date.now();
  let lastError;
  for (const endpoint of orderedEndpoints()) {
    if (Date.now() - started > TOTAL_BUDGET_MS) break;
    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          Accept: 'application/json',
          'User-Agent': USER_AGENT,
        },
        body: `data=${encodeURIComponent(buildQuery(lat, lng))}`,
        signal: AbortSignal.timeout(ATTEMPT_TIMEOUT_MS),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      // Overpass reports a query that ran out of time/memory as 200 + a "remark".
      if (!Array.isArray(data.elements) || data.remark) throw new Error(data.remark || 'malformed response');
      failedAt.delete(endpoint);
      lastGood = endpoint;
      return parseHospitals(data.elements);
    } catch (err) {
      lastError = err;
      failedAt.set(endpoint, Date.now());
      console.warn(`[nearby] ${new URL(endpoint).host} failed: ${err.message}`);
    }
  }
  throw lastError || new Error('no Overpass endpoint available');
}

// GET /api/nearby/hospitals?lat=11.55&lng=104.92
// Hospitals and clinics around a point. Cached per ~1 km cell; if every server is
// down, the last good (even expired) result for that cell is served with stale:true.
router.get('/hospitals', async (req, res) => {
  const lat = Number(req.query.lat);
  const lng = Number(req.query.lng);
  if (!Number.isFinite(lat) || !Number.isFinite(lng) || Math.abs(lat) > 90 || Math.abs(lng) > 180) {
    const text = 'lat and lng query parameters are required and must be valid coordinates.';
    return res.status(400).json({ message: text, error: text });
  }

  const key = `${lat.toFixed(2)},${lng.toFixed(2)}`;
  const cached = cache.get(key);
  if (cached && Date.now() - cached.t < CACHE_TTL_MS) {
    return res.json({ hospitals: cached.hospitals, stale: false });
  }

  try {
    const hospitals = await queryOverpass(lat, lng);
    if (hospitals.length) {
      // don't pin an empty result, and keep the cache bounded
      if (cache.size >= CACHE_MAX_ENTRIES) cache.delete(cache.keys().next().value);
      cache.set(key, { t: Date.now(), hospitals });
    }
    res.json({ hospitals, stale: false });
  } catch (err) {
    console.error('[nearby] all Overpass endpoints failed:', err.message);
    if (cached) return res.json({ hospitals: cached.hospitals, stale: true });
    const text = 'Hospital lookup is temporarily unavailable. Please try again in a moment.';
    res.status(502).json({ message: text, error: text });
  }
});

router.clearCache = () => { cache.clear(); failedAt.clear(); lastGood = null; };

module.exports = router;
