'use client';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import {
  Alert, Avatar, Box, Button, CircularProgress, IconButton, Skeleton, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, Tooltip, Typography, alpha,
} from '@mui/material';
import LocalHospitalRoundedIcon from '@mui/icons-material/LocalHospitalRounded';
import DescriptionRoundedIcon from '@mui/icons-material/DescriptionRounded';
import WaterDropIcon from '@mui/icons-material/WaterDrop';
import CalendarMonthRoundedIcon from '@mui/icons-material/CalendarMonthRounded';
import TaskAltRoundedIcon from '@mui/icons-material/TaskAltRounded';
import QrCodeScannerIcon from '@mui/icons-material/QrCodeScanner';
import RefreshIcon from '@mui/icons-material/Refresh';
import EventAvailableRoundedIcon from '@mui/icons-material/EventAvailableRounded';
import axios from 'axios';
import { useAuth } from '@/store/AuthContext';
import API_BASE from '@/lib/config';
import {
  PageHeader, SectionCard, StatCard, StatusBadge, EmptyState, CardError, BloodPill, RowMenu, compactHeadCell, compactTableContainerSx,
} from '@/components/ui';
import LowStockAlert from '@/components/inventory/LowStockAlert';
import { STOCK, completeByType, summarize } from '@/lib/inventory';
import { formatDate, initialsOf } from '@/lib/format';

// recharts is large and sits below the stat cards, so load it on demand.
const StockBarChart = dynamic(() => import('@/components/inventory/StockCharts').then((m) => m.StockBarChart), {
  ssr: false,
  loading: function ChartSlot() { return <Skeleton variant="rounded" height={300} />; },
});

const LINKS = {
  requests: '/dashboard/hospital/requests',
  inventory: '/dashboard/hospital/inventory',
  appointments: '/dashboard/hospital/appointments',
  scan: '/dashboard/hospital/scan',
};
const REFRESH_MS = 60 * 1000; // silent background refresh while the tab is visible

// Polls usually return identical data; keeping the old object skips a re-render and chart re-animation.
const keepIfSame = (next) => (prev) => (JSON.stringify(prev) === JSON.stringify(next) ? prev : next);

// Appointments store the date as "YYYY-MM-DD" and the time as "08:30 AM".
const localIso = (d = new Date()) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
const minutesOf = (time = '') => {
  const m = /^(\d{1,2}):(\d{2})\s*(AM|PM)?$/i.exec(time.trim());
  if (!m) return 0;
  const meridiem = m[3]?.toUpperCase();
  const h = meridiem ? (Number(m[1]) % 12) + (meridiem === 'PM' ? 12 : 0) : Number(m[1]);
  return h * 60 + Number(m[2]);
};
const dayLabel = (iso, today) => {
  if (iso === today) return 'Today';
  const tomorrow = new Date(); tomorrow.setDate(tomorrow.getDate() + 1);
  if (iso === localIso(tomorrow)) return 'Tomorrow';
  return formatDate(`${iso}T00:00:00`);
};

const greeting = () => {
  const h = new Date().getHours();
  return h < 12 ? 'Good morning' : h < 18 ? 'Good afternoon' : 'Good evening';
};

// Patient avatars get a stable colour from their name (same palette as the admin dashboard).
const AVATAR_HUES = ['#2563EB', '#7C3AED', '#DB2777', '#0891B2', '#EA580C', '#16A34A'];
const hueOf = (name = '') => AVATAR_HUES[[...name].reduce((s, c) => s + c.charCodeAt(0), 0) % AVATAR_HUES.length];

const splitRow = (main = 2, side = 1) => ({
  display: 'grid',
  gridTemplateColumns: { xs: 'minmax(0,1fr)', lg: `minmax(0,${main}fr) minmax(0,${side}fr)` },
  gap: { xs: 2, md: 2.5 },
  mt: { xs: 2, md: 2.5 },
});

