'use client';
import { useI18n } from '@/i18n/I18nProvider';
import { apiErrorMessage } from '@/lib/api-error';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { Box, Typography, Alert, Autocomplete, MenuItem, Button } from '@mui/material';
import {
  PersonOutline, MailOutline, LockOutlined, PhoneOutlined, PlaceOutlined, CalendarMonthOutlined,
  WaterDropOutlined, Favorite, LocalHospitalOutlined,
} from '@mui/icons-material';
import axios from 'axios';
import { useUserAuth } from '@/store/UserAuthContext';
import API_BASE from '@/lib/config';
import { nextPath, nextQuery } from '@/lib/next-path';
import { PROVINCES } from '@/lib/places';
import SocialButtons from '@/components/auth/SocialButtons';
import DropHeart from '@/components/auth/DropHeart';
import { RegisterPanel } from '@/components/auth/AuthArt';
import {
  AuthFrame, AuthTopBar, AuthCard, AuthHeading, AuthField, PrimaryButton, AuthLink, RED, RED_DARK,
} from '@/components/auth/authUi';
import { localToday as today } from '@/lib/format';

const BLOOD_TYPES = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
const PROVINCE_NAMES = PROVINCES.map((p) => p.name);
const PANEL_WIDTH = 300;

// Labels: auth.register.<labelKey> in i18n/messages/auth.js
const ROLES = [
  { id: 'donor', labelKey: 'donorTab', icon: <PersonOutline fontSize="small" /> },
  { id: 'staff', labelKey: 'staffTab', icon: <LocalHospitalOutlined fontSize="small" /> },
];

// Hospital staff accounts are provisioned by an administrator, never self-registered.
// (There is deliberately no admin option on this public page.)
const STAFF_LOGIN = '/hospital/login';


