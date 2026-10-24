'use client';
import { Box, IconButton, Slide, Snackbar, Typography } from '@mui/material';
import { alpha } from '@mui/material/styles';
import CheckIcon from '@mui/icons-material/Check';
import PriorityHighIcon from '@mui/icons-material/PriorityHigh';
import CloseIcon from '@mui/icons-material/Close';
import { whenLabel } from './appointments';

const SEEN_KEY = 'bl:seenRescheduleDecisions';

export const seenDecisions = () => {
  try { return new Set(JSON.parse(localStorage.getItem(SEEN_KEY) || '[]')); } catch { return new Set(); }
};
export const markDecisionSeen = (id) => {
  try {
    const seen = seenDecisions();
    seen.add(id);
    localStorage.setItem(SEEN_KEY, JSON.stringify([...seen].slice(-100)));
  } catch { /* per-browser convenience only */ }
};

/** Newest hospital decision on a reschedule request this browser hasn't shown yet. */
export function unseenDecision(appointments, alsoSkip = new Set()) {
  const seen = seenDecisions();
  alsoSkip.forEach((id) => seen.add(id));
  let best = null;
  for (const a of appointments) {
    for (const r of a.rescheduleRequests || []) {
      if (r.reviewerRole === 'system' || !['Approved', 'Rejected'].includes(r.status) || seen.has(r._id)) continue;
      if (!best || new Date(r.reviewedAt) > new Date(best.request.reviewedAt)) best = { appt: a, request: r };
    }
  }
  return best;
}

/** Toast for "Hospital approved the new date" (or declined it). */
export default function DecisionToast({ decision, onClose }) {
  const approved = decision?.request.status === 'Approved';
  const tone = approved ? 'success' : 'error';
  return (
    <Snackbar open={Boolean(decision)} onClose={(_, why) => { if (why !== 'clickaway') onClose(); }}
      anchorOrigin={{ vertical: 'top', horizontal: 'right' }} slots={{ transition: Slide }} slotProps={{ transition: { direction: 'left' } }}
      sx={{ top: { xs: 72, sm: 84 } }}>
      {decision ? (
        <Box role="status" sx={{
          display: 'flex', gap: 2, alignItems: 'center', p: 2, pr: 1, width: { xs: '100%', sm: 380 }, borderRadius: '12px',
          // The dark-mode tones are translucent tints, so lay the tint over the paper colour.
          bgcolor: 'background.paper', backgroundImage: (t) => `linear-gradient(${t.custom.tones[tone].bg}, ${t.custom.tones[tone].bg})`,
          color: (t) => t.custom.tones[tone].fg,
          border: '1px solid', borderColor: (t) => alpha(t.custom.tones[tone].dot, 0.35), boxShadow: (t) => t.custom.shadow.lg,
        }}>
          <Box aria-hidden="true" sx={{
            width: 38, height: 38, borderRadius: '50%', flexShrink: 0, display: 'grid', placeItems: 'center', color: '#fff',
            bgcolor: (t) => t.custom.tones[tone].dot,
          }}>
            {approved ? <CheckIcon /> : <PriorityHighIcon />}
          </Box>
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography sx={{ fontWeight: 700, fontSize: '0.92rem' }}>
              {approved ? 'Hospital Approved the New Date' : 'Hospital Declined the New Date'}
            </Typography>
            <Typography sx={{ fontSize: '0.86rem', mt: 0.25 }}>
              {approved
                ? `Your appointment has been rescheduled to ${whenLabel(decision.request.toDate, decision.request.toTime)}.`
                : `Your appointment stays on ${whenLabel(decision.request.fromDate, decision.request.fromTime)}.`}
            </Typography>
          </Box>
          <IconButton size="small" onClick={onClose} aria-label="Dismiss" sx={{ color: 'inherit', alignSelf: 'flex-start' }}><CloseIcon fontSize="small" /></IconButton>
        </Box>
      ) : <span />}
    </Snackbar>
  );
}
