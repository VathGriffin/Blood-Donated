import DashboardIcon from '@mui/icons-material/Dashboard';
import PeopleAltIcon from '@mui/icons-material/PeopleAlt';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import WaterDropIcon from '@mui/icons-material/WaterDrop';
import DescriptionIcon from '@mui/icons-material/Description';
import HomeIcon from '@mui/icons-material/Home';
import DomainIcon from '@mui/icons-material/Domain';
import ChatIcon from '@mui/icons-material/Chat';
import AssessmentIcon from '@mui/icons-material/Assessment';
import SettingsIcon from '@mui/icons-material/Settings';
import QrCodeScannerIcon from '@mui/icons-material/QrCodeScanner';
import PersonIcon from '@mui/icons-material/Person';
import QrCode2Icon from '@mui/icons-material/QrCode2';
import EventAvailableIcon from '@mui/icons-material/EventAvailable';
import PlaceIcon from '@mui/icons-material/Place';
import SmartToyIcon from '@mui/icons-material/SmartToy';

/**
 * Dashboard roles. These are the front-end names; the API's role strings are
 * `admin`, `hospital_staff` and `donor` (see fromApiRole).
 *
 * NAVIGATION IS NOT AUTHORISATION. Hiding a link only keeps the menu tidy. Access is
 * enforced twice for real: DashboardShell verifies the role with the server before
 * rendering anything, and every API route re-checks the JWT's role (requireRole).
 */
export const ROLES = { ADMIN: 'ADMIN', HOSPITAL_STAFF: 'HOSPITAL_STAFF', DONOR: 'DONOR' };

const API_ROLE = { admin: ROLES.ADMIN, hospital_staff: ROLES.HOSPITAL_STAFF, donor: ROLES.DONOR };
export const fromApiRole = (apiRole) => API_ROLE[apiRole] || null;

// The menu is a flat list per role (no section headings), matching the design.
// Only routes that exist are listed. `section` titles are optional and unused for now.
export const ROLE_CONFIG = {
  [ROLES.ADMIN]: {
    label: 'Admin Panel',
    backToWebsite: true,
    homePath: '/dashboard/admin',
    loginPath: '/admin/login',
    signOutPath: '/admin/login',
    sections: [
      {
        items: [
          { label: 'Dashboard',       href: '/dashboard/admin',              icon: DashboardIcon, exact: true },
          { label: 'Donors',          href: '/dashboard/admin/donors',       icon: PeopleAltIcon },
          { label: 'Hospitals',       href: '/dashboard/admin/hospitals',    icon: DomainIcon },
          { label: 'Blood Inventory', href: '/dashboard/admin/inventory',    icon: WaterDropIcon },
          { label: 'Blood Requests',  href: '/dashboard/admin/requests',     icon: DescriptionIcon },
          { label: 'Appointments',    href: '/dashboard/admin/appointments', icon: CalendarMonthIcon },
          { label: 'Analytics',       href: '/dashboard/admin/analytics',    icon: AssessmentIcon },
          { label: 'Messages',        href: '/dashboard/admin/contacts',     icon: ChatIcon },
          { label: 'Settings',        href: '/dashboard/admin/settings',     icon: SettingsIcon },
        ],
      },
    ],
    profileLinks: [{ label: 'Settings', href: '/dashboard/admin/settings', icon: SettingsIcon }],
  },

  [ROLES.HOSPITAL_STAFF]: {
    label: 'Hospital Panel',
    backToWebsite: true,
    homePath: '/dashboard/hospital',
    loginPath: '/hospital/login',
    signOutPath: '/hospital/login',
    sections: [
      {
        items: [
          { label: 'Dashboard',       href: '/dashboard/hospital',              icon: DashboardIcon, exact: true },
          { label: 'Blood Inventory', href: '/dashboard/hospital/inventory',    icon: WaterDropIcon },
          { label: 'Blood Requests',  href: '/dashboard/hospital/requests',     icon: DescriptionIcon },
          { label: 'Appointments',    href: '/dashboard/hospital/appointments', icon: CalendarMonthIcon },
          { label: 'Scan QR',         href: '/dashboard/hospital/scan',         icon: QrCodeScannerIcon },
        ],
      },
    ],
    profileLinks: [],
  },

  [ROLES.DONOR]: {
    label: 'Donor Portal',
    homePath: '/profile',
    loginPath: '/login',
    signOutPath: '/',
    sections: [
      {
        // Home, Appointments, Make a Request, Find Hospitals and Chat with AI are public
        // pages — they open outside the dashboard chrome.
        items: [
          { label: 'Home',             href: '/',             icon: HomeIcon, exact: true },
          { label: 'My Profile',       href: '/profile',      icon: PersonIcon },
          { label: 'My QR Card',       href: '/qr-card',      icon: QrCode2Icon },
          { label: 'Appointments',     href: '/appointments', icon: EventAvailableIcon },
          { label: 'Make a Request',   href: '/requests',     icon: DescriptionIcon },
          { label: 'Find Hospitals',   href: '/map',          icon: PlaceIcon },
          { label: 'Chat with AI',     href: '/assistant',    icon: SmartToyIcon },
          { label: 'Messages',         href: '/notification', icon: ChatIcon },
        ],
      },
    ],
    profileLinks: [
      { label: 'My Profile', href: '/profile', icon: PersonIcon },
      { label: 'My QR Card', href: '/qr-card', icon: QrCode2Icon },
    ],
  },
};

export const isItemActive = (item, pathname) =>
  item.exact ? pathname === item.href : pathname === item.href || pathname.startsWith(`${item.href}/`);

/** The nav item (and its section) matching the current URL — drives the top-bar title. */
export function findActive(role, pathname) {
  const cfg = ROLE_CONFIG[role];
  if (!cfg) return null;
  let best = null;
  for (const section of cfg.sections) {
    for (const item of section.items) {
      if (isItemActive(item, pathname) && (!best || item.href.length > best.item.href.length)) {
        best = { item, section };
      }
    }
  }
  return best;
}
