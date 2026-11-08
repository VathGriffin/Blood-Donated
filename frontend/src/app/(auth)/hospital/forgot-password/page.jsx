'use client';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import {
  Alert, AlertTitle, Box, Button, CircularProgress, InputAdornment, TextField, Typography,
} from '@mui/material';
import { Email, LockReset, ArrowBack, MarkEmailRead } from '@mui/icons-material';
import axios from 'axios';
import API_BASE from '@/lib/config';
import { useT } from '@/i18n/I18nProvider';
import { apiErrorMessage } from '@/lib/api-error';
import { EMAIL_RE } from '@/lib/validation';
import HospitalAuthShell, { ErrorAlert, ResultPanel, fieldSx, primaryButtonSx, linkSx } from '../_components/HospitalAuthShell';

// Shown instead of the form when the server can't send email, so nobody waits for a message
// that will never arrive. Lists the server settings an administrator needs to add.
function NotConfigured({ info }) {
    const t = useT();
    return (
        <Alert severity="warning" sx={{ borderRadius: 2, mb: 2.5, fontSize: '0.84rem' }}>
            <AlertTitle sx={{ fontWeight: 700 }}>{t('auth.hospital.forgot.notConfigured')}</AlertTitle>
            {info.missing?.length > 0 && (
                <Box sx={{ mt: 1.25 }}>
                    <Typography sx={{ fontSize: '0.78rem', fontWeight: 700 }}>{t('auth.hospital.forgot.missingSettings')}</Typography>
                    <Box component="code" sx={{ display: 'block', mt: 0.5, fontSize: '0.76rem', wordBreak: 'break-word' }}>
                        {info.missing.join(', ')}
                    </Box>
                    <Typography sx={{ fontSize: '0.74rem', mt: 0.5 }}>{t('auth.hospital.forgot.addSettings')}</Typography>
                </Box>
            )}
        </Alert>
    );
}

export default function HospitalForgotPassword() {
    const t = useT();
    const [email, setEmail] = useState('');
    const [touched, setTouched] = useState(false);
    const [status, setStatus] = useState(null); // null while checking, then { available, message?, missing? }
    const [statusError, setStatusError] = useState(null); // the failed request, translated at render
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [sent, setSent] = useState(false);

    useEffect(() => {
        axios.get(`${API_BASE}/api/staff/password-reset/status`)
            .then(({ data }) => setStatus(data))
            .catch((err) => setStatusError(err));
    }, []);

    const emailValid = EMAIL_RE.test(email.trim());
    const emailError = touched && !emailValid ? t('auth.hospital.forgot.emailError') : '';

    const handleSubmit = async (e) => {
        e.preventDefault();
        setTouched(true);
        if (!emailValid) return;
        setLoading(true);
        setError('');
        try {
            await axios.post(`${API_BASE}/api/staff/password-reset/request`, { email: email.trim() });
            setSent(true);
        } catch (err) {
            if (err.response?.status === 503) setStatus({ available: false, ...err.response.data });
            else setError(apiErrorMessage(err, t('auth.hospital.forgot.failed')));
        } finally {
            setLoading(false);
        }
    };

    const backToLogin = (
        <Box sx={{ textAlign: 'center', mt: 2.5 }}>
            <Box component={Link} href="/hospital/login" sx={{ ...linkSx, display: 'inline-flex', alignItems: 'center', gap: 0.5 }}>
                <ArrowBack sx={{ fontSize: 16 }} /> {t('auth.hospital.forgot.back')}
            </Box>
        </Box>
    );

    return (
        <HospitalAuthShell icon={<LockReset />} title={t('auth.hospital.forgot.title')} subtitle={t('auth.hospital.forgot.subtitle')}>
            {sent ? (
                <ResultPanel icon={<MarkEmailRead />} title={t('auth.hospital.forgot.checkEmail')}>
                    <Typography color="text.secondary" fontSize="0.9rem" lineHeight={1.6}>{t('auth.hospital.forgot.sentText')}</Typography>
                    <Typography color="text.secondary" fontSize="0.8rem" mt={1.5}>
                        {t('auth.hospital.forgot.noEmail')}
                    </Typography>
                    {backToLogin}
                </ResultPanel>
            ) : (
                <>
                    <ErrorAlert>{statusError && apiErrorMessage(statusError, t('auth.hospital.forgot.unreachable'))}</ErrorAlert>
                    {status && !status.available && <NotConfigured info={status} />}
                    <ErrorAlert>{error}</ErrorAlert>
                    <Typography color="text.secondary" fontSize="0.88rem" lineHeight={1.6} mb={2.5}>
                        {t('auth.hospital.forgot.lead')}
                    </Typography>
                    <Box component="form" onSubmit={handleSubmit} noValidate>
                        <TextField
                            fullWidth label={t('auth.hospital.forgot.email')} type="email" value={email} required size="small" autoComplete="email" autoFocus
                            onChange={(e) => { setEmail(e.target.value); setError(''); }}
                            onBlur={() => email && setTouched(true)}
                            error={!!emailError} helperText={emailError || ' '}
                            disabled={status?.available === false}
                            sx={{ mb: 1.5, ...fieldSx }}
                            InputProps={{ startAdornment: <InputAdornment position="start"><Email fontSize="small" sx={{ color: 'text.disabled' }} /></InputAdornment> }}
                        />
                        <Button type="submit" fullWidth variant="contained" size="large" sx={primaryButtonSx}
                            disabled={loading || !status || status.available === false}>
                            {loading || (!status && !statusError) ? <CircularProgress size={22} color="inherit" /> : t('auth.hospital.forgot.send')}
                        </Button>
                    </Box>
                    {backToLogin}
                </>
            )}
        </HospitalAuthShell>
    );
}
