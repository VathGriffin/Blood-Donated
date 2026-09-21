'use client';
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
import { PROVINCES } from '@/lib/places';
import SocialButtons from '@/components/SocialButtons';
import DropHeart from '@/components/auth/DropHeart';
import { RegisterPanel } from '@/components/auth/AuthArt';
import {
  AuthFrame, AuthTopBar, AuthCard, AuthHeading, AuthField, PrimaryButton, AuthLink, RED, RED_DARK,
} from '@/components/auth/authUi';

const BLOOD_TYPES = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
const PROVINCE_NAMES = PROVINCES.map((p) => p.name);
const PANEL_WIDTH = 300;

const ROLES = [
  { id: 'donor', label: 'Registration', icon: <PersonOutline fontSize="small" /> },
  { id: 'staff', label: 'Hospital Staff', icon: <LocalHospitalOutlined fontSize="small" /> },
];

// Hospital staff accounts are provisioned by an administrator, never self-registered.
// (There is deliberately no admin option on this public page.)
const STAFF_NOTICE = {
  text: 'Hospital staff accounts are created by the platform administrator for each partner hospital, so they can’t be self-registered.',
  href: '/hospital/login',
  cta: 'Go to Hospital Staff Login',
};

const today = () => new Date().toISOString().slice(0, 10);

