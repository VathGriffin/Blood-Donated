import { feedText } from './feed-text';
import { translate } from '@/i18n/translate';
import { setCurrentLang } from '@/i18n/config';

const tFor = (lang) => (key, vars) => translate(lang, key, vars);
afterEach(() => setCurrentLang('en'));

test('builds the line from the key in the selected language, keeping user content as written', () => {
  setCurrentLang('vi');
  const spec = { key: 'staff.requestUrgencyAt', vars: { type: 'O+', units: 2, patient: 'Sok Dara', hospital: 'Calmette', urgency: 'Critical' } };
  expect(feedText(tFor('vi'), spec, 'x')).toBe('O+ · 2 đơn vị cho Sok Dara tại Calmette · mức khẩn cấp: Khẩn cấp');
});

test('adds a quoted reason after the translated text', () => {
  const spec = { key: 'common.requestFor', vars: { type: 'A+', patient: 'Dara', quote: 'Found a donor' } };
  expect(feedText(tFor('en'), spec, 'x')).toBe('A+ for Dara — “Found a donor”');
});

test('falls back to the API text without a key, or for an unknown key', () => {
  expect(feedText(tFor('km'), undefined, 'Hello from support')).toBe('Hello from support');
  expect(feedText(tFor('km'), { key: 'does.not.exist' }, 'API text')).toBe('API text');
});

test('formats dates for the selected language', () => {
  setCurrentLang('km');
  const text = feedText(tFor('km'), { key: 'donor.reminderOn', vars: { date: '2026-11-20' } }, 'x');
  expect(text).not.toMatch(/2026-11-20/);
  expect(text).toMatch(/[ក-៿]/);
});
