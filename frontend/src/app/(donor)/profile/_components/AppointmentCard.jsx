'use client';
import Link from 'next/link';
import { Box, Button, Paper, Typography } from '@mui/material';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import EventOutlinedIcon from '@mui/icons-material/EventOutlined';
import WaterDropOutlinedIcon from '@mui/icons-material/WaterDropOutlined';
import QrCode2Icon from '@mui/icons-material/QrCode2';
import HeadsetMicOutlinedIcon from '@mui/icons-material/HeadsetMicOutlined';
import EventRepeatIcon from '@mui/icons-material/EventRepeat';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import HourglassTopIcon from '@mui/icons-material/HourglassTop';
import FavoriteIcon from '@mui/icons-material/Favorite';
import DoNotDisturbOnOutlinedIcon from '@mui/icons-material/DoNotDisturbOnOutlined';
import HistoryIcon from '@mui/icons-material/History';
import {
  APPT_STATUS, CardMenu, MetaLine, Notice, Pill, actionBtnSx, dangerBtnSx, formatDate, itemCardSx, todayKey,
} from '@/components/donor/ui';
import HospitalPhoto from '@/app/(public)/appointments/_components/HospitalPhoto';

const STATUS_ICON = {
  Pending: <HourglassTopIcon />, Confirmed: <CheckCircleIcon />, CheckedIn: <FavoriteIcon />, Cancelled: <DoNotDisturbOnOutlinedIcon />,
};

// Calendar tag in the same shape as the blood-bag badge on request cards.
export function DateBadge({ date }) {
  return (
    <Box aria-hidden="true" sx={{
      width: 64, height: 80, flexShrink: 0, borderRadius: '12px', overflow: 'hidden', display: 'flex', flexDirection: 'column',
      border: '1px solid', borderColor: (t) => (t.palette.mode === 'dark' ? 'rgba(255,255,255,0.08)' : '#F3C1C7'),
      bgcolor: (t) => t.custom.tones.primary.bg, color: 'primary.main', textAlign: 'center',
    }}>
      <Box sx={{ bgcolor: 'primary.main', color: '#fff', fontSize: '0.72rem', fontWeight: 800, py: 0.4, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
        {formatDate(date, { month: 'short' }) || '—'}
      </Box>
      <Box sx={{ flex: 1, display: 'grid', placeItems: 'center' }}>
        <Typography sx={{ fontWeight: 800, fontSize: '1.6rem', lineHeight: 1 }}>{formatDate(date, { day: 'numeric' }) || '?'}</Typography>
      </Box>
    </Box>
  );
}

/** One of the signed-in donor's own appointments. Donors can't change status here (staff do). */
export default function AppointmentCard({ appt, hospitalPhone, hospitalImage }) {
  const status = appt.status || 'Pending';
  const meta = APPT_STATUS[status] || APPT_STATUS.Pending;
  const open = status === 'Pending' || status === 'Confirmed';
  const past = open && appt.date && appt.date < todayKey();
  const tel = hospitalPhone ? `tel:${hospitalPhone.replace(/[^\d+]/g, '')}` : null;
  const longDate = formatDate(appt.date, { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });
  const rebookHref = appt.hospital ? `/appointments?hospital=${encodeURIComponent(appt.hospital)}` : '/appointments';

  const qrBtn = <Button component={Link} href="/qr-card" variant="outlined" startIcon={<QrCode2Icon />} sx={actionBtnSx}>My QR Card</Button>;
  const callBtn = tel && (
    <Button component="a" href={tel} variant="outlined" startIcon={<HeadsetMicOutlinedIcon />} sx={dangerBtnSx}
      aria-label={`Contact ${appt.location} by phone`}>
      Contact Center
    </Button>
  );
  const bookAgain = <Button component={Link} href={rebookHref} variant="outlined" startIcon={<EventRepeatIcon />} sx={dangerBtnSx}>Book Again</Button>;

  let notice = null;
  let actions = null;
  if (past) {
    notice = (
      <Notice tone="neutral" icon={<HistoryIcon />}>
        This date has passed without a check-in.
        <Box component="span" sx={{ display: 'block', fontWeight: 500 }}>Still want to donate? Pick a new slot.</Box>
      </Notice>
    );
    actions = bookAgain;
  } else if (status === 'Pending') {
    notice = (
      <Notice tone="warning" icon={<HourglassTopIcon />}>
        Waiting for the donation center to confirm your slot.
        <Box component="span" sx={{ display: 'block', fontWeight: 500 }}>Bring your QR card on the day so staff can check you in.</Box>
      </Notice>
    );
    actions = <>{qrBtn}{callBtn}</>;
  } else if (status === 'Confirmed') {
    notice = (
      <Notice tone="success" icon={<CheckCircleIcon />}>
        Your appointment is confirmed. See you at the center!
        <Box component="span" sx={{ display: 'block', fontWeight: 500 }}>To change it, please contact the donation center.</Box>
      </Notice>
    );
    actions = <>{qrBtn}{callBtn}</>;
  } else if (status === 'CheckedIn') {
    notice = (
      <Notice tone="info" icon={<FavoriteIcon />}>
        You checked in{formatDate(appt.checkedInAt) ? ` on ${formatDate(appt.checkedInAt)}` : ''}. Thank you for donating!
      </Notice>
    );
  } else if (status === 'Cancelled') {
    notice = <Notice tone="neutral" icon={<DoNotDisturbOnOutlinedIcon />}>This appointment was cancelled.</Notice>;
    actions = bookAgain;
  }

  const menuItems = [
    open && !past && { label: 'Show my QR card', icon: <QrCode2Icon />, href: '/qr-card' },
    tel && { label: `Call ${appt.location}`, icon: <HeadsetMicOutlinedIcon />, href: tel, external: true },
    { label: 'Book another appointment', icon: <EventRepeatIcon />, href: rebookHref },
  ].filter(Boolean);

  return (
    <Paper component="article" elevation={0} aria-label={`Appointment at ${appt.location} on ${longDate || appt.date}, ${past ? 'missed' : meta.label}`} sx={itemCardSx}>
      <Box sx={{ display: 'flex', flexWrap: { xs: 'wrap', sm: 'nowrap' }, gap: { xs: 1.75, sm: 3 }, alignItems: 'flex-start' }}>
        {/* The center's photo: a banner across the top on phones, a thumbnail beside the date from sm up. */}
        <Box sx={{ order: { xs: -1, sm: 0 }, width: { xs: '100%', sm: 150 }, flexShrink: 0 }}>
          <HospitalPhoto src={hospitalImage} name={appt.location} height={{ xs: 140, sm: 80 }} radius={12} />
        </Box>
        <DateBadge date={appt.date} />
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
            <Box sx={{ flex: 1, minWidth: 0, display: 'flex', alignItems: 'center', gap: 1.25, flexWrap: 'wrap' }}>
              <Typography component="h3" sx={{ fontWeight: 800, fontSize: '1.2rem', mr: 0.5, overflowWrap: 'anywhere' }}>{appt.location}</Typography>
              <Pill tone={past ? 'neutral' : meta.tone} icon={past ? <HistoryIcon /> : STATUS_ICON[status]}>{past ? 'Missed' : meta.label}</Pill>
            </Box>
            <CardMenu id={appt._id} label={`the appointment at ${appt.location}`} items={menuItems} />
          </Box>
          <Box sx={{ mt: 1.25, display: 'flex', flexWrap: 'wrap', columnGap: 3.5, rowGap: 0.75 }}>
            <MetaLine icon={<EventOutlinedIcon />}>{longDate || appt.date}</MetaLine>
            <MetaLine icon={<AccessTimeIcon />}>{appt.time}</MetaLine>
            {appt.bloodType && <MetaLine icon={<WaterDropOutlinedIcon />}>{appt.bloodType}</MetaLine>}
          </Box>
          {appt.notes?.trim() && (
            <>
              <Typography component="h4" sx={{ mt: 2, fontWeight: 700, fontSize: '0.95rem' }}>Notes</Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 0.4, fontSize: '0.92rem', lineHeight: 1.6, overflowWrap: 'anywhere', maxWidth: 720 }}>
                {appt.notes}
              </Typography>
            </>
          )}
        </Box>
      </Box>

      {(notice || actions) && (
        <Box sx={{ display: 'flex', alignItems: { xs: 'stretch', md: 'center' }, flexDirection: { xs: 'column', md: 'row' }, gap: 2 }}>
          {notice && <Box sx={{ flex: 1, minWidth: 0 }}>{notice}</Box>}
          {actions && (
            <Box sx={{ display: 'flex', gap: 1.5, flexShrink: 0, flexWrap: 'wrap', '& > *': { flex: { xs: '1 1 auto', md: '0 0 auto' } } }}>
              {actions}
            </Box>
          )}
        </Box>
      )}
    </Paper>
  );
}

