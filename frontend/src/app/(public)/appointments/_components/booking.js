// Shared constants and helpers for the appointment booking page.

// Shown only when no hospitals are registered on the platform yet — the names the page has always offered.
// They carry no address, distance or hospital id, because none is known.
export const FALLBACK_CENTERS = [
  'Calmette Hospital',
  'Royal Phnom Penh Hospital',
  'Khmer Soviet Friendship Hospital',
  'National Blood Transfusion Center',
  'Angkor Hospital for Children',
  'Battambang Provincial Hospital',
].map((name) => ({ key: name, name, address: '', city: '', phone: '', hospitalId: null, pos: null }));

// Same "08:00 AM" format the backend and dashboards already store and display.
export const TIME_SLOTS = [
  '08:00 AM', '08:30 AM', '09:00 AM', '09:30 AM', '10:00 AM', '10:30 AM', '11:00 AM',
  '01:00 PM', '01:30 PM', '02:00 PM', '02:30 PM', '03:00 PM', '03:30 PM', '04:00 PM',
];

const pad = (n) => String(n).padStart(2, '0');
export const toIso = (year, month, day) => `${year}-${pad(month + 1)}-${pad(day)}`;
export const parseIso = (iso) => { const [y, m, d] = iso.split('-').map(Number); return new Date(y, m - 1, d); };
export const formatLongDate = (iso) =>
  parseIso(iso).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

// "01:30 PM" -> minutes since midnight, to grey out slots that have already passed today.
export const slotStartMinutes = (slot) => {
  const [clock, meridiem] = slot.split(' ');
  let [hours, minutes] = clock.split(':').map(Number);
  if (meridiem === 'PM' && hours !== 12) hours += 12;
  if (meridiem === 'AM' && hours === 12) hours = 0;
  return hours * 60 + minutes;
};

// API hospital -> the shape the picker uses. Coordinates only if the hospital has real ones.
export const normalizeCenters = (hospitals) => hospitals.map((h) => ({
  key: h._id,
  name: h.name,
  address: h.address || '',
  city: h.city || '',
  phone: h.phone || '',
  hospitalId: h._id,
  pos: typeof h.location?.lat === 'number' && typeof h.location?.lng === 'number' ? [h.location.lat, h.location.lng] : null,
}));

export const BLOOD_TYPES = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
