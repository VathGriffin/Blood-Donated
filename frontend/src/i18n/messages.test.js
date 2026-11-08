import MESSAGES from './messages';
import { LOCALES } from './config';
import { translate } from './translate';

// Every leaf as [path, value] ("nav.home" -> "Home"); plural objects { one, other } are leaves' parents.
const flatten = (node, prefix = '') => Object.entries(node).flatMap(([k, v]) => {
  const path = prefix ? `${prefix}.${k}` : k;
  return v && typeof v === 'object' && !Array.isArray(v) ? flatten(v, path) : [[path, v]];
});

const placeholders = (text) => [...String(text).matchAll(/\{(\w+)\}/g)].map((m) => m[1]).sort();
const KHMER = /[ក-៿]/;

// Texts that are the same in every language on purpose (codes, product names, shortcuts).
const SAME_EVERYWHERE = new Set([
  // Cambodian place names, written the same way in Vietnamese.
  'home.community.samples.volunteer.location',
  'home.community.samples.partner.location',
  // The project's name, used as a brand.
  'about.defaults.hero.titleAccent',
  // Loanwords that Vietnamese writes the same way.
  'contact.location.email',
  'booking.review.email',
  // Product names.
  'adm.settings.googleGemini',
]);

describe.each(Object.entries(MESSAGES))('messages: %s', (ns, langs) => {
  const en = Object.fromEntries(flatten(langs.en));

  it('has every language', () => {
    expect(Object.keys(langs).sort()).toEqual(LOCALES.map((l) => l.code).sort());
  });

  it.each(['km', 'vi'])('%s has exactly the English keys, filled in, with the same {placeholders}', (lang) => {
    const other = Object.fromEntries(flatten(langs[lang]));
    expect(Object.keys(other).sort()).toEqual(Object.keys(en).sort());
    for (const [key, value] of Object.entries(other)) {
      expect([key, typeof value === 'string' && value.trim().length > 0]).toEqual([key, true]);
      expect([key, placeholders(value)]).toEqual([key, placeholders(en[key])]);
    }
  });

  it('Khmer text is written in Khmer', () => {
    for (const [key, value] of flatten(langs.km)) {
      if (SAME_EVERYWHERE.has(`${ns}.${key}`)) continue;
      // Only checked where the English has words; a text of codes and symbols can stay as is.
      if (!/[A-Za-z]{3,}/.test(en[key].replace(/\{\w+\}/g, ''))) continue;
      expect([`${ns}.${key}`, KHMER.test(value)]).toEqual([`${ns}.${key}`, true]);
    }
  });

  it('Vietnamese text is not left in English', () => {
    for (const [key, value] of flatten(langs.vi)) {
      if (SAME_EVERYWHERE.has(`${ns}.${key}`)) continue;
      if (!/[A-Za-z]{3,}/.test(en[key].replace(/\{\w+\}/g, ''))) continue;
      expect([`${ns}.${key}`, value === en[key]]).toEqual([`${ns}.${key}`, false]);
    }
  });
});

describe('translate', () => {
  it('fills placeholders and falls back to English only for a key missing in that language', () => {
    expect(translate('vi', 'layout.footer.rights', { year: 2026, brand: 'BloodLife AI' })).toBe('© 2026 BloodLife AI. Bảo lưu mọi quyền.');
    expect(translate('km', 'nav.home')).toBe('ទំព័រដើម');
    expect(translate('xx', 'nav.home')).toBe('Home');
    expect(translate('km', 'nav.doesNotExist')).toBe('nav.doesNotExist');
  });
});
