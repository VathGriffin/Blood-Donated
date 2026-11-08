// Data helpers for the Donor Directory. Donor records come from GET /api/donors without a login,
// so they only carry the public fields: fullName, bloodType, location, available, photo,
// donationCount, lastDonation and createdAt. Phone and email never reach this page.
import { RECEIVES_FROM } from '@/lib/blood-compat';
import { eligibilityOf } from '@/lib/eligibility';
import { countTrend } from '@/lib/trend';

// Labels: directory.availability.<value> and directory.sort.<value> in i18n/messages/directory.js.
export const AVAILABILITY = ['all', 'available', 'ready'];

export const SORT_OPTIONS = ['recent', 'name', 'donations', 'lastDonation'];

export const noFilters = { search: '', bloodType: '', availability: 'all', city: '', compatible: false };

// The city is the last comma-separated part of the location ("Street 271, Phnom Penh" -> "Phnom Penh"),
// ignoring a trailing country and letter case, so "phnom penh" and "Phnom Penh, Cambodia" match.
const titleCase = (s) => s.replace(/\b\w/g, (c) => c.toUpperCase());
export const cityOf = (location = '') => {
  const parts = String(location).split(',').map((s) => s.trim().toLowerCase().replace(/\s+/g, ' ')).filter(Boolean);
  if (parts.length > 1 && parts[parts.length - 1] === 'cambodia') parts.pop();
  const city = (parts.pop() || '').replace(/\s+cambodia$/, '');
  return city ? titleCase(city) : '';
};

/** "Ready to donate" = the donor marked themselves available and the 56-day interval has passed. */
export const isReady = (d) => !!d.available && eligibilityOf(d.lastDonation).eligible;

const time = (date) => Date.parse(date) || 0;

/**
 * Works out each donor's city, search text, readiness and dates once, when the list loads, so
 * filtering and sorting on every keystroke only compare ready-made values. The extra fields
 * start with "_"; the API fields are untouched.
 */
export const prepareDonors = (donors) => donors.map((d) => ({
  ...d,
  _city: cityOf(d.location),
  // Name and location on separate lines, so a search never matches across the two.
  _text: `${d.fullName || ''}\n${d.location || ''}`.toLowerCase(),
  _ready: isReady(d),
  _created: time(d.createdAt),
  _last: time(d.lastDonation),
}));

/** Every city donors list, most common first: [{ name, count }]. */
export function citiesOf(donors) {
  const counts = new Map();
  for (const d of donors) {
    const c = d._city ?? cityOf(d.location);
    if (c) counts.set(c, (counts.get(c) || 0) + 1);
  }
  return [...counts.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0])).map(([name, count]) => ({ name, count }));
}

const byName = new Intl.Collator(undefined, { sensitivity: 'base' });
const SORTERS = {
  name: (a, b) => byName.compare(a.fullName || '', b.fullName || ''),
  donations: (a, b) => (b.donationCount || 0) - (a.donationCount || 0),
  lastDonation: (a, b) => b._last - a._last,
  recent: (a, b) => b._created - a._created,
};

/**
 * Everything the directory shows for the current filters, in one pass over prepared donors:
 *   rows       – donors matching every filter, sorted
 *   tabCounts  – { all, available, ready }: every filter except availability, so each tab shows what it would list
 *   typeCounts – { 'A+': { total, available }, … }: every filter except blood type (the By Blood Type tiles)
 * With `compatible`, a blood type matches every donor who can give red cells to that patient type.
 */
export function queryDirectory(prepared, { search = '', availability = 'all', city = '', bloodType = '', compatible = false } = {}, sortBy = 'recent') {
  const q = search.trim().toLowerCase();
  const types = bloodType ? new Set(compatible ? RECEIVES_FROM[bloodType] || [bloodType] : [bloodType]) : null;
  const tabCounts = { all: 0, available: 0, ready: 0 };
  const typeCounts = {};
  const rows = [];
  for (const d of prepared) {
    if (city && d._city !== city) continue;
    if (q && !d._text.includes(q)) continue;
    const availabilityOk = availability === 'all' || (availability === 'available' ? !!d.available : d._ready);
    if (availabilityOk) {
      const t = (typeCounts[d.bloodType] ||= { total: 0, available: 0 });
      t.total += 1;
      if (d.available) t.available += 1;
    }
    if (types && !types.has(d.bloodType)) continue;
    tabCounts.all += 1;
    if (d.available) tabCounts.available += 1;
    if (d._ready) tabCounts.ready += 1;
    if (availabilityOk) rows.push(d);
  }
  rows.sort(SORTERS[sortBy] || SORTERS.recent);
  return { rows, tabCounts, typeCounts };
}

/** New registrations in the last 30 days against the 30 before (see countTrend). */
export const registrationTrend = (donors, opts) => countTrend(donors, (d) => d.createdAt, opts);
