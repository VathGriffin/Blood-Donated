// Small display helpers shared by the dashboards.

const DATE = { month: 'short', day: 'numeric', year: 'numeric' };
const TIME = { hour: 'numeric', minute: '2-digit' };

/** "Sep 21, 2026" — or `fallback` when there's no date. */
export const formatDate = (d, fallback = '—') => (d ? new Date(d).toLocaleDateString('en-US', DATE) : fallback);

/** "Sep 21, 2026, 8:38 PM" */
export const formatDateTime = (d) => new Date(d).toLocaleString('en-US', { ...DATE, ...TIME });

/** Short display ID for a blood request, derived from its real database id: "BR-76A5". */
export const shortRequestId = (id) => `BR-${String(id).slice(-4).toUpperCase()}`;

/** "Vanna Donor" -> "VD" (max two letters; "?" when there is no name). */
export const initialsOf = (name) => name?.split(' ').filter(Boolean).map((n) => n[0]).join('').toUpperCase().slice(0, 2) || '?';
