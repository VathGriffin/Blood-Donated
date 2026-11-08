'use client';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import {
  Box, TextField, Button, InputAdornment, IconButton, CircularProgress,
} from '@mui/material';
import { Visibility, VisibilityOff, Lock, Email, LocalHospital } from '@mui/icons-material';
import axios from 'axios';
import { useAuth } from '@/store/AuthContext';
import { useT } from '@/i18n/I18nProvider';
import API_BASE from '@/lib/config';
import { apiErrorMessage } from '@/lib/api-error';
import HospitalAuthShell, { ErrorAlert, fieldSx, primaryButtonSx, linkSx } from '../_components/HospitalAuthShell';

export default function HospitalLogin() {
    const router = useRouter();
    const { login, isHospitalStaff } = useAuth();
    const t = useT();
    const [form, setForm] = useState({ email: '', password: '' });
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        if (isHospitalStaff) router.replace('/dashboard/hospital');
    }, [isHospitalStaff, router]);

    if (isHospitalStaff) return null;

    const handleChange = (e) => {
        setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
        setError('');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        try {
            const { data } = await axios.post(`${API_BASE}/api/staff/login`, form);
            if (data.staff.role !== 'hospital_staff') {
                setError(t('auth.hospital.login.notStaff'));
                return;
            }
            login(data.token, data.staff);
            router.push('/dashboard/hospital', { replace: true });
        } catch (err) {
            setError(apiErrorMessage(err, t('auth.hospital.login.failed')));
        } finally {
            setLoading(false);
        }
    };

    return (
        <HospitalAuthShell icon={<LocalHospital />} title={t('auth.hospital.login.title')} subtitle={t('auth.hospital.login.subtitle')}>
            <ErrorAlert>{error}</ErrorAlert>
            <Box component="form" onSubmit={handleSubmit} noValidate>
                <TextField
                    fullWidth label={t('auth.hospital.login.email')} name="email" type="email" value={form.email}
                    onChange={handleChange} required size="small" autoComplete="username"
                    sx={{ mb: 2.5, ...fieldSx }}
                    InputProps={{ startAdornment: <InputAdornment position="start"><Email fontSize="small" sx={{ color: 'text.disabled' }} /></InputAdornment> }}
                />
                <TextField
                    fullWidth label={t('auth.hospital.login.password')} name="password" type={showPassword ? 'text' : 'password'}
                    value={form.password} onChange={handleChange} required size="small" autoComplete="current-password"
                    sx={{ mb: 1, ...fieldSx }}
                    InputProps={{
                        startAdornment: <InputAdornment position="start"><Lock fontSize="small" sx={{ color: 'text.disabled' }} /></InputAdornment>,
                        endAdornment: (
                            <InputAdornment position="end">
                                <IconButton size="small" onClick={() => setShowPassword((v) => !v)} edge="end"
                                    aria-label={t(showPassword ? 'auth.hidePassword' : 'auth.showPassword')}>
                                    {showPassword ? <VisibilityOff fontSize="small" /> : <Visibility fontSize="small" />}
                                </IconButton>
                            </InputAdornment>
                        ),
                    }}
                />
                <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2.5 }}>
                    <Box component={Link} href="/hospital/forgot-password" sx={linkSx}>{t('auth.login.forgot')}</Box>
                </Box>
                <Button type="submit" fullWidth variant="contained" size="large" disabled={loading} sx={primaryButtonSx}>
                    {loading ? <CircularProgress size={22} color="inherit" /> : t('auth.hospital.login.submit')}
                </Button>
            </Box>
        </HospitalAuthShell>
    );
}
