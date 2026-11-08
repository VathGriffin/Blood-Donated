'use client';
import { componentLabel } from '@/app/(donor)/requests/_components/formModel';
import { currentIntlLocale } from '@/i18n/config';
import { useT } from '@/i18n/I18nProvider';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import axios from 'axios';
import {
  Alert, Box, Button, Dialog, DialogActions, DialogContent, Divider, IconButton, Skeleton, Typography, useMediaQuery,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import EventAvailableIcon from '@mui/icons-material/EventAvailable';
import HeadsetMicOutlinedIcon from '@mui/icons-material/HeadsetMicOutlined';
import QrCode2Icon from '@mui/icons-material/QrCode2';
import EventRepeatIcon from '@mui/icons-material/EventRepeat';
import API_BASE from '@/lib/config';
import { IconCircle, Pill, formatDate } from '@/components/donor/ui';
import { categoryOf, daysUntil, fmtStamp, slotRange, whenLabel } from './appointments';
import { telHref } from '@/lib/format';

// [tone, donor.myappt.badge.<key>]
const LABEL = {
  upcoming: (s) => (s === 'Confirmed' ? ['success', 'confirmed'] : ['warning', 'pending']),
  completed: () => ['info', 'completed'],
  cancelled: () => ['error', 'cancelled'],
  missed: () => ['neutral', 'missed'],
};

const fmtDateTime = (v) => {
  if (!v) return null;
  const d = new Date(v);
  return Number.isNaN(d.getTime()) ? null
    : d.toLocaleString(currentIntlLocale(), { day: 'numeric', month: 'short', year: 'numeric', hour: 'numeric', minute: '2-digit' });
};

function Row({ label, children }) {
  return (
    <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '150px 1fr' }, gap: { xs: 0.25, sm: 2 }, py: 1.25 }}>
      <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 600 }}>{label}</Typography>
      <Typography variant="body2" component="div" sx={{ overflowWrap: 'anywhere' }}>{children}</Typography>
    </Box>
  );
}

/**
 * Details of one of the donor's own appointments, re-read from GET /api/appointments/:id (the API
 * returns only the caller's own appointment). `onFresh` hands the fresh copy back to the list.
 */
