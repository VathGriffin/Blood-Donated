'use client';
import { statusLabel } from '@/components/ui/StatusBadge';
import { currentIntlLocale } from '@/i18n/config';
import { useT } from '@/i18n/I18nProvider';
import { useCallback, useState } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import {
  Box, Typography, Paper, Avatar, Alert, Button, CircularProgress,
} from '@mui/material';
import {
  Verified, ErrorOutline, EventAvailable, Refresh, QrCodeScanner, Phone, Email, Favorite,
  CalendarToday, HowToReg, CheckCircle, WaterDrop, EventNote,
} from '@mui/icons-material';
import axios from 'axios';
import { useAuth } from '@/store/AuthContext';
import API_BASE, { uploadUrl } from '@/lib/config';
import { apiErrorMessage } from '@/lib/api-error';
import { formatDate, initialsOf, localToday } from '@/lib/format';
import { PageHeader, SectionCard, StatusBadge } from '@/components/ui';
import { ELIGIBILITY_INTERVAL_DAYS } from '@/lib/eligibility';

const QrScanner = dynamic(() => import('@/components/hospital/QrScanner'), { ssr: false });

// Text: hosp.scan.steps.<key>
const STEPS = ['open', 'hold', 'check'];

const fmtDay = (iso) => {
  const d = new Date(`${iso}T00:00:00`);
  return Number.isNaN(d.getTime()) ? iso : d.toLocaleDateString(currentIntlLocale(), { weekday: 'short', day: 'numeric', month: 'short' });
};

// Reasons the server gives for a QR it can't accept: hosp.scan.invalid.<reason>
const INVALID_REASONS = ['expired', 'not_found'];

