import { BLOOD_TYPES } from '@/lib/inventory';
import { isPhone } from '@/lib/validation';
import { currentIntlLocale, currentLang } from '@/i18n/config';
import { translate } from '@/i18n/translate';

// Text read when rendered, in the selected language (donor.form.* in i18n/messages/donor.js).
const tr = (key, vars) => translate(currentLang(), key, vars);

// Limits and choices — these must match Backend/src/requests (model + POST validation).
export const MAX_UNITS = 10;
export const MAX_REASON = 500; // the API allows 1000; the form keeps requests short and readable
export const MAX_AGE = 120;
const MAX_REQUIRED_BY_DAYS = 365;
export const COMPONENTS = ['Whole Blood', 'Red Blood Cells', 'Plasma', 'Platelets'];
export { BLOOD_TYPES };

const urgency = (value, tone) => ({
  value, tone,
  get label() { return tr(`status.${value}`); },
  get hint() { return tr(`donor.form.urgencyHint.${value}`); },
});
export const URGENCY = [urgency('Critical', 'error'), urgency('High', 'warning'), urgency('Medium', 'info'), urgency('Low', 'success')];
export const urgencyOf = (value) => URGENCY.find((u) => u.value === value);

// One tap fills in a common reason; the requester can still add details after it.
// Keys of donor.form.quick; the chip fills in the text in the selected language.
export const QUICK_REASONS = ['surgery', 'accident', 'childbirth', 'anemia', 'cancer', 'thalassemia', 'dengue'];
export const quickReason = (key) => tr(`donor.form.quick.${key}`);
/** A blood component ("Whole Blood") in the selected language; the API value stays English. */
export const componentLabel = (c) => tr(`status.component.${c}`);

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
const toLocalInput = (d) =>
  `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
export const minRequiredBy = () => toLocalInput(new Date());
export const maxRequiredBy = () => toLocalInput(new Date(Date.now() + MAX_REQUIRED_BY_DAYS * 86400000));

// Field errors in page order, so the first one is where the page scrolls to.
export function validate(form, hospitals) {
  const errors = {};
  const e = (key, vars) => tr(`donor.form.errors.${key}`, vars);
  // `hospitals` is null until the list has loaded: a hospital id from a saved draft can't be
  // checked (or submitted) before then.
  if (!form.hospitalId) errors.hospitalId = e('hospital');
  else if (!hospitals) errors.hospitalId = e('hospitalLoading');
  else if (!hospitals.some((h) => h._id === form.hospitalId)) errors.hospitalId = e('hospitalGone');
  if (!form.patientName.trim()) errors.patientName = e('patientName');
  else if (form.patientName.trim().length > 100) errors.patientName = e('patientNameLong');
  if (form.patientAge !== '') {
    const age = Number(form.patientAge);
    if (!Number.isInteger(age) || age < 0 || age > MAX_AGE) errors.patientAge = e('age', { max: MAX_AGE });
  }
  if (!form.bloodType) errors.bloodType = e('bloodType');
  if (!COMPONENTS.includes(form.component)) errors.component = e('component');
  if (!Number.isInteger(form.unitsNeeded) || form.unitsNeeded < 1 || form.unitsNeeded > MAX_UNITS)
    errors.unitsNeeded = e('units', { max: MAX_UNITS });
  if (!form.urgency) errors.urgency = e('urgency');
  if (form.requiredBy) {
    const t = new Date(form.requiredBy).getTime();
    if (Number.isNaN(t)) errors.requiredBy = e('date');
    else if (t < Date.now() - 60_000) errors.requiredBy = e('datePast');
    else if (t > Date.now() + MAX_REQUIRED_BY_DAYS * 86400000) errors.requiredBy = e('dateFar');
  }
  if (!form.contact.trim()) errors.contact = e('contact');
  else if (!isPhone(form.contact)) errors.contact = e('contactInvalid');
  if (!form.reason.trim()) errors.reason = e('reason');
  else if (form.reason.length > MAX_REASON) errors.reason = e('reasonLong', { max: MAX_REASON });
  if (!form.confirmed) errors.confirmed = e('confirmed');
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
const tab = (value) => ({ value, get label() { return tr(`donor.form.tabs.${value}`); } });
export const HISTORY_TABS = [tab('All'), tab('Pending'), tab('Approved'), tab('Rejected'), tab('Fulfilled')];
const meta = (tone, value) => ({ tone, get label() { return tr(`donor.form.tabs.${value}`); } });
export const STATUS_META = {
  Pending: meta('warning', 'Pending'),
  Approved: meta('success', 'Approved'),
  Rejected: meta('error', 'Rejected'),
  Fulfilled: meta('info', 'Fulfilled'),
  Cancelled: meta('neutral', 'Cancelled'),
};
export const statusOf = (r) => r.status || 'Pending';

export const fmtDate = (v, withTime = false) => {
  if (!v) return null;
  const d = new Date(v);
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleString(currentIntlLocale(), withTime
    ? { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }
    : { day: 'numeric', month: 'short', year: 'numeric' });
};
