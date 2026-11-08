import DashboardIcon from '@mui/icons-material/Dashboard';
import PeopleAltIcon from '@mui/icons-material/PeopleAlt';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import WaterDropIcon from '@mui/icons-material/WaterDrop';
import DescriptionIcon from '@mui/icons-material/Description';
import DomainIcon from '@mui/icons-material/Domain';
import ChatIcon from '@mui/icons-material/Chat';
import AssessmentIcon from '@mui/icons-material/Assessment';
import SettingsIcon from '@mui/icons-material/Settings';
import QrCodeScannerIcon from '@mui/icons-material/QrCodeScanner';
import PersonIcon from '@mui/icons-material/Person';
import QrCode2Icon from '@mui/icons-material/QrCode2';
import EventAvailableIcon from '@mui/icons-material/EventAvailable';
import NotificationsIcon from '@mui/icons-material/Notifications';
import SmartToyOutlinedIcon from '@mui/icons-material/SmartToyOutlined';
import WaterDropOutlinedIcon from '@mui/icons-material/WaterDropOutlined';
import SettingsOutlinedIcon from '@mui/icons-material/SettingsOutlined';

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
// `labelKey` is a translation key (i18n/messages/nav.js); show it with t(item.labelKey).
export const ROLE_CONFIG = {
  [ROLES.ADMIN]: {
    labelKey: 'nav.adminPanel',
    backToWebsite: true,
    homePath: '/dashboard/admin',
    loginPath: '/admin/login',
    signOutPath: '/admin/login',
    sections: [
      {
        items: [
          { labelKey: 'nav.dashboard',       href: '/dashboard/admin',              icon: DashboardIcon, exact: true },
          { labelKey: 'nav.donors',          href: '/dashboard/admin/donors',       icon: PeopleAltIcon },
          { labelKey: 'nav.hospitals',       href: '/dashboard/admin/hospitals',    icon: DomainIcon },
          { labelKey: 'nav.bloodInventory', href: '/dashboard/admin/inventory',    icon: WaterDropIcon },
          { labelKey: 'nav.bloodRequests',  href: '/dashboard/admin/requests',     icon: DescriptionIcon },
          { labelKey: 'nav.appointments',    href: '/dashboard/admin/appointments', icon: CalendarMonthIcon },
          { labelKey: 'nav.analytics',       href: '/dashboard/admin/analytics',    icon: AssessmentIcon },
          { labelKey: 'nav.messages',        href: '/dashboard/admin/contacts',     icon: ChatIcon },
          { labelKey: 'nav.settings',        href: '/dashboard/admin/settings',     icon: SettingsIcon },
        ],
      },
    ],
    profileLinks: [{ labelKey: 'nav.settings', href: '/dashboard/admin/settings', icon: SettingsIcon }],
  },

  [ROLES.HOSPITAL_STAFF]: {
    labelKey: 'nav.hospitalPanel',
    backToWebsite: true,
    homePath: '/dashboard/hospital',
    loginPath: '/hospital/login',
    signOutPath: '/hospital/login',
    sections: [
      {
        items: [
          { labelKey: 'nav.dashboard',       href: '/dashboard/hospital',              icon: DashboardIcon, exact: true },
          { labelKey: 'nav.bloodInventory', href: '/dashboard/hospital/inventory',    icon: WaterDropIcon },
          { labelKey: 'nav.bloodRequests',  href: '/dashboard/hospital/requests',     icon: DescriptionIcon },
          { labelKey: 'nav.appointments',    href: '/dashboard/hospital/appointments', icon: CalendarMonthIcon },
          { labelKey: 'nav.scanQr',         href: '/dashboard/hospital/scan',         icon: QrCodeScannerIcon },
          { labelKey: 'nav.myProfile',      href: '/dashboard/hospital/profile',      icon: PersonIcon },
        ],
      },
    ],
    profileLinks: [{ labelKey: 'nav.myProfile', href: '/dashboard/hospital/profile', icon: PersonIcon }],
  },

  [ROLES.DONOR]: {
    labelKey: 'nav.donorPortal',
    backToWebsite: true,
    homePath: '/profile',
    loginPath: '/login',
    signOutPath: '/',
    sections: [
      {
        // My Profile hosts Availability Status and Request History as sections/tabs of
        // that one page, rather than separate rows, so the sidebar never highlights more
        // than one row for the same page. Blood Requests covers the donor's list (/my-requests)
        // and the Request Blood form (/requests); "Book Appointment" leads to the public booking page.
        items: [
          { labelKey: 'nav.myProfile',       href: '/profile',      icon: PersonIcon, exact: true },
          { labelKey: 'nav.myQrCard',       href: '/qr-card',      icon: QrCode2Icon },
          { labelKey: 'nav.myAppointments',  href: '/my-appointments', icon: EventAvailableIcon },
          { labelKey: 'nav.bloodRequests',   href: '/my-requests',  icon: DescriptionIcon, alsoActive: ['/requests'] },
          { labelKey: 'nav.donorDirectory',  href: '/donor-directory', icon: PeopleAltIcon },
          { labelKey: 'nav.notifications',    href: '/notification', icon: NotificationsIcon, badge: true },
          { labelKey: 'nav.chatWithAi',     href: '/ai-chat',      icon: SmartToyOutlinedIcon },
        ],
      },
    ],
    // The account menu (top bar and public header). `divider` draws a line above the item.
    // Donation History is a tab of My Profile; Settings opens its Edit Profile dialog.
    profileLinks: [
      { labelKey: 'nav.myProfile',       href: '/profile',             icon: PersonIcon },
      { labelKey: 'nav.myQrCard',       href: '/qr-card',             icon: QrCode2Icon },
      { labelKey: 'nav.myAppointments',  href: '/my-appointments',     icon: CalendarMonthIcon },
      { labelKey: 'nav.donationHistory', href: '/profile?tab=history', icon: WaterDropOutlinedIcon },
      { labelKey: 'nav.settings',         href: '/profile?edit=1',      icon: SettingsOutlinedIcon, divider: true },
    ],
  },
};

const pathMatches = (href, pathname) => pathname === href || pathname.startsWith(`${href}/`);

// `alsoActive` lists other paths that belong to the same menu row (e.g. the Request Blood
// form at /requests is part of "Blood Requests").
export const isItemActive = (item, pathname) =>
  item.exact
    ? pathname === item.href
    : pathMatches(item.href, pathname) || (item.alsoActive || []).some((href) => pathMatches(href, pathname));

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
