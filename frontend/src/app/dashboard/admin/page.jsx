'use client';
import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import {
  Alert, Avatar, Box, Button, CircularProgress, IconButton, ListItemText, MenuItem, Select, Skeleton,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Tooltip, Typography, alpha,
} from '@mui/material';
import GridViewRoundedIcon from '@mui/icons-material/GridViewRounded';
import PeopleAltRoundedIcon from '@mui/icons-material/PeopleAltRounded';
import WaterDropIcon from '@mui/icons-material/WaterDrop';
import DescriptionRoundedIcon from '@mui/icons-material/DescriptionRounded';
import ApartmentRoundedIcon from '@mui/icons-material/ApartmentRounded';
import PieChartRoundedIcon from '@mui/icons-material/PieChartRounded';
import CalendarTodayOutlinedIcon from '@mui/icons-material/CalendarTodayOutlined';
import RefreshIcon from '@mui/icons-material/Refresh';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import axios from 'axios';
import API_BASE from '@/lib/config';
import { useAuth } from '@/store/AuthContext';
import {
  PageHeader, SectionCard, StatCard, StatusBadge, EmptyState, CardError, BloodPill, RowMenu, compactHeadCell, compactTableContainerSx,
} from '@/components/ui';
import LowStockAlert from '@/components/inventory/LowStockAlert';
import { STOCK, completeByType, summarize } from '@/lib/inventory';
import { formatDate, initialsOf } from '@/lib/format';

// recharts is large and the charts sit below the stat cards, so load them on demand.
const chartSlot = (h) => {
  const ChartSlot = () => <Skeleton variant="rounded" height={h} />;
  return ChartSlot;
};
const StockBarChart = dynamic(() => import('@/components/inventory/StockCharts').then((m) => m.StockBarChart), { ssr: false, loading: chartSlot(300) });
const StockDonut = dynamic(() => import('@/components/inventory/StockCharts').then((m) => m.StockDonut), { ssr: false, loading: chartSlot(200) });

// Two-column row on wide screens (main | side card), stacked below.
const splitRow = (main = 2, side = 1) => ({
  display: 'grid',
  gridTemplateColumns: { xs: 'minmax(0,1fr)', lg: `minmax(0,${main}fr) minmax(0,${side}fr)` },
  gap: { xs: 2, md: 2.5 },
  mt: { xs: 2, md: 2.5 },
});

// ── Date range presets ─────────────────────────────────────────────────────────
// Each returns [from, to) ending tonight (`to` is exclusive), so a trend never compares a
// partly elapsed period with a whole one: "Month to date" is set against the same number
// of days just before it (the backend picks that previous window).
const DAY = 24 * 60 * 60 * 1000;
const endOfToday = (n) => new Date(new Date(n.getFullYear(), n.getMonth(), n.getDate()).getTime() + DAY);
const lastDays = (days) => (n) => { const to = endOfToday(n); return [new Date(to - days * DAY), to]; };
const RANGES = {
  month: { label: 'Month to date', get: (n) => [new Date(n.getFullYear(), n.getMonth(), 1), endOfToday(n)] },
  last7: { label: 'Last 7 days', get: lastDays(7) },
  last30: { label: 'Last 30 days', get: lastDays(30) },
  last90: { label: 'Last 90 days', get: lastDays(90) },
  year: { label: 'Year to date', get: (n) => [new Date(n.getFullYear(), 0, 1), endOfToday(n)] },
};
const REFRESH_MS = 60 * 1000; // silent background refresh so charts follow the database

// Polls usually return identical data. Keeping the previous object when nothing changed
// means React skips the re-render and the charts don't redraw or re-animate.
const same = (a, b) => a === b || JSON.stringify(a) === JSON.stringify(b);
const keepIfSame = (next) => (prev) => (same(prev, next) ? prev : next);
const rangeText = ([from, to]) => `${formatDate(from)} - ${formatDate(new Date(to - 1))}`;

// Patient avatars get a stable colour from their name.
const AVATAR_HUES = ['#2563EB', '#7C3AED', '#DB2777', '#0891B2', '#EA580C', '#16A34A'];
const hueOf = (name = '') => AVATAR_HUES[[...name].reduce((s, c) => s + c.charCodeAt(0), 0) % AVATAR_HUES.length];

