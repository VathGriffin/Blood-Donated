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
