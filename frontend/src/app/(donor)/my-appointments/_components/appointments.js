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

// ── Time and reschedule helpers ─────────────────────────────────────────────────────────────

// Slots are half an hour long and stored as "09:00 AM".
export const SLOT_MINUTES = 30;
const to24 = (slot) => {
  const m = /^(\d{1,2}):(\d{2})\s*(AM|PM)$/i.exec(slot || '');
  if (!m) return null;
  let h = Number(m[1]) % 12;
  if (m[3].toUpperCase() === 'PM') h += 12;
  return h * 60 + Number(m[2]);
};
const clock = (mins) => `${String(Math.floor(mins / 60)).padStart(2, '0')}:${String(mins % 60).padStart(2, '0')}`;

/** "09:00 AM" -> "09:00 – 09:30". Anything unparseable is returned as it was stored. */
export const slotRange = (slot) => {
  const start = to24(slot);
  return start == null ? slot || '' : `${clock(start)} – ${clock(start + SLOT_MINUTES)}`;
};

/** "Sat, 25 Oct 2025" */
export const shortDay = (iso) => {
  if (!iso) return '';
  const [y, m, d] = iso.split('-').map(Number);
  const date = new Date(y, m - 1, d);
  if (Number.isNaN(date.getTime())) return iso;
  return date.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });
};
/** "25 Oct 2025, 09:00 – 09:30" */
export const whenLabel = (date, time) => `${shortDay(date).replace(/^\w+, /, '')}, ${slotRange(time)}`;

export const fmtStamp = (v) => {
  if (!v) return '';
  const d = new Date(v);
  return Number.isNaN(d.getTime()) ? ''
    : `${d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}, ${d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}`;
};

// Only hospital decisions count as reschedules; "system" entries are the donor's own direct edits.
const reviewed = (a) => (a.rescheduleRequests || []).filter((r) => r.reviewerRole !== 'system');
export const openRequest = (a) => (a.rescheduleRequests || []).find((r) => r.status === 'Pending') || null;
/** The latest answered request (Approved / Rejected), if it is the newest thing that happened. */
export const lastDecision = (a) => {
  const list = reviewed(a);
  const last = list[list.length - 1];
  return last && (last.status === 'Approved' || last.status === 'Rejected') ? last : null;
};

/** What the donor may do with an appointment right now (mirrors the API rules). */
export const allowedActions = (a, today) => {
  const upcoming = categoryOf(a, today) === 'upcoming';
  const pendingReq = openRequest(a);
  return {
    cancel: upcoming,
    // Pending: change directly. Confirmed: request a change, one at a time, only for a registered hospital.
    change: upcoming && !pendingReq && (a.status === 'Pending' || (a.status === 'Confirmed' && !!a.hospital)),
    needsApproval: a.status === 'Confirmed',
    withdraw: upcoming && !!pendingReq,
  };
};

// ── Add to calendar (.ics) ───────────────────────────────────────────────────────────────
const icsStamp = (iso, mins) => {
  const [y, m, d] = iso.split('-').map(Number);
  const t = new Date(y, m - 1, d, Math.floor(mins / 60), mins % 60);
  return t.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
};
const icsText = (s) => String(s || '').replace(/[\;,]/g, (c) => `\\${c}`).replace(/\n/g, '\\n');

export function downloadIcs(a, place = '') {
  const start = to24(a.time) ?? 9 * 60;
  const body = [
    'BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//BloodLife AI//Appointments//EN', 'BEGIN:VEVENT',
    `UID:${a._id}@bloodlife`, `DTSTAMP:${new Date().toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '')}`,
    `DTSTART:${icsStamp(a.date, start)}`, `DTEND:${icsStamp(a.date, start + SLOT_MINUTES)}`,
    `SUMMARY:${icsText(`Blood donation at ${a.location}`)}`,
    `LOCATION:${icsText([a.location, place].filter(Boolean).join(', '))}`,
    `DESCRIPTION:${icsText('Bring your ID card and BloodLife QR card.')}`,
    'END:VEVENT', 'END:VCALENDAR',
  ].join('\r\n');
  const url = URL.createObjectURL(new Blob([body], { type: 'text/calendar;charset=utf-8' }));
  const link = Object.assign(document.createElement('a'), { href: url, download: `blood-donation-${a.date}.ics` });
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
