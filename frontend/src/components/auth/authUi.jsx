'use client';
import { useI18n } from '@/i18n/I18nProvider';
import LanguageSwitcher from '@/components/layout/LanguageSwitcher';
import Link from 'next/link';
import { useState } from 'react';
import { Box, Typography, TextField, Button, InputAdornment, IconButton, Divider, useTheme } from '@mui/material';
import { Visibility, VisibilityOff, ArrowBack, VerifiedUser, LocalHospital, Favorite } from '@mui/icons-material';
import BrandLogo from '@/components/dashboard/BrandLogo';

export const RED = '#C91D32';
export const RED_DARK = '#A91529';

// Page frame shared by login and register: soft tinted background, brand top-left,
// "Back to Home" top-right, content centred underneath.
export function AuthFrame({ children, sx }) {
  const isDark = useTheme().palette.mode === 'dark';
  return (
    <Box sx={{
      position: 'relative', minHeight: '100vh', overflow: 'hidden',
      background: isDark
        ? 'radial-gradient(circle at 15% 20%, rgba(201,29,50,0.16), transparent 45%), #0B1220'
        : 'radial-gradient(circle at 12% 18%, rgba(201,29,50,0.06), transparent 42%), linear-gradient(160deg, #FFFFFF 0%, #F6F8FC 100%)',
      ...sx,
    }}>
      {children}
    </Box>
  );
}

