'use client';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import {
  Box, Paper, Typography, TextField, Button, InputAdornment, IconButton, Alert, CircularProgress,
} from '@mui/material';
import {
  Visibility, VisibilityOff, Lock, Email, LocalHospital, Favorite, CheckCircle, QrCodeScanner,
  Inventory2, EventAvailable,
} from '@mui/icons-material';
import axios from 'axios';
import { useAuth } from '@/store/AuthContext';
import API_BASE from '@/lib/config';

const capabilities = [
    { icon: <EventAvailable sx={{ fontSize: 17 }} />, text: 'Confirm and check in appointments' },
    { icon: <Inventory2 sx={{ fontSize: 17 }} />, text: "Manage your hospital's blood stock" },
    { icon: <QrCodeScanner sx={{ fontSize: 17 }} />, text: 'Scan donor QR codes at check-in' },
];

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
            setError(err.response?.data?.message || 'Login failed. Try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: '#f5f5f5' }}>
            <Box sx={{
                display: { xs: 'none', md: 'flex' }, width: '45%', flexShrink: 0,
                position: 'relative', flexDirection: 'column', justifyContent: 'space-between', p: 5,
                background: 'linear-gradient(160deg, #0d1b2a 0%, #1b3a4b 60%, #1565c0 100%)',
            }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    <Box sx={{
                        width: 46, height: 46, borderRadius: 2.5, bgcolor: 'rgba(255,255,255,0.15)',
                        backdropFilter: 'blur(6px)', border: '1.5px solid rgba(255,255,255,0.25)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                        <Favorite sx={{ color: '#bbdefb', fontSize: 24 }} />
                    </Box>
                    <Box>
                        <Typography fontWeight={800} fontSize="1.05rem" color="white" lineHeight={1.2}>BloodLife</Typography>
                        <Typography fontSize="0.72rem" sx={{ color: 'rgba(255,255,255,0.6)', fontWeight: 600, letterSpacing: '0.08em' }}>
                            HOSPITAL PORTAL
                        </Typography>
                    </Box>
                </Box>

                <Box>
                    <Typography fontWeight={900} fontSize={{ md: '2rem', lg: '2.3rem' }} color="white" lineHeight={1.2} mb={1.5}>
                        Your Hospital's<br />Blood Operations
                    </Typography>
                    <Typography fontSize="0.95rem" sx={{ color: 'rgba(255,255,255,0.7)', lineHeight: 1.7, mb: 4 }}>
                        Manage requests, inventory, and donor check-ins for your facility.
                    </Typography>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                        {capabilities.map((c, i) => (
                            <Box key={i} sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                                <Box sx={{
                                    width: 32, height: 32, borderRadius: 1.5, bgcolor: 'rgba(255,255,255,0.12)',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#bbdefb', flexShrink: 0,
                                }}>{c.icon}</Box>
                                <Typography fontSize="0.875rem" color="rgba(255,255,255,0.85)" fontWeight={500}>{c.text}</Typography>
                                <CheckCircle sx={{ fontSize: 15, color: 'rgba(255,255,255,0.35)', ml: 'auto', flexShrink: 0 }} />
                            </Box>
                        ))}
                    </Box>
                </Box>

                <Typography fontSize="0.72rem" sx={{ color: 'rgba(255,255,255,0.3)', fontWeight: 600, letterSpacing: '0.06em' }}>
                    © 2026 ITC CAMBODIA · DATA SCIENCE 4TH YEAR
                </Typography>
            </Box>

            <Box sx={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', p: { xs: 2, sm: 4 } }}>
                <Box sx={{ width: '100%', maxWidth: 440 }}>
                    <Paper elevation={0} sx={{ borderRadius: 4, overflow: 'hidden', border: '1px solid #ebebeb', bgcolor: '#fff' }}>
                        <Box sx={{
                            background: 'linear-gradient(135deg, #0d47a1 0%, #1565c0 100%)',
                            px: 4, py: 3.5, display: 'flex', alignItems: 'center', gap: 2,
                        }}>
                            <Box sx={{
                                width: 48, height: 48, borderRadius: 2.5, bgcolor: 'rgba(255,255,255,0.15)',
                                border: '1.5px solid rgba(255,255,255,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                            }}>
                                <LocalHospital sx={{ color: '#fff', fontSize: 26 }} />
                            </Box>
                            <Box>
                                <Typography fontWeight={800} fontSize="1.2rem" color="white" lineHeight={1.2}>Hospital Sign In</Typography>
                                <Typography fontSize="0.8rem" sx={{ color: 'rgba(255,255,255,0.7)' }}>Access your hospital dashboard</Typography>
                            </Box>
                        </Box>

                        <Box sx={{ p: { xs: 3, sm: 4 } }}>
                            {error && <Alert severity="error" sx={{ mb: 2.5, borderRadius: 2, fontSize: '0.82rem' }}>{error}</Alert>}
                            <Box component="form" onSubmit={handleSubmit} noValidate>
                                <TextField
                                    fullWidth label="Email Address" name="email" type="email" value={form.email}
                                    onChange={handleChange} required size="small"
                                    sx={{ mb: 2.5, '& .MuiOutlinedInput-root': { borderRadius: 2.5 } }}
                                    InputProps={{ startAdornment: <InputAdornment position="start"><Email fontSize="small" sx={{ color: 'text.disabled' }} /></InputAdornment> }}
                                />
                                <TextField
                                    fullWidth label="Password" name="password" type={showPassword ? 'text' : 'password'}
                                    value={form.password} onChange={handleChange} required size="small"
                                    sx={{ mb: 3.5, '& .MuiOutlinedInput-root': { borderRadius: 2.5 } }}
                                    InputProps={{
                                        startAdornment: <InputAdornment position="start"><Lock fontSize="small" sx={{ color: 'text.disabled' }} /></InputAdornment>,
                                        endAdornment: (
                                            <InputAdornment position="end">
                                                <IconButton size="small" onClick={() => setShowPassword((v) => !v)} edge="end">
                                                    {showPassword ? <VisibilityOff fontSize="small" /> : <Visibility fontSize="small" />}
                                                </IconButton>
                                            </InputAdornment>
                                        ),
                                    }}
                                />
                                <Button type="submit" fullWidth variant="contained" size="large" disabled={loading}
                                    sx={{
                                        borderRadius: 2.5, fontWeight: 700, fontSize: '0.95rem', py: 1.4, textTransform: 'none',
                                        background: 'linear-gradient(135deg, #0d47a1 0%, #1565c0 100%)',
                                        boxShadow: '0 4px 16px rgba(13,71,161,0.35)',
                                        '&:hover': { background: 'linear-gradient(135deg, #0a3880 0%, #1257a8 100%)' },
                                    }}>
                                    {loading ? <CircularProgress size={22} color="inherit" /> : 'Sign In to Hospital Portal'}
                                </Button>
                            </Box>
                        </Box>
                    </Paper>
                    <Typography variant="caption" color="text.disabled" sx={{ display: 'block', textAlign: 'center', mt: 2.5 }}>
                        Hospital staff only · accounts are created by BloodLife admins
                    </Typography>
                </Box>
            </Box>
        </Box>
    );
}
