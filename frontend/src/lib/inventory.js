import { semantic } from '@/lib/design-tokens';

export const BLOOD_TYPES = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

// `status` comes from the API (a virtual on the inventory model: empty / critical / low / adequate).
export const STOCK = {
  adequate: { label: 'Adequate',     alert: null,               color: semantic.success.main },
  low:      { label: 'Low',          alert: 'Consider restock', color: semantic.warning.main },
  critical: { label: 'Critical',     alert: 'Low stock',        color: semantic.error.main },
  empty:    { label: 'Out of stock', alert: 'Out of stock',     color: semantic.error.dark },
};

/** One row per blood type — types the pool has no row for yet show as empty. */
export function completeByType(items = []) {
  return BLOOD_TYPES.map(
    (bloodType) => items.find((i) => i.bloodType === bloodType) || { bloodType, units: 0, minUnits: 10, status: 'empty', missing: true }
  );
}

/** Totals overall and per status: { totalUnits, adequate: {types, units}, low: …, critical: …, empty: … } */
export function summarize(items = []) {
  const out = { totalUnits: 0 };
  Object.keys(STOCK).forEach((k) => { out[k] = { types: 0, units: 0 }; });
  items.forEach((i) => {
    out.totalUnits += i.units || 0;
    const bucket = out[i.status];
    if (bucket) { bucket.types += 1; bucket.units += i.units || 0; }
  });
  return out;
}

/** Types that need attention, most urgent (fewest units) first. */
export const lowStockItems = (items = []) =>
  items.filter((i) => ['empty', 'critical', 'low'].includes(i.status)).sort((a, b) => a.units - b.units);
