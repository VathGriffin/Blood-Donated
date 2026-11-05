import { QUICK_ACTIONS, guideReply, detectLanguage } from './chatbot-kb';

const LANGS = ['en', 'km', 'vi'];

describe('QUICK_ACTIONS', () => {
  it('has the six cards in order', () => {
    expect(QUICK_ACTIONS.map((a) => a.id)).toEqual(['eligibility', 'appointment', 'hospital', 'bloodTypes', 'preparation', 'aftercare']);
  });

  it.each(LANGS)('has a %s prompt for every card, written in that language', (lang) => {
    for (const action of QUICK_ACTIONS) {
      expect(action.prompt[lang]).toEqual(expect.any(String));
      expect(action.prompt[lang].trim()).not.toBe('');
      expect(detectLanguage(action.prompt[lang])).toBe(lang);
    }
  });

  // The cards must work even when the AI is unreachable, so the offline guide has to answer
  // every card's question directly (no "I'm not sure" fallback with suggestions).
  it.each(LANGS)('every %s prompt gets a direct answer from the offline guide', (lang) => {
    for (const action of QUICK_ACTIONS) {
      const reply = guideReply(action.prompt[lang], lang);
      expect(reply.suggestions).toEqual([]);
      expect(reply.lang).toBe(lang);
      expect(reply.content.length).toBeGreaterThan(20);
    }
  });

  it('gives each card a different answer', () => {
    const answers = QUICK_ACTIONS.map((a) => guideReply(a.prompt.en, 'en').content);
    expect(new Set(answers).size).toBe(QUICK_ACTIONS.length);
  });
});
