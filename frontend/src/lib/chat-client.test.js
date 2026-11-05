import { askAssistant } from './chat-client';

const jsonResponse = (status, body) => ({ ok: status >= 200 && status < 300, status, json: () => Promise.resolve(body) });

describe('askAssistant', () => {
  afterEach(() => { delete global.fetch; });

  it('returns the AI reply and sends the token, history and language', async () => {
    global.fetch = jest.fn().mockResolvedValue(jsonResponse(200, { reply: 'Hi there' }));
    const history = [{ role: 'user', content: 'Hello' }, { role: 'assistant', content: 'Hi' }];
    const reply = await askAssistant({ history, content: 'Am I eligible to donate?', lang: 'en', token: 'tok' });

    expect(reply).toEqual({ content: 'Hi there', offline: false });
    const [url, init] = global.fetch.mock.calls[0];
    expect(url).toMatch(/\/api\/chat$/);
    expect(init.headers.Authorization).toBe('Bearer tok');
    expect(JSON.parse(init.body)).toEqual({ message: 'Am I eligible to donate?', history, lang: 'en' });
  });

  it('falls back to the offline guide when the AI errors, and says why', async () => {
    global.fetch = jest.fn().mockResolvedValue(jsonResponse(502, { error: 'The assistant is not set up correctly.' }));
    const reply = await askAssistant({ history: [], content: 'Am I eligible to donate?', lang: 'en' });

    expect(reply.offline).toBe(true);
    expect(reply.unconfigured).toBe(false);
    expect(reply.error).toBe('The assistant is not set up correctly.');
    expect(reply.content).toMatch(/eligib|donate/i);
  });

  it('falls back to the offline guide when the network is down, without throwing', async () => {
    global.fetch = jest.fn().mockRejectedValue(new TypeError('Failed to fetch'));
    const reply = await askAssistant({ history: [], content: 'តើខ្ញុំអាចបរិច្ចាគបានទេ?', lang: 'km' });

    expect(reply.offline).toBe(true);
    expect(reply.lang).toBe('km');
    expect(reply.content).toMatch(/[ក-៿]/);
  });

  it('marks a server with no AI key as unconfigured rather than failing', async () => {
    global.fetch = jest.fn().mockResolvedValue(jsonResponse(503, { error: 'Not configured', configured: false }));
    const reply = await askAssistant({ history: [], content: 'hello', lang: 'en' });

    expect(reply.offline).toBe(true);
    expect(reply.unconfigured).toBe(true);
  });
});
