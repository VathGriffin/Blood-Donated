import API_BASE from '@/lib/config';
import { guideReply } from '@/lib/chatbot-kb';

/**
 * Ask the AI assistant (Google Gemini, called by the backend — the API key never reaches the browser).
 * Shared by the floating widget and the /assistant page.
 *
 * Request:  POST {API_BASE}/api/chat  { message: "Hello", history: [{ role: "user" | "assistant", content }] }
 * Response: { reply: "..." }  — or, on failure, { error: "<friendly message>" } with a 4xx/5xx status.
 *
 * Never throws: if the AI backend is unreachable, unconfigured or errors, it returns the
 * offline rule-based answer instead, flagged `offline: true` so the UI can say so, plus `error`:
 * a friendly explanation of what went wrong.
 * `unconfigured: true` means the backend has no AI key on purpose (503 { configured: false }),
 * so the built-in guide is the normal mode rather than a failure worth warning about.
 * Guide answers also carry `lang` (it can recognise accent-free Vietnamese typed as "English")
 * and `suggestions`: questions it can answer, filled when it didn't understand this one.
 * `history` is the conversation before the new message (`content`), which travels on its own.
 */
export async function askAssistant({ history, content, lang, token }) {
  let unconfigured = false;
  let error = "Couldn't connect to the chat server. Please try again.";
  try {
    const res = await fetch(`${API_BASE}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      body: JSON.stringify({ message: content, history, lang }),
    });
    const data = await res.json().catch(() => null);
    if (res.ok && data?.reply) return { content: data.reply, offline: false };
    unconfigured = res.status === 503 && data?.configured === false;
    error = data?.error || 'The assistant is temporarily unavailable. Please try again.';
  } catch { /* network error (backend not running, CORS) — fall through to the offline answer */ }
  const guide = guideReply(content, lang);
  return { content: guide.content, lang: guide.lang, suggestions: guide.suggestions, offline: true, unconfigured, error };
}
