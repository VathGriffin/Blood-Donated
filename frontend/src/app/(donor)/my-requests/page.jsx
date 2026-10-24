'use client';
import { useCallback, useDeferredValue, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import {
  Alert, Box, Button, FormControl, IconButton, InputBase, InputLabel, MenuItem, Paper, Select, Skeleton, Snackbar, Tab, Tabs,
} from '@mui/material';
import { alpha } from '@mui/material/styles';
import DescriptionOutlinedIcon from '@mui/icons-material/DescriptionOutlined';
import DescriptionIcon from '@mui/icons-material/Description';
import WaterDropIcon from '@mui/icons-material/WaterDrop';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import Inventory2OutlinedIcon from '@mui/icons-material/Inventory2Outlined';
import HighlightOffIcon from '@mui/icons-material/HighlightOff';
import DoNotDisturbOnOutlinedIcon from '@mui/icons-material/DoNotDisturbOnOutlined';
import BarChartIcon from '@mui/icons-material/BarChart';
import SearchIcon from '@mui/icons-material/Search';
import CloseIcon from '@mui/icons-material/Close';
import SearchOffIcon from '@mui/icons-material/SearchOff';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import FilterAltOffOutlinedIcon from '@mui/icons-material/FilterAltOffOutlined';
import CalendarMonthOutlinedIcon from '@mui/icons-material/CalendarMonthOutlined';
import AddIcon from '@mui/icons-material/Add';
import API_BASE from '@/lib/config';
import { useUserAuth } from '@/store/UserAuthContext';
import { getHospitals } from '@/lib/public-directory';
import { EmptyPanel, StatCard, cardSx } from '@/components/donor/ui';
import DonorPageHero from '@/components/donor/PageHero';
import CancelRequestDialog from '@/components/donor/CancelRequestDialog';
import RequestDetailsDialog from '@/components/donor/RequestDetailsDialog';
import RequestRow from './_components/RequestRow';
import { BLOOD_TYPES, RANGES, STATUS_TABS, URGENCIES, hospitalFor, sortRequests, statusOf } from './_components/requests';

const TAB_ICON = {
  All: <WaterDropIcon />, Pending: <DescriptionOutlinedIcon />, Approved: <CheckCircleOutlineIcon />,
  Fulfilled: <BarChartIcon />, Rejected: <HighlightOffIcon />, Cancelled: <DoNotDisturbOnOutlinedIcon />,
};

// Keep ?status= in the address bar so a refresh or shared link opens the same tab.
const setStatusParam = (value) => {
  try {
    const url = new URL(window.location.href);
    if (value === 'All') url.searchParams.delete('status'); else url.searchParams.set('status', value);
    window.history.replaceState(window.history.state, '', url);
  } catch { /* cosmetic */ }
};

function RowSkeleton() {
  return (
    <Box aria-hidden="true" sx={{ p: 2.25, borderRadius: '16px', border: '1px solid', borderColor: 'divider', display: 'flex', gap: 2.5 }}>
      <Skeleton variant="rounded" width={72} height={88} sx={{ borderRadius: '12px' }} />
      <Box sx={{ flex: 1 }}>
        <Skeleton width="30%" height={28} />
        <Skeleton width="50%" />
        <Skeleton width="45%" />
        <Skeleton width="80%" />
      </Box>
      <Skeleton variant="rounded" width={150} height={44} sx={{ display: { xs: 'none', md: 'block' }, borderRadius: '12px', alignSelf: 'flex-end' }} />
    </Box>
  );
}

const selectSx = { height: 44, borderRadius: '10px', bgcolor: 'background.paper' };

/**
 * The signed-in donor's own blood requests (GET /api/requests — the API returns only the requests
 * filed under the caller's account). New requests use the existing /requests form.
 */
export default function MyRequestsPage() {
  const router = useRouter();
  const { isAuth, user, token, logout } = useUserAuth();

  const [requests, setRequests] = useState([]);
  const [status, setStatus] = useState('loading'); // 'loading' | 'ready' | 'error'
  const [directory, setDirectory] = useState({ byId: {}, byName: {} });
  const [tab, setTab] = useState('All');
  const [query, setQuery] = useState('');
  const [bloodType, setBloodType] = useState('All');
  const [urgency, setUrgency] = useState('All');
  const [range, setRange] = useState('all');
  const [detail, setDetail] = useState(null);
  const [cancelTarget, setCancelTarget] = useState(null);
  const [cancelling, setCancelling] = useState(false);
  const [toast, setToast] = useState(null);

  const logoutRef = useRef(logout);
  logoutRef.current = logout;
  const sessionExpired = useCallback((err) => {
    if (err?.response?.status !== 401) return false;
    logoutRef.current();
    router.push('/login');
    return true;
  }, [router]);

  useEffect(() => {
    const s = new URLSearchParams(window.location.search).get('status');
    if (STATUS_TABS.includes(s)) setTab(s);
  }, []);

  // Numbered runs so a slow older response never overwrites a newer one; `quiet` keeps the list.
  const run = useRef(0);
  const load = useCallback((quiet = false) => {
    if (!isAuth || !user?.email) return;
    const id = ++run.current;
    if (!quiet) setStatus('loading');
    axios.get(`${API_BASE}/api/requests?email=${encodeURIComponent(user.email)}`, { headers: { Authorization: `Bearer ${token}` } })
      .then((res) => {
        if (id !== run.current) return;
        setRequests(Array.isArray(res.data) ? res.data : []);
        setStatus('ready');
      })
      .catch((err) => {
        if (id !== run.current || sessionExpired(err)) return;
        if (!quiet) setStatus('error');
      });
  }, [isAuth, user?.email, token, sessionExpired]);

  useEffect(() => { load(); }, [load]);

  // Hospitals approve / fulfil requests from their side: refresh quietly on return (≤ once a minute).
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

  // Public hospital directory (shared cache): city and phone for each request's hospital.
  useEffect(() => {
    let alive = true;
    getHospitals()
      .then((list) => {
        if (!alive) return;
        const byId = {};
        const byName = {};
        for (const h of list) {
          byId[h._id] = h;
          if (h.name) byName[h.name.trim().toLowerCase()] = h;
        }
        setDirectory({ byId, byName });
      })
      .catch(() => { /* cards show the stored hospital name only */ });
    return () => { alive = false; };
  }, []);

  // ── Filtering: search + blood type + urgency + date range, then the status tab on top ──
  const q = useDeferredValue(query).trim().toLowerCase();
  const filteredNoStatus = useMemo(() => {
    const inRange = (RANGES.find((r) => r.value === range) || RANGES[0]).test;
    return requests.filter((r) =>
      (bloodType === 'All' || r.bloodType === bloodType) &&
      (urgency === 'All' || r.urgency === urgency) &&
      (range === 'all' || (r.createdAt && inRange(new Date(r.createdAt).getTime()))) &&
      (!q || [r.patientName, r.hospitalName, r.bloodType, r.reason].some((v) => v?.toLowerCase().includes(q))));
  }, [requests, bloodType, urgency, range, q]);

  const countBy = (list) => list.reduce((acc, r) => { acc[statusOf(r)] = (acc[statusOf(r)] || 0) + 1; return acc; }, { All: list.length });
  const overall = useMemo(() => countBy(requests), [requests]);
  const tabCounts = useMemo(() => countBy(filteredNoStatus), [filteredNoStatus]);
  const shown = useMemo(
    () => sortRequests(tab === 'All' ? filteredNoStatus : filteredNoStatus.filter((r) => statusOf(r) === tab)),
    [filteredNoStatus, tab]
  );

  const filtersActive = q || bloodType !== 'All' || urgency !== 'All' || range !== 'all' || tab !== 'All';
  const changeTab = (value) => { setTab(value); setStatusParam(value); };
  const clearFilters = () => { setQuery(''); setBloodType('All'); setUrgency('All'); setRange('all'); changeTab('All'); };
  const ready = status === 'ready';
  const n = (key) => (status === 'error' ? '—' : overall[key] || 0);

  // ── Cancelling (confirmation + PATCH in CancelRequestDialog) ──
  const onCancelled = (data) => {
    setRequests((list) => list.map((r) => (r._id === data._id ? data : r)));
    setCancelTarget(null);
    setToast({ severity: 'success', message: 'Your blood request has been cancelled.' });
    load(true);
  };
  const onCancelConflict = (message) => {
    setCancelTarget(null);
    setToast({ severity: 'warning', message });
    load(true);
  };

  const stats = [
    { key: 'All', label: 'Total Requests', sub: 'All blood requests', icon: <DescriptionOutlinedIcon />, tone: 'primary' },
    { key: 'Pending', label: 'Pending Requests', sub: 'Awaiting approval', icon: <AccessTimeIcon />, tone: 'warning' },
    { key: 'Approved', label: 'Approved Requests', sub: 'Being arranged', icon: <CheckCircleOutlineIcon />, tone: 'success' },
    { key: 'Fulfilled', label: 'Fulfilled Requests', sub: 'Blood delivered', icon: <Inventory2OutlinedIcon />, tone: 'info' },
    { key: 'Rejected', label: 'Rejected Requests', sub: 'Not approved', icon: <HighlightOffIcon />, tone: 'error' },
    { key: 'Cancelled', label: 'Cancelled Requests', sub: 'Withdrawn by you', icon: <DoNotDisturbOnOutlinedIcon />, tone: 'neutral' },
  ];

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: { xs: 2, md: 2.5 }, pb: 4, minWidth: 0 }}>
      <DonorPageHero id="requests-title" icon={<DescriptionIcon />} title="Blood Requests"
        subtitle="View and track the blood requests you have submitted, and follow each one until it is fulfilled."
        actionHref="/requests" actionLabel="New Request" />

      {/* Summary — counts over all of the donor's requests */}
      <Box sx={{ display: 'grid', gap: { xs: 1.25, md: 1.5 }, gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', md: 'repeat(3, 1fr)', xl: 'repeat(6, 1fr)' } }}>
        {stats.map((s) => (
          <StatCard key={s.key} icon={s.icon} tone={s.tone} label={s.label} sub={ready ? s.sub : undefined}
            value={n(s.key)} loading={status === 'loading'} selected={tab === s.key && s.key !== 'All'}
            onClick={() => changeTab(s.key)} compact />
        ))}
      </Box>

      <Paper elevation={0} sx={{ ...cardSx, overflow: 'hidden' }}>
        <Tabs value={tab} onChange={(_, v) => changeTab(v)} aria-label="Filter by status" variant="scrollable" scrollButtons={false}
          sx={{
            px: { xs: 0.5, sm: 1.5 }, borderBottom: '1px solid', borderColor: 'divider',
            '& .MuiTab-root': { minHeight: 60, fontWeight: 700, fontSize: { xs: '0.86rem', sm: '0.96rem' }, color: 'text.secondary', px: { xs: 1.25, sm: 2 } },
            '& .MuiTab-root.Mui-selected': { color: 'primary.main' },
            '& .MuiTab-icon': { fontSize: 20, mr: '8px !important' },
            '& .MuiTabs-indicator': { height: 3, borderRadius: '3px 3px 0 0' },
          }}>
          {STATUS_TABS.map((s) => (
            <Tab key={s} value={s} icon={TAB_ICON[s]} iconPosition="start" id={`req-tab-${s}`} aria-controls="req-panel"
              label={`${s}${ready ? ` (${tabCounts[s] || 0})` : ''}`} />
          ))}
        </Tabs>

        {/* Filters */}
        <Box role="search" aria-label="Filter requests" sx={{
          p: { xs: 1.5, sm: 2 }, display: 'grid', gap: 1.5, alignItems: 'end',
          gridTemplateColumns: { xs: '1fr 1fr', md: 'repeat(4, 1fr)', lg: 'minmax(220px, 1.6fr) repeat(4, minmax(130px, 1fr)) auto' },
        }}>
          <Box sx={{
            gridColumn: { xs: '1 / -1', md: '1 / -1', lg: 'auto' },
            display: 'flex', alignItems: 'center', gap: 1, px: 1.5, height: 44, borderRadius: '10px',
            border: '1px solid', borderColor: 'divider', bgcolor: 'background.paper',
            '&:focus-within': { borderColor: 'primary.main', boxShadow: (t) => `0 0 0 3px ${alpha(t.palette.primary.main, 0.14)}` },
          }}>
            <SearchIcon aria-hidden="true" sx={{ fontSize: 21, color: 'text.secondary' }} />
            <InputBase value={query} onChange={(e) => setQuery(e.target.value)} fullWidth placeholder="Search patient name, hospital..."
              inputProps={{ 'aria-label': 'Search by patient name or hospital', type: 'search' }} sx={{ fontSize: '0.9rem' }} />
            {query && <IconButton size="small" aria-label="Clear search" onClick={() => setQuery('')}><CloseIcon fontSize="small" /></IconButton>}
          </Box>
          <FormControl size="small">
            <InputLabel id="f-blood">Blood Type</InputLabel>
            <Select labelId="f-blood" label="Blood Type" value={bloodType} onChange={(e) => setBloodType(e.target.value)} sx={selectSx}>
              <MenuItem value="All">All types</MenuItem>
              {BLOOD_TYPES.map((t) => <MenuItem key={t} value={t}>{t}</MenuItem>)}
            </Select>
          </FormControl>
          <FormControl size="small">
            <InputLabel id="f-urgency">Urgency</InputLabel>
            <Select labelId="f-urgency" label="Urgency" value={urgency} onChange={(e) => setUrgency(e.target.value)} sx={selectSx}>
              <MenuItem value="All">All levels</MenuItem>
              {URGENCIES.map((u) => <MenuItem key={u} value={u}>{u}</MenuItem>)}
            </Select>
          </FormControl>
          <FormControl size="small">
            <InputLabel id="f-status">Status</InputLabel>
            <Select labelId="f-status" label="Status" value={tab} onChange={(e) => changeTab(e.target.value)} sx={selectSx}>
              {STATUS_TABS.map((s) => <MenuItem key={s} value={s}>{s === 'All' ? 'All statuses' : s}</MenuItem>)}
            </Select>
          </FormControl>
          <FormControl size="small">
            <InputLabel id="f-range">Submitted</InputLabel>
            <Select labelId="f-range" label="Submitted" value={range} onChange={(e) => setRange(e.target.value)} sx={selectSx}
              startAdornment={<CalendarMonthOutlinedIcon aria-hidden="true" sx={{ fontSize: 19, color: 'text.secondary', mr: 0.75 }} />}>
              {RANGES.map((r) => <MenuItem key={r.value} value={r.value}>{r.label}</MenuItem>)}
            </Select>
          </FormControl>
          <Button onClick={clearFilters} disabled={!filtersActive} color="inherit" startIcon={<FilterAltOffOutlinedIcon />}
            sx={{ height: 44, color: 'text.secondary', gridColumn: { xs: '1 / -1', md: 'auto' }, justifySelf: { md: 'start', lg: 'auto' } }}>
            Clear filters
          </Button>
        </Box>

        <Box id="req-panel" role="tabpanel" aria-labelledby={`req-tab-${tab}`} aria-busy={status === 'loading'}
          sx={{ px: { xs: 1.5, sm: 2 }, pb: { xs: 1.5, sm: 2 }, display: 'flex', flexDirection: 'column', gap: 1.5 }}>
          {ready && requests.length > 0 && (
            <Box aria-live="polite" sx={{ color: 'text.secondary', fontSize: '0.84rem' }}>
              Showing {shown.length} of {requests.length} request{requests.length !== 1 ? 's' : ''}
            </Box>
          )}
          {status === 'loading' ? (
            <>{[0, 1, 2].map((i) => <RowSkeleton key={i} />)}</>
          ) : status === 'error' ? (
            <Alert severity="error" variant="outlined" icon={<ErrorOutlineIcon />} sx={{ borderRadius: '12px', alignItems: 'center' }}
              action={<Button color="error" size="small" onClick={() => load()}>Try again</Button>}>
              We couldn&apos;t load your blood requests. Check your connection and try again.
            </Alert>
          ) : requests.length === 0 ? (
            <EmptyPanel icon={<DescriptionOutlinedIcon />} title="No blood requests yet"
              text="When a patient needs blood, submit a request and the hospital team will review it. Your requests will appear here."
              action={<Button component={Link} href="/requests" variant="contained" startIcon={<AddIcon />}>New Request</Button>} />
          ) : shown.length === 0 ? (
            <EmptyPanel icon={<SearchOffIcon />} title="No requests match these filters"
              text="Try another status, blood type or date range — or clear the filters."
              action={<Button variant="outlined" startIcon={<FilterAltOffOutlinedIcon />} onClick={clearFilters}>Clear filters</Button>} />
          ) : (
            shown.map((r) => (
              <RequestRow key={r._id} req={r} hospital={hospitalFor(r, directory)} onView={setDetail} onCancel={setCancelTarget}
                cancelling={cancelling && cancelTarget?._id === r._id} />
            ))
          )}
        </Box>
      </Paper>

      {detail && (
        <RequestDetailsDialog request={detail} token={token} hospitalPhone={hospitalFor(detail, directory)?.phone}
          onClose={() => setDetail(null)} onCancel={setCancelTarget} onSessionExpired={sessionExpired}
          onFresh={(data) => setRequests((list) => list.map((r) => (r._id === data._id ? data : r)))} />
      )}

      <CancelRequestDialog request={cancelTarget} token={token} onClose={() => setCancelTarget(null)}
        onCancelled={onCancelled} onChanged={onCancelConflict} onSessionExpired={sessionExpired} onBusyChange={setCancelling} />

      <Snackbar open={Boolean(toast)} autoHideDuration={5000} onClose={() => setToast(null)} anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}>
        {toast ? <Alert onClose={() => setToast(null)} severity={toast.severity} variant="filled" sx={{ borderRadius: '10px', fontWeight: 600 }}>{toast.message}</Alert> : undefined}
      </Snackbar>
    </Box>
  );
}
