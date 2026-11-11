/**
 * BloodLife design tokens — the single source of truth for colour, type, radius,
 * shadow and layout values. Nothing here imports React or MUI, so it can be used
 * from the theme, from components, or from plain scripts.
 *
 * Usage:
 *   - In components, prefer theme values (`color="primary"`, `bgcolor="background.paper"`,
 *     `theme.custom.radius.card`) so light/dark switching is automatic.
 *   - Import from this file only for static values that don't depend on the mode.
 */

// ── Colour ───────────────────────────────────────────────────────────────────
// One brand for the whole platform: medical red for actions, active navigation and
// blood-related elements, on a deep navy structure (sidebars, banners, headings).
export const brand = {
  primary:      '#C91D32', // medical red
  primaryDark:  '#A91529', // hover / pressed
  primaryLight: '#E63946', // red accent (gradients, dark-mode primary)
  primarySoft:  '#FFF1F2', // soft pink: tinted backgrounds, selected rows, soft badges
  primaryBorder:'#F5C6CC',
  // dark mode: kept saturated so red doesn't turn pink on navy
  primaryLighter: '#EF5361',
  toneFgDark:     '#F28B95',
};

export const navy = {
  deep: '#142D50',
  dark: '#102541', // primary navy
  mid:  '#173B63', // secondary navy
  light:'#245481',
};

// Text on the light pink hero (homepage benefits row). Both keep AA contrast on #FFF1F2 and on
// the darker pink waves: heading ≈ 13:1, body ≈ 5:1.
export const heroText = {
  heading: '#142B4D', // dark navy
  body:    '#52647D', // dark slate
};

// Brand gradients, used by buttons, banners and sidebars.
export const gradients = {
  primary: `linear-gradient(135deg, ${brand.primaryLight} 0%, ${brand.primary} 100%)`,
  primaryHover: `linear-gradient(135deg, ${brand.primary} 0%, ${brand.primaryDark} 100%)`,
  sidebar: `linear-gradient(160deg, ${navy.dark} 0%, ${navy.mid} 100%)`,
  banner: `linear-gradient(120deg, ${navy.dark} 0%, ${navy.mid} 55%, ${navy.light} 100%)`,
  hero: 'linear-gradient(135deg, #FFFFFF 0%, #FFF1F2 100%)',
};

// Cool neutral ramp (light-mode surfaces and text).
export const neutral = {
  50:  '#F9FAFB',
  100: '#F3F4F6',
  200: '#E5E7EB',
  300: '#D1D5DB',
  400: '#9CA3AF',
  500: '#6B7280',
  600: '#4B5563',
  700: '#374151',
  800: '#1F2937',
  900: '#111827',
};

// Semantic colours. `soft`/`softText` drive badges and alerts: a light tint with a
// dark-enough text colour to keep AA contrast (white-on-#F59E0B would not).
export const semantic = {
  success: { main: '#16A34A', light: '#22C55E', dark: '#15803D', contrastText: '#FFFFFF', soft: '#DCFCE7', softText: '#166534' },
  warning: { main: '#F59E0B', light: '#FBBF24', dark: '#B45309', contrastText: '#1F2937', soft: '#FEF3C7', softText: '#92400E' },
  error:   { main: '#DC2626', light: '#EF4444', dark: '#B91C1C', contrastText: '#FFFFFF', soft: '#FEE2E2', softText: '#991B1B' },
  info:    { main: '#2563EB', light: '#3B82F6', dark: '#1D4ED8', contrastText: '#FFFFFF', soft: '#DBEAFE', softText: '#1E40AF' },
};

// Surfaces per mode.
export const surfaces = {
  light: {
    background: '#F6F8FC',
    paper:      '#FFFFFF',
    subtle:     '#F8FAFC',   // table headers, input fills, hover rows
    border:     '#E2E8F0',
    borderStrong: '#CBD5E1',
    textPrimary:   '#172B4D',
    textSecondary: '#64748B',
    textDisabled:  '#94A3B8',
  },
  // Navy dark mode.
  dark: {
    background: '#0B1220',
    paper:      '#17263D',
    subtle:     '#1C2E49',
    border:     '#334155',
    borderStrong: '#475569',
    textPrimary:   '#F8FAFC',
    textSecondary: '#94A3B8',
    textDisabled:  '#64748B',
  },
};

