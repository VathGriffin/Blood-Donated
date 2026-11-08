import axios from 'axios';
import API_BASE from '@/lib/config';

// The public hospital directory (GET /api/hospitals: name, address, city, phone, location, image)
// changes rarely, but several screens need it — the navbar search, the donor profile's "Contact
// hospital" buttons. One shared, short-lived in-memory cache means one request per page load
// instead of one per component. A failed request is not cached, so the next caller retries.
const TTL_MS = 5 * 60 * 1000;
let cached = null; // { at, promise }

export function getHospitals() {
  if (cached && Date.now() - cached.at < TTL_MS) return cached.promise;
  const promise = axios.get(`${API_BASE}/api/hospitals`)
    .then((res) => (Array.isArray(res.data) ? res.data : []))
    .catch((err) => { cached = null; throw err; });
  cached = { at: Date.now(), promise };
  return promise;
}

// The public donor list (GET /api/donors, no login, so public fields only). Kept for a minute so
// moving between the public /donors page and the dashboard's /donor-directory, or coming back to
// either, shows the list straight away instead of loading it again.
const DONORS_TTL_MS = 60 * 1000;
let donorsCache = null; // { at, promise, data }

const freshDonors = () => donorsCache && Date.now() - donorsCache.at < DONORS_TTL_MS;

/** The cached donor list if it is still fresh, otherwise null (for a first render without a spinner). */
export const peekPublicDonors = () => (freshDonors() ? donorsCache.data : null);

/** `fresh: true` skips the cache (the "Try again" button). */
export function getPublicDonors({ fresh = false } = {}) {
  if (!fresh && freshDonors()) return donorsCache.promise;
  const entry = { at: Date.now(), data: null, promise: null };
  entry.promise = axios.get(`${API_BASE}/api/donors`)
    .then((res) => { entry.data = Array.isArray(res.data) ? res.data : []; return entry.data; })
    .catch((err) => { if (donorsCache === entry) donorsCache = null; throw err; });
  donorsCache = entry;
  return entry.promise;
}
