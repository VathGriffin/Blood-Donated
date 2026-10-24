import { BLOOD_TYPES } from '@/lib/inventory';
import { isPhone } from '@/lib/validation';

// Limits and choices — these must match Backend/src/requests (model + POST validation).
export const MAX_UNITS = 10;
export const MAX_REASON = 500; // the API allows 1000; the form keeps requests short and readable
export const MAX_AGE = 120;
export const MAX_REQUIRED_BY_DAYS = 365;
export const COMPONENTS = ['Whole Blood', 'Red Blood Cells', 'Plasma', 'Platelets'];
export { BLOOD_TYPES };

export const URGENCY = [
  { value: 'Critical', tone: 'error', hint: 'Life-threatening — needed immediately' },
  { value: 'High', tone: 'warning', hint: 'Surgery or treatment within 24 hours' },
  { value: 'Medium', tone: 'info', hint: 'Planned procedure within a few days' },
  { value: 'Low', tone: 'success', hint: 'Routine or stock top-up' },
];
export const urgencyOf = (value) => URGENCY.find((u) => u.value === value);

// One tap fills in a common reason; the requester can still add details after it.
export const QUICK_REASONS = ['Surgery', 'Accident / trauma', 'Childbirth', 'Anemia', 'Cancer treatment', 'Thalassemia', 'Dengue'];

export const EMPTY_FORM = {
  hospitalId: '', patientName: '', patientAge: '', bloodType: '', component: 'Whole Blood', unitsNeeded: 1,
  urgency: '', requiredBy: '', contact: '', reason: '', confirmed: false,
};

// ── Draft: kept in sessionStorage so a refresh or a trip to the login page loses nothing ──
const DRAFT_KEY = 'bloodlife:request-draft';

// Only known fields with the right types come back, so a stale or hand-edited draft can't break the form.
export const readDraft = () => {
  let saved;
  try { saved = JSON.parse(sessionStorage.getItem(DRAFT_KEY) || '{}'); } catch { return EMPTY_FORM; }
  if (!saved || typeof saved !== 'object') return EMPTY_FORM;
  const text = (key) => (typeof saved[key] === 'string' ? saved[key] : '');
  const units = Number(saved.unitsNeeded);
  return {
    ...EMPTY_FORM,
    hospitalId: text('hospitalId'),
    patientName: text('patientName'),
    patientAge: /^\d{0,3}$/.test(text('patientAge')) ? text('patientAge') : '',
    bloodType: BLOOD_TYPES.includes(saved.bloodType) ? saved.bloodType : '',
    component: COMPONENTS.includes(saved.component) ? saved.component : 'Whole Blood',
    unitsNeeded: Number.isInteger(units) && units >= 1 && units <= MAX_UNITS ? units : 1,
    urgency: urgencyOf(saved.urgency) ? saved.urgency : '',
    requiredBy: text('requiredBy'),
    contact: text('contact'),
    reason: text('reason').slice(0, MAX_REASON),
  };
};
// The confirmation tick is never saved: it has to be given again for each submission.
export const writeDraft = (form) => {
  try { sessionStorage.setItem(DRAFT_KEY, JSON.stringify({ ...form, confirmed: false })); } catch { /* storage blocked */ }
};
export const clearDraft = () => { try { sessionStorage.removeItem(DRAFT_KEY); } catch { /* storage blocked */ } };

