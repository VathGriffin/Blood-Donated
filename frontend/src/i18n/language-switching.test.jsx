import { fireEvent, render, screen, within } from '@testing-library/react';
import { ThemeProvider } from '@mui/material/styles';
import { buildTheme } from '@/lib/theme';
import { formatDate } from '@/lib/format';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import EligibilitySection from '@/app/(public)/_components/EligibilitySection';
import HelpSection from '@/app/(public)/_components/HelpSection';
import { I18nProvider, useI18n } from './I18nProvider';
import { LANG_KEY } from './config';
import MESSAGES from './messages';

jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: jest.fn(), replace: jest.fn() }),
  usePathname: () => '/',
}));
jest.mock('@/store/UserAuthContext', () => ({
  useUserAuth: () => ({ isAuth: false, user: null, token: null, logout: jest.fn() }),
}));

// Every English text of the namespaces the rendered parts use, to catch any left on screen.
const flatten = (node) => Object.values(node).flatMap((v) => (v && typeof v === 'object' ? flatten(v) : [v]));
const englishTexts = (...namespaces) => namespaces
  .flatMap((ns) => flatten(MESSAGES[ns].en))
  .map((text) => text.replace(/\{\w+\}/g, '').trim())
  // Long enough to be a real phrase; codes and product names alone are allowed in every language.
  .filter((text) => text.length >= 6 && /[a-z]{3}/.test(text) && !/^BloodLife/.test(text));

function Page() {
  const { lang } = useI18n();
  return (
    <div data-testid="page" data-lang={lang}>
      <Header />
      <main><EligibilitySection /><HelpSection /></main>
      <Footer />
    </div>
  );
}

const renderSite = (initialLang) => render(
  <ThemeProvider theme={buildTheme('light')}>
    <I18nProvider initialLang={initialLang}><Page /></I18nProvider>
  </ThemeProvider>,
);

// Picks a language from the navbar picker, as a visitor would.
const pick = (name) => {
  fireEvent.click(screen.getAllByRole('button', { name: /^(Language|ភាសា|Ngôn ngữ)/ })[0]);
  fireEvent.click(within(screen.getByRole('menu')).getByRole('menuitem', { name: new RegExp(name) }));
};

const leftoverEnglish = () => {
  const text = screen.getByTestId('page').textContent;
  return englishTexts('nav', 'layout', 'home').filter((en) => text.includes(en));
};

beforeEach(() => {
  localStorage.clear();
  document.cookie = `${LANG_KEY}=; path=/; max-age=0`;
  window.__setViewportWidth(1280);
});

describe('language switching', () => {
  it('shows English on a first visit', () => {
    renderSite(undefined);
    expect(screen.getByTestId('page').dataset.lang).toBe('en');
    expect(screen.getByRole('link', { name: 'Donors' })).toBeTruthy();
    expect(screen.getByText('Can I donate blood?')).toBeTruthy();
  });

  it('switches EN → KH → VN → EN everywhere at once, with no English left behind', () => {
    renderSite('en');

    pick('ភាសាខ្មែរ');
    expect(screen.getByTestId('page').dataset.lang).toBe('km');
    expect(document.documentElement.lang).toBe('km');
    expect(screen.getByRole('link', { name: 'អ្នកបរិច្ចាគ' })).toBeTruthy(); // navbar
    expect(screen.getByText('តើខ្ញុំអាចបរិច្ចាគឈាមបានទេ?')).toBeTruthy(); // page body
    expect(screen.getByText('តំណភ្ជាប់រហ័ស')).toBeTruthy(); // footer
    expect(leftoverEnglish()).toEqual([]);

    pick('Tiếng Việt');
    expect(screen.getByTestId('page').dataset.lang).toBe('vi');
    expect(screen.getByRole('link', { name: 'Người hiến máu' })).toBeTruthy();
    expect(screen.getByText('Tôi có thể hiến máu không?')).toBeTruthy();
    expect(screen.getByText('Liên kết nhanh')).toBeTruthy();
    expect(leftoverEnglish()).toEqual([]);

    pick('English');
    expect(screen.getByTestId('page').dataset.lang).toBe('en');
    expect(screen.getByRole('link', { name: 'Donors' })).toBeTruthy();
    expect(screen.getByText('Quick Links')).toBeTruthy();
  });

  it('remembers the choice in localStorage and the cookie the server reads', () => {
    renderSite('en');
    pick('ភាសាខ្មែរ');
    expect(localStorage.getItem(LANG_KEY)).toBe('km');
    expect(document.cookie).toContain(`${LANG_KEY}=km`);
  });

  it('restores the saved language on the next visit, after refresh and route changes', () => {
    // The server reads the cookie and renders in that language from the first paint.
    const first = renderSite('vi');
    expect(screen.getByTestId('page').dataset.lang).toBe('vi');
    first.unmount();
    // A cleared cookie still restores the choice from localStorage.
    localStorage.setItem(LANG_KEY, 'km');
    renderSite(undefined);
    expect(screen.getByTestId('page').dataset.lang).toBe('km');
  });

  it('falls back to English for an invalid saved language', () => {
    localStorage.setItem(LANG_KEY, 'fr');
    renderSite('xx');
    expect(screen.getByTestId('page').dataset.lang).toBe('en');
    expect(localStorage.getItem(LANG_KEY)).toBe('en');
  });

  it('formats dates in the selected language', () => {
    renderSite('en');
    const day = new Date(2026, 8, 25);
    expect(formatDate(day)).toBe('Sep 25, 2026');
    pick('Tiếng Việt');
    expect(formatDate(day)).toMatch(/2026/);
    expect(formatDate(day)).not.toBe('Sep 25, 2026');
  });
});