// Navy dashboard sidebar (every role), with the active item in a red gradient.
export const sidebar = {
  bg:           navy.dark,
  bgGradient:   gradients.sidebar,
  bgGradientDark: 'linear-gradient(160deg, #0F2038 0%, #13294A 100%)',
  border:       'rgba(255,255,255,0.08)',
  text:         'rgba(255,255,255,0.78)',
  textActive:   '#FFFFFF',
  itemHover:    'rgba(255,255,255,0.07)',
  itemActive:   gradients.primary,
  itemActiveShadow: '0 6px 16px rgba(201,29,50,0.35)',
  indicator:    'transparent', // the red pill marks the active item on its own
  sectionLabel: 'rgba(255,255,255,0.45)',
  badgeColor:   brand.primary,
};

// Which semantic tone each domain status uses — keeps every table and card
// colouring "Pending" (etc.) identically. Consumed by <StatusBadge />.
export const statusTone = {
  // blood requests
  // Approved / completed = green, confirmed = blue, pending = orange, rejected = red, cancelled = gray.
  Pending: 'warning', Approved: 'success', Fulfilled: 'success', Rejected: 'error',
  // appointments
  Confirmed: 'info', CheckedIn: 'success', Completed: 'success', Cancelled: 'neutral',
  // urgency
  Low: 'neutral', Medium: 'warning', High: 'warning', Critical: 'error',
  // inventory
  adequate: 'success', low: 'warning', critical: 'error', empty: 'neutral',
  // donors
  Available: 'success', Unavailable: 'neutral',
};

// ── Type ─────────────────────────────────────────────────────────────────────
// The `--font-*` variables are set on <html> by next/font in app/layout.jsx. Naming "Inter"
// alone would miss them: next/font serves each face under a generated family name.
// The Vietnamese and Khmer files hold only those letters, so they come first: the browser takes
// each character from the first font that has it, and everything else falls through to Inter.
export const fontFamily = 'var(--font-inter-vi), var(--font-khmer), var(--font-inter), "Inter", "Noto Sans Khmer", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';

export const fontWeight = { regular: 400, medium: 500, semibold: 600, bold: 700, extrabold: 800 };

// ── Shape ────────────────────────────────────────────────────────────────────
export const radius = {
  sm:     8,   // chips-in-tables, small controls
  md:     10,  // buttons, inputs
  card:   14,  // cards, papers
  dialog: 18,
  pill:   999, // badges
};

// ── Motion ───────────────────────────────────────────────────────────────────
// Shared timings so hover, press and theme changes feel like one system.
// `prefers-reduced-motion` is honoured globally in theme.js.
export const easing = 'cubic-bezier(0.2, 0.8, 0.2, 1)';
export const motion = {
  fast:  `.15s ${easing}`,  // hover colours
  base:  `.22s ${easing}`,  // cards, shadows
  press: `.1s ease-out`,    // button press
  theme: `.25s ease`,       // light/dark cross-fade
  page:  `.32s ${easing}`,  // page enter
  reveal: `.6s ${easing}`,  // content fading in on scroll (components/motion/Reveal)
  easing,                   // the curve alone, for custom durations
};

// ── Elevation ────────────────────────────────────────────────────────────────
// Subtle, cool-tinted shadows; dark mode uses plain black at higher opacity.
export const shadow = {
  light: {
    xs: '0 1px 2px rgba(16,24,40,0.04)',
    sm: '0 1px 2px rgba(16,24,40,0.04), 0 1px 3px rgba(16,24,40,0.06)',
    md: '0 4px 12px rgba(16,24,40,0.08)',
    lg: '0 12px 32px rgba(16,24,40,0.12)',
  },
  dark: {
    xs: '0 1px 2px rgba(0,0,0,0.30)',
    sm: '0 1px 3px rgba(0,0,0,0.40)',
    md: '0 6px 16px rgba(0,0,0,0.45)',
    lg: '0 16px 40px rgba(0,0,0,0.55)',
  },
};

// ── Layout & spacing ─────────────────────────────────────────────────────────
// MUI's spacing unit stays 8px (`sx={{ p: 3 }}` = 24px). Use this scale:
//   1 = 8   tight gaps inside a component
//   2 = 16  default gap between related items, card padding on mobile
//   3 = 24  card padding on desktop, gap between cards
//   4 = 32  gap between page sections
export const layout = {
  sidebarWidth:  256,
  headerHeight:  64,
  contentMaxWidth: 1440,
  pagePadding:   { xs: 2, md: 3 },   // spacing units
  cardPadding:   { xs: 2, md: 3 },
  sectionGap:    { xs: 3, md: 4 },
};

export const breakpoints = { xs: 0, sm: 600, md: 900, lg: 1200, xl: 1536 }; // MUI defaults, listed for reference