export function AuthTopBar() {
  const { t } = useI18n();
  return (
    <Box sx={{ position: 'relative', zIndex: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between', px: { xs: 2.5, md: 5 }, pt: { xs: 2.5, md: 3.5 } }}>
      <BrandLogo href="/" caption={t('common.brandTagline')} onDark={false} />
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <LanguageSwitcher labelDisplay={{ xs: 'none', sm: 'inline' }} />
        <Button component={Link} href="/" startIcon={<ArrowBack sx={{ fontSize: 16 }} />}
          sx={{ color: 'text.secondary', fontWeight: 600, textTransform: 'none', fontSize: '0.88rem', display: { xs: 'none', sm: 'inline-flex' } }}>
          {t('auth.backHome')}
        </Button>
      </Box>
    </Box>
  );
}

// The white rounded card both forms sit in.
export function AuthCard({ children, maxWidth = 470, sx }) {
  const isDark = useTheme().palette.mode === 'dark';
  return (
    <Box sx={{
      width: '100%', maxWidth, bgcolor: 'background.paper', borderRadius: '22px',
      px: { xs: 3, sm: 5 }, py: { xs: 3.5, sm: 4.5 },
      border: `1px solid ${isDark ? '#334155' : '#f1e6e6'}`,
      boxShadow: isDark ? 'none' : '0 18px 60px rgba(16,24,40,0.10)',
      ...sx,
    }}>
      {children}
    </Box>
  );
}

export function AuthHeading({ title, subtitle, emblem }) {
  return (
    <Box sx={{ textAlign: 'center', mb: 3 }}>
      {emblem && <Box sx={{ display: 'flex', justifyContent: 'center', mb: 1 }}>{emblem}</Box>}
      <Typography component="h1" sx={{ fontWeight: 800, fontSize: { xs: '1.65rem', sm: '1.95rem' }, letterSpacing: '-0.02em', lineHeight: 1.15 }}>
        {title}
      </Typography>
      {subtitle && <Typography sx={{ color: 'text.secondary', mt: 0.75, fontSize: '0.95rem' }}>{subtitle}</Typography>}
    </Box>
  );
}

// Text field with a leading icon and an optional label above it. Password fields get a show/hide toggle.
// `acParams` lets it render an MUI Autocomplete's input (pass renderInput's params);
// `selectProps` configures a `select` field.
export function AuthField({ label, icon, type = 'text', hideLabel = false, endAdornment, inputProps, acParams, selectProps, sx, ...rest }) {
  const { t } = useI18n();
  // InputLabelProps is pulled out only to drop it — the label renders above the field, not inside.
  const { InputProps: acInput, inputProps: acHtml, InputLabelProps: _ignored, ...acRest } = acParams || {};
  const isDark = useTheme().palette.mode === 'dark';
  const [show, setShow] = useState(false);
  const isPassword = type === 'password';
  const field = (
    <TextField
      fullWidth size="small"
      {...acRest}
      type={isPassword && show ? 'text' : type}
      slotProps={{
        htmlInput: { 'aria-label': label, ...acHtml, ...inputProps },
        select: selectProps,
        input: {
          ...acInput,
          startAdornment: icon ? <InputAdornment position="start" sx={{ color: 'text.secondary' }}>{icon}</InputAdornment> : undefined,
          endAdornment: isPassword ? (
            <InputAdornment position="end">
              <IconButton size="small" edge="end" onClick={() => setShow((v) => !v)} aria-label={t(show ? 'auth.hidePassword' : 'auth.showPassword')}>
                {show ? <VisibilityOff fontSize="small" /> : <Visibility fontSize="small" />}
              </IconButton>
            </InputAdornment>
          ) : (endAdornment ?? acInput?.endAdornment),
        },
      }}
      sx={{
        '& .MuiOutlinedInput-root': {
          borderRadius: '10px', minHeight: 46, bgcolor: isDark ? 'rgba(255,255,255,0.04)' : '#fff', fontSize: '0.92rem',
          '& fieldset': { borderColor: isDark ? '#334155' : '#e4dede' },
          '&:hover fieldset': { borderColor: isDark ? '#64748B' : '#CBD5E1' },
          '&.Mui-focused fieldset': { borderColor: RED, borderWidth: 1.5 },
        },
        ...sx,
      }}
      {...rest}
    />
  );
  if (hideLabel || !label) return field;
  return (
    <Box>
      <Typography component="label" sx={{ display: 'block', fontWeight: 700, fontSize: '0.85rem', mb: 0.6 }}>{label}</Typography>
      {field}
    </Box>
  );
}

export function PrimaryButton({ children, loading, sx, ...rest }) {
  return (
    <Button type="submit" fullWidth variant="contained" disabled={loading}
      sx={{
        py: 1.35, fontWeight: 700, fontSize: '1rem', textTransform: 'none', borderRadius: '10px',
        bgcolor: RED, boxShadow: '0 8px 22px rgba(201,29,50,0.32)',
        '&:hover': { bgcolor: RED_DARK, boxShadow: '0 10px 26px rgba(201,29,50,0.42)' },
        ...sx,
      }}
      {...rest}
    >
      {children}
    </Button>
  );
}

export function OrDivider({ children }) {
  const { t } = useI18n();
  return (
    <Divider sx={{ my: 2.5, '&::before, &::after': { borderColor: 'divider' } }}>
      <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.82rem' }}>{children || t('auth.orContinue')}</Typography>
    </Divider>
  );
}

export const AuthLink = ({ href, children }) => (
  <Link href={href} style={{ color: RED, fontWeight: 700, textDecoration: 'none' }}>{children}</Link>
);

// auth.badges.<key> in i18n/messages/auth.js
const BADGES = [
  { icon: <VerifiedUser />, key: 'safe' },
  { icon: <LocalHospital />, key: 'trusted' },
  { icon: <Favorite />, key: 'impact' },
];

export function TrustBadges() {
  const isDark = useTheme().palette.mode === 'dark';
  const { t } = useI18n();
  return (
    <Box sx={{ display: 'flex', justifyContent: 'center', gap: { xs: 2, sm: 5 }, mt: 4, flexWrap: 'wrap' }}>
      {BADGES.map((b) => (
        <Box key={b.key} sx={{ textAlign: 'center', width: { xs: 96, sm: 130 } }}>
          <Box sx={{
            width: 46, height: 46, mx: 'auto', mb: 0.75, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
            bgcolor: isDark ? 'rgba(201,29,50,0.18)' : '#FFF1F2', color: RED,
          }}>{b.icon}</Box>
          <Typography sx={{ fontWeight: 700, fontSize: '0.8rem' }}>{t(`auth.badges.${b.key}.title`)}</Typography>
          <Typography sx={{ color: 'text.secondary', fontSize: '0.7rem', lineHeight: 1.35 }}>{t(`auth.badges.${b.key}.text`)}</Typography>
        </Box>
      ))}
    </Box>
  );
}
