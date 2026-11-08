const DAY_MS = 86400000;

/**
 * How many of `items` fall in the last `days` days, how many in the equally long period before
 * it, and the range split into `buckets` counts for a sparkline: the same shape as
 * /api/stats/trends ({ current, previous, change, series }), so StatCard can show it.
 * `dateOf(item)` returns the date to count by. `change` is the % change, or null when the
 * previous period was empty (nothing to compare against).
 */
export function countTrend(items, dateOf, { now = Date.now(), days = 30, buckets = 8 } = {}) {
  const span = days * DAY_MS;
  const from = now - span;
  const series = Array(buckets).fill(0);
  let current = 0;
  let previous = 0;
  for (const item of items) {
    const t = Date.parse(dateOf(item));
    if (Number.isNaN(t) || t > now) continue;
    if (t >= from) {
      current += 1;
      series[Math.min(buckets - 1, Math.floor(((t - from) / span) * buckets))] += 1;
    } else if (t >= from - span) {
      previous += 1;
    }
  }
  const change = previous === 0 ? null : Math.round(((current - previous) / previous) * 100);
  return { current, previous, change, series };
}
