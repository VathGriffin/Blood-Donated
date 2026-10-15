'use client';
import { useState } from 'react';
import Link from 'next/link';
import { Box, Button, Paper, Typography } from '@mui/material';
import PlaceOutlinedIcon from '@mui/icons-material/PlaceOutlined';
import WaterDropOutlinedIcon from '@mui/icons-material/WaterDropOutlined';
import EventNoteOutlinedIcon from '@mui/icons-material/EventNoteOutlined';
import HowToRegOutlinedIcon from '@mui/icons-material/HowToRegOutlined';
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined';
import QrCode2Icon from '@mui/icons-material/QrCode2';
import HeadsetMicOutlinedIcon from '@mui/icons-material/HeadsetMicOutlined';
import EventRepeatIcon from '@mui/icons-material/EventRepeat';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import HourglassTopIcon from '@mui/icons-material/HourglassTop';
import CancelIcon from '@mui/icons-material/Cancel';
import HistoryIcon from '@mui/icons-material/History';
import TaskAltIcon from '@mui/icons-material/TaskAlt';
import { CardMenu, Pill, actionBtnSx, dangerBtnSx, formatDate } from '@/components/donor/ui';
import { HOSPITAL_FALLBACK_IMAGE } from '@/app/(public)/appointments/_components/booking';
import { categoryOf, daysUntil, telHref } from './appointments';

// Badge per state. "Upcoming" shows the real status (Pending vs Confirmed) since both are upcoming.
const BADGE = {
  Pending:   { tone: 'warning', label: 'Awaiting confirmation', icon: <HourglassTopIcon /> },
  Confirmed: { tone: 'success', label: 'Confirmed',             icon: <CheckCircleIcon /> },
  completed: { tone: 'info',    label: 'Completed',             icon: <TaskAltIcon /> },
  cancelled: { tone: 'error',   label: 'Cancelled',             icon: <CancelIcon /> },
  missed:    { tone: 'neutral', label: 'Missed',                icon: <HistoryIcon /> },
};

function DatePanel({ date, time }) {
  const month = formatDate(date, { month: 'short' });
  const day = formatDate(date, { day: '2-digit' });
  const year = formatDate(date, { year: 'numeric' });
  return (
    <Box sx={{
      width: { xs: 76, sm: 96 }, flexShrink: 0, borderRadius: '12px', overflow: 'hidden', textAlign: 'center',
      border: '1px solid', borderColor: 'divider', bgcolor: 'background.paper', alignSelf: 'stretch',
      display: 'flex', flexDirection: 'column',
    }}>
      <Box sx={{ bgcolor: (t) => t.custom.tones.primary.bg, color: 'primary.main', fontWeight: 800, fontSize: { xs: '1rem', sm: '1.15rem' }, py: 0.75 }}>
        {month && day ? `${month} ${day}` : '—'}
      </Box>
      <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', py: 0.75 }}>
        <Typography sx={{ fontWeight: 800, fontSize: { xs: '0.98rem', sm: '1.1rem' }, lineHeight: 1.2 }}>{year || ''}</Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5, fontWeight: 500 }}>{time}</Typography>
      </Box>
    </Box>
  );
}

function Fact({ icon, label, value }) {
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, minWidth: 0 }}>
      <Box aria-hidden="true" sx={{ display: 'flex', color: 'primary.main', '& svg': { fontSize: 22 } }}>{icon}</Box>
      <Box sx={{ minWidth: 0 }}>
        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', lineHeight: 1.3 }}>{label}</Typography>
        <Typography noWrap sx={{ fontSize: '0.88rem', fontWeight: 600, lineHeight: 1.3 }}>{value}</Typography>
      </Box>
    </Box>
  );
}

/**
 * One of the donor's own appointments as a wide row. `hospital` is the public directory entry
 * (name, address, city, phone, image) when the appointment is linked to a registered hospital.
 * Donors can't change an appointment's status — the API reserves that for staff — so the only
 * actions are viewing it, the QR card for check-in, calling the center and booking again.
 */
