'use client';
import { useId, useState } from 'react';
import { Box, ButtonBase, Menu, MenuItem, Typography, alpha } from '@mui/material';
import { Check, CheckCircleOutline, KeyboardArrowDown, Language } from '@mui/icons-material';
import { LOCALES } from '@/i18n/config';
import { useI18n } from '@/i18n/I18nProvider';

// Small flags drawn inline (emoji flags don't render on Windows). Decoration only.
// `slice` keeps them filled edge to edge in both the rounded-rectangle and the round frame.
const FLAGS = {
  en: (
    <svg viewBox="0 0 30 20" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
      <rect width="30" height="20" fill="#B22234" />
      {[2.3, 5.4, 8.5, 11.6, 14.7, 17.8].map((y) => <rect key={y} y={y} width="30" height="1.55" fill="#fff" />)}
      <rect width="13" height="10.8" fill="#3C3B6E" />
      {[2, 5, 8, 11].flatMap((x) => [2.2, 5.4, 8.6].map((y) => <circle key={`${x}-${y}`} cx={x} cy={y} r="0.55" fill="#fff" />))}
    </svg>
  ),
  km: (
    <svg viewBox="0 0 30 20" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
      <rect width="30" height="20" fill="#032EA1" />
      <rect y="5" width="30" height="10" fill="#E00025" />
      <path d="M8.6 13.6h12.8v-1.1h-1v-1.9h-1.1V9.1h-1V7.8h-1V6.3h-.8V5.2h-2.1v1.1h-.8v1.5h-1v1.3h-1v1.5H9.6v1.9h-1z" fill="#fff" />
    </svg>
  ),
  vi: (
    <svg viewBox="0 0 30 20" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
      <rect width="30" height="20" fill="#DA251D" />
      <path d="M15 4.2l1.5 4.6h4.8l-3.9 2.8 1.5 4.6-3.9-2.8-3.9 2.8 1.5-4.6-3.9-2.8h4.8z" fill="#FFFF00" />
    </svg>
  ),
};

/** A flag as a rounded rectangle (the button) or a circle (the list). */
const Flag = ({ code, size = 22, round = false }) => (
  <Box component="span" sx={{
    width: size, height: round ? size : Math.round(size * 0.68), display: 'inline-flex', flexShrink: 0, overflow: 'hidden',
    borderRadius: round ? '50%' : '4px', boxShadow: '0 0 0 1px rgba(15,23,42,0.1)',
    '& svg': { width: '100%', height: '100%', display: 'block' },
  }}>
    {FLAGS[code]}
  </Box>
);

/**
 * Global language picker (public navbar and dashboard top bar). Changing it updates the whole
 * app at once and is remembered (see I18nProvider). `compact` hides the "EN" code; `labelDisplay`
 * sets its CSS display per breakpoint instead (e.g. { xs: 'none', md: 'inline' }).
 */
