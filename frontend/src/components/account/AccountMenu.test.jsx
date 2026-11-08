import { useState } from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { ThemeProvider } from '@mui/material/styles';
import { buildTheme } from '@/lib/theme';
import { I18nProvider } from '@/i18n/I18nProvider';
import { ROLE_CONFIG, ROLES } from '@/lib/navigation';
import AccountMenu, { activeHref } from './AccountMenu';

const EN = {
  profile: 'My Profile', qrCard: 'My QR Card', appointments: 'My Appointments',
  history: 'Donation History', settings: 'Settings', logout: 'Log Out', donor: 'Donor',
};
const items = ROLE_CONFIG[ROLES.DONOR].profileLinks;
const account = { name: 'Dara Sok', email: 'dara@example.com', photo: null, role: 'donor' };

// The trigger and menu as the header wires them.
function Harness({ onLogout = () => {}, mode = 'light' }) {
  const [anchor, setAnchor] = useState(null);
  return (
    <ThemeProvider theme={buildTheme(mode)}>
      <I18nProvider initialLang="en">
      <button type="button" id="trigger" aria-haspopup="menu" aria-expanded={Boolean(anchor)}
        aria-controls={anchor ? 'menu' : undefined} onClick={(e) => setAnchor(e.currentTarget)}>
        Account
      </button>
      <AccountMenu id="menu" labelledBy="trigger" anchorEl={anchor} onClose={() => setAnchor(null)}
        account={account} items={items} onLogout={onLogout} />
      </I18nProvider>
    </ThemeProvider>
  );
}

const open = async () => {
  fireEvent.click(screen.getByRole('button', { name: 'Account' }));
  return screen.findByRole('menu');
};

beforeEach(() => {
  localStorage.clear();
  document.cookie = 'bloodlife-lang=; path=/; max-age=0';
  window.history.replaceState(null, '', '/');
});

describe('activeHref', () => {
  it('picks the most specific matching link, so only one row is active', () => {
    expect(activeHref(items, '/profile', '')).toBe('/profile');
    expect(activeHref(items, '/profile', '?tab=history')).toBe('/profile?tab=history');
    expect(activeHref(items, '/profile', '?tab=appointments')).toBe('/profile');
    expect(activeHref(items, '/qr-card', '')).toBe('/qr-card');
    expect(activeHref(items, '/donors', '')).toBeNull();
  });
});

describe('AccountMenu', () => {
  it('shows the signed-in donor and every account link, labelled by its trigger', async () => {
    render(<Harness />);
    const menu = await open();
    expect(menu.getAttribute('aria-labelledby')).toBe('trigger');
    // The page behind an open menu is hidden from screen readers, so find the trigger by id.
    expect(document.getElementById('trigger').getAttribute('aria-expanded')).toBe('true');
    expect(screen.getByText('Dara Sok')).toBeTruthy();
    expect(screen.getByText('dara@example.com')).toBeTruthy();
    expect(screen.getByText(EN.donor)).toBeTruthy();
    for (const label of [EN.profile, EN.qrCard, EN.appointments, EN.history, EN.settings]) {
      expect(screen.getByRole('menuitem', { name: label })).toBeTruthy();
    }
    expect(screen.getByRole('menuitem', { name: EN.history }).getAttribute('href')).toBe('/profile?tab=history');
    expect(screen.getByRole('menuitem', { name: EN.logout })).toBeTruthy();
  });

  it('focuses the first link and moves with the arrow keys', async () => {
    render(<Harness />);
    await open();
    await waitFor(() => expect(document.activeElement).toBe(screen.getByRole('menuitem', { name: EN.profile })));
    fireEvent.keyDown(screen.getByRole('menu'), { key: 'ArrowDown' });
    expect(document.activeElement).toBe(screen.getByRole('menuitem', { name: EN.qrCard }));
  });

  it('marks the current page as active', async () => {
    window.history.replaceState(null, '', '/profile?tab=history');
    render(<Harness />);
    await open();
    await waitFor(() => expect(screen.getByRole('menuitem', { name: EN.history }).getAttribute('aria-current')).toBe('page'));
    expect(screen.getByRole('menuitem', { name: EN.profile }).hasAttribute('aria-current')).toBe(false);
  });

  it('closes on Escape and on Tab', async () => {
    render(<Harness />);
    let menu = await open();
    fireEvent.keyDown(menu, { key: 'Escape' });
    await waitFor(() => expect(screen.queryByRole('menu')).toBeNull());
    menu = await open();
    fireEvent.keyDown(menu, { key: 'Tab' });
    await waitFor(() => expect(screen.queryByRole('menu')).toBeNull());
  });

  it('closes on a click outside the panel', async () => {
    render(<Harness />);
    await open();
    fireEvent.click(document.querySelector('.MuiBackdrop-root'));
    await waitFor(() => expect(screen.queryByRole('menu')).toBeNull());
  });

  it('logs out through the caller and closes', async () => {
    const onLogout = jest.fn();
    render(<Harness onLogout={onLogout} />);
    await open();
    fireEvent.click(screen.getByRole('menuitem', { name: EN.logout }));
    expect(onLogout).toHaveBeenCalledTimes(1);
    await waitFor(() => expect(screen.queryByRole('menu')).toBeNull());
  });

  it('has no language switcher', async () => {
    render(<Harness />);
    await open();
    expect(screen.queryByRole('menuitem', { name: /language/i })).toBeNull();
    expect(screen.getAllByRole('menuitem')).toHaveLength(6); // 5 links + Log Out
  });

  it('renders in dark mode too', async () => {
    render(<Harness mode="dark" />);
    expect(await open()).toBeTruthy();
  });
});
