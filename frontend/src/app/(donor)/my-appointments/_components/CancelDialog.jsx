'use client';
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
      setError(apiErrorMessage(err, 'We couldn’t cancel this appointment. Please try again.'));
      setSaving(false);
    }
  };

  return (
    <Dialog open onClose={saving ? undefined : onClose} maxWidth="xs" fullWidth aria-labelledby="cancel-title">
      <DialogTitle id="cancel-title">Cancel this appointment?</DialogTitle>
      <DialogContent>
        <Typography variant="body2" color="text.secondary">
          {appt.location} · {whenLabel(appt.date, appt.time)}. Your slot will be released for other donors.
          {pending && ' Your open request to change the date will be withdrawn too.'}
        </Typography>
        <Box sx={{ mt: 2 }}>
          <TextField label="Reason (optional)" value={reason} onChange={(e) => setReason(e.target.value.slice(0, 500))}
            multiline minRows={2} fullWidth helperText={`${reason.length}/500`} />
        </Box>
        {error && <Alert severity="error" sx={{ mt: 1.5 }}>{error}</Alert>}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={saving} color="inherit">Keep Appointment</Button>
        <Button onClick={submit} disabled={saving} variant="contained" color="error"
          startIcon={saving ? <CircularProgress size={16} color="inherit" /> : null}>
          Cancel Appointment
        </Button>
      </DialogActions>
    </Dialog>
  );
}
