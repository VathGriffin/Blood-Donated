import { createTheme, alpha } from '@mui/material/styles';
import * as tokens from './design-tokens';

const { brand, neutral, semantic, surfaces, radius, layout, sidebar, statusTone, motion, gradients, navy } = tokens;

// `theme.breakpoints` isn't available while the theme is being defined, so the one
// breakpoint the type scale needs is written out (matches MUI's default `md`).
const MD = '@media (min-width:900px)';

const buildShadows = (mode) => {
  const s = tokens.shadow[mode];
  // MUI requires exactly 25 entries. Low elevations stay whisper-subtle; anything
  // above (menus, dialogs, popovers) shares the large overlay shadow.
  return ['none', s.xs, s.sm, s.sm, s.md, s.md, s.md, s.md, ...Array(17).fill(s.lg)];
};

const buildPalette = (mode, accent = brand, s = surfaces[mode]) => {
  const dark = mode === 'dark';
  const pick = ({ main, light, dark: d, contrastText }) => ({ main, light, dark: d, contrastText });
  return {
    mode,
    primary: dark
      ? { main: accent.primaryLight, light: accent.primaryLighter, dark: accent.primary, contrastText: '#FFFFFF' }
      : { main: accent.primary, light: accent.primaryLight, dark: accent.primaryDark, contrastText: '#FFFFFF' },
    secondary: dark
      ? { main: neutral[400], light: neutral[300], dark: neutral[500], contrastText: '#111111' }
      : { main: neutral[700], light: neutral[500], dark: neutral[900], contrastText: '#FFFFFF' },
    success: pick(semantic.success),
    warning: pick(semantic.warning),
    error:   pick(semantic.error),
    info:    pick(semantic.info),
    grey: neutral,
    background: { default: s.background, paper: s.paper },
    text: { primary: s.textPrimary, secondary: s.textSecondary, disabled: s.textDisabled },
    divider: s.border,
  };
};

// Soft "badge" colours per tone: a tint with readable text. Light mode uses fixed
// pastel tints; dark mode tints the semantic colour by alpha over the surface.
const buildTones = (mode, accent = brand) => {
  if (mode === 'light') {
    const soft = (k) => ({ bg: semantic[k].soft, fg: semantic[k].softText, dot: semantic[k].main });
    return {
      primary: { bg: accent.primarySoft, fg: accent.primaryDark, dot: accent.primary },
      success: soft('success'),
      warning: soft('warning'),
      error:   soft('error'),
      info:    soft('info'),
      neutral: { bg: neutral[100], fg: neutral[600], dot: neutral[400] },
      purple:  { bg: '#F3E8FF', fg: '#6B21A8', dot: '#9333EA' },
    };
  }
  const soft = (k) => ({ bg: alpha(semantic[k].main, 0.16), fg: semantic[k].light, dot: semantic[k].light });
  return {
    primary: { bg: alpha(accent.primaryLight, 0.16), fg: accent.toneFgDark, dot: accent.primaryLight },
    success: soft('success'),
    warning: soft('warning'),
    error:   soft('error'),
    info:    soft('info'),
    neutral: { bg: 'rgba(255,255,255,0.08)', fg: '#B5B5B5', dot: '#7A7A7A' },
    purple:  { bg: alpha('#9333EA', 0.18), fg: '#C084FC', dot: '#C084FC' },
  };
};

