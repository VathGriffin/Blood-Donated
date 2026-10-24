'use client';
import { useState } from 'react';
import axios from 'axios';
import {
  Alert, Box, Button, CircularProgress, Dialog, DialogActions, DialogContent, DialogTitle, Paper, TextField, Typography,
} from '@mui/material';
import { alpha } from '@mui/material/styles';
import EventRepeatIcon from '@mui/icons-material/EventRepeat';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import CheckIcon from '@mui/icons-material/Check';
import CloseIcon from '@mui/icons-material/Close';
import API_BASE from '@/lib/config';
import { apiErrorMessage } from '@/lib/api-error';

const fmtDay = (iso) => {
  const [y, m, d] = String(iso).split('-').map(Number);
  const t = new Date(y, m - 1, d);
  return Number.isNaN(t.getTime()) ? iso : t.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });
};
const fmtStamp = (v) => (v ? new Date(v).toLocaleString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : '');

/** Every pending reschedule request in `appointments`, oldest first (first come, first served). */
export const pendingRescheduleRequests = (appointments = []) => appointments
  .flatMap((a) => (a.rescheduleRequests || []).filter((r) => r.status === 'Pending').map((r) => ({ appt: a, request: r })))
  .sort((x, y) => new Date(x.request.requestedAt) - new Date(y.request.requestedAt));

