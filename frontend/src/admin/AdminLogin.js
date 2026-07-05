import React, { useState } from 'react';
import {
    Box,
    Paper,
    Typography,
    TextField,
    Button,
    InputAdornment,
    IconButton,
    Alert,
    CircularProgress,
    useTheme,
} from '@mui/material';
import { Visibility, VisibilityOff, Bloodtype, Lock, Email } from '@mui/icons-material';
import { useNavigate, Navigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

const AdminLogin = () => {
    const theme = useTheme();
    const isDark = theme.palette.mode === 'dark';
    const navigate = useNavigate();
    const { login, isAuth } = useAuth();

    const [form, setForm] = useState({ email: '', password: '' });
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    if (isAuth) return <Navigate to="/admin/dashboard" replace />;

    const handleChange = (e) => {
        setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
        setError('');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        try {
            const { data } = await axios.post('http://localhost:3001/api/auth/login', form);
            login(data.token);
            navigate('/admin/dashboard', { replace: true });
        } catch (err) {
            setError(err.response?.data?.message || 'Login failed. Try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Box
            sx={{
                minHeight: '100vh',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                bgcolor: isDark ? '#0a0a0a' : '#f5f5f5',
                px: 2,
            }}
        >
            <Paper
                elevation={0}
                sx={{
                    width: '100%',
                    maxWidth: 420,
                    p: { xs: 3, sm: 4.5 },
                    borderRadius: 4,
                    border: `1px solid ${isDark ? '#1e1e1e' : '#ebebeb'}`,
                    bgcolor: isDark ? '#111' : '#fff',
                }}
            >
                {/* Logo */}
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 4 }}>
                    <Box sx={{
                        width: 44,
                        height: 44,
                        borderRadius: 2.5,
                        bgcolor: '#b71c1c',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                    }}>
                        <Bloodtype sx={{ color: '#fff', fontSize: 24 }} />
                    </Box>
                    <Box>
                        <Typography fontWeight={800} fontSize="1rem" color="error.main" lineHeight={1.1}>
                            Blood Donated
                        </Typography>
                        <Typography variant="caption" color="text.secondary" fontWeight={500}>
                            Admin Panel
                        </Typography>
                    </Box>
                </Box>

                <Typography fontWeight={800} fontSize="1.4rem" mb={0.5}>
                    Welcome back
                </Typography>
                <Typography color="text.secondary" fontSize="0.875rem" mb={3}>
                    Sign in to access the admin dashboard
                </Typography>

                {error && (
                    <Alert severity="error" sx={{ mb: 2.5, borderRadius: 2, fontSize: '0.82rem' }}>
                        {error}
                    </Alert>
                )}

                <Box component="form" onSubmit={handleSubmit} noValidate>
                    <TextField
                        fullWidth
                        label="Email"
                        name="email"
                        type="email"
                        value={form.email}
                        onChange={handleChange}
                        required
                        size="small"
                        sx={{ mb: 2 }}
                        InputProps={{
                            startAdornment: (
                                <InputAdornment position="start">
                                    <Email fontSize="small" sx={{ color: 'text.disabled' }} />
                                </InputAdornment>
                            ),
                        }}
                    />

                    <TextField
                        fullWidth
                        label="Password"
                        name="password"
                        type={showPassword ? 'text' : 'password'}
                        value={form.password}
                        onChange={handleChange}
                        required
                        size="small"
                        sx={{ mb: 3 }}
                        InputProps={{
                            startAdornment: (
                                <InputAdornment position="start">
                                    <Lock fontSize="small" sx={{ color: 'text.disabled' }} />
                                </InputAdornment>
                            ),
                            endAdornment: (
                                <InputAdornment position="end">
                                    <IconButton size="small" onClick={() => setShowPassword((v) => !v)} edge="end">
                                        {showPassword ? <VisibilityOff fontSize="small" /> : <Visibility fontSize="small" />}
                                    </IconButton>
                                </InputAdornment>
                            ),
                        }}
                    />

                    <Button
                        type="submit"
                        fullWidth
                        variant="contained"
                        color="error"
                        size="large"
                        disabled={loading}
                        sx={{
                            borderRadius: 2.5,
                            fontWeight: 700,
                            fontSize: '0.9rem',
                            py: 1.3,
                            textTransform: 'none',
                            boxShadow: '0 4px 14px rgba(183,28,28,0.35)',
                        }}
                    >
                        {loading ? <CircularProgress size={22} color="inherit" /> : 'Sign In'}
                    </Button>
                </Box>
            </Paper>
        </Box>
    );
};

export default AdminLogin;
