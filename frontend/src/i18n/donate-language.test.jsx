// The reported bug: KH selected in the navbar, but /donate still in English. These tests render
// the real Donate page (and the real donor sign-in) and walk through the reported scenarios.
import { fireEvent, render, screen, within } from '@testing-library/react';
import { ThemeProvider } from '@mui/material/styles';
import { buildTheme } from '@/lib/theme';
import { UserAuthProvider, useUserAuth } from '@/store/UserAuthContext';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import DonatePage from '@/app/(public)/donate/page';
import ThankYouPage from '@/app/(public)/donate/thank-you/page';
import { I18nProvider, useI18n } from './I18nProvider';
import { LANG_KEY } from './config';
import MESSAGES from './messages';

const push = jest.fn();
jest.mock('next/navigation', () => ({
  useRouter: () => ({ push, replace: jest.fn() }),
  usePathname: () => '/donate',
}));
// next/image needs the Next.js runtime; a plain <img> is enough here.
// eslint-disable-next-line @next/next/no-img-element
jest.mock('next/image', () => function Img({ src }) { return <img alt="" src={typeof src === 'string' ? src : src?.src || undefined} />; });

const flatten = (node) => Object.values(node).flatMap((v) => (v && typeof v === 'object' ? flatten(v) : [v]));
// English phrases from the Donate texts and the shared frame; none may remain on screen in KH/VN.
const ENGLISH = ['donate', 'nav', 'layout', 'common'].flatMap((ns) => flatten(MESSAGES[ns].en))
  .map((text) => text.replace(/\{\w+\}/g, '').trim())
  .filter((text) => text.length >= 6 && /[a-z]{3}/.test(text) && !/^BloodLife/.test(text) && !/^e\.g\./.test(text));

function LangProbe() {
  const { lang } = useI18n();
  const { isAuth, login, logout } = useUserAuth();
  return (
    <div data-testid="probe" data-lang={lang} data-auth={String(isAuth)}>
      <button type="button" onClick={() => login('token', { id: '1', fullName: 'Dara', email: 'dara@example.com' })}>test-login</button>
      <button type="button" onClick={logout}>test-logout</button>
    </div>
  );
}

const site = (page, initialLang) => (
  <ThemeProvider theme={buildTheme('light')}>
    <I18nProvider initialLang={initialLang}>
      <UserAuthProvider>
        <LangProbe />
        <div data-testid="page"><Header />{page}<Footer /></div>
      </UserAuthProvider>
    </I18nProvider>
  </ThemeProvider>
);

const pick = (name) => {
  fireEvent.click(screen.getAllByRole('button', { name: /^(Language|ភាសា|Ngôn ngữ)/ })[0]);
  fireEvent.click(within(screen.getByRole('menu')).getByRole('menuitem', { name: new RegExp(name) }));
};
const lang = () => screen.getByTestId('probe').dataset.lang;
const leftoverEnglish = () => {
  const text = screen.getByTestId('page').textContent;
  return ENGLISH.filter((en) => text.includes(en));
};

beforeEach(() => {
  localStorage.clear();
  sessionStorage.clear();
  document.cookie = `${LANG_KEY}=; path=/; max-age=0`;
  window.__setViewportWidth(1280);
  push.mockClear();
});

describe('/donate follows the selected language', () => {
  it('1. with no saved language it opens in English', () => {
    render(site(<DonatePage />));
    expect(lang()).toBe('en');
    expect(screen.getByText('Your Blood Type')).toBeTruthy();
    expect(screen.getByText('What Happens Next?')).toBeTruthy();
  });

  it('2. selecting KH turns every label on /donate into Khmer', () => {
    render(site(<DonatePage />, 'en'));
    pick('ភាសាខ្មែរ');
    expect(lang()).toBe('km');
    for (const text of ['ក្លាយជាអ្នកបរិច្ចាគឈាម', 'ក្រុមឈាមរបស់អ្នក', 'ព័ត៌មានរបស់អ្នក', 'តើនឹងមានអ្វីបន្ទាប់?', 'ចុះឈ្មោះតាមអនឡាញ', 'សុវត្ថិភាព និងការពារ', 'ដំណើរការរហ័ស']) {
      expect(screen.getAllByText(text).length).toBeGreaterThan(0);
    }
    expect(screen.getByLabelText(/ឈ្មោះពេញ/)).toBeTruthy(); // form labels
    expect(leftoverEnglish()).toEqual([]);
  });

  it('shows validation messages in the selected language', () => {
    render(site(<DonatePage />, 'km'));
    fireEvent.click(screen.getByRole('button', { name: 'ចុះឈ្មោះជាអ្នកបរិច្ចាគ' }));
    expect(screen.getByText('សូមជ្រើសរើសក្រុមឈាមរបស់អ្នក។')).toBeTruthy();
  });

  it('3–5. Khmer stays selected on other pages and after a refresh', () => {
    const first = render(site(<DonatePage />, 'en'));
    pick('ភាសាខ្មែរ');
    first.unmount();
    // Opening another page (or refreshing) starts a new render; the server passes the cookie's
    // language, and the saved choice is restored.
    render(site(<ThankYouPage />, document.cookie.match(/bloodlife-lang=(\w+)/)?.[1]));
    expect(lang()).toBe('km');
    expect(screen.getByText('សូមអបអរសាទរ!')).toBeTruthy();
    expect(leftoverEnglish()).toEqual([]);
  });

  it('6. selecting VN turns /donate into Vietnamese', () => {
    render(site(<DonatePage />, 'km'));
    pick('Tiếng Việt');
    expect(lang()).toBe('vi');
    expect(screen.getByText('Nhóm máu của bạn')).toBeTruthy();
    expect(screen.getByText('Tiếp theo sẽ thế nào?')).toBeTruthy();
    expect(leftoverEnglish()).toEqual([]);
  });

  it('7. signing in and out keeps the selected language', () => {
    render(site(<DonatePage />, 'en'));
    pick('Tiếng Việt');
    fireEvent.click(screen.getByText('test-login'));
    expect(screen.getByTestId('probe').dataset.auth).toBe('true');
    expect(lang()).toBe('vi');
    fireEvent.click(screen.getByText('test-logout'));
    expect(screen.getByTestId('probe').dataset.auth).toBe('false');
    expect(lang()).toBe('vi');
    expect(localStorage.getItem(LANG_KEY)).toBe('vi');
  });

  it('8. switching back to English restores the English page', () => {
    render(site(<DonatePage />, 'vi'));
    pick('English');
    expect(lang()).toBe('en');
    expect(screen.getByText('Your Blood Type')).toBeTruthy();
    expect(localStorage.getItem(LANG_KEY)).toBe('en');
  });
});