export default function HospitalOverview() {
  const { staff, token } = useAuth();
  const hospital = staff?.hospitalId;
  const auth = useMemo(() => ({ headers: { Authorization: `Bearer ${token}` } }), [token]);

  // null = loading; each section loads and fails on its own.
  const [requests, setRequests] = useState(null);
  const [inventory, setInventory] = useState(null);
  const [appointments, setAppointments] = useState(null);
  const [errors, setErrors] = useState({});
  const [refreshing, setRefreshing] = useState(false);

  // One in-flight request per kind, so a slow old response can't overwrite a newer one.
  const inflight = useRef({});
  useEffect(() => () => Object.values(inflight.current).forEach((c) => c.abort()), []);

  const load = useCallback(async (key, url, setter, message, withAuth = true) => {
    inflight.current[key]?.abort();
    const c = new AbortController();
    inflight.current[key] = c;
    try {
      const { data } = await axios.get(url, { ...(withAuth ? auth : {}), signal: c.signal });
      setter(keepIfSame(Array.isArray(data) ? data : []));
      setErrors((e) => (e[key] ? { ...e, [key]: null } : e));
    } catch (err) {
      if (!axios.isCancel(err)) setErrors((e) => ({ ...e, [key]: err.response?.data?.error || message }));
    }
  }, [auth]);

  const loadRequests = useCallback(() => load('requests', `${API_BASE}/api/requests?hospital=${hospital}`, setRequests, 'Could not load blood requests.'), [load, hospital]);
  const loadInventory = useCallback(() => load('inventory', `${API_BASE}/api/inventory?hospital=${hospital}`, setInventory, 'Could not load blood inventory.', false), [load, hospital]);
  const loadAppointments = useCallback(() => load('appointments', `${API_BASE}/api/appointments?hospital=${hospital}`, setAppointments, 'Could not load appointments.'), [load, hospital]);

  const refreshing$ = useRef(false);
  const refresh = useCallback(async ({ silent = false } = {}) => {
    if (!hospital || refreshing$.current) return;
    refreshing$.current = true;
    if (!silent) setRefreshing(true);
    await Promise.all([loadRequests(), loadInventory(), loadAppointments()]);
    refreshing$.current = false;
    setRefreshing(false);
  }, [hospital, loadRequests, loadInventory, loadAppointments]);

  useEffect(() => { refresh({ silent: true }); }, [refresh]);

  // Keep the page live: poll while visible and refresh when the tab comes back.
  useEffect(() => {
    const tick = () => { if (document.visibilityState === 'visible') refresh({ silent: true }); };
    const id = setInterval(tick, REFRESH_MS);
    document.addEventListener('visibilitychange', tick);
    return () => { clearInterval(id); document.removeEventListener('visibilitychange', tick); };
  }, [refresh]);

  // ── Derived figures ──
  const today = localIso();
  const req = useMemo(() => {
    const list = requests || [];
    const pending = list.filter((r) => r.status === 'Pending');
    return {
      pending: pending.length,
      critical: pending.filter((r) => r.urgency === 'Critical').length,
      approved: list.filter((r) => r.status === 'Approved').length,
      fulfilled: list.filter((r) => r.status === 'Fulfilled').length,
      total: list.length,
      recent: [...list].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 6),
    };
  }, [requests]);

  const stock = useMemo(() => completeByType(inventory || []), [inventory]);
  const totals = useMemo(() => summarize(stock), [stock]);
  const attentionTypes = totals.low.types + totals.critical.types + totals.empty.types;
  const noStock = inventory !== null && totals.totalUnits === 0;

  const appt = useMemo(() => {
    const list = appointments || [];
    const open = list.filter((a) => (a.status === 'Pending' || a.status === 'Confirmed') && a.date >= today);
    const sortKey = (a) => `${a.date} ${String(minutesOf(a.time)).padStart(4, '0')}`;
    return {
      upcoming: open.sort((a, b) => sortKey(a).localeCompare(sortKey(b))),
      today: list.filter((a) => a.date === today && a.status !== 'Cancelled').length,
      checkedInToday: list.filter((a) => a.status === 'CheckedIn' && a.date === today).length,
      awaitingConfirm: open.filter((a) => a.status === 'Pending').length,
    };
  }, [appointments, today]);

  const statusLegend = ['adequate', 'low', 'critical', 'empty'];

  return (
    <Box>
      <PageHeader
        icon={<LocalHospitalRoundedIcon />}
        title="Hospital Dashboard"
        subtitle={`${greeting()}${staff?.fullName ? `, ${staff.fullName.split(' ')[0]}` : ''}. Here's what's happening at your hospital today.`}
        sx={{ mb: { xs: 2.5, md: 3 } }}
        actions={
          <>
            <Tooltip title="Refresh data">
              <span>
                <IconButton onClick={() => refresh()} disabled={refreshing || !hospital} aria-label="Refresh data"
                  sx={{ border: 1, borderColor: 'divider', borderRadius: '10px', bgcolor: 'background.paper' }}>
                  {refreshing ? <CircularProgress size={18} /> : <RefreshIcon fontSize="small" />}
                </IconButton>
              </span>
            </Tooltip>
            <Button component={Link} href={LINKS.scan} variant="contained" startIcon={<QrCodeScannerIcon />}>
              Check in donor
            </Button>
          </>
        }
      />

      {!hospital && staff && (
        <Alert severity="warning" sx={{ mb: 2.5 }}>Your account isn&apos;t linked to a hospital yet. Ask an administrator to assign one.</Alert>
      )}

      {req.critical > 0 && (
        <Alert
          severity="error"
          variant="outlined"
          sx={{ mb: 2.5, bgcolor: 'background.paper', alignItems: 'center' }}
          action={<Button component={Link} href={LINKS.requests} color="error" size="small" variant="contained">Review now</Button>}
        >
          <strong>{req.critical} critical request{req.critical === 1 ? '' : 's'}</strong> waiting for review.
        </Alert>
      )}

      {/* ── Stat cards ── */}
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: 'minmax(0,1fr)', sm: 'repeat(2, minmax(0,1fr))', xl: 'repeat(4, minmax(0,1fr))' }, gap: { xs: 2, md: 2.5 } }}>
        <StatCard
          label="Pending Requests" value={req.pending} loading={requests === null && !errors.requests}
          icon={<DescriptionRoundedIcon />} color="#F59E0B" href={LINKS.requests}
          hint={req.critical > 0
            ? <Box component="span" sx={{ color: 'error.main', fontWeight: 700 }}>{req.critical} critical · {req.approved} approved</Box>
            : `${req.approved} approved, awaiting fulfilment`}
        />
        <StatCard
          label="Blood Units in Stock" value={totals.totalUnits.toLocaleString()} loading={inventory === null && !errors.inventory}
          icon={<WaterDropIcon />} color="#E11D48" href={LINKS.inventory}
          hint={attentionTypes > 0
            ? <Box component="span" sx={{ color: 'warning.main', fontWeight: 700 }}>{attentionTypes} type{attentionTypes === 1 ? '' : 's'} low or out</Box>
            : 'All 8 types adequately stocked'}
        />
        <StatCard
          label="Upcoming Appointments" value={appt.upcoming.length} loading={appointments === null && !errors.appointments}
          icon={<CalendarMonthRoundedIcon />} color="#2563EB" href={LINKS.appointments}
          hint={`${appt.today} today · ${appt.awaitingConfirm} to confirm`}
        />
        <StatCard
          label="Requests Fulfilled" value={req.fulfilled} loading={requests === null && !errors.requests}
          icon={<TaskAltRoundedIcon />} color="#16A34A" href={LINKS.requests}
          hint={req.total ? `${Math.round((req.fulfilled / req.total) * 100)}% of ${req.total} requests` : 'No requests yet'}
        />
      </Box>

      {/* ── Inventory chart | Upcoming appointments ── */}
      <Box sx={splitRow(1.9, 1)}>
        <SectionCard
          padded={false}
          icon={<WaterDropIcon />}
          title="Blood Inventory by Type"
          subtitle="Units in stock, coloured by stock level"
          action={<Button component={Link} href={LINKS.inventory} size="small" sx={{ fontWeight: 700 }}>Manage</Button>}
        >
          {errors.inventory && inventory === null && <CardError message={errors.inventory} onRetry={loadInventory} />}
          <Box sx={{ px: { xs: 1, md: 2.5 }, pb: 2.5 }}>
            {inventory === null ? (errors.inventory ? null : <Skeleton variant="rounded" height={300} />) : noStock ? (
              <Box sx={{ minHeight: 300, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <EmptyState
                  icon={<WaterDropIcon />}
                  title="No inventory recorded yet"
                  description="Enter your hospital's stock levels to see the chart and low-stock alerts."
                  action={<Button component={Link} href={LINKS.inventory} variant="outlined" size="small">Update inventory</Button>}
                />
              </Box>
            ) : (
              <>
                <StockBarChart stock={stock} />
                <Box sx={{ display: 'flex', gap: { xs: 1.5, sm: 2.5 }, flexWrap: 'wrap', mt: 1.5, justifyContent: 'center' }}>
                  {statusLegend.map((k) => (
                    <Box key={k} sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                      <Box sx={{ width: 10, height: 10, borderRadius: '50%', ...(k === 'empty' ? { border: 2, borderColor: STOCK[k].color } : { bgcolor: STOCK[k].color }) }} />
                      <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 500 }}>
                        {STOCK[k].label}{totals[k].types ? ` (${totals[k].types})` : ''}
                      </Typography>
                    </Box>
                  ))}
                </Box>
              </>
            )}
          </Box>
        </SectionCard>

        <SectionCard
          padded={false}
          icon={<EventAvailableRoundedIcon />}
          title="Upcoming Appointments"
          subtitle={appt.checkedInToday ? `${appt.checkedInToday} donor${appt.checkedInToday === 1 ? '' : 's'} checked in today` : 'Next donors booked at your hospital'}
          action={<Button component={Link} href={LINKS.appointments} size="small" sx={{ fontWeight: 700 }}>View All</Button>}
        >
          {errors.appointments && appointments === null ? (
            <CardError message={errors.appointments} onRetry={loadAppointments} />
          ) : appointments === null ? (
            <Box sx={{ px: 3, pb: 3, display: 'flex', flexDirection: 'column', gap: 1.25 }}>
              {[0, 1, 2, 3].map((i) => <Skeleton key={i} variant="rounded" height={48} />)}
            </Box>
          ) : appt.upcoming.length === 0 ? (
            <EmptyState icon={<CalendarMonthRoundedIcon />} title="No upcoming appointments" description="New bookings for your hospital will show up here." />
          ) : (
            <Box component="ul" sx={{ listStyle: 'none', m: 0, px: { xs: 2, md: 2.5 }, pb: 2, display: 'flex', flexDirection: 'column', gap: 1 }}>
              {appt.upcoming.slice(0, 5).map((a) => {
                const isToday = a.date === today;
                return (
                  <Box component="li" key={a._id}
                    sx={(t) => ({
                      display: 'flex', alignItems: 'center', gap: 1.5, p: 1.25, borderRadius: `${t.custom.radius.md}px`,
                      border: 1, borderColor: isToday ? alpha(t.palette.primary.main, 0.35) : 'divider',
                      bgcolor: isToday ? alpha(t.palette.primary.main, 0.04) : 'transparent',
                    })}
                  >
                    <Box sx={{ textAlign: 'center', minWidth: 64, flexShrink: 0 }}>
                      <Typography variant="caption" sx={{ display: 'block', fontWeight: 700, color: isToday ? 'primary.main' : 'text.secondary', lineHeight: 1.2 }}>
                        {dayLabel(a.date, today)}
                      </Typography>
                      <Typography variant="body2" sx={{ fontWeight: 700, whiteSpace: 'nowrap' }}>{a.time}</Typography>
                    </Box>
                    <Box sx={{ minWidth: 0, flexGrow: 1 }}>
                      <Typography variant="body2" noWrap sx={{ fontWeight: 600 }}>{a.fullName}</Typography>
                      <StatusBadge status={a.status} label={a.status === 'Pending' ? 'To confirm' : undefined} size="small" dot={false} />
                    </Box>
                    <BloodPill type={a.bloodType} />
                  </Box>
                );
              })}
              {appt.upcoming.length > 5 && (
                <Typography variant="caption" color="text.secondary" sx={{ textAlign: 'center', mt: 0.5 }}>
                  +{appt.upcoming.length - 5} more upcoming
                </Typography>
              )}
            </Box>
          )}
        </SectionCard>
      </Box>

      {/* ── Recent requests | Low stock ── */}
      <Box sx={splitRow(1.6, 1)}>
        <SectionCard
          padded={false}
          icon={<DescriptionRoundedIcon />}
          title="Recent Blood Requests"
          action={<Button component={Link} href={LINKS.requests} size="small" sx={{ fontWeight: 700 }}>View All</Button>}
        >
          {errors.requests && requests === null ? (
            <CardError message={errors.requests} onRetry={loadRequests} />
          ) : (
            <TableContainer sx={compactTableContainerSx}>
              <Table size="small" sx={{ minWidth: 620, '& td': { borderBottom: 'none', py: 1.25 } }}>
                <TableHead>
                  <TableRow>
                    {['Patient', 'Blood Type', 'Units', 'Urgency', 'Status', 'Date', ''].map((h, i) => (
                      <TableCell key={i} sx={compactHeadCell}>{h}</TableCell>
                    ))}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {requests === null && [0, 1, 2].map((i) => (
                    <TableRow key={i}><TableCell colSpan={7}><Skeleton variant="text" /></TableCell></TableRow>
                  ))}
                  {requests && req.recent.length === 0 && (
                    <TableRow><TableCell colSpan={7}><EmptyState icon={<DescriptionRoundedIcon />} title="No requests yet" description="Requests assigned to your hospital will appear here." /></TableCell></TableRow>
                  )}
                  {req.recent.map((r) => (
                    <TableRow key={r._id} hover>
                      <TableCell sx={{ maxWidth: 220 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25, minWidth: 0 }}>
                          <Avatar sx={{ width: 30, height: 30, fontSize: '0.8rem', fontWeight: 700, bgcolor: alpha(hueOf(r.patientName), 0.14), color: hueOf(r.patientName) }}>
                            {initialsOf(r.patientName)}
                          </Avatar>
                          <Typography variant="body2" noWrap sx={{ fontWeight: 600 }}>{r.patientName || '—'}</Typography>
                        </Box>
                      </TableCell>
                      <TableCell><BloodPill type={r.bloodType} /></TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>{r.unitsNeeded}</TableCell>
                      <TableCell><StatusBadge status={r.urgency} size="small" dot={false} /></TableCell>
                      <TableCell><StatusBadge status={r.status} size="small" dot={false} /></TableCell>
                      <TableCell sx={{ whiteSpace: 'nowrap' }}>{formatDate(r.createdAt)}</TableCell>
                      <TableCell align="right"><RowMenu label="Open requests" href={LINKS.requests} /></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </SectionCard>

        <LowStockAlert
          items={inventory}
          href={LINKS.inventory}
          error={errors.inventory && 'Stock alerts could not be loaded.'}
          onRetry={loadInventory}
        />
      </Box>
    </Box>
  );
}