const buildTypography = () => ({
  fontFamily: tokens.fontFamily,
  fontWeightRegular: tokens.fontWeight.regular,
  fontWeightMedium: tokens.fontWeight.medium,
  fontWeightBold: tokens.fontWeight.bold,
  // Display sizes step down on small screens so long titles don't wrap awkwardly.
  h1: { fontSize: '2rem',     fontWeight: 800, lineHeight: 1.15, letterSpacing: '-0.03em',  [MD]: { fontSize: '2.5rem'  } },
  h2: { fontSize: '1.75rem',  fontWeight: 800, lineHeight: 1.2,  letterSpacing: '-0.025em', [MD]: { fontSize: '2rem'    } },
  h3: { fontSize: '1.5rem',   fontWeight: 700, lineHeight: 1.25, letterSpacing: '-0.02em',  [MD]: { fontSize: '1.75rem' } },
  h4: { fontSize: '1.25rem',  fontWeight: 700, lineHeight: 1.3,  letterSpacing: '-0.015em', [MD]: { fontSize: '1.5rem'  } },
  h5: { fontSize: '1.125rem', fontWeight: 700, lineHeight: 1.35, letterSpacing: '-0.01em',  [MD]: { fontSize: '1.25rem' } },
  h6: { fontSize: '1rem',     fontWeight: 600, lineHeight: 1.4,  letterSpacing: '-0.005em' },
  subtitle1: { fontSize: '1rem',      fontWeight: 500, lineHeight: 1.5 },
  subtitle2: { fontSize: '0.875rem',  fontWeight: 600, lineHeight: 1.5 },
  body1:     { fontSize: '0.9375rem', fontWeight: 400, lineHeight: 1.6 },
  body2:     { fontSize: '0.875rem',  fontWeight: 400, lineHeight: 1.55 },
  caption:   { fontSize: '0.75rem',   fontWeight: 400, lineHeight: 1.5 },
  overline:  { fontSize: '0.6875rem', fontWeight: 700, lineHeight: 1.5, letterSpacing: '0.08em', textTransform: 'uppercase' },
  button:    { fontSize: '0.875rem',  fontWeight: 600, lineHeight: 1.4, letterSpacing: '-0.005em', textTransform: 'none' },
});

/**
 * One theme for the whole platform (public site and every dashboard). `accent`,
 * `sidebarTokens` and `lightSurfaces` remain as optional overrides.
 */
