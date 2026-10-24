// Turns the per-question rows from runEval.js into the summary figures for the Results chapter.
// Every percentage is rounded to one decimal; a metric with no eligible items is null, not 0.

const pct = (hits, n) => (n ? Math.round((hits / n) * 1000) / 10 : null);
const avg = (values) => (values.length ? Math.round((values.reduce((a, b) => a + b, 0) / values.length) * 100) / 100 : null);
const count = (rows, pred) => rows.filter(pred).length;

// Every expected page is linked in the answer.
const linkedAll = (r) => r.expectedLinks.every((l) => r.links.includes(l));

function groupBy(rows, key) {
  const groups = {};
  for (const r of rows) (groups[r[key]] ||= []).push(r);
  return groups;
}

/**
 * @param {Array<{ lang, category, expectedLinks, links, mustGround, correct, languageMatch, inventedLiveData, latencyMs, error }>} results
 */
function aggregate(results) {
  // Judge-based metrics use only rows that were actually judged. A failed bot call is still
  // judged (an empty answer scores 0); a failed judge call is not a verdict on the bot.
  const judged = results.filter((r) => !r.judgeError);
  const withLinks = results.filter((r) => r.expectedLinks.length > 0 && !r.error);
  const grounded = judged.filter((r) => r.mustGround && !r.error);
  const latencies = results.filter((r) => !r.error).map((r) => r.latencyMs).sort((a, b) => a - b);

  const perLanguage = Object.fromEntries(Object.entries(groupBy(judged, 'lang')).map(([lang, rows]) => [lang, {
    n: rows.length,
    correctnessAvg: avg(rows.map((r) => r.correct)),
    languageMatchPct: pct(count(rows, (r) => r.languageMatch), rows.length),
  }]));

  const perCategory = Object.fromEntries(Object.entries(groupBy(judged, 'category')).map(([category, rows]) => [category, {
    n: rows.length,
    correctnessAvg: avg(rows.map((r) => r.correct)),
    correctnessPassPct: pct(count(rows, (r) => r.correct >= 4), rows.length),
  }]));

  return {
    n: results.length,
    errors: count(results, (r) => r.error),
    judgeErrors: results.length - judged.length,
    // Answers that link every page a correct answer should send the user to (failed calls excluded).
    linkAccuracyPct: pct(count(withLinks, linkedAll), withLinks.length),
    // Live-data questions answered without inventing figures (the bot has no database access).
    groundingRatePct: pct(count(grounded, (r) => !r.inventedLiveData), grounded.length),
    correctnessAvg5: avg(judged.map((r) => r.correct)),
    correctnessPassPct: pct(count(judged, (r) => r.correct >= 4), judged.length),
    languageMatchPct: pct(count(judged, (r) => r.languageMatch), judged.length),
    avgLatencyMs: latencies.length ? Math.round(latencies.reduce((a, b) => a + b, 0) / latencies.length) : null,
    p95LatencyMs: latencies.length ? latencies[Math.min(latencies.length - 1, Math.ceil(latencies.length * 0.95) - 1)] : null,
    perLanguage,
    perCategory,
  };
}

module.exports = { aggregate };
