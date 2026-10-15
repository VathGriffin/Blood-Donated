'use client';
import { useCallback, useDeferredValue, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Box, Typography, Paper, Chip, Button, Skeleton, Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, CircularProgress, Tabs, Tab, Alert, Snackbar, InputBase, IconButton,
} from '@mui/material';
import { alpha } from '@mui/material/styles';
import BloodtypeOutlinedIcon from '@mui/icons-material/BloodtypeOutlined';
import EventAvailableOutlinedIcon from '@mui/icons-material/EventAvailableOutlined';
import EventAvailableIcon from '@mui/icons-material/EventAvailable';
import DescriptionOutlinedIcon from '@mui/icons-material/DescriptionOutlined';
import LockIcon from '@mui/icons-material/Lock';
import AddIcon from '@mui/icons-material/Add';
import SearchIcon from '@mui/icons-material/Search';
import CloseIcon from '@mui/icons-material/Close';
import SearchOffIcon from '@mui/icons-material/SearchOff';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import WaterDropIcon from '@mui/icons-material/WaterDrop';
import CalendarMonthOutlinedIcon from '@mui/icons-material/CalendarMonthOutlined';
import BarChartIcon from '@mui/icons-material/BarChart';
import FavoriteBorderIcon from '@mui/icons-material/FavoriteBorder';
import { formatDistanceToNow } from 'date-fns';
import axios from 'axios';
import API_BASE from '@/lib/config';
import { initialsOf } from '@/lib/format';
import { useUserAuth } from '@/store/UserAuthContext';
import { getHospitals } from '@/lib/public-directory';
import { hospitalImageUrl } from '@/app/(public)/appointments/_components/booking';
import ProfileHero from './_components/ProfileHero';
import AvailabilityCard from './_components/AvailabilityCard';
import RequestCard from './_components/RequestCard';
import RequestDetailsDialog from '@/components/donor/RequestDetailsDialog';
import CancelRequestDialog from '@/components/donor/CancelRequestDialog';
import AppointmentCard, { DonationCard } from './_components/AppointmentCard';
import {
  APPT_FILTERS, APPT_STATUS, EmptyPanel, REQUEST_FILTERS, REQUEST_STATUS, StatCard, cardSx, formatDate, todayKey,
} from '@/components/donor/ui';

const MAX_PHOTO_SIZE = 10 * 1024 * 1024; // must match the API's upload limit

const TABS = ['requests', 'appointments', 'history'];

// { All: n, Pending: n, Approved: n, … } in one pass over the list.
const countByStatus = (list) => list.reduce((acc, x) => {
  const s = x.status || 'Pending';
  acc[s] = (acc[s] || 0) + 1;
  return acc;
}, { All: list.length });

// Keep ?tab= in the address bar so a refresh or shared link opens the same tab.
const setTabParam = (key) => {
  try {
    const url = new URL(window.location.href);
    if (key === 'requests') url.searchParams.delete('tab'); else url.searchParams.set('tab', key);
    window.history.replaceState(window.history.state, '', url);
  } catch { /* cosmetic */ }
};

function ListSkeleton({ rows = 3 }) {
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }} aria-hidden="true">
      {Array.from({ length: rows }, (_, i) => (
        <Box key={i} sx={{ p: 2, borderRadius: '14px', border: '1px solid', borderColor: 'divider', display: 'flex', gap: 1.75 }}>
          <Skeleton variant="rounded" width={52} height={52} sx={{ borderRadius: '14px' }} />
          <Box sx={{ flex: 1 }}>
            <Skeleton width="40%" height={24} />
            <Skeleton width="70%" />
            <Skeleton variant="rounded" height={34} sx={{ mt: 1, borderRadius: '10px' }} />
          </Box>
        </Box>
      ))}
    </Box>
  );
}

