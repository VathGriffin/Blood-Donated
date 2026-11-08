import { currentIntlLocale } from '@/i18n/config';
import { statusLabel } from '@/components/ui/StatusBadge';

// Values that need formatting before they go into the sentence.
const DATE_VARS = ['date', 'fromDate', 'toDate'];
const day = (iso) => {
  const [y, m, d] = String(iso || '').split('-').map(Number);
  const date = new Date(y, m - 1, d);
  return Number.isNaN(date.getTime()) ? iso : date.toLocaleDateString(currentIntlLocale(), { weekday: 'short', month: 'short', day: 'numeric' });
};

/**
 * One line of a notification in the selected language. `spec` is the item's `i18n.title` or
 * `i18n.body` ({ key, vars }); without one (older API, or user-written text such as a message
 * preview) the API's own text is shown. User content (names, reasons, notes) is never translated.
 */
export function feedText(t, spec, fallback) {
  if (!spec?.key) return fallback;
  const key = `feed.${spec.key}`;
  const v = { ...spec.vars };
  for (const name of DATE_VARS) if (v[name]) v[name] = day(v[name]);
  if (v.urgency) v.urgency = statusLabel(t, v.urgency);
  if (v.units != null) v.units = t('feed.units', { count: Number(v.units) });
  let text = t(key, v);
  if (text === key) return fallback;
  if (v.quote) text += ` — “${v.quote}”`;
  if (v.suffix) text += ` ${v.suffix}`;
  return text;
}
