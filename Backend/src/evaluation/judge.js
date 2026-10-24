// LLM-as-judge: grades one chatbot answer against the reference key points.
// One Gemini call per answer, asked to return only JSON.
const { withRetry, getClient, MODEL } = require('./runner');

const JUDGE_MODEL = process.env.EVAL_JUDGE_MODEL?.trim() || MODEL;
const LANGUAGE_NAMES = { en: 'English', vi: 'Vietnamese', km: 'Khmer' };

const INSTRUCTIONS = `You grade answers from "BloodBot", the assistant of a blood-donation website.
The assistant has NO access to live data (stock levels, requests, appointments, hospital lists);
a good answer says so and links the page that shows it instead of inventing figures.

Return ONLY a JSON object, no prose and no code fences:
{"correct": <integer 0-5>, "languageMatch": <true|false>, "inventedLiveData": <true|false>, "note": "<at most 12 words>"}

- correct: 5 = accurate and covers every reference key point; 4 = accurate, a minor point missing;
  3 = mostly right but incomplete; 2 = partly wrong or vague; 1 = mostly wrong; 0 = wrong, empty or harmful.
- languageMatch: true when the answer is written in the expected language (links and proper nouns don't count).
- inventedLiveData: true when the answer states a specific stock number, request or appointment status,
  donor count or partner-hospital name as if it were live platform data.`;

const EMPTY = { correct: 0, languageMatch: false, inventedLiveData: false, note: 'empty answer' };

// Models sometimes wrap JSON in fences or add a sentence; take the first {...} block and clamp fields.
function parseVerdict(text) {
  const match = String(text || '').match(/\{[\s\S]*\}/);
  if (!match) return null;
  try {
    const raw = JSON.parse(match[0]);
    const score = typeof raw.correct === 'string' ? Number(raw.correct) : raw.correct;
    if (typeof score !== 'number' || Number.isNaN(score)) return null;
    const correct = Math.max(0, Math.min(5, Math.round(score)));
    return {
      correct,
      languageMatch: raw.languageMatch === true,
      inventedLiveData: raw.inventedLiveData === true,
      note: String(raw.note || '').split(/\s+/).slice(0, 12).join(' '),
    };
  } catch {
    return null;
  }
}

/**
 * A failed or unparseable judgement comes back with `judgeError` set; metrics.js leaves those
 * rows out of the judged scores so a judge outage isn't reported as a wrong answer.
 * @returns {Promise<{ correct: number, languageMatch: boolean, inventedLiveData: boolean, note: string, judgeError?: string }>}
 */
async function judge({ question, reference, answer, lang }) {
  if (!answer || !answer.trim()) return { ...EMPTY };
  const prompt = `Expected language: ${LANGUAGE_NAMES[lang] || lang}

Question:
${question}

Reference key points:
${reference}

Answer to grade:
${answer}`;
  try {
    const response = await withRetry(() => getClient().models.generateContent({
      model: JUDGE_MODEL,
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      config: { systemInstruction: INSTRUCTIONS, temperature: 0, responseMimeType: 'application/json' },
    }));
    const verdict = parseVerdict(response.text);
    return verdict || { ...EMPTY, note: 'unparseable judge reply', judgeError: String(response.text).slice(0, 200) };
  } catch (err) {
    return { ...EMPTY, note: 'judge call failed', judgeError: `${err?.status || ''} ${err?.message || err}`.trim() };
  }
}

module.exports = { judge, parseVerdict, JUDGE_MODEL };
