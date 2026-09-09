'use client';
import React, { useEffect, useState } from 'react';
import { Box, Typography, Grid, Paper, CircularProgress } from '@mui/material';
import { LocalHospital, Inventory2, CalendarMonth, QrCodeScanner } from '@mui/icons-material';
import Link from 'next/link';
import axios from 'axios';
import { useAuth } from '@/store/AuthContext';
import API_BASE from '@/lib/config';

const StatCard = ({ icon, label, value, color, href }) => (
  <Paper component={Link} href={href} elevation={0} sx={{
    p: 3, borderRadius: 3, border: '1px solid', borderColor: 'divider', textDecoration: 'none',
    display: 'flex', alignItems: 'center', gap: 2, transition: 'all 0.15s',
    '&:hover': { borderColor: color, boxShadow: `0 4px 16px ${color}22` },
  }}>
    <Box sx={{ width: 48, height: 48, borderRadius: 2.5, bgcolor: `${color}18`, color, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      {icon}
    </Box>
    <Box>
      <Typography fontSize="1.6rem" fontWeight={800} lineHeight={1.1}>{value}</Typography>
      <Typography fontSize="0.8rem" color="text.secondary">{label}</Typography>
    </Box>
  </Paper>
);

export default function HospitalOverview() {
  const { staff, token } = useAuth();
  const [stats, setStats] = useState(null);

  useEffect(() => {
    if (!staff?.hospitalId) return;
    const headers = { Authorization: `Bearer ${token}` };
    Promise.all([
      axios.get(`${API_BASE}/api/requests?hospital=${staff.hospitalId}`),
      axios.get(`${API_BASE}/api/inventory?hospital=${staff.hospitalId}`),
      axios.get(`${API_BASE}/api/appointments?hospital=${staff.hospitalId}`),
    ]).then(([requests, inventory, appointments]) => {
      setStats({
        pendingRequests: requests.data.filter(r => r.status === 'Pending').length,
        totalUnits: inventory.data.reduce((s, i) => s + i.units, 0),
        upcomingAppointments: appointments.data.filter(a => a.status === 'Pending' || a.status === 'Confirmed').length,
      });
    }).catch(() => setStats({ pendingRequests: 0, totalUnits: 0, upcomingAppointments: 0 }));
  }, [staff, token]);

  return (
    <Box>
      <Typography variant="h5" fontWeight={800} mb={0.5}>Welcome, {staff?.fullName}</Typography>
      <Typography color="text.secondary" mb={4}>Here's what's happening at your hospital today.</Typography>

      {!stats ? (
        <CircularProgress size={28} color="info" />
      ) : (
        <Grid container spacing={2.5}>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard icon={<LocalHospital />} label="Pending Requests" value={stats.pendingRequests} color="#d32f2f" href="/dashboard/hospital/requests" />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard icon={<Inventory2 />} label="Total Blood Units" value={stats.totalUnits} color="#1565c0" href="/dashboard/hospital/inventory" />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard icon={<CalendarMonth />} label="Upcoming Appointments" value={stats.upcomingAppointments} color="#2e7d32" href="/dashboard/hospital/appointments" />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard icon={<QrCodeScanner />} label="Check In a Donor" value="Scan" color="#6a1b9a" href="/dashboard/hospital/scan" />
          </Grid>
        </Grid>
      )}
    </Box>
  );
}
