import { findProvince } from '@/lib/places';
import { distanceKm } from '@/lib/geo';

export const DEFAULT_CENTER = [11.5564, 104.9282]; // Phnom Penh [lat, lng]

export const HOSPITAL_LIMIT = 60;
export const DONOR_LIMIT = 100;
export const HOSPITAL_REQUEST_TIMEOUT_MS = 32000; // just above the backend's own worst case (~28 s across several OSM servers)
const CACHE_TTL_MS = 10 * 60 * 1000;

export const BLOOD_COLORS = {
  'A+': '#e53935', 'A-': '#c62828', 'B+': '#8e24aa', 'B-': '#6a1b9a',
  'AB+': '#1565c0', 'AB-': '#0d47a1', 'O+': '#2e7d32', 'O-': '#1b5e20',
};
export const BLOOD_TYPES = Object.keys(BLOOD_COLORS);

// One colour per kind of place, shared by the map pins, the legend, the list and the detail panel.
export const TYPE_META = {
  Hospital:       { color: '#c62828', tint: '#ffebee', plural: 'Hospitals' },
  Clinic:         { color: '#1976d2', tint: '#e3f2fd', plural: 'Clinics' },
  'Blood Center': { color: '#2e7d32', tint: '#e8f5e9', plural: 'Blood Centers' },
};
export const TYPE_FILTERS = [['all', 'All'], ['Hospital', 'Hospitals'], ['Clinic', 'Clinics'], ['Blood Center', 'Blood Centers']];

// OSM phone tags can hold several numbers ("+855 23 1; +855 12 2"): call the first one.
export const firstPhone = (phone) => String(phone || '').split(/[;,/]/)[0].trim();
export const telHref = (phone) => {
  const digits = firstPhone(phone).replace(/[^\d+]/g, '');
  return digits.replace(/\D/g, '').length >= 5 ? `tel:${digits}` : null;
};

export const directionsUrl = (lat, lng) => `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
export const openDirections = (lat, lng) => { window.open(directionsUrl(lat, lng), '_blank', 'noopener,noreferrer'); };

// "node-123" -> the place's own page on OpenStreetMap, where anyone can add missing details.
export const osmUrl = (id) => {
  const [kind, num] = String(id).split('-');
  return /^(node|way|relation)$/.test(kind) && /^\d+$/.test(num) ? `https://www.openstreetmap.org/${kind}/${num}` : null;
};

export const websiteHost = (url) => {
  try { return new URL(url).hostname.replace(/^www\./, ''); } catch { return url; }
};

export const formatKm = (km) => (km < 10 ? km.toFixed(1) : String(Math.round(km)));

// sessionStorage cache so tab switches / revisits do not re-request hospitals. Versioned: the shape
// gained fields (website, hours, …), so entries from the old shape must not be reused.
export const cacheKey = (lat, lng) => `bl:hospitals:v3:${lat.toFixed(2)},${lng.toFixed(2)}`;
export const readCache = (key) => {
  try {
    const raw = sessionStorage.getItem(key);
    if (!raw) return null;
    const { t, v } = JSON.parse(raw);
    return Date.now() - t < CACHE_TTL_MS ? v : null;
  } catch { return null; }
};
export const writeCache = (key, v) => {
  try { sessionStorage.setItem(key, JSON.stringify({ t: Date.now(), v })); } catch { /* quota / private mode */ }
};

const placeName = (item) => String(item.name || item.fullName || '');

// The nearest `limit` places; "name" then lists those same places alphabetically.
export const rankPlaces = (list, center, limit, sort = 'nearest') => {
  const nearest = list
    .map((item) => ({ ...item, dist: distanceKm(center, item.base || item.pos) }))
    .sort((a, b) => a.dist - b.dist)
    .slice(0, limit);
  return sort === 'name' ? nearest.sort((a, b) => placeName(a).localeCompare(placeName(b))) : nearest;
};

// Donors only have a city, so everyone in a city shares one coordinate and their
// markers stack into one unclickable pile. Spread them deterministically (~0.4-3 km)
// around the city centre; distance is still measured to the real city centre.
export const spreadPos = ([lat, lng], seed) => {
  let h = 0;
  for (const c of String(seed)) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  const angle = ((h % 360) * Math.PI) / 180;
  const r = 0.004 + (((h >>> 9) % 100) / 100) * 0.026;
  return [lat + r * Math.sin(angle), lng + r * Math.cos(angle)];
};

export const toDonorPlaces = (donors, { bloodFilter, availableOnly }) =>
  (donors || [])
    .filter((d) => (!bloodFilter || d.bloodType === bloodFilter) && (!availableOnly || d.available))
    .map((d) => ({ d, base: findProvince(d.location)?.pos }))
    .filter(({ base }) => base)
    .map(({ d, base }) => ({ ...d, id: d._id, base, pos: spreadPos(base, d._id) }));

// Keeps ?city= in the address bar in sync with the current search so the view is shareable.
export const setCityParam = (value) => {
  try {
    const url = new URL(window.location.href);
    if (value) url.searchParams.set('city', value); else url.searchParams.delete('city');
    window.history.replaceState(window.history.state, '', url);
  } catch { /* purely cosmetic */ }
};

// Opening hours are free text in OSM. Only "24/7" is treated as a fact we can badge; anything
// else is shown to the reader as written.
export const isOpen247 = (item) => /^24\s*\/\s*7$/i.test(item.hours || '');
