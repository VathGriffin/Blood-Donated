'use client';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { Box, Container, Button, Alert, Typography, useTheme } from '@mui/material';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import ShieldOutlinedIcon from '@mui/icons-material/ShieldOutlined';
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
import { AppointmentSummary, DonateChecklist } from './_components/SidePanels';
import { FALLBACK_CENTERS, normalizeCenters } from './_components/booking';

const emptyForm = { centerKey: '', date: '', time: '', fullName: '', email: '', phone: '', bloodType: '', notes: '' };

export default function AppointmentPage() {
  const isDark = useTheme().palette.mode === 'dark';
  const router = useRouter();
  const { user, isAuth } = useUserAuth();

  const [screen, setScreen] = useState('select'); // 'select' (center + date + time) | 'details'
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Centers: the hospitals registered on the platform; the classic list if there are none yet.
  const [centers, setCenters] = useState([]);
  const [centersLoading, setCentersLoading] = useState(true);
  useEffect(() => {
    const ctrl = new AbortController();
    axios.get(`${API_BASE}/api/hospitals`, { signal: ctrl.signal })
      .then(({ data }) => setCenters(Array.isArray(data) && data.length ? normalizeCenters(data) : FALLBACK_CENTERS))
      .catch((err) => { if (!axios.isCancel(err)) setCenters(FALLBACK_CENTERS); })
      .finally(() => { if (!ctrl.signal.aborted) setCentersLoading(false); });
    return () => ctrl.abort();
  }, []);

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
      setForm((f) => ({ ...f, email: user.email, fullName: f.fullName || user.fullName || '', phone: f.phone || user.phone || '' }));
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

  const goToDetails = () => {
    const problem = validateSelection();
    if (problem) { setError(problem); return; }
    setScreen('details');
    window.scrollTo({ top: 0, behavior: 'smooth' });
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

  // Progress: choosing a center completes step 1; the details screen is step 3.
  const activeStep = screen === 'details' ? 2 : center ? 1 : 0;
  const person = form.fullName.trim() || (isAuth && user?.fullName)
    ? { name: form.fullName.trim() || user.fullName, role: isAuth ? 'Donor' : 'Guest' }
    : null;

  const ctaSx = {
    py: 1.5, fontWeight: 800, fontSize: '1rem', textTransform: 'none', borderRadius: '12px', bgcolor: '#c62828',
    boxShadow: '0 10px 26px rgba(198,40,40,0.32)', '&:hover': { bgcolor: '#b71c1c', boxShadow: '0 12px 30px rgba(198,40,40,0.42)' },
  };

  return (
    <Box sx={{ bgcolor: isDark ? '#0f0f0f' : '#fffdfd', minHeight: '100vh', pb: 8 }}>
      <BookingHero />

      <Container maxWidth={false} sx={{ maxWidth: 1400, pt: { xs: 3, md: 4 } }}>
        <BookingStepper active={activeStep} />

        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: 'minmax(0, 1fr) 400px' }, gap: 3, mt: { xs: 3, md: 4 }, alignItems: 'start' }}>
          {/* Left: what to choose / fill in */}
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, minWidth: 0 }}>
            {screen === 'select' ? (
              <>
                <CenterPicker centers={sortedCenters} loading={centersLoading} selectedKey={form.centerKey}
                  onSelect={(key) => setField('centerKey', key)} distances={distances}
                  onLocate={locate} locating={locating} note={pickerNote} />
                <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 3 }}>
                  <CalendarPicker value={form.date} onChange={(iso) => setForm((f) => ({ ...f, date: iso, time: '' }) )} />
                  <TimeSlots date={form.date} value={form.time} onChange={(slot) => setField('time', slot)} />
                </Box>
              </>
            ) : (
              <DetailsForm form={form} onChange={setField} emailLocked={isAuth} />
            )}
          </Box>

          {/* Right: live summary, requirements, next action */}
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, position: { lg: 'sticky' }, top: { lg: 96 } }}>
            <AppointmentSummary center={center} date={form.date} time={form.time} person={person}
              onEdit={screen === 'details' ? () => { setScreen('select'); setError(''); } : undefined} />
            <DonateChecklist />

            {error && <Alert severity="error" sx={{ borderRadius: '12px' }}>{error}</Alert>}

            {screen === 'select' ? (
              <Button fullWidth variant="contained" onClick={goToDetails} endIcon={<ArrowForwardIcon />} sx={ctaSx}>
                Next: Confirm Appointment
              </Button>
            ) : (
              <Box sx={{ display: 'flex', gap: 1.5 }}>
                <Button variant="outlined" onClick={() => { setScreen('select'); setError(''); }} startIcon={<ArrowBackIcon />}
                  sx={{ ...ctaSx, bgcolor: 'transparent', color: 'text.primary', borderColor: 'divider', boxShadow: 'none', flexShrink: 0, '&:hover': { bgcolor: 'action.hover', boxShadow: 'none' } }}>
                  Back
                </Button>
                <Button fullWidth variant="contained" onClick={submit} disabled={submitting} sx={ctaSx}>
                  {submitting ? 'Booking…' : 'Confirm Booking'}
                </Button>
              </Box>
            )}

            <Typography sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0.75, color: 'text.secondary', fontSize: '0.8rem', mt: -1 }}>
              <ShieldOutlinedIcon sx={{ fontSize: 16 }} /> Your information is secure and protected
            </Typography>
          </Box>
        </Box>
      </Container>
    </Box>
  );
}
