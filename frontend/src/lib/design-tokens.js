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
export const brand = {
  primary:      '#B91C2C',
  primaryDark:  '#8F1522',
  primaryLight: '#D6404F',
  primarySoft:  '#FCEBED', // tinted backgrounds, selected rows, soft badges
  primaryBorder:'#F3C1C7',
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

// Surfaces per mode. Dark values intentionally stay close to the near-black
// hard-coded across existing pages (#0a0a0a / #111 / #1f1f1f) so nothing clashes
// while pages are migrated onto the theme.
export const surfaces = {
  light: {
    background: '#F5F7FA',
    paper:      '#FFFFFF',
    subtle:     neutral[50],   // table headers, input fills, hover rows
    border:     neutral[200],
    borderStrong: neutral[300],
    textPrimary:   neutral[800],
    textSecondary: neutral[500],
    textDisabled:  neutral[400],
  },
  dark: {
    background: '#0A0A0A',
    paper:      '#111111',
    subtle:     '#181818',
    border:     '#1F1F1F',
    borderStrong: '#2A2A2A',
    textPrimary:   '#F5F5F5',
    textSecondary: '#9A9A9A',
    textDisabled:  '#5C5C5C',
  },
};

// Dark-red app sidebar (used by the dashboard shells).
export const sidebar = {
  bg:          brand.primaryDark,
  bgGradient:  `linear-gradient(180deg, ${brand.primaryDark} 0%, #6E101A 100%)`,
  border:      'rgba(255,255,255,0.08)',
  text:        'rgba(255,255,255,0.72)',
  textActive:  '#FFFFFF',
  itemHover:   'rgba(255,255,255,0.08)',
  itemActive:  'rgba(255,255,255,0.16)',
  sectionLabel:'rgba(255,255,255,0.45)',
};

// Which semantic tone each domain status uses — keeps every table and card
// colouring "Pending" (etc.) identically. Consumed by <StatusBadge />.
export const statusTone = {
  // blood requests
  Pending: 'warning', Approved: 'info', Fulfilled: 'success', Rejected: 'error',
  // appointments
  Confirmed: 'info', CheckedIn: 'success', Cancelled: 'neutral',
  // urgency
  Low: 'neutral', Medium: 'info', High: 'warning', Critical: 'error',
  // inventory
  adequate: 'success', low: 'warning', critical: 'error', empty: 'error',
  // donors
  Available: 'success', Unavailable: 'neutral',
};

// ── Type ─────────────────────────────────────────────────────────────────────
// `--font-inter` is set on <html> by next/font in app/layout.jsx. Naming "Inter"
// alone would miss it: next/font serves the face under a generated family name.
export const fontFamily = 'var(--font-inter), "Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';

export const fontWeight = { regular: 400, medium: 500, semibold: 600, bold: 700, extrabold: 800 };

// ── Shape ────────────────────────────────────────────────────────────────────
export const radius = {
  sm:     8,   // chips-in-tables, small controls
  md:     10,  // buttons, inputs
  card:   14,  // cards, papers
  dialog: 18,
  pill:   999, // badges
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
