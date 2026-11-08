import { render, screen, fireEvent, act, waitFor, within, cleanup } from '@testing-library/react';
import { ThemeProvider } from '@mui/material/styles';
import { buildTheme } from '@/lib/theme';
import { I18nProvider, useI18n } from '@/i18n/I18nProvider';
import { LANG_KEY, LOCALES } from '@/i18n/config';
import { askAssistant } from '@/lib/chat-client';
import { QUICK_ACTIONS } from '@/lib/chatbot-kb';
import ChatBot from './ChatBot';
import { CHAT_TEXT } from './chat-i18n';
import { CHAT_LANG_KEY } from './useChatLanguage';

jest.mock('@/store/UserAuthContext', () => ({ useUserAuth: () => ({ token: 'donor-token' }) }));
jest.mock('@/lib/chat-client', () => ({ askAssistant: jest.fn() }));

const EN = CHAT_TEXT.en;
const KM = CHAT_TEXT.km;

// A promise the test resolves by hand, to look at the loading state in between.
const deferred = () => {
  let resolve;
  const promise = new Promise((r) => { resolve = r; });
  return { promise, resolve };
};

// Stands in for the website's own language picker (the navbar one).
function SiteLanguage() {
  const { lang, setLang } = useI18n();
  return (
    <div>
      <span data-testid="site-lang">{lang}</span>
      {LOCALES.map((l) => <button key={l.code} type="button" onClick={() => setLang(l.code)}>{`site-${l.code}`}</button>)}
    </div>
  );
}

// `lang` is the website language; the chat starts in `chat` (saved earlier) or its own default.
const renderChat = (lang = 'en', { site = false } = {}) => render(
  <ThemeProvider theme={buildTheme('light')}>
    <I18nProvider initialLang={lang}>{site && <SiteLanguage />}<ChatBot /></I18nProvider>
  </ThemeProvider>,
);

async function openChat(lang = 'en', { site = false, chat } = {}) {
  if (chat) localStorage.setItem(CHAT_LANG_KEY, chat);
  renderChat(lang, { site });
  const chatLang = chat || localStorage.getItem(CHAT_LANG_KEY) || 'en';
  fireEvent.click(await screen.findByRole('button', { name: CHAT_TEXT[chatLang].openAssistant }));
  return screen.findByRole('dialog');
}

const composer = (name = EN.placeholder) => screen.getByRole('textbox', { name });

beforeEach(() => {
  // The language choice is remembered between renders, as on the real site; start each test fresh.
  localStorage.clear();
  document.cookie = 'bloodlife-lang=; path=/; max-age=0';
  window.__setViewportWidth(1280);
  global.fetch = jest.fn().mockResolvedValue({ ok: true }); // /health
  askAssistant.mockReset();
  Element.prototype.scrollTo = jest.fn();
});

