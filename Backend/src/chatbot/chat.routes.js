const express = require('express');
const router = express.Router();
const { GoogleGenAI, ApiError } = require('@google/genai');
const { optionalAuth, requireRole } = require('../common/middleware/require-role');
const { STATIC_PROMPT, buildContext } = require('./chat.prompt');

// The key stays on the server: it is read from Backend/.env and never sent to the browser.
const geminiClient = process.env.GEMINI_API_KEY
  ? new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY })
  : null;

// Override in Backend/.env with GEMINI_MODEL; see https://ai.google.dev/gemini-api/docs/models
const MODEL = process.env.GEMINI_MODEL?.trim() || 'gemini-3.5-flash-lite';
const TIMEOUT_MS = 30_000;

const MAX_HISTORY_MESSAGES = 20;
const MAX_MESSAGE_CHARS = 2000;

// The client sends the whole conversation, so nothing in it can be trusted. Only plain-text
// user/assistant turns are kept and both the number of turns and their length are capped.
// The conversation must start with a user turn.
function sanitizeHistory(raw) {
  if (!Array.isArray(raw)) return [];
  const clean = raw
    .filter((m) => m && (m.role === 'user' || m.role === 'assistant') && typeof m.content === 'string' && m.content.trim())
    .slice(-MAX_HISTORY_MESSAGES)
    .map((m) => ({ role: m.role, content: m.content.slice(0, MAX_MESSAGE_CHARS) }));
  while (clean.length && clean[0].role !== 'user') clean.shift();
  return clean;
}

// Gemini's format: { role: 'user' | 'model', parts: [{ text }] }
const toGeminiContents = (history, message) => [...history, { role: 'user', content: message }]
  .map((m) => ({ role: m.role === 'user' ? 'user' : 'model', parts: [{ text: m.content }] }));

// What the browser is told when Gemini fails. The real cause is only written to the server log.
function describeGeminiError(err) {
  if (err instanceof ApiError) {
    if (err.status === 429) return { status: 429, error: 'The assistant is getting too many questions right now. Please wait a minute and try again.' };
    if (err.status >= 500) return { status: 503, error: 'The AI service is temporarily unavailable. Please try again shortly.' };
    // 400 bad key / 403 no access / 404 unknown model: a server-side setup problem, not the user's fault.
    return { status: 502, error: 'The assistant is not set up correctly. Please try again later.' };
  }
  if (err?.name === 'AbortError' || /timed? ?out/i.test(err?.message || ''))
    return { status: 504, error: 'The assistant took too long to answer. Please try again.' };
  return { status: 502, error: 'Could not reach the AI service. Please try again later.' };
}

// Lets the admin settings page show real AI status without exposing the key itself.
router.get('/status', requireRole('admin'), (req, res) => {
  res.json({ configured: !!geminiClient, provider: 'gemini', model: MODEL });
});

// POST /api/chat   { message: "Hello", history: [{ role: "user" | "assistant", content: "..." }], lang?: "en" | "km" | "vi" }
//               -> { reply: "..." }            (errors: { error: "..." })
router.post('/', optionalAuth, async (req, res) => {
  const { message, history, lang } = req.body;
  if (typeof message !== 'string' || !message.trim())
    return res.status(400).json({ error: 'Please type a message.' });
  if (message.length > MAX_MESSAGE_CHARS)
    return res.status(400).json({ error: `Messages can be at most ${MAX_MESSAGE_CHARS} characters.` });
  if (history !== undefined && !Array.isArray(history))
    return res.status(400).json({ error: 'history must be an array.' });
  if (!geminiClient)
    return res.status(503).json({ error: 'The AI assistant is not configured.', configured: false });

  try {
    const response = await geminiClient.models.generateContent({
      model: MODEL,
      contents: toGeminiContents(sanitizeHistory(history), message.trim()),
      config: {
        systemInstruction: `${STATIC_PROMPT}\n\n${buildContext({ auth: req.auth, lang })}`,
        httpOptions: { timeout: TIMEOUT_MS },
      },
    });

    const reply = response.text?.trim();
    if (!reply) {
      // Usually a safety block; promptFeedback says why.
      console.error('Gemini returned no text:', response.promptFeedback?.blockReason || response.candidates?.[0]?.finishReason || 'unknown');
      return res.status(502).json({ error: "Sorry, I couldn't answer that one. Could you rephrase it?" });
    }
    res.json({ reply });
  } catch (err) {
    console.error(`Gemini error (model ${MODEL}):`, err?.status || '', err?.message);
    const { status, error } = describeGeminiError(err);
    res.status(status).json({ error });
  }
});

router.sanitizeHistory = sanitizeHistory;

module.exports = router;
