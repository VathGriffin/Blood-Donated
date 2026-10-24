// Asks the real BloodBot one evaluation question, the same way POST /api/chat does: the same
// system instruction (STATIC_PROMPT + buildContext) and the same Gemini request shape. The
// chatbot has no tools, so there is no tool loop: one question, one generateContent call.
const { GoogleGenAI, ApiError } = require('@google/genai');
const { STATIC_PROMPT, buildContext } = require('../chatbot/chat.prompt');

// Same default as chat.routes.js; EVAL_MODEL lets a run target another model for comparison.
const MODEL = process.env.EVAL_MODEL?.trim() || process.env.GEMINI_MODEL?.trim() || 'gemini-3.5-flash-lite';
const TIMEOUT_MS = 30_000;

let client = null;
function getClient() {
  if (!process.env.GEMINI_API_KEY) throw new Error('GEMINI_API_KEY is not set in Backend/.env');
  client ??= new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  return client;
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// Rate limits (429) and server errors (5xx) are retried with backoff so one busy minute
// doesn't turn into a row of zero scores. Anything else fails straight away.
async function withRetry(fn, attempts = 3) {
  for (let i = 1; ; i++) {
    try {
      return await fn();
    } catch (err) {
      const retryable = err instanceof ApiError && (err.status === 429 || err.status >= 500);
      if (!retryable || i >= attempts) throw err;
      await sleep(5000 * i);
    }
  }
}

// Internal markdown links the answer contains, e.g. "[Register](/register/)" -> "/register".
const linksIn = (text) => [...new Set([...text.matchAll(/\]\((\/[^)\s#?]*)/g)].map((m) => m[1].replace(/(.)\/+$/, '$1')))];

/**
 * @param {{ question: string }} question  an item from evaluation/questions.json
 * @param {{ lang?: string, auth?: object }} options  `auth` is what req.auth would be for a signed-in user
 * @returns {Promise<{ answer: string, links: string[], latencyMs: number, error: string | null }>}
 */
async function runQuestion(question, { lang, auth } = {}) {
  // Latency is the last attempt only, so retry back-off waits don't inflate the figure.
  let started = Date.now();
  try {
    const response = await withRetry(() => {
      started = Date.now();
      return getClient().models.generateContent({
        model: MODEL,
        contents: [{ role: 'user', parts: [{ text: question.question }] }],
        config: {
          systemInstruction: `${STATIC_PROMPT}\n\n${buildContext({ auth, lang })}`,
          httpOptions: { timeout: TIMEOUT_MS },
        },
      });
    });
    const answer = response.text?.trim() || '';
    return { answer, links: linksIn(answer), latencyMs: Date.now() - started, error: answer ? null : 'empty reply' };
  } catch (err) {
    return { answer: '', links: [], latencyMs: Date.now() - started, error: `${err?.status || ''} ${err?.message || err}`.trim() };
  }
}

module.exports = { runQuestion, withRetry, getClient, linksIn, MODEL };
