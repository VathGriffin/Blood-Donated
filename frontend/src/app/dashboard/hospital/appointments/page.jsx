'use client';
import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  Box, Typography, Paper, Table, TableHead, TableBody, TableRow, TableCell, TablePagination, Button,
  CircularProgress, Alert, Avatar, Tabs, Tab, TextField, InputAdornment, IconButton, Skeleton, Snackbar,
  Dialog, DialogTitle, DialogContent, DialogActions, Tooltip, useMediaQuery, useTheme,
} from '@mui/material';
import {
  Today, HourglassEmpty, EventAvailable, Favorite, Search, Close, Refresh, QrCodeScanner, WaterDrop,
  CheckCircle, HowToReg, EventBusy, Phone, Email, WarningAmber, FilterAltOff,
} from '@mui/icons-material';
import axios from 'axios';
import { useAuth } from '@/store/AuthContext';
import RescheduleRequestsPanel from '@/components/appointments/RescheduleRequestsPanel';
import API_BASE, { uploadUrl } from '@/lib/config';
import { apiErrorMessage } from '@/lib/api-error';
import { initialsOf, localToday, telHref } from '@/lib/format';
import { PageHeader, StatCard, StatusBadge, TableCard, EmptyState, ResponsiveGrid } from '@/components/ui';

const TABS = [
  { key: 'upcoming', label: 'Upcoming' },
  { key: 'today', label: 'Today' },
  { key: 'Pending', label: 'To confirm' },
  { key: 'Confirmed', label: 'Confirmed' },
  { key: 'CheckedIn', label: 'Donated' },
  { key: 'Cancelled', label: 'Cancelled' },
  { key: 'all', label: 'All' },
];
const STATUS_LABEL = { Pending: 'Pending', Confirmed: 'Confirmed', CheckedIn: 'Donated', Cancelled: 'Cancelled' };
const OPEN = ['Pending', 'Confirmed'];

const tomorrowIso = () => {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};
// Appointment dates are plain "YYYY-MM-DD": read them as local days.
const fmtDay = (iso) => {
  const d = new Date(`${iso}T00:00:00`);
  return Number.isNaN(d.getTime()) ? iso || '—' : d.toLocaleDateString('en-US', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });
};

const BloodChip = ({ type }) => (
  <Box component="span" sx={{
    display: 'inline-flex', alignItems: 'center', gap: 0.4, px: 1, height: 24, borderRadius: 1.5,
    // Blood types stay red in every area (the hospital dashboard's primary colour is blue).
    bgcolor: (t) => t.custom.tones.error.bg, color: (t) => t.custom.tones.error.fg, fontWeight: 800, fontSize: '0.78rem',
  }}>
    <WaterDrop sx={{ fontSize: 13 }} />{type || '—'}
  </Box>
);

