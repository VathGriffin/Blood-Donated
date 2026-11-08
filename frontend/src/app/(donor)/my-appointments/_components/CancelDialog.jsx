'use client';
import { useT } from '@/i18n/I18nProvider';
import { useState } from 'react';
import axios from 'axios';
import {
  Alert, Box, Button, CircularProgress, Dialog, DialogActions, DialogContent, DialogTitle, TextField, Typography,
} from '@mui/material';
import API_BASE from '@/lib/config';
import { apiErrorMessage } from '@/lib/api-error';
import { openRequest, whenLabel } from './appointments';

/** Confirms a donor's cancellation (POST /api/appointments/:id/cancel). */
export default function CancelDialog({ appt, token, onClose, onDone, onSessionExpired }) {
  const [reason, setReason] = useState('');
  const t = useT();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const pending = openRequest(appt);

  const submit = async () => {
    setSaving(true);
    setError('');
    try {
      const { data } = await axios.post(`${API_BASE}/api/appointments/${appt._id}/cancel`, { reason: reason.trim() },
        { headers: { Authorization: `Bearer ${token}` } });
      onDone(data);
    } catch (err) {
      if (onSessionExpired?.(err)) return;
      setError(apiErrorMessage(err, t('donor.cancelAppt.failed')));
      setSaving(false);
    }
  };

  return (
    <Dialog open onClose={saving ? undefined : onClose} maxWidth="xs" fullWidth aria-labelledby="cancel-title">
      <DialogTitle id="cancel-title">{t('donor.cancelAppt.title')}</DialogTitle>
      <DialogContent>
        <Typography variant="body2" color="text.secondary">
          {t('donor.cancelAppt.released', { place: appt.location, when: whenLabel(appt.date, appt.time) })}
          {pending && ` ${t('donor.cancelAppt.withdrawToo')}`}
        </Typography>
        <Box sx={{ mt: 2 }}>
          <TextField label={t('donor.cancelAppt.reason')} value={reason} onChange={(e) => setReason(e.target.value.slice(0, 500))}
            multiline minRows={2} fullWidth helperText={`${reason.length}/500`} />
        </Box>
        {error && <Alert severity="error" sx={{ mt: 1.5 }}>{error}</Alert>}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={saving} color="inherit">{t('donor.cancelAppt.keep')}</Button>
        <Button onClick={submit} disabled={saving} variant="contained" color="error"
          startIcon={saving ? <CircularProgress size={16} color="inherit" /> : null}>
          {t('donor.cancelAppt.confirm')}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