export default function ScanDonorQr() {
  const { staff, token } = useAuth();
  const t = useT();
  const [result, setResult] = useState(null); // verify-qr response, or { valid: false, reason }
  const [loading, setLoading] = useState(false);
  const [scanKey, setScanKey] = useState(0);
  const [appointment, setAppointment] = useState(null); // matching open appointment, if any
  const [checkingIn, setCheckingIn] = useState(false);
  const [checkInError, setCheckInError] = useState('');
  const [apptError, setApptError] = useState(''); // the appointment lookup failed (not "none found")

  const handleDecode = useCallback(async (qrToken) => {
    if (loading) return;
    setLoading(true);
    setResult(null);
    setAppointment(null);
    setCheckInError('');
    setApptError('');
    const auth = { headers: { Authorization: `Bearer ${token}` } };
    try {
      const { data } = await axios.post(`${API_BASE}/api/donors/verify-qr`, { token: qrToken }, auth);
      setResult(data);
      // The donor's next open appointment here (today's first, otherwise the soonest).
      let appts;
      try {
        ({ data: appts } = await axios.get(`${API_BASE}/api/appointments?hospital=${staff.hospitalId}`, auth));
      } catch (err) {
        setApptError(err);
        return;
      }
      const today = localToday();
      const open = appts
        .filter((a) => a.email?.toLowerCase() === data.donor.email.toLowerCase() && ['Pending', 'Confirmed'].includes(a.status))
        .sort((a, b) => (a.date === today ? -1 : b.date === today ? 1 : a.date.localeCompare(b.date)));
      setAppointment(open[0] || null);
    } catch (err) {
      setResult((prev) => prev || { valid: false, reason: err.response?.data?.reason || 'invalid' });
    } finally {
      setLoading(false);
    }
  }, [loading, token, staff]);

  const checkIn = async () => {
    if (!appointment) return;
    setCheckingIn(true);
    setCheckInError('');
    try {
      const { data } = await axios.patch(`${API_BASE}/api/appointments/${appointment._id}/check-in`, {},
        { headers: { Authorization: `Bearer ${token}` } });
      setAppointment(data);
      // The donation was just recorded: show the donor's updated count, date and eligibility.
      const nextEligible = new Date(new Date(data.checkedInAt).getTime() + ELIGIBILITY_INTERVAL_DAYS * 86400000).toISOString();
      setResult((r) => ({
        ...r,
        donor: { ...r.donor, donationCount: (r.donor.donationCount || 0) + 1, lastDonation: data.checkedInAt },
        eligibility: { eligible: false, daysSinceLastDonation: 0, nextEligibleDate: nextEligible },
      }));
    } catch (err) {
      setCheckInError(apiErrorMessage(err, t('hosp.scan.checkInFailed')));
    } finally {
      setCheckingIn(false);
    }
  };

  const reset = () => { setResult(null); setAppointment(null); setCheckInError(''); setApptError(''); setScanKey((k) => k + 1); };

  const donor = result?.valid ? result.donor : null;
  const eligible = result?.eligibility?.eligible;
  const checkedIn = appointment?.status === 'CheckedIn';

  return (
    <Box>
      <PageHeader
        title={t('hosp.scan.scanDonorQr')}
        subtitle={t('hosp.scan.verifyADonorS')}
        actions={<Button variant="outlined" startIcon={<EventNote />} component={Link} href="/dashboard/hospital/appointments">{t('hosp.scan.allAppointments')}</Button>}
      />

      <Box sx={{ display: 'grid', gap: { xs: 2, md: 3 }, gridTemplateColumns: { xs: 'minmax(0,1fr)', md: 'minmax(0,1fr) minmax(0,1fr)' }, alignItems: 'start' }}>
        {/* Scanner */}
        <SectionCard icon={<QrCodeScanner />} title={t('hosp.scan.camera')} subtitle={result ? t('hosp.scan.finished') : t('hosp.scan.point')}>
          {!result && !loading && <QrScanner key={scanKey} onDecode={handleDecode} />}
          {loading && (
            <Box display="flex" flexDirection="column" alignItems="center" gap={1.5} py={6}>
              <CircularProgress />
              <Typography color="text.secondary">{t('hosp.scan.verifyingDonor')}</Typography>
            </Box>
          )}
          {result && (
            <Box display="flex" flexDirection="column" alignItems="center" gap={1.5} py={4} textAlign="center">
              <Box sx={(t) => ({ width: 64, height: 64, borderRadius: '50%', display: 'grid', placeItems: 'center',
                bgcolor: result.valid ? t.custom.tones.success.bg : t.custom.tones.error.bg, color: result.valid ? t.custom.tones.success.fg : t.custom.tones.error.fg })}>
                {result.valid ? <Verified sx={{ fontSize: 34 }} /> : <ErrorOutline sx={{ fontSize: 34 }} />}
              </Box>
              <Typography fontWeight={700}>{result.valid ? t('hosp.scan.verified') : t('hosp.scan.notVerified')}</Typography>
              <Button variant="contained" startIcon={<Refresh />} onClick={reset}>{t('hosp.scan.scanAnotherDonor')}</Button>
            </Box>
          )}
        </SectionCard>

        {/* Result */}
        {!result || loading ? (
          <SectionCard icon={<HowToReg />} title={t('hosp.scan.howItWorks')}>
            <Box component="ol" sx={{ m: 0, p: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 1.75 }}>
              {STEPS.map((s, i) => (
                <Box component="li" key={s} display="flex" gap={1.5} alignItems="flex-start">
                  <Box sx={{ width: 28, height: 28, flexShrink: 0, borderRadius: '50%', bgcolor: 'primary.main', color: '#fff', display: 'grid', placeItems: 'center', fontWeight: 800, fontSize: '0.85rem' }}>{i + 1}</Box>
                  <Typography variant="body2" color="text.secondary" pt={0.4}>{t(`hosp.scan.steps.${s}`)}</Typography>
                </Box>
              ))}
            </Box>
            <Alert severity="info" sx={{ mt: 2.5, borderRadius: 2 }}>
              {t('hosp.scan.aDonorSQr')}
            </Alert>
          </SectionCard>
        ) : !donor ? (
          <Alert severity="error" icon={<ErrorOutline />} sx={{ borderRadius: 3 }}
            action={<Button color="inherit" size="small" onClick={reset} startIcon={<Refresh fontSize="small" />}>{t('hosp.scan.scanAgain')}</Button>}>
            {INVALID_REASONS.includes(result.reason) ? t(`hosp.scan.invalid.${result.reason}`) : t('hosp.scan.invalid.other')}
          </Alert>
        ) : (
          <Paper variant="outlined" sx={(t) => ({ borderRadius: `${t.custom.radius.card}px`, overflow: 'hidden', boxShadow: t.custom.shadow.sm })}>
            <Box sx={(t) => ({ p: 3, display: 'flex', alignItems: 'center', gap: 2, color: '#fff',
              background: `linear-gradient(135deg, ${t.palette.primary.main} 0%, ${t.palette.primary.dark} 100%)` })}>
              <Avatar src={uploadUrl(donor.photo)} alt={donor.fullName}
                sx={{ width: 64, height: 64, fontWeight: 800, bgcolor: 'rgba(255,255,255,0.2)', border: '3px solid rgba(255,255,255,0.5)' }}>
                {initialsOf(donor.fullName)}
              </Avatar>
              <Box minWidth={0} flex={1}>
                <Typography fontWeight={800} fontSize="1.15rem" noWrap>{donor.fullName}</Typography>
                <Box display="flex" alignItems="center" gap={0.5} sx={{ opacity: 0.9 }}>
                  <Verified sx={{ fontSize: 16 }} /><Typography fontSize="0.82rem">{t('hosp.scan.verifiedDonor')}</Typography>
                </Box>
              </Box>
              <Box sx={{ px: 1.5, py: 0.5, borderRadius: 2, bgcolor: 'rgba(255,255,255,0.2)', fontWeight: 800, fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <WaterDrop sx={{ fontSize: 18 }} />{donor.bloodType}
              </Box>
            </Box>

            <Box sx={{ p: 3, display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Box display="flex" gap={1} flexWrap="wrap">
                <StatusBadge status="elig" tone={eligible ? 'success' : 'warning'}
                  label={eligible ? t('hosp.scan.eligible') : t('hosp.scan.eligibleFrom', { date: formatDate(result.eligibility.nextEligibleDate) })} />
                <StatusBadge status={donor.available ? 'Available' : 'Unavailable'} label={donor.available ? t('hosp.scan.available') : t('hosp.scan.notAvailable')} />
              </Box>
              {!eligible && !checkedIn && (
                <Alert severity="warning" sx={{ borderRadius: 2 }}>
                  {t('hosp.scan.interval', { days: result.eligibility.daysSinceLastDonation, need: ELIGIBILITY_INTERVAL_DAYS })}
                </Alert>
              )}

              <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 1.5 }}>
                {[
                  { icon: <Favorite />, label: t('hosp.scan.donations'), value: t('hosp.scan.lifetime', { count: donor.donationCount || 0 }) },
                  { icon: <CalendarToday />, label: t('hosp.scan.lastDonation'), value: formatDate(donor.lastDonation, t('hosp.scan.never')) },
                  { icon: <Phone />, label: t('hosp.scan.phone'), value: donor.phone || '—' },
                  { icon: <Email />, label: t('hosp.scan.email'), value: donor.email },
                ].map((r) => (
                  <Box key={r.label} display="flex" gap={1.25} alignItems="flex-start" minWidth={0}>
                    <Box sx={{ color: 'primary.main', display: 'flex', mt: 0.25, '& svg': { fontSize: 18 } }}>{r.icon}</Box>
                    <Box minWidth={0}>
                      <Typography fontSize="0.7rem" fontWeight={700} color="text.secondary" textTransform="uppercase" letterSpacing="0.05em">{r.label}</Typography>
                      <Typography fontSize="0.88rem" fontWeight={600} sx={{ overflowWrap: 'anywhere' }}>{r.value}</Typography>
                    </Box>
                  </Box>
                ))}
              </Box>

              <Box sx={{ borderTop: 1, borderColor: 'divider', pt: 2 }}>
                {appointment ? (
                  <>
                    <Typography fontSize="0.78rem" fontWeight={700} color="text.secondary" textTransform="uppercase" letterSpacing="0.05em" mb={1}>{t('hosp.scan.appointment')}</Typography>
                    <Box display="flex" alignItems="center" gap={1} mb={1.5} flexWrap="wrap">
                      <EventAvailable color="primary" />
                      <Typography fontWeight={700}>{fmtDay(appointment.date)} · {appointment.time}</Typography>
                      <StatusBadge status={appointment.status} label={checkedIn ? t('hosp.scan.donated') : statusLabel(t, appointment.status)} size="small" />
                    </Box>
                    {checkInError && <Alert severity="error" sx={{ mb: 1.5, borderRadius: 2 }}>{checkInError}</Alert>}
                    <Button fullWidth size="large" variant="contained" color="success" onClick={checkIn}
                      disabled={checkingIn || checkedIn}
                      startIcon={checkedIn ? <CheckCircle /> : checkingIn ? <CircularProgress size={18} color="inherit" /> : <HowToReg />}>
                      {checkedIn ? t('hosp.scan.checkedIn') : checkingIn ? t('hosp.scan.checkingIn') : t('hosp.scan.checkInNow')}
                    </Button>
                  </>
                ) : apptError ? (
                  <Alert severity="error" sx={{ borderRadius: 2 }}
                    action={<Button color="inherit" size="small" onClick={reset}>{t('hosp.scan.scanAgain')}</Button>}>
                    {apiErrorMessage(apptError, t('hosp.scan.apptsFailed'))}
                  </Alert>
                ) : (
                  <Alert severity="info" sx={{ borderRadius: 2 }}>
                    {t('hosp.scan.noOpenAppointmentFor')}
                  </Alert>
                )}
              </Box>
            </Box>
          </Paper>
        )}
      </Box>
    </Box>
  );
}
