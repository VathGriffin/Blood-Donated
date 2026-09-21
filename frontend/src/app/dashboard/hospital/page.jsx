'use client';
import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  Alert, Box, Button, Skeleton, Table, TableBody, TableCell, TableHead, TableRow, Typography,
} from '@mui/material';
import DescriptionIcon from '@mui/icons-material/Description';
import WaterDropIcon from '@mui/icons-material/WaterDrop';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import QrCodeScannerIcon from '@mui/icons-material/QrCodeScanner';
import axios from 'axios';
import { useAuth } from '@/store/AuthContext';
import API_BASE from '@/lib/config';
import { PageHeader, StatCard, StatusBadge, TableCard, EmptyState, ResponsiveGrid } from '@/components/ui';
import LowStockAlert from '@/components/inventory/LowStockAlert';
import { summarize } from '@/lib/inventory';
import { formatDate, shortRequestId } from '@/lib/format';


export default function HospitalOverview() {
  const { staff, token } = useAuth();
  const [data, setData] = useState(null); // { requests, inventory, appointments }
  const [error, setError] = useState('');

  useEffect(() => {
    if (!staff?.hospitalId) return;
    const h = staff.hospitalId;
    Promise.all([
      axios.get(`${API_BASE}/api/requests?hospital=${h}`, { headers: { Authorization: `Bearer ${token}` } }),
      axios.get(`${API_BASE}/api/inventory?hospital=${h}`),
      axios.get(`${API_BASE}/api/appointments?hospital=${h}`, { headers: { Authorization: `Bearer ${token}` } }),
    ])
      .then(([requests, inventory, appointments]) => setData({ requests: requests.data, inventory: inventory.data, appointments: appointments.data }))
      .catch(() => setError('Failed to load your hospital\'s data.'));
  }, [staff, token]);

  const totals = useMemo(() => summarize(data?.inventory || []), [data]);
  const pending = data?.requests.filter((r) => r.status === 'Pending').length ?? 0;
  const critical = data?.requests.filter((r) => r.status === 'Pending' && r.urgency === 'Critical').length ?? 0;
  const upcoming = data?.appointments.filter((a) => a.status === 'Pending' || a.status === 'Confirmed').length ?? 0;
  const recent = useMemo(
    () => [...(data?.requests || [])].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 5),
    [data]
  );
  const loading = !data && !error;

  return (
    <Box>
      <PageHeader title="Hospital Dashboard" subtitle={`Welcome back, ${staff?.fullName || ''}. Here's what's happening at your hospital.`} />
      {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}

      <ResponsiveGrid min={230}>
        <StatCard label="Pending Requests" value={pending} loading={loading} icon={<DescriptionIcon />} tone="primary" href="/dashboard/hospital/requests"
          hint={critical > 0 ? <Box component="span" sx={{ color: 'error.main', fontWeight: 700 }}>{critical} critical</Box> : 'Awaiting review'} />
        <StatCard label="Total Blood Units" value={totals.totalUnits} loading={loading} icon={<WaterDropIcon />} tone="success" href="/dashboard/hospital/inventory"
          hint="In your inventory" />
        <StatCard label="Appointments" value={upcoming} loading={loading} icon={<CalendarMonthIcon />} tone="info" href="/dashboard/hospital/appointments"
          hint="Upcoming: pending or confirmed" />
        <StatCard label="Check In a Donor" value="Scan" icon={<QrCodeScannerIcon />} tone="warning" href="/dashboard/hospital/scan" hint="Verify a donor's QR card" />
      </ResponsiveGrid>

      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: 'minmax(0,1fr)', lg: 'minmax(0,2fr) minmax(0,1fr)' }, gap: { xs: 2, md: 3 }, mt: { xs: 2, md: 3 } }}>
        <TableCard
          title="Recent Blood Requests"
          actions={<Button component={Link} href="/dashboard/hospital/requests" size="small" sx={{ fontWeight: 600 }}>View All</Button>}
          minWidth={560}
        >
          <Table size="small">
            <TableHead>
              <TableRow>{['ID', 'Patient', 'Blood Type', 'Units', 'Urgency', 'Status', 'Date'].map((c) => <TableCell key={c}>{c}</TableCell>)}</TableRow>
            </TableHead>
            <TableBody>
              {loading && [0, 1, 2].map((i) => <TableRow key={i}><TableCell colSpan={7}><Skeleton variant="text" /></TableCell></TableRow>)}
              {data && recent.length === 0 && (
                <TableRow><TableCell colSpan={7}><EmptyState icon={<DescriptionIcon />} title="No requests yet" description="Requests assigned to your hospital will appear here." /></TableCell></TableRow>
              )}
              {recent.map((r) => (
                <TableRow key={r._id} hover>
                  <TableCell sx={{ fontWeight: 600 }}>{shortRequestId(r._id)}</TableCell>
                  <TableCell><Typography noWrap variant="body2" sx={{ maxWidth: 160 }}>{r.patientName}</Typography></TableCell>
                  <TableCell sx={{ color: 'primary.main', fontWeight: 800 }}>{r.bloodType}</TableCell>
                  <TableCell>{r.unitsNeeded}</TableCell>
                  <TableCell><StatusBadge status={r.urgency} size="small" dot={false} /></TableCell>
                  <TableCell><StatusBadge status={r.status} size="small" /></TableCell>
                  <TableCell sx={{ whiteSpace: 'nowrap' }}>{formatDate(r.createdAt)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableCard>

        <LowStockAlert items={data ? data.inventory : null} href="/dashboard/hospital/inventory" />
      </Box>
    </Box>
  );
}
