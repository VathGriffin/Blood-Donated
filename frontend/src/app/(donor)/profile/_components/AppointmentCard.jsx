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
import { useT } from '@/i18n/I18nProvider';
import { currentIntlLocale } from '@/i18n/config';
import HospitalPhoto from '@/app/(public)/appointments/_components/HospitalPhoto';

const STATUS_ICON = {
  Pending: <HourglassTopIcon />, Confirmed: <CheckCircleIcon />, CheckedIn: <FavoriteIcon />, Cancelled: <DoNotDisturbOnOutlinedIcon />,
};

// Calendar tag in the same shape as the blood-bag badge on request cards.
export function DateBadge({ date }) {
  return (
    <Box aria-hidden="true" sx={{
      width: 64, height: 80, flexShrink: 0, borderRadius: '12px', overflow: 'hidden', display: 'flex', flexDirection: 'column',
      border: '1px solid', borderColor: (t) => (t.palette.mode === 'dark' ? 'rgba(255,255,255,0.08)' : '#F5C6CC'),
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
  const t = useT();
  const status = appt.status || 'Pending';
  const meta = APPT_STATUS[status] || APPT_STATUS.Pending;
  const open = status === 'Pending' || status === 'Confirmed';
  const past = open && appt.date && appt.date < todayKey();
  const tel = hospitalPhone ? `tel:${hospitalPhone.replace(/[^\d+]/g, '')}` : null;
  const longDate = formatDate(appt.date, { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });
  const rebookHref = appt.hospital ? `/appointments?hospital=${encodeURIComponent(appt.hospital)}` : '/appointments';

  const qrBtn = <Button component={Link} href="/qr-card" variant="outlined" startIcon={<QrCode2Icon />} sx={actionBtnSx}>{t('donor.appt.qrCard')}</Button>;
  const callBtn = tel && (
    <Button component="a" href={tel} variant="outlined" startIcon={<HeadsetMicOutlinedIcon />} sx={dangerBtnSx}
      aria-label={t('donor.appt.contactAria', { place: appt.location })}>
      {t('donor.appt.contactCenter')}
    </Button>
  );
  const bookAgain = <Button component={Link} href={rebookHref} variant="outlined" startIcon={<EventRepeatIcon />} sx={dangerBtnSx}>{t('donor.appt.bookAgain')}</Button>;

  let notice = null;
  let actions = null;
  if (past) {
    notice = (
      <Notice tone="neutral" icon={<HistoryIcon />}>
        {t('donor.appt.pastTitle')}
        <Box component="span" sx={{ display: 'block', fontWeight: 500 }}>{t('donor.appt.pastText')}</Box>
      </Notice>
    );
    actions = bookAgain;
  } else if (status === 'Pending') {
    notice = (
      <Notice tone="warning" icon={<HourglassTopIcon />}>
        {t('donor.appt.pendingTitle')}
        <Box component="span" sx={{ display: 'block', fontWeight: 500 }}>{t('donor.appt.pendingText')}</Box>
      </Notice>
    );
    actions = <>{qrBtn}{callBtn}</>;
  } else if (status === 'Confirmed') {
    notice = (
      <Notice tone="success" icon={<CheckCircleIcon />}>
        {t('donor.appt.confirmedTitle')}
        <Box component="span" sx={{ display: 'block', fontWeight: 500 }}>{t('donor.appt.confirmedText')}</Box>
      </Notice>
    );
    actions = <>{qrBtn}{callBtn}</>;
  } else if (status === 'CheckedIn') {
    notice = (
      <Notice tone="info" icon={<FavoriteIcon />}>
        {formatDate(appt.checkedInAt) ? t('donor.appt.checkedInOn', { date: formatDate(appt.checkedInAt) }) : t('donor.appt.checkedIn')}
      </Notice>
    );
  } else if (status === 'Cancelled') {
    notice = <Notice tone="neutral" icon={<DoNotDisturbOnOutlinedIcon />}>{t('donor.appt.cancelled')}</Notice>;
    actions = bookAgain;
  }

  const menuItems = [
    open && !past && { label: t('donor.appt.showQr'), icon: <QrCode2Icon />, href: '/qr-card' },
    tel && { label: t('donor.appt.call', { place: appt.location }), icon: <HeadsetMicOutlinedIcon />, href: tel, external: true },
    { label: t('donor.appt.bookAnother'), icon: <EventRepeatIcon />, href: rebookHref },
  ].filter(Boolean);

  return (
    <Paper component="article" elevation={0} aria-label={t('donor.appt.aria', { place: appt.location, date: longDate || appt.date, status: past ? t('donor.appt.missed') : meta.label })} sx={itemCardSx}>
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
              <Pill tone={past ? 'neutral' : meta.tone} icon={past ? <HistoryIcon /> : STATUS_ICON[status]}>{past ? t('donor.appt.missed') : meta.label}</Pill>
            </Box>
            <CardMenu id={appt._id} label={t('donor.appt.menuLabel', { place: appt.location })} items={menuItems} />
          </Box>
          <Box sx={{ mt: 1.25, display: 'flex', flexWrap: 'wrap', columnGap: 3.5, rowGap: 0.75 }}>
            <MetaLine icon={<EventOutlinedIcon />}>{longDate || appt.date}</MetaLine>
            <MetaLine icon={<AccessTimeIcon />}>{appt.time}</MetaLine>
            {appt.bloodType && <MetaLine icon={<WaterDropOutlinedIcon />}>{appt.bloodType}</MetaLine>}
          </Box>
          {appt.notes?.trim() && (
            <>
              <Typography component="h4" sx={{ mt: 2, fontWeight: 700, fontSize: '0.95rem' }}>{t('donor.appt.notes')}</Typography>
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
  const t = useT();
  const when = appt.checkedInAt || appt.date;
  return (
    <Paper component="article" elevation={0} aria-label={t('donor.appt.donationAria', { place: appt.location, date: formatDate(when) })} sx={itemCardSx}>
      <Box sx={{ display: 'flex', flexWrap: { xs: 'wrap', sm: 'nowrap' }, gap: { xs: 1.75, sm: 3 }, alignItems: 'center' }}>
        {/* Same photo placement as AppointmentCard: banner on phones, thumbnail beside the date from sm up. */}
        <Box sx={{ order: { xs: -1, sm: 0 }, width: { xs: '100%', sm: 150 }, flexShrink: 0 }}>
          <HospitalPhoto src={hospitalImage} name={appt.location} height={{ xs: 140, sm: 80 }} radius={12} />
        </Box>
        <DateBadge date={appt.date} />
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25, flexWrap: 'wrap' }}>
            <Typography component="h3" sx={{ fontWeight: 800, fontSize: '1.15rem', mr: 0.5, overflowWrap: 'anywhere' }}>{appt.location}</Typography>
            <Pill tone="info" icon={<FavoriteIcon />}>{t('donor.appt.donated')}</Pill>
          </Box>
          <Box sx={{ mt: 1, display: 'flex', flexWrap: 'wrap', columnGap: 3.5, rowGap: 0.75 }}>
            <MetaLine icon={<EventOutlinedIcon />}>{formatDate(when)}</MetaLine>
            {appt.checkedInAt && (
              <MetaLine icon={<AccessTimeIcon />}>
                {t('donor.appt.checkedInAt', { time: new Date(appt.checkedInAt).toLocaleTimeString(currentIntlLocale(), { hour: 'numeric', minute: '2-digit' }) })}
              </MetaLine>
            )}
            {appt.bloodType && <MetaLine icon={<WaterDropOutlinedIcon />}>{appt.bloodType}</MetaLine>}
          </Box>
        </Box>
      </Box>
    </Paper>
  );
}
