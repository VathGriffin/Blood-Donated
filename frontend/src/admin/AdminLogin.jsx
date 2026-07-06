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
} from '@mui/material';
import {
    Visibility,
    VisibilityOff,
    Lock,
    Email,
    AdminPanelSettings,
    Favorite,
    CheckCircle,
    Shield,
    BarChart,
    ManageAccounts,
    Inventory2,
} from '@mui/icons-material';
import { useNavigate, Navigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import API_BASE from '../config';

const SIDE_IMG =
    'https://images.unsplash.com/photo-1538108149393-fbbd81895907?auto=format&fit=crop&w=1200&q=80';

const capabilities = [
    { icon: <BarChart sx={{ fontSize: 17 }} />, text: 'Monitor donations & blood inventory' },
    { icon: <ManageAccounts sx={{ fontSize: 17 }} />, text: 'Manage donors and requests' },
    { icon: <Inventory2 sx={{ fontSize: 17 }} />, text: 'Control blood stock levels' },
    { icon: <Shield sx={{ fontSize: 17 }} />, text: 'Secure data management' },
];

const AdminLogin = () => {
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
            const { data } = await axios.post(`${API_BASE}/api/auth/login`, form);
            login(data.token);
            navigate('/admin/dashboard', { replace: true });
        } catch (err) {
            setError(err.response?.data?.message || 'Login failed. Try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Box sx={{ display: 'flex', minHeight: '100vh' }}>
            {/* Left photo panel — desktop only */}
            <Box
                sx={{
                    display: { xs: 'none', md: 'flex' },
                    width: '45%',
                    flexShrink: 0,
                    position: 'relative',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    p: 5,
                    backgroundImage: `url(${SIDE_IMG})`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    '&::before': {
                        content: '""',
                        position: 'absolute',
                        inset: 0,
                        background:
                            'linear-gradient(160deg, rgba(26,0,0,0.92) 0%, rgba(127,0,0,0.85) 60%, rgba(183,28,28,0.78) 100%)',
                        zIndex: 0,
                    },
                }}
            >
                {/* Brand mark */}
                <Box sx={{ position: 'relative', zIndex: 1 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                        <Box sx={{
                            width: 46, height: 46, borderRadius: 2.5,
                            bgcolor: 'rgba(255,255,255,0.15)',
                            backdropFilter: 'blur(6px)',
                            border: '1.5px solid rgba(255,255,255,0.25)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                        }}>
                            <Favorite sx={{ color: '#ffcdd2', fontSize: 24 }} />
                        </Box>
                        <Box>
                            <Typography fontWeight={800} fontSize="1.05rem" color="white" lineHeight={1.2}>
                                Blood Donated
                            </Typography>
                            <Typography fontSize="0.72rem" sx={{ color: 'rgba(255,255,255,0.55)', fontWeight: 600, letterSpacing: '0.08em' }}>
                                ADMIN PORTAL
                            </Typography>
                        </Box>
                    </Box>
                </Box>

                {/* Center content */}
                <Box sx={{ position: 'relative', zIndex: 1 }}>
                    <Box sx={{
                        display: 'inline-flex', alignItems: 'center', gap: 1,
                        bgcolor: 'rgba(255,255,255,0.12)', backdropFilter: 'blur(6px)',
                        border: '1px solid rgba(255,255,255,0.2)',
                        borderRadius: 2, px: 1.5, py: 0.6, mb: 3,
                    }}>
                        <Shield sx={{ fontSize: 14, color: '#ffcdd2' }} />
                        <Typography fontSize="0.72rem" fontWeight={700} color="rgba(255,255,255,0.85)" letterSpacing="0.06em">
                            SECURE ADMIN ACCESS
                        </Typography>
                    </Box>

                    <Typography fontWeight={900} fontSize={{ md: '2rem', lg: '2.3rem' }} color="white" lineHeight={1.2} mb={1.5}>
                        Manage Every<br />Drop That Matters
                    </Typography>
                    <Typography fontSize="0.95rem" sx={{ color: 'rgba(255,255,255,0.65)', lineHeight: 1.7, mb: 4 }}>
                        Full control of the blood donation network — donors, requests, inventory, and lives saved.
                    </Typography>

                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                        {capabilities.map((c, i) => (
                            <Box key={i} sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                                <Box sx={{
                                    width: 32, height: 32, borderRadius: 1.5,
                                    bgcolor: 'rgba(255,255,255,0.12)',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    color: '#ffcdd2', flexShrink: 0,
                                }}>
                                    {c.icon}
                                </Box>
                                <Typography fontSize="0.875rem" color="rgba(255,255,255,0.82)" fontWeight={500}>
                                    {c.text}
                                </Typography>
                                <CheckCircle sx={{ fontSize: 15, color: 'rgba(255,255,255,0.35)', ml: 'auto', flexShrink: 0 }} />
                            </Box>
                        ))}
                    </Box>
                </Box>

                {/* Footer */}
                <Box sx={{ position: 'relative', zIndex: 1 }}>
                    <Typography fontSize="0.72rem" sx={{ color: 'rgba(255,255,255,0.3)', fontWeight: 600, letterSpacing: '0.06em' }}>
                        © 2025 ITC CAMBODIA · DATA SCIENCE 4TH YEAR
                    </Typography>
                </Box>
            </Box>

            {/* Right form panel */}
            <Box sx={{
                flex: 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                p: { xs: 2, sm: 4 },
                bgcolor: '#f5f5f5',
            }}>
                <Box sx={{ width: '100%', maxWidth: 440 }}>
                    {/* Mobile brand mark */}
                    <Box sx={{ display: { xs: 'flex', md: 'none' }, alignItems: 'center', gap: 1.5, justifyContent: 'center', mb: 3 }}>
                        <Box sx={{
                            width: 44, height: 44, borderRadius: 2.5,
                            background: 'linear-gradient(135deg, #7f0000, #b71c1c)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                        }}>
                            <Favorite sx={{ color: '#fff', fontSize: 22 }} />
                        </Box>
                        <Box>
                            <Typography fontWeight={800} fontSize="1rem" color="error.main" lineHeight={1.2}>
                                Blood Donated
                            </Typography>
                            <Typography fontSize="0.7rem" color="text.secondary" fontWeight={600} letterSpacing="0.06em">
                                ADMIN PORTAL
                            </Typography>
                        </Box>
                    </Box>

                    <Paper elevation={0} sx={{
                        borderRadius: 4,
                        overflow: 'hidden',
                        border: '1px solid #ebebeb',
                        bgcolor: '#fff',
                    }}>
                        {/* Card header */}
                        <Box sx={{
                            background: 'linear-gradient(135deg, #7f0000 0%, #b71c1c 100%)',
                            px: 4, py: 3.5,
                            display: 'flex', alignItems: 'center', gap: 2,
                        }}>
                            <Box sx={{
                                width: 48, height: 48, borderRadius: 2.5,
                                bgcolor: 'rgba(255,255,255,0.15)',
                                border: '1.5px solid rgba(255,255,255,0.25)',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                            }}>
                                <AdminPanelSettings sx={{ color: '#fff', fontSize: 26 }} />
                            </Box>
                            <Box>
                                <Typography fontWeight={800} fontSize="1.2rem" color="white" lineHeight={1.2}>
                                    Admin Sign In
                                </Typography>
                                <Typography fontSize="0.8rem" sx={{ color: 'rgba(255,255,255,0.7)' }}>
                                    Access the management dashboard
                                </Typography>
                            </Box>
                        </Box>

                        {/* Form body */}
                        <Box sx={{ p: { xs: 3, sm: 4 } }}>
                            {error && (
                                <Alert severity="error" sx={{ mb: 2.5, borderRadius: 2, fontSize: '0.82rem' }}>
                                    {error}
                                </Alert>
                            )}

                            <Box component="form" onSubmit={handleSubmit} noValidate>
                                <TextField
                                    fullWidth
                                    label="Email Address"
                                    name="email"
                                    type="email"
                                    value={form.email}
                                    onChange={handleChange}
                                    required
                                    size="small"
                                    sx={{ mb: 2.5, '& .MuiOutlinedInput-root': { borderRadius: 2.5 } }}
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
                                    sx={{ mb: 3.5, '& .MuiOutlinedInput-root': { borderRadius: 2.5 } }}
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
                                    size="large"
                                    disabled={loading}
                                    sx={{
                                        borderRadius: 2.5,
                                        fontWeight: 700,
                                        fontSize: '0.95rem',
                                        py: 1.4,
                                        textTransform: 'none',
                                        background: 'linear-gradient(135deg, #7f0000 0%, #b71c1c 100%)',
                                        boxShadow: '0 4px 16px rgba(127,0,0,0.35)',
                                        '&:hover': {
                                            background: 'linear-gradient(135deg, #5c0000 0%, #9a1616 100%)',
                                            boxShadow: '0 6px 20px rgba(127,0,0,0.45)',
                                        },
                                    }}
                                >
                                    {loading ? <CircularProgress size={22} color="inherit" /> : 'Sign In to Admin'}
                                </Button>
                            </Box>
                        </Box>
                    </Paper>

                    <Typography variant="caption" color="text.disabled" sx={{ display: 'block', textAlign: 'center', mt: 2.5 }}>
                        Authorized personnel only · Blood Donated Admin
                    </Typography>
                </Box>
            </Box>
        </Box>
    );
};

export default AdminLogin;
