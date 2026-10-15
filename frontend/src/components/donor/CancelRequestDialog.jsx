'use client';
import { useRef, useState, useEffect } from 'react';
import axios from 'axios';
import {
  Alert, Box, Button, CircularProgress, Dialog, DialogActions, DialogContent, DialogTitle, TextField, Typography,
} from '@mui/material';
import DoNotDisturbOnOutlinedIcon from '@mui/icons-material/DoNotDisturbOnOutlined';
import API_BASE from '@/lib/config';

/**
 * Confirm-and-cancel for one of the donor's own Pending blood requests, via
 * PATCH /api/requests/:id/cancel. The server re-checks ownership and that the request is still
 * Pending in one atomic update, so this is safe against double clicks and other tabs; the ref
 * below also stops a second submit from this dialog while one is in flight.
 *
 *   onCancelled(updatedRequest) – it worked
 *   onChanged(message)          – the request changed meanwhile (409/404): show it and reload
 *   onBusyChange(bool)          – lets the page disable that card's own cancel controls
 */
export default function CancelRequestDialog({ request, token, onClose, onCancelled, onChanged, onSessionExpired, onBusyChange }) {
  const [reason, setReason] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const inFlight = useRef(false);

  useEffect(() => { setReason(''); setError(''); }, [request?._id]);
  useEffect(() => { onBusyChange?.(busy); }, [busy, onBusyChange]);

  const close = () => { if (!busy) onClose(); };

  const confirm = async () => {
    if (!request || inFlight.current) return;
    inFlight.current = true;
    setBusy(true);
    setError('');
    try {
      const { data } = await axios.patch(`${API_BASE}/api/requests/${request._id}/cancel`,
        { reason: reason.trim() }, { headers: { Authorization: `Bearer ${token}` } });
      onCancelled(data);
    } catch (err) {
      if (onSessionExpired?.(err)) return;
      const message = err.response?.data?.error || 'Could not cancel the request. Please try again.';
      if (err.response?.status === 409 || err.response?.status === 404) onChanged(message);
      else setError(message);
    } finally {
      inFlight.current = false;
      setBusy(false);
    }
  };

  const units = request?.unitsNeeded || 1;
  return (
    <Dialog open={Boolean(request)} onClose={close} maxWidth="xs" fullWidth
      aria-labelledby="cancel-request-title" aria-describedby="cancel-request-text"
      slotProps={{ paper: { sx: { borderRadius: '18px' } } }}>
      <DialogTitle id="cancel-request-title" sx={{ fontWeight: 800, fontSize: '1.05rem', pb: 1, display: 'flex', alignItems: 'center', gap: 1.25 }}>
        <Box aria-hidden="true" sx={{ width: 36, height: 36, borderRadius: '50%', flexShrink: 0, display: 'grid', placeItems: 'center',
          bgcolor: (t) => t.custom.tones.error.bg, color: 'error.main' }}>
          <DoNotDisturbOnOutlinedIcon sx={{ fontSize: 20 }} />
        </Box>
        Cancel Blood Request
      </DialogTitle>
      <DialogContent sx={{ pb: 1 }}>
        <Typography id="cancel-request-text" fontSize="0.92rem" fontWeight={600}>
          Are you sure you want to cancel this blood request?
        </Typography>
        {request && (
          <Box sx={{ mt: 1.5, px: 1.5, py: 1.1, borderRadius: '10px', bgcolor: (t) => t.custom.surface.subtle, border: '1px solid', borderColor: 'divider' }}>
            <Typography fontSize="0.82rem" fontWeight={700}>
              {request.bloodType} · {units} unit{units !== 1 ? 's' : ''} for {request.patientName}
            </Typography>
            <Typography fontSize="0.78rem" color="text.secondary">{request.hospitalName}</Typography>
          </Box>
        )}
        <Typography fontSize="0.8rem" color="text.secondary" sx={{ mt: 1.5, mb: 1 }}>
          The hospital will no longer process it. This can’t be undone — you can submit a new request any time.
        </Typography>
        <Typography component="label" htmlFor="cancel-reason" sx={{ display: 'block', fontWeight: 700, fontSize: '0.82rem', mb: 0.6 }}>
          Reason <Box component="span" sx={{ color: 'text.secondary', fontWeight: 500 }}>(optional)</Box>
        </Typography>
        <TextField fullWidth multiline minRows={2} maxRows={5} size="small" id="cancel-reason"
          placeholder="e.g. Found a donor, surgery postponed…"
          value={reason} onChange={(e) => setReason(e.target.value.slice(0, 500))}
          disabled={busy} helperText={`${reason.length}/500`}
          slotProps={{ formHelperText: { sx: { textAlign: 'right', mr: 0 } } }} />
        {error && <Alert severity="error" sx={{ mt: 1.5, borderRadius: '10px' }}>{error}</Alert>}
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2.5, pt: 1, gap: 1 }}>
        <Button onClick={close} disabled={busy} color="inherit">Keep Request</Button>
        <Button onClick={confirm} variant="contained" disabled={busy}
          startIcon={busy ? <CircularProgress size={15} color="inherit" /> : null} sx={{ minWidth: 150 }}>
          {busy ? 'Cancelling…' : 'Cancel Request'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
