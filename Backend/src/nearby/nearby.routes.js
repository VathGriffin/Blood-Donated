const express = require('express');
const router = express.Router();

// Public Overpass (OpenStreetMap) servers. Any one of them is regularly slow,
// rate-limited or down (the main one often answers 504 when busy), so they are
// raced: see queryOverpass. Only servers holding the whole planet belong here —
// regional ones (e.g. overpass.osm.ch, Switzerland only) answer fast with an
// empty list, which looked like "no hospitals" and then got preferred as lastGood.
const ENDPOINTS = [
  'https://overpass.openstreetmap.fr/api/interpreter',
  'https://overpass-api.de/api/interpreter',
  'https://lz4.overpass-api.de/api/interpreter',
  'https://overpass.private.coffee/api/interpreter',
  'https://overpass.kumi.systems/api/interpreter',
];
const COOLDOWN_MS = 2 * 60 * 1000; // skip a server that just failed instead of waiting on it again
const ATTEMPT_TIMEOUT_MS = 8000;
const HEDGE_MS = 1500;             // a server silent this long gets a backup request racing it
const TOTAL_BUDGET_MS = 12000;
const CACHE_TTL_MS = 10 * 60 * 1000;
const CACHE_MAX_ENTRIES = 200;
// Overpass asks clients to identify themselves and rejects generic ones (HTTP 406),
// which is one reason calling it straight from the browser was unreliable.
const USER_AGENT = 'BloodLifeCambodia/2.0 (blood donation platform; HUST graduation project)';

const cache = new Map(); // "lat,lng" (~1 km cell) -> { t, hospitals }
const failedAt = new Map(); // endpoint -> time of its last failure
let lastGood = null;        // endpoint that answered most recently
const inflight = new Map(); // "lat,lng" -> pending lookup, so simultaneous requests share one

// nwr: hospitals are often mapped as buildings (ways), not just points.
// Blood centres are tagged healthcare=blood_donation (older maps: amenity=blood_bank).
const buildQuery = (lat, lng) =>
  `[out:json][timeout:20];(nwr["amenity"="hospital"](around:15000,${lat},${lng});nwr["amenity"="clinic"](around:10000,${lat},${lng});` +
  `nwr["healthcare"="blood_donation"](around:15000,${lat},${lng});nwr["amenity"="blood_bank"](around:15000,${lat},${lng}););out tags center 200;`;