const UserSignUp = () => {
  const router = useRouter();
  const { login, isAuth } = useUserAuth();
  const { t, rich } = useI18n();
  const [role, setRole] = useState('donor');
  const [form, setForm] = useState({
    fullName: '', dateOfBirth: '', email: '', password: '', phone: '', confirm: '', bloodType: '', location: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [authQuery, setAuthQuery] = useState(''); // keeps ?next= when switching to Login
  useEffect(() => { setAuthQuery(nextQuery()); }, []);

  useEffect(() => {
    if (isAuth) router.replace(nextPath('/notification'));
  }, [isAuth, router]);

  if (isAuth) return null;

  const set = (name, value) => { setForm((f) => ({ ...f, [name]: value })); setError(''); };
  const handleChange = (e) => set(e.target.name, e.target.value);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!/\S+@\S+\.\S+/.test(form.email)) { setError(t('auth.register.errors.email')); return; }
    if (form.password.length < 6) { setError(t('auth.register.errors.password')); return; }
    if (form.password !== form.confirm) { setError(t('auth.register.errors.match')); return; }
    if (form.dateOfBirth && form.dateOfBirth > today()) { setError(t('auth.register.errors.birth')); return; }
    setLoading(true);
    try {
      // Optional fields are only sent when filled in.
      const optional = Object.fromEntries(
        ['phone', 'dateOfBirth', 'bloodType', 'location'].map((k) => [k, form[k].trim()]).filter(([, v]) => v)
      );
      const { data } = await axios.post(`${API_BASE}/api/user/register`, {
        fullName: form.fullName.trim(), email: form.email.trim(), password: form.password, ...optional,
      });
      login(data.token, data.user);
      router.push(nextPath('/notification'));
    } catch (err) {
      setError(apiErrorMessage(err, t('auth.register.errors.failed')));
    } finally {
      setLoading(false);
    }
  };

  const grid = { display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2, columnGap: 2.5 };

  return (
    <AuthFrame>
      <RegisterPanel width={PANEL_WIDTH} />
      <Box sx={{ pr: { lg: `${PANEL_WIDTH}px` } }}>
        <AuthTopBar />

        <Box component="main" sx={{ position: 'relative', zIndex: 2, display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 'calc(100vh - 96px)', px: 2, pt: { xs: 3, md: 1 }, pb: 5 }}>
          <AuthCard maxWidth={680}>
            <AuthHeading
              emblem={<DropHeart size={44} />}
              title={t('auth.register.title')}
              subtitle={t('auth.register.subtitle')}
            />

            {/* Role tabs */}
            <Box role="tablist" aria-label={t('auth.register.accountType')} sx={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 1.25, mb: 3 }}>
              {ROLES.map((r) => {
                const active = role === r.id;
                return (
                  <Button key={r.id} role="tab" aria-selected={active} onClick={() => setRole(r.id)} startIcon={r.icon}
                    sx={{
                      py: 1, borderRadius: '10px', textTransform: 'none', fontWeight: 700, fontSize: { xs: '0.78rem', sm: '0.9rem' },
                      minWidth: 0, '& .MuiButton-startIcon': { mr: { xs: 0.5, sm: 1 } },
                      color: active ? '#fff' : 'text.primary', bgcolor: active ? RED : 'transparent',
                      border: '1px solid', borderColor: active ? RED : 'divider',
                      boxShadow: active ? '0 6px 16px rgba(201,29,50,0.28)' : 'none',
                      '&:hover': { bgcolor: active ? RED_DARK : 'action.hover' },
                    }}>
                    {t(`auth.register.${r.labelKey}`)}
                  </Button>
                );
              })}
            </Box>

            {role === 'staff' ? (
              <Box sx={{ textAlign: 'center', py: 3 }}>
                <Alert severity="info" sx={{ textAlign: 'left', borderRadius: 2, mb: 3 }}>{t('auth.register.staffNotice')}</Alert>
                <Button component={Link} href={STAFF_LOGIN} variant="contained"
                  sx={{ px: 4, py: 1.2, textTransform: 'none', fontWeight: 700, borderRadius: '10px', bgcolor: RED, '&:hover': { bgcolor: RED_DARK } }}>
                  {t('auth.register.staffCta')}
                </Button>
              </Box>
            ) : (
              <>
                <Box component="form" onSubmit={handleSubmit} sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  {error && <Alert severity="error" sx={{ borderRadius: 2 }}>{error}</Alert>}

                  <Box sx={grid}>
                    <AuthField label={t('auth.register.fullName')} name="fullName" placeholder={t('auth.register.fullNamePlaceholder')} autoComplete="name"
                      icon={<PersonOutline fontSize="small" />} value={form.fullName} onChange={handleChange} required />
                    <AuthField label={t('auth.register.dateOfBirth')} name="dateOfBirth" type="date" autoComplete="bday"
                      icon={<CalendarMonthOutlined fontSize="small" />} value={form.dateOfBirth} onChange={handleChange}
                      inputProps={{ max: today() }} />

                    <AuthField label={t('auth.register.email')} name="email" type="email" placeholder={t('auth.register.emailPlaceholder')} autoComplete="email"
                      icon={<MailOutline fontSize="small" />} value={form.email} onChange={handleChange} required />
                    <AuthField label={t('auth.register.password')} name="password" type="password" placeholder={t('auth.register.passwordPlaceholder')} autoComplete="new-password"
                      icon={<LockOutlined fontSize="small" />} value={form.password} onChange={handleChange} required />

                    <AuthField label={t('auth.register.phone')} name="phone" type="tel" placeholder={t('auth.register.phonePlaceholder')} autoComplete="tel"
                      icon={<PhoneOutlined fontSize="small" />} value={form.phone} onChange={handleChange} />
                    <AuthField label={t('auth.register.confirm')} name="confirm" type="password" placeholder={t('auth.register.confirmPlaceholder')} autoComplete="new-password"
                      icon={<LockOutlined fontSize="small" />} value={form.confirm} onChange={handleChange} required />
                  </Box>

                  <Box sx={{ ...grid, alignItems: 'stretch' }}>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                      <AuthField select label={t('auth.register.bloodType')} name="bloodType" value={form.bloodType} onChange={handleChange}
                        icon={<WaterDropOutlined fontSize="small" />}
                        selectProps={{ displayEmpty: true, renderValue: (v) => v || <Box component="span" sx={{ color: 'text.disabled' }}>{t('auth.register.bloodTypePlaceholder')}</Box> }}>
                        {BLOOD_TYPES.map((bt) => <MenuItem key={bt} value={bt}>{bt}</MenuItem>)}
                      </AuthField>

                      <Autocomplete
                        freeSolo disableClearable
                        options={PROVINCE_NAMES}
                        inputValue={form.location}
                        onInputChange={(_, value) => set('location', value)}
                        renderInput={(params) => (
                          <AuthField label={t('auth.register.location')} placeholder={t('auth.register.locationPlaceholder')} acParams={params}
                            icon={<PlaceOutlined fontSize="small" />} />
                        )}
                      />
                    </Box>

                    <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center', p: 2, borderRadius: '12px', bgcolor: (theme) => (theme.palette.mode === 'dark' ? 'rgba(201,29,50,0.12)' : '#FFF1F2') }}>
                      <Favorite sx={{ color: RED, fontSize: 30, flexShrink: 0 }} />
                      <Box>
                        <Typography sx={{ color: RED, fontWeight: 800, fontSize: '0.85rem' }}>{t('auth.register.safeTitle')}</Typography>
                        <Typography sx={{ color: 'text.secondary', fontSize: '0.75rem', lineHeight: 1.45, mt: 0.25 }}>
                          {rich('auth.register.safeText', { link: <Link href="/privacy" style={{ color: RED, fontWeight: 600 }}>{t('auth.register.privacy')}</Link> })}
                        </Typography>
                      </Box>
                    </Box>
                  </Box>

                  <PrimaryButton loading={loading} sx={{ mt: 0.5 }}>{t(loading ? 'auth.register.submitting' : 'auth.register.submit')}</PrimaryButton>
                </Box>

                <SocialButtons onError={(msg) => setError(msg)} />
              </>
            )}

            <Typography sx={{ textAlign: 'center', mt: 3, fontSize: '0.92rem', color: 'text.secondary' }}>
              {rich('auth.register.haveAccount', { link: <AuthLink href={`/login${authQuery}`}>{t('auth.register.login')}</AuthLink> })}
            </Typography>
          </AuthCard>
        </Box>
      </Box>
    </AuthFrame>
  );
};

export default UserSignUp;
