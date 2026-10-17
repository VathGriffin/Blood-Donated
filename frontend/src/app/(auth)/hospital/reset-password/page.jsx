'use client';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import {
  Box, Button, CircularProgress, IconButton, InputAdornment, LinearProgress, TextField, Typography,
} from '@mui/material';
import { Lock, LockReset, Visibility, VisibilityOff, CheckCircle, LinkOff } from '@mui/icons-material';
import axios from 'axios';
import API_BASE from '@/lib/config';
import { apiErrorMessage } from '@/lib/api-error';
import HospitalAuthShell, { ErrorAlert, ResultPanel, fieldSx, primaryButtonSx } from '../_components/HospitalAuthShell';

const MIN = 8;  // same rules as the backend
const MAX = 72;

const LEVELS = [
    { label: 'Too short', color: '#d32f2f' }, { label: 'Weak', color: '#d32f2f' }, { label: 'Fair', color: '#ed6c02' },
    { label: 'Good', color: '#1565c0' }, { label: 'Strong', color: '#2e7d32' }, { label: 'Very strong', color: '#2e7d32' },
];

// Rough guide only (0 = too short … 5 = very strong); the server enforces the length rules.
function strength(pw) {
    if (pw.length < MIN) return 0;
    return [pw.length >= MIN, pw.length >= 12, /[a-z]/.test(pw) && /[A-Z]/.test(pw), /\d/.test(pw), /[^A-Za-z0-9]/.test(pw)]
        .filter(Boolean).length;
}

export default function HospitalResetPassword() {
    const [token, setToken] = useState(null);
    const [phase, setPhase] = useState('checking'); // checking | ready | invalid | done
    const [form, setForm] = useState({ password: '', confirm: '' });
    const [show, setShow] = useState(false);
    const [touched, setTouched] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [doneMessage, setDoneMessage] = useState('');

    // The emailed link carries the token in the URL fragment (#token=…), which browsers never send
    // to a server. Read it once, then drop it from the address bar and history.
    useEffect(() => {
        const t = new URLSearchParams(window.location.hash.slice(1)).get('token');
        if (window.location.hash) window.history.replaceState(null, '', window.location.pathname);
        if (!t) { setPhase('invalid'); return; }
        setToken(t);
        axios.post(`${API_BASE}/api/staff/password-reset/verify`, { token: t })
            .then(({ data }) => setPhase(data.valid ? 'ready' : 'invalid'))
            .catch((err) => { setError(apiErrorMessage(err, 'Could not check this link. Try again shortly.')); setPhase('ready'); });
    }, []);

    const passwordProblem = form.password.length < MIN ? `Use at least ${MIN} characters.`
        : new TextEncoder().encode(form.password).length > MAX ? `Use at most ${MAX} characters.` : '';
    const confirmProblem = form.confirm !== form.password ? 'The passwords don’t match.' : '';
    const pwError = touched ? passwordProblem : '';
    const confirmError = touched ? confirmProblem : '';
    const level = strength(form.password);
    const meter = LEVELS[level];

    const handleSubmit = async (e) => {
        e.preventDefault();
        setTouched(true);
        if (passwordProblem || confirmProblem) return;
        setLoading(true);
        setError('');
        try {
            const { data } = await axios.post(`${API_BASE}/api/staff/password-reset/reset`, { token, password: form.password });
            setDoneMessage(data.message);
            setPhase('done');
        } catch (err) {
            const message = apiErrorMessage(err, 'Could not reset your password. Please try again.');
            if (err.response?.status === 400 && /invalid or has expired/i.test(message)) setPhase('invalid');
            else setError(message);
        } finally {
            setLoading(false);
        }
    };

    const field = (name, label, autoComplete, helper) => (
        <TextField
            fullWidth label={label} name={name} type={show ? 'text' : 'password'} value={form[name]} required size="small"
            autoComplete={autoComplete}
            onChange={(e) => { setForm((f) => ({ ...f, [name]: e.target.value })); setError(''); }}
            error={!!helper} helperText={helper || ' '}
            sx={{ mb: 1, ...fieldSx }}
            InputProps={{
                startAdornment: <InputAdornment position="start"><Lock fontSize="small" sx={{ color: 'text.disabled' }} /></InputAdornment>,
                endAdornment: (
                    <InputAdornment position="end">
                        <IconButton size="small" edge="end" onClick={() => setShow((v) => !v)} aria-label={show ? 'Hide passwords' : 'Show passwords'}>
                            {show ? <VisibilityOff fontSize="small" /> : <Visibility fontSize="small" />}
                        </IconButton>
                    </InputAdornment>
                ),
            }}
        />
    );

    return (
        <HospitalAuthShell icon={<LockReset />} title="Choose a New Password" subtitle="Hospital portal account">
            {phase === 'checking' && (
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1.5, py: 3 }}>
                    <CircularProgress size={22} />
                    <Typography color="text.secondary">Checking your reset link…</Typography>
                </Box>
            )}

            {phase === 'invalid' && (
                <ResultPanel tone="error" role="alert" icon={<LinkOff />} title="This link can't be used">
                    <Typography color="text.secondary" fontSize="0.9rem" lineHeight={1.6} mb={2.5}>
                        Reset links expire after 30 minutes and work only once. Request a new one to continue.
                    </Typography>
                    <Button component={Link} href="/hospital/forgot-password" fullWidth variant="contained" size="large" sx={primaryButtonSx}>
                        Request a New Link
                    </Button>
                </ResultPanel>
            )}

            {phase === 'ready' && (
                <>
                    <ErrorAlert>{error}</ErrorAlert>
                    <Typography color="text.secondary" fontSize="0.88rem" lineHeight={1.6} mb={2.5}>
                        Choose a password of at least {MIN} characters that you don&apos;t use anywhere else.
                    </Typography>
                    <Box component="form" onSubmit={handleSubmit} noValidate>
                        {field('password', 'New Password', 'new-password', pwError)}
                        {form.password && (
                            <Box sx={{ mt: -0.5, mb: 1.5 }} aria-live="polite">
                                <LinearProgress variant="determinate" value={Math.max(8, (level / 5) * 100)}
                                    sx={{ height: 5, borderRadius: 3, bgcolor: '#eceff1', '& .MuiLinearProgress-bar': { bgcolor: meter.color } }} />
                                <Typography sx={{ fontSize: '0.74rem', mt: 0.5, color: meter.color, fontWeight: 600 }}>{meter.label}</Typography>
                            </Box>
                        )}
                        {field('confirm', 'Confirm New Password', 'new-password', confirmError)}
                        <Button type="submit" fullWidth variant="contained" size="large" disabled={loading} sx={{ ...primaryButtonSx, mt: 1 }}>
                            {loading ? <CircularProgress size={22} color="inherit" /> : 'Reset Password'}
                        </Button>
                    </Box>
                </>
            )}

            {phase === 'done' && (
                <ResultPanel tone="success" icon={<CheckCircle />} title="Password updated">
                    <Typography color="text.secondary" fontSize="0.9rem" lineHeight={1.6} mb={2.5}>{doneMessage}</Typography>
                    <Button component={Link} href="/hospital/login" fullWidth variant="contained" size="large" sx={primaryButtonSx}>
                        Sign In
                    </Button>
                </ResultPanel>
            )}
        </HospitalAuthShell>
    );
}
