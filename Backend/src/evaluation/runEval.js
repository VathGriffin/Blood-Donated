// Entry point: runs every question in evaluation/questions.json through the real BloodBot prompt,
// grades each answer, and writes evaluation/results.json plus a console summary.
//
//   cd Backend && node src/evaluation/runEval.js              # all questions
//   cd Backend && node src/evaluation/runEval.js en-how-01    # only these ids
//
// The chatbot never touches MongoDB, so no database connection is needed.
const path = require('path');
const fs = require('fs');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

const { runQuestion, MODEL } = require('./runner');
const { judge, JUDGE_MODEL } = require('./judge');
const { aggregate } = require('./metrics');

const EVAL_DIR = path.join(__dirname, '../../../evaluation');
const PAUSE_MS = 600; // between API calls, to stay under per-minute rate limits

// What req.auth looks like for a signed-in donor; used for "my requests / appointments" questions.
const EVAL_AUTH = { role: 'donor', fullName: 'Evaluation Donor' };

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function main() {
  if (!process.env.GEMINI_API_KEY) {
    console.error('❌ GEMINI_API_KEY is not set. Add it to Backend/.env and run again.');
    process.exit(1);
  }

  const all = JSON.parse(fs.readFileSync(path.join(EVAL_DIR, 'questions.json'), 'utf8'));
  const only = process.argv.slice(2);
  const unknown = only.filter((id) => !all.some((q) => q.id === id));
  if (unknown.length) {
    console.error(`❌ Unknown question id(s): ${unknown.join(', ')}`);
    process.exit(1);
  }
  const questions = only.length ? all.filter((q) => only.includes(q.id)) : all;
  console.log(`Evaluating ${questions.length} question(s) · bot model ${MODEL} · judge model ${JUDGE_MODEL}\n`);

  const results = [];
  const resultsPath = path.join(EVAL_DIR, 'results.json');
  // Rewritten after every question, so a crash or Ctrl-C halfway still leaves the answers so far.
  const save = (done) => fs.writeFileSync(resultsPath, `${JSON.stringify({
    generatedAt: new Date().toISOString(), complete: done, model: MODEL, judgeModel: JUDGE_MODEL,
    summary: aggregate(results), results,
  }, null, 2)}\n`);

  for (const [i, q] of questions.entries()) {
    const run = await runQuestion(q, { lang: q.lang, auth: q.requiresAuth ? EVAL_AUTH : null });
    await sleep(PAUSE_MS);
    const verdict = await judge({ question: q.question, reference: q.reference, answer: run.answer, lang: q.lang });
    await sleep(PAUSE_MS);

    results.push({
      id: q.id, lang: q.lang, category: q.category, question: q.question,
      expectedLinks: q.expectedLinks, mustGround: q.mustGround, requiresAuth: !!q.requiresAuth,
      ...run, ...verdict,
    });
    save(false);
    const status = run.error ? `error: ${run.error}`
      : verdict.judgeError ? `judge failed: ${verdict.note}`
      : `${verdict.correct}/5 · ${run.latencyMs} ms`;
    console.log(`[${i + 1}/${questions.length}] ${q.id.padEnd(12)} ${status}`);
  }

  save(true);
  const summary = aggregate(results);

  console.log('\nPer question');
  console.table(results.map((r) => ({
    id: r.id, correct: r.correct, lang: r.languageMatch ? '✓' : '✗',
    links: r.expectedLinks.length ? (r.expectedLinks.every((l) => r.links.includes(l)) ? '✓' : '✗') : '',
    invented: r.mustGround ? (r.inventedLiveData ? '✗ yes' : '✓ no') : '',
    ms: r.latencyMs, note: r.error || r.judgeError || r.note,
  })));

  console.log('Summary');
  console.table({
    'Correctness (avg / 5)': summary.correctnessAvg5,
    'Correctness pass rate (≥ 4), %': summary.correctnessPassPct,
    'Link accuracy, %': summary.linkAccuracyPct,
    'Grounding (no invented live data), %': summary.groundingRatePct,
    'Language match, %': summary.languageMatchPct,
    'Avg latency, ms': summary.avgLatencyMs,
    'p95 latency, ms': summary.p95LatencyMs,
    'Errors (bot)': summary.errors,
    'Errors (judge, excluded)': summary.judgeErrors,
  });
  console.log('Per language');
  console.table(summary.perLanguage);
  console.log('Per category');
  console.table(summary.perCategory);
  console.log(`Saved evaluation/results.json`);
}

main().catch((err) => {
  console.error('❌ Evaluation failed:', err);
  process.exit(1);
});