export default function HospitalAppointments() {
  const { staff, token } = useAuth();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const isPhone = useMediaQuery(theme.breakpoints.down('sm'));

  const [appts, setAppts] = useState(null);
  const [loadError, setLoadError] = useState('');
  const [actionError, setActionError] = useState('');
  const [busyId, setBusyId] = useState(null);
  const [toast, setToast] = useState('');
  const [tab, setTab] = useState('upcoming');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [confirmAction, setConfirmAction] = useState(null); // { type: 'checkin' | 'cancel', appt }

  const headers = useMemo(() => ({ Authorization: `Bearer ${token}` }), [token]);

  const load = useCallback(() => {
    if (!staff?.hospitalId) return;
    setLoadError('');
    axios.get(`${API_BASE}/api/appointments?hospital=${staff.hospitalId}`, { headers })
      .then((res) => setAppts(Array.isArray(res.data) ? res.data : []))
      .catch((err) => setLoadError(apiErrorMessage(err, 'Failed to load appointments.')));
  }, [staff?.hospitalId, headers]);

  useEffect(() => { load(); }, [load]);

  const today = localToday();
  const tomorrow = tomorrowIso();
  const loading = !appts && !loadError;
  const list = useMemo(() => appts || [], [appts]);

  const isUpcoming = useCallback((a) => OPEN.includes(a.status || 'Pending') && a.date >= today, [today]);
  const matchesTab = useCallback((a, key) => {
    const status = a.status || 'Pending';
    if (key === 'all') return true;
    if (key === 'upcoming') return isUpcoming(a);
    if (key === 'today') return a.date === today && status !== 'Cancelled';
    return status === key;
  }, [isUpcoming, today]);

  const counts = useMemo(() => Object.fromEntries(TABS.map((t) => [t.key, list.filter((a) => matchesTab(a, t.key)).length])), [list, matchesTab]);
  const stats = useMemo(() => ({
    today: list.filter((a) => a.date === today && a.status !== 'Cancelled').length,
    pending: list.filter((a) => (a.status || 'Pending') === 'Pending' && a.date >= today).length,
    confirmed: list.filter((a) => a.status === 'Confirmed' && a.date >= today).length,
    donated: list.filter((a) => a.status === 'CheckedIn').length,
  }), [list, today]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    const rows = list.filter((a) => matchesTab(a, tab) &&
      (!q || [a.fullName, a.email, a.phone, a.bloodType, a.date, a.time].some((v) => v?.toLowerCase().includes(q))));
    // Upcoming first, soonest on top; then everything else, newest first.
    return rows.sort((a, b) => {
      const ua = isUpcoming(a), ub = isUpcoming(b);
      if (ua !== ub) return ua ? -1 : 1;
      const byDate = ua ? a.date.localeCompare(b.date) : (b.date || '').localeCompare(a.date || '');
      return byDate || (a.time || '').localeCompare(b.time || '');
    });
  }, [list, tab, search, matchesTab, isUpcoming]);

  useEffect(() => { setPage(0); }, [tab, search]);
  const lastPage = Math.max(0, Math.ceil(filtered.length / rowsPerPage) - 1);
  const currentPage = Math.min(page, lastPage);
  const pageRows = filtered.slice(currentPage * rowsPerPage, (currentPage + 1) * rowsPerPage);

  // Keep the donor photo the list endpoint added when replacing a row with the server's copy.
  const replace = (data) => setAppts((prev) => prev.map((a) => (a._id === data._id ? { donorPhoto: a.donorPhoto, ...data } : a)));

  const run = async (appt, request, success) => {
    setBusyId(appt._id);
    setActionError('');
    try {
      const { data } = await request();
      replace(data);
      setToast(success);
    } catch (err) {
      setActionError(apiErrorMessage(err, 'That didn’t work. Please try again.'));
      load();
    } finally {
      setBusyId(null);
      setConfirmAction(null);
    }
  };
  const confirmAppt = (a) => run(a, () => axios.put(`${API_BASE}/api/appointments/${a._id}`, { status: 'Confirmed' }, { headers }), `${a.fullName}’s appointment confirmed.`);
  const checkIn = (a) => run(a, () => axios.patch(`${API_BASE}/api/appointments/${a._id}/check-in`, {}, { headers }), `${a.fullName} checked in — donation recorded.`);
  const cancel = (a) => run(a, () => axios.put(`${API_BASE}/api/appointments/${a._id}`, { status: 'Cancelled' }, { headers }), `${a.fullName}’s appointment cancelled.`);

  const dayTag = (date) => (date === today ? 'Today' : date === tomorrow ? 'Tomorrow' : null);

  const statusCell = (a) => (
    <Box display="flex" gap={0.75} flexWrap="wrap">
      <StatusBadge status={a.status || 'Pending'} label={STATUS_LABEL[a.status || 'Pending']} size="small" />
      {a.rescheduleRequests?.some((r) => r.status === 'Pending') && (
        <StatusBadge status="change" label="Change requested" tone="warning" size="small" dot={false} />
      )}
    </Box>
  );

  const actions = (a) => {
    const status = a.status || 'Pending';
    const busy = busyId === a._id;
    if (busy) return <CircularProgress size={20} aria-label="Updating" />;
    if (!OPEN.includes(status)) return null;
    return (
      <Box display="flex" gap={1} justifyContent="flex-end" flexWrap="wrap">
        {status === 'Pending' && (
          <Button size="small" variant="outlined" startIcon={<CheckCircle />} onClick={() => confirmAppt(a)}>Confirm</Button>
        )}
        {status === 'Confirmed' && (
          <Button size="small" variant="contained" color="success" startIcon={<HowToReg />}
            onClick={() => setConfirmAction({ type: 'checkin', appt: a })}>Check in</Button>
        )}
        <Tooltip title="Cancel appointment" arrow>
          <IconButton size="small" aria-label={`Cancel ${a.fullName}’s appointment`} onClick={() => setConfirmAction({ type: 'cancel', appt: a })}
            sx={{ color: 'text.secondary', '&:hover': { color: 'error.main' } }}>
            <EventBusy fontSize="small" />
          </IconButton>
        </Tooltip>
      </Box>
    );
  };

  const donorCell = (a, size = 38) => (
    <Box display="flex" alignItems="center" gap={1.25} minWidth={0}>
      <Avatar src={uploadUrl(a.donorPhoto)} alt={a.fullName}
        sx={{ width: size, height: size, fontSize: size * 0.36, fontWeight: 700, bgcolor: (t) => t.custom.tones.primary.bg, color: 'primary.main' }}>
        {initialsOf(a.fullName)}
      </Avatar>
      <Box minWidth={0}>
        <Typography fontWeight={700} fontSize="0.88rem" noWrap>{a.fullName}</Typography>
        <Typography fontSize="0.74rem" color="text.secondary" noWrap>{a.phone || a.email}</Typography>
      </Box>
    </Box>
  );

  const whenCell = (a) => (
    <Box>
      <Box display="flex" alignItems="center" gap={0.75}>
        <Typography fontSize="0.85rem" fontWeight={600} noWrap>{fmtDay(a.date)}</Typography>
        {dayTag(a.date) && OPEN.includes(a.status || 'Pending') && (
          <StatusBadge status="day" label={dayTag(a.date)} tone={a.date === today ? 'error' : 'info'} size="small" dot={false} />
        )}
      </Box>
      <Typography fontSize="0.76rem" color="text.secondary">{a.time || '—'}</Typography>
    </Box>
  );

  const tabsBar = (
    <Box display="flex" flexDirection="column" gap={1.5}>
      <Tabs value={tab} onChange={(_, v) => setTab(v)} variant="scrollable" scrollButtons="auto" sx={{ minHeight: 40, mx: -1 }}>
        {TABS.map((t) => (
          <Tab key={t.key} value={t.key} sx={{ minHeight: 40, textTransform: 'none', fontWeight: 600 }}
            label={<Box display="flex" alignItems="center" gap={0.75}>{t.label}
              <Box component="span" sx={{ px: 0.8, minWidth: 20, height: 20, borderRadius: 10, fontSize: '0.7rem', fontWeight: 700, display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                bgcolor: tab === t.key ? 'primary.main' : 'action.hover', color: tab === t.key ? '#fff' : 'text.secondary' }}>
                {loading ? '·' : counts[t.key]}
              </Box>
            </Box>} />
        ))}
      </Tabs>
      <TextField size="small" placeholder="Search donor, phone, blood type, date…" value={search} onChange={(e) => setSearch(e.target.value)}
        sx={{ maxWidth: { sm: 420 } }}
        slotProps={{ input: {
          startAdornment: <InputAdornment position="start"><Search fontSize="small" /></InputAdornment>,
          endAdornment: search && <InputAdornment position="end"><IconButton size="small" aria-label="Clear search" onClick={() => setSearch('')}><Close fontSize="small" /></IconButton></InputAdornment>,
        } }} />
    </Box>
  );

  const empty = (
    <EmptyState
      icon={search ? <FilterAltOff /> : <EventAvailable />}
      title={search ? 'No appointments match your search' : tab === 'upcoming' ? 'No upcoming appointments' : 'Nothing here'}
      description={search ? 'Try another name, phone number or date.' : 'Appointments donors book at your hospital appear here.'}
      action={search ? <Button size="small" variant="outlined" onClick={() => setSearch('')}>Clear search</Button>
        : tab !== 'all' ? <Button size="small" variant="outlined" onClick={() => setTab('all')}>Show all</Button> : null}
    />
  );

  const ca = confirmAction?.appt;

  return (
    <Box>
      <PageHeader
        title="Appointments"
        subtitle="Confirm bookings, check donors in and handle change requests."
        actions={<>
          <Button variant="outlined" startIcon={<Refresh />} onClick={load} disabled={loading}>Refresh</Button>
          <Button variant="contained" startIcon={<QrCodeScanner />} component={Link} href="/dashboard/hospital/scan">Scan Donor QR</Button>
        </>}
      />

      <ResponsiveGrid min={150} gap={{ xs: 1.5, md: 2.5 }} sx={{ mb: 3 }}>
        <StatCard label="Today" value={stats.today} icon={<Today />} tone="error" loading={loading} hint={isPhone ? undefined : 'Booked for today'} />
        <StatCard label="To confirm" value={stats.pending} icon={<HourglassEmpty />} tone="warning" loading={loading} hint={isPhone ? undefined : 'Waiting for you'} />
        <StatCard label="Confirmed" value={stats.confirmed} icon={<EventAvailable />} tone="info" loading={loading} hint={isPhone ? undefined : 'Ready for check-in'} />
        <StatCard label="Donated" value={stats.donated} icon={<Favorite />} tone="success" loading={loading} hint={isPhone ? undefined : 'Checked in, all time'} />
      </ResponsiveGrid>

      {actionError && <Alert severity="error" onClose={() => setActionError('')} sx={{ mb: 2 }}>{actionError}</Alert>}

      {appts && (
        <RescheduleRequestsPanel appointments={appts} token={token} onUpdated={replace} />
      )}

      <TableCard minWidth={isMobile ? 0 : 820} toolbar={tabsBar}>
        {loadError ? (
          <EmptyState icon={<WarningAmber />} title="Couldn’t load appointments" description={loadError}
            action={<Button size="small" variant="contained" startIcon={<Refresh />} onClick={load}>Try again</Button>} />
        ) : isMobile ? (
          <Box sx={{ p: 2, display: 'flex', flexDirection: 'column', gap: 1.5 }}>
            {loading ? [0, 1, 2].map((i) => <Skeleton key={i} variant="rounded" height={120} />)
              : filtered.length === 0 ? empty : pageRows.map((a) => (
                <Paper key={a._id} variant="outlined" sx={{ p: 2, borderRadius: 3 }}>
                  <Box display="flex" alignItems="center" justifyContent="space-between" gap={1}>
                    {donorCell(a, 42)}
                    <BloodChip type={a.bloodType} />
                  </Box>
                  <Box display="flex" alignItems="flex-end" justifyContent="space-between" gap={1} mt={1.5} flexWrap="wrap">
                    {whenCell(a)}
                    {statusCell(a)}
                  </Box>
                  {OPEN.includes(a.status || 'Pending') && (
                    <Box mt={1.5} pt={1.5} borderTop={1} borderColor="divider">{actions(a)}</Box>
                  )}
                </Paper>
              ))}
          </Box>
        ) : (
          <Table size="small">
            <TableHead>
              <TableRow>
                {['Donor', 'Blood Type', 'Date & Time', 'Status', 'Actions'].map((h) => (
                  <TableCell key={h} align={h === 'Actions' ? 'right' : 'left'} sx={{ py: 1.5, whiteSpace: 'nowrap' }}>{h}</TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? [0, 1, 2, 3].map((i) => (
                <TableRow key={i}><TableCell colSpan={5}><Skeleton variant="rounded" height={36} /></TableCell></TableRow>
              )) : filtered.length === 0 ? (
                <TableRow><TableCell colSpan={5} sx={{ border: 0 }}>{empty}</TableCell></TableRow>
              ) : pageRows.map((a) => (
                <TableRow key={a._id} hover sx={a.date === today && OPEN.includes(a.status || 'Pending') ? { boxShadow: (t) => `inset 3px 0 0 ${t.palette.primary.main}` } : undefined}>
                  <TableCell sx={{ py: 1.25, maxWidth: 260 }}>{donorCell(a)}</TableCell>
                  <TableCell><BloodChip type={a.bloodType} /></TableCell>
                  <TableCell>{whenCell(a)}</TableCell>
                  <TableCell>{statusCell(a)}</TableCell>
                  <TableCell align="right" sx={{ whiteSpace: 'nowrap' }}>{actions(a)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
        {!loadError && !loading && filtered.length > 0 && (
          <TablePagination component="div" count={filtered.length} page={currentPage} onPageChange={(_, p) => setPage(p)}
            rowsPerPage={rowsPerPage} onRowsPerPageChange={(e) => { setRowsPerPage(parseInt(e.target.value, 10)); setPage(0); }}
            rowsPerPageOptions={[10, 25, 50]} labelRowsPerPage={isPhone ? 'Rows' : 'Rows per page'}
            sx={{ borderTop: 1, borderColor: 'divider' }} />
        )}
      </TableCard>

      {/* Check-in records a donation and can't be undone; cancelling notifies nobody automatically — confirm both. */}
      <Dialog open={!!confirmAction} onClose={() => !busyId && setConfirmAction(null)} maxWidth="xs" fullWidth>
        {ca && (
          <>
            <DialogTitle sx={{ fontWeight: 800 }}>
              {confirmAction.type === 'checkin' ? `Check in ${ca.fullName}?` : 'Cancel this appointment?'}
            </DialogTitle>
            <DialogContent>
              <Box display="flex" alignItems="center" gap={1.5} mb={2}>
                {donorCell(ca, 44)}
                <Box ml="auto"><BloodChip type={ca.bloodType} /></Box>
              </Box>
              <Typography variant="body2" color="text.secondary" mb={1}>
                {fmtDay(ca.date)} at {ca.time}
              </Typography>
              <Box display="flex" gap={2} flexWrap="wrap" mb={1.5}>
                {ca.phone && <Button size="small" startIcon={<Phone />} href={telHref(ca.phone)} sx={{ color: 'text.secondary', px: 0 }}>{ca.phone}</Button>}
                {ca.email && <Button size="small" startIcon={<Email />} href={`mailto:${ca.email}`} sx={{ color: 'text.secondary', px: 0, textTransform: 'none' }}>{ca.email}</Button>}
              </Box>
              <Alert severity={confirmAction.type === 'checkin' ? 'info' : 'warning'} sx={{ borderRadius: 2 }}>
                {confirmAction.type === 'checkin'
                  ? 'This records a completed donation on the donor’s record and can’t be undone.'
                  : 'The donor will see the appointment as cancelled. Let them know if you can.'}
              </Alert>
            </DialogContent>
            <DialogActions sx={{ px: 3, pb: 2.5 }}>
              <Button color="inherit" onClick={() => setConfirmAction(null)} disabled={!!busyId}>Back</Button>
              {confirmAction.type === 'checkin' ? (
                <Button variant="contained" color="success" onClick={() => checkIn(ca)} disabled={!!busyId}
                  startIcon={busyId ? <CircularProgress size={16} color="inherit" /> : <HowToReg />}>Check in</Button>
              ) : (
                <Button variant="contained" color="error" onClick={() => cancel(ca)} disabled={!!busyId}
                  startIcon={busyId ? <CircularProgress size={16} color="inherit" /> : <EventBusy />}>Cancel appointment</Button>
              )}
            </DialogActions>
          </>
        )}
      </Dialog>

      <Snackbar open={!!toast} autoHideDuration={3500} onClose={() => setToast('')} message={toast} anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }} />
    </Box>
  );
}
