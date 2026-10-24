import { todayKey } from '@/components/donor/ui';

// Grouping used by the tabs and summary cards. Only the statuses the API stores
// (Pending / Confirmed / CheckedIn / Cancelled) plus the appointment date decide it:
//   upcoming  – Pending or Confirmed, dated today or later
//   completed – CheckedIn (staff checked the donor in, which records the donation)
//   cancelled – Cancelled
//   missed    – Pending or Confirmed but the date has passed without a check-in
export const categoryOf = (a, today = todayKey()) => {
  const s = a.status || 'Pending';
  if (s === 'CheckedIn') return 'completed';
  if (s === 'Cancelled') return 'cancelled';
  return a.date && a.date >= today ? 'upcoming' : 'missed';
};

export const TAB_DEFS = [
  { value: 'all', label: 'All' },
  { value: 'upcoming', label: 'Upcoming' },
  { value: 'completed', label: 'Completed' },
  { value: 'cancelled', label: 'Cancelled' },
];

const isoOffset = (days) => {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toLocaleDateString('en-CA'); // YYYY-MM-DD, local time
};

// Date-range filter on the appointment day. The API returns all of the donor's own
// appointments in one call, so this filters what is already loaded.
export const RANGES = [
  { value: 'all', label: 'All time', test: () => true },
  { value: 'next30', label: 'Next 30 days', test: (d) => d >= isoOffset(0) && d <= isoOffset(30) },
  { value: 'past30', label: 'Past 30 days', test: (d) => d < isoOffset(0) && d >= isoOffset(-30) },
  { value: 'past90', label: 'Past 3 months', test: (d) => d < isoOffset(0) && d >= isoOffset(-90) },
  { value: 'year', label: 'This year', test: (d) => d.slice(0, 4) === String(new Date().getFullYear()) },
];

// "Today", "Tomorrow", "In 3 days" for an upcoming YYYY-MM-DD date.
export const daysUntil = (iso) => {
  if (!iso) return null;
  const [y, m, d] = iso.split('-').map(Number);
  const target = new Date(y, m - 1, d);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const days = Math.round((target - today) / 86400000);
  if (Number.isNaN(days)) return null;
  if (days === 0) return 'Today';
  if (days === 1) return 'Tomorrow';
  return days > 0 ? `In ${days} days` : null;
};

// Upcoming first (soonest on top), then everything else newest first.
export const sortAppointments = (list, today = todayKey()) => [...list].sort((a, b) => {
  const ua = categoryOf(a, today) === 'upcoming';
  const ub = categoryOf(b, today) === 'upcoming';
  if (ua !== ub) return ua ? -1 : 1;
  return ua ? (a.date || '').localeCompare(b.date || '') : (b.date || '').localeCompare(a.date || '');
});

export const telHref = (phone) => (phone ? `tel:${phone.replace(/[^\d+]/g, '')}` : null);
