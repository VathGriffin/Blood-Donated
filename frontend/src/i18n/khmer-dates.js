// Khmer dates that come out the same on the server and in every browser.
//
// Chrome (and other Chromium browsers) ship without Khmer date data: asking for 'km-KH' silently
// returns English ("Mar 12, 2025"), while Node on the server returns Khmer ("12 មីនា 2025"). The
// page then shows English dates in Khmer and React reports a hydration mismatch. So for Khmer the
// three Date methods below build the text from the Khmer month and weekday names here, everywhere;
// every other locale goes straight to the browser's own Intl.

const MONTHS = ['មករា', 'កុម្ភៈ', 'មីនា', 'មេសា', 'ឧសភា', 'មិថុនា', 'កក្កដា', 'សីហា', 'កញ្ញា', 'តុលា', 'វិច្ឆិកា', 'ធ្នូ'];
const WEEKDAYS = ['អាទិត្យ', 'ច័ន្ទ', 'អង្គារ', 'ពុធ', 'ព្រហស្បតិ៍', 'សុក្រ', 'សៅរ៍'];
const WEEKDAYS_NARROW = ['អា', 'ច', 'អ', 'ព', 'ព្រ', 'សុ', 'ស'];

const isKhmer = (locales) => {
  const first = Array.isArray(locales) ? locales[0] : locales;
  return typeof first === 'string' && /^km\b/i.test(first);
};

const DATE_FIELDS = ['weekday', 'year', 'month', 'day'];
const TIME_FIELDS = ['hour', 'minute', 'second'];
const has = (opts, fields) => fields.some((f) => opts[f] !== undefined) || opts.dateStyle || opts.timeStyle;

/** `date` as Khmer text for the given Intl options (same defaults as the Date methods). */
export function formatKhmer(date, opts = {}, defaults = 'date') {
  if (Number.isNaN(date.getTime())) return 'Invalid Date';
  const o = { ...opts };
  if (!has(o, [...DATE_FIELDS, ...TIME_FIELDS])) {
    if (defaults !== 'time') Object.assign(o, { year: 'numeric', month: 'numeric', day: 'numeric' });
    if (defaults !== 'date') Object.assign(o, { hour: 'numeric', minute: '2-digit', second: '2-digit' });
  }
  if (o.dateStyle) Object.assign(o, { year: 'numeric', month: o.dateStyle === 'short' ? 'numeric' : 'long', day: 'numeric' });
  if (o.timeStyle) Object.assign(o, { hour: 'numeric', minute: '2-digit' });
  // Numbers (day, year, clock) come from Intl in English, with the time zone honoured.
  const parts = Object.fromEntries(new Intl.DateTimeFormat('en-US', {
    timeZone: o.timeZone, hour12: o.hour12, hourCycle: o.hourCycle,
    year: o.year && (o.year === '2-digit' ? '2-digit' : 'numeric'),
    month: o.month && 'numeric', day: o.day && (o.day === '2-digit' ? '2-digit' : 'numeric'),
    weekday: o.weekday && 'short',
    hour: o.hour, minute: o.minute, second: o.second,
  }).formatToParts(date).map((p) => [p.type, p.value]));
  const weekdayIndex = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].indexOf(parts.weekday);
  const month = parts.month && Number(parts.month) - 1;

  const datePart = [];
  if (o.weekday) datePart.push((o.weekday === 'narrow' ? WEEKDAYS_NARROW : WEEKDAYS)[weekdayIndex]);
  if (o.month === 'numeric' || o.month === '2-digit') {
    const mm = o.month === '2-digit' ? String(month + 1).padStart(2, '0') : String(month + 1);
    datePart.push([parts.day, mm, parts.year].filter(Boolean).join('/'));
  } else {
    if (o.day) datePart.push(parts.day);
    if (o.month) datePart.push(MONTHS[month]);
    if (o.year) datePart.push(parts.year);
  }
  const timePart = o.hour || o.minute
    ? [[parts.hour, parts.minute, parts.second].filter(Boolean).join(':'), parts.dayPeriod].filter(Boolean).join(' ')
    : '';
  return [datePart.join(' '), timePart].filter(Boolean).join(' ');
}

// Install once (server and browser), only changing the Khmer case.
const KEY = Symbol.for('bloodlife.khmerDates');
if (!Date.prototype[KEY]) {
  const patch = (name, defaults) => {
    const original = Date.prototype[name];
    Date.prototype[name] = function localized(locales, options) {
      return isKhmer(locales) ? formatKhmer(this, options, defaults) : original.call(this, locales, options);
    };
  };
  patch('toLocaleDateString', 'date');
  patch('toLocaleTimeString', 'time');
  patch('toLocaleString', 'both');
  Date.prototype[KEY] = true;
}
