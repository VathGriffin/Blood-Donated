'use client';
import { useT } from '@/i18n/I18nProvider';
import Link from 'next/link';
import { Box, Button, CircularProgress, Paper, Skeleton, Switch, Typography } from '@mui/material';
import WaterDropIcon from '@mui/icons-material/WaterDrop';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import { IconCircle, cardSx } from '@/components/donor/ui';

/**
 * Availability tile backed by PATCH /api/donors/me/availability (the donor's own record only).
 * `donor` is null while loading, { error: true } on failure, { found: false } when the account
 * has no donor record, or the record itself.
 */
export default function AvailabilityCard({ donor, saving, error, onToggle, onRetry }) {
  const t = useT();
  const loading = donor === null;
  const failed = !!donor?.error;
  const found = !!donor?.found;
  const available = found && !!donor.available;
  const tone = available ? 'success' : 'neutral';

  let control;
  if (loading) {
    control = <Skeleton variant="rounded" width={170} height={28} sx={{ borderRadius: '999px' }} />;
  } else if (failed) {
    control = (
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
        <Typography variant="body2" color="error" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
          <ErrorOutlineIcon sx={{ fontSize: 17 }} /> {t('donor.availability.loadFailed')}
        </Typography>
        <Button size="small" variant="outlined" onClick={onRetry}>{t('donor.availability.retry')}</Button>
      </Box>
    );
  } else if (!found) {
    control = <Button component={Link} href="/donate" variant="contained" size="small">{t('donor.availability.register')}</Button>;
  } else {
    control = (
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <Switch checked={available} onChange={(e) => onToggle(e.target.checked)} disabled={saving} color="success"
          inputProps={{ 'aria-labelledby': 'availability-title', 'aria-describedby': 'availability-state' }}
          sx={{
            width: 58, height: 34, p: 0.75, ml: -0.75,
            '& .MuiSwitch-switchBase': { p: 0.95, '&.Mui-checked': { transform: 'translateX(24px)' } },
            '& .MuiSwitch-thumb': { width: 16, height: 16, bgcolor: '#fff', boxShadow: '0 1px 3px rgba(0,0,0,0.3)' },
            '& .MuiSwitch-track': { borderRadius: 10, opacity: '1 !important', bgcolor: (t) => (t.palette.mode === 'dark' ? '#475569' : '#CBD5E1') },
            '& .Mui-checked + .MuiSwitch-track': { bgcolor: 'success.main' },
          }} />
        <Typography id="availability-state" aria-live="polite" sx={{
          display: 'flex', alignItems: 'center', gap: 0.75, fontWeight: 700, fontSize: '0.86rem', color: (t) => t.custom.tones[tone].fg,
        }}>
          <Box component="span" aria-hidden="true" sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: (t) => t.custom.tones[tone].dot }} />
          {available ? t('donor.availability.available') : t('donor.availability.notAvailable')}
          {saving && <CircularProgress size={14} sx={{ ml: 0.5 }} aria-label={t('donor.availability.saving')} />}
        </Typography>
      </Box>
    );
  }

  return (
    <Paper id="availability" component="section" aria-labelledby="availability-title" elevation={0}
      sx={{ ...cardSx, p: { xs: 2, sm: 2.5 }, display: 'flex', gap: 2, alignItems: 'flex-start', height: '100%' }}>
      <IconCircle size={54}><WaterDropIcon /></IconCircle>
      <Box sx={{ minWidth: 0, flex: 1 }}>
        <Typography id="availability-title" component="h2" sx={{ fontWeight: 800, fontSize: '1.02rem' }}>{t('donor.availability.title')}</Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.25, mb: 1.25 }}>
          {found || loading || failed
            ? t('donor.availability.text')
            : t('donor.availability.registerText')}
        </Typography>
        {control}
        {error && (
          <Typography role="alert" variant="caption" color="error" sx={{ mt: 0.75, display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <ErrorOutlineIcon sx={{ fontSize: 15 }} /> {error}
          </Typography>
        )}
      </Box>
    </Paper>
  );
}
