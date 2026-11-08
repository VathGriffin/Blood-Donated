'use client';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import {
  Box, Typography, Alert, CircularProgress, Checkbox, FormControlLabel, useTheme,
} from '@mui/material';
import { keyframes } from '@mui/system';
import {
  Lock, Email, ArrowForward, Shield, GppGood, BarChart, ManageAccounts, Inventory2, VerifiedUser,
} from '@mui/icons-material';
import axios from 'axios';
import { useAuth } from '@/store/AuthContext';
import API_BASE from '@/lib/config';
import { apiErrorMessage } from '@/lib/api-error';
import { EMAIL_RE } from '@/lib/validation';
import LanguageSwitcher from '@/components/layout/LanguageSwitcher';
import { useI18n } from '@/i18n/I18nProvider';
import BrandLogo from '@/components/dashboard/BrandLogo';
import { BRAND } from '@/lib/brand';
import { AuthField, PrimaryButton, RED } from '@/components/auth/authUi';

const SIDE_IMG =
  'https://images.unsplash.com/photo-1538108149393-fbbd81895907?auto=format&fit=crop&w=1200&q=80';


// Text: auth.admin.capabilities.<key>.{title,text}
const capabilities = [
  { icon: <BarChart />, key: 'monitor' },
  { icon: <ManageAccounts />, key: 'manage' },
  { icon: <Inventory2 />, key: 'stock' },
  { icon: <GppGood />, key: 'secure' },
];

const fadeUp = keyframes`
  from { opacity: 0; transform: translateY(18px); }
  to   { opacity: 1; transform: translateY(0); }
`;

// Staggered entrance; switched off entirely for users who ask for reduced motion.
const enter = (delay = 0) => ({
  animation: `${fadeUp} 0.6s cubic-bezier(0.22, 1, 0.36, 1) ${delay}s both`,
  '@media (prefers-reduced-motion: reduce)': { animation: 'none' },
});

const noMotion = { '@media (prefers-reduced-motion: reduce)': { transition: 'none', transform: 'none !important' } };

