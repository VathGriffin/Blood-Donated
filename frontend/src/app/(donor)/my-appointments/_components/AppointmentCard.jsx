'use client';
import { useState } from 'react';
import Link from 'next/link';
import { Box, Button, Paper, Typography } from '@mui/material';
import { alpha } from '@mui/material/styles';
import LocalHospitalIcon from '@mui/icons-material/LocalHospital';
import CalendarMonthOutlinedIcon from '@mui/icons-material/CalendarMonthOutlined';
import WaterDropIcon from '@mui/icons-material/WaterDrop';
import PersonOutlineIcon from '@mui/icons-material/PersonOutline';
import AssignmentOutlinedIcon from '@mui/icons-material/AssignmentOutlined';
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined';
import EditCalendarOutlinedIcon from '@mui/icons-material/EditCalendarOutlined';
import EventOutlinedIcon from '@mui/icons-material/EventOutlined';
import CloseIcon from '@mui/icons-material/Close';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import HourglassTopIcon from '@mui/icons-material/HourglassTop';
import EventRepeatIcon from '@mui/icons-material/EventRepeat';
import CancelIcon from '@mui/icons-material/Cancel';
import TaskAltIcon from '@mui/icons-material/TaskAlt';
import HistoryIcon from '@mui/icons-material/History';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import { Notice, Pill } from '@/components/donor/ui';
import { HOSPITAL_FALLBACK_IMAGE } from '@/app/(public)/appointments/_components/booking';
import {
  allowedActions, categoryOf, downloadIcs, fmtStamp, lastDecision, openRequest, shortDay, slotRange, whenLabel,
} from './appointments';

/** The status badge for an appointment, taking reschedule state into account. */
export function badgeFor(a) {
  const cat = categoryOf(a);
  if (cat === 'completed') return { tone: 'success', label: 'Completed', icon: <TaskAltIcon /> };
  if (cat === 'cancelled') return { tone: 'neutral', label: 'Cancelled', icon: <CancelIcon /> };
  if (cat === 'missed') return { tone: 'neutral', label: 'Missed', icon: <HistoryIcon /> };
  if (a.status === 'Pending') return { tone: 'warning', label: 'Awaiting confirmation', icon: <HourglassTopIcon /> };
  if (openRequest(a)) return { tone: 'warning', label: 'Change requested', icon: <EventRepeatIcon /> };
  if (lastDecision(a)?.status === 'Approved') return { tone: 'success', label: 'Rescheduled', icon: <CheckCircleIcon /> };
  return { tone: 'info', label: 'Confirmed', icon: <CheckCircleIcon /> };
}

function Fact({ icon, label, children, iconColor = 'text.secondary' }) {
  return (
    <Box sx={{ display: 'flex', gap: 1.25, minWidth: 0 }}>
      <Box aria-hidden="true" sx={{ color: iconColor, display: 'flex', pt: 0.25, '& svg': { fontSize: 22 } }}>{icon}</Box>
      <Box sx={{ minWidth: 0 }}>
        <Typography sx={{ fontSize: '0.8rem', color: 'text.secondary', lineHeight: 1.4 }}>{label}</Typography>
        <Box sx={{ fontSize: '0.95rem', fontWeight: 700, lineHeight: 1.35, color: 'text.primary' }}>{children}</Box>
      </Box>
    </Box>
  );
}

const btn = {
  height: 44, px: 2.25, borderRadius: '10px', fontWeight: 600, fontSize: '0.9rem', whiteSpace: 'nowrap', borderWidth: 1.5,
  '&:hover': { borderWidth: 1.5 },
};
const neutralBtn = { ...btn, color: 'text.primary', borderColor: 'divider', '&:hover': { borderWidth: 1.5, borderColor: 'text.secondary', bgcolor: 'action.hover' } };
const primaryBtn = { ...btn, borderColor: 'primary.main', '&:hover': { borderWidth: 1.5, bgcolor: (t) => t.custom.tones.primary.bg } };
const softDangerBtn = {
  ...btn, color: 'primary.main', borderColor: (t) => alpha(t.palette.primary.main, 0.3),
  '&:hover': { borderWidth: 1.5, borderColor: 'primary.main', bgcolor: (t) => t.custom.tones.primary.bg },
};

/**
 * One of the donor's appointments: hospital, date and time, blood and donation type, the current
 * reschedule state and the actions the API allows right now. Focusing or clicking anywhere in the
 * card selects it, which drives the status timeline beside the list.
 */