describe('ChatBot', () => {
  it('opens with the welcome message, privacy notice, six quick actions and composer', async () => {
    const panel = await openChat();
    expect(within(panel).getByRole('heading', { name: EN.title })).toBeTruthy();
    expect(within(panel).getByText(EN.intro)).toBeTruthy();
    expect(within(panel).getByText(EN.privacy, { exact: false })).toBeTruthy();
    expect(within(panel).getByRole('link', { name: EN.privacyLink }).getAttribute('href')).toBe('/privacy');
    const actions = within(screen.getByRole('navigation', { name: EN.quickActions })).getAllByRole('button');
    expect(actions.map((b) => b.textContent)).toEqual(Object.values(EN.actions));
    expect(composer()).toBeTruthy();
    expect(within(panel).getByText(EN.disclaimer)).toBeTruthy();
    // No attachment button: the chat API takes text only.
    expect(within(panel).queryByRole('button', { name: /attach|upload/i })).toBeNull();
  });

  describe('connection status', () => {
    it('shows Online once the API health check answers', async () => {
      const panel = await openChat();
      await waitFor(() => expect(within(panel).getByRole('status').textContent).toContain(EN.online));
      expect(global.fetch).toHaveBeenCalledWith(expect.stringMatching(/\/health$/), expect.any(Object));
    });

    it('shows Offline when the API cannot be reached', async () => {
      global.fetch = jest.fn().mockRejectedValue(new TypeError('Failed to fetch'));
      const panel = await openChat();
      await waitFor(() => expect(within(panel).getByRole('status').textContent).toContain(EN.offline));
    });

    it('shows Offline and a notice when the browser loses its connection', async () => {
      const panel = await openChat();
      await waitFor(() => expect(within(panel).getByRole('status').textContent).toContain(EN.online));
      act(() => { window.dispatchEvent(new Event('offline')); });
      expect(within(panel).getByRole('status').textContent).toContain(EN.offline);
      expect(within(panel).getByRole('alert').textContent).toContain(EN.browserOffline);
    });
  });

  describe('language switching', () => {
    it('translates the whole widget when KH is chosen', async () => {
      const panel = await openChat();
      fireEvent.click(within(panel).getByRole('button', { name: 'ខ្មែរ' }));

      expect(within(panel).getByRole('button', { name: 'ខ្មែរ' }).getAttribute('aria-pressed')).toBe('true');
      expect(within(panel).getByRole('button', { name: 'English' }).getAttribute('aria-pressed')).toBe('false');
      expect(within(panel).getByRole('heading', { name: KM.title })).toBeTruthy();
      expect(composer(KM.placeholder)).toBeTruthy();
      expect(within(panel).getByText(KM.disclaimer)).toBeTruthy();
      const actions = within(screen.getByRole('navigation', { name: KM.quickActions })).getAllByRole('button');
      expect(actions.map((b) => b.textContent)).toEqual(Object.values(KM.actions));
    });

    it('switches to Vietnamese and back to English', async () => {
      const panel = await openChat();
      fireEvent.click(within(panel).getByRole('button', { name: 'Tiếng Việt' }));
      expect(composer(CHAT_TEXT.vi.placeholder)).toBeTruthy();
      fireEvent.click(within(panel).getByRole('button', { name: 'English' }));
      expect(composer(EN.placeholder)).toBeTruthy();
    });

    it('keeps its own language when the question is written in another one', async () => {
      askAssistant.mockResolvedValue({ content: 'answer', offline: false });
      await openChat();
      fireEvent.change(composer(), { target: { value: 'សួស្ដី' } });
      fireEvent.keyDown(composer(), { key: 'Enter' });
      expect(await screen.findByText('answer')).toBeTruthy();
      expect(composer(EN.placeholder)).toBeTruthy();
      expect(askAssistant).toHaveBeenCalledWith(expect.objectContaining({ content: 'សួស្ដី', lang: 'en' }));
    });
  });

  // The website language (I18nProvider, 'bloodlife-lang') and the chat language
  // ('bloodlife_chat_language') are separate: changing one never changes the other.
  describe('website and chat languages are independent', () => {
    const siteLang = () => screen.getByTestId('site-lang').textContent;
    const pickChat = (panel, name) => fireEvent.click(within(panel).getByRole('button', { name }));
    const askHello = async (placeholder) => {
      askAssistant.mockResolvedValue({ content: 'ok', offline: false });
      fireEvent.change(composer(placeholder), { target: { value: 'hello' } });
      fireEvent.keyDown(composer(placeholder), { key: 'Enter' });
      await screen.findByText('ok');
    };

    it('A: website English, chat KH: the site stays English and the chat uses Khmer', async () => {
      const panel = await openChat('en', { site: true });
      pickChat(panel, 'ខ្មែរ');
      expect(siteLang()).toBe('en');
      expect(document.documentElement.lang).not.toBe('km');
      expect(localStorage.getItem(LANG_KEY)).not.toBe('km');
      expect(localStorage.getItem(CHAT_LANG_KEY)).toBe('km');
      expect(within(panel).getByRole('heading', { name: KM.title })).toBeTruthy();
      await askHello(KM.placeholder);
      expect(askAssistant).toHaveBeenCalledWith(expect.objectContaining({ content: 'hello', lang: 'km' }));
      expect(siteLang()).toBe('en');
    });

    it('B: website Khmer, chat EN: the site stays Khmer and the chat uses English', async () => {
      const panel = await openChat('km', { site: true, chat: 'en' });
      expect(siteLang()).toBe('km');
      expect(within(panel).getByRole('heading', { name: EN.title })).toBeTruthy();
      expect(within(panel).getByRole('button', { name: 'English' }).getAttribute('aria-pressed')).toBe('true');
      await askHello(EN.placeholder);
      expect(askAssistant).toHaveBeenCalledWith(expect.objectContaining({ content: 'hello', lang: 'en' }));
      expect(siteLang()).toBe('km');
    });

    it('C: website Vietnamese, chat KH: the site stays Vietnamese and the chat uses Khmer', async () => {
      const panel = await openChat('vi', { site: true });
      pickChat(panel, 'ខ្មែរ');
      expect(siteLang()).toBe('vi');
      expect(composer(KM.placeholder)).toBeTruthy();
      await askHello(KM.placeholder);
      expect(askAssistant).toHaveBeenCalledWith(expect.objectContaining({ lang: 'km' }));
      expect(siteLang()).toBe('vi');
    });

    it('D: each keeps its own choice after several chat changes and a refresh', async () => {
      const panel = await openChat('en', { site: true });
      fireEvent.click(screen.getByRole('button', { name: 'site-vi' }));
      await waitFor(() => expect(siteLang()).toBe('vi'));
      pickChat(panel, 'ខ្មែរ');
      pickChat(panel, 'Tiếng Việt');
      pickChat(panel, 'English');
      pickChat(panel, 'ខ្មែរ');
      expect(siteLang()).toBe('vi');

      // Refresh: everything unmounts and mounts again from what was saved.
      cleanup();
      const again = await openChat('vi', { site: true });
      expect(siteLang()).toBe('vi');
      expect(within(again).getByRole('heading', { name: KM.title })).toBeTruthy();
      expect(within(again).getByRole('button', { name: 'ខ្មែរ' }).getAttribute('aria-pressed')).toBe('true');
    });

    it('E: changing the website language does not change the chat language', async () => {
      const panel = await openChat('en', { site: true, chat: 'vi' });
      for (const code of ['km', 'en', 'vi', 'km']) {
        fireEvent.click(screen.getByRole('button', { name: `site-${code}` }));
        await waitFor(() => expect(siteLang()).toBe(code));
        expect(within(panel).getByRole('heading', { name: CHAT_TEXT.vi.title })).toBeTruthy();
      }
      expect(localStorage.getItem(CHAT_LANG_KEY)).toBe('vi');
    });

    it('starts in English when nothing is saved, whatever the website language', async () => {
      const panel = await openChat('km', { site: true });
      expect(within(panel).getByRole('heading', { name: EN.title })).toBeTruthy();
      expect(siteLang()).toBe('km');
    });
  });

  describe('quick actions', () => {
    it.each(QUICK_ACTIONS.map((a) => a.id))('"%s" sends its English question through the chat', async (id) => {
      askAssistant.mockResolvedValue({ content: `Answer for ${id}`, offline: false });
      const panel = await openChat();
      fireEvent.click(within(panel).getByRole('button', { name: new RegExp(EN.actions[id]) }));

      const prompt = QUICK_ACTIONS.find((a) => a.id === id).prompt.en;
      expect(askAssistant).toHaveBeenCalledWith({ history: [], content: prompt, lang: 'en', token: 'donor-token' });
      expect(within(panel).getByText(prompt)).toBeTruthy();
      expect(await within(panel).findByText(`Answer for ${id}`)).toBeTruthy();
    });

    it('sends the Khmer question when KH is selected', async () => {
      askAssistant.mockResolvedValue({ content: 'ok', offline: false });
      const panel = await openChat();
      fireEvent.click(within(panel).getByRole('button', { name: 'ខ្មែរ' }));
      fireEvent.click(within(panel).getByRole('button', { name: new RegExp(KM.actions.eligibility) }));
      const prompt = QUICK_ACTIONS.find((a) => a.id === 'eligibility').prompt.km;
      expect(askAssistant).toHaveBeenCalledWith(expect.objectContaining({ content: prompt, lang: 'km' }));
      await screen.findByText('ok');
    });

    it('keeps what the user was typing when a quick action is used', async () => {
      askAssistant.mockResolvedValue({ content: 'ok', offline: false });
      const panel = await openChat();
      fireEvent.change(composer(), { target: { value: 'my draft' } });
      fireEvent.click(within(panel).getByRole('button', { name: new RegExp(EN.actions.hospital) }));
      await screen.findByText('ok');
      expect(composer().value).toBe('my draft');
    });
  });

  describe('sending messages', () => {
    it('sends on Enter, shows the loading state, then the reply with earlier history', async () => {
      const first = deferred();
      askAssistant.mockReturnValueOnce(first.promise);
      const panel = await openChat();

      fireEvent.change(composer(), { target: { value: 'How often can I donate?' } });
      fireEvent.keyDown(composer(), { key: 'Enter' });

      expect(composer().value).toBe('');
      expect(within(panel).getByText('How often can I donate?')).toBeTruthy();
      expect(within(panel).getByRole('status', { name: EN.typing })).toBeTruthy();
      const send = within(panel).getByRole('button', { name: EN.send });
      expect(send.disabled).toBe(true);
      expect(send.getAttribute('aria-busy')).toBe('true');
      for (const card of within(screen.getByRole('navigation', { name: EN.quickActions })).getAllByRole('button')) expect(card.disabled).toBe(true);

      await act(async () => { first.resolve({ content: 'Every 3 months.', offline: false }); });
      expect(within(panel).getByText('Every 3 months.')).toBeTruthy();
      expect(within(panel).queryByRole('status', { name: EN.typing })).toBeNull();

      askAssistant.mockResolvedValueOnce({ content: 'Second answer', offline: false });
      fireEvent.change(composer(), { target: { value: 'And platelets?' } });
      fireEvent.click(within(panel).getByRole('button', { name: EN.send }));
      await within(panel).findByText('Second answer');
      expect(askAssistant).toHaveBeenLastCalledWith(expect.objectContaining({
        content: 'And platelets?',
        history: [{ role: 'user', content: 'How often can I donate?' }, { role: 'assistant', content: 'Every 3 months.' }],
      }));
    });

    it('Shift+Enter does not send', async () => {
      await openChat();
      fireEvent.change(composer(), { target: { value: 'line one' } });
      fireEvent.keyDown(composer(), { key: 'Enter', shiftKey: true });
      expect(askAssistant).not.toHaveBeenCalled();
      expect(composer().value).toBe('line one');
    });

    it('does not send an empty message', async () => {
      const panel = await openChat();
      fireEvent.change(composer(), { target: { value: '   ' } });
      fireEvent.keyDown(composer(), { key: 'Enter' });
      expect(askAssistant).not.toHaveBeenCalled();
      expect(within(panel).getByRole('button', { name: EN.send }).disabled).toBe(true);
    });

    it('sends only once when Enter and a quick action fire before React re-renders', async () => {
      const pending = deferred();
      askAssistant.mockReturnValue(pending.promise);
      const panel = await openChat();
      fireEvent.change(composer(), { target: { value: 'Hello' } });
      act(() => {
        fireEvent.keyDown(composer(), { key: 'Enter' });
        fireEvent.keyDown(composer(), { key: 'Enter' });
        fireEvent.click(within(panel).getByRole('button', { name: new RegExp(EN.actions.eligibility) }));
      });
      expect(askAssistant).toHaveBeenCalledTimes(1);
      await act(async () => { pending.resolve({ content: 'Hi!', offline: false }); });
    });
  });

  describe('errors', () => {
    it('shows the offline answer with a Retry that asks again and replaces it', async () => {
      askAssistant.mockResolvedValueOnce({ content: 'Guide answer', offline: true, unconfigured: false, error: 'down' });
      const panel = await openChat();
      fireEvent.change(composer(), { target: { value: 'Can I donate with a cold?' } });
      fireEvent.keyDown(composer(), { key: 'Enter' });

      const alert = await within(panel).findByRole('alert');
      expect(alert.textContent).toContain(EN.offlineNote);
      expect(within(panel).getByText(EN.guide)).toBeTruthy();
      expect(within(panel).getByRole('status', { name: '' }).textContent).toContain(EN.offline);

      askAssistant.mockResolvedValueOnce({ content: 'AI answer', offline: false });
      fireEvent.click(within(alert).getByRole('button', { name: new RegExp(EN.retry) }));
      expect(await within(panel).findByText('AI answer')).toBeTruthy();
      expect(within(panel).queryByText('Guide answer')).toBeNull();
      expect(within(panel).getAllByText('Can I donate with a cold?')).toHaveLength(1);
      expect(within(panel).queryByRole('alert')).toBeNull();
      expect(askAssistant).toHaveBeenLastCalledWith(expect.objectContaining({ content: 'Can I donate with a cold?', history: [] }));
    });

    it('treats a server with no AI key as normal guide mode, not an error', async () => {
      askAssistant.mockResolvedValueOnce({ content: 'Guide answer', offline: true, unconfigured: true });
      const panel = await openChat();
      fireEvent.change(composer(), { target: { value: 'hello' } });
      fireEvent.keyDown(composer(), { key: 'Enter' });
      await within(panel).findByText('Guide answer');
      expect(within(panel).queryByRole('alert')).toBeNull();
    });

    it('drops a reply that arrives after the chat was cleared', async () => {
      const late = deferred();
      askAssistant.mockReturnValueOnce(late.promise);
      const panel = await openChat();
      fireEvent.change(composer(), { target: { value: 'Hello' } });
      fireEvent.keyDown(composer(), { key: 'Enter' });
      fireEvent.click(within(panel).getByRole('button', { name: EN.newChat }));
      await act(async () => { late.resolve({ content: 'Too late', offline: false }); });
      expect(within(panel).queryByText('Too late')).toBeNull();
      expect(within(panel).queryByText('Hello')).toBeNull();
    });
  });

  describe('auto-scroll', () => {
    it('offers "New messages" instead of jumping when the user has scrolled up', async () => {
      const reply = deferred();
      askAssistant.mockReturnValueOnce(reply.promise);
      const panel = await openChat();
      fireEvent.change(composer(), { target: { value: 'Hello' } });
      fireEvent.keyDown(composer(), { key: 'Enter' });

      const log = within(panel).getByRole('log');
      Object.defineProperty(log, 'scrollHeight', { configurable: true, value: 2000 });
      Object.defineProperty(log, 'clientHeight', { configurable: true, value: 400 });
      log.scrollTop = 100;
      fireEvent.scroll(log); // reading older messages
      Element.prototype.scrollTo.mockClear();

      await act(async () => { reply.resolve({ content: 'Reply', offline: false }); });
      expect(Element.prototype.scrollTo).not.toHaveBeenCalled();
      const pill = within(panel).getByRole('button', { name: new RegExp(EN.newMessages) });

      fireEvent.click(pill);
      expect(Element.prototype.scrollTo).toHaveBeenCalledWith(expect.objectContaining({ top: 2000 }));
      expect(within(panel).queryByRole('button', { name: new RegExp(EN.newMessages) })).toBeNull();
    });

    it('scrolls to the newest message when the user is already at the bottom', async () => {
      askAssistant.mockResolvedValueOnce({ content: 'Reply', offline: false });
      const panel = await openChat();
      Element.prototype.scrollTo.mockClear();
      fireEvent.change(composer(), { target: { value: 'Hello' } });
      fireEvent.keyDown(composer(), { key: 'Enter' });
      await within(panel).findByText('Reply');
      expect(Element.prototype.scrollTo).toHaveBeenCalled();
    });
  });

  describe('responsive layout', () => {
    it('is a floating panel beside the launcher on desktop', async () => {
      const panel = await openChat();
      expect(panel.getAttribute('data-layout')).toBe('floating');
      expect(panel.getAttribute('aria-modal')).toBe('false');
      expect(screen.getByRole('button', { name: EN.minimize, expanded: true })).toBeTruthy();
    });

    it('is a near-full-screen sheet on phones, hides the launcher and locks page scroll', async () => {
      window.__setViewportWidth(390);
      const panel = await openChat();
      expect(panel.getAttribute('data-layout')).toBe('phone');
      expect(panel.getAttribute('aria-modal')).toBe('true');
      expect(screen.queryByRole('button', { expanded: true })).toBeNull();
      expect(document.body.style.overflow).toBe('hidden');

      fireEvent.click(within(panel).getByRole('button', { name: EN.minimize }));
      expect(screen.queryByRole('dialog')).toBeNull();
      expect(document.body.style.overflow).toBe('');
    });

    it('closes with Escape', async () => {
      const panel = await openChat();
      fireEvent.keyDown(panel, { key: 'Escape' });
      expect(screen.queryByRole('dialog')).toBeNull();
    });
  });

  it('opens when another page asks for it', async () => {
    renderChat();
    act(() => { window.dispatchEvent(new CustomEvent('bloodlife:open-chat')); });
    expect(await screen.findByRole('dialog')).toBeTruthy();
  });
});
