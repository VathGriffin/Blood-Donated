import API_BASE from '@/lib/config';

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
].map((name) => ({ key: name, name, address: '', city: '', phone: '', hospitalId: null, image: '', pos: null }));

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
  image: hospitalImageUrl(h.image),
  pos: typeof h.location?.lat === 'number' && typeof h.location?.lng === 'number' ? [h.location.lat, h.location.lng] : null,
}));

export const BLOOD_TYPES = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

// Shown when a hospital has no photo, or its photo fails to load.
export const HOSPITAL_FALLBACK_IMAGE = '/images/hospital-fallback.svg';

// A hospital's `image` is either an uploaded file ("/uploads/…", served by the API) or a full URL.
export const hospitalImageUrl = (image) => {
  if (!image) return '';
  return image.startsWith('/uploads/') ? `${API_BASE}${image}` : image;
};

// BloodLife AI palette for the booking page.
export const C = {
  primary: '#B91C2C',
  dark: '#881D2A',
  bg: '#F8FAFC',
  soft: '#FDF2F3',
  softer: '#FEF7F8',
  border: '#E2E8F0',
  borderSoft: '#F1E4E6',
  ring: 'rgba(185,28,44,0.32)',
  ok: '#15803D',
  okSoft: '#DCFCE7',
};

// Arrow-key movement for a radio group with a roving tabindex: only the checked (or first)
// option is tabbable, and arrows move focus *and* selection, as native radios do.
// `step` is how far Up/Down move (the column count for a grid, 1 for a list).
export const radioKeyDown = (e, index, items, onPick, step = 1) => {
  const moves = { ArrowRight: 1, ArrowDown: step, ArrowLeft: -1, ArrowUp: -step, Home: -Infinity, End: Infinity };
  if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); onPick(index); return; }
  if (!(e.key in moves)) return;
  e.preventDefault();
  const enabled = items.map((it, i) => (it.disabled ? -1 : i)).filter((i) => i >= 0);
  if (!enabled.length) return;
  const delta = moves[e.key];
  let next;
  if (delta === -Infinity) next = enabled[0];
  else if (delta === Infinity) next = enabled[enabled.length - 1];
  else {
    next = index + delta;
    while (next >= 0 && next < items.length && items[next].disabled) next += Math.sign(delta);
    if (next < 0 || next >= items.length) return;
  }
  onPick(next);
  items[next].el?.focus();
};

// The floating BloodLife AI assistant listens for this to open itself.
export const openAssistant = () => window.dispatchEvent(new CustomEvent('bloodlife:open-chat'));
