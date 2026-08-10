'use client';
import React, { useEffect, useState, useCallback } from 'react';
import {
  Box, Typography, Grid, Paper, useTheme, Skeleton, Alert,
  Chip, CircularProgress, Divider,
} from '@mui/material';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend, LineChart, Line, AreaChart, Area,
} from 'recharts';
import PeopleIcon from '@mui/icons-material/People';
import BloodtypeIcon from '@mui/icons-material/Bloodtype';
import FavoriteIcon from '@mui/icons-material/Favorite';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import API_BASE from '@/lib/config';
import { useAuth } from '@/store/AuthContext';

const BLOOD_COLORS = ['#dc2626','#b91c1c','#7c3aed','#6d28d9','#2563eb','#1d4ed8','#059669','#047857'];
const STATUS_COLORS = { pending: '#d97706', fulfilled: '#16a34a', rejected: '#dc2626', approved: '#2563eb' };

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

function StatCard({ icon, label, value, sub, color, loading }) {
  const theme  = useTheme();
  const isDark = theme.palette.mode === 'dark';
  return (
    <Paper elevation={0} sx={{
      p: 3, borderRadius: '16px',
      border: `1px solid ${isDark ? '#1f1f1f' : '#e5e5e5'}`,
      bgcolor: isDark ? '#111' : '#fff',
      display: 'flex', gap: 2, alignItems: 'flex-start',
    }}>
      <Box sx={{
        width: 48, height: 48, borderRadius: '12px', flexShrink: 0,
        bgcolor: `${color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        {React.cloneElement(icon, { sx: { fontSize: 22, color } })}
      </Box>
      <Box flex={1}>
        <Typography variant='caption' color='text.secondary' fontWeight={600} textTransform='uppercase' letterSpacing='0.06em'>
          {label}
        </Typography>
        {loading ? <Skeleton width={80} height={36} /> : (
          <Typography sx={{ fontSize: '1.8rem', fontWeight: 900, letterSpacing: '-0.03em', lineHeight: 1.1, color }}>
            {typeof value === 'number' ? value.toLocaleString() : value}
          </Typography>
        )}
        {sub && <Typography variant='caption' color='text.secondary' display='block' mt={0.3}>{sub}</Typography>}
      </Box>
    </Paper>
  );
}

export default function Analytics() {
  const theme  = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const { token } = useAuth();

  const [data, setData]     = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]   = useState('');

  const card   = isDark ? '#111111' : '#ffffff';
  const border = isDark ? '#1f1f1f' : '#e5e5e5';

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res  = await fetch(`${API_BASE}/api/analytics`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.message || 'Failed to load analytics');
      setData(json);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => { load(); }, [load]);

  const ov = data?.overview || {};
  const ch = data?.charts   || {};

  // Format monthly trend data
  const monthlyTrend = (() => {
    const map = {};
    (ch.monthlyDonors || []).forEach(d => {
      const key = `${d._id.year}-${String(d._id.month).padStart(2,'0')}`;
      map[key] = { ...map[key], donors: d.count, label: MONTHS[d._id.month - 1] };
    });
    (ch.monthlyRequests || []).forEach(d => {
      const key = `${d._id.year}-${String(d._id.month).padStart(2,'0')}`;
      map[key] = { ...map[key], requests: d.count, label: MONTHS[d._id.month - 1] };
    });
    return Object.values(map).map(v => ({ ...v, donors: v.donors || 0, requests: v.requests || 0 }));
  })();

  return (
    <Box>
      {/* Header */}
      <Box display='flex' justifyContent='space-between' alignItems='center' mb={4}>
        <Box>
          <Typography sx={{ fontSize: '1.6rem', fontWeight: 800, letterSpacing: '-0.025em',
            color: isDark ? '#f5f5f5' : '#111', lineHeight: 1.2 }}>
            Analytics
          </Typography>
          <Typography variant='body2' color='text.secondary' mt={0.5}>
            Real-time insights across donors, requests, and inventory
          </Typography>
        </Box>
        {ov.fulfillmentRate !== undefined && (
          <Chip
            icon={<CheckCircleIcon sx={{ fontSize: '14px !important', color: '#16a34a !important' }} />}
            label={`${ov.fulfillmentRate}% Fulfillment Rate`}
            sx={{ bgcolor: isDark ? 'rgba(22,163,74,0.12)' : '#f0fdf4', color: '#16a34a', fontWeight: 700, fontSize: '0.82rem' }}
          />
        )}
      </Box>

      {error && <Alert severity='error' sx={{ mb: 3, borderRadius: 2 }}>{error}</Alert>}

      {/* KPI Cards */}
      <Grid container spacing={2.5} mb={4}>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard icon={<PeopleIcon />} label='Total Donors' loading={loading}
            value={ov.totalDonors} sub={`+${ov.newDonorsThisMonth || 0} this month`} color='#2563eb' />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard icon={<FavoriteIcon />} label='Active Donors' loading={loading}
            value={ov.activeDonors} sub='Available to donate now' color='#16a34a' />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard icon={<BloodtypeIcon />} label='Total Requests' loading={loading}
            value={ov.totalRequests} sub={`${ov.pendingRequests || 0} pending`} color='#dc2626' />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard icon={<WarningAmberIcon />} label='Urgent Pending' loading={loading}
            value={ov.urgentRequests} sub='Critical blood requests' color='#d97706' />
        </Grid>
      </Grid>

      {/* Charts row 1 */}
      <Grid container spacing={2.5} mb={2.5}>
        {/* Monthly trend */}
        <Grid item xs={12} md={8}>
          <Paper elevation={0} sx={{ p: 3, borderRadius: '16px', border: `1px solid ${border}`, bgcolor: card, height: '100%' }}>
            <Typography fontWeight={700} fontSize='0.95rem' mb={0.5}>Monthly Activity</Typography>
            <Typography variant='caption' color='text.secondary' display='block' mb={2.5}>
              New donors vs blood requests over the past 6 months
            </Typography>
            {loading ? <Skeleton variant='rounded' height={220} /> : (
              <ResponsiveContainer width='100%' height={220}>
                <AreaChart data={monthlyTrend} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id='gDonors' x1='0' y1='0' x2='0' y2='1'>
                      <stop offset='5%' stopColor='#2563eb' stopOpacity={0.15} />
                      <stop offset='95%' stopColor='#2563eb' stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id='gRequests' x1='0' y1='0' x2='0' y2='1'>
                      <stop offset='5%' stopColor='#dc2626' stopOpacity={0.15} />
                      <stop offset='95%' stopColor='#dc2626' stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray='3 3' stroke={isDark ? '#1f1f1f' : '#f0f0f0'} vertical={false} />
                  <XAxis dataKey='label' tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={{ borderRadius: 10, fontSize: 12, border: `1px solid ${border}`, backgroundColor: card }} />
                  <Legend />
                  <Area type='monotone' dataKey='donors' name='New Donors' stroke='#2563eb' strokeWidth={2} fill='url(#gDonors)' dot={false} />
                  <Area type='monotone' dataKey='requests' name='Requests' stroke='#dc2626' strokeWidth={2} fill='url(#gRequests)' dot={false} />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </Paper>
        </Grid>

        {/* Request Status Pie */}
        <Grid item xs={12} md={4}>
          <Paper elevation={0} sx={{ p: 3, borderRadius: '16px', border: `1px solid ${border}`, bgcolor: card, height: '100%' }}>
            <Typography fontWeight={700} fontSize='0.95rem' mb={0.5}>Request Status</Typography>
            <Typography variant='caption' color='text.secondary' display='block' mb={2}>
              Breakdown by current status
            </Typography>
            {loading ? <Skeleton variant='circular' width={180} height={180} sx={{ mx: 'auto' }} /> : (
              <ResponsiveContainer width='100%' height={220}>
                <PieChart>
                  <Pie data={ch.requestsByStatus || []} dataKey='count' nameKey='status' cx='50%' cy='50%'
                    innerRadius={55} outerRadius={85} paddingAngle={3}>
                    {(ch.requestsByStatus || []).map((entry, i) => (
                      <Cell key={i} fill={STATUS_COLORS[entry.status] || BLOOD_COLORS[i % BLOOD_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(v, n) => [v, n.charAt(0).toUpperCase() + n.slice(1)]}
                    contentStyle={{ borderRadius: 10, fontSize: 12, border: `1px solid ${border}`, backgroundColor: card }} />
                  <Legend formatter={v => v.charAt(0).toUpperCase() + v.slice(1)} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </Paper>
        </Grid>
      </Grid>

      {/* Charts row 2 */}
      <Grid container spacing={2.5} mb={2.5}>
        {/* Donors by blood type */}
        <Grid item xs={12} md={6}>
          <Paper elevation={0} sx={{ p: 3, borderRadius: '16px', border: `1px solid ${border}`, bgcolor: card }}>
            <Typography fontWeight={700} fontSize='0.95rem' mb={0.5}>Donors by Blood Type</Typography>
            <Typography variant='caption' color='text.secondary' display='block' mb={2.5}>Registered donor distribution</Typography>
            {loading ? <Skeleton variant='rounded' height={200} /> : (
              <ResponsiveContainer width='100%' height={200}>
                <BarChart data={ch.donorsByBloodType || []} barSize={24} margin={{ left: -20 }}>
                  <CartesianGrid strokeDasharray='3 3' stroke={isDark ? '#1f1f1f' : '#f0f0f0'} vertical={false} />
                  <XAxis dataKey='bloodType' tick={{ fontSize: 11, fontWeight: 700 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={{ borderRadius: 10, fontSize: 12, border: `1px solid ${border}`, backgroundColor: card }} />
                  <Bar dataKey='count' name='Donors' radius={[5, 5, 0, 0]}>
                    {(ch.donorsByBloodType || []).map((_, i) => (
                      <Cell key={i} fill={BLOOD_COLORS[i % BLOOD_COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </Paper>
        </Grid>

        {/* Inventory */}
        <Grid item xs={12} md={6}>
          <Paper elevation={0} sx={{ p: 3, borderRadius: '16px', border: `1px solid ${border}`, bgcolor: card }}>
            <Typography fontWeight={700} fontSize='0.95rem' mb={0.5}>Inventory Levels</Typography>
            <Typography variant='caption' color='text.secondary' display='block' mb={2.5}>Current units per blood type</Typography>
            {loading ? <Skeleton variant='rounded' height={200} /> : (
              <ResponsiveContainer width='100%' height={200}>
                <BarChart data={ch.inventory || []} barSize={24} margin={{ left: -20 }}>
                  <CartesianGrid strokeDasharray='3 3' stroke={isDark ? '#1f1f1f' : '#f0f0f0'} vertical={false} />
                  <XAxis dataKey='bloodType' tick={{ fontSize: 11, fontWeight: 700 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={{ borderRadius: 10, fontSize: 12, border: `1px solid ${border}`, backgroundColor: card }} />
                  <Bar dataKey='units' name='Units' radius={[5, 5, 0, 0]}>
                    {(ch.inventory || []).map((entry, i) => (
                      <Cell key={i} fill={
                        entry.status === 'critical' || entry.status === 'empty' ? '#dc2626' :
                        entry.status === 'low' ? '#d97706' : '#16a34a'
                      } />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </Paper>
        </Grid>
      </Grid>

      {/* Critical blood types alert */}
      {!loading && ov.criticalBloodTypes?.length > 0 && (
        <Paper elevation={0} sx={{
          p: 2.5, borderRadius: '16px',
          border: '1px solid #fca5a5',
          bgcolor: isDark ? 'rgba(220,38,38,0.06)' : '#fff0f0',
          display: 'flex', gap: 1.5, alignItems: 'flex-start',
        }}>
          <WarningAmberIcon sx={{ color: '#dc2626', mt: 0.1, flexShrink: 0 }} />
          <Box>
            <Typography fontWeight={700} fontSize='0.9rem' color='error.main'>Critical Blood Inventory Alert</Typography>
            <Typography variant='caption' color='text.secondary'>
              The following blood types are critically low and require immediate attention:{' '}
              <strong>{ov.criticalBloodTypes.join(', ')}</strong>
            </Typography>
          </Box>
        </Paper>
      )}
    </Box>
  );
}
