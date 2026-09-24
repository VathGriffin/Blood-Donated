'use client';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { Box, Typography, Alert, Checkbox, FormControlLabel } from '@mui/material';
import { MailOutline, LockOutlined } from '@mui/icons-material';
import axios from 'axios';
import { useUserAuth } from '@/store/UserAuthContext';
import API_BASE from '@/lib/config';
import { apiErrorMessage } from '@/lib/api-error';
import SocialButtons from '@/components/SocialButtons';
import DropHeart from '@/components/auth/DropHeart';
import { LoginArt } from '@/components/auth/AuthArt';
import {
  AuthFrame, AuthTopBar, AuthCard, AuthHeading, AuthField, PrimaryButton, AuthLink, TrustBadges, RED,
} from '@/components/auth/authUi';

const UserLogin = () => {
  const router = useRouter();
  const { login, isAuth } = useUserAuth();
  const [form, setForm] = useState({ email: '', password: '' });
  const [remember, setRemember] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isAuth) router.replace('/');
  }, [isAuth, router]);

  if (isAuth) return null;

  const handleChange = (e) => {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data } = await axios.post(`${API_BASE}/api/user/login`, form);
      login(data.token, data.user, { remember });
      router.push('/');
    } catch (err) {
      setError(apiErrorMessage(err, 'Login failed. Please try again.'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthFrame>
      <LoginArt />
      <AuthTopBar />

      <Box component="main" sx={{ position: 'relative', zIndex: 2, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: 'calc(100vh - 96px)', px: 2, pt: { xs: 3, md: 1 }, pb: 5 }}>
        <AuthCard>
          <AuthHeading
            emblem={<DropHeart size={46} />}
            title="Welcome Back"
            subtitle="Login to your account"
          />

          <Box component="form" onSubmit={handleSubmit} sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {error && <Alert severity="error" sx={{ borderRadius: 2 }}>{error}</Alert>}

            <AuthField
              hideLabel label="Email address" name="email" type="email" placeholder="Email address" autoComplete="email"
              icon={<MailOutline fontSize="small" />} value={form.email} onChange={handleChange} required
            />
            <AuthField
              hideLabel label="Password" name="password" type="password" placeholder="Password" autoComplete="current-password"
              icon={<LockOutlined fontSize="small" />} value={form.password} onChange={handleChange} required
            />

            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mt: -0.5 }}>
              <FormControlLabel
                control={<Checkbox size="small" checked={remember} onChange={(e) => setRemember(e.target.checked)} sx={{ color: RED, '&.Mui-checked': { color: RED } }} />}
                label={<Typography sx={{ fontSize: '0.85rem' }}>Remember me</Typography>}
              />
              <Link href="/forgot-password" style={{ color: RED, fontWeight: 600, textDecoration: 'none', fontSize: '0.85rem' }}>
                Forgot password?
              </Link>
            </Box>

            <PrimaryButton loading={loading}>{loading ? 'Logging in…' : 'Login'}</PrimaryButton>
          </Box>

          <SocialButtons onError={(msg) => setError(msg)} />

          <Typography sx={{ textAlign: 'center', mt: 3, fontSize: '0.92rem', color: 'text.secondary' }}>
            Don&apos;t have an account? <AuthLink href="/register">Register</AuthLink>
          </Typography>
        </AuthCard>

        <Typography sx={{ mt: 2.5, fontSize: '0.8rem', color: 'text.secondary', textAlign: 'center' }}>
          Hospital staff? <AuthLink href="/hospital/login">Staff login</AuthLink>
        </Typography>

        <TrustBadges />
      </Box>
    </AuthFrame>
  );
};

export default UserLogin;
