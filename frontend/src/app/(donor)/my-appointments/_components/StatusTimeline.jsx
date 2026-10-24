'use client';
import { Box, Paper, Typography } from '@mui/material';
import { alpha } from '@mui/material/styles';
import CheckIcon from '@mui/icons-material/Check';
import AddIcon from '@mui/icons-material/Add';
import PriorityHighIcon from '@mui/icons-material/PriorityHigh';
import CloseIcon from '@mui/icons-material/Close';
import { categoryOf, fmtStamp, shortDay, slotRange, whenLabel } from './appointments';

// state: 'done' (red tick), 'current' (amber, waiting on someone), 'failed' (grey cross), 'todo' (grey plus)
function stepsFor(a) {
  const cat = categoryOf(a);
  const steps = [{ title: 'Booking Submitted', at: fmtStamp(a.createdAt), text: 'Your appointment has been submitted.', state: 'done' }];

  if (a.status === 'Pending') {
    steps.push({ title: 'Awaiting Hospital Confirmation', text: 'The hospital will review and confirm your booking.', state: cat === 'upcoming' ? 'current' : 'todo' });
  } else if (a.confirmedAt || a.status === 'Confirmed' || a.status === 'CheckedIn') {
    steps.push({ title: 'Confirmed by Hospital', at: fmtStamp(a.confirmedAt), text: 'Hospital confirmed your appointment.', state: 'done' });
  }

  for (const r of a.rescheduleRequests || []) {
    const to = whenLabel(r.toDate, r.toTime);
    if (r.reviewerRole === 'system') {
      steps.push({ title: 'Date Changed', at: fmtStamp(r.requestedAt), text: `Moved from ${whenLabel(r.fromDate, r.fromTime)} to ${to}.`, state: 'done' });
      continue;
    }
    steps.push({ title: 'Change Requested', at: fmtStamp(r.requestedAt), text: `You asked to move to ${to}.`, state: 'done' });
    if (r.status === 'Pending') steps.push({ title: 'Waiting for Hospital Approval', text: 'Your current appointment stays as it is until then.', state: 'current' });
    if (r.status === 'Approved') steps.push({ title: 'New Date Approved', at: fmtStamp(r.reviewedAt), text: `Rescheduled to ${to}.`, state: 'done' });
    if (r.status === 'Rejected') steps.push({ title: 'Change Declined', at: fmtStamp(r.reviewedAt), text: r.decisionNote || 'Your original appointment was kept.', state: 'failed' });
    if (r.status === 'Withdrawn') steps.push({ title: 'Request Closed', at: fmtStamp(r.reviewedAt), text: r.decisionNote || 'The request was withdrawn.', state: 'failed' });
  }

  if (cat === 'cancelled') {
    const who = a.cancelledBy === 'donor' ? 'You cancelled this appointment.' : a.cancelledBy === 'staff' ? 'The hospital cancelled this appointment.' : 'This appointment was cancelled.';
    steps.push({ title: 'Cancelled', at: fmtStamp(a.cancelledAt || a.updatedAt), text: a.cancellationReason ? `${who} Reason: ${a.cancellationReason}` : who, state: 'failed' });
    return steps;
  }

  const checkedIn = a.status === 'CheckedIn';
  steps.push({
    title: cat === 'missed' ? 'Missed' : checkedIn ? 'Donation Day' : 'Upcoming',
    at: `${shortDay(a.date)}, ${slotRange(a.time)}`,
    text: cat === 'missed' ? 'The date passed without a check-in.' : checkedIn ? 'You came in to donate.' : 'Your appointment is scheduled.',
    state: checkedIn ? 'done' : cat === 'missed' ? 'failed' : 'todo',
  });
  steps.push({
    title: 'Check-in', at: checkedIn ? fmtStamp(a.checkedInAt) : '',
    text: checkedIn ? 'Checked in. Thank you for saving lives!' : 'Not yet checked in.',
    state: checkedIn ? 'done' : 'todo',
  });
  return steps;
}

const DOT = {
  done: { icon: <CheckIcon />, bg: (t) => t.palette.primary.main, fg: '#fff' },
  current: { icon: <PriorityHighIcon />, bg: (t) => t.custom.tones.warning.dot, fg: '#fff' },
  failed: { icon: <CloseIcon />, bg: (t) => (t.palette.mode === 'dark' ? '#3A3A3A' : t.palette.grey[300]), fg: '#fff' },
  todo: { icon: <AddIcon />, bg: (t) => (t.palette.mode === 'dark' ? '#2A2A2A' : t.palette.grey[300]), fg: '#fff' },
};

export default function StatusTimeline({ appt }) {
  const steps = appt ? stepsFor(appt) : [];
  return (
    <Paper component="section" elevation={0} aria-labelledby="appt-status-title" sx={{
      p: { xs: 2.25, sm: 3 }, borderRadius: '16px', border: '1px solid', borderColor: 'divider', bgcolor: 'background.paper',
      boxShadow: (t) => t.custom.shadow.xs,
    }}>
      <Typography id="appt-status-title" component="h2" sx={{ fontWeight: 700, fontSize: '1.15rem' }}>Appointment Status</Typography>
      {appt ? (
        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.25, mb: 2.5 }} noWrap>
          {appt.location} · {shortDay(appt.date)}
        </Typography>
      ) : (
        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>Select an appointment to follow its progress.</Typography>
      )}

      <Box component="ol" sx={{ listStyle: 'none', m: 0, p: 0 }}>
        {steps.map((s, i) => {
          const dot = DOT[s.state];
          const next = steps[i + 1];
          const last = i === steps.length - 1;
          return (
            <Box component="li" key={`${s.title}-${i}`} aria-current={s.state === 'current' ? 'step' : undefined}
              sx={{ display: 'grid', gridTemplateColumns: '28px minmax(0, 1fr)', columnGap: 2, position: 'relative', pb: last ? 0 : 2.5 }}>
              {!last && (
                <Box aria-hidden="true" sx={{
                  position: 'absolute', left: 13, top: 30, bottom: 2, width: 2, borderRadius: 1,
                  bgcolor: (t) => (s.state === 'done' && next?.state === 'done' ? alpha(t.palette.primary.main, 0.6) : t.palette.divider),
                }} />
              )}
              <Box aria-hidden="true" sx={{
                width: 28, height: 28, borderRadius: '50%', display: 'grid', placeItems: 'center', bgcolor: dot.bg, color: dot.fg,
                boxShadow: (t) => (s.state === 'current' ? `0 0 0 4px ${alpha(t.custom.tones.warning.dot, 0.2)}` : 'none'),
                '& svg': { fontSize: 18 },
              }}>
                {dot.icon}
              </Box>
              <Box sx={{ minWidth: 0, pt: 0.25 }}>
                <Typography sx={{ fontWeight: 700, fontSize: '0.95rem', }}>{s.title}</Typography>
                {s.at && <Typography sx={{ fontSize: '0.84rem', color: 'text.secondary', mt: 0.25 }}>{s.at}</Typography>}
                <Typography sx={{ fontSize: '0.86rem', color: 'text.secondary', mt: 0.25, overflowWrap: 'anywhere' }}>{s.text}</Typography>
              </Box>
            </Box>
          );
        })}
      </Box>
    </Paper>
  );
}