const AdminLogin = () => {
  const router = useRouter();
  const { login, isAdmin } = useAuth();
  const { t, rich } = useI18n();
  const isDark = useTheme().palette.mode === 'dark';
  const [form, setForm] = useState({ email: '', password: '' });
  const [remember, setRemember] = useState(true);
  const [touched, setTouched] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isAdmin) router.replace('/dashboard/admin');
  }, [isAdmin, router]);

  if (isAdmin) return null;

  const email = form.email.trim();
  const emailProblem = !email ? t('auth.admin.emailRequired') : !EMAIL_RE.test(email) ? t('auth.admin.emailInvalid') : '';
  const passwordProblem = !form.password ? t('auth.admin.passwordRequired') : '';
  const emailError = touched && emailProblem;
  const passwordError = touched && passwordProblem;

  const handleChange = (e) => {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setTouched(true);
    if (emailProblem || passwordProblem) return;
    setLoading(true);
    setError('');
    try {
      const { data } = await axios.post(`${API_BASE}/api/staff/login`, { ...form, email });
      if (data.staff.role !== 'admin') {
        setError(t('auth.admin.notAdmin'));
        return;
      }
      login(data.token, data.staff, { remember });
      router.push('/dashboard/admin', { replace: true });
    } catch (err) {
      setError(apiErrorMessage(err, t('auth.admin.failed')));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      {/* Left photo panel — desktop only */}
      <Box
        component="aside"
        sx={{
          display: { xs: 'none', md: 'flex' },
          width: { md: '46%', lg: '50%' },
          flexShrink: 0,
          position: 'relative',
          overflow: 'hidden',
          flexDirection: 'column',
          justifyContent: 'space-between',
          px: { md: 5, lg: 7 },
          py: { md: 4.5, lg: 5.5 },
          backgroundImage: `url(${SIDE_IMG})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          color: '#fff',
          '&::before': {
            content: '""',
            position: 'absolute',
            inset: 0,
            background:
              'linear-gradient(155deg, rgba(11,26,47,0.95) 0%, rgba(16,37,65,0.88) 50%, rgba(36,84,129,0.76) 100%)',
          },
        }}
      >
        {/* Decorative drop + glow shapes */}
        <Box aria-hidden sx={{
          position: 'absolute', top: '6%', right: '8%', width: 170, height: 220, opacity: 0.22,
          background: 'linear-gradient(135deg, #E63946 0%, #C91D32 100%)', borderRadius: '50% 50% 50% 50% / 60% 60% 40% 40%',
          clipPath: 'path("M85 0C85 0 0 95 0 140a85 85 0 0 0 170 0C170 95 85 0 85 0Z")',
        }} />
        <Box aria-hidden sx={{
          position: 'absolute', right: -120, bottom: -140, width: 420, height: 420, borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(255,60,60,0.55), rgba(255,60,60,0) 70%)',
        }} />

        <Box sx={{ position: 'relative', zIndex: 1, ...enter(0) }}>
          <BrandLogo href="/" caption={t('auth.admin.portal').toLocaleUpperCase()} />
        </Box>

        <Box sx={{ position: 'relative', zIndex: 1, maxWidth: 520 }}>
          <Box sx={{
            display: 'inline-flex', alignItems: 'center', gap: 1, mb: 3.5,
            bgcolor: 'rgba(201,29,50,0.35)', border: '1px solid rgba(255,120,120,0.55)',
            borderRadius: 999, px: 2, py: 0.85, backdropFilter: 'blur(6px)', ...enter(0.08),
          }}>
            <Shield sx={{ fontSize: 16, color: '#F5C6CC' }} />
            <Typography sx={{ fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.06em' }}>
              {t('auth.admin.secure')}
            </Typography>
          </Box>

          <Typography component="h2" sx={{
            fontWeight: 800, fontSize: { md: '2.5rem', lg: '3.1rem' }, lineHeight: 1.12, letterSpacing: '-0.02em', ...enter(0.14),
          }}>
            {rich('auth.admin.heroTitle', { accent: <Box component="span" sx={{ color: '#E63946' }}>{t('auth.admin.heroAccent')}</Box> })}
          </Typography>
          <Box sx={{ width: 46, height: 3, borderRadius: 2, bgcolor: '#E63946', mt: 2.25, mb: 2.5, ...enter(0.18) }} />
          <Typography sx={{ fontSize: '1.05rem', color: 'rgba(255,255,255,0.82)', lineHeight: 1.6, mb: 4, ...enter(0.22) }}>
            {t('auth.admin.heroLead')}
          </Typography>

          <Box component="ul" sx={{ listStyle: 'none', m: 0, p: 0, display: 'flex', flexDirection: 'column', gap: 2.25 }}>
            {capabilities.map((c, i) => (
              <Box component="li" key={c.key} sx={{
                display: 'flex', alignItems: 'center', gap: 2.25, ...enter(0.3 + i * 0.07),
                '&:hover .cap-icon': { transform: 'translateY(-2px) scale(1.06)', boxShadow: '0 8px 22px rgba(255,60,60,0.45)' },
              }}>
                <Box className="cap-icon" sx={{
                  width: 52, height: 52, borderRadius: '14px', flexShrink: 0,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  background: 'linear-gradient(135deg, #E63946 0%, #C91D32 100%)',
                  border: '1px solid rgba(255,140,140,0.45)',
                  boxShadow: '0 4px 14px rgba(0,0,0,0.25)',
                  transition: 'transform 0.25s ease, box-shadow 0.25s ease',
                  '& svg': { fontSize: 24 },
                  ...noMotion,
                }}>
                  {c.icon}
                </Box>
                <Box>
                  <Typography sx={{ fontWeight: 600, fontSize: '1.02rem', lineHeight: 1.3 }}>{t(`auth.admin.capabilities.${c.key}.title`)}</Typography>
                  <Typography sx={{ fontSize: '0.88rem', color: 'rgba(255,255,255,0.68)' }}>{t(`auth.admin.capabilities.${c.key}.text`)}</Typography>
                </Box>
              </Box>
            ))}
          </Box>
        </Box>

        <Box sx={{ position: 'relative', zIndex: 1, display: 'flex', alignItems: 'center', gap: 2, ...enter(0.6) }}>
          <Box sx={{ width: 46, height: 2, borderRadius: 2, bgcolor: '#E63946' }} />
          <Typography sx={{ fontSize: '0.88rem', color: 'rgba(255,255,255,0.75)' }}>
            {BRAND.name} • {t('auth.admin.portal')}
          </Typography>
        </Box>
      </Box>

      {/* Right form panel */}
      <Box component="main" sx={{
        flex: 1, position: 'relative', overflow: 'hidden',
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        px: 2, py: { xs: 4, sm: 6 },
        background: isDark
          ? 'radial-gradient(circle at 85% 10%, rgba(201,29,50,0.14), transparent 45%), #0B1220'
          : 'linear-gradient(160deg, #FFF1F2 0%, #FFFFFF 55%, #FFF1F2 100%)',
      }}>
        <Box sx={{ position: 'absolute', top: { xs: 12, sm: 20 }, right: { xs: 12, sm: 20 }, zIndex: 2 }}>
          <LanguageSwitcher labelDisplay={{ xs: 'none', sm: 'inline' }} />
        </Box>
        {/* Soft background circles */}
        <Box aria-hidden sx={{
          position: 'absolute', top: -120, right: -100, width: 380, height: 380, borderRadius: '50%',
          bgcolor: isDark ? 'rgba(201,29,50,0.08)' : 'rgba(201,29,50,0.05)',
        }} />
        <Box aria-hidden sx={{
          position: 'absolute', bottom: -140, left: -90, width: 320, height: 320, borderRadius: '50%',
          bgcolor: isDark ? 'rgba(201,29,50,0.06)' : 'rgba(201,29,50,0.045)',
        }} />

        {/* Mobile brand mark */}
        <Box sx={{ display: { xs: 'flex', md: 'none' }, justifyContent: 'center', mb: 3, position: 'relative', ...enter(0) }}>
          <BrandLogo href="/" caption={t('auth.admin.portal')} onDark={false} />
        </Box>

        <Box sx={{
          position: 'relative', width: '100%', maxWidth: 600, bgcolor: 'background.paper',
          borderRadius: '28px', overflow: 'hidden',
          border: `1px solid ${isDark ? '#334155' : '#E2E8F0'}`,
          boxShadow: isDark ? '0 18px 50px rgba(0,0,0,0.5)' : '0 24px 70px rgba(16,24,40,0.12)',
          ...enter(0.1),
        }}>
          {/* Card header */}
          <Box sx={{
            position: 'relative', overflow: 'hidden',
            background: 'linear-gradient(120deg, #102541 0%, #173B63 55%, #245481 100%)',
            px: { xs: 3, sm: 5 }, py: { xs: 3, sm: 3.5 },
            display: 'flex', alignItems: 'center', gap: { xs: 2, sm: 3 },
          }}>
            <Box aria-hidden sx={{
              position: 'absolute', right: -60, top: -30, width: 220, height: 220, borderRadius: '50%',
              background: 'radial-gradient(circle, rgba(255,90,90,0.55), rgba(255,90,90,0) 70%)',
            }} />
            <Box sx={{
              position: 'relative', flexShrink: 0, width: { xs: 64, sm: 84 }, height: { xs: 64, sm: 84 }, borderRadius: '50%',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              bgcolor: 'rgba(255,255,255,0.1)', border: '2px solid rgba(255,255,255,0.35)',
              transition: 'transform 0.3s ease', '&:hover': { transform: 'rotate(-6deg) scale(1.05)' }, ...noMotion,
            }}>
              <VerifiedUser sx={{ color: '#fff', fontSize: { xs: 32, sm: 42 } }} />
            </Box>
            <Box sx={{ position: 'relative', minWidth: 0 }}>
              <Typography component="h1" sx={{ fontWeight: 800, fontSize: { xs: '1.5rem', sm: '1.95rem' }, color: '#fff', lineHeight: 1.15, letterSpacing: '-0.02em' }}>
                {t('auth.admin.title')}
              </Typography>
              <Typography sx={{ fontSize: { xs: '0.88rem', sm: '1rem' }, color: 'rgba(255,255,255,0.85)', mt: 0.5 }}>
                {t('auth.admin.subtitle')}
              </Typography>
            </Box>
          </Box>

          {/* Form body */}
          <Box sx={{ px: { xs: 3, sm: 5 }, pt: { xs: 3, sm: 3.5 }, pb: { xs: 3, sm: 4 } }}>
            {error && (
              <Alert severity="error" role="alert" sx={{ mb: 2.5, borderRadius: '12px', fontSize: '0.85rem' }}>
                {error}
              </Alert>
            )}

            <Box component="form" onSubmit={handleSubmit} noValidate
              sx={{
                display: 'flex', flexDirection: 'column', gap: 2.5,
                '& .MuiOutlinedInput-root': {
                  minHeight: 54, borderRadius: '14px', transition: 'box-shadow 0.2s ease, background-color 0.2s ease',
                  '&.Mui-focused': { boxShadow: '0 0 0 4px rgba(201,29,50,0.12)' },
                  '&.Mui-focused .MuiInputAdornment-positionStart': { color: RED },
                  ...noMotion,
                },
                '& .MuiInputAdornment-positionStart': { transition: 'color 0.2s ease' },
              }}
            >
              <AuthField
                label={t('auth.admin.email')}
                name="email"
                type="email"
                autoComplete="username"
                placeholder={t('auth.admin.emailPlaceholder')}
                icon={<Email fontSize="small" />}
                value={form.email}
                onChange={handleChange}
                required
                error={!!emailError}
                helperText={emailError || undefined}
                inputProps={{ 'aria-label': t('auth.admin.emailLabel'), 'aria-required': true }}
              />

              <AuthField
                label={t('auth.admin.password')}
                name="password"
                type="password"
                autoComplete="current-password"
                placeholder={t('auth.admin.passwordPlaceholder')}
                icon={<Lock fontSize="small" />}
                value={form.password}
                onChange={handleChange}
                required
                error={!!passwordError}
                helperText={passwordError || undefined}
                inputProps={{ 'aria-label': t('auth.admin.passwordLabel'), 'aria-required': true }}
              />

              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1, flexWrap: 'wrap', mt: -0.5 }}>
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={remember}
                      onChange={(e) => setRemember(e.target.checked)}
                      size="small"
                      sx={{ color: isDark ? '#64748B' : '#CBD5E1', '&.Mui-checked': { color: RED } }}
                    />
                  }
                  label={t('auth.admin.remember')}
                  slotProps={{ typography: { sx: { fontSize: '0.92rem' } } }}
                />
                <Box component={Link} href="/forgot-password" sx={{
                  color: RED, fontWeight: 600, fontSize: '0.9rem', textUnderlineOffset: 3,
                  '&:hover': { color: '#A91529' }, '&:focus-visible': { outline: `2px solid ${RED}`, outlineOffset: 2, borderRadius: 1 },
                }}>
                  {t('auth.admin.forgot')}
                </Box>
              </Box>

              <PrimaryButton
                loading={loading}
                endIcon={loading ? null : <ArrowForward className="arrow" />}
                sx={{
                  py: 1.75, fontSize: '1.08rem', borderRadius: '14px', bgcolor: 'transparent',
                  background: 'linear-gradient(135deg, #E63946 0%, #C91D32 100%)',
                  boxShadow: '0 12px 28px rgba(201,29,50,0.32)',
                  transition: 'transform 0.2s ease, box-shadow 0.25s ease, filter 0.2s ease',
                  '& .arrow': { transition: 'transform 0.2s ease' },
                  '&:hover': {
                    bgcolor: 'transparent', filter: 'brightness(1.06)',
                    transform: 'translateY(-1px) scale(1.01)',
                    boxShadow: '0 16px 38px rgba(220,40,40,0.48)',
                    '& .arrow': { transform: 'translateX(4px)' },
                  },
                  '&:active': { transform: 'scale(0.99)' },
                  '&.Mui-disabled': { color: '#fff', opacity: 0.8 },
                  '@media (prefers-reduced-motion: reduce)': {
                    transition: 'none', '&:hover': { transform: 'none', '& .arrow': { transform: 'none' } },
                  },
                }}
              >
                {loading ? <CircularProgress size={24} color="inherit" aria-label={t('auth.admin.signingIn')} /> : t('auth.admin.submit')}
              </PrimaryButton>
            </Box>

            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mt: 3.5 }}>
              <Box sx={{ flex: 1, height: '1px', bgcolor: 'divider' }} />
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, color: 'text.secondary' }}>
                <Shield sx={{ fontSize: 17, opacity: 0.7 }} />
                <Typography sx={{ fontSize: '0.82rem' }}>{t('auth.admin.authorized', { brand: BRAND.name })}</Typography>
              </Box>
              <Box sx={{ flex: 1, height: '1px', bgcolor: 'divider' }} />
            </Box>
          </Box>
        </Box>
      </Box>
    </Box>
  );
};

export default AdminLogin;