export default function AppointmentCard({ appt, hospital, selected, onSelect, onView, onChange, onCancel, onWithdraw, busy }) {
  const [imgFailed, setImgFailed] = useState(false);
  const cat = categoryOf(appt);
  const badge = badgeFor(appt);
  const can = allowedActions(appt);
  const pending = openRequest(appt);
  const decision = !pending ? lastDecision(appt) : null;
  const place = hospital ? [hospital.address, hospital.city].filter(Boolean).join(', ') : '';
  const img = !imgFailed && hospital?.imageUrl ? hospital.imageUrl : HOSPITAL_FALLBACK_IMAGE;
  const upcoming = cat === 'upcoming';

  return (
    <Paper component="article" elevation={0} onClick={() => onSelect(appt)} onFocusCapture={() => onSelect(appt)}
      aria-label={`Appointment at ${appt.location}, ${shortDay(appt.date)} ${slotRange(appt.time)}, ${badge.label}`}
      aria-current={selected ? 'true' : undefined}
      sx={{
        p: { xs: 2, sm: 2.5 }, borderRadius: '16px', border: '1.5px solid', bgcolor: 'background.paper', cursor: 'default',
        borderColor: selected ? (t) => alpha(t.palette.primary.main, 0.45) : 'divider',
        boxShadow: (t) => (selected ? t.custom.shadow.md : t.custom.shadow.xs),
        '&:hover': { boxShadow: (t) => t.custom.shadow.md },
      }}>
      <Box sx={{ display: 'grid', gap: { xs: 1.75, sm: 2.5 }, gridTemplateColumns: { xs: '1fr', sm: '140px minmax(0, 1fr)' } }}>
        <Box component="img" src={img} alt={hospital?.imageUrl && !imgFailed ? `Photo of ${hospital.name}` : ''}
          loading="lazy" decoding="async" onError={() => setImgFailed(true)}
          sx={{
            width: '100%', height: { xs: 150, sm: 108 }, objectFit: 'cover', borderRadius: '10px', display: 'block',
            bgcolor: (t) => t.custom.surface.subtle, border: '1px solid', borderColor: 'divider',
          }} />

        <Box sx={{ minWidth: 0 }}>
          <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5, justifyContent: 'space-between', flexWrap: 'wrap' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25, minWidth: 0 }}>
              <LocalHospitalIcon aria-hidden="true" sx={{ color: 'primary.main', fontSize: 26, flexShrink: 0 }} />
              <Typography component="h3" sx={{ fontWeight: 700, fontSize: { xs: '1.05rem', sm: '1.15rem' }, overflowWrap: 'anywhere' }}>
                {appt.location}
              </Typography>
            </Box>
            <Pill tone={badge.tone} icon={badge.icon} sx={{ fontSize: '0.82rem', py: 0.6, px: 1.4, borderRadius: '8px' }}>{badge.label}</Pill>
          </Box>
          {place && <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5, pl: { sm: 4.6 } }}>{place}</Typography>}

          <Box sx={{
            mt: 2, display: 'grid', gap: 2,
            gridTemplateColumns: { xs: '1fr 1fr', md: 'minmax(0, 1.3fr) minmax(0, 1fr) minmax(0, 1fr)' },
            '& > :first-of-type': { gridColumn: { xs: '1 / -1', md: 'auto' } },
          }}>
            <Fact icon={<CalendarMonthOutlinedIcon />} label="Date & Time">
              {shortDay(appt.date)}<br />{slotRange(appt.time)}
            </Fact>
            <Fact icon={<WaterDropIcon />} iconColor="primary.main" label="Blood Type">{appt.bloodType || '—'}</Fact>
            <Fact icon={<PersonOutlineIcon />} label="Donation Type">
              <Box component="span" sx={{ fontWeight: 500 }}>{appt.donationType || 'Whole Blood'}</Box>
            </Fact>
          </Box>
        </Box>
      </Box>

      {upcoming && (
        <Box sx={{ mt: 2, display: 'flex', gap: 1.25, alignItems: 'flex-start' }}>
          <AssignmentOutlinedIcon aria-hidden="true" sx={{ color: 'text.secondary', fontSize: 22, mt: 0.1 }} />
          <Box sx={{ minWidth: 0 }}>
            <Typography sx={{ fontSize: '0.82rem', color: 'text.secondary' }}>{appt.notes?.trim() ? 'Your note' : 'Before you go'}</Typography>
            <Typography sx={{ fontSize: '0.9rem', overflowWrap: 'anywhere' }}>
              {appt.notes?.trim() || 'Please arrive on time and bring your ID card and QR card. Thank you for your support!'}
            </Typography>
          </Box>
        </Box>
      )}

      {/* Reschedule / cancellation state */}
      {pending && (
        <Box sx={{ mt: 2 }}>
          <Notice tone="warning" icon={<HourglassTopIcon />}>
            <Box component="span" sx={{ display: 'block' }}>
              Change requested to <strong>{whenLabel(pending.toDate, pending.toTime)}</strong>. Waiting for the hospital&apos;s approval.
            </Box>
            <Box component="span" sx={{ display: 'block', fontWeight: 500 }}>
              Your current appointment stays as it is until the hospital approves. Sent {fmtStamp(pending.requestedAt)}.
            </Box>
            {can.withdraw && (
              <Button size="small" color="inherit" disabled={busy} onClick={(e) => { e.stopPropagation(); onWithdraw(appt, pending); }}
                sx={{ mt: 0.5, ml: -1, fontWeight: 700, textDecoration: 'underline', '&:hover': { textDecoration: 'underline', bgcolor: 'transparent' } }}>
                Withdraw request
              </Button>
            )}
          </Notice>
        </Box>
      )}
      {decision?.status === 'Approved' && upcoming && (
        <Box sx={{ mt: 2 }}>
          <Notice tone="success" icon={<CheckCircleIcon />}>
            <Box component="span" sx={{ display: 'block' }}>This appointment has been rescheduled and confirmed by the hospital.</Box>
            <Box component="span" sx={{ display: 'block', fontWeight: 500 }}>
              Changed from {whenLabel(decision.fromDate, decision.fromTime)} to {whenLabel(decision.toDate, decision.toTime)}.
            </Box>
          </Notice>
        </Box>
      )}
      {decision?.status === 'Rejected' && upcoming && (
        <Box sx={{ mt: 2 }}>
          <Notice tone="error" icon={<InfoOutlinedIcon />}>
            <Box component="span" sx={{ display: 'block' }}>
              The hospital couldn&apos;t move this appointment to {whenLabel(decision.toDate, decision.toTime)}.
            </Box>
            <Box component="span" sx={{ display: 'block', fontWeight: 500 }}>
              {decision.decisionNote ? `“${decision.decisionNote}” ` : ''}Your original appointment still stands.
            </Box>
          </Notice>
        </Box>
      )}
      {cat === 'cancelled' && (appt.cancelledAt || appt.cancellationReason) && (
        <Box sx={{ mt: 2 }}>
          <Notice tone="neutral" icon={<InfoOutlinedIcon />}>
            Cancelled {appt.cancelledBy === 'donor' ? 'by you' : appt.cancelledBy === 'staff' ? 'by the hospital' : ''}
            {appt.cancelledAt ? ` on ${fmtStamp(appt.cancelledAt)}` : ''}.
            {appt.cancellationReason ? ` Reason: ${appt.cancellationReason}` : ''}
          </Notice>
        </Box>
      )}

      <Box sx={{
        mt: 2.5, display: 'grid', gap: 1.25,
        gridTemplateColumns: { xs: '1fr', sm: 'repeat(3, minmax(0, 1fr))', lg: 'repeat(3, minmax(0, 220px))' },
      }} onClick={(e) => e.stopPropagation()}>
        <Button variant="outlined" startIcon={<VisibilityOutlinedIcon />} onClick={() => onView(appt)} sx={neutralBtn}>View Details</Button>
        {can.change && !(decision?.status === 'Approved') ? (
          <Button variant="outlined" startIcon={<EditCalendarOutlinedIcon />} onClick={() => onChange(appt)} sx={primaryBtn}>Change Date</Button>
        ) : upcoming ? (
          <Button variant="outlined" startIcon={<EventOutlinedIcon />} onClick={() => downloadIcs(appt, place)} sx={neutralBtn}>Add to Calendar</Button>
        ) : (
          <Button component={Link} variant="outlined" startIcon={<EventRepeatIcon />} sx={primaryBtn}
            href={appt.hospital ? `/appointments?hospital=${encodeURIComponent(appt.hospital)}` : '/appointments'}>
            Book Again
          </Button>
        )}
        {can.cancel && (
          <Button variant="outlined" startIcon={<CloseIcon />} onClick={() => onCancel(appt)} sx={softDangerBtn}>Cancel Appointment</Button>
        )}
      </Box>
      {can.change && decision?.status === 'Approved' && (
        <Box sx={{ mt: 1.25 }} onClick={(e) => e.stopPropagation()}>
          <Button size="small" startIcon={<EditCalendarOutlinedIcon />} onClick={() => onChange(appt)} sx={{ fontWeight: 600 }}>
            Need another date? Request a change
          </Button>
        </Box>
      )}
    </Paper>
  );
}
