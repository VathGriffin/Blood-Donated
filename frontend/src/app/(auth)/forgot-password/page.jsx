'use client';
import React, { useState } from 'react';
import Link from 'next/link';
import { Box, Paper, Typography, TextField, Button, Alert } from '@mui/material';
import { Email, Favorite } from '@mui/icons-material';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    setSent(true);
  };

  return (
    <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', p: 2, bgcolor: 'background.default' }}>
      <Box sx={{ width: '100%', maxWidth: 420 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, justifyContent: 'center', mb: 4 }}>
          <Favorite sx={{ color: '#b71c1c', fontSize: 28 }} />
          <Typography variant="h6" fontWeight={900} color="error.main">Blood Donated</Typography>
        </Box>
        <Paper elevation={0} sx={{ borderRadius: 4, border: '1px solid', borderColor: 'divider', overflow: 'hidden' }}>
          <Box sx={{ px: 4, py: 3.5, background: 'linear-gradient(135deg, #7f0000 0%, #b71c1c 100%)', display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Email sx={{ color: 'white', fontSize: 28 }} />
            <Box>
              <Typography variant="h6" fontWeight={800} color="white" lineHeight={1.2}>Forgot Password</Typography>
              <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.75)' }}>Reset your account password</Typography>
            </Box>
          </Box>
          <Box sx={{ p: { xs: 3, sm: 4 } }}>
            {sent ? (
              <Alert severity="success" sx={{ borderRadius: 2 }}>
                If an account exists for <strong>{email}</strong>, a reset link has been sent.
              </Alert>
            ) : (
              <Box component="form" onSubmit={handleSubmit}>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2.5 }}>
                  Enter your email address and we'll send you a link to reset your password.
                </Typography>
                <TextField fullWidth label="Email Address" type="email" value={email}
                  onChange={(e) => setEmail(e.target.value)} required
                  sx={{ mb: 3, '& .MuiOutlinedInput-root': { borderRadius: 2.5 } }} />
                <Button type="submit" fullWidth variant="contained" color="error" size="large"
                  sx={{ py: 1.5, fontWeight: 700, borderRadius: 3, background: 'linear-gradient(135deg, #b71c1c 0%, #d32f2f 100%)' }}>
                  Send Reset Link
                </Button>
              </Box>
            )}
            <Typography variant="body2" textAlign="center" mt={2.5} color="text.secondary">
              Remember your password?{' '}
              <Link href="/login" style={{ color: '#b71c1c', fontWeight: 700, textDecoration: 'none' }}>Log in</Link>
            </Typography>
          </Box>
        </Paper>
      </Box>
    </Box>
  );
}