function When({ label, date, time, highlight }) {
  return (
    <Box sx={{
      px: 1.5, py: 1, borderRadius: '10px', minWidth: 0, flex: 1,
      bgcolor: (t) => (highlight ? t.custom.tones.success.bg : t.custom.surface.subtle),
      border: '1px solid', borderColor: (t) => (highlight ? alpha(t.custom.tones.success.dot, 0.3) : t.palette.divider),
    }}>
      <Typography sx={{ fontSize: '0.72rem', color: 'text.secondary', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</Typography>
      <Typography sx={{ fontSize: '0.9rem', fontWeight: 700 }}>{fmtDay(date)}</Typography>
      <Typography sx={{ fontSize: '0.84rem', color: 'text.secondary' }}>{time}</Typography>
    </Box>
  );
}

/**
 * Staff view of donors' requests to move a confirmed appointment. Approving re-checks the slot
 * on the server and only then moves the appointment; rejecting leaves it as it is. The donor is
 * notified either way through their notification feed. `onUpdated` receives the saved appointment.
 */
export default function RescheduleRequestsPanel({ appointments, token, onUpdated, showHospital = false }) {
  const items = pendingRescheduleRequests(appointments);
  const [deciding, setDeciding] = useState(null); // { appt, request, decision }
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState('');

  if (!items.length && !done) return null;

  const open = (item, decision) => { setDeciding({ ...item, decision }); setNote(''); setError(''); };
  const submit = async () => {
    const { appt, request, decision } = deciding;
    setSaving(true);
    setError('');
    try {
      const { data } = await axios.patch(
        `${API_BASE}/api/appointments/${appt._id}/reschedule-requests/${request._id}`,
        { decision, note: note.trim() },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      onUpdated(data);
      setDone(decision === 'approve'
        ? `Approved. ${appt.fullName}'s appointment is now on ${fmtDay(request.toDate)}, ${request.toTime}.`
        : `Declined. ${appt.fullName}'s appointment stays on ${fmtDay(request.fromDate)}, ${request.fromTime}.`);
      setDeciding(null);
    } catch (err) {
      setError(apiErrorMessage(err, 'Could not save the decision. Please try again.'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Paper component="section" elevation={0} aria-labelledby="reschedule-requests-title" sx={{
      mb: 3, p: { xs: 2, sm: 2.5 }, borderRadius: '14px', border: '1px solid',
      borderColor: (t) => alpha(t.custom.tones.warning.dot, 0.45), bgcolor: 'background.paper',
    }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25, mb: items.length ? 2 : 0 }}>
        <Box aria-hidden="true" sx={{
          width: 38, height: 38, borderRadius: '10px', display: 'grid', placeItems: 'center',
          bgcolor: (t) => t.custom.tones.warning.bg, color: (t) => t.custom.tones.warning.fg,
        }}>
          <EventRepeatIcon />
        </Box>
        <Box sx={{ flex: 1 }}>
          <Typography id="reschedule-requests-title" component="h2" sx={{ fontWeight: 700, fontSize: '1.05rem' }}>
            Reschedule requests {items.length > 0 && `(${items.length})`}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {items.length ? 'Donors asking to move a confirmed appointment. Their current slot is kept until you approve.' : 'No requests waiting.'}
          </Typography>
        </Box>
      </Box>

      {done && <Alert severity="success" onClose={() => setDone('')} sx={{ mb: items.length ? 2 : 0, mt: items.length ? 0 : 2 }}>{done}</Alert>}

      <Box sx={{ display: 'grid', gap: 1.5 }}>
        {items.map(({ appt, request }) => (
          <Box key={request._id} sx={{
            p: 2, borderRadius: '12px', border: '1px solid', borderColor: 'divider',
            display: 'grid', gap: 2, alignItems: 'center',
            gridTemplateColumns: { xs: '1fr', md: 'minmax(180px, 1fr) minmax(280px, 1.4fr) auto' },
          }}>
            <Box sx={{ minWidth: 0 }}>
              <Typography sx={{ fontWeight: 700 }}>{appt.fullName}</Typography>
              <Typography variant="body2" color="text.secondary" noWrap>
                {appt.bloodType}{showHospital && appt.location ? ` · ${appt.location}` : ''} · {appt.phone}
              </Typography>
              <Typography variant="body2" sx={{ mt: 0.75, overflowWrap: 'anywhere' }}>“{request.reason}”</Typography>
              <Typography variant="caption" color="text.secondary">Requested {fmtStamp(request.requestedAt)}</Typography>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <When label="Current" date={request.fromDate} time={request.fromTime} />
              <ArrowForwardIcon aria-label="to" sx={{ color: 'text.secondary', flexShrink: 0 }} />
              <When label="Requested" date={request.toDate} time={request.toTime} highlight />
            </Box>
            <Box sx={{ display: 'flex', gap: 1, justifyContent: { md: 'flex-end' } }}>
              <Button variant="outlined" color="inherit" startIcon={<CloseIcon />} onClick={() => open({ appt, request }, 'reject')}
                sx={{ flex: { xs: 1, md: 'none' } }}>
                Reject
              </Button>
              <Button variant="contained" color="success" startIcon={<CheckIcon />} onClick={() => open({ appt, request }, 'approve')}
                sx={{ flex: { xs: 1, md: 'none' } }}>
                Approve
              </Button>
            </Box>
          </Box>
        ))}
      </Box>

      {deciding && (
        <Dialog open onClose={saving ? undefined : () => setDeciding(null)} maxWidth="xs" fullWidth aria-labelledby="decide-title">
          <DialogTitle id="decide-title">{deciding.decision === 'approve' ? 'Approve the new date?' : 'Reject this request?'}</DialogTitle>
          <DialogContent>
            <Typography variant="body2" color="text.secondary">
              {deciding.decision === 'approve'
                ? `${deciding.appt.fullName}'s appointment will move from ${fmtDay(deciding.request.fromDate)}, ${deciding.request.fromTime} to ${fmtDay(deciding.request.toDate)}, ${deciding.request.toTime}. Availability is checked again before saving.`
                : `${deciding.appt.fullName}'s appointment stays on ${fmtDay(deciding.request.fromDate)}, ${deciding.request.fromTime}.`}
            </Typography>
            <TextField sx={{ mt: 2 }} fullWidth multiline minRows={2}
              label={deciding.decision === 'approve' ? 'Note to the donor (optional)' : 'Reason for the donor (recommended)'}
              value={note} onChange={(e) => setNote(e.target.value.slice(0, 500))} helperText={`${note.length}/500`} />
            {error && <Alert severity="error" sx={{ mt: 1 }}>{error}</Alert>}
          </DialogContent>
          <DialogActions>
            <Button color="inherit" onClick={() => setDeciding(null)} disabled={saving}>Back</Button>
            <Button variant="contained" color={deciding.decision === 'approve' ? 'success' : 'error'} onClick={submit} disabled={saving}
              startIcon={saving ? <CircularProgress size={16} color="inherit" /> : null}>
              {deciding.decision === 'approve' ? 'Approve' : 'Reject'}
            </Button>
          </DialogActions>
        </Dialog>
      )}
    </Paper>
  );
}