const UserSignUp = () => {
  const router = useRouter();
  const { login, isAuth } = useUserAuth();
  const [role, setRole] = useState('donor');
  const [form, setForm] = useState({
    fullName: '', dateOfBirth: '', email: '', password: '', phone: '', confirm: '', bloodType: '', location: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isAuth) router.replace('/notification');
  }, [isAuth, router]);

  if (isAuth) return null;

  const set = (name, value) => { setForm((f) => ({ ...f, [name]: value })); setError(''); };
  const handleChange = (e) => set(e.target.name, e.target.value);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!/\S+@\S+\.\S+/.test(form.email)) { setError('Please enter a valid email address.'); return; }
    if (form.password.length < 6) { setError('Password must be at least 6 characters.'); return; }
    if (form.password !== form.confirm) { setError('Passwords do not match.'); return; }
    if (form.dateOfBirth && form.dateOfBirth > today()) { setError('Date of birth can’t be in the future.'); return; }
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
      router.push('/notification');
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed. Please try again.');
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
              title="Create an Account"
              subtitle="Join our community and be a hero"
            />

            {/* Role tabs */}
            <Box role="tablist" aria-label="Account type" sx={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 1.25, mb: 3 }}>
              {ROLES.map((r) => {
                const active = role === r.id;
                return (
                  <Button key={r.id} role="tab" aria-selected={active} onClick={() => setRole(r.id)} startIcon={r.icon}
                    sx={{
                      py: 1, borderRadius: '10px', textTransform: 'none', fontWeight: 700, fontSize: { xs: '0.78rem', sm: '0.9rem' },
                      minWidth: 0, '& .MuiButton-startIcon': { mr: { xs: 0.5, sm: 1 } },
                      color: active ? '#fff' : 'text.primary', bgcolor: active ? RED : 'transparent',
                      border: '1px solid', borderColor: active ? RED : 'divider',
                      boxShadow: active ? '0 6px 16px rgba(198,40,40,0.28)' : 'none',
                      '&:hover': { bgcolor: active ? RED_DARK : 'action.hover' },
                    }}>
                    {r.label}
                  </Button>
                );
              })}
            </Box>

            {role === 'staff' ? (
              <Box sx={{ textAlign: 'center', py: 3 }}>
                <Alert severity="info" sx={{ textAlign: 'left', borderRadius: 2, mb: 3 }}>{STAFF_NOTICE.text}</Alert>
                <Button component={Link} href={STAFF_NOTICE.href} variant="contained"
                  sx={{ px: 4, py: 1.2, textTransform: 'none', fontWeight: 700, borderRadius: '10px', bgcolor: RED, '&:hover': { bgcolor: RED_DARK } }}>
                  {STAFF_NOTICE.cta}
                </Button>
              </Box>
            ) : (
              <>
                <Box component="form" onSubmit={handleSubmit} sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  {error && <Alert severity="error" sx={{ borderRadius: 2 }}>{error}</Alert>}

                  <Box sx={grid}>
                    <AuthField label="Full Name" name="fullName" placeholder="Enter your full name" autoComplete="name"
                      icon={<PersonOutline fontSize="small" />} value={form.fullName} onChange={handleChange} required />
                    <AuthField label="Date of Birth" name="dateOfBirth" type="date" autoComplete="bday"
                      icon={<CalendarMonthOutlined fontSize="small" />} value={form.dateOfBirth} onChange={handleChange}
                      inputProps={{ max: today() }} />

                    <AuthField label="Email Address" name="email" type="email" placeholder="Enter your email" autoComplete="email"
                      icon={<MailOutline fontSize="small" />} value={form.email} onChange={handleChange} required />
                    <AuthField label="Password" name="password" type="password" placeholder="At least 6 characters" autoComplete="new-password"
                      icon={<LockOutlined fontSize="small" />} value={form.password} onChange={handleChange} required />

                    <AuthField label="Phone Number" name="phone" type="tel" placeholder="Enter your phone number" autoComplete="tel"
                      icon={<PhoneOutlined fontSize="small" />} value={form.phone} onChange={handleChange} />
                    <AuthField label="Confirm Password" name="confirm" type="password" placeholder="Confirm your password" autoComplete="new-password"
                      icon={<LockOutlined fontSize="small" />} value={form.confirm} onChange={handleChange} required />
                  </Box>

                  <Box sx={{ ...grid, alignItems: 'stretch' }}>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                      <AuthField select label="Blood Type" name="bloodType" value={form.bloodType} onChange={handleChange}
                        icon={<WaterDropOutlined fontSize="small" />}
                        selectProps={{ displayEmpty: true, renderValue: (v) => v || <Box component="span" sx={{ color: 'text.disabled' }}>Select your blood type</Box> }}>
                        {BLOOD_TYPES.map((bt) => <MenuItem key={bt} value={bt}>{bt}</MenuItem>)}
                      </AuthField>

                      <Autocomplete
                        freeSolo disableClearable
                        options={PROVINCE_NAMES}
                        inputValue={form.location}
                        onInputChange={(_, value) => set('location', value)}
                        renderInput={(params) => (
                          <AuthField label="Location" placeholder="Enter your location" acParams={params}
                            icon={<PlaceOutlined fontSize="small" />} />
                        )}
                      />
                    </Box>

                    <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center', p: 2, borderRadius: '12px', bgcolor: (t) => (t.palette.mode === 'dark' ? 'rgba(198,40,40,0.12)' : '#fdeeee') }}>
                      <Favorite sx={{ color: RED, fontSize: 30, flexShrink: 0 }} />
                      <Box>
                        <Typography sx={{ color: RED, fontWeight: 800, fontSize: '0.85rem' }}>Your information is safe with us</Typography>
                        <Typography sx={{ color: 'text.secondary', fontSize: '0.75rem', lineHeight: 1.45, mt: 0.25 }}>
                          We protect your personal data and only use it for blood donation purposes.{' '}
                          <Link href="/privacy" style={{ color: RED, fontWeight: 600 }}>Privacy Policy</Link>
                        </Typography>
                      </Box>
                    </Box>
                  </Box>

                  <PrimaryButton loading={loading} sx={{ mt: 0.5 }}>{loading ? 'Creating account…' : 'Create Account'}</PrimaryButton>
                </Box>

                <SocialButtons onError={(msg) => setError(msg)} />
              </>
            )}

            <Typography sx={{ textAlign: 'center', mt: 3, fontSize: '0.92rem', color: 'text.secondary' }}>
              Already have an account? <AuthLink href="/login">Login</AuthLink>
            </Typography>
          </AuthCard>
        </Box>
      </Box>
    </AuthFrame>
  );
};

export default UserSignUp;