export default function AppointmentRow({ appt, hospital, onView }) {
  const [imgFailed, setImgFailed] = useState(false);
  const cat = categoryOf(appt);
  const badge = cat === 'upcoming' ? BADGE[appt.status || 'Pending'] : BADGE[cat];
  const tel = telHref(hospital?.phone);
  const place = hospital ? [hospital.address, hospital.city].filter(Boolean).join(', ') : '';
  const img = !imgFailed && hospital?.imageUrl ? hospital.imageUrl : HOSPITAL_FALLBACK_IMAGE;
  const rebookHref = appt.hospital ? `/appointments?hospital=${encodeURIComponent(appt.hospital)}` : '/appointments';

  let statusNote = null;
  if (cat === 'upcoming') statusNote = daysUntil(appt.date);
  else if (cat === 'completed') statusNote = formatDate(appt.checkedInAt || appt.date) && `Completed on ${formatDate(appt.checkedInAt || appt.date)}`;
  else if (cat === 'cancelled') statusNote = formatDate(appt.updatedAt) && `Cancelled on ${formatDate(appt.updatedAt)}`;
  else statusNote = 'Date passed without a check-in';

  const view = (
    <Button variant="outlined" startIcon={<VisibilityOutlinedIcon />} onClick={() => onView(appt)} sx={actionBtnSx}
      aria-label={`View details of the appointment at ${appt.location}`}>
      View Details
    </Button>
  );
  let actions;
  if (cat === 'upcoming') {
    actions = (
      <>
        {view}
        <Button component={Link} href="/qr-card" variant="outlined" startIcon={<QrCode2Icon />} sx={dangerBtnSx}>QR Card</Button>
      </>
    );
  } else if (cat === 'missed') {
    actions = <>{view}<Button component={Link} href={rebookHref} variant="outlined" startIcon={<EventRepeatIcon />} sx={dangerBtnSx}>Book Again</Button></>;
  } else {
    actions = view;
  }

  const menuItems = [
    { label: 'View details', icon: <VisibilityOutlinedIcon />, onClick: () => onView(appt) },
    cat === 'upcoming' && { label: 'Show my QR card', icon: <QrCode2Icon />, href: '/qr-card' },
    tel && { label: 'Contact center', icon: <HeadsetMicOutlinedIcon />, href: tel, external: true },
    { label: 'Book another appointment', icon: <EventRepeatIcon />, href: rebookHref },
  ].filter(Boolean);

  return (
    <Paper component="article" elevation={0} aria-label={`Appointment at ${appt.location}, ${formatDate(appt.date) || appt.date} ${appt.time}, ${badge.label}`} sx={{
      p: { xs: 1.75, sm: 2 }, borderRadius: '16px', border: '1px solid', borderColor: 'divider', bgcolor: 'background.paper',
      boxShadow: (t) => t.custom.shadow.xs, transition: 'box-shadow .15s', '&:hover': { boxShadow: (t) => t.custom.shadow.sm },
      display: 'grid', gap: { xs: 1.75, md: 2.5 }, alignItems: 'center',
      // The hospital photo shows at every width. Phone: photo strip on top, then date + info,
      // status and actions. Tablet/laptop: date, photo and info side by side, status and actions
      // below or on the right. Wide screens: one row, as in the design.
      gridTemplateColumns: {
        xs: 'auto minmax(0, 1fr) auto',
        sm: 'auto 112px minmax(0, 1fr) auto',
        lg: 'auto 120px minmax(0, 1fr) auto auto',
        xl: 'auto 132px minmax(0, 1fr) 190px auto auto',
      },
      gridTemplateAreas: {
        xs: '"image image image" "date info menu" "status status status" "actions actions actions"',
        sm: '"date image info menu" "status status status status" "actions actions actions actions"',
        lg: '"date image info status menu" "date image info actions actions"',
        xl: '"date image info status actions menu"',
      },
    }}>
      <Box sx={{ gridArea: 'date', alignSelf: 'stretch', display: 'flex' }}><DatePanel date={appt.date} time={appt.time} /></Box>

      <Box component="img" src={img} alt={hospital?.imageUrl && !imgFailed ? `Photo of ${hospital.name}` : ''}
        loading="lazy" decoding="async" onError={() => setImgFailed(true)} sx={{
        gridArea: 'image', display: 'block', objectFit: 'cover', borderRadius: '12px', bgcolor: (t) => t.custom.surface.subtle,
        width: { xs: '100%', sm: 112, lg: 120, xl: 132 }, height: { xs: 140, sm: 88, lg: 96, xl: 92 },
        border: '1px solid', borderColor: 'divider',
      }} />

      <Box sx={{ gridArea: 'info', minWidth: 0 }}>
        <Typography component="h3" sx={{ fontWeight: 800, fontSize: { xs: '1.02rem', sm: '1.12rem' }, overflowWrap: 'anywhere' }}>{appt.location}</Typography>
        {place && (
          <Typography variant="body2" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.25, minWidth: 0 }}>
            <PlaceOutlinedIcon aria-hidden="true" sx={{ fontSize: 17 }} />
            <Box component="span" sx={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{place}</Box>
          </Typography>
        )}
        <Box sx={{ mt: 1.25, display: 'grid', gridTemplateColumns: { xs: '1fr 1fr', sm: 'repeat(3, minmax(0, auto))' }, columnGap: 3, rowGap: 1, justifyContent: 'start' }}>
          {appt.bloodType && <Fact icon={<WaterDropOutlinedIcon />} label="Blood Type" value={appt.bloodType} />}
          <Fact icon={<EventNoteOutlinedIcon />} label="Booked on" value={formatDate(appt.createdAt) || '—'} />
          {cat === 'completed' && appt.checkedInAt && (
            <Fact icon={<HowToRegOutlinedIcon />} label="Checked in"
              value={new Date(appt.checkedInAt).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })} />
          )}
        </Box>
      </Box>

      <Box sx={{ gridArea: 'status', display: 'flex', flexDirection: { xs: 'row', xl: 'column' }, alignItems: { xs: 'center', xl: 'flex-start' }, gap: 1, flexWrap: 'wrap' }}>
        <Pill tone={badge.tone} icon={badge.icon} sx={{ fontSize: '0.8rem', py: 0.5, px: 1.25 }}>{badge.label}</Pill>
        {statusNote && <Typography variant="body2" color="text.secondary">{statusNote}</Typography>}
      </Box>

      <Box sx={{ gridArea: 'actions', display: 'flex', gap: 1.25, flexWrap: 'wrap', justifyContent: { lg: 'flex-end' }, '& > *': { flex: { xs: '1 1 auto', lg: '0 0 auto' } } }}>
        {actions}
      </Box>

      <Box sx={{ gridArea: 'menu', alignSelf: 'start' }}>
        <CardMenu id={appt._id} label={`the appointment at ${appt.location}`} items={menuItems} />
      </Box>
    </Paper>
  );
}