// OSM values are free text from volunteers: only ever pass on a plain http(s) URL, and cap lengths,
// because the browser renders these as links and images.
const cleanUrl = (value) => {
  const url = String(value || '').split(';')[0].trim();
  return /^https?:\/\/[^\s"'<>]{4,300}$/i.test(url) ? url : '';
};
const cleanText = (value, max = 120) => String(value || '').replace(/\s+/g, ' ').trim().slice(0, max);

const OWNERSHIP = { government: 'Public', public: 'Public', private: 'Private', community: 'Community', charitable: 'Charity', ngo: 'Charity' };

function placeType(tags) {
  if (tags.healthcare === 'blood_donation' || tags.amenity === 'blood_bank' || tags.amenity === 'blood_donation') return 'Blood Center';
  return tags.amenity === 'hospital' ? 'Hospital' : 'Clinic';
}

function parseHospitals(elements = []) {
  const seen = new Set();
  const out = [];
  for (const el of elements) {
    const lat = el.lat ?? el.center?.lat;
    const lon = el.lon ?? el.center?.lon;
    const tags = el.tags;
    if (lat == null || lon == null || !tags) continue;
    const type = placeType(tags);
    // Blood-donation sites are often mapped without a name; they are still real places worth showing.
    const name = cleanText(tags['name:en'] || tags.name, 100) || (type === 'Blood Center' ? 'Blood donation point' : '');
    if (!name) continue;
    const dedupe = `${name.toLowerCase()}|${lat.toFixed(3)}|${lon.toFixed(3)}`;
    if (seen.has(dedupe)) continue;
    seen.add(dedupe);
    const street = [tags['addr:housenumber'], tags['addr:street']].filter(Boolean).join(' ');
    out.push({
      id: `${el.type}-${el.id}`,
      name,
      pos: [lat, lon],
      address: [street, tags['addr:city']].filter(Boolean).join(', ') || tags['addr:full'] || '',
      phone: tags.phone || tags['contact:phone'] || '',
      type,
      // Optional extras — present only when someone has mapped them, never guessed.
      website: cleanUrl(tags.website || tags['contact:website']),
      image: cleanUrl(tags.image),
      hours: cleanText(tags.opening_hours),
      description: cleanText(tags['description:en'] || tags.description, 300),
      emergency: tags.emergency === 'yes' || tags['healthcare:emergency'] === 'yes',
      wheelchair: tags.wheelchair === 'yes',
      operator: cleanText(tags.operator, 80),
      ownership: OWNERSHIP[String(tags['operator:type'] || '').toLowerCase()] || '',
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

async function askEndpoint(endpoint, body, signal) {
  const res = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Accept: 'application/json',
      'User-Agent': USER_AGENT,
    },
    body,
    signal,
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const data = await res.json();
  // Overpass reports a query that ran out of time/memory as 200 + a "remark".
  if (!Array.isArray(data.elements) || data.remark) throw new Error(data.remark || 'malformed response');
  return data.elements;
}

// Asks the best server first. A failure moves straight on to the next one; a server that
// is merely slow gets a backup request after HEDGE_MS, and whichever answers first wins
// (the rest are cancelled). So one hung server costs ~1.5 s instead of a full timeout.
function queryOverpass(lat, lng) {
  const body = `data=${encodeURIComponent(buildQuery(lat, lng))}`;
  const queue = orderedEndpoints();
  const attempts = []; // { ctrl, timer } per request sent
  let running = 0;
  let done = false;
  let lastError;
  let hedgeTimer;

  return new Promise((resolve, reject) => {
    const finish = (hospitals, err) => {
      if (done) return;
      done = true;
      clearTimeout(budgetTimer);
      clearTimeout(hedgeTimer);
      attempts.forEach(({ ctrl, timer }) => { clearTimeout(timer); ctrl.abort(); });
      if (hospitals) resolve(hospitals); else reject(err);
    };
    const budgetTimer = setTimeout(() => finish(null, lastError || new Error('Overpass lookup timed out')), TOTAL_BUDGET_MS);

    const launch = () => {
      clearTimeout(hedgeTimer);
      if (done) return;
      const endpoint = queue.shift();
      if (!endpoint) {
        if (!running) finish(null, lastError || new Error('no Overpass endpoint available'));
        return;
      }
      const ctrl = new AbortController();
      const timer = setTimeout(() => ctrl.abort(new Error('timed out')), ATTEMPT_TIMEOUT_MS);
      attempts.push({ ctrl, timer });
      running += 1;
      hedgeTimer = setTimeout(launch, HEDGE_MS);

      askEndpoint(endpoint, body, ctrl.signal)
        .then((elements) => {
          failedAt.delete(endpoint);
          lastGood = endpoint;
          finish(parseHospitals(elements));
        })
        .catch((err) => {
          if (done) return; // cancelled because another server already answered
          lastError = err;
          failedAt.set(endpoint, Date.now());
          console.warn(`[nearby] ${new URL(endpoint).host} failed: ${err.message}`);
        })
        .finally(() => {
          clearTimeout(timer);
          running -= 1;
          if (!done) launch();
        });
    };
    launch();
  });
}

// One Overpass lookup per area at a time: requests arriving while it runs wait for it.
function lookup(key, lat, lng) {
  if (!inflight.has(key)) {
    inflight.set(key, queryOverpass(lat, lng).finally(() => inflight.delete(key)));
  }
  return inflight.get(key);
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
    const hospitals = await lookup(key, lat, lng);
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

router.clearCache = () => { cache.clear(); failedAt.clear(); inflight.clear(); lastGood = null; };

module.exports = router;