/** A completed donation: an appointment staff checked in (check-in records the donation on the donor). */
export function DonationCard({ appt, hospitalImage }) {
  const when = appt.checkedInAt || appt.date;
  return (
    <Paper component="article" elevation={0} aria-label={`Donation at ${appt.location} on ${formatDate(when)}`} sx={itemCardSx}>
      <Box sx={{ display: 'flex', flexWrap: { xs: 'wrap', sm: 'nowrap' }, gap: { xs: 1.75, sm: 3 }, alignItems: 'center' }}>
        {/* Same photo placement as AppointmentCard: banner on phones, thumbnail beside the date from sm up. */}
        <Box sx={{ order: { xs: -1, sm: 0 }, width: { xs: '100%', sm: 150 }, flexShrink: 0 }}>
          <HospitalPhoto src={hospitalImage} name={appt.location} height={{ xs: 140, sm: 80 }} radius={12} />
        </Box>
        <DateBadge date={appt.date} />
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25, flexWrap: 'wrap' }}>
            <Typography component="h3" sx={{ fontWeight: 800, fontSize: '1.15rem', mr: 0.5, overflowWrap: 'anywhere' }}>{appt.location}</Typography>
            <Pill tone="info" icon={<FavoriteIcon />}>Donated</Pill>
          </Box>
          <Box sx={{ mt: 1, display: 'flex', flexWrap: 'wrap', columnGap: 3.5, rowGap: 0.75 }}>
            <MetaLine icon={<EventOutlinedIcon />}>{formatDate(when)}</MetaLine>
            {appt.checkedInAt && (
              <MetaLine icon={<AccessTimeIcon />}>
                Checked in {new Date(appt.checkedInAt).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
              </MetaLine>
            )}
            {appt.bloodType && <MetaLine icon={<WaterDropOutlinedIcon />}>{appt.bloodType}</MetaLine>}
          </Box>
        </Box>
      </Box>
    </Paper>
  );
}