export function buildTheme(mode = 'light', { accent = brand, sidebarTokens = sidebar, lightSurfaces } = {}) {
  // `lightSurfaces` overrides background / text colours in light mode only.
  const s = mode === 'light' && lightSurfaces ? { ...surfaces.light, ...lightSurfaces } : surfaces[mode];
  const palette = buildPalette(mode, accent, s);
  const primary = palette.primary.main;
  const tones = buildTones(mode, accent);
  const elevation = tokens.shadow[mode];

  return createTheme({
    palette,
    typography: buildTypography(),
    // Base radius stays at 12: existing pages size corners with `sx={{ borderRadius: n }}`
    // multipliers, so changing it would reshape every one of them. The named
    // radii below are what new code should use.
    shape: { borderRadius: 12 },
    shadows: buildShadows(mode),

    // Design tokens exposed to components as `theme.custom.*`.
    custom: {
      radius,
      motion,
      layout,
      // Dark mode uses a deeper navy so the sidebar sits below the cards.
      sidebar: mode === 'dark' && sidebarTokens.bgGradientDark ? { ...sidebarTokens, bgGradient: sidebarTokens.bgGradientDark } : sidebarTokens,
      gradients,
      navy,
      statusTone,
      tones,
      shadow: elevation,
      surface: s,
    },

    components: {
      MuiCssBaseline: {
        styleOverrides: {
          html: {
            colorScheme: mode,
            // Anchor jumps land below the fixed header instead of under it.
            scrollPaddingTop: 88,
            '@media (prefers-reduced-motion: no-preference)': { scrollBehavior: 'smooth' },
          },
          body: {
            WebkitFontSmoothing: 'antialiased',
            MozOsxFontSmoothing: 'grayscale',
            textRendering: 'optimizeLegibility',
            WebkitTapHighlightColor: 'transparent',
          },
          '::selection': { backgroundColor: alpha(primary, 0.22) },
          // The palette as CSS variables, for plain CSS, SVG and third-party widgets (e.g. map popups).
          ':root': {
            '--color-primary': palette.primary.main,
            '--color-primary-hover': mode === 'light' ? accent.primaryDark : accent.primary,
            '--color-primary-light': tones.primary.bg,
            '--color-navy': navy.dark,
            '--color-navy-light': navy.mid,
            '--color-background': s.background,
            '--color-surface': s.paper,
            '--color-text-primary': s.textPrimary,
            '--color-text-secondary': s.textSecondary,
            '--color-border': s.border,
            '--color-success': semantic.success.main,
            '--color-warning': semantic.warning.main,
            '--color-error': semantic.error.main,
            '--color-info': semantic.info.main,
          },
          // Set briefly by the light/dark toggle so colours cross-fade instead of snapping.
          'html.theme-transition, html.theme-transition *, html.theme-transition *::before, html.theme-transition *::after': {
            transition: `background-color ${motion.theme}, border-color ${motion.theme}, color ${motion.theme}, fill ${motion.theme}, box-shadow ${motion.theme} !important`,
            transitionDelay: '0s !important',
          },
          '@keyframes bl-page-enter': {
            from: { opacity: 0, transform: 'translateY(6px)' },
            to: { opacity: 1, transform: 'none' },
          },
          '@keyframes bl-route-progress': {
            '0%': { transform: 'translateX(-100%) scaleX(0.3)' },
            '50%': { transform: 'translateX(20%) scaleX(0.6)' },
            '100%': { transform: 'translateX(100%) scaleX(0.3)' },
          },
          '@keyframes bl-fade-in': { from: { opacity: 0 }, to: { opacity: 1 } },
          // Respect the OS "reduce motion" setting everywhere.
          '@media (prefers-reduced-motion: reduce)': {
            '*, *::before, *::after': {
              animationDuration: '0.01ms !important',
              animationIterationCount: '1 !important',
              transitionDuration: '0.01ms !important',
              scrollBehavior: 'auto !important',
            },
          },
        },
      },

      // ── Buttons ────────────────────────────────────────────────────────────
      // Visible keyboard focus on every ButtonBase-derived control (buttons, icon
      // buttons, tabs, list items, clickable chips).
      MuiButtonBase: {
        styleOverrides: {
          root: { '&.Mui-focusVisible': { outline: `2px solid ${primary}`, outlineOffset: 2 } },
        },
      },
      MuiButton: {
        defaultProps: { disableElevation: true },
        styleOverrides: {
          root: {
            borderRadius: radius.md,
            textTransform: 'none',
            fontWeight: 600,
            letterSpacing: '-0.005em',
            boxShadow: 'none',
            transition: `background-color ${motion.fast}, border-color ${motion.fast}, color ${motion.fast}, transform ${motion.press}`,
            '&:hover': { boxShadow: 'none' },
            '&:active:not(.Mui-disabled)': { transform: 'scale(0.98)' },
          },
          sizeSmall:  { minHeight: 32, padding: '4px 12px', fontSize: '0.8125rem' },
          sizeMedium: { minHeight: 40, padding: '8px 18px' },
          sizeLarge:  { minHeight: 48, padding: '11px 24px', fontSize: '0.9375rem' },
          // Primary actions: the brand red gradient. Pages that need another fill set
          // `background` (not just bgcolor) so the gradient is replaced, not layered under.
          containedPrimary: {
            backgroundImage: gradients.primary,
            boxShadow: `0 4px 12px ${alpha(accent.primary, 0.22)}`,
            '&:hover': { backgroundImage: gradients.primaryHover, boxShadow: `0 6px 16px ${alpha(accent.primary, 0.3)}` },
            '&.Mui-disabled': { backgroundImage: 'none' },
          },
          // Secondary actions: white fill, red border and text.
          outlinedPrimary: {
            borderWidth: 1.5, borderColor: palette.primary.main, backgroundColor: s.paper,
            '&:hover': { borderWidth: 1.5, backgroundColor: tones.primary.bg },
          },
          // White on #16A34A is only ~3.3:1; the darker step clears AA for label text.
          containedSuccess: { backgroundColor: semantic.success.dark, '&:hover': { backgroundColor: '#166534' } },
        },
      },

      // ── Inputs ─────────────────────────────────────────────────────────────
      // Geometry (height, label offsets) is left at MUI's defaults on purpose — the
      // floating label positions depend on it. Use size="small" for dense forms.
      MuiIconButton: {
        styleOverrides: {
          root: {
            transition: `background-color ${motion.fast}, color ${motion.fast}, transform ${motion.press}`,
            '&:active:not(.Mui-disabled)': { transform: 'scale(0.92)' },
          },
        },
      },

      MuiOutlinedInput: {
        styleOverrides: {
          root: {
            borderRadius: radius.md,
            backgroundColor: mode === 'light' ? '#FFFFFF' : s.subtle,
            fontSize: '0.9375rem',
            transition: `box-shadow ${motion.fast}`,
            '& .MuiOutlinedInput-notchedOutline': { borderColor: s.borderStrong, transition: `border-color ${motion.fast}` },
            '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: neutral[400] },
            '&.Mui-focused': { boxShadow: `0 0 0 3px ${alpha(primary, 0.14)}` },
            '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: primary, borderWidth: 1.5 },
            '&.Mui-error.Mui-focused': { boxShadow: `0 0 0 3px ${alpha(semantic.error.main, 0.14)}` },
            '&.Mui-disabled': { backgroundColor: s.subtle },
          },
        },
      },
      MuiInputLabel: {
        // Navy once the label sits on the border; red while the field is focused (MUI default).
        styleOverrides: { root: { fontSize: '0.9375rem', fontWeight: 500, '&.MuiInputLabel-shrink:not(.Mui-focused):not(.Mui-error)': { color: s.textPrimary } } },
      },
      MuiFormLabel: {
        styleOverrides: { root: { '&:not(.MuiInputLabel-root):not(.Mui-focused):not(.Mui-error)': { color: s.textPrimary, fontWeight: 600 } } },
      },
      MuiFormHelperText: {
        styleOverrides: { root: { marginLeft: 2, marginRight: 2, fontSize: '0.75rem' } },
      },
      MuiMenu: {
        styleOverrides: {
          paper: { borderRadius: 12, border: `1px solid ${s.border}`, boxShadow: elevation.lg },
        },
      },
      MuiMenuItem: {
        styleOverrides: {
          root: {
            fontSize: '0.875rem',
            '&.Mui-selected': { backgroundColor: alpha(primary, 0.08) },
            '&.Mui-selected:hover': { backgroundColor: alpha(primary, 0.12) },
          },
        },
      },

      // ── Surfaces ───────────────────────────────────────────────────────────
      MuiPaper: {
        styleOverrides: { root: { backgroundImage: 'none' }, rounded: { borderRadius: radius.card } },
      },
      MuiCard: {
        styleOverrides: {
          root: {
            borderRadius: radius.card,
            border: `1px solid ${s.border}`,
            boxShadow: elevation.sm,
            backgroundImage: 'none',
            // Pages that lift or re-border cards on hover get a smooth change for free.
            transition: `box-shadow ${motion.base}, border-color ${motion.base}, transform ${motion.base}`,
          },
        },
      },
      MuiCardContent: {
        styleOverrides: { root: { padding: 20, '&:last-child': { paddingBottom: 20 } } },
      },
      MuiDialog: {
        styleOverrides: { paper: { borderRadius: radius.dialog, boxShadow: elevation.lg } },
      },
      MuiDialogTitle: {
        styleOverrides: { root: { fontSize: '1.125rem', fontWeight: 700, padding: '20px 24px 12px' } },
      },
      MuiDialogContent: {
        styleOverrides: {
          // MUI removes the top padding of content that follows a DialogTitle, which clips the floating
          // label of a text field placed first ("Full Name" cut in half). Give such content room for it.
          root: { '.MuiDialogTitle-root + &:not(.MuiDialogContent-dividers):has(.MuiInputLabel-outlined)': { paddingTop: 8 } },
        },
      },
      MuiDialogActions: {
        styleOverrides: { root: { padding: '12px 24px 20px' } },
      },
      MuiAppBar: {
        defaultProps: { elevation: 0 },
        styleOverrides: { root: { backgroundImage: 'none' } },
      },

      // ── Badges ─────────────────────────────────────────────────────────────
      // Filled semantic chips render as soft tinted badges (light tint, dark text)
      // rather than solid blocks, so status colours read the same everywhere.
      MuiChip: {
        styleOverrides: {
          root: { borderRadius: radius.pill, fontWeight: 600, fontSize: '0.78rem' },
          sizeSmall: { height: 24, fontSize: '0.72rem' },
          ...Object.fromEntries(
            ['primary', 'success', 'warning', 'error', 'info'].map((k) => [
              `filled${k[0].toUpperCase()}${k.slice(1)}`,
              {
                backgroundColor: tones[k].bg,
                color: tones[k].fg,
                '& .MuiChip-icon, & .MuiChip-deleteIcon': { color: 'inherit' },
                '&.MuiChip-clickable:hover': { backgroundColor: tones[k].bg, filter: 'brightness(0.97)' },
              },
            ])
          ),
        },
      },
      MuiAlert: {
        styleOverrides: {
          root: { borderRadius: 12, fontSize: '0.875rem' },
          ...Object.fromEntries(
            ['success', 'warning', 'error', 'info'].map((k) => [
              `standard${k[0].toUpperCase()}${k.slice(1)}`,
              { backgroundColor: tones[k].bg, color: tones[k].fg, '& .MuiAlert-icon': { color: tones[k].dot } },
            ])
          ),
        },
      },
      MuiTooltip: {
        styleOverrides: {
          tooltip: { backgroundColor: navy.dark, fontSize: '0.75rem', fontWeight: 500, borderRadius: 8, padding: '6px 10px' },
          arrow: { color: navy.dark },
        },
      },

      // ── Tables ─────────────────────────────────────────────────────────────
      MuiTableCell: {
        styleOverrides: {
          root: { borderBottom: `1px solid ${s.border}`, padding: '14px 16px', fontSize: '0.875rem' },
          sizeSmall: { padding: '10px 16px' },
          head: {
            backgroundColor: s.subtle,
            color: s.textPrimary,
            fontSize: '0.72rem',
            fontWeight: 600,
            letterSpacing: '0.06em',
            textTransform: 'uppercase',
            whiteSpace: 'nowrap',
          },
        },
      },
      MuiTableRow: {
        styleOverrides: {
          root: { transition: `background-color ${motion.fast}`, '&.MuiTableRow-hover:hover': { backgroundColor: s.subtle } },
        },
      },
      MuiTableBody: {
        styleOverrides: {
          // Last row's rule would double up with the card border it sits inside.
          root: { '& .MuiTableRow-root:last-child .MuiTableCell-root': { borderBottom: 0 } },
        },
      },

      // ── Navigation ─────────────────────────────────────────────────────────
      MuiTabs: {
        styleOverrides: { indicator: { height: 3, borderRadius: '3px 3px 0 0' } },
      },
      MuiTab: {
        styleOverrides: { root: { textTransform: 'none', fontWeight: 600, fontSize: '0.875rem', minHeight: 44 } },
      },
      MuiListItemButton: {
        styleOverrides: {
          root: {
            borderRadius: radius.md,
            transition: `background-color ${motion.fast}`,
            '&.Mui-selected': { backgroundColor: alpha(primary, 0.08) },
            '&.Mui-selected:hover': { backgroundColor: alpha(primary, 0.12) },
          },
        },
      },
      MuiLinearProgress: {
        styleOverrides: { root: { height: 8, borderRadius: radius.pill, backgroundColor: mode === 'light' ? neutral[200] : s.borderStrong } },
      },
    },
  });
}
