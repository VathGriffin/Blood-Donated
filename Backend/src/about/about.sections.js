const sanitizeHtml = require('sanitize-html');

// Shape of the admin-editable text on the About page, with a length cap per field.
// Objects map field → max length; lists also fix how many items the page has.
// A RICH field holds formatted HTML from the admin's rich-text editor: its cap counts visible
// text only, and the markup is cleaned against the allowlist below before it is stored.
// Defaults live on the frontend: a blank or missing field shows the built-in text.
const RICH = (maxText) => ({ rich: true, maxText, maxHtml: maxText * 10 });

const SPEC = {
  hero:    { fields: { eyebrow: 80, title: 60, titleAccent: 60, headline: 120, intro: RICH(1200) } },
  values:  { count: 3, fields: { title: 60, subtitle: 100 } },
  purpose: { fields: { eyebrow: 60, title: 120, text: 1200, quote: 160 } },
  pillars: { count: 3, fields: { title: 60, desc: 300 } },
  stats:   { count: 4, fields: { label: 60, caption: 100 } },
  team:    { fields: { name: 60, position: 120, bio: RICH(1200) } },
  cta:     { fields: { title: 120, text: 300, button: 40 } },
};

// What the editor can produce, and nothing else. Links may only be http(s) or mailto, and always
// open in a new tab without access to this page. A link whose href is refused keeps its text.
const RICH_OPTIONS = {
  allowedTags: ['p', 'br', 'strong', 'em', 'u', 'ul', 'ol', 'li', 'h2', 'h3', 'a'],
  allowedAttributes: { a: ['href', 'target', 'rel'] },
  allowedSchemes: ['http', 'https', 'mailto'],
  allowProtocolRelative: false,
  disallowedTagsMode: 'discard',
  transformTags: {
    a: sanitizeHtml.simpleTransform('a', { target: '_blank', rel: 'noopener noreferrer nofollow' }),
  },
};

const looksLikeHtml = (text) => /<\/?[a-z][^>]*>/i.test(text);

const ENTITIES = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ', '#39': "'" };
// Visible characters, counted the way the editor's counter does: tags removed, a line break
// counts as one character, entities as the character they stand for.
const visibleText = (html) => html
  .replace(/<br\s*\/?>/gi, ' ')
  .replace(/<[^>]*>/g, '')
  .replace(/&(#x?[0-9a-f]+|[a-z]+);/gi, (m, e) => {
    if (ENTITIES[e.toLowerCase()] !== undefined) return ENTITIES[e.toLowerCase()];
    if (e[0] === '#') return String.fromCodePoint(e[1].toLowerCase() === 'x' ? parseInt(e.slice(2), 16) : parseInt(e.slice(1), 10));
    return m;
  });

const badRequest = (message) => Object.assign(new Error(message), { status: 400 });

// Plain text (older saves) is kept as is — React escapes it when shown. HTML is cleaned.
function cleanRich(value, spec, where) {
  if (value.length > spec.maxHtml) throw badRequest(`${where} is too long.`);
  if (!looksLikeHtml(value)) {
    if (value.length > spec.maxText) throw badRequest(`${where} is too long (max ${spec.maxText} characters).`);
    return value;
  }
  const html = sanitizeHtml(value, RICH_OPTIONS).trim();
  const text = visibleText(html);
  if (text.length > spec.maxText) throw badRequest(`${where} is too long (max ${spec.maxText} characters).`);
  return text.trim() ? html : '';
}
const isPlainObject = (v) => v !== null && typeof v === 'object' && !Array.isArray(v);

function cleanFields(input, fields, where) {
  if (input === undefined || input === null) return {};
  if (!isPlainObject(input)) throw badRequest(`${where} must be an object.`);
  const out = {};
  for (const [field, max] of Object.entries(fields)) {
    const value = input[field];
    if (value === undefined || value === null) continue;
    if (typeof value !== 'string') throw badRequest(`${where}.${field} must be text.`);
    if (max.rich) { out[field] = cleanRich(value.trim(), max, `${where}.${field}`); continue; }
    const text = value.trim();
    if (text.length > max) throw badRequest(`${where}.${field} is too long (max ${max} characters).`);
    out[field] = text;
  }
  return out;
}

// Returns a copy holding only the known sections and fields, trimmed. Unknown keys are dropped;
// wrong types, over-long text or too many list items are refused with a 400.
function sanitizeSections(input) {
  if (!isPlainObject(input)) throw badRequest('sections must be an object.');
  const out = {};
  for (const [name, spec] of Object.entries(SPEC)) {
    const value = input[name];
    if (value === undefined || value === null) continue;
    if (!spec.count) {
      out[name] = cleanFields(value, spec.fields, name);
      continue;
    }
    if (!Array.isArray(value)) throw badRequest(`${name} must be a list.`);
    if (value.length > spec.count) throw badRequest(`${name} can have at most ${spec.count} items.`);
    out[name] = value.map((item, i) => cleanFields(item, spec.fields, `${name}[${i}]`));
  }
  return out;
}

// Per-field character limits in the shape of the sections ({ hero: { title: 60, … }, values: { … } }),
// sent to the editor so its counters always match what this file enforces.
const LIMITS = Object.fromEntries(Object.entries(SPEC).map(([name, spec]) => [
  name, Object.fromEntries(Object.entries(spec.fields).map(([field, max]) => [field, max.rich ? max.maxText : max])),
]));

module.exports = { sanitizeSections, LIMITS };
