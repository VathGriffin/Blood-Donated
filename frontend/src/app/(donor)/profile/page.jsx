'use client';
import { useCallback, useDeferredValue, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
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
import { useI18n, useT } from '@/i18n/I18nProvider';
import { apiErrorMessage } from '@/lib/api-error';
import axios from 'axios';
import API_BASE, { uploadUrl } from '@/lib/config';
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
import HistoryEventCard from './_components/HistoryEventCard';
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
  const t = useT();
  return (
    <Alert severity="error" variant="outlined" icon={<ErrorOutlineIcon />} sx={{ borderRadius: '12px', alignItems: 'center' }}
      action={<Button color="error" size="small" onClick={onRetry}>{t('donor.profile.retry')}</Button>}>
      {t(`donor.profile.loadError.${what}`)}
    </Alert>
  );
}

export default function ProfilePage() {
  const router = useRouter();
  const { isAuth, user, token, updateUser, logout } = useUserAuth();
  const { t, formatRelative } = useI18n();

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

  // ?tab=history opens that tab, also when already on this page (the account menu's Donation
  // History link). ?edit=1 (its Settings link) opens Edit Profile, then drops the parameter.
  const searchParams = useSearchParams();
  const tabParam = searchParams.get('tab');
  const editParam = searchParams.get('edit');
  useEffect(() => {
    if (TABS.includes(tabParam)) setTab(tabParam);
  }, [tabParam]);
  useEffect(() => {
    if (editParam !== '1' || !user) return;
    setEditName(user.fullName || '');
    setEditPhone(user.phone || '');
    setSaveError('');
    setEditOpen(true);
    try {
      const url = new URL(window.location.href);
      url.searchParams.delete('edit');
      window.history.replaceState(window.history.state, '', url);
    } catch { /* cosmetic */ }
  }, [editParam, user]);

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
    setToast({ severity: 'success', message: t('donor.profile.cancelled') });
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
  // Full history, newest first: check-ins, plus what the donor record holds — the day they
  // registered as a donor, donations staff recorded directly, and the last donation date they
  // entered when registering. Check-ins are also copied onto the donor record, so record
  // entries within a minute of a check-in are the same donation and are skipped.
  const history = useMemo(() => {
    const items = donations.map((a) => ({ kind: 'checkin', key: a._id, date: a.checkedInAt || a.date, appt: a }));
    const donor = donorStatus?.found ? donorStatus : null;
    if (donor) {
      const time = (d) => new Date(d).getTime();
      const checkins = donations.filter((a) => a.checkedInAt).map((a) => time(a.checkedInAt));
      const isCheckin = (t) => checkins.some((c) => Math.abs(c - t) < 60_000);
      const recorded = (donor.donationHistory || []).filter((h) => h.date && !isCheckin(time(h.date)));
      recorded.forEach((h, i) => items.push({ kind: 'recorded', key: `rec-${h._id || i}`, date: h.date, entry: h }));
      // The date entered when registering (older records only have lastDonation, which a
      // check-in overwrites). Shown unless that day is already listed.
      const reported = donor.reportedLastDonation || donor.lastDonation;
      const listed = items.map((it) => new Date(it.date).toDateString());
      if (reported && !isCheckin(time(reported)) && !listed.includes(new Date(reported).toDateString())) {
        items.push({ kind: 'reported', key: 'reported', date: reported });
      }
      if (donor.createdAt) items.push({ kind: 'registered', key: 'registered', date: donor.createdAt, donor });
    }
    return items.sort((a, b) => new Date(b.date) - new Date(a.date));
  }, [donations, donorStatus]);
  const donationCount = history.filter((it) => it.kind !== 'registered').length;
  const filteredHistory = useMemo(() => {
    const q = historyQ.trim().toLowerCase();
    if (!q) return history;
    const label = { checkin: t('donor.profile.searchLabels.donated'), recorded: t('donor.profile.searchLabels.donated'), reported: t('donor.profile.searchLabels.reported'), registered: t('donor.profile.searchLabels.registered') };
    return history.filter((it) => [
      label[it.kind], formatDate(it.date), it.appt?.location, it.appt?.bloodType, it.entry?.location, it.entry?.notes,
      it.donor?.bloodType, it.donor?.location,
    ].some((v) => v?.toLowerCase().includes(q)));
  }, [history, historyQ, t]);

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
        <Typography variant="h5" fontWeight={700}>{t('donor.profile.signInTitle')}</Typography>
        <Typography color="text.secondary" fontSize="0.9rem">
          {t('donor.profile.signInText')}
        </Typography>
        <Box display="flex" gap={2} mt={1}>
          <Button variant="contained" component={Link} href="/login">{t('donor.profile.logIn')}</Button>
          <Button variant="outlined" component={Link} href="/register">{t('donor.profile.signUp')}</Button>
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
      setToast({ severity: 'error', message: t('donor.profile.chooseImage') });
      e.target.value = '';
      return;
    }
    if (file.size > MAX_PHOTO_SIZE) {
      setToast({ severity: 'error', message: t('donor.profile.imageSize') });
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
      setToast({ severity: 'success', message: t('donor.profile.photoUpdated') });
    } catch (err) {
      if (!sessionExpired(err)) setToast({ severity: 'error', message: apiErrorMessage(err, t('donor.profile.photoFailed')) });
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
    if (!editName.trim()) { setSaveError(t('donor.profile.nameEmpty')); return; }
    setSaving(true);
    setSaveError('');
    try {
      const res = await axios.put(`${API_BASE}/api/user/profile`, { fullName: editName.trim(), phone: editPhone.trim() }, authHeader());
      updateUser({ fullName: res.data.fullName, phone: res.data.phone });
      setEditOpen(false);
      setToast({ severity: 'success', message: t('donor.profile.updated') });
    } catch (err) {
      if (!sessionExpired(err)) setSaveError(apiErrorMessage(err, t('donor.profile.saveFailed')));
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
      setToast({ severity: 'success', message: data.available ? t('donor.profile.nowAvailable') : t('donor.profile.nowUnavailable') });
    } catch (err) {
      if (!sessionExpired(err)) setAvailError(apiErrorMessage(err, t('donor.profile.availFailed')));
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

  const photoSrc = uploadUrl(user?.photo);
  const isReq = tab === 'requests';
  const isHistory = tab === 'history';
  const filters = isReq ? REQUEST_FILTERS : APPT_FILTERS;
  const statusMeta = isReq ? REQUEST_STATUS : APPT_STATUS;
  const activeFilter = isReq ? reqFilter : apptFilter;
  const setActiveFilter = isReq ? setReqFilter : setApptFilter;
  const query = isReq ? reqQuery : isHistory ? historyQuery : apptQuery;
  const setQuery = isReq ? setReqQuery : isHistory ? setHistoryQuery : setApptQuery;
  // History also needs the donor record, so it keeps loading until that lookup has answered.
  const listStatus = isReq ? reqStatus : isHistory && apptStatus === 'ready' && donorStatus === null ? 'loading' : apptStatus;
  const total = isReq ? requests.length : isHistory ? history.length : appointments.length;
  const shown = isReq ? filteredRequests.length : isHistory ? filteredHistory.length : filteredAppointments.length;
  const listKey = isReq ? 'requests' : isHistory ? 'history' : 'appointments';
  const newHref = isReq ? '/requests' : '/appointments';
  const newLabel = isReq ? t('donor.profile.newRequest') : t('donor.profile.bookAppointment');

  // The donor record's lastDonation is updated on check-in; fall back to the newest check-in.
  const lastDonation = donorStatus?.lastDonation || donations[0]?.checkedInAt || null;
  const registered = !!donorStatus?.found;

  const tabDefs = [
    { value: 'requests', label: t('donor.profile.tabs.requests'), count: requests.length, icon: <WaterDropIcon /> },
    { value: 'appointments', label: t('donor.profile.tabs.appointments'), count: appointments.length, icon: <EventAvailableIcon /> },
    { value: 'history', label: t('donor.profile.tabs.history'), count: history.length, icon: <BarChartIcon /> },
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
        <StatCard icon={<DescriptionOutlinedIcon />} label={t('donor.profile.stats.requests')} loading={reqStatus === 'loading'}
          value={reqStatus === 'error' ? '—' : requests.length}
          sub={reqStatus === 'ready' ? t('donor.profile.stats.requestsSub', { pending: reqCount('Pending'), approved: reqCount('Approved') }) : reqStatus === 'error' ? t('donor.profile.stats.loadFailed') : undefined}
          onClick={() => openTab('requests')} />
        <StatCard icon={<CalendarMonthOutlinedIcon />} label={t('donor.profile.stats.upcoming')} loading={apptStatus === 'loading'}
          value={apptStatus === 'error' ? '—' : upcoming.length}
          sub={apptStatus === 'ready' ? (upcoming[0] ? t('donor.profile.stats.next', { date: formatDate(upcoming[0].date, { day: 'numeric', month: 'short', year: 'numeric' }) }) : t('donor.profile.stats.noneBooked')) : apptStatus === 'error' ? t('donor.profile.stats.loadFailed') : undefined}
          onClick={() => openTab('appointments')} />
        <StatCard icon={<FavoriteBorderIcon />} label={t('donor.profile.stats.donations')} loading={apptStatus === 'loading'}
          value={apptStatus === 'error' ? '—' : donationCount}
          sub={lastDonation ? t('donor.profile.stats.lastDonation', { when: formatRelative(lastDonation) }) : t('donor.profile.stats.noDonations')}
          onClick={() => openTab('history')} />
      </Box>

      {/* Tabs */}
      <Paper ref={tabsRef} elevation={0} sx={{ ...cardSx, overflow: 'hidden', scrollMarginTop: 90 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, px: { xs: 0, sm: 2.5 }, borderBottom: '1px solid', borderColor: 'divider' }}>
          <Tabs value={tab} onChange={changeTab} aria-label={t('donor.profile.activity')} variant="scrollable" scrollButtons={false} sx={{
            flex: 1, minWidth: 0, minHeight: 0,
            '& .MuiTab-root': {
              minHeight: { xs: 56, sm: 68 }, fontWeight: 700, fontSize: { xs: '0.86rem', sm: '1rem' }, color: 'text.secondary',
              px: { xs: 1.5, sm: 2 }, mr: { sm: 1.5 },
            },
            '& .MuiTab-root.Mui-selected': { color: 'primary.main' },
            '& .MuiTab-icon': { fontSize: 22, mr: '10px !important' },
            '& .MuiTabs-indicator': { height: 3, borderRadius: '3px 3px 0 0' },
          }}>
            {tabDefs.map((d) => (
              <Tab key={d.value} value={d.value} icon={d.icon} iconPosition="start" id={`tab-${d.value}`} aria-controls={`panel-${d.value}`}
                label={<span>{d.label} ({d.count})</span>} />
            ))}
          </Tabs>
          <Button component={Link} href={newHref} variant="contained" startIcon={<AddIcon />}
            sx={{
              display: { xs: 'none', md: 'inline-flex' }, flexShrink: 0, height: 42, borderRadius: '10px', fontWeight: 700,
              background: (t) => `linear-gradient(135deg, ${t.palette.primary.light} 0%, ${t.palette.primary.main} 100%)`,
              boxShadow: (t) => `0 6px 16px ${alpha(t.palette.primary.main, 0.3)}`,
            }}>
            {newLabel}
          </Button>
        </Box>

        <Box role="tabpanel" id={`panel-${tab}`} aria-labelledby={`tab-${tab}`} sx={{ p: { xs: 1.75, sm: 3 } }}>
          {/* Filters + search */}
          <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap', alignItems: 'center', mb: 2.5 }}>
            {isHistory ? (
              <Typography variant="body2" color="text.secondary" sx={{ flex: '1 1 260px' }}>
                {t('donor.profile.historyLead')}
              </Typography>
            ) : (
              <Box role="radiogroup" aria-label={t('donor.profile.filterStatus')} sx={{ display: 'flex', gap: 1, overflowX: 'auto', flex: '1 1 auto', pb: 0.25, minWidth: 0 }}>
                {filters.map((s) => {
                  const selected = activeFilter === s;
                  const count = isReq ? reqCount(s) : apptCount(s);
                  return (
                    <Chip key={s} role="radio" aria-checked={selected} clickable onClick={() => setActiveFilter(s)}
                      label={`${s === 'All' ? t('status.All') : statusMeta[s].label}${listStatus === 'ready' ? ` (${count})` : ''}`}
                      variant="outlined"
                      sx={{
                        flexShrink: 0, height: 38, px: 0.75, borderRadius: '999px', fontWeight: 600, fontSize: '0.86rem', borderWidth: 1.5,
                        transition: 'background-color .15s ease, border-color .15s ease',
                        ...(selected
                          ? { bgcolor: (t) => t.custom.tones.primary.bg, borderColor: (t) => alpha(t.palette.primary.main, 0.35), color: 'primary.main', fontWeight: 700,
                            '&:hover': { bgcolor: (t) => `${t.custom.tones.primary.bg} !important` } }
                          : { bgcolor: 'background.paper', borderColor: 'divider', color: 'text.primary' }),
                        '&.Mui-focusVisible': { outline: '2px solid', outlineColor: 'primary.main', outlineOffset: 2 },
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
                placeholder={t(`donor.profile.search.${listKey}`)}
                inputProps={{ 'aria-label': t(`donor.profile.search.${listKey}Aria`), type: 'search' }} />
              {query && (
                <IconButton size="small" aria-label={t('donor.profile.search.clear')} onClick={() => setQuery('')}><CloseIcon fontSize="small" /></IconButton>
              )}
            </Box>
          </Box>

          {listStatus === 'ready' && total > 0 && (query || (!isHistory && activeFilter !== 'All')) && (
            <Typography variant="caption" color="text.secondary" aria-live="polite" sx={{ display: 'block', mb: 1.25 }}>
              {t(`donor.profile.showing.${listKey}`, { shown, total })}
            </Typography>
          )}

          {listStatus === 'loading' ? <ListSkeleton rows={isReq ? 2 : 2} />
            : listStatus === 'error' ? <LoadError what={listKey} onRetry={() => (isReq ? loadRequests() : loadAppointments())} />
            : total === 0 ? (
              <EmptyPanel
                icon={isReq ? <BloodtypeOutlinedIcon /> : isHistory ? <WaterDropIcon /> : <EventAvailableOutlinedIcon />}
                title={t(`donor.profile.empty.${listKey}Title`)}
                text={isReq ? t('donor.profile.empty.requestsText')
                  : isHistory ? (registered
                    ? t('donor.profile.empty.historyRegistered')
                    : t('donor.profile.empty.historyText'))
                  : t('donor.profile.empty.appointmentsText')}
                action={isHistory && !registered
                  ? <Button component={Link} href="/donate" variant="contained" startIcon={<AddIcon />}>{t('donor.profile.empty.registerDonor')}</Button>
                  : <Button component={Link} href={newHref} variant="contained" startIcon={<AddIcon />}>
                    {isReq ? t('donor.profile.empty.submitRequest') : t('donor.profile.empty.bookAppointment')}
                  </Button>} />
            ) : shown === 0 ? (
              <EmptyPanel icon={<SearchOffIcon />} title={t('donor.profile.empty.noMatch')}
                text={isHistory ? t('donor.profile.empty.tryAnother') : t('donor.profile.empty.tryStatus')}
                action={<Button variant="outlined" onClick={() => { if (!isHistory) setActiveFilter('All'); setQuery(''); }}>{t('donor.profile.empty.clearFilters')}</Button>} />
            ) : (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                {isReq
                  ? filteredRequests.map((req) => (
                    <RequestCard key={req._id} req={req} hospitalPhone={hospitalPhones[req.hospital]}
                      onCancel={openCancel} onView={setDetailTarget}
                      cancelling={cancelling && cancelTarget?._id === req._id} />
                  ))
                  : isHistory
                    ? filteredHistory.map((it) => (it.kind === 'checkin'
                      ? <DonationCard key={it.key} appt={it.appt} hospitalImage={hospitalImages[it.appt.hospital] || hospitalImages[it.appt.location]} />
                      : <HistoryEventCard key={it.key} item={it} />))
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
        <DialogTitle id="edit-profile-title" sx={{ fontWeight: 800, fontSize: '1.05rem', pb: 1 }}>{t('donor.profile.edit.title')}</DialogTitle>
        <DialogContent sx={{ pb: 1 }}>
          <TextField label={t('donor.profile.edit.fullName')} value={editName} onChange={(e) => setEditName(e.target.value)} fullWidth size="small"
            required autoFocus autoComplete="name" sx={{ mt: 1, mb: 2 }}
            error={!!saveError && !editName.trim()} />
          <TextField label={t('donor.profile.edit.phone')} value={editPhone} onChange={(e) => setEditPhone(e.target.value)} fullWidth size="small"
            type="tel" autoComplete="tel" placeholder="012 345 678" />
          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1.5 }}>
            {t('donor.profile.edit.emailNote', { email: user?.email })}
          </Typography>
          {saveError && <Alert severity="error" sx={{ mt: 1.5, borderRadius: '10px' }}>{saveError}</Alert>}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5, gap: 1 }}>
          <Button onClick={() => setEditOpen(false)} color="inherit" disabled={saving}>{t('donor.profile.edit.cancel')}</Button>
          <Button type="submit" variant="contained" disabled={saving} sx={{ minWidth: 96 }}
            startIcon={saving ? <CircularProgress size={15} color="inherit" /> : null}>
            {saving ? t('donor.profile.edit.saving') : t('donor.profile.edit.save')}
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
