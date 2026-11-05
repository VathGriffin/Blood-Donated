import { neutral, semantic } from '@/lib/design-tokens';

export const BLOOD_TYPES = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

// `status` comes from the API (a virtual on the inventory model: empty / critical / low / adequate).
export const STOCK = {
  adequate: { label: 'Adequate',     color: semantic.success.main },
  low:      { label: 'Low',          color: semantic.warning.main },
  critical: { label: 'Critical',     color: semantic.error.main },
  empty:    { label: 'Out of stock', color: neutral[400] }, // grey: nothing left to colour
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

/**
 * Unit ranges per stock level, for chart legends — the same rule as Backend/src/common/stock-status.js
 * (empty 0 · critical below the minimum · low below twice the minimum · adequate from there).
 * Exact numbers when every type shares one minimum, otherwise the rule in words.
 */
export function stockRanges(items = []) {
  const mins = [...new Set(items.map((i) => i.minUnits ?? 10))];
  if (mins.length !== 1) return { adequate: '≥ 2× min', low: 'min – 2× min', critical: 'below min', empty: '0' };
  const m = mins[0];
  return {
    adequate: `≥ ${2 * m}`,
    low: m === 1 ? `${m}` : `${m} – ${2 * m - 1}`,
    critical: m <= 1 ? '—' : m === 2 ? '1' : `1 – ${m - 1}`,
    empty: '0',
  };
}
