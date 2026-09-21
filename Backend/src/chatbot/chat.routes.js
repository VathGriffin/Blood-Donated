const express = require('express');
const router = express.Router();
const Anthropic = require('@anthropic-ai/sdk');
const { optionalAuth, requireRole } = require('../common/middleware/require-role');
const { tools, executeTool } = require('./chat.tools');
const { STATIC_PROMPT, buildContext } = require('./chat.prompt');

const anthropicClient = process.env.ANTHROPIC_API_KEY
  ? new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
  : null;

const MODEL = 'claude-sonnet-5';
const MAX_TOOL_ITERATIONS = 5;
const MAX_TOKENS = 1500; // Khmer and multi-step how-to answers need more room than English one-liners

const MAX_HISTORY_MESSAGES = 20;
const MAX_MESSAGE_CHARS = 2000;

// The client sends the whole conversation, so nothing in it can be trusted. Only plain-text
// user/assistant turns are kept — a client must not be able to smuggle in tool_use / tool_result
// blocks or a system-style role — and both the number of turns and their length are capped.
// The API also requires the conversation to start with a user turn.
function sanitizeMessages(raw) {
  if (!Array.isArray(raw)) return [];
  const clean = raw
    .filter((m) => m && (m.role === 'user' || m.role === 'assistant') && typeof m.content === 'string' && m.content.trim())
    .slice(-MAX_HISTORY_MESSAGES)
    .map((m) => ({ role: m.role, content: m.content.slice(0, MAX_MESSAGE_CHARS) }));
  while (clean.length && clean[0].role !== 'user') clean.shift();
  return clean;
}

// The long, unchanging instructions are marked cacheable; the small per-request context is not.
const buildSystem = (req, lang) => [
  { type: 'text', text: STATIC_PROMPT, cache_control: { type: 'ephemeral' } },
  { type: 'text', text: buildContext({ auth: req.auth, lang }) },
];

// Lets the admin settings page show real AI status without exposing the key itself.
router.get('/status', requireRole('admin'), (req, res) => {
  res.json({ configured: !!anthropicClient, model: MODEL, maxToolIterations: MAX_TOOL_ITERATIONS });
});

router.post('/', optionalAuth, async (req, res) => {
  const conversation = sanitizeMessages(req.body.messages);
  if (conversation.length === 0)
    return res.status(400).json({ error: 'messages array is required' });
  if (!anthropicClient)
    return res.status(503).json({ configured: false });

  const system = buildSystem(req, req.body.lang);
  const ask = (messages) =>
    anthropicClient.messages.create({ model: MODEL, max_tokens: MAX_TOKENS, system, tools, messages });

  try {
    let messages = conversation;
    let response = await ask(messages);

    let iterations = 0;
    while (response.stop_reason === 'tool_use' && iterations < MAX_TOOL_ITERATIONS) {
      iterations++;
      const toolResults = [];
      for (const block of response.content) {
        if (block.type === 'tool_use') {
          const result = await executeTool(block.name, block.input, req.user);
          toolResults.push({ type: 'tool_result', tool_use_id: block.id, content: JSON.stringify(result) });
        }
      }
      messages = [
        ...messages,
        { role: 'assistant', content: response.content },
        { role: 'user', content: toolResults },
      ];
      response = await ask(messages);
    }

    const textBlock = response.content.find((b) => b.type === 'text');
    res.json({ content: textBlock?.text || '', powered: 'claude' });
  } catch (err) {
    console.error('BloodBot error:', err.message);
    res.status(500).json({ error: 'Failed to get AI response. Please try again.' });
  }
});

router.sanitizeMessages = sanitizeMessages;

module.exports = router;