export default function AppointmentDetailsDialog({ appt, hospital, token, onClose, onFresh, onSessionExpired }) {
  const fullScreen = useMediaQuery((theme) => theme.breakpoints.down('sm'));
  const t = useT();
  const [fresh, setFresh] = useState(null);
  const [state, setState] = useState('loading');
  const [imgFailed, setImgFailed] = useState(false);

  useEffect(() => {
    let alive = true;
    setState('loading');
    axios.get(`${API_BASE}/api/appointments/${appt._id}`, { headers: { Authorization: `Bearer ${token}` } })
      .then(({ data }) => { if (!alive) return; setFresh(data); setState('ready'); onFresh?.(data); })
      .catch((err) => { if (alive && !onSessionExpired?.(err)) setState('error'); });
    return () => { alive = false; };
    // Load once per opened appointment.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [appt._id, token]);

  const a = fresh || appt;
  const cat = categoryOf(a);
  const [tone, labelKey] = LABEL[cat](a.status);
  const label = t(`donor.myappt.badge.${labelKey}`);
  const tel = telHref(hospital?.phone);
  const place = hospital ? [hospital.address, hospital.city].filter(Boolean).join(', ') : '';
  const longDate = formatDate(a.date, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  const rebookHref = a.hospital ? `/appointments?hospital=${encodeURIComponent(a.hospital)}` : '/appointments';

  return (
    <Dialog open onClose={onClose} fullScreen={fullScreen} maxWidth="sm" fullWidth aria-labelledby="appt-details-title"
      slotProps={{ paper: { sx: { borderRadius: { xs: 0, sm: '18px' } } } }}>
      {hospital?.imageUrl && !imgFailed && (
        <Box component="img" src={hospital.imageUrl} alt={t('donor.apptDlg.photoOf', { name: hospital.name })} onError={() => setImgFailed(true)}
          sx={{ display: 'block', width: '100%', height: { xs: 170, sm: 200 }, objectFit: 'cover', bgcolor: (t) => t.custom.surface.subtle }} />
      )}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, px: 3, pt: 3, pb: 2 }}>
        <IconCircle size={54}><EventAvailableIcon /></IconCircle>
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography id="appt-details-title" component="h2" sx={{ fontWeight: 800, fontSize: '1.2rem', overflowWrap: 'anywhere' }}>{a.location}</Typography>
          <Box sx={{ mt: 0.75, display: 'flex', gap: 1, alignItems: 'center', flexWrap: 'wrap' }}>
            {state === 'loading' ? <Skeleton width={160} height={26} /> : <Pill tone={tone}>{label}</Pill>}
            {cat === 'upcoming' && daysUntil(a.date) && <Typography variant="body2" color="text.secondary">{daysUntil(a.date)}</Typography>}
          </Box>
        </Box>
        <IconButton onClick={onClose} aria-label={t('donor.apptDlg.close')} sx={{ alignSelf: 'flex-start', mt: -1, mr: -1 }}><CloseIcon /></IconButton>
      </Box>
      <Divider />

      <DialogContent sx={{ px: 3, py: 1 }}>
        {state === 'error' && (
          <Alert severity="warning" sx={{ my: 1.5, borderRadius: '10px' }}>
            {t('donor.apptDlg.stale')}
          </Alert>
        )}
        <Row label={t('donor.apptDlg.date')}>{longDate || a.date}</Row>
        <Divider />
        <Row label={t('donor.apptDlg.time')}>{slotRange(a.time)}</Row>
        <Divider />
        <Row label={t('donor.apptDlg.center')}>
          {a.location}
          {place && <Box component="span" sx={{ display: 'block', color: 'text.secondary' }}>{place}</Box>}
          {hospital?.phone && <Box component="span" sx={{ display: 'block', color: 'text.secondary' }}>{hospital.phone}</Box>}
        </Row>
        {a.bloodType && (<><Divider /><Row label={t('donor.apptDlg.bloodType')}>{a.bloodType}</Row></>)}
        <Divider />
        <Row label={t('donor.apptDlg.donationType')}>{componentLabel(a.donationType || 'Whole Blood')}</Row>
        <Divider />
        <Row label={t('donor.apptDlg.bookedOn')}>{fmtDateTime(a.createdAt) || '—'}</Row>
        {cat === 'completed' && fmtDateTime(a.checkedInAt) && (<><Divider /><Row label={t('donor.apptDlg.checkedIn')}>{fmtDateTime(a.checkedInAt)}</Row></>)}
        {cat === 'cancelled' && fmtDateTime(a.updatedAt) && (<><Divider /><Row label={t('donor.apptDlg.cancelled')}>{fmtDateTime(a.updatedAt)}</Row></>)}
        <Divider />
        <Row label={t('donor.apptDlg.bookedAs')}>
          {a.fullName}
          <Box component="span" sx={{ display: 'block', color: 'text.secondary' }}>{[a.email, a.phone].filter(Boolean).join(' · ')}</Box>
        </Row>
        {a.notes?.trim() && (<><Divider /><Row label={t('donor.apptDlg.notes')}>{a.notes}</Row></>)}
        {(a.rescheduleRequests || []).length > 0 && (
          <>
            <Divider />
            <Row label={t('donor.apptDlg.changes')}>
              {a.rescheduleRequests.slice().reverse().map((r) => (
                <Box key={r._id} sx={{ mb: 1, '&:last-child': { mb: 0 } }}>
                  <Box component="span" sx={{ fontWeight: 600 }}>
                    {whenLabel(r.fromDate, r.fromTime)} → {whenLabel(r.toDate, r.toTime)}
                  </Box>
                  <Box component="span" sx={{ display: 'block', color: 'text.secondary' }}>
                    {r.reviewerRole === 'system' ? t('donor.apptDlg.changedBefore') : r.status === 'Pending' ? t('donor.apptDlg.waitingHospital') : t(`donor.apptDlg.rstatus.${r.status}`)}
                    {r.reviewedAt && r.reviewerRole !== 'system' ? ` · ${fmtStamp(r.reviewedAt)}` : ` · ${t('donor.apptDlg.requestedAt', { date: fmtStamp(r.requestedAt) })}`}
                    {r.reason && r.reviewerRole !== 'system' ? ` · “${r.reason}”` : ''}
                    {r.decisionNote && r.reviewerRole !== 'system' ? ` · ${t('donor.apptDlg.hospitalNote', { note: r.decisionNote })}` : ''}
                  </Box>
                </Box>
              ))}
            </Row>
          </>
        )}
        {cat === 'upcoming' && (
          <Alert severity="info" sx={{ mt: 1, mb: 1.5, borderRadius: '10px' }}>
            {t('donor.apptDlg.upcomingInfo')}
          </Alert>
        )}
      </DialogContent>

      <DialogActions sx={{ px: 3, py: 2, gap: 1, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
        {tel && <Button component="a" href={tel} variant="outlined" startIcon={<HeadsetMicOutlinedIcon />}>{t('donor.apptDlg.contactCenter')}</Button>}
        {cat === 'upcoming'
          ? <Button component={Link} href="/qr-card" variant="contained" startIcon={<QrCode2Icon />}>{t('donor.apptDlg.qr')}</Button>
          : <Button component={Link} href={rebookHref} variant="contained" startIcon={<EventRepeatIcon />}>{t('donor.apptDlg.bookAgain')}</Button>}
      </DialogActions>
    </Dialog>
  );
}
