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
import API_BASE from '@/lib/config';
import { apiErrorMessage } from '@/lib/api-error';
import HospitalAuthShell, { ErrorAlert, fieldSx, primaryButtonSx, linkSx } from '../_components/HospitalAuthShell';

export default function HospitalLogin() {
    const router = useRouter();
    const { login, isHospitalStaff } = useAuth();
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
                setError('This account is not a hospital staff account.');
                return;
            }
            login(data.token, data.staff);
            router.push('/dashboard/hospital', { replace: true });
        } catch (err) {
            setError(apiErrorMessage(err, 'Login failed. Try again.'));
        } finally {
            setLoading(false);
        }
    };

    return (
        <HospitalAuthShell icon={<LocalHospital />} title="Hospital Sign In" subtitle="Access your hospital dashboard">
            <ErrorAlert>{error}</ErrorAlert>
            <Box component="form" onSubmit={handleSubmit} noValidate>
                <TextField
                    fullWidth label="Email Address" name="email" type="email" value={form.email}
                    onChange={handleChange} required size="small" autoComplete="username"
                    sx={{ mb: 2.5, ...fieldSx }}
                    InputProps={{ startAdornment: <InputAdornment position="start"><Email fontSize="small" sx={{ color: 'text.disabled' }} /></InputAdornment> }}
                />
                <TextField
                    fullWidth label="Password" name="password" type={showPassword ? 'text' : 'password'}
                    value={form.password} onChange={handleChange} required size="small" autoComplete="current-password"
                    sx={{ mb: 1, ...fieldSx }}
                    InputProps={{
                        startAdornment: <InputAdornment position="start"><Lock fontSize="small" sx={{ color: 'text.disabled' }} /></InputAdornment>,
                        endAdornment: (
                            <InputAdornment position="end">
                                <IconButton size="small" onClick={() => setShowPassword((v) => !v)} edge="end"
                                    aria-label={showPassword ? 'Hide password' : 'Show password'}>
                                    {showPassword ? <VisibilityOff fontSize="small" /> : <Visibility fontSize="small" />}
                                </IconButton>
                            </InputAdornment>
                        ),
                    }}
                />
                <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2.5 }}>
                    <Box component={Link} href="/hospital/forgot-password" sx={linkSx}>Forgot password?</Box>
                </Box>
                <Button type="submit" fullWidth variant="contained" size="large" disabled={loading} sx={primaryButtonSx}>
                    {loading ? <CircularProgress size={22} color="inherit" /> : 'Sign In to Hospital Portal'}
                </Button>
            </Box>
        </HospitalAuthShell>
    );
}