export default function LanguageSwitcher({ compact = false, labelDisplay = compact ? 'none' : 'inline' }) {
  const { lang, setLang, t } = useI18n();
  const [anchor, setAnchor] = useState(null);
  const menuId = useId();
  const buttonId = useId();
  const current = LOCALES.find((l) => l.code === lang) || LOCALES[0];
  const open = Boolean(anchor);

  return (
    <>
      <ButtonBase
        id={buttonId}
        onClick={(e) => setAnchor(e.currentTarget)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={open ? menuId : undefined}
        aria-label={t('layout.language.button', { name: current.name })}
        sx={(theme) => {
          const dark = theme.palette.mode === 'dark';
          return {
            height: 40, pl: compact ? 1 : 1.25, pr: compact ? 0.75 : 1, gap: 0.9, borderRadius: 999,
            border: 1, borderColor: open ? alpha(theme.palette.primary.main, 0.5) : dark ? alpha('#fff', 0.12) : '#E2E8F0',
            bgcolor: 'background.paper', color: dark ? 'text.primary' : '#102B4E',
            boxShadow: dark ? 'none' : '0 2px 10px rgba(16,43,78,0.08)',
            fontSize: '0.88rem', fontWeight: 800, letterSpacing: '0.02em',
            transition: 'border-color .15s ease, box-shadow .15s ease',
            '&:hover': { borderColor: alpha(theme.palette.primary.main, 0.4), boxShadow: dark ? 'none' : '0 4px 14px rgba(16,43,78,0.12)' },
            '&.Mui-focusVisible': { outline: `2px solid ${theme.palette.primary.main}`, outlineOffset: 2 },
          };
        }}
      >
        <Flag code={current.code} size={24} />
        <Box component="span" sx={{ display: labelDisplay }}>{current.label}</Box>
        <KeyboardArrowDown aria-hidden="true" sx={{ fontSize: 20, color: 'text.secondary', transform: open ? 'rotate(180deg)' : 'none', transition: 'transform .2s ease' }} />
      </ButtonBase>

      <Menu
        id={menuId}
        anchorEl={anchor}
        open={open}
        onClose={() => setAnchor(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
        marginThreshold={12}
        slotProps={{
          list: { 'aria-labelledby': buttonId, sx: { p: 0 } },
          paper: { sx: (theme) => ({
            mt: 1.25, width: 320, maxWidth: 'calc(100vw - 24px)', borderRadius: '18px', overflow: 'hidden',
            border: 1, borderColor: theme.palette.mode === 'dark' ? alpha('#fff', 0.08) : '#EEF2F7',
            boxShadow: theme.palette.mode === 'dark' ? '0 18px 44px rgba(0,0,0,0.5)' : '0 20px 48px rgba(16,43,78,0.16)',
          }) },
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25, px: 2.5, pt: 2, pb: 1.25 }}>
          <Language aria-hidden="true" sx={{ fontSize: 22, color: (theme) => (theme.palette.mode === 'dark' ? 'text.primary' : '#102B4E') }} />
          <Typography sx={{ fontWeight: 700, fontSize: '0.98rem', color: (theme) => (theme.palette.mode === 'dark' ? 'text.primary' : '#102B4E') }}>
            {t('layout.language.select')}
          </Typography>
        </Box>

        {LOCALES.map((l) => {
          const selected = l.code === lang;
          return (
            <MenuItem
              key={l.code}
              lang={l.code}
              selected={selected}
              onClick={() => { setLang(l.code); setAnchor(null); }}
              sx={(theme) => ({
                mx: 1.25, my: 0.25, px: 1.5, py: 1.1, gap: 1.75, borderRadius: '12px',
                fontSize: '0.98rem', fontWeight: selected ? 700 : 600,
                color: theme.palette.mode === 'dark' ? 'text.primary' : '#102B4E',
                '&:hover': { bgcolor: alpha(theme.palette.primary.main, 0.05) },
                '&.Mui-selected, &.Mui-selected:hover, &.Mui-selected.Mui-focusVisible': {
                  bgcolor: alpha(theme.palette.primary.main, theme.palette.mode === 'dark' ? 0.18 : 0.08),
                  color: 'primary.main',
                },
                '&.Mui-focusVisible': { outline: `2px solid ${theme.palette.primary.main}`, outlineOffset: -2 },
              })}
            >
              <Flag code={l.code} size={30} round />
              <Box component="span" sx={{ flex: 1 }}>{l.name} ({l.label})</Box>
              {selected && <Check aria-hidden="true" sx={{ fontSize: 22, color: 'primary.main' }} />}
            </MenuItem>
          );
        })}

        <Box sx={(theme) => ({
          display: 'flex', gap: 1.25, alignItems: 'flex-start', mt: 1.25, px: 2.5, py: 1.75,
          borderTop: 1, borderColor: 'divider',
          bgcolor: theme.palette.mode === 'dark' ? alpha('#fff', 0.03) : '#F8FAFC',
        })}>
          <CheckCircleOutline aria-hidden="true" sx={{ fontSize: 20, color: 'success.main', mt: '1px', flexShrink: 0 }} />
          <Typography sx={{ fontSize: '0.8rem', color: 'text.secondary', lineHeight: 1.5 }}>{t('layout.language.saved')}</Typography>
        </Box>
      </Menu>
    </>
  );
}
