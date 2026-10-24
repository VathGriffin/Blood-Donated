'use client';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import { Alert, Box, Breadcrumbs, Button, Paper, Skeleton, Snackbar, Tab, Tabs, Typography } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EventAvailableOutlinedIcon from '@mui/icons-material/EventAvailableOutlined';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import NavigateNextIcon from '@mui/icons-material/NavigateNext';
import API_BASE from '@/lib/config';
import { apiErrorMessage } from '@/lib/api-error';
import { useUserAuth } from '@/store/UserAuthContext';
import { getHospitals } from '@/lib/public-directory';
import { EmptyPanel, todayKey } from '@/components/donor/ui';
import { hospitalImageUrl } from '@/app/(public)/appointments/_components/booking';
import AppointmentCard from './_components/AppointmentCard';
import AppointmentDetailsDialog from './_components/AppointmentDetailsDialog';
import StatusTimeline from './_components/StatusTimeline';
import RescheduleDialog from './_components/RescheduleDialog';
import SubmittedDialog from './_components/SubmittedDialog';
import CancelDialog from './_components/CancelDialog';
import DecisionToast, { markDecisionSeen, unseenDecision } from './_components/DecisionToast';
import { categoryOf, openRequest, sortAppointments } from './_components/appointments';

const TABS = [
  { value: 'upcoming', label: 'Upcoming', empty: 'No upcoming appointments', hint: 'Book a donation slot at a center near you.' },
  { value: 'completed', label: 'Completed', empty: 'No completed donations yet', hint: 'Appointments you checked in for appear here.' },
  { value: 'cancelled', label: 'Cancelled', empty: 'No cancelled appointments', hint: 'Cancelled bookings appear here.' },
  { value: 'missed', label: 'Missed', empty: 'No missed appointments', hint: '' },
];

const setTabParam = (value) => {
  try {
    const url = new URL(window.location.href);
    if (value === 'upcoming') url.searchParams.delete('tab'); else url.searchParams.set('tab', value);
    window.history.replaceState(window.history.state, '', url);
  } catch { /* cosmetic */ }
};

function CardSkeleton() {
  return (
    <Paper elevation={0} aria-hidden="true" sx={{ p: 2.5, borderRadius: '16px', border: '1px solid', borderColor: 'divider' }}>
      <Box sx={{ display: 'flex', gap: 2.5 }}>
        <Skeleton variant="rounded" width={140} height={108} sx={{ borderRadius: '10px', display: { xs: 'none', sm: 'block' } }} />
        <Box sx={{ flex: 1 }}>
          <Skeleton width="45%" height={30} />
          <Skeleton width="35%" />
          <Skeleton width="80%" height={48} sx={{ mt: 1 }} />
        </Box>
      </Box>
      <Box sx={{ display: 'flex', gap: 1.25, mt: 2.5 }}>
        {[0, 1, 2].map((i) => <Skeleton key={i} variant="rounded" height={44} sx={{ flex: 1, borderRadius: '10px' }} />)}
      </Box>
    </Paper>
  );
}

/**
 * The signed-in donor's appointments. GET /api/appointments returns only the caller's own. Donors
 * can cancel, change a pending booking directly, or ask the hospital to move a confirmed one —
 * every rule is enforced by the API; this page only offers what the API will accept.
 */
