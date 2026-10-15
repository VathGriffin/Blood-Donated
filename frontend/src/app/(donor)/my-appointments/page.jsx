'use client';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import {
  Alert, Box, Button, MenuItem, Paper, Select, Skeleton, Tab, Tabs,
} from '@mui/material';
import EventAvailableOutlinedIcon from '@mui/icons-material/EventAvailableOutlined';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import EventBusyOutlinedIcon from '@mui/icons-material/EventBusyOutlined';
import CalendarMonthOutlinedIcon from '@mui/icons-material/CalendarMonthOutlined';
import SearchOffIcon from '@mui/icons-material/SearchOff';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import AddIcon from '@mui/icons-material/Add';
import API_BASE from '@/lib/config';
import { useUserAuth } from '@/store/UserAuthContext';
import { getHospitals } from '@/lib/public-directory';
import { EmptyPanel, StatCard, cardSx, formatDate, todayKey } from '@/components/donor/ui';
import { hospitalImageUrl } from '@/app/(public)/appointments/_components/booking';
import DonorPageHero from '@/components/donor/PageHero';
import EventAvailableIcon from '@mui/icons-material/EventAvailable';
import AppointmentRow from './_components/AppointmentRow';
import AppointmentDetailsDialog from './_components/AppointmentDetailsDialog';
import { RANGES, TAB_DEFS, categoryOf, sortAppointments } from './_components/appointments';

// Keep ?tab= in the address bar so a refresh or a shared link opens the same tab.
const setTabParam = (value) => {
  try {
    const url = new URL(window.location.href);
    if (value === 'all') url.searchParams.delete('tab'); else url.searchParams.set('tab', value);
    window.history.replaceState(window.history.state, '', url);
  } catch { /* cosmetic */ }
};

function RowSkeleton() {
  return (
    <Box aria-hidden="true" sx={{ p: 2, borderRadius: '16px', border: '1px solid', borderColor: 'divider', display: 'flex', gap: 2.5, alignItems: 'center' }}>
      <Skeleton variant="rounded" width={96} height={104} sx={{ borderRadius: '12px' }} />
      <Box sx={{ flex: 1 }}>
        <Skeleton width="40%" height={28} />
        <Skeleton width="30%" />
        <Skeleton width="60%" height={40} />
      </Box>
      <Skeleton variant="rounded" width={140} height={44} sx={{ display: { xs: 'none', md: 'block' }, borderRadius: '12px' }} />
    </Box>
  );
}

/**
 * The signed-in donor's appointments (GET /api/appointments — the API returns only the caller's
 * own). Booking stays on the existing /appointments page. Donors can't cancel or reschedule
 * through the API (status changes are staff-only), so this page offers no such buttons.
 */
