import API_BASE from '@/lib/config';
import { guideReply } from '@/lib/chatbot-kb';

/**
 * Ask the AI assistant. Shared by the floating widget and the /assistant page.
 * Never throws: if the AI backend is unreachable, unconfigured or errors, it returns the
 * offline rule-based answer instead, flagged `offline: true` so the UI can say so.
 * `unconfigured: true` means the backend has no AI key on purpose (503 { configured: false }),
 * so the built-in guide is the normal mode rather than a failure worth warning about.
 * Guide answers also carry `lang` (it can recognise accent-free Vietnamese typed as "English")
 * and `suggestions`: questions it can answer, filled when it didn't understand this one.
 * `history` is the full conversation including the new user message.
 */
export async function askAssistant({ history, content, lang, token }) {
  let unconfigured = false;
  try {
    const res = await fetch(`${API_BASE}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      body: JSON.stringify({ messages: history, lang }),
    });
    const data = await res.json();
    if (res.ok) return { content: data.content, powered: data.powered, offline: false };
    unconfigured = res.status === 503 && data?.configured === false;
  } catch { /* network error or non-JSON reply — fall through to the offline answer */ }
  const guide = guideReply(content, lang);
  return { content: guide.content, lang: guide.lang, suggestions: guide.suggestions, offline: true, unconfigured };
}
