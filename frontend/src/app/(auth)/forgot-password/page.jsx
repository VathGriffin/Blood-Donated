'use client';
import { useI18n } from '@/i18n/I18nProvider';
import { useState } from 'react';
import Link from 'next/link';
import { Box, Paper, Typography, TextField, Button, Alert } from '@mui/material';
import { Email, Favorite } from '@mui/icons-material';

export default function ForgotPassword() {
  const { t, rich } = useI18n();
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
          <Favorite sx={{ color: '#A91529', fontSize: 28 }} />
          <Typography variant="h6" fontWeight={900} color="primary.main">BloodLife</Typography>
        </Box>
        <Paper elevation={0} sx={{ borderRadius: 4, border: '1px solid', borderColor: 'divider', overflow: 'hidden' }}>
          <Box sx={{ px: 4, py: 3.5, background: 'linear-gradient(120deg, #102541 0%, #173B63 55%, #245481 100%)', display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Email sx={{ color: 'white', fontSize: 28 }} />
            <Box>
              <Typography variant="h6" fontWeight={800} color="white" lineHeight={1.2}>{t('auth.forgot.title')}</Typography>
              <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.75)' }}>{t('auth.forgot.subtitle')}</Typography>
            </Box>
          </Box>
          <Box sx={{ p: { xs: 3, sm: 4 } }}>
            {sent ? (
              <Alert severity="success" sx={{ borderRadius: 2 }}>
                {rich('auth.forgot.sent', { email: <strong>{email}</strong> })}
              </Alert>
            ) : (
              <Box component="form" onSubmit={handleSubmit}>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2.5 }}>
                  {t('auth.forgot.lead')}
                </Typography>
                <TextField fullWidth label={t('auth.forgot.email')} type="email" value={email}
                  onChange={(e) => setEmail(e.target.value)} required
                  sx={{ mb: 3, '& .MuiOutlinedInput-root': { borderRadius: 2.5 } }} />
                <Button type="submit" fullWidth variant="contained" color="primary" size="large"
                  sx={{ py: 1.5, fontWeight: 700, borderRadius: 3, background: 'linear-gradient(135deg, #E63946 0%, #C91D32 100%)' }}>
                  {t('auth.forgot.send')}
                </Button>
              </Box>
            )}
            <Typography variant="body2" textAlign="center" mt={2.5} color="text.secondary">
              {rich('auth.forgot.remember', { link: <Link href="/login" style={{ color: '#A91529', fontWeight: 700, textDecoration: 'none' }}>{t('auth.forgot.login')}</Link> })}
            </Typography>
          </Box>
        </Paper>
      </Box>
    </Box>
  );
}
