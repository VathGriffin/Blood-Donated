'use client';
import { useCallback, useEffect, useState } from 'react';
import { LANGS } from './chat-i18n';

// The chat widget's own language, kept apart from the website language (i18n/I18nProvider.jsx,
// saved under 'bloodlife-lang'). Changing one never changes the other.
export const CHAT_LANG_KEY = 'bloodlife_chat_language';
export const DEFAULT_CHAT_LANG = 'en';

const CODES = LANGS.map((l) => l.code);
export const normalizeChatLang = (code) => (CODES.includes(code) ? code : DEFAULT_CHAT_LANG);

const readSaved = () => {
  try { return normalizeChatLang(localStorage.getItem(CHAT_LANG_KEY)); } catch { return DEFAULT_CHAT_LANG; }
};

/**
 * [chatLang, setChatLang] for the floating chat widget. The choice survives navigation and
 * refresh (localStorage) and follows changes made in other tabs. The widget only renders in the
 * browser (ssr: false in ChatBotWrapper), so reading storage on the first render is safe.
 */
export default function useChatLanguage() {
  const [chatLang, setState] = useState(readSaved);

  useEffect(() => {
    const onStorage = (e) => { if (e.key === CHAT_LANG_KEY) setState(normalizeChatLang(e.newValue)); };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  const setChatLang = useCallback((next) => {
    const code = normalizeChatLang(next);
    setState(code);
    try { localStorage.setItem(CHAT_LANG_KEY, code); } catch { /* storage blocked: kept for this visit only */ }
  }, []);

  return [chatLang, setChatLang];
}
