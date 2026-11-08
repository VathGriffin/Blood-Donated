'use client';
import { useCallback, useRef, useState } from 'react';
import axios from 'axios';
import API_BASE from '@/lib/config';
import { askAssistant } from '@/lib/chat-client';
import { detectLanguage } from '@/lib/chatbot-kb';

let nextId = 0;
const newId = () => `m${Date.now().toString(36)}-${(nextId += 1)}`;

/**
 * State for the donor "Chat with AI" page. The conversation lives in memory only, like the
 * /assistant page and the floating widget (nothing is stored).
 *
 * Messages: { id, role: 'user' | 'assistant', at: Date, … }
 *   assistant text:  { content, offline, failed, retryOf }   (failed = the AI was unreachable)
 *   eligibility:     { kind: 'eligibility', record }          (record: see checkEligibility)
 *
 * Questions go to the backend (POST /api/chat → Gemini; the key stays on the server); when that
 * fails, askAssistant answers from the built-in guide and the message can be retried.
 */
export default function useAssistantChat({ token, email, lang: siteLang }) {
  const [messages, setMessagesState] = useState([]);
  const [sending, setSending] = useState(false);
  // The conversation as of now (state is only readable after the next render).
  const current = useRef([]);
  const setMessages = useCallback((update) => {
    current.current = typeof update === 'function' ? update(current.current) : update;
    setMessagesState(current.current);
  }, []);
  const inFlight = useRef(false); // a second Enter/click while a reply is on its way does nothing

  // Prior turns sent as context: text messages only, in the API's { role, content } shape.
  const historyOf = (list) => list.filter((m) => !m.kind && m.content).map(({ role, content }) => ({ role, content }));

  const ask = useCallback(async (content, before, replaceId) => {
    // Reply in the site language unless the question is plainly written in Khmer or Vietnamese.
    const detected = detectLanguage(content);
    const lang = detected !== 'en' ? detected : siteLang;
    const reply = await askAssistant({ history: historyOf(before), content, lang, token });
    const message = {
      id: replaceId || newId(), role: 'assistant', at: new Date(), content: reply.content,
      offline: reply.offline, failed: reply.offline && !reply.unconfigured, question: content,
    };
    setMessages((list) => (replaceId ? list.map((m) => (m.id === replaceId ? message : m)) : [...list, message]));
  }, [siteLang, token, setMessages]);

  /** Send a question typed by the donor (or picked from a quick question). Returns false if ignored. */
  const send = useCallback(async (text) => {
    const content = String(text || '').trim();
    if (!content || inFlight.current) return false;
    inFlight.current = true;
    setSending(true);
    const before = current.current;
    setMessages([...before, { id: newId(), role: 'user', content, at: new Date() }]);
    try {
      await ask(content, before);
    } finally {
      inFlight.current = false;
      setSending(false);
    }
    return true;
  }, [ask, setMessages]);

  /** Ask the AI again for an answer that came from the offline guide. */
  const retry = useCallback(async (messageId) => {
    if (inFlight.current) return;
    const list = current.current;
    const index = list.findIndex((m) => m.id === messageId);
    const failed = list[index];
    if (!failed?.question) return;
    inFlight.current = true;
    setSending(true);
    try {
      // History before the question that produced this answer.
      await ask(failed.question, list.slice(0, Math.max(0, index - 1)), messageId);
    } finally {
      inFlight.current = false;
      setSending(false);
    }
  }, [ask]);

  /**
   * "Check my eligibility": answered from the signed-in donor's own record (GET /api/donors/lookup,
   * which only returns the caller's record) and the platform's 56-day rule — not by the AI, so
   * nothing is guessed. `question` is the text shown as the donor's message.
   */
  const checkEligibility = useCallback(async (question) => {
    if (inFlight.current) return;
    inFlight.current = true;
    setSending(true);
    const id = newId();
    setMessages((list) => [
      ...list,
      { id: newId(), role: 'user', content: question, at: new Date() },
      { id, role: 'assistant', kind: 'eligibility', at: new Date(), record: { status: 'loading' } },
    ]);
    let record;
    try {
      const { data } = await axios.get(`${API_BASE}/api/donors/lookup`, {
        params: { email }, headers: { Authorization: `Bearer ${token}` },
      });
      record = data?.found
        ? { status: 'found', lastDonation: data.lastDonation || null }
        : { status: 'none' };
    } catch {
      record = { status: 'error' };
    } finally {
      inFlight.current = false;
      setSending(false);
    }
    setMessages((list) => list.map((m) => (m.id === id ? { ...m, record } : m)));
  }, [email, token, setMessages]);

  return { messages, sending, send, retry, checkEligibility };
}
