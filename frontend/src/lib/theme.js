import { createTheme, alpha } from '@mui/material/styles';
import * as tokens from './design-tokens';

const { brand, neutral, semantic, surfaces, radius, layout, sidebar, statusTone } = tokens;

// `theme.breakpoints` isn't available while the theme is being defined, so the one
// breakpoint the type scale needs is written out (matches MUI's default `md`).
const MD = '@media (min-width:900px)';

const buildShadows = (mode) => {
  const s = tokens.shadow[mode];
  // MUI requires exactly 25 entries. Low elevations stay whisper-subtle; anything
  // above (menus, dialogs, popovers) shares the large overlay shadow.
  return ['none', s.xs, s.sm, s.sm, s.md, s.md, s.md, s.md, ...Array(17).fill(s.lg)];
};

const buildPalette = (mode) => {
  const dark = mode === 'dark';
  const s = surfaces[mode];
  const pick = ({ main, light, dark: d, contrastText }) => ({ main, light, dark: d, contrastText });
  return {
    mode,
    primary: dark
      ? { main: brand.primaryLight, light: '#E8737D', dark: brand.primary, contrastText: '#FFFFFF' }
      : { main: brand.primary, light: brand.primaryLight, dark: brand.primaryDark, contrastText: '#FFFFFF' },
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
const buildTones = (mode) => {
  if (mode === 'light') {
    const soft = (k) => ({ bg: semantic[k].soft, fg: semantic[k].softText, dot: semantic[k].main });
    return {
      primary: { bg: brand.primarySoft, fg: brand.primaryDark, dot: brand.primary },
      success: soft('success'),
      warning: soft('warning'),
      error:   soft('error'),
      info:    soft('info'),
      neutral: { bg: neutral[100], fg: neutral[600], dot: neutral[400] },
    };
  }
  const soft = (k) => ({ bg: alpha(semantic[k].main, 0.16), fg: semantic[k].light, dot: semantic[k].light });
  return {
    primary: { bg: alpha(brand.primaryLight, 0.16), fg: '#F0868F', dot: brand.primaryLight },
    success: soft('success'),
    warning: soft('warning'),
    error:   soft('error'),
    info:    soft('info'),
    neutral: { bg: 'rgba(255,255,255,0.08)', fg: '#B5B5B5', dot: '#7A7A7A' },
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

export function buildTheme(mode = 'light') {
  const s = surfaces[mode];
  const palette = buildPalette(mode);
  const primary = palette.primary.main;
  const tones = buildTones(mode);
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
      layout,
      sidebar,
      statusTone,
      tones,
      shadow: elevation,
      surface: s,
    },

    components: {
      MuiCssBaseline: {
        styleOverrides: {
          body: { WebkitFontSmoothing: 'antialiased', MozOsxFontSmoothing: 'grayscale' },
          '::selection': { backgroundColor: alpha(primary, 0.22) },
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
            transition: 'background-color .15s ease, border-color .15s ease, color .15s ease',
            '&:hover': { boxShadow: 'none' },
          },
          sizeSmall:  { minHeight: 32, padding: '4px 12px', fontSize: '0.8125rem' },
          sizeMedium: { minHeight: 40, padding: '8px 18px' },
          sizeLarge:  { minHeight: 48, padding: '11px 24px', fontSize: '0.9375rem' },
          // White on #16A34A is only ~3.3:1; the darker step clears AA for label text.
          containedSuccess: { backgroundColor: semantic.success.dark, '&:hover': { backgroundColor: '#166534' } },
        },
      },

      // ── Inputs ─────────────────────────────────────────────────────────────
      // Geometry (height, label offsets) is left at MUI's defaults on purpose — the
      // floating label positions depend on it. Use size="small" for dense forms.
      MuiOutlinedInput: {
        styleOverrides: {
          root: {
            borderRadius: radius.md,
            backgroundColor: mode === 'light' ? '#FFFFFF' : s.subtle,
            fontSize: '0.9375rem',
            transition: 'box-shadow .15s ease',
            '& .MuiOutlinedInput-notchedOutline': { borderColor: s.borderStrong },
            '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: neutral[400] },
            '&.Mui-focused': { boxShadow: `0 0 0 3px ${alpha(primary, 0.14)}` },
            '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: primary, borderWidth: 1.5 },
            '&.Mui-error.Mui-focused': { boxShadow: `0 0 0 3px ${alpha(semantic.error.main, 0.14)}` },
            '&.Mui-disabled': { backgroundColor: s.subtle },
          },
        },
      },
      MuiInputLabel: {
        styleOverrides: { root: { fontSize: '0.9375rem', fontWeight: 500 } },
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
          tooltip: { backgroundColor: neutral[800], fontSize: '0.75rem', fontWeight: 500, borderRadius: 8, padding: '6px 10px' },
          arrow: { color: neutral[800] },
        },
      },

      // ── Tables ─────────────────────────────────────────────────────────────
      MuiTableCell: {
        styleOverrides: {
          root: { borderBottom: `1px solid ${s.border}`, padding: '14px 16px', fontSize: '0.875rem' },
          sizeSmall: { padding: '10px 16px' },
          head: {
            backgroundColor: s.subtle,
            color: s.textSecondary,
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
          root: { '&.MuiTableRow-hover:hover': { backgroundColor: s.subtle } },
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