// ── Dates: <input type="datetime-local"> works in local "YYYY-MM-DDTHH:mm" strings ──
const pad = (n) => String(n).padStart(2, '0');
export const toLocalInput = (d) =>
  `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
export const minRequiredBy = () => toLocalInput(new Date());
export const maxRequiredBy = () => toLocalInput(new Date(Date.now() + MAX_REQUIRED_BY_DAYS * 86400000));

// Field errors in page order, so the first one is where the page scrolls to.
export function validate(form, hospitals) {
  const errors = {};
  // `hospitals` is null until the list has loaded: a hospital id from a saved draft can't be
  // checked (or submitted) before then.
  if (!form.hospitalId) errors.hospitalId = 'Choose the hospital.';
  else if (!hospitals) errors.hospitalId = 'The hospital list has not loaded yet. Try again in a moment.';
  else if (!hospitals.some((h) => h._id === form.hospitalId)) errors.hospitalId = 'That hospital is no longer listed. Choose another.';
  if (!form.patientName.trim()) errors.patientName = "Enter the patient's name.";
  else if (form.patientName.trim().length > 100) errors.patientName = 'Use at most 100 characters.';
  if (form.patientAge !== '') {
    const age = Number(form.patientAge);
    if (!Number.isInteger(age) || age < 0 || age > MAX_AGE) errors.patientAge = `Enter an age from 0 to ${MAX_AGE}.`;
  }
  if (!form.bloodType) errors.bloodType = "Choose the patient's blood type.";
  if (!COMPONENTS.includes(form.component)) errors.component = 'Choose a blood component.';
  if (!Number.isInteger(form.unitsNeeded) || form.unitsNeeded < 1 || form.unitsNeeded > MAX_UNITS)
    errors.unitsNeeded = `Choose 1 to ${MAX_UNITS} units.`;
  if (!form.urgency) errors.urgency = 'Choose how urgent this is.';
  if (form.requiredBy) {
    const t = new Date(form.requiredBy).getTime();
    if (Number.isNaN(t)) errors.requiredBy = 'Enter a valid date and time.';
    else if (t < Date.now() - 60_000) errors.requiredBy = 'This date and time has already passed.';
    else if (t > Date.now() + MAX_REQUIRED_BY_DAYS * 86400000) errors.requiredBy = 'Choose a date within the next year.';
  }
  if (!form.contact.trim()) errors.contact = 'Enter a phone number the hospital can call.';
  else if (!isPhone(form.contact)) errors.contact = 'Enter a valid phone number (8–15 digits).';
  if (!form.reason.trim()) errors.reason = 'Tell the hospital why the blood is needed.';
  else if (form.reason.length > MAX_REASON) errors.reason = `Use at most ${MAX_REASON} characters.`;
  if (!form.confirmed) errors.confirmed = 'Please confirm the information is accurate.';
  return errors;
}

// What the API receives. The requester's email is never sent: the server takes it from the login.
export const toPayload = (form, hospital) => ({
  hospitalId: hospital._id,
  hospitalName: hospital.name,
  patientName: form.patientName.trim(),
  patientAge: form.patientAge === '' ? null : Number(form.patientAge),
  bloodType: form.bloodType,
  component: form.component,
  unitsNeeded: form.unitsNeeded,
  urgency: form.urgency,
  requiredBy: form.requiredBy ? new Date(form.requiredBy).toISOString() : null,
  contact: form.contact.trim(),
  reason: form.reason.trim(),
});

// ── Request history ──
// Tabs map onto the API's statuses; "Completed" is the Fulfilled status. Cancelled requests
// appear under All.
export const HISTORY_TABS = [
  { value: 'All', label: 'All' },
  { value: 'Pending', label: 'Pending' },
  { value: 'Approved', label: 'Approved' },
  { value: 'Rejected', label: 'Rejected' },
  { value: 'Fulfilled', label: 'Completed' },
];
export const STATUS_META = {
  Pending: { tone: 'warning', label: 'Pending' },
  Approved: { tone: 'success', label: 'Approved' },
  Rejected: { tone: 'error', label: 'Rejected' },
  Fulfilled: { tone: 'info', label: 'Completed' },
  Cancelled: { tone: 'neutral', label: 'Cancelled' },
};
export const statusOf = (r) => r.status || 'Pending';

export const fmtDate = (v, withTime = false) => {
  if (!v) return null;
  const d = new Date(v);
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleString('en-GB', withTime
    ? { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }
    : { day: 'numeric', month: 'short', year: 'numeric' });
};
