// Data helpers for the admin Blood Requests page: lists, filtering, form validation and KPI trends.
import { countTrend } from '@/lib/trend';
import { currentLang } from '@/i18n/config';
import { translate } from '@/i18n/translate';

const tr = (key, vars) => translate(currentLang(), `adm.reqs.form.${key}`, vars);

export const URGENCY_LEVELS = ['Low', 'Medium', 'High', 'Critical'];
export const BLOOD_TYPES = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
export const STATUSES = ['Pending', 'Approved', 'Rejected', 'Fulfilled', 'Cancelled'];
export const STATUS_TABS = ['All', 'Pending', 'Approved', 'Rejected', 'Cancelled'];
export const UNITS = Array.from({ length: 10 }, (_, i) => i + 1);
export const MAX_PHOTO_SIZE = 10 * 1024 * 1024; // must match the multer limit in Backend/src/common/upload.js

// Same limits as the API (validateRequest / validateEdit in Backend/src/requests/blood-request.routes.js).
export const LIMITS = { patientName: 100, hospitalName: 150, reason: 1000, contact: 100 };

export const emptyForm = {
  hospitalName: '', patientName: '', bloodType: '',
  unitsNeeded: '', urgency: '', reason: '', contact: '', photo: null,
};
export const noFilters = { bloodType: '', hospital: '', urgency: '', status: '' };

export const reqStatus = (r) => r.status || 'Pending';

const urgencyOrder = { critical: 0, high: 1, medium: 2, low: 3 };

/** The requests shown for the current tab, filters and search: most urgent first, then newest. */
export function filterRequests(requests, { tab = 'All', search = '', filters = noFilters } = {}) {
  const q = search.trim().toLowerCase();
  return requests
    .filter((r) => tab === 'All' || reqStatus(r) === tab)
    .filter((r) => !filters.status || reqStatus(r) === filters.status)
    .filter((r) => !filters.bloodType || r.bloodType === filters.bloodType)
    .filter((r) => !filters.hospital || r.hospitalName === filters.hospital)
    .filter((r) => !filters.urgency || r.urgency === filters.urgency)
    .filter((r) => !q || [r.patientName, r.hospitalName, r.reason, r.contact, r.bloodType]
      .some((v) => v && String(v).toLowerCase().includes(q)))
    .sort((a, b) =>
      ((urgencyOrder[a.urgency?.toLowerCase()] ?? 4) - (urgencyOrder[b.urgency?.toLowerCase()] ?? 4))
      || (new Date(b.createdAt) - new Date(a.createdAt)));
}

/**
 * Checks the New / Edit form the same way the API does. Returns `errors` (field -> message,
 * empty when valid) and `body`, the trimmed values to send.
 */
export function validateRequestForm(form) {
  const text = (k) => String(form[k] ?? '').trim();
  const body = {
    patientName: text('patientName'),
    hospitalName: text('hospitalName'),
    bloodType: form.bloodType,
    unitsNeeded: Number(form.unitsNeeded),
    urgency: form.urgency,
    reason: text('reason'),
    contact: text('contact'),
  };
  const errors = {};
  for (const k of ['patientName', 'hospitalName', 'reason']) {
    if (!body[k]) errors[k] = tr(`required.${k}`);
  }
  for (const [k, max] of Object.entries(LIMITS)) {
    if (!errors[k] && body[k].length > max) errors[k] = tr('atMost', { max });
  }
  if (!BLOOD_TYPES.includes(body.bloodType)) errors.bloodType = tr('bloodType');
  if (!Number.isInteger(body.unitsNeeded) || body.unitsNeeded < 1 || body.unitsNeeded > 10) errors.unitsNeeded = tr('units');
  if (!URGENCY_LEVELS.includes(body.urgency)) errors.urgency = tr('urgency');
  return { errors, body };
}

/** KPI trend for one status, or every request when `status` is null (see countTrend). */
export const statusTrend = (requests, status = null, opts) =>
  countTrend(status ? requests.filter((r) => reqStatus(r) === status) : requests, (r) => r.createdAt, opts);