function LoadError({ what, onRetry }) {
  return (
    <Alert severity="error" variant="outlined" icon={<ErrorOutlineIcon />} sx={{ borderRadius: '12px', alignItems: 'center' }}
      action={<Button color="error" size="small" onClick={onRetry}>Try again</Button>}>
      We couldn&apos;t load your {what}. Check your connection and try again.
    </Alert>
  );
}

export default function ProfilePage() {
  const router = useRouter();
  const { isAuth, user, token, updateUser, logout } = useUserAuth();

  // A 401 means the stored session is no longer valid: sign out and go to the login page.
  // `logout` is a new function whenever the auth context re-renders (e.g. after a profile
  // edit), so it's read through a ref: the loaders below stay stable and don't refetch.
  const logoutRef = useRef(logout);
  logoutRef.current = logout;
  const sessionExpired = useCallback((err) => {
    if (err?.response?.status !== 401) return false;
    logoutRef.current();
    router.push('/login');
    return true;
  }, [router]);

  // `status` is 'loading' | 'ready' | 'error' for each list.
  const [requests,     setRequests]     = useState([]);
  const [reqStatus,    setReqStatus]    = useState('loading');
  const [appointments, setAppointments] = useState([]);
  const [apptStatus,   setApptStatus]   = useState('loading');
  const [hospitalPhones, setHospitalPhones] = useState({}); // hospital id -> public phone
  const [hospitalImages, setHospitalImages] = useState({}); // hospital id or name -> photo URL
  const [photoLoading, setPhotoLoading] = useState(false);
  const [editOpen,     setEditOpen]     = useState(false);
  const [editName,     setEditName]     = useState('');
  const [editPhone,    setEditPhone]    = useState('');
  const [saving,       setSaving]       = useState(false);
  const [saveError,    setSaveError]    = useState('');
  const [tab,          setTab]          = useState('requests');
  const [reqFilter,    setReqFilter]    = useState('All');
  const [apptFilter,   setApptFilter]   = useState('All');
  const [reqQuery,     setReqQuery]     = useState('');
  const [apptQuery,    setApptQuery]    = useState('');
  const [historyQuery, setHistoryQuery] = useState('');
  const [donorStatus,  setDonorStatus]  = useState(null); // null = loading, { found, available, ... } once checked
  const [donorAttempt, setDonorAttempt] = useState(0);
  const [availSaving,  setAvailSaving]  = useState(false);
  const [availError,   setAvailError]   = useState('');
  const [toast,        setToast]        = useState(null); // { severity, message }

  const fileInputRef = useRef(null);
  const tabsRef = useRef(null);
  const authHeader = useCallback(() => ({ headers: { Authorization: `Bearer ${token}` } }), [token]);

  // (The session itself is verified by DashboardShell before this page renders, so there is
  // no separate /api/user/me check here.)

  useEffect(() => {
    const t = new URLSearchParams(window.location.search).get('tab');
    if (TABS.includes(t)) setTab(t);
  }, []);

  // Each list loader numbers its runs, so a slow older response can never overwrite a newer
  // one. `quiet` refreshes in place (after a cancellation, or when the tab regains focus)
  // without swapping the list for skeletons or replacing it with an error.
  const reqRun = useRef(0);
  const loadRequests = useCallback((quiet = false) => {
    if (!isAuth || !user?.email) return Promise.resolve();
    const run = ++reqRun.current;
    if (!quiet) setReqStatus('loading');
    return axios.get(`${API_BASE}/api/requests?email=${encodeURIComponent(user.email)}`, { headers: { Authorization: `Bearer ${token}` } })
      .then((res) => {
        if (run !== reqRun.current) return;
        setRequests(Array.isArray(res.data) ? res.data : []);
        setReqStatus('ready');
      })
      .catch((err) => {
        if (run !== reqRun.current || sessionExpired(err)) return;
        if (!quiet) setReqStatus('error');
      });
  }, [isAuth, user?.email, token, sessionExpired]);

  const apptRun = useRef(0);
  const loadAppointments = useCallback((quiet = false) => {
    if (!isAuth || !user?.email) return Promise.resolve();
    const run = ++apptRun.current;
    if (!quiet) setApptStatus('loading');
    return axios.get(`${API_BASE}/api/appointments?email=${encodeURIComponent(user.email)}`, { headers: { Authorization: `Bearer ${token}` } })
      .then((res) => {
        if (run !== apptRun.current) return;
        setAppointments(Array.isArray(res.data) ? res.data : []);
        setApptStatus('ready');
      })
      .catch((err) => {
        if (run !== apptRun.current || sessionExpired(err)) return;
        if (!quiet) setApptStatus('error');
      });
  }, [isAuth, user?.email, token, sessionExpired]);

  useEffect(() => { loadRequests(); }, [loadRequests]);
  useEffect(() => { loadAppointments(); }, [loadAppointments]);

  // Hospitals approve requests and confirm appointments while this page sits in another tab:
  // refresh both lists quietly when the page becomes visible again (at most once a minute).
  useEffect(() => {
    let last = Date.now();
    const onVisible = () => {
      if (document.visibilityState !== 'visible' || Date.now() - last < 60_000) return;
      last = Date.now();
      loadRequests(true);
      loadAppointments(true);
    };
    document.addEventListener('visibilitychange', onVisible);
    return () => document.removeEventListener('visibilitychange', onVisible);
  }, [loadRequests, loadAppointments]);

  useEffect(() => {
    if (!isAuth || !user?.email) return undefined;
    let alive = true;
    setDonorStatus(null);
    axios.get(`${API_BASE}/api/donors/lookup?email=${encodeURIComponent(user.email)}`, { headers: { Authorization: `Bearer ${token}` } })
      .then((res) => { if (alive) setDonorStatus(res.data); })
      // A failed lookup is not the same as "not registered" — don't send an existing donor
      // to the registration form just because the request errored.
      .catch((err) => { if (alive && !sessionExpired(err)) setDonorStatus({ found: false, error: true }); });
    return () => { alive = false; };
  }, [isAuth, user?.email, token, donorAttempt, sessionExpired]);

  // Public hospital directory (shared cache), only for the phone numbers behind the "Contact" buttons.
  useEffect(() => {
    let alive = true;
    getHospitals()
      .then((list) => {
        if (!alive) return;
        const phones = {};
        const images = {};
        for (const h of list) {
          if (h.phone) phones[h._id] = h.phone;
          const img = hospitalImageUrl(h.image);
          // By id, and by name for older appointments booked before they carried a hospital id.
          if (img) { images[h._id] = img; if (h.name) images[h.name] = img; }
        }
        setHospitalPhones(phones);
        setHospitalImages(images);
      })
      .catch(() => { /* no phone buttons or photos then */ });
    return () => { alive = false; };
  }, []);

  const [detailTarget, setDetailTarget] = useState(null); // request shown in the details dialog

  // ── Cancel a pending request (confirmation + PATCH live in CancelRequestDialog).
  const [cancelTarget, setCancelTarget] = useState(null);
  const [cancelling,   setCancelling]   = useState(false);
  const openCancel = (req) => setCancelTarget(req);
  const onCancelled = (data) => {
    setRequests((list) => list.map((r) => (r._id === data._id ? data : r)));
    setCancelTarget(null);
    setToast({ severity: 'success', message: 'Your blood request has been cancelled.' });
    loadRequests(true);
  };
  // The request changed meanwhile (approved, already cancelled, removed) — show its real state.
  const onCancelConflict = (message) => {
    setCancelTarget(null);
    setToast({ severity: 'warning', message });
    loadRequests(true);
  };

  // ── Derived data (all from the API responses above) ──
  const today = todayKey();
  const reqCounts = useMemo(() => countByStatus(requests), [requests]);
  const apptCounts = useMemo(() => countByStatus(appointments), [appointments]);
  const reqCount = (s) => reqCounts[s] || 0;
  const apptCount = (s) => apptCounts[s] || 0;

  // Typing stays responsive: the lists re-filter from a deferred copy of each query.
  const reqQ = useDeferredValue(reqQuery);
  const apptQ = useDeferredValue(apptQuery);
  const historyQ = useDeferredValue(historyQuery);

  const upcoming = useMemo(() => appointments
    .filter((a) => ['Pending', 'Confirmed'].includes(a.status || 'Pending') && a.date >= today)
    .sort((a, b) => a.date.localeCompare(b.date)), [appointments, today]);
  // Donation history = appointments staff checked in (check-in records the donation), newest first.
  const donations = useMemo(() => appointments
    .filter((a) => a.status === 'CheckedIn')
    .sort((a, b) => new Date(b.checkedInAt || b.date) - new Date(a.checkedInAt || a.date)), [appointments]);
  const filteredDonations = useMemo(() => {
    const q = historyQ.trim().toLowerCase();
    return q ? donations.filter((a) => [a.location, a.date, a.bloodType].some((v) => v?.toLowerCase().includes(q))) : donations;
  }, [donations, historyQ]);

  const filteredRequests = useMemo(() => {
    const q = reqQ.trim().toLowerCase();
    return requests.filter((r) =>
      (reqFilter === 'All' || (r.status || 'Pending') === reqFilter) &&
      (!q || [r.patientName, r.hospitalName, r.bloodType, r.reason].some((v) => v?.toLowerCase().includes(q))));
  }, [requests, reqFilter, reqQ]);

  // Upcoming first (soonest on top), then everything else newest first.
  const filteredAppointments = useMemo(() => {
    const q = apptQ.trim().toLowerCase();
    const list = appointments.filter((a) =>
      (apptFilter === 'All' || (a.status || 'Pending') === apptFilter) &&
      (!q || [a.location, a.date, a.time, a.bloodType, a.notes].some((v) => v?.toLowerCase().includes(q))));
    const isUp = (a) => ['Pending', 'Confirmed'].includes(a.status || 'Pending') && a.date >= today;
    return list.sort((a, b) => {
      const ua = isUp(a), ub = isUp(b);
      if (ua !== ub) return ua ? -1 : 1;
      return ua ? a.date.localeCompare(b.date) : (b.date || '').localeCompare(a.date || '');
    });
  }, [appointments, apptFilter, apptQ, today]);

  if (!isAuth) {
    return (
      <Box sx={{ minHeight: '70vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 2, textAlign: 'center', px: 3 }}>
        <LockIcon sx={{ fontSize: 52, color: 'primary.main' }} />
        <Typography variant="h5" fontWeight={700}>Sign in to view your profile</Typography>
        <Typography color="text.secondary" fontSize="0.9rem">
          Your blood requests and donor information are only visible when logged in.
        </Typography>
        <Box display="flex" gap={2} mt={1}>
          <Button variant="contained" component={Link} href="/login">Log In</Button>
          <Button variant="outlined" component={Link} href="/register">Sign Up</Button>
        </Box>
      </Box>
    );
  }

  // ── Actions ──
  const handlePhotoClick = () => {
    if (photoLoading) return;
    fileInputRef.current?.click();
  };

  const handlePhotoChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setToast({ severity: 'error', message: 'Please choose an image file.' });
      e.target.value = '';
      return;
    }
    if (file.size > MAX_PHOTO_SIZE) {
      setToast({ severity: 'error', message: 'Image must be under 10 MB.' });
      e.target.value = '';
      return;
    }
    setPhotoLoading(true);
    try {
      const form = new FormData();
      form.append('photo', file);
      // Do NOT set Content-Type — axios sets it automatically with the correct multipart boundary
      const res = await axios.post(`${API_BASE}/api/user/photo`, form, authHeader());
      updateUser({ photo: res.data.photo });
      setToast({ severity: 'success', message: 'Profile photo updated.' });
    } catch (err) {
      if (!sessionExpired(err)) setToast({ severity: 'error', message: err.response?.data?.message || 'Photo upload failed.' });
    } finally {
      setPhotoLoading(false);
      e.target.value = '';
    }
  };

  const openEdit = () => {
    setEditName(user?.fullName || '');
    setEditPhone(user?.phone || '');
    setSaveError('');
    setEditOpen(true);
  };

  const handleSaveProfile = async (e) => {
    e?.preventDefault();
    if (!editName.trim()) { setSaveError('Name cannot be empty.'); return; }
    setSaving(true);
    setSaveError('');
    try {
      const res = await axios.put(`${API_BASE}/api/user/profile`, { fullName: editName.trim(), phone: editPhone.trim() }, authHeader());
      updateUser({ fullName: res.data.fullName, phone: res.data.phone });
      setEditOpen(false);
      setToast({ severity: 'success', message: 'Profile updated.' });
    } catch (err) {
      if (!sessionExpired(err)) setSaveError(err.response?.data?.message || 'Failed to save. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleToggleAvailability = async (available) => {
    setAvailSaving(true);
    setAvailError('');
    try {
      const { data } = await axios.patch(`${API_BASE}/api/donors/me/availability`, { available }, authHeader());
      setDonorStatus((prev) => ({ ...prev, available: data.available }));
      setToast({ severity: 'success', message: data.available ? 'You are now marked available to donate.' : 'You are now marked unavailable.' });
    } catch (err) {
      if (!sessionExpired(err)) setAvailError(err.response?.data?.message || 'Failed to update availability.');
    } finally {
      setAvailSaving(false);
    }
  };

  const changeTab = (_, value) => { setTab(value); setTabParam(value); };
  const openTab = (value) => {
    changeTab(null, value);
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    tabsRef.current?.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' });
  };

  const photoSrc = user?.photo ? `${API_BASE}${user.photo}` : null;
  const isReq = tab === 'requests';
  const isHistory = tab === 'history';
  const filters = isReq ? REQUEST_FILTERS : APPT_FILTERS;
  const statusMeta = isReq ? REQUEST_STATUS : APPT_STATUS;
  const activeFilter = isReq ? reqFilter : apptFilter;
  const setActiveFilter = isReq ? setReqFilter : setApptFilter;
  const query = isReq ? reqQuery : isHistory ? historyQuery : apptQuery;
  const setQuery = isReq ? setReqQuery : isHistory ? setHistoryQuery : setApptQuery;
  const listStatus = isReq ? reqStatus : apptStatus;
  const total = isReq ? requests.length : isHistory ? donations.length : appointments.length;
  const shown = isReq ? filteredRequests.length : isHistory ? filteredDonations.length : filteredAppointments.length;
  const noun = isReq ? 'request' : isHistory ? 'donation' : 'appointment';
  const newHref = isReq ? '/requests' : '/appointments';
  const newLabel = isReq ? 'New Request' : 'Book Appointment';

  // The donor record's lastDonation is updated on check-in; fall back to the newest check-in.
  const lastDonation = donorStatus?.lastDonation || donations[0]?.checkedInAt || null;

  const tabDefs = [
    { value: 'requests', label: 'Blood Requests', count: requests.length, icon: <WaterDropIcon /> },
    { value: 'appointments', label: 'Appointments', count: appointments.length, icon: <EventAvailableIcon /> },
    { value: 'history', label: 'Donation History', count: donations.length, icon: <BarChartIcon /> },
  ];

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: { xs: 2, md: 2.5 }, pb: 4, minWidth: 0 }}>
      <input ref={fileInputRef} type="file" accept="image/*" hidden onChange={handlePhotoChange} />

      <ProfileHero user={user} photoSrc={photoSrc} initials={initialsOf(user?.fullName)} donor={donorStatus}
        photoLoading={photoLoading} onPhotoClick={handlePhotoClick} onEdit={openEdit} />

      {/* Availability + summary — every number comes from the API responses above */}
      <Box sx={{ display: 'grid', gap: { xs: 1.5, md: 2 }, gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', lg: '1.25fr repeat(3, 1fr)' } }}>
        <AvailabilityCard donor={donorStatus} saving={availSaving} error={availError}
          onToggle={handleToggleAvailability} onRetry={() => setDonorAttempt((n) => n + 1)} />
        <StatCard icon={<DescriptionOutlinedIcon />} label="Total Blood Requests" loading={reqStatus === 'loading'}
          value={reqStatus === 'error' ? '—' : requests.length}
          sub={reqStatus === 'ready' ? `${reqCount('Pending')} pending • ${reqCount('Approved')} approved` : reqStatus === 'error' ? 'Couldn’t load' : undefined}
          onClick={() => openTab('requests')} />
        <StatCard icon={<CalendarMonthOutlinedIcon />} label="Upcoming Appointments" loading={apptStatus === 'loading'}
          value={apptStatus === 'error' ? '—' : upcoming.length}
          sub={apptStatus === 'ready' ? (upcoming[0] ? `Next: ${formatDate(upcoming[0].date, { day: 'numeric', month: 'short', year: 'numeric' })}` : 'None booked') : apptStatus === 'error' ? 'Couldn’t load' : undefined}
          onClick={() => openTab('appointments')} />
        <StatCard icon={<FavoriteBorderIcon />} label="Total Donations" loading={apptStatus === 'loading'}
          value={apptStatus === 'error' ? '—' : donations.length}
          sub={lastDonation ? `Last donation: ${formatDistanceToNow(new Date(lastDonation), { addSuffix: true })}` : 'No donations recorded yet'}
          onClick={() => openTab('history')} />
      </Box>

      {/* Tabs */}
      <Paper ref={tabsRef} elevation={0} sx={{ ...cardSx, overflow: 'hidden', scrollMarginTop: 90 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, px: { xs: 0, sm: 2.5 }, borderBottom: '1px solid', borderColor: 'divider' }}>
          <Tabs value={tab} onChange={changeTab} aria-label="Your activity" variant="scrollable" scrollButtons={false} sx={{
            flex: 1, minWidth: 0, minHeight: 0,
            '& .MuiTab-root': {
              minHeight: { xs: 56, sm: 68 }, fontWeight: 700, fontSize: { xs: '0.86rem', sm: '1rem' }, color: 'text.secondary',
              px: { xs: 1.5, sm: 2 }, mr: { sm: 1.5 },
            },
            '& .MuiTab-root.Mui-selected': { color: 'primary.main' },
            '& .MuiTab-icon': { fontSize: 22, mr: '10px !important' },
            '& .MuiTabs-indicator': { height: 3, borderRadius: '3px 3px 0 0' },
          }}>
            {tabDefs.map((t) => (
              <Tab key={t.value} value={t.value} icon={t.icon} iconPosition="start" id={`tab-${t.value}`} aria-controls={`panel-${t.value}`}
                label={<span>{t.label} ({t.count})</span>} />
            ))}
          </Tabs>
          <Button component={Link} href={newHref} variant="contained" startIcon={<AddIcon />}
            sx={{ display: { xs: 'none', md: 'inline-flex' }, flexShrink: 0, height: 42, borderRadius: '10px', fontWeight: 700 }}>
            {newLabel}
          </Button>
        </Box>

        <Box role="tabpanel" id={`panel-${tab}`} aria-labelledby={`tab-${tab}`} sx={{ p: { xs: 1.75, sm: 3 } }}>
          {/* Filters + search */}
          <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap', alignItems: 'center', mb: 2.5 }}>
            {isHistory ? (
              <Typography variant="body2" color="text.secondary" sx={{ flex: '1 1 260px' }}>
                Donations checked in by staff at a BloodLife donation center.
              </Typography>
            ) : (
              <Box role="radiogroup" aria-label="Filter by status" sx={{ display: 'flex', gap: 1, overflowX: 'auto', flex: '1 1 auto', pb: 0.25, minWidth: 0 }}>
                {filters.map((s) => {
                  const selected = activeFilter === s;
                  const count = isReq ? reqCount(s) : apptCount(s);
                  return (
                    <Chip key={s} role="radio" aria-checked={selected} clickable onClick={() => setActiveFilter(s)}
                      label={`${s === 'All' ? 'All' : statusMeta[s].label}${listStatus === 'ready' ? ` (${count})` : ''}`}
                      color={selected ? 'primary' : 'default'} variant={selected ? 'filled' : 'outlined'}
                      sx={{
                        flexShrink: 0, height: 40, px: 0.75, borderRadius: '999px', fontWeight: 600, fontSize: '0.9rem',
                        ...(!selected && { bgcolor: 'background.paper', borderColor: 'divider', color: 'text.primary', borderWidth: 1.5 }),
                        ...(selected && { boxShadow: (t) => `0 4px 10px ${alpha(t.palette.primary.main, 0.25)}` }),
                      }} />
                  );
                })}
              </Box>
            )}
            <Box role="search" sx={{
              flex: { xs: '1 1 100%', md: '0 0 300px' }, ml: { md: 'auto' }, display: 'flex', alignItems: 'center', gap: 1, px: 1.5, height: 44,
              borderRadius: '12px', border: '1px solid', borderColor: 'divider', bgcolor: 'background.paper',
              '&:focus-within': { borderColor: 'primary.main', boxShadow: (t) => `0 0 0 3px ${alpha(t.palette.primary.main, 0.14)}` },
            }}>
              <SearchIcon aria-hidden="true" sx={{ fontSize: 21, color: 'text.secondary' }} />
              <InputBase value={query} onChange={(e) => setQuery(e.target.value)} fullWidth sx={{ fontSize: '0.9rem' }}
                placeholder={isReq ? 'Search patient or hospital...' : isHistory ? 'Search donations...' : 'Search center or date...'}
                inputProps={{ 'aria-label': `Search ${noun}s`, type: 'search' }} />
              {query && (
                <IconButton size="small" aria-label="Clear search" onClick={() => setQuery('')}><CloseIcon fontSize="small" /></IconButton>
              )}
            </Box>
          </Box>

          {listStatus === 'ready' && total > 0 && (query || (!isHistory && activeFilter !== 'All')) && (
            <Typography variant="caption" color="text.secondary" aria-live="polite" sx={{ display: 'block', mb: 1.25 }}>
              Showing {shown} of {total} {noun}{total !== 1 ? 's' : ''}
            </Typography>
          )}

          {listStatus === 'loading' ? <ListSkeleton rows={isReq ? 2 : 2} />
            : listStatus === 'error' ? <LoadError what={isReq ? 'blood requests' : isHistory ? 'donation history' : 'appointments'} onRetry={() => (isReq ? loadRequests() : loadAppointments())} />
            : total === 0 ? (
              <EmptyPanel
                icon={isReq ? <BloodtypeOutlinedIcon /> : isHistory ? <WaterDropIcon /> : <EventAvailableOutlinedIcon />}
                title={isReq ? 'No blood requests yet' : isHistory ? 'No donations recorded yet' : 'No appointments yet'}
                text={isReq ? 'Requests you submit for a patient will appear here, with their status.'
                  : isHistory ? 'When staff check you in at a donation center, the donation appears here.'
                  : 'Book a donation slot at a center near you. It will appear here once booked.'}
                action={<Button component={Link} href={newHref} variant="contained" startIcon={<AddIcon />}>
                  {isReq ? 'Submit a Request' : 'Book an Appointment'}
                </Button>} />
            ) : shown === 0 ? (
              <EmptyPanel icon={<SearchOffIcon />} title="Nothing matches"
                text={isHistory ? 'Try another search term.' : 'Try another status or search term.'}
                action={<Button variant="outlined" onClick={() => { if (!isHistory) setActiveFilter('All'); setQuery(''); }}>Clear filters</Button>} />
            ) : (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                {isReq
                  ? filteredRequests.map((req) => (
                    <RequestCard key={req._id} req={req} hospitalPhone={hospitalPhones[req.hospital]}
                      onCancel={openCancel} onView={setDetailTarget}
                      cancelling={cancelling && cancelTarget?._id === req._id} />
                  ))
                  : isHistory
                    ? filteredDonations.map((a) => <DonationCard key={a._id} appt={a}
                      hospitalImage={hospitalImages[a.hospital] || hospitalImages[a.location]} />)
                    : filteredAppointments.map((a) => <AppointmentCard key={a._id} appt={a} hospitalPhone={hospitalPhones[a.hospital]}
                      hospitalImage={hospitalImages[a.hospital] || hospitalImages[a.location]} />)}
              </Box>
            )}

          {/* On small screens the tab bar has no room for this button */}
          <Button component={Link} href={newHref} variant="contained" startIcon={<AddIcon />} fullWidth
            sx={{ display: { xs: 'flex', md: 'none' }, mt: 2.5, borderRadius: '12px', height: 46 }}>
            {newLabel}
          </Button>
        </Box>
      </Paper>

      {detailTarget && (
        <RequestDetailsDialog request={detailTarget} token={token} hospitalPhone={hospitalPhones[detailTarget.hospital]}
          onClose={() => setDetailTarget(null)} onCancel={openCancel} onSessionExpired={sessionExpired}
          // The dialog re-reads the request; keep the card behind it in step with the server.
          onFresh={(data) => setRequests((list) => list.map((r) => (r._id === data._id ? data : r)))} />
      )}

      {/* Edit Profile */}
      <Dialog open={editOpen} onClose={() => !saving && setEditOpen(false)} maxWidth="xs" fullWidth aria-labelledby="edit-profile-title"
        slotProps={{ paper: { component: 'form', onSubmit: handleSaveProfile, sx: { borderRadius: (t) => `${t.custom.radius.dialog}px` } } }}>
        <DialogTitle id="edit-profile-title" sx={{ fontWeight: 800, fontSize: '1.05rem', pb: 1 }}>Edit Profile</DialogTitle>
        <DialogContent sx={{ pb: 1 }}>
          <TextField label="Full Name" value={editName} onChange={(e) => setEditName(e.target.value)} fullWidth size="small"
            required autoFocus autoComplete="name" sx={{ mt: 1, mb: 2 }}
            error={!!saveError && !editName.trim()} />
          <TextField label="Phone Number" value={editPhone} onChange={(e) => setEditPhone(e.target.value)} fullWidth size="small"
            type="tel" autoComplete="tel" placeholder="012 345 678" />
          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1.5 }}>
            Your email ({user?.email}) is your login and can&apos;t be changed here.
          </Typography>
          {saveError && <Alert severity="error" sx={{ mt: 1.5, borderRadius: '10px' }}>{saveError}</Alert>}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5, gap: 1 }}>
          <Button onClick={() => setEditOpen(false)} color="inherit" disabled={saving}>Cancel</Button>
          <Button type="submit" variant="contained" disabled={saving} sx={{ minWidth: 96 }}
            startIcon={saving ? <CircularProgress size={15} color="inherit" /> : null}>
            {saving ? 'Saving…' : 'Save'}
          </Button>
        </DialogActions>
      </Dialog>

      <CancelRequestDialog request={cancelTarget} token={token} onClose={() => setCancelTarget(null)}
        onCancelled={onCancelled} onChanged={onCancelConflict} onSessionExpired={sessionExpired} onBusyChange={setCancelling} />

      <Snackbar open={Boolean(toast)} autoHideDuration={5000} onClose={() => setToast(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}>
        {toast ? (
          <Alert onClose={() => setToast(null)} severity={toast.severity} variant="filled" sx={{ borderRadius: '10px', fontWeight: 600 }}>
            {toast.message}
          </Alert>
        ) : undefined}
      </Snackbar>
    </Box>
  );
}
