# BloodBot evaluation

A repeatable, quantitative test of the website's AI assistant, used for the thesis Results chapter.
It sends each question in `questions.json` to the **real** chatbot configuration (the same system
instruction, `STATIC_PROMPT` + `buildContext`, and the same Gemini request as `POST /api/chat`),
grades every answer with an LLM judge, and writes `results.json`.

The chatbot itself is not changed. The harness lives in `Backend/src/evaluation/`.

## Run it

```bash
cd Backend
node src/evaluation/runEval.js                 # every question
node src/evaluation/runEval.js en-how-01 km-elig-01   # only these ids
```

Needs `GEMINI_API_KEY` in `Backend/.env`. Optional:

| Variable | Default | Use |
|---|---|---|
| `EVAL_MODEL` | `GEMINI_MODEL`, else the chatbot's default | Model that answers (compare models) |
| `EVAL_JUDGE_MODEL` | same as `EVAL_MODEL` | Model that grades. A stronger judge than the bot gives fairer scores |

A full run is 2 API calls per question (answer + judge) with a 0.6 s pause between calls;
rate-limit (429) and server (5xx) errors are retried up to 3 times. No database is needed —
the assistant has no database access. `results.json` is rewritten after every question
(`"complete": false` until the run ends), so an interrupted run keeps what it had.

## The dataset — `questions.json`

24 questions: 10 English, 7 Vietnamese, 7 Khmer, across five categories.

| Category | What a good answer does |
|---|---|
| `live-data` | Says it can't see live figures and links the page that shows them — never invents a number |
| `eligibility` | Applies the platform's 56-day whole-blood interval and defers the final decision to screening |
| `knowledge` | Correct general blood-donation facts |
| `how-to` | Correct steps for this website, with the right page link |
| `out-of-scope` | Politely declines and says what it can help with |

Each item:

```jsonc
{
  "id": "en-how-01",
  "lang": "en",                  // en | vi | km — the language the answer must be in
  "category": "how-to",
  "question": "How do I create an account on this website?",
  "expectedLinks": ["/register"],// internal pages a correct answer must link ([] = none required)
  "reference": "…",              // key points of a correct answer, for the judge
  "mustGround": false,           // true = live-data question: must not invent figures
  "requiresAuth": true           // optional: ask as a signed-in donor
}
```

Add questions by appending items; keep `id`s unique. Aim for a balance across languages and categories.

## Metrics — `summary` in `results.json`

| Metric | Meaning |
|---|---|
| `correctnessAvg5` | Mean judge score, 0–5 (5 = accurate and complete, 0 = wrong or empty) |
| `correctnessPassPct` | % of answers scoring 4 or 5 |
| `linkAccuracyPct` | Of questions with `expectedLinks`, % whose answer links **every** expected page (checked from the text, not by the judge) |
| `groundingRatePct` | Of `mustGround` questions, % answered **without** inventing live data (stock numbers, statuses, hospital names) |
| `languageMatchPct` | % of answers written in the question's language |
| `avgLatencyMs` / `p95LatencyMs` | Time for the bot's reply — the final attempt only, so retry waits don't count (judge time and failed calls excluded) |
| `errors` | Questions where the bot call failed or returned nothing (scored 0; left out of link accuracy and grounding) |
| `judgeErrors` | Questions the judge failed to grade — left out of every judged metric rather than counted as wrong. Re-run those ids |
| `perLanguage` | `n`, `correctnessAvg`, `languageMatchPct` for en / vi / km |
| `perCategory` | `n`, `correctnessAvg`, `correctnessPassPct` per category |

Per-question rows keep the full answer, the links found, the judge's score and a short note,
so any number in the summary can be traced back to the answers behind it.

**Limits to state in the thesis:** the judge is itself an LLM, so scores carry some noise —
fix `EVAL_JUDGE_MODEL`, keep `temperature: 0` (already set), and ideally spot-check a sample of
judgements by hand and report the agreement. Results also vary slightly between runs; report the
mean of several runs if space allows.

## Ablation idea

The assistant currently answers from its prompt alone. To measure the effect of adding
retrieval (RAG) over a blood-donation knowledge base:

1. Run the evaluation now and keep `results.json` as the baseline (rename it, e.g. `results-baseline.json`).
2. Add RAG to the chatbot.
3. Run again and compare — especially `perCategory.knowledge` and `perCategory.eligibility`
   correctness, plus latency (retrieval adds time). Keep the questions and judge model identical
   between the two runs so the only difference is the RAG change.

The same pattern compares models: run once per `EVAL_MODEL` value.