export default function MyAppointmentsPage() {
  const router = useRouter();
  const { isAuth, user, token, logout } = useUserAuth();

  const [appointments, setAppointments] = useState([]);
  const [status, setStatus] = useState('loading'); // 'loading' | 'ready' | 'error'
  const [hospitals, setHospitals] = useState({ byId: {}, byName: {} });
  const [tab, setTab] = useState('upcoming');
  const [selectedId, setSelectedId] = useState(null);
  const [detail, setDetail] = useState(null);
  const [changing, setChanging] = useState(null);
  const [cancelling, setCancelling] = useState(null);
  const [submitted, setSubmitted] = useState(null); // { mode, request }
  const [decision, setDecision] = useState(null);
  const [toast, setToast] = useState(null); // { severity, text }
  const [busyId, setBusyId] = useState(null);
  const dismissed = useRef(new Set()); // decisions closed this visit, in case storage is blocked

  const logoutRef = useRef(logout);
  logoutRef.current = logout;
  const sessionExpired = useCallback((err) => {
    if (err?.response?.status !== 401) return false;
    logoutRef.current();
    router.push('/login');
    return true;
  }, [router]);

  useEffect(() => {
    const t = new URLSearchParams(window.location.search).get('tab');
    if (TABS.some((d) => d.value === t)) setTab(t);
  }, []);

  const run = useRef(0);
  const load = useCallback((quiet = false) => {
    if (!isAuth || !user?.email) return;
    const id = ++run.current;
    if (!quiet) setStatus('loading');
    axios.get(`${API_BASE}/api/appointments`, { headers: { Authorization: `Bearer ${token}` } })
      .then((res) => {
        if (id !== run.current) return;
        setAppointments(Array.isArray(res.data) ? res.data : []);
        setStatus('ready');
      })
      .catch((err) => {
        if (id !== run.current || sessionExpired(err)) return;
        if (!quiet) setStatus('error');
      });
  }, [isAuth, user?.email, token, sessionExpired]);

  useEffect(() => { load(); }, [load]);

  // Hospitals confirm, check in and answer reschedule requests from their side: refresh quietly
  // when the page becomes visible again (at most every 30 seconds).
  useEffect(() => {
    let last = Date.now();
    const onVisible = () => {
      if (document.visibilityState !== 'visible' || Date.now() - last < 30_000) return;
      last = Date.now();
      load(true);
    };
    document.addEventListener('visibilitychange', onVisible);
    return () => document.removeEventListener('visibilitychange', onVisible);
  }, [load]);

  useEffect(() => {
    let alive = true;
    getHospitals()
      .then((list) => {
        if (!alive) return;
        const byId = {};
        const byName = {};
        for (const h of list) {
          const entry = { ...h, imageUrl: hospitalImageUrl(h.image) };
          byId[h._id] = entry;
          if (h.name) byName[h.name.trim().toLowerCase()] = entry;
        }
        setHospitals({ byId, byName });
      })
      .catch(() => { /* cards fall back to the stored center name and a neutral image */ });
    return () => { alive = false; };
  }, []);

  // Surface a hospital decision this browser hasn't shown yet.
  useEffect(() => {
    if (status !== 'ready' || decision) return;
    const next = unseenDecision(appointments, dismissed.current);
    if (next) setDecision(next);
  }, [appointments, status, decision]);

  const today = todayKey();
  const counts = useMemo(() => {
    const c = { upcoming: 0, completed: 0, cancelled: 0, missed: 0 };
    for (const a of appointments) c[categoryOf(a, today)] += 1;
    return c;
  }, [appointments, today]);
  const shown = useMemo(
    () => sortAppointments(appointments.filter((a) => categoryOf(a, today) === tab), today),
    [appointments, tab, today]
  );
  const selected = shown.find((a) => a._id === selectedId) || shown[0] || null;
  const tabs = TABS.filter((t) => t.value !== 'missed' || counts.missed > 0 || tab === 'missed');
  const tabDef = TABS.find((t) => t.value === tab);
  const hospitalFor = (a) => hospitals.byId[a.hospital] || hospitals.byName[(a.location || '').trim().toLowerCase()];
  const replace = (data) => setAppointments((list) => list.map((x) => (x._id === data._id ? data : x)));

  const changeTab = (value) => { setTab(value); setTabParam(value); setSelectedId(null); };

  const withdraw = async (appt, request) => {
    setBusyId(appt._id);
    try {
      const { data } = await axios.delete(`${API_BASE}/api/appointments/${appt._id}/reschedule-requests/${request._id}`,
        { headers: { Authorization: `Bearer ${token}` } });
      replace(data);
      setToast({ severity: 'success', text: 'Your reschedule request was withdrawn. Your appointment is unchanged.' });
    } catch (err) {
      if (!sessionExpired(err)) {
        setToast({ severity: 'error', text: apiErrorMessage(err, 'We couldn’t withdraw the request. Please try again.') });
        load(true);
      }
    } finally {
      setBusyId(null);
    }
  };

  return (
    <Box sx={{
      display: 'grid', gap: { xs: 2.5, lg: 3 }, pb: 4, alignItems: 'start',
      gridTemplateColumns: { xs: 'minmax(0, 1fr)', lg: 'minmax(0, 1fr) 340px', xl: 'minmax(0, 1fr) 370px' },
    }}>
      <Box sx={{ minWidth: 0 }}>
        <Breadcrumbs separator={<NavigateNextIcon fontSize="small" />} aria-label="Breadcrumb" sx={{ fontSize: '0.88rem', mb: 1.5 }}>
          <Box component={Link} href="/profile" sx={{ color: 'text.secondary', textDecoration: 'none', '&:hover': { color: 'text.primary' } }}>Donor Portal</Box>
          <Typography color="text.primary" sx={{ fontSize: 'inherit', fontWeight: 500 }} aria-current="page">My Appointments</Typography>
        </Breadcrumbs>

        <Box sx={{ display: 'flex', alignItems: { xs: 'flex-start', sm: 'center' }, justifyContent: 'space-between', gap: 2, flexDirection: { xs: 'column', sm: 'row' } }}>
          <Box>
            <Typography component="h1" sx={{ fontWeight: 800, fontSize: { xs: '1.75rem', md: '2.1rem' }, letterSpacing: '-0.02em', lineHeight: 1.15 }}>
              My Appointments
            </Typography>
            <Typography color="text.secondary" sx={{ mt: 0.5, fontSize: '1rem' }}>Manage your blood donation appointments</Typography>
          </Box>
          <Button component={Link} href="/appointments" variant="contained" startIcon={<AddIcon />}
            sx={{ height: 46, px: 2.75, flexShrink: 0, fontSize: '0.95rem', width: { xs: '100%', sm: 'auto' } }}>
            Book New Appointment
          </Button>
        </Box>

        <Tabs value={tab} onChange={(_, v) => changeTab(v)} aria-label="Appointment groups" variant="scrollable" scrollButtons={false}
          sx={{
            mt: 2.5, mb: 2.5, borderBottom: '1px solid', borderColor: 'divider',
            '& .MuiTab-root': { minHeight: 52, px: { xs: 1.5, sm: 2 }, mr: { sm: 1 }, fontSize: '1rem', fontWeight: 500, color: 'text.secondary' },
            '& .MuiTab-root.Mui-selected': { color: 'primary.main', fontWeight: 700 },
          }}>
          {tabs.map((t) => (
            <Tab key={t.value} value={t.value} id={`appt-tab-${t.value}`} aria-controls="appt-panel"
              label={`${t.label}${status === 'ready' ? ` (${counts[t.value]})` : ''}`} />
          ))}
        </Tabs>

        <Box id="appt-panel" role="tabpanel" aria-labelledby={`appt-tab-${tab}`} aria-busy={status === 'loading'}
          sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {status === 'loading' ? (
            <><CardSkeleton /><CardSkeleton /></>
          ) : status === 'error' ? (
            <Alert severity="error" variant="outlined" icon={<ErrorOutlineIcon />} sx={{ alignItems: 'center' }}
              action={<Button color="error" size="small" onClick={() => load()}>Try again</Button>}>
              We couldn&apos;t load your appointments. Check your connection and try again.
            </Alert>
          ) : shown.length === 0 ? (
            <Paper elevation={0} sx={{ borderRadius: '16px', border: '1px solid', borderColor: 'divider' }}>
              <EmptyPanel icon={<EventAvailableOutlinedIcon />} title={tabDef.empty} text={tabDef.hint}
                action={tab === 'upcoming' && (
                  <Button component={Link} href="/appointments" variant="contained" startIcon={<AddIcon />}>Book Appointment</Button>
                )} />
            </Paper>
          ) : (
            shown.map((a) => (
              <AppointmentCard key={a._id} appt={a} hospital={hospitalFor(a)} selected={selected?._id === a._id}
                busy={busyId === a._id}
                onSelect={(x) => setSelectedId(x._id)} onView={setDetail} onChange={setChanging} onCancel={setCancelling}
                onWithdraw={withdraw} />
            ))
          )}
        </Box>
      </Box>

      <Box sx={{ position: { lg: 'sticky' }, top: { lg: 88 }, display: { xs: shown.length ? 'block' : 'none', lg: 'block' } }}>
        <StatusTimeline appt={status === 'ready' ? selected : null} />
      </Box>

      {detail && (
        <AppointmentDetailsDialog appt={detail} hospital={hospitalFor(detail)} token={token}
          onClose={() => setDetail(null)} onSessionExpired={sessionExpired} onFresh={replace} />
      )}
      {changing && (
        <RescheduleDialog appt={changing} token={token} onClose={() => setChanging(null)} onSessionExpired={sessionExpired}
          onDone={(data, mode) => {
            replace(data);
            setChanging(null);
            setSelectedId(data._id);
            const list = data.rescheduleRequests || [];
            setSubmitted({ mode, request: mode === 'requested' ? openRequest(data) : list[list.length - 1] });
          }} />
      )}
      {cancelling && (
        <CancelDialog appt={cancelling} token={token} onClose={() => setCancelling(null)} onSessionExpired={sessionExpired}
          onDone={(data) => {
            replace(data);
            setCancelling(null);
            setToast({ severity: 'success', text: 'Your appointment has been cancelled.' });
          }} />
      )}
      {submitted && <SubmittedDialog mode={submitted.mode} request={submitted.request} onClose={() => setSubmitted(null)} />}

      <DecisionToast decision={decision} onClose={() => {
        if (decision) { markDecisionSeen(decision.request._id); dismissed.current.add(decision.request._id); }
        setDecision(null);
      }} />
      <Snackbar open={Boolean(toast)} autoHideDuration={5000} onClose={() => setToast(null)} anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}>
        {toast ? <Alert severity={toast.severity} variant="filled" onClose={() => setToast(null)}>{toast.text}</Alert> : <span />}
      </Snackbar>
    </Box>
  );
}
