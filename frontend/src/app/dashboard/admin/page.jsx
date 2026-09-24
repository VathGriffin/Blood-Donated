'use client';
import { useState, useEffect, useCallback, useMemo } from 'react';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import {
  Alert, Box, Button, CircularProgress, IconButton, Skeleton, Table, TableBody, TableCell,
  TableHead, TableRow, Tooltip, Typography,
} from '@mui/material';
import FavoriteIcon from '@mui/icons-material/Favorite';
import WaterDropIcon from '@mui/icons-material/WaterDrop';
import DescriptionIcon from '@mui/icons-material/Description';
import DomainIcon from '@mui/icons-material/Domain';
import RefreshIcon from '@mui/icons-material/Refresh';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import axios from 'axios';
import API_BASE from '@/lib/config';
import { useAuth } from '@/store/AuthContext';
import { PageHeader, SectionCard, StatCard, StatusBadge, TableCard, EmptyState, ResponsiveGrid } from '@/components/ui';
import LowStockAlert from '@/components/inventory/LowStockAlert';
import { STOCK, completeByType, summarize } from '@/lib/inventory';
import { formatDate, shortRequestId } from '@/lib/format';


// recharts is large and the charts sit below the stat cards, so load them on demand.
const chartSlot = (h) => {
    const ChartSlot = () => <Skeleton variant="rounded" height={h} />;
    return ChartSlot;
};
const StockBarChart = dynamic(() => import('@/components/inventory/StockCharts').then((m) => m.StockBarChart), { ssr: false, loading: chartSlot(300) });
const StockDonut = dynamic(() => import('@/components/inventory/StockCharts').then((m) => m.StockDonut), { ssr: false, loading: chartSlot(200) });

// Two-column row on wide screens (chart | side card), stacked below.
const splitRow = { display: 'grid', gridTemplateColumns: { xs: 'minmax(0,1fr)', lg: 'minmax(0,2fr) minmax(0,1fr)' }, gap: { xs: 2, md: 3 }, mt: { xs: 2, md: 3 } };

