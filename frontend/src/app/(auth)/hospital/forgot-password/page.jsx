'use client';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import {
  Alert, AlertTitle, Box, Button, CircularProgress, InputAdornment, TextField, Typography,
} from '@mui/material';
import { Email, LockReset, ArrowBack, MarkEmailRead } from '@mui/icons-material';
import axios from 'axios';
import API_BASE from '@/lib/config';
import { apiErrorMessage } from '@/lib/api-error';
import { EMAIL_RE } from '@/lib/validation';
import HospitalAuthShell, { ErrorAlert, ResultPanel, fieldSx, primaryButtonSx, linkSx } from '../_components/HospitalAuthShell';

// Shown instead of the form when the server can't send email, so nobody waits for a message
// that will never arrive. Lists the server settings an administrator needs to add.
function NotConfigured({ info }) {
    return (
        <Alert severity="warning" sx={{ borderRadius: 2, mb: 2.5, fontSize: '0.84rem' }}>
            <AlertTitle sx={{ fontWeight: 700 }}>Email reset isn&apos;t available yet</AlertTitle>
            {info.message}
            {info.missing?.length > 0 && (
                <Box sx={{ mt: 1.25 }}>
                    <Typography sx={{ fontSize: '0.78rem', fontWeight: 700 }}>For administrators — missing server settings:</Typography>
                    <Box component="code" sx={{ display: 'block', mt: 0.5, fontSize: '0.76rem', wordBreak: 'break-word' }}>
                        {info.missing.join(', ')}
                    </Box>
                    <Typography sx={{ fontSize: '0.74rem', mt: 0.5 }}>Add them to the backend environment (Backend/.env) and restart the API.</Typography>
                </Box>
            )}
        </Alert>
    );
}

export default function HospitalForgotPassword() {
    const [email, setEmail] = useState('');
    const [touched, setTouched] = useState(false);
    const [status, setStatus] = useState(null); // null while checking, then { available, message?, missing? }
    const [statusError, setStatusError] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [sentMessage, setSentMessage] = useState('');

    useEffect(() => {
        axios.get(`${API_BASE}/api/staff/password-reset/status`)
            .then(({ data }) => setStatus(data))
            .catch((err) => setStatusError(apiErrorMessage(err, 'Could not reach the server. Try again shortly.')));
    }, []);

    const emailValid = EMAIL_RE.test(email.trim());
    const emailError = touched && !emailValid ? 'Enter the email address you sign in with.' : '';

    const handleSubmit = async (e) => {
        e.preventDefault();
        setTouched(true);
        if (!emailValid) return;
        setLoading(true);
        setError('');
        try {
            const { data } = await axios.post(`${API_BASE}/api/staff/password-reset/request`, { email: email.trim() });
            setSentMessage(data.message);
        } catch (err) {
            if (err.response?.status === 503) setStatus({ available: false, ...err.response.data });
            else setError(apiErrorMessage(err, 'Something went wrong. Please try again.'));
        } finally {
            setLoading(false);
        }
    };

    const backToLogin = (
        <Box sx={{ textAlign: 'center', mt: 2.5 }}>
            <Box component={Link} href="/hospital/login" sx={{ ...linkSx, display: 'inline-flex', alignItems: 'center', gap: 0.5 }}>
                <ArrowBack sx={{ fontSize: 16 }} /> Back to sign in
            </Box>
        </Box>
    );

    return (
        <HospitalAuthShell icon={<LockReset />} title="Forgot Password" subtitle="Reset your hospital portal password">
            {sentMessage ? (
                <ResultPanel icon={<MarkEmailRead />} title="Check your email">
                    <Typography color="text.secondary" fontSize="0.9rem" lineHeight={1.6}>{sentMessage}</Typography>
                    <Typography color="text.secondary" fontSize="0.8rem" mt={1.5}>
                        Didn&apos;t get it? Check your spam folder, or ask a BloodLife administrator to reset your password.
                    </Typography>
                    {backToLogin}
                </ResultPanel>
            ) : (
                <>
                    <ErrorAlert>{statusError}</ErrorAlert>
                    {status && !status.available && <NotConfigured info={status} />}
                    <ErrorAlert>{error}</ErrorAlert>
                    <Typography color="text.secondary" fontSize="0.88rem" lineHeight={1.6} mb={2.5}>
                        Enter the email address registered to your hospital staff account and we&apos;ll send you a link to choose a new password.
                    </Typography>
                    <Box component="form" onSubmit={handleSubmit} noValidate>
                        <TextField
                            fullWidth label="Email Address" type="email" value={email} required size="small" autoComplete="email" autoFocus
                            onChange={(e) => { setEmail(e.target.value); setError(''); }}
                            onBlur={() => email && setTouched(true)}
                            error={!!emailError} helperText={emailError || ' '}
                            disabled={status?.available === false}
                            sx={{ mb: 1.5, ...fieldSx }}
                            InputProps={{ startAdornment: <InputAdornment position="start"><Email fontSize="small" sx={{ color: 'text.disabled' }} /></InputAdornment> }}
                        />
                        <Button type="submit" fullWidth variant="contained" size="large" sx={primaryButtonSx}
                            disabled={loading || !status || status.available === false}>
                            {loading || (!status && !statusError) ? <CircularProgress size={22} color="inherit" /> : 'Send Reset Link'}
                        </Button>
                    </Box>
                    {backToLogin}
                </>
            )}
        </HospitalAuthShell>
    );
}
