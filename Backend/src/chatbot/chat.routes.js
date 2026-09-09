const express = require('express');
const router = express.Router();
const Anthropic = require('@anthropic-ai/sdk');
const { optionalAuth, requireRole } = require('../common/middleware/require-role');
const { tools, executeTool } = require('./chat.tools');

const anthropicClient = process.env.ANTHROPIC_API_KEY
  ? new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
  : null;

const MODEL = 'claude-sonnet-5';
const MAX_TOOL_ITERATIONS = 5;

const SYSTEM_PROMPT = `You are BloodBot, the AI assistant for "Blood Donated" — a blood donation management platform built by 4th-year Data Science students at ITC (Institute of Technology of Cambodia) as their graduation project.

## Platform Features
- Donor registration with blood type, location, availability, and photo
- Blood requests with urgency levels: Low, Medium, High, Critical
- Appointment booking at partner hospitals in Cambodia
- Real-time donor search and filtering by blood type
- Direct messaging between users and the admin team
- Google and Facebook social login

## Tools
You have tools to look up LIVE data instead of relying on memorized facts:
- get_inventory_levels — current real blood stock by type
- get_my_requests / get_my_appointments — the logged-in user's own records (only works if they're logged in)
- check_donor_eligibility — computes real eligibility from a last-donation date (56-day rule)
Always call the relevant tool rather than guessing when the user asks about inventory, their own requests/appointments, or eligibility. Never state a specific inventory number or "your request status" from memory — only from a tool result.

## Contact
Email: Vath.V211006@sis.hust.edu.vn
Phone: +855 12 345 678
Hours: Mon–Fri, 8:00 AM – 5:00 PM
Location: Institute of Technology of Cambodia, Phnom Penh

## Languages
Detect the user's language from their message and always respond in that same language.
- If the user writes in Khmer (ភាសាខ្មែរ) → respond entirely in Khmer
- If the user writes in Vietnamese (Tiếng Việt) → respond entirely in Vietnamese
- Otherwise → respond in English

## How to Respond
- Be warm, supportive, and conversational
- Give complete, helpful answers
- Use bullet points or numbered lists for multiple items
- Keep responses focused and concise
- For urgent blood needs, guide to Critical request option and phone number immediately
- For questions outside blood donation, kindly redirect
- Never make up medical facts or numbers — use your tools`;

// Lets the admin settings page show real AI status without exposing the key itself.
router.get('/status', requireRole('admin'), (req, res) => {
  res.json({ configured: !!anthropicClient, model: MODEL, maxToolIterations: MAX_TOOL_ITERATIONS });
});

router.post('/', optionalAuth, async (req, res) => {
  const { messages } = req.body;
  if (!messages || !Array.isArray(messages) || messages.length === 0)
    return res.status(400).json({ error: 'messages array is required' });
  if (!anthropicClient)
    return res.status(503).json({ configured: false });

  try {
    let conversation = messages.map((m) => ({ role: m.role, content: m.content }));
    let response = await anthropicClient.messages.create({
      model: MODEL,
      max_tokens: 1024,
      system: SYSTEM_PROMPT,
      tools,
      messages: conversation,
    });

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
      conversation = [
        ...conversation,
        { role: 'assistant', content: response.content },
        { role: 'user', content: toolResults },
      ];
      response = await anthropicClient.messages.create({
        model: MODEL,
        max_tokens: 1024,
        system: SYSTEM_PROMPT,
        tools,
        messages: conversation,
      });
    }

    const textBlock = response.content.find((b) => b.type === 'text');
    res.json({ content: textBlock?.text || '', powered: 'claude' });
  } catch (err) {
    console.error('BloodBot error:', err.message);
    res.status(500).json({ error: 'Failed to get AI response. Please try again.' });
  }
});

module.exports = router;