const Dashboard = () => {
  const { token } = useAuth();
  const [stats, setStats] = useState(null);
  const [inventory, setInventory] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    const [s, inv] = await Promise.allSettled([
      axios.get(`${API_BASE}/api/stats`, { headers: { Authorization: `Bearer ${token}` } }),
      axios.get(`${API_BASE}/api/inventory`),
    ]);
    if (s.status === 'fulfilled') setStats(s.value.data);
    else setError(s.reason?.response?.data?.error || 'Failed to load dashboard data.');
    if (inv.status === 'fulfilled') setInventory(inv.value.data);
    setLoading(false);
  }, [token]);

  useEffect(() => { load(); }, [load]);

  const stock = useMemo(() => completeByType(inventory || []), [inventory]);
  const totals = useMemo(() => summarize(inventory || []), [inventory]);
  const donut = ['adequate', 'low', 'critical']
    .map((k) => ({ key: k, name: STOCK[k].label, value: totals[k].units, color: STOCK[k].color }))
    .filter((d) => d.value > 0);

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

  const requests = stats?.requests;

  return (
    <Box>
      <PageHeader
        title="Admin Dashboard"
        subtitle="Overview of blood donation system"
        actions={
          <>
            <Button variant="outlined" color="inherit" size="small" startIcon={<FileDownloadIcon />} onClick={handleExport} disabled={!stats}
              sx={{ borderColor: 'divider', color: 'text.secondary' }}>
              Export CSV
            </Button>
            <Tooltip title="Refresh data">
              <span>
                <IconButton onClick={load} disabled={loading} size="small" aria-label="Refresh data"
                  sx={{ border: 1, borderColor: 'divider', borderRadius: '10px', width: 34, height: 34 }}>
                  {loading ? <CircularProgress size={15} /> : <RefreshIcon sx={{ fontSize: 18 }} />}
                </IconButton>
              </span>
            </Tooltip>
          </>
        }
      />

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} action={<Button color="inherit" size="small" onClick={load}>Retry</Button>}>{error}</Alert>
      )}

      <ResponsiveGrid min={230}>
        <StatCard label="Total Donors" value={stats?.donors.total?.toLocaleString()} loading={!stats && loading}
          hint={stats && `${stats.donors.available} available`} icon={<FavoriteIcon />} tone="primary" />
        <StatCard label="Total Donations" value={stats?.donations.total?.toLocaleString()} loading={!stats && loading}
          hint="Completed donations" icon={<WaterDropIcon />} tone="primary" />
        <StatCard label="Blood Requests" value={requests?.total?.toLocaleString()} loading={!stats && loading} icon={<DescriptionIcon />} tone="primary"
          hint={requests && (
            <>
              {requests.pending} pending
              {requests.critical > 0 && <Box component="span" sx={{ color: 'error.main', fontWeight: 700, ml: 1 }}>· {requests.critical} critical</Box>}
            </>
          )} />
        <StatCard label="Partner Hospitals" value={stats?.hospitals.total?.toLocaleString()} loading={!stats && loading}
          hint="Registered partners" icon={<DomainIcon />} tone="info" href="/dashboard/admin/hospitals" />
      </ResponsiveGrid>

      <Box sx={splitRow}>
        <SectionCard title="Blood Inventory by Type" subtitle="Units in stock, coloured by stock level">
          {!inventory ? <Skeleton variant="rounded" height={300} /> : (
            <>
              <StockBarChart stock={stock} />
              <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', mt: 1, justifyContent: 'center' }}>
                {['adequate', 'low', 'critical'].map((k) => (
                  <Box key={k} sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                    <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: STOCK[k].color }} />
                    <Typography variant="caption" color="text.secondary">{STOCK[k].label}</Typography>
                  </Box>
                ))}
              </Box>
            </>
          )}
        </SectionCard>

        <SectionCard title="Inventory Status" subtitle="Share of units by stock level">
          {!inventory ? <Skeleton variant="rounded" height={300} /> : totals.totalUnits === 0 ? (
            <EmptyState icon={<WaterDropIcon />} title="No stock recorded" description="Units appear here once inventory is entered." />
          ) : (
            <Box sx={{ display: 'flex', alignItems: 'center', flexDirection: 'column', gap: 2 }}>
              <StockDonut slices={donut} totalUnits={totals.totalUnits} />
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.25, width: '100%' }}>
                {donut.map((d) => (
                  <Box key={d.key} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: d.color, flexShrink: 0 }} />
                    <Typography variant="body2" sx={{ fontWeight: 600, flexGrow: 1 }}>{d.name}</Typography>
                    <Typography variant="body2" color="text.secondary">
                      {Math.round((d.value / totals.totalUnits) * 100)}% ({d.value})
                    </Typography>
                  </Box>
                ))}
              </Box>
            </Box>
          )}
        </SectionCard>
      </Box>

      <Box sx={splitRow}>
        <TableCard
          title="Recent Blood Requests"
          actions={<Button component={Link} href="/dashboard/admin/requests" size="small" sx={{ fontWeight: 600 }}>View All</Button>}
          minWidth={620}
        >
          <Table size="small">
            <TableHead>
              <TableRow>
                {['ID', 'Hospital', 'Blood Type', 'Units', 'Urgency', 'Status', 'Date'].map((h) => <TableCell key={h}>{h}</TableCell>)}
              </TableRow>
            </TableHead>
            <TableBody>
              {!stats && loading && [0, 1, 2].map((i) => (
                <TableRow key={i}><TableCell colSpan={7}><Skeleton variant="text" /></TableCell></TableRow>
              ))}
              {stats && stats.recentRequests.length === 0 && (
                <TableRow><TableCell colSpan={7}><EmptyState icon={<DescriptionIcon />} title="No requests yet" description="Blood requests will appear here as they come in." /></TableCell></TableRow>
              )}
              {stats?.recentRequests.map((r) => (
                <TableRow key={r._id} hover>
                  <TableCell sx={{ fontWeight: 600 }}>{shortRequestId(r._id)}</TableCell>
                  <TableCell sx={{ maxWidth: 180 }}><Typography noWrap variant="body2">{r.hospitalName}</Typography></TableCell>
                  <TableCell sx={{ color: 'primary.main', fontWeight: 800 }}>{r.bloodType}</TableCell>
                  <TableCell>{r.unitsNeeded ?? '—'}</TableCell>
                  <TableCell><StatusBadge status={r.urgency} size="small" dot={false} /></TableCell>
                  <TableCell><StatusBadge status={r.status} size="small" /></TableCell>
                  <TableCell sx={{ whiteSpace: 'nowrap' }}>{formatDate(r.createdAt)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableCard>

        <LowStockAlert items={inventory} href="/dashboard/admin/inventory" />
      </Box>
    </Box>
  );
};

export default Dashboard;
