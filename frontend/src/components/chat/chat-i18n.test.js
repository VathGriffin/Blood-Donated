import { CHAT_TEXT, LANGS } from './chat-i18n';
import { QUICK_ACTIONS } from '@/lib/chatbot-kb';

const keysOf = (obj, prefix = '') => Object.entries(obj).flatMap(([k, v]) =>
  (v && typeof v === 'object' ? keysOf(v, `${prefix}${k}.`) : [`${prefix}${k}`])).sort();

describe('chat widget text', () => {
  it('offers English, Khmer and Vietnamese with EN / KH / VN buttons', () => {
    expect(LANGS.map((l) => [l.code, l.label])).toEqual([['en', 'EN'], ['km', 'KH'], ['vi', 'VN']]);
  });

  it.each(['km', 'vi'])('%s has exactly the same labels as English, none empty', (lang) => {
    expect(keysOf(CHAT_TEXT[lang])).toEqual(keysOf(CHAT_TEXT.en));
    for (const key of keysOf(CHAT_TEXT[lang])) {
      const value = key.split('.').reduce((o, k) => o[k], CHAT_TEXT[lang]);
      expect(String(value).trim()).not.toBe('');
    }
  });

  it.each(['km', 'vi'])('%s labels are actually translated', (lang) => {
    for (const key of ['subtitle', 'placeholder', 'privacy', 'disclaimer', 'retry', 'online', 'offline']) {
      expect(CHAT_TEXT[lang][key]).not.toBe(CHAT_TEXT.en[key]);
    }
  });

  it('has a label for every quick action, in every language', () => {
    for (const { code } of LANGS) {
      expect(Object.keys(CHAT_TEXT[code].actions).sort()).toEqual(QUICK_ACTIONS.map((a) => a.id).sort());
    }
  });

  // The backend sends messages to Gemini and doesn't save them: the notice must not promise more.
  it('privacy notice does not claim the chat is secure or encrypted', () => {
    for (const { code } of LANGS) expect(CHAT_TEXT[code].privacy).not.toMatch(/secure|encrypt|សុវត្ថិភាព|bảo mật|an toàn/i);
  });
});
