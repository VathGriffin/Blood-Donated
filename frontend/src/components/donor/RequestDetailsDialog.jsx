'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import axios from 'axios';
import {
  Alert, Box, Button, Dialog, DialogActions, DialogContent, Divider, IconButton, Skeleton, Typography, useMediaQuery,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import HeadsetMicOutlinedIcon from '@mui/icons-material/HeadsetMicOutlined';
import ChatBubbleOutlineIcon from '@mui/icons-material/ChatBubbleOutline';
import DoNotDisturbOnOutlinedIcon from '@mui/icons-material/DoNotDisturbOnOutlined';
import API_BASE from '@/lib/config';
import { BloodBadge, Pill, REQUEST_STATUS, URGENCY_TONE } from './ui';

const fmtDateTime = (v) => {
  if (!v) return null;
  const d = new Date(v);
  return Number.isNaN(d.getTime()) ? null
    : d.toLocaleString('en-US', { day: 'numeric', month: 'short', year: 'numeric', hour: 'numeric', minute: '2-digit' });
};

function Row({ label, children }) {
  return (
    <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '150px 1fr' }, gap: { xs: 0.25, sm: 2 }, py: 1.25 }}>
      <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 600 }}>{label}</Typography>
      <Typography variant="body2" component="div" sx={{ color: 'text.primary', overflowWrap: 'anywhere' }}>{children}</Typography>
    </Box>
  );
}

/**
 * Full details of one of the donor's own requests. Re-reads it from GET /api/requests/:id
 * (which only returns the caller's own request) so the status shown is current; `onFresh`
 * passes the fresh copy back so the card behind updates too. Falls back to the list copy
 * if the read fails.
 */
export default function RequestDetailsDialog({ request, token, hospitalPhone, onClose, onCancel, onFresh, onSessionExpired }) {
  const fullScreen = useMediaQuery((t) => t.breakpoints.down('sm'));
  const [fresh, setFresh] = useState(null);
  const [state, setState] = useState('loading'); // 'loading' | 'ready' | 'error'

  useEffect(() => {
    let alive = true;
    setState('loading');
    axios.get(`${API_BASE}/api/requests/${request._id}`, { headers: { Authorization: `Bearer ${token}` } })
      .then(({ data }) => { if (!alive) return; setFresh(data); setState('ready'); onFresh?.(data); })
      .catch((err) => { if (alive && !onSessionExpired?.(err)) setState('error'); });
    return () => { alive = false; };
    // Load once per opened request; the callbacks are stable enough not to need re-reading.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [request._id, token]);

  const r = fresh || request;
  const status = r.status || 'Pending';
  const meta = REQUEST_STATUS[status] || REQUEST_STATUS.Pending;
  const units = r.unitsNeeded || 1;
  const tel = hospitalPhone ? `tel:${hospitalPhone.replace(/[^\d+]/g, '')}` : null;
  const loading = state === 'loading';

  return (
    <Dialog open onClose={onClose} fullScreen={fullScreen} maxWidth="sm" fullWidth aria-labelledby="request-details-title"
      slotProps={{ paper: { sx: { borderRadius: { xs: 0, sm: '18px' } } } }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, px: 3, pt: 3, pb: 2 }}>
        <BloodBadge type={r.bloodType} width={56} height={70} />
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography id="request-details-title" component="h2" sx={{ fontWeight: 800, fontSize: '1.2rem', overflowWrap: 'anywhere' }}>
            {r.patientName}
          </Typography>
          <Box sx={{ mt: 0.75, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
            {loading ? <Skeleton width={150} height={26} /> : (
              <>
                <Pill tone={meta.tone}>{meta.label}</Pill>
                {r.urgency && <Pill tone={URGENCY_TONE[r.urgency] || 'neutral'}>{r.urgency} urgency</Pill>}
              </>
            )}
          </Box>
        </Box>
        <IconButton onClick={onClose} aria-label="Close details" sx={{ alignSelf: 'flex-start', mt: -1, mr: -1 }}>
          <CloseIcon />
        </IconButton>
      </Box>
      <Divider />

      <DialogContent sx={{ px: 3, py: 1 }}>
        {state === 'error' && (
          <Alert severity="warning" sx={{ my: 1.5, borderRadius: '10px' }}>
            Couldn&apos;t load the latest version of this request. Showing what was on your profile.
          </Alert>
        )}
        <Row label="Hospital">{r.hospitalName}</Row>
        <Divider />
        <Row label="Units needed">{units} unit{units !== 1 ? 's' : ''} of {r.bloodType}</Row>
        <Divider />
        <Row label="Requested">{fmtDateTime(r.createdAt) || '—'}</Row>
        {fmtDateTime(r.updatedAt) && r.updatedAt !== r.createdAt && (<><Divider /><Row label="Last updated">{fmtDateTime(r.updatedAt)}</Row></>)}
        {status === 'Fulfilled' && fmtDateTime(r.fulfilledAt) && (<><Divider /><Row label="Fulfilled">{fmtDateTime(r.fulfilledAt)}</Row></>)}
        {status === 'Cancelled' && (
          <>
            <Divider />
            <Row label="Cancelled">{fmtDateTime(r.cancelledAt) || '—'}</Row>
            {r.cancellationReason && (<><Divider /><Row label="Cancellation reason">{r.cancellationReason}</Row></>)}
          </>
        )}
        {r.contact && (<><Divider /><Row label="Your contact">{r.contact}</Row></>)}
        <Divider />
        <Row label="Request reason">
          {r.reason?.trim() || <Box component="span" sx={{ color: 'text.disabled', fontStyle: 'italic' }}>No additional details provided.</Box>}
        </Row>
        {status === 'Approved' && (
          <Alert severity="success" sx={{ mt: 1, mb: 1.5, borderRadius: '10px' }}>
            Approved — the hospital is arranging the blood. It can no longer be cancelled here; contact the hospital team to change it.
          </Alert>
        )}
      </DialogContent>

      <DialogActions sx={{ px: 3, py: 2, gap: 1, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
        {tel && (
          <Button component="a" href={tel} variant="outlined" startIcon={<HeadsetMicOutlinedIcon />}>Contact hospital</Button>
        )}
        <Button component={Link} href="/notification" variant="outlined" color="inherit" startIcon={<ChatBubbleOutlineIcon />}
          sx={{ borderColor: 'divider' }}>
          Message team
        </Button>
        {status === 'Pending' && !loading && (
          <Button variant="contained" color="error" startIcon={<DoNotDisturbOnOutlinedIcon />} onClick={() => { onClose(); onCancel(r); }}>
            Cancel request
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
}
