'use client';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Box, Container, Button, Alert, Typography, CircularProgress, useTheme } from '@mui/material';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import axios from 'axios';
import API_BASE from '@/lib/config';
import { distanceKm } from '@/lib/geo';
import { useUserAuth } from '@/store/UserAuthContext';
import BookingHero from './_components/BookingHero';
import BookingStepper from './_components/BookingStepper';
import CenterPicker from './_components/CenterPicker';
import CalendarPicker from './_components/CalendarPicker';
import TimeSlots from './_components/TimeSlots';
import DetailsForm from './_components/DetailsForm';
import ReviewStep from './_components/ReviewStep';
import DonationProcess from './_components/DonationProcess';
import { AppointmentSummary, DonateChecklist, NeedHelp } from './_components/SidePanels';
import { BLOOD_TYPES, C, FALLBACK_CENTERS, normalizeCenters } from './_components/booking';

const emptyForm = { centerKey: '', date: '', time: '', fullName: '', email: '', phone: '', bloodType: '', notes: '' };

export default function AppointmentPage() {
  const isDark = useTheme().palette.mode === 'dark';
  const router = useRouter();
  const { user, isAuth } = useUserAuth();

  const [screen, setScreen] = useState('select'); // 'select' (center + date + time) | 'details' | 'review'
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Centers: the hospitals registered on the platform; the classic list if there are none yet
  // (or if the request fails — then the picker also offers a retry).
  const [centers, setCenters] = useState([]);
  const [centersLoading, setCentersLoading] = useState(true);
  const [centersSource, setCentersSource] = useState('api'); // 'api' | 'empty' | 'error'
  const [centersAttempt, setCentersAttempt] = useState(0);
  useEffect(() => {
    const ctrl = new AbortController();
    setCentersLoading(true);
    axios.get(`${API_BASE}/api/hospitals`, { signal: ctrl.signal })
      .then(({ data }) => {
        const has = Array.isArray(data) && data.length;
        setCenters(has ? normalizeCenters(data) : FALLBACK_CENTERS);
        setCentersSource(has ? 'api' : 'empty');
      })
      .catch((err) => { if (!axios.isCancel(err)) { setCenters(FALLBACK_CENTERS); setCentersSource('error'); } })
      .finally(() => { if (!ctrl.signal.aborted) setCentersLoading(false); });
    return () => ctrl.abort();
  }, [centersAttempt]);

  // "Use My Location": distances (and nearest-first order) for centers that have real coordinates.
  const [userPos, setUserPos] = useState(null);
  const [locating, setLocating] = useState(false);
  const [locateNote, setLocateNote] = useState('');
  const locate = () => {
    if (!navigator.geolocation) { setLocateNote('Your browser can’t share its location.'); return; }
    setLocating(true);
    setLocateNote('');
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => { setUserPos([coords.latitude, coords.longitude]); setLocating(false); },
      () => { setLocating(false); setLocateNote('Location access was blocked, so centers are listed alphabetically.'); },
      { timeout: 8000, maximumAge: 5 * 60 * 1000 }
    );
  };
  const distances = useMemo(() => {
    const out = {};
    if (userPos) centers.forEach((c) => { if (c.pos) out[c.key] = distanceKm(userPos, c.pos); });
    return out;
  }, [userPos, centers]);
  const sortedCenters = useMemo(() => {
    if (!userPos) return centers;
    return [...centers].sort((a, b) => (distances[a.key] ?? Infinity) - (distances[b.key] ?? Infinity));
  }, [centers, distances, userPos]);
  const pickerNote = userPos && !Object.keys(distances).length && centers.length
    ? 'Distances aren’t available for these centers yet.'
    : locateNote;

  // A signed-in donor's details are filled in; their booking must use the account email.
  useEffect(() => {
    if (isAuth && user?.email) {
      setForm((f) => ({
        ...f, email: user.email, fullName: f.fullName || user.fullName || '', phone: f.phone || user.phone || '',
        bloodType: f.bloodType || (BLOOD_TYPES.includes(user.bloodType) ? user.bloodType : ''),
      }));
    }
  }, [isAuth, user]);

  const setField = (name, value) => { setForm((f) => ({ ...f, [name]: value })); setError(''); };
  const center = centers.find((c) => c.key === form.centerKey) || null;

  const validateSelection = () => {
    if (!center) return 'Please select a donation center.';
    if (!form.date) return 'Please select a date.';
    if (!form.time) return 'Please select a time slot.';
    return '';
  };
  const validateDetails = () => {
    if (!form.fullName.trim()) return 'Full name is required.';
    if (!/\S+@\S+\.\S+/.test(form.email.trim())) return 'A valid email is required.';
    if (!form.phone.trim()) return 'Phone number is required.';
    if (!form.bloodType) return 'Please select your blood type.';
    return '';
  };

  // Each screen change moves focus to the top of the new step, for keyboard and screen-reader users.
  const mainRef = useRef(null);
  const go = useCallback((next) => {
    setScreen(next);
    setError('');
    requestAnimationFrame(() => {
      mainRef.current?.focus({ preventScroll: true });
      mainRef.current?.scrollIntoView({ behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'start' });
    });
  }, []);

  const goToDetails = () => {
    const problem = validateSelection();
    if (problem) { setError(problem); return; }
    go('details');
  };
  const goToReview = () => {
    const problem = validateDetails();
    if (problem) { setError(problem); return; }
    go('review');
  };

  const submit = async () => {
    const problem = validateSelection() || validateDetails();
    if (problem) { setError(problem); return; }
    setSubmitting(true);
    setError('');
    try {
      await axios.post(`${API_BASE}/api/appointments`, {
        fullName: form.fullName.trim(), email: form.email.trim(), phone: form.phone.trim(), bloodType: form.bloodType,
        date: form.date, time: form.time, notes: form.notes.trim(),
        location: center.name,
        ...(center.hospitalId ? { hospital: center.hospitalId } : {}),
      });
      router.push('/appointments/confirmed');
    } catch (err) {
      setError(err.response?.data?.error || 'Booking failed. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  // Progress: choosing a center completes step 1; the details and review screens are steps 3 and 4.
  const activeStep = { select: center ? 1 : 0, details: 2, review: 3 }[screen];
  const donorName = form.fullName.trim() || (isAuth && user?.fullName) || '';

  const ctaSx = {
    py: 1.6, fontWeight: 700, fontSize: '1.05rem', textTransform: 'none', borderRadius: '12px', bgcolor: C.primary,
    background: `linear-gradient(180deg, #D0243A 0%, ${C.primary} 100%)`,
    boxShadow: '0 10px 24px rgba(185,28,44,0.28)',
    '&:hover': { background: C.dark, boxShadow: '0 12px 28px rgba(185,28,44,0.36)' },
    '&:focus-visible': { outline: `3px solid ${C.ring}`, outlineOffset: 2 },
    '&.Mui-disabled': { bgcolor: C.primary, color: '#fff', opacity: 0.7 },
  };
  const backSx = {
    ...ctaSx, background: 'none', bgcolor: 'background.paper', color: 'text.primary', borderColor: isDark ? '#333' : C.border, boxShadow: 'none', flexShrink: 0,
    '&:hover': { background: 'none', bgcolor: 'action.hover', boxShadow: 'none', borderColor: isDark ? '#555' : '#CBD5E1' },
  };
  const back = { details: 'select', review: 'details' }[screen];
  const next = {
    select: { label: 'Next: Your Information', onClick: goToDetails },
    details: { label: 'Next: Review & Confirm', onClick: goToReview },
    review: { label: submitting ? 'Booking…' : 'Confirm Booking', onClick: submit },
  }[screen];

  const cardBorder = `1px solid ${isDark ? '#262626' : C.border}`;
  const columns = { xs: '1fr', lg: 'minmax(0, 1fr) 380px', xl: 'minmax(0, 1fr) 410px' };

  return (
    <Box sx={{ bgcolor: isDark ? '#0f0f0f' : C.bg, minHeight: '100vh', pb: { xs: 10, md: 8 } }}>
      <BookingHero />

      <Container maxWidth={false} sx={{ maxWidth: 1440, pt: { xs: 1, md: 1.5 } }}>
        <Box sx={{ display: 'grid', gridTemplateColumns: columns, gap: 3, alignItems: 'start' }}>
          {/* Left: one card holding the step rail and what to choose / fill in */}
          <Box sx={{
            bgcolor: 'background.paper', borderRadius: '16px', border: cardBorder, p: { xs: 2, sm: 2.5 },
            boxShadow: isDark ? 'none' : '0 1px 2px rgba(15,23,42,0.04), 0 10px 30px rgba(15,23,42,0.05)',
            display: 'grid', gridTemplateColumns: { xs: '1fr', md: '150px minmax(0, 1fr)' }, gap: { xs: 2, md: 2.5 }, minWidth: 0,
          }}>
            <BookingStepper active={activeStep} />

            <Box ref={mainRef} tabIndex={-1} aria-label={`Booking step ${activeStep + 1}`}
              sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, minWidth: 0, outline: 'none', scrollMarginTop: { xs: 80, md: 96 } }}>
              {screen === 'select' && (
                <>
                  <CenterPicker centers={sortedCenters} loading={centersLoading} source={centersSource}
                    onRetry={() => setCentersAttempt((n) => n + 1)} selectedKey={form.centerKey}
                    onSelect={(key) => setField('centerKey', key)} distances={distances}
                    onLocate={locate} locating={locating} note={pickerNote} />
                  <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2.5 }}>
                    <CalendarPicker value={form.date} onChange={(iso) => { setForm((f) => ({ ...f, date: iso, time: '' })); setError(''); }} />
                    <TimeSlots date={form.date} value={form.time} onChange={(slot) => setField('time', slot)} />
                  </Box>
                </>
              )}
              {screen === 'details' && <DetailsForm form={form} onChange={setField} emailLocked={isAuth} />}
              {screen === 'review' && (
                <ReviewStep center={center} form={form} onEditSelection={() => go('select')} onEditDetails={() => go('details')} />
              )}
            </Box>
          </Box>

          {/* Right: live summary, requirements, next action. Sticky only where the screen is tall enough to show it all. */}
          <Box component="aside" aria-label="Appointment summary" sx={{
            display: 'flex', flexDirection: 'column', gap: 2.5,
            '@media (min-width: 1200px) and (min-height: 1080px)': { position: 'sticky', top: 88 },
          }}>
            <AppointmentSummary center={center} date={form.date} time={form.time} name={donorName} role={isAuth ? 'Donor' : 'Guest'}
              bloodType={form.bloodType} onChange={center || screen !== 'select' ? () => go('select') : undefined} />
            <DonateChecklist />

            {/* Stacked layouts put the actions right under the form, ahead of the summary */}
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.25, order: { xs: -1, lg: 0 } }}>
              {error && <Alert id="booking-error" severity="error" sx={{ borderRadius: '12px' }}>{error}</Alert>}
              <Box sx={{ display: 'flex', gap: 1.25 }}>
                {back && (
                  <Button variant="outlined" onClick={() => go(back)} disabled={submitting} startIcon={<ArrowBackIcon />} sx={backSx}>
                    Back
                  </Button>
                )}
                <Button fullWidth variant="contained" onClick={next.onClick} disabled={submitting}
                  aria-describedby={error ? 'booking-error' : undefined}
                  startIcon={screen === 'review' ? (submitting ? <CircularProgress size={16} color="inherit" /> : <LockOutlinedIcon sx={{ fontSize: 18 }} />) : undefined}
                  endIcon={screen !== 'review' ? <ArrowForwardIcon /> : undefined} sx={ctaSx}>
                  {next.label}
                </Button>
              </Box>
              <Typography sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0.6, color: 'text.secondary', fontSize: '0.76rem' }}>
                <LockOutlinedIcon sx={{ fontSize: 14 }} aria-hidden="true" /> Your information is secure and protected
              </Typography>
            </Box>
          </Box>
        </Box>

        {/* Bottom row: what happens on the day, and where to get help */}
        <Box sx={{ display: 'grid', gridTemplateColumns: columns, gap: 3, mt: 3, alignItems: 'stretch' }}>
          <DonationProcess />
          <NeedHelp />
        </Box>
      </Container>
    </Box>
  );
}
