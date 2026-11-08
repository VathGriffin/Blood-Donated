'use client';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import {
  Box, Button, CircularProgress, IconButton, InputAdornment, LinearProgress, TextField, Typography,
} from '@mui/material';
import { Lock, LockReset, Visibility, VisibilityOff, CheckCircle, LinkOff } from '@mui/icons-material';
import axios from 'axios';
import API_BASE from '@/lib/config';
import { useT } from '@/i18n/I18nProvider';
import { apiErrorMessage } from '@/lib/api-error';
import HospitalAuthShell, { ErrorAlert, ResultPanel, fieldSx, primaryButtonSx } from '../_components/HospitalAuthShell';

const MIN = 8;  // same rules as the backend
const MAX = 72;

// Labels: auth.hospital.reset.strength.<key>
const LEVELS = [
    { key: 'tooShort', color: '#C91D32' }, { key: 'weak', color: '#C91D32' }, { key: 'fair', color: '#B45309' },
    { key: 'good', color: '#2563EB' }, { key: 'strong', color: '#16A34A' }, { key: 'veryStrong', color: '#16A34A' },
];

// Rough guide only (0 = too short … 5 = very strong); the server enforces the length rules.
function strength(pw) {
    if (pw.length < MIN) return 0;
    return [pw.length >= MIN, pw.length >= 12, /[a-z]/.test(pw) && /[A-Z]/.test(pw), /\d/.test(pw), /[^A-Za-z0-9]/.test(pw)]
        .filter(Boolean).length;
}

export default function HospitalResetPassword() {
    const t = useT();
    const [token, setToken] = useState(null);
    const [phase, setPhase] = useState('checking'); // checking | ready | invalid | done
    const [form, setForm] = useState({ password: '', confirm: '' });
    const [show, setShow] = useState(false);
    const [touched, setTouched] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [checkError, setCheckError] = useState(null); // failed link check, translated at render

    // The emailed link carries the token in the URL fragment (#token=…), which browsers never send
    // to a server. Read it once, then drop it from the address bar and history.
    useEffect(() => {
        const tok = new URLSearchParams(window.location.hash.slice(1)).get('token');
        if (window.location.hash) window.history.replaceState(null, '', window.location.pathname);
        if (!tok) { setPhase('invalid'); return; }
        setToken(tok);
        axios.post(`${API_BASE}/api/staff/password-reset/verify`, { token: tok })
            .then(({ data }) => setPhase(data.valid ? 'ready' : 'invalid'))
            .catch((err) => { setCheckError(err); setPhase('ready'); });
    }, []);

    const passwordProblem = form.password.length < MIN ? t('auth.hospital.reset.tooShort', { min: MIN })
        : new TextEncoder().encode(form.password).length > MAX ? t('auth.hospital.reset.tooLong', { max: MAX }) : '';
    const confirmProblem = form.confirm !== form.password ? t('auth.hospital.reset.mismatch') : '';
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
        setCheckError(null);
        try {
            await axios.post(`${API_BASE}/api/staff/password-reset/reset`, { token, password: form.password });
            setPhase('done');
        } catch (err) {
            // Match the server's own text, before it is translated for display.
            if (err.response?.status === 400 && /invalid or has expired/i.test(err.response?.data?.message || '')) setPhase('invalid');
            else setError(apiErrorMessage(err, t('auth.hospital.reset.failed')));
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
                        <IconButton size="small" edge="end" onClick={() => setShow((v) => !v)} aria-label={t(show ? 'auth.hidePasswords' : 'auth.showPasswords')}>
                            {show ? <VisibilityOff fontSize="small" /> : <Visibility fontSize="small" />}
                        </IconButton>
                    </InputAdornment>
                ),
            }}
        />
    );

    return (
        <HospitalAuthShell icon={<LockReset />} title={t('auth.hospital.reset.title')} subtitle={t('auth.hospital.reset.subtitle')}>
            {phase === 'checking' && (
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1.5, py: 3 }}>
                    <CircularProgress size={22} />
                    <Typography color="text.secondary">{t('auth.hospital.reset.checking')}</Typography>
                </Box>
            )}

            {phase === 'invalid' && (
                <ResultPanel tone="error" role="alert" icon={<LinkOff />} title={t('auth.hospital.reset.invalidTitle')}>
                    <Typography color="text.secondary" fontSize="0.9rem" lineHeight={1.6} mb={2.5}>
                        {t('auth.hospital.reset.invalidText')}
                    </Typography>
                    <Button component={Link} href="/hospital/forgot-password" fullWidth variant="contained" size="large" sx={primaryButtonSx}>
                        {t('auth.hospital.reset.newLink')}
                    </Button>
                </ResultPanel>
            )}

            {phase === 'ready' && (
                <>
                    <ErrorAlert>{error || (checkError && apiErrorMessage(checkError, t('auth.hospital.reset.checkFailed')))}</ErrorAlert>
                    <Typography color="text.secondary" fontSize="0.88rem" lineHeight={1.6} mb={2.5}>
                        {t('auth.hospital.reset.lead', { min: MIN })}
                    </Typography>
                    <Box component="form" onSubmit={handleSubmit} noValidate>
                        {field('password', t('auth.hospital.reset.password'), 'new-password', pwError)}
                        {form.password && (
                            <Box sx={{ mt: -0.5, mb: 1.5 }} aria-live="polite">
                                <LinearProgress variant="determinate" value={Math.max(8, (level / 5) * 100)}
                                    sx={{ height: 5, borderRadius: 3, bgcolor: '#F1F5F9', '& .MuiLinearProgress-bar': { bgcolor: meter.color } }} />
                                <Typography sx={{ fontSize: '0.74rem', mt: 0.5, color: meter.color, fontWeight: 600 }}>{t(`auth.hospital.reset.strength.${meter.key}`)}</Typography>
                            </Box>
                        )}
                        {field('confirm', t('auth.hospital.reset.confirm'), 'new-password', confirmError)}
                        <Button type="submit" fullWidth variant="contained" size="large" disabled={loading} sx={{ ...primaryButtonSx, mt: 1 }}>
                            {loading ? <CircularProgress size={22} color="inherit" /> : t('auth.hospital.reset.submit')}
                        </Button>
                    </Box>
                </>
            )}

            {phase === 'done' && (
                <ResultPanel tone="success" icon={<CheckCircle />} title={t('auth.hospital.reset.doneTitle')}>
                    <Typography color="text.secondary" fontSize="0.9rem" lineHeight={1.6} mb={2.5}>{t('auth.hospital.reset.doneText')}</Typography>
                    <Button component={Link} href="/hospital/login" fullWidth variant="contained" size="large" sx={primaryButtonSx}>
                        {t('auth.hospital.reset.signIn')}
                    </Button>
                </ResultPanel>
            )}
        </HospitalAuthShell>
    );
}