export default function MyAppointmentsPage() {
  const router = useRouter();
  const { isAuth, user, token, logout } = useUserAuth();

  const [appointments, setAppointments] = useState([]);
  const [status, setStatus] = useState('loading'); // 'loading' | 'ready' | 'error'
  const [hospitals, setHospitals] = useState({ byId: {}, byName: {} }); // public directory entries
  const [tab, setTab] = useState('all');
  const [range, setRange] = useState('all');
  const [detail, setDetail] = useState(null);

  // `logout` changes identity when the auth context re-renders; read it through a ref so the
  // loader below stays stable.
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
    if (TAB_DEFS.some((d) => d.value === t)) setTab(t);
  }, []);

  // Numbered runs: a slow older response never overwrites a newer one. `quiet` keeps the list
  // on screen (no skeletons, no error swap) for background refreshes.
  const run = useRef(0);
  const load = useCallback((quiet = false) => {
    if (!isAuth || !user?.email) return;
    const id = ++run.current;
    if (!quiet) setStatus('loading');
    axios.get(`${API_BASE}/api/appointments?email=${encodeURIComponent(user.email)}`, { headers: { Authorization: `Bearer ${token}` } })
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

  // Staff confirm and check in appointments from their side: refresh quietly when the page
  // becomes visible again (at most once a minute).
  useEffect(() => {
    let last = Date.now();
    const onVisible = () => {
      if (document.visibilityState !== 'visible' || Date.now() - last < 60_000) return;
      last = Date.now();
      load(true);
    };
    document.addEventListener('visibilitychange', onVisible);
    return () => document.removeEventListener('visibilitychange', onVisible);
  }, [load]);

  // Public hospital directory (shared cache): address, city, phone and photo for each card.
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

  const today = todayKey();
  const overall = useMemo(() => {
    const c = { upcoming: 0, completed: 0, cancelled: 0, missed: 0 };
    for (const a of appointments) c[categoryOf(a, today)] += 1;
    return c;
  }, [appointments, today]);

  const inRange = useMemo(() => {
    const test = (RANGES.find((r) => r.value === range) || RANGES[0]).test;
    return appointments.filter((a) => a.date && test(a.date));
  }, [appointments, range]);

  const tabCounts = useMemo(() => {
    const c = { all: inRange.length, upcoming: 0, completed: 0, cancelled: 0 };
    for (const a of inRange) {
      const cat = categoryOf(a, today);
      if (cat in c) c[cat] += 1;
    }
    return c;
  }, [inRange, today]);

  const shown = useMemo(
    () => sortAppointments(tab === 'all' ? inRange : inRange.filter((a) => categoryOf(a, today) === tab), today),
    [inRange, tab, today]
  );

  const changeTab = (value) => { setTab(value); setTabParam(value); };
  // The linked hospital record; for older bookings with no hospital id, the registered hospital
  // whose name matches the stored center name (booking stores the hospital's own name there).
  const hospitalFor = (a) => hospitals.byId[a.hospital] || hospitals.byName[(a.location || '').trim().toLowerCase()];
  const ready = status === 'ready';
  const nextUp = useMemo(() => sortAppointments(appointments.filter((a) => categoryOf(a, today) === 'upcoming'), today)[0], [appointments, today]);
  const rangeLabel = (RANGES.find((r) => r.value === range) || RANGES[0]).label.toLowerCase();

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: { xs: 2, md: 2.5 }, pb: 4, minWidth: 0 }}>
      <DonorPageHero id="appointments-title" icon={<EventAvailableIcon />} title="My Appointments"
        subtitle="Manage your blood donation appointments, check their status and view details."
        actionHref="/appointments" actionLabel="Book Appointment" />

      {/* Summary — counts over all of the donor's appointments */}
      <Box sx={{ display: 'grid', gap: { xs: 1.5, md: 2 }, gridTemplateColumns: { xs: '1fr', md: 'repeat(3, 1fr)' } }}>
        <StatCard icon={<EventAvailableOutlinedIcon />} label="Upcoming Appointments" loading={status === 'loading'}
          value={status === 'error' ? '—' : overall.upcoming} selected={tab === 'upcoming'}
          sub={ready ? (nextUp ? `Next: ${formatDate(nextUp.date)} · ${nextUp.time}` : 'Nothing scheduled yet') : undefined}
          onClick={() => changeTab('upcoming')} />
        <StatCard icon={<CheckCircleOutlineIcon />} tone="success" label="Completed Appointments" loading={status === 'loading'}
          value={status === 'error' ? '—' : overall.completed} selected={tab === 'completed'}
          sub={ready ? (overall.completed ? 'Thank you for saving lives' : 'Checked-in donations appear here') : undefined}
          onClick={() => changeTab('completed')} />
        <StatCard icon={<EventBusyOutlinedIcon />} tone="error" label="Cancelled Appointments" loading={status === 'loading'}
          value={status === 'error' ? '—' : overall.cancelled} selected={tab === 'cancelled'}
          sub={ready ? 'Cancelled bookings' : undefined}
          onClick={() => changeTab('cancelled')} />
      </Box>

      {/* Tabs + date range + list */}
      <Paper elevation={0} sx={{ ...cardSx, overflow: 'hidden' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, px: { xs: 0.5, sm: 2 }, borderBottom: '1px solid', borderColor: 'divider', flexWrap: { xs: 'wrap', sm: 'nowrap' } }}>
          <Tabs value={tab} onChange={(_, v) => changeTab(v)} aria-label="Filter appointments" variant="scrollable" scrollButtons={false}
            sx={{
              flex: 1, minWidth: 0,
              '& .MuiTab-root': { minHeight: 60, fontWeight: 700, fontSize: { xs: '0.88rem', sm: '0.98rem' }, color: 'text.secondary', px: { xs: 1.5, sm: 2.5 } },
              '& .MuiTab-root.Mui-selected': { color: 'primary.main' },
              '& .MuiTabs-indicator': { height: 3, borderRadius: '3px 3px 0 0' },
            }}>
            {TAB_DEFS.map((d) => (
              <Tab key={d.value} value={d.value} id={`appt-tab-${d.value}`} aria-controls="appt-panel"
                label={`${d.label}${ready ? ` (${tabCounts[d.value]})` : ''}`} />
            ))}
          </Tabs>
          <Select size="small" value={range} onChange={(e) => setRange(e.target.value)}
            inputProps={{ 'aria-label': 'Date range' }}
            startAdornment={<CalendarMonthOutlinedIcon aria-hidden="true" sx={{ fontSize: 20, color: 'text.secondary', mr: 1 }} />}
            sx={{ flexShrink: 0, height: 42, minWidth: 170, borderRadius: '10px', fontWeight: 600, mx: { xs: 1.5, sm: 0 }, mb: { xs: 1.25, sm: 0 }, width: { xs: 'calc(100% - 24px)', sm: 'auto' } }}>
            {RANGES.map((r) => <MenuItem key={r.value} value={r.value}>{r.label}</MenuItem>)}
          </Select>
        </Box>

        <Box id="appt-panel" role="tabpanel" aria-labelledby={`appt-tab-${tab}`} aria-busy={status === 'loading'}
          sx={{ p: { xs: 1.5, sm: 2 }, display: 'flex', flexDirection: 'column', gap: 1.75 }}>
          {status === 'loading' ? (
            <>{[0, 1, 2].map((i) => <RowSkeleton key={i} />)}</>
          ) : status === 'error' ? (
            <Alert severity="error" variant="outlined" icon={<ErrorOutlineIcon />} sx={{ borderRadius: '12px', alignItems: 'center' }}
              action={<Button color="error" size="small" onClick={() => load()}>Try again</Button>}>
              We couldn&apos;t load your appointments. Check your connection and try again.
            </Alert>
          ) : appointments.length === 0 ? (
            <EmptyPanel icon={<EventAvailableOutlinedIcon />} title="No appointments yet"
              text="Book a donation slot at a center near you. Your bookings will appear here."
              action={<Button component={Link} href="/appointments" variant="contained" startIcon={<AddIcon />}>Book Appointment</Button>} />
          ) : shown.length === 0 ? (
            <EmptyPanel icon={<SearchOffIcon />}
              title={`No ${tab === 'all' ? '' : `${tab} `}appointments ${range === 'all' ? 'yet' : `in ${rangeLabel}`}`}
              text={range === 'all' ? 'Try another tab.' : 'Try another tab or a wider date range.'}
              action={(tab !== 'all' || range !== 'all') && (
                <Button variant="outlined" onClick={() => { changeTab('all'); setRange('all'); }}>Show all appointments</Button>
              )} />
          ) : (
            shown.map((a) => <AppointmentRow key={a._id} appt={a} hospital={hospitalFor(a)} onView={setDetail} />)
          )}
          {ready && overall.missed > 0 && tab === 'all' && (
            <Box component="p" sx={{ m: 0, mt: 0.5, color: 'text.secondary', fontSize: '0.82rem' }}>
              “Missed” appointments are past bookings that were never checked in. They count under All only.
            </Box>
          )}
        </Box>
      </Paper>

      {detail && (
        <AppointmentDetailsDialog appt={detail} hospital={hospitalFor(detail)} token={token}
          onClose={() => setDetail(null)} onSessionExpired={sessionExpired}
          onFresh={(data) => setAppointments((list) => list.map((x) => (x._id === data._id ? data : x)))} />
      )}
    </Box>
  );
}
