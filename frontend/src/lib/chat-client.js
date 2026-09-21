import API_BASE from '@/lib/config';
import { ruleBasedResponse } from '@/lib/chatbot-kb';

/**
 * Ask the AI assistant. Shared by the floating widget and the /assistant page.
 * Never throws: if the AI backend is unreachable, unconfigured or errors, it returns the
 * offline rule-based answer instead, flagged `offline: true` so the UI can say so.
 * `history` is the full conversation including the new user message.
 */
export async function askAssistant({ history, content, lang, token }) {
  try {
    const res = await fetch(`${API_BASE}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      body: JSON.stringify({ messages: history, lang }),
    });
    const data = await res.json();
    if (res.ok) return { content: data.content, powered: data.powered, offline: false };
  } catch { /* network error or non-JSON reply — fall through to the offline answer */ }
  return { content: ruleBasedResponse(content, lang), offline: true };
}
