// Statuses come from the BloodRequest model: Pending / Approved / Rejected / Fulfilled / Cancelled.
export const STATUS_TABS = ['All', 'Pending', 'Approved', 'Fulfilled', 'Rejected', 'Cancelled'];
export const URGENCIES = ['Low', 'Medium', 'High', 'Critical'];
export const BLOOD_TYPES = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

export const statusOf = (r) => r.status || 'Pending';

const daysAgo = (n) => Date.now() - n * 86400000;

// Date-range filter on when the request was submitted (createdAt). The API returns all of the
// donor's own requests in one call, so this filters what is already loaded.
export const RANGES = [
  { value: 'all', label: 'All time', test: () => true },
  { value: '7', label: 'Past 7 days', test: (t) => t >= daysAgo(7) },
  { value: '30', label: 'Past 30 days', test: (t) => t >= daysAgo(30) },
  { value: '90', label: 'Past 3 months', test: (t) => t >= daysAgo(90) },
  { value: 'year', label: 'This year', test: (t) => new Date(t).getFullYear() === new Date().getFullYear() },
];

// Most urgent first among open requests, then newest first.
const URGENCY_RANK = { Critical: 0, High: 1, Medium: 2, Low: 3 };
export const sortRequests = (list) => [...list].sort((a, b) => {
  const openA = statusOf(a) === 'Pending' || statusOf(a) === 'Approved';
  const openB = statusOf(b) === 'Pending' || statusOf(b) === 'Approved';
  if (openA !== openB) return openA ? -1 : 1;
  if (openA && URGENCY_RANK[a.urgency] !== URGENCY_RANK[b.urgency]) return (URGENCY_RANK[a.urgency] ?? 4) - (URGENCY_RANK[b.urgency] ?? 4);
  return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
});

// The linked hospital record, or — for requests filed with a hospital name only — the registered
// hospital with that exact name.
export const hospitalFor = (r, directory) =>
  directory.byId[r.hospital] || directory.byName[(r.hospitalName || '').trim().toLowerCase()];
