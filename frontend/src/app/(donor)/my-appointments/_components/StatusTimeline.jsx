'use client';
import { useT } from '@/i18n/I18nProvider';
import { Box, Paper, Typography } from '@mui/material';
import { alpha } from '@mui/material/styles';
import CheckIcon from '@mui/icons-material/Check';
import AddIcon from '@mui/icons-material/Add';
import PriorityHighIcon from '@mui/icons-material/PriorityHigh';
import CloseIcon from '@mui/icons-material/Close';
import { categoryOf, fmtStamp, shortDay, slotRange, whenLabel } from './appointments';

// state: 'done' (red tick), 'current' (amber, waiting on someone), 'failed' (grey cross), 'todo' (grey plus)
function stepsFor(t, a) {
  const s = (key, vars) => t(`donor.myappt.steps.${key}`, vars);
  const cat = categoryOf(a);
  const steps = [{ title: s('submitted'), at: fmtStamp(a.createdAt), text: s('submittedText'), state: 'done' }];

  if (a.status === 'Pending') {
    steps.push({ title: s('awaiting'), text: s('awaitingText'), state: cat === 'upcoming' ? 'current' : 'todo' });
  } else if (a.confirmedAt || a.status === 'Confirmed' || a.status === 'CheckedIn') {
    steps.push({ title: s('confirmed'), at: fmtStamp(a.confirmedAt), text: s('confirmedText'), state: 'done' });
  }

  for (const r of a.rescheduleRequests || []) {
    const to = whenLabel(r.toDate, r.toTime);
    if (r.reviewerRole === 'system') {
      steps.push({ title: s('dateChanged'), at: fmtStamp(r.requestedAt), text: s('movedFrom', { from: whenLabel(r.fromDate, r.fromTime), to }), state: 'done' });
      continue;
    }
    steps.push({ title: s('changeRequested'), at: fmtStamp(r.requestedAt), text: s('askedTo', { to }), state: 'done' });
    if (r.status === 'Pending') steps.push({ title: s('waiting'), text: s('waitingText'), state: 'current' });
    if (r.status === 'Approved') steps.push({ title: s('approved'), at: fmtStamp(r.reviewedAt), text: s('rescheduledTo', { to }), state: 'done' });
    if (r.status === 'Rejected') steps.push({ title: s('declined'), at: fmtStamp(r.reviewedAt), text: r.decisionNote || s('declinedText'), state: 'failed' });
    if (r.status === 'Withdrawn') steps.push({ title: s('closed'), at: fmtStamp(r.reviewedAt), text: r.decisionNote || s('closedText'), state: 'failed' });
  }

  if (cat === 'cancelled') {
    const who = a.cancelledBy === 'donor' ? s('youCancelled') : a.cancelledBy === 'staff' ? s('hospitalCancelled') : s('wasCancelled');
    steps.push({ title: s('cancelled'), at: fmtStamp(a.cancelledAt || a.updatedAt), text: a.cancellationReason ? `${who} ${t('donor.myappt.reason', { reason: a.cancellationReason })}` : who, state: 'failed' });
    return steps;
  }

  const checkedIn = a.status === 'CheckedIn';
  steps.push({
    title: cat === 'missed' ? s('missed') : checkedIn ? s('donationDay') : s('upcoming'),
    at: `${shortDay(a.date)}, ${slotRange(a.time)}`,
    text: cat === 'missed' ? s('missedText') : checkedIn ? s('cameIn') : s('scheduled'),
    state: checkedIn ? 'done' : cat === 'missed' ? 'failed' : 'todo',
  });
  steps.push({
    title: s('checkIn'), at: checkedIn ? fmtStamp(a.checkedInAt) : '',
    text: checkedIn ? s('checkedIn') : s('notCheckedIn'),
    state: checkedIn ? 'done' : 'todo',
  });
  return steps;
}

const DOT = {
  done: { icon: <CheckIcon />, bg: (t) => t.palette.primary.main, fg: '#fff' },
  current: { icon: <PriorityHighIcon />, bg: (t) => t.custom.tones.warning.dot, fg: '#fff' },
  failed: { icon: <CloseIcon />, bg: (t) => (t.palette.mode === 'dark' ? '#475569' : t.palette.grey[300]), fg: '#fff' },
  todo: { icon: <AddIcon />, bg: (t) => (t.palette.mode === 'dark' ? '#334155' : t.palette.grey[300]), fg: '#fff' },
};

export default function StatusTimeline({ appt }) {
  const t = useT();
  const steps = appt ? stepsFor(t, appt) : [];
  return (
    <Paper component="section" elevation={0} aria-labelledby="appt-status-title" sx={{
      p: { xs: 2.25, sm: 3 }, borderRadius: '16px', border: '1px solid', borderColor: 'divider', bgcolor: 'background.paper',
      boxShadow: (t) => t.custom.shadow.xs,
    }}>
      <Typography id="appt-status-title" component="h2" sx={{ fontWeight: 700, fontSize: '1.15rem' }}>{t('donor.myappt.statusTitle')}</Typography>
      {appt ? (
        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.25, mb: 2.5 }} noWrap>
          {appt.location} · {shortDay(appt.date)}
        </Typography>
      ) : (
        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>{t('donor.myappt.selectHint')}</Typography>
      )}

      <Box component="ol" sx={{ listStyle: 'none', m: 0, p: 0 }}>
        {steps.map((st, i) => {
          const dot = DOT[st.state];
          const next = steps[i + 1];
          const last = i === steps.length - 1;
          return (
            <Box component="li" key={`${st.title}-${i}`} aria-current={st.state === 'current' ? 'step' : undefined}
              sx={{ display: 'grid', gridTemplateColumns: '28px minmax(0, 1fr)', columnGap: 2, position: 'relative', pb: last ? 0 : 2.5 }}>
              {!last && (
                <Box aria-hidden="true" sx={{
                  position: 'absolute', left: 13, top: 30, bottom: 2, width: 2, borderRadius: 1,
                  bgcolor: (t) => (st.state === 'done' && next?.state === 'done' ? alpha(t.palette.primary.main, 0.6) : t.palette.divider),
                }} />
              )}
              <Box aria-hidden="true" sx={{
                width: 28, height: 28, borderRadius: '50%', display: 'grid', placeItems: 'center', bgcolor: dot.bg, color: dot.fg,
                boxShadow: (t) => (st.state === 'current' ? `0 0 0 4px ${alpha(t.custom.tones.warning.dot, 0.2)}` : 'none'),
                '& svg': { fontSize: 18 },
              }}>
                {dot.icon}
              </Box>
              <Box sx={{ minWidth: 0, pt: 0.25 }}>
                <Typography sx={{ fontWeight: 700, fontSize: '0.95rem', }}>{st.title}</Typography>
                {st.at && <Typography sx={{ fontSize: '0.84rem', color: 'text.secondary', mt: 0.25 }}>{st.at}</Typography>}
                <Typography sx={{ fontSize: '0.86rem', color: 'text.secondary', mt: 0.25, overflowWrap: 'anywhere' }}>{st.text}</Typography>
              </Box>
            </Box>
          );
        })}
      </Box>
    </Paper>
  );
}