// ── Page ───────────────────────────────────────────────────────────────────────
const Dashboard = () => {
  const { token } = useAuth();
  const [rangeKey, setRangeKey] = useState('month');
  const [hospitalId, setHospitalId] = useState('all');
  const [stats, setStats] = useState(null);
  const [statsError, setStatsError] = useState(null);
  const [trends, setTrends] = useState(undefined); // undefined = loading, null = unavailable
  const [hospitals, setHospitals] = useState([]);
  const [inventory, setInventory] = useState(null); // null = loading
  const [inventoryError, setInventoryError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  const range = useMemo(() => RANGES[rangeKey].get(new Date()), [rangeKey]);
  const auth = useMemo(() => ({ headers: { Authorization: `Bearer ${token}` } }), [token]);

  // One in-flight request per kind: starting a new one aborts the old, so a slow response
  // for a previous hospital or date range can never overwrite the current one.
  const inflight = useRef({});
  const signalFor = useCallback((key) => {
    inflight.current[key]?.abort();
    const c = new AbortController();
    inflight.current[key] = c;
    return c.signal;
  }, []);
  useEffect(() => () => Object.values(inflight.current).forEach((c) => c.abort()), []);

  // Each loader keeps the data it already has while re-fetching, so background refreshes
  // update the charts in place instead of flashing skeletons.
  const loadStats = useCallback(async () => {
    try {
      const { data } = await axios.get(`${API_BASE}/api/stats`, { ...auth, signal: signalFor('stats') });
      setStats(keepIfSame(data));
      setStatsError(null);
    } catch (err) {
      if (!axios.isCancel(err)) setStatsError(err.response?.data?.error || 'Could not load dashboard figures.');
    }
  }, [auth, signalFor]);

  const loadTrends = useCallback(async () => {
    const [from, to] = range;
    try {
      const { data } = await axios.get(`${API_BASE}/api/stats/trends`, {
        ...auth, signal: signalFor('trends'), params: { from: from.toISOString(), to: to.toISOString() },
      });
      setTrends(keepIfSame(data));
    } catch (err) {
      if (!axios.isCancel(err)) setTrends(null); // cards still show totals, with "Trend unavailable"
    }
  }, [auth, range, signalFor]);

  const loadInventory = useCallback(async () => {
    try {
      const url = hospitalId === 'all' ? `${API_BASE}/api/inventory/network` : `${API_BASE}/api/inventory?hospital=${hospitalId}`;
      const { data } = await axios.get(url, { signal: signalFor('inventory') });
      setInventory(keepIfSame(Array.isArray(data) ? data : []));
      setInventoryError(null);
    } catch (err) {
      if (!axios.isCancel(err)) setInventoryError(err.response?.data?.error || err.response?.data?.message || 'Could not load blood inventory.');
    }
  }, [hospitalId, signalFor]);

  // The hospital list only feeds the filter dropdown and rarely changes — load it once.
  useEffect(() => {
    const c = new AbortController();
    axios.get(`${API_BASE}/api/hospitals`, { ...auth, signal: c.signal })
      .then(({ data }) => { if (Array.isArray(data)) setHospitals(data); })
      .catch(() => {}); // the filter just offers "All Hospitals"
    return () => c.abort();
  }, [auth]);

  useEffect(() => { loadStats(); }, [loadStats]);
  useEffect(() => { setTrends(undefined); loadTrends(); }, [loadTrends]);
  useEffect(() => { setInventory(null); setInventoryError(null); loadInventory(); }, [loadInventory]);

  // A timer tick and a tab switch can land together — never run two refreshes at once.
  const refreshing$ = useRef(false);
  // Background polls skip trends: they count additions over days to a year, so they barely
  // move minute to minute. The Refresh button and a range change still reload them.
  const refresh = useCallback(async ({ withTrends = true } = {}) => {
    if (refreshing$.current) return;
    refreshing$.current = true;
    setRefreshing(true);
    await Promise.all([loadStats(), withTrends && loadTrends(), loadInventory()]);
    refreshing$.current = false;
    setRefreshing(false);
  }, [loadStats, loadTrends, loadInventory]);

  // Keep the page live: poll while visible, and refresh as soon as the tab is shown again.
  useEffect(() => {
    const tick = () => { if (document.visibilityState === 'visible') refresh({ withTrends: false }); };
    const id = setInterval(tick, REFRESH_MS);
    document.addEventListener('visibilitychange', tick);
    return () => { clearInterval(id); document.removeEventListener('visibilitychange', tick); };
  }, [refresh]);

  const stock = useMemo(() => completeByType(inventory || []), [inventory]);
  const totals = useMemo(() => summarize(stock), [stock]);
  // Nothing recorded (no rows, or every row at 0): show one calm empty state, not eight red zeros.
  const noStock = inventory !== null && totals.totalUnits === 0;
  const scopeName = hospitalId === 'all' ? 'the network' : (hospitals.find((h) => h._id === hospitalId)?.name || 'this hospital');
  // The critical bucket also holds out-of-stock types (0 units, so they add nothing to the donut).
  const donut = useMemo(() => ['adequate', 'low', 'critical']
    .map((k) => ({ key: k, name: STOCK[k].label, value: totals[k].units, color: STOCK[k].color }))
    .filter((d) => d.value > 0), [totals]);

  // Legend thresholds, when every type shares one minimum (the default is 10 → ≥ 20 / 10 – 19 / 1 – 9).
  const mins = [...new Set(stock.map((i) => i.minUnits))];
  const m = mins.length === 1 ? mins[0] : null;
  const legend = [
    { k: 'adequate', text: m ? `Adequate (≥ ${m * 2})` : 'Adequate' },
    { k: 'low', text: m ? `Low (${m}–${m * 2 - 1})` : 'Low' },
    { k: 'critical', text: m ? `Critical (1–${m - 1})` : 'Critical' },
    { k: 'empty', text: 'Out of stock (0)' },
  ];

  const handleExport = () => {
    if (!stats) return;
    const rows = [
      ['Metric', 'Value'],
      ['Total Donors', stats.donors.total],
      ['Available Donors', stats.donors.available],
      ['Total Donations', stats.donations.total],
      ['Partner Hospitals', stats.hospitals.total],
      ['Total Requests', stats.requests.total],
      ['Pending Requests', stats.requests.pending],
      ['Critical Requests', stats.requests.critical],
      ['Total Appointments', stats.appointments.total],
      ['Pending Appointments', stats.appointments.pending],
      ['Contact Messages', stats.messages.total],
      ['Blood Units In Stock', totals.totalUnits],
    ];
    const blob = new Blob([rows.map((r) => r.join(',')).join('\n')], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'dashboard_report.csv'; a.click();
    URL.revokeObjectURL(url);
  };

  const statLoading = !stats && !statsError;
  // Memoised on `stats` so the (memoised) cards skip re-rendering when nothing they show changed.
  // Accent colours are fixed hues, so they read the same in light and dark mode.
  const cards = useMemo(() => [
    { key: 'donors', color: '#E11D48', label: 'Total Donors', icon: <PeopleAltRoundedIcon />, value: stats?.donors.total, hint: stats && `${stats.donors.available} available`, noun: 'new', href: '/dashboard/admin/donors' },
    { key: 'donations', color: '#2563EB', label: 'Total Donations', icon: <WaterDropIcon />, value: stats?.donations.total, hint: 'Completed donations', noun: 'recorded' },
    { key: 'requests', color: '#F59E0B', label: 'Blood Requests', icon: <DescriptionRoundedIcon />, value: stats?.requests.total, noun: 'new', href: '/dashboard/admin/requests',
      hint: stats && (
        <>
          {stats.requests.pending} pending
          {stats.requests.critical > 0 && <Box component="span" sx={{ color: 'error.main', fontWeight: 700, ml: 0.75 }}>· {stats.requests.critical} critical</Box>}
        </>
      ) },
    { key: 'hospitals', color: '#7C3AED', label: 'Partner Hospitals', icon: <ApartmentRoundedIcon />, value: stats?.hospitals.total, hint: 'Registered partners', noun: 'added', href: '/dashboard/admin/hospitals' },
  ], [stats]);

  const inventoryHref = '/dashboard/admin/inventory';

  return (
    <Box>
      <PageHeader
        icon={<GridViewRoundedIcon />}
        title="Admin Dashboard"
        subtitle="Overview of your blood donation management system"
        sx={{ mb: { xs: 2.5, md: 3 } }}
        actions={
          <>
            <Tooltip title="Export CSV">
              <span>
                <IconButton onClick={handleExport} disabled={!stats} aria-label="Export CSV" sx={headerBtnSx}>
                  <FileDownloadIcon fontSize="small" />
                </IconButton>
              </span>
            </Tooltip>
            <Tooltip title="Refresh data">
              <span>
                <IconButton onClick={() => refresh()} disabled={refreshing} aria-label="Refresh data" sx={headerBtnSx}>
                  {refreshing ? <CircularProgress size={18} /> : <RefreshIcon fontSize="small" />}
                </IconButton>
              </span>
            </Tooltip>
            <Select
              size="small"
              value={rangeKey}
              onChange={(e) => setRangeKey(e.target.value)}
              aria-label="Date range for trends"
              renderValue={() => (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25 }}>
                  <CalendarTodayOutlinedIcon sx={{ fontSize: 18, color: 'text.secondary' }} />
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>{rangeText(range)}</Typography>
                </Box>
              )}
              sx={{ bgcolor: 'background.paper', borderRadius: '10px', minWidth: { xs: 0, sm: 250 }, flexGrow: { xs: 1, sm: 0 }, '& .MuiSelect-select': { py: 1.1 } }}
            >
              {Object.entries(RANGES).map(([k, r]) => (
                <MenuItem key={k} value={k}>
                  <ListItemText primary={r.label} secondary={rangeText(r.get(new Date()))} />
                </MenuItem>
              ))}
            </Select>
          </>
        }
      />

      {statsError && (
        <Alert severity="error" sx={{ mb: 2.5 }} action={<Button color="inherit" size="small" onClick={() => refresh()}>Retry</Button>}>
          {statsError}{stats && ' Showing the last figures that loaded.'}
        </Alert>
      )}

      {/* ── Stat cards ── */}
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: 'minmax(0,1fr)', sm: 'repeat(2, minmax(0,1fr))', xl: 'repeat(4, minmax(0,1fr))' }, gap: { xs: 2, md: 2.5 } }}>
        {cards.map(({ key, value, ...c }) => (
          <StatCard key={key} {...c} value={value?.toLocaleString()} loading={statLoading} trend={trends && (trends[key] || null)} />
        ))}
      </Box>

      {/* ── Inventory ── */}
      <Box sx={splitRow(1.9, 1)}>
        <SectionCard
          padded={false}
          icon={<WaterDropIcon />}
          title="Blood Inventory by Type"
          subtitle="Units in stock, coloured by stock level"
          action={
            <Select size="small" value={hospitalId} onChange={(e) => setHospitalId(e.target.value)} aria-label="Hospital" sx={{ minWidth: 160, maxWidth: 240, borderRadius: '10px', fontSize: '0.85rem', fontWeight: 600 }}>
              <MenuItem value="all">All Hospitals</MenuItem>
              {hospitals.map((h) => <MenuItem key={h._id} value={h._id}>{h.name}</MenuItem>)}
            </Select>
          }
        >
          {inventoryError && <CardError message={inventoryError} onRetry={loadInventory} />}
          <Box sx={{ px: { xs: 1, md: 2.5 }, pb: 2.5 }}>
            {inventory === null ? (inventoryError ? null : <Skeleton variant="rounded" height={300} />) : noStock ? (
              <Box sx={{ minHeight: 300, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <EmptyState
                  icon={<WaterDropIcon />}
                  title="No inventory data recorded"
                  description={`No blood units have been entered for ${scopeName} yet. Stock levels and the chart appear here once inventory is updated.`}
                  action={<Button component={Link} href={inventoryHref} variant="outlined" size="small">Update inventory</Button>}
                />
              </Box>
            ) : (
              <>
                <StockBarChart stock={stock} />
                <Box sx={{ display: 'flex', gap: { xs: 1.5, sm: 2.5 }, flexWrap: 'wrap', mt: 1.5, justifyContent: 'center' }}>
                  {legend.map(({ k, text }) => (
                    <Box key={k} sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                      <Box sx={{ width: 10, height: 10, borderRadius: '50%', ...(k === 'empty' ? { border: 2, borderColor: STOCK[k].color } : { bgcolor: STOCK[k].color }) }} />
                      <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 500 }}>{text}</Typography>
                    </Box>
                  ))}
                </Box>
              </>
            )}
          </Box>
        </SectionCard>

        <SectionCard padded={false} icon={<PieChartRoundedIcon />} title="Inventory Status" subtitle="Share of units by stock level">
          <Box sx={{ px: { xs: 2, md: 3 }, pb: 3 }}>
            {inventory === null ? (inventoryError ? null : <Skeleton variant="circular" width={210} height={210} sx={{ mx: 'auto', mt: 2 }} />) : noStock ? (
              <Box sx={{ minHeight: 260, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <EmptyState icon={<PieChartRoundedIcon />} title="Nothing to chart yet" description="The stock-level split appears once units are recorded." />
              </Box>
            ) : (
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: { xs: 'column', sm: 'row', lg: 'column', xl: 'row' }, gap: 3, pt: 2 }}>
                <StockDonut slices={donut} totalUnits={totals.totalUnits} size={210} />
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, flexGrow: 1, width: { xs: '100%', sm: 'auto' }, minWidth: 0 }}>
                  {donut.map((d) => (
                    <Box key={d.key} sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.25 }}>
                      <Box sx={{ width: 14, height: 14, borderRadius: '50%', bgcolor: d.color, flexShrink: 0, mt: 0.4 }} />
                      <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                        <Typography variant="body2" sx={{ fontWeight: 700 }}>{d.name}</Typography>
                        <Typography variant="body2" color="text.secondary">{d.value.toLocaleString()} units</Typography>
                      </Box>
                      <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 600 }}>
                        {Math.round((d.value / totals.totalUnits) * 100)}%
                      </Typography>
                    </Box>
                  ))}
                  {totals.empty.types > 0 && (
                    <Typography variant="caption" color="error.main" sx={{ fontWeight: 600 }}>
                      {totals.empty.types} blood type{totals.empty.types === 1 ? ' is' : 's are'} out of stock.
                    </Typography>
                  )}
                </Box>
              </Box>
            )}
          </Box>
        </SectionCard>
      </Box>

      {/* ── Tables ── */}
      <Box sx={splitRow(1.6, 1)}>
        <SectionCard
          padded={false}
          icon={<DescriptionRoundedIcon />}
          title="Recent Blood Requests"
          action={<Button component={Link} href="/dashboard/admin/requests" size="small" sx={{ fontWeight: 700 }}>View All</Button>}
        >
          <TableContainer sx={compactTableContainerSx}>
            <Table size="small" sx={{ minWidth: 700, '& td': { borderBottom: 'none', py: 1.25 } }}>
              <TableHead>
                <TableRow>
                  {['#', 'Patient Name', 'Blood Type', 'Hospital', 'Urgency', 'Status', 'Date', ''].map((h, i) => (
                    <TableCell key={i} sx={compactHeadCell}>{h}</TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {statLoading && [0, 1, 2].map((i) => (
                  <TableRow key={i}><TableCell colSpan={8}><Skeleton variant="text" /></TableCell></TableRow>
                ))}
                {!stats && statsError && (
                  <TableRow><TableCell colSpan={8}><EmptyState icon={<DescriptionRoundedIcon />} title="Requests unavailable" description="Recent requests could not be loaded. Use refresh to try again." /></TableCell></TableRow>
                )}
                {stats && stats.recentRequests.length === 0 && (
                  <TableRow><TableCell colSpan={8}><EmptyState icon={<DescriptionRoundedIcon />} title="No requests yet" description="Blood requests will appear here as they come in." /></TableCell></TableRow>
                )}
                {stats?.recentRequests.map((r, i) => (
                  <TableRow key={r._id} hover>
                    <TableCell sx={{ color: 'text.secondary' }}>{i + 1}</TableCell>
                    <TableCell sx={{ maxWidth: 200 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25, minWidth: 0 }}>
                        <Avatar sx={{ width: 30, height: 30, fontSize: '0.8rem', fontWeight: 700, bgcolor: alpha(hueOf(r.patientName), 0.14), color: hueOf(r.patientName) }}>
                          {initialsOf(r.patientName)}
                        </Avatar>
                        <Typography variant="body2" noWrap sx={{ fontWeight: 600 }}>{r.patientName || '—'}</Typography>
                      </Box>
                    </TableCell>
                    <TableCell><BloodPill type={r.bloodType} /></TableCell>
                    <TableCell sx={{ maxWidth: 180 }}><Typography variant="body2" noWrap>{r.hospitalName}</Typography></TableCell>
                    <TableCell><StatusBadge status={r.urgency} size="small" dot={false} /></TableCell>
                    <TableCell><StatusBadge status={r.status} size="small" dot={false} /></TableCell>
                    <TableCell sx={{ whiteSpace: 'nowrap' }}>{formatDate(r.createdAt)}</TableCell>
                    <TableCell align="right"><RowMenu label="Open requests" href="/dashboard/admin/requests" /></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </SectionCard>

        <LowStockAlert
          items={inventory}
          href={inventoryHref}
          error={inventoryError && 'Stock alerts could not be loaded.'}
          onRetry={loadInventory}
        />
      </Box>
    </Box>
  );
};

export default Dashboard;
