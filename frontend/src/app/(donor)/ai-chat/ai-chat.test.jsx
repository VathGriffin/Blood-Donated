import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { ThemeProvider } from '@mui/material/styles';
import { buildTheme } from '@/lib/theme';
import { I18nProvider } from '@/i18n/I18nProvider';
import { translate } from '@/i18n/translate';

jest.mock('@/store/UserAuthContext', () => ({
  useUserAuth: () => ({ token: 'tok', user: { fullName: 'Van Nam', email: 'nam@example.com', photo: null } }),
}));
jest.mock('@/lib/chat-client', () => ({ askAssistant: jest.fn() }));
jest.mock('axios', () => ({ get: jest.fn() }));

const { askAssistant } = jest.requireMock('@/lib/chat-client');
const axios = jest.requireMock('axios');
import Page from './page';

const en = (key, vars) => translate('en', key, vars);
const DAY = 86400000;

function renderPage(lang = 'en') {
  localStorage.clear();
  return render(<ThemeProvider theme={buildTheme('light')}><I18nProvider initialLang={lang}><Page /></I18nProvider></ThemeProvider>);
}
const input = () => screen.getByRole('textbox', { name: en('aiChat.inputLabel') });
const log = () => within(screen.getByRole('log'));

beforeEach(() => {
  askAssistant.mockReset();
  axios.get.mockReset();
  Element.prototype.scrollTo = jest.fn();
});

test('greets the donor by first name and shows the quick questions and about panel', () => {
  renderPage();
  expect(screen.getByText(/Hello, Van!/)).toBeTruthy();
  expect(screen.getByRole('button', { name: en('aiChat.quick.book') })).toBeTruthy();
  expect(screen.getByRole('heading', { name: en('aiChat.aboutTitle') })).toBeTruthy();
});

test('Enter sends the question to the assistant with a timestamp; Shift+Enter does not', async () => {
  askAssistant.mockResolvedValue({ content: 'Every 56 days.', offline: false });
  renderPage();
  fireEvent.change(input(), { target: { value: 'How often can I donate?' } });
  fireEvent.keyDown(input(), { key: 'Enter', shiftKey: true });
  expect(askAssistant).not.toHaveBeenCalled();
  await act(async () => { fireEvent.keyDown(input(), { key: 'Enter' }); });
  expect(askAssistant).toHaveBeenCalledWith(expect.objectContaining({ content: 'How often can I donate?', token: 'tok', lang: 'en', history: [] }));
  expect(await screen.findByText('Every 56 days.')).toBeTruthy();
  expect(log().getByText('How often can I donate?')).toBeTruthy();
  expect(document.querySelectorAll('time').length).toBeGreaterThanOrEqual(3);
});

test('a second send while a reply is pending is ignored', async () => {
  let resolve;
  askAssistant.mockImplementation(() => new Promise((r) => { resolve = r; }));
  renderPage();
  fireEvent.change(input(), { target: { value: 'First' } });
  await act(async () => { fireEvent.keyDown(input(), { key: 'Enter' }); });
  fireEvent.change(input(), { target: { value: 'Second' } });
  await act(async () => { fireEvent.keyDown(input(), { key: 'Enter' }); });
  fireEvent.click(screen.getByRole('button', { name: en('aiChat.quick.often') }));
  expect(askAssistant).toHaveBeenCalledTimes(1);
  await act(async () => { resolve({ content: 'ok', offline: false }); });
  expect(log().queryByText('Second')).toBeNull();
  expect(input().value).toBe('Second'); // kept, so the donor can send it next
});

test('an unreachable AI shows the guide answer with a Retry that asks again', async () => {
  askAssistant
    .mockResolvedValueOnce({ content: 'Guide answer', offline: true, error: 'down' })
    .mockResolvedValueOnce({ content: 'AI answer', offline: false });
  renderPage();
  await act(async () => { fireEvent.click(screen.getByRole('button', { name: en('aiChat.quick.often') })); });
  expect(await screen.findByText('Guide answer')).toBeTruthy();
  expect(screen.getByText(en('aiChat.offlineNote'))).toBeTruthy();
  await act(async () => { fireEvent.click(screen.getByRole('button', { name: en('aiChat.retry') })); });
  expect(await screen.findByText('AI answer')).toBeTruthy();
  expect(screen.queryByText('Guide answer')).toBeNull();
  expect(askAssistant).toHaveBeenLastCalledWith(expect.objectContaining({ content: en('aiChat.quick.often'), history: [] }));
});

test('eligibility comes from the donor record and the 56-day rule, never the AI', async () => {
  const last = new Date(Date.now() - 10 * DAY).toISOString();
  axios.get.mockResolvedValue({ data: { found: true, lastDonation: last } });
  renderPage();
  await act(async () => { fireEvent.click(screen.getByRole('button', { name: en('aiChat.quick.eligible') })); });
  expect(axios.get).toHaveBeenCalledWith(expect.stringMatching(/\/api\/donors\/lookup$/),
    expect.objectContaining({ params: { email: 'nam@example.com' }, headers: { Authorization: 'Bearer tok' } }));
  expect(askAssistant).not.toHaveBeenCalled();
  expect(await screen.findByText(en('aiChat.eligibility.recordTitle'))).toBeTruthy();
  expect(screen.getByText(/You can donate again from/)).toBeTruthy();
  expect(screen.queryByRole('link', { name: en('aiChat.eligibility.book') })).toBeNull();
});

test('without a donor record it says so instead of guessing', async () => {
  axios.get.mockResolvedValue({ data: { found: false } });
  renderPage();
  await act(async () => { fireEvent.click(screen.getByRole('button', { name: en('aiChat.actions.eligibility') })); });
  await waitFor(() => expect(screen.getByRole('link', { name: en('aiChat.eligibility.register') })).toBeTruthy());
  expect(screen.queryByText(en('aiChat.eligibility.recordTitle'))).toBeNull();
});

test.each(['km', 'vi'])('renders in %s', (lang) => {
  renderPage(lang);
  expect(screen.getByRole('heading', { name: translate(lang, 'aiChat.title') })).toBeTruthy();
  expect(screen.getByRole('button', { name: translate(lang, 'aiChat.quick.eligible') })).toBeTruthy();
});
