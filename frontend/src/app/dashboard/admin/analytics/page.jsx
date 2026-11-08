'use client';
import { statusLabel } from '@/components/ui/StatusBadge';
import { translateServerMessage } from '@/lib/api-error';
import { currentIntlLocale } from '@/i18n/config';
import { useI18n } from '@/i18n/I18nProvider';
import React, { useEffect, useState, useCallback } from 'react';
import {
  Box, Typography, Grid, Paper, useTheme, Skeleton, Alert, Chip,
} from '@mui/material';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart,
  Pie, Cell, Legend, AreaChart, Area,
} from 'recharts';
import PeopleIcon from '@mui/icons-material/People';
import BloodtypeIcon from '@mui/icons-material/Bloodtype';
import FavoriteIcon from '@mui/icons-material/Favorite';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import API_BASE from '@/lib/config';
import { useAuth } from '@/store/AuthContext';

const BLOOD_COLORS = Array(8).fill('#C91D32'); // one brand red for every blood type
const STATUS_COLORS = { pending: '#F59E0B', approved: '#16A34A', fulfilled: '#15803D', rejected: '#DC2626', cancelled: '#94A3B8' };

// Short month name in the selected language ("Jan", "មករា", "Thg 1").
const monthLabel = (year, month) => new Date(year, month - 1, 1).toLocaleDateString(currentIntlLocale(), { month: 'short' });

function StatCard({ icon, label, value, sub, color, loading }) {
  const theme  = useTheme();
  const isDark = theme.palette.mode === 'dark';
  return (
    <Paper elevation={0} sx={{
      p: 3, borderRadius: '16px',
      border: `1px solid ${isDark ? '#334155' : '#E2E8F0'}`,
      bgcolor: isDark ? '#17263D' : '#fff',
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
  const { t, rich, lang } = useI18n();
  const theme  = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const { token } = useAuth();

  const [data, setData]     = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]   = useState('');

  const card   = isDark ? '#17263D' : '#ffffff';
  const border = isDark ? '#334155' : '#E2E8F0';

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res  = await fetch(`${API_BASE}/api/analytics`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = await res.json();
      if (!res.ok) throw Object.assign(new Error(json.message || ''), { serverText: json.message || '' });
      setData(json);
    } catch (err) {
      setError({ text: err.serverText || '' });
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
      map[key] = { ...map[key], donors: d.count, label: monthLabel(d._id.year, d._id.month) };
    });
    (ch.monthlyRequests || []).forEach(d => {
      const key = `${d._id.year}-${String(d._id.month).padStart(2,'0')}`;
      map[key] = { ...map[key], requests: d.count, label: monthLabel(d._id.year, d._id.month) };
    });
    return Object.values(map).map(v => ({ ...v, donors: v.donors || 0, requests: v.requests || 0 }));
  })();

  return (
    <Box>
      {/* Header */}
      <Box display='flex' justifyContent='space-between' alignItems='center' mb={4}>
        <Box>
          <Typography sx={{ fontSize: '1.6rem', fontWeight: 800, letterSpacing: '-0.025em',
            color: isDark ? '#F8FAFC' : '#172B4D', lineHeight: 1.2 }}>
            {t('adm.analytics.analytics')}
          </Typography>
          <Typography variant='body2' color='text.secondary' mt={0.5}>
            {t('adm.analytics.realTimeInsightsAcross')}
          </Typography>
        </Box>
        {ov.fulfillmentRate !== undefined && (
          <Chip
            icon={<CheckCircleIcon sx={{ fontSize: '14px !important', color: '#16a34a !important' }} />}
            label={t('adm.analytics.fulfillment', { rate: ov.fulfillmentRate })}
            sx={{ bgcolor: isDark ? 'rgba(22,163,74,0.12)' : '#f0fdf4', color: '#16a34a', fontWeight: 700, fontSize: '0.82rem' }}
          />
        )}
      </Box>

      {error && <Alert severity='error' sx={{ mb: 3, borderRadius: 2 }}>{translateServerMessage(error.text, lang, t('adm.analytics.loadFailed')) || t('adm.analytics.loadFailed')}</Alert>}

      {/* KPI Cards */}
      <Grid container spacing={2.5} mb={4}>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <StatCard icon={<PeopleIcon />} label={t('adm.analytics.totalDonors')} loading={loading}
            value={ov.totalDonors} sub={t('adm.analytics.thisMonth', { count: ov.newDonorsThisMonth || 0 })} color='#2563eb' />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <StatCard icon={<FavoriteIcon />} label={t('adm.analytics.activeDonors')} loading={loading}
            value={ov.activeDonors} sub={t('adm.analytics.availableToDonateNow')} color='#16a34a' />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <StatCard icon={<BloodtypeIcon />} label={t('adm.analytics.totalRequests')} loading={loading}
            value={ov.totalRequests} sub={t('adm.analytics.pending', { count: ov.pendingRequests || 0 })} color='#C91D32' />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <StatCard icon={<WarningAmberIcon />} label={t('adm.analytics.urgentPending')} loading={loading}
            value={ov.urgentRequests} sub={t('adm.analytics.criticalBloodRequests')} color='#F59E0B' />
        </Grid>
      </Grid>

      {/* Charts row 1 */}
      <Grid container spacing={2.5} mb={2.5}>
        {/* Monthly trend */}
        <Grid size={{ xs: 12, md: 8 }}>
          <Paper elevation={0} sx={{ p: 3, borderRadius: '16px', border: `1px solid ${border}`, bgcolor: card, height: '100%' }}>
            <Typography fontWeight={700} fontSize='0.95rem' mb={0.5}>{t('adm.analytics.monthlyActivity')}</Typography>
            <Typography variant='caption' color='text.secondary' display='block' mb={2.5}>
              {t('adm.analytics.newDonorsVsBlood')}
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
                      <stop offset='5%' stopColor='#C91D32' stopOpacity={0.15} />
                      <stop offset='95%' stopColor='#C91D32' stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray='3 3' stroke={isDark ? '#334155' : '#E2E8F0'} vertical={false} />
                  <XAxis dataKey='label' tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={{ borderRadius: 10, fontSize: 12, border: `1px solid ${border}`, backgroundColor: card }} />
                  <Legend />
                  <Area type='monotone' dataKey='donors' name={t('adm.analytics.series.newDonors')} stroke='#2563eb' strokeWidth={2} fill='url(#gDonors)' dot={false} />
                  <Area type='monotone' dataKey='requests' name={t('adm.analytics.series.requests')} stroke='#C91D32' strokeWidth={2} fill='url(#gRequests)' dot={false} />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </Paper>
        </Grid>

        {/* Request Status Pie */}
        <Grid size={{ xs: 12, md: 4 }}>
          <Paper elevation={0} sx={{ p: 3, borderRadius: '16px', border: `1px solid ${border}`, bgcolor: card, height: '100%' }}>
            <Typography fontWeight={700} fontSize='0.95rem' mb={0.5}>{t('adm.analytics.requestStatus')}</Typography>
            <Typography variant='caption' color='text.secondary' display='block' mb={2}>
              {t('adm.analytics.breakdownByCurrentStatus')}
            </Typography>
            {loading ? <Skeleton variant='circular' width={180} height={180} sx={{ mx: 'auto' }} /> : (
              <ResponsiveContainer width='100%' height={220}>
                <PieChart>
                  <Pie data={(ch.requestsByStatus || []).map((d) => ({ ...d, label: statusLabel(t, d.status) }))} dataKey='count' nameKey='label' cx='50%' cy='50%'
                    innerRadius={55} outerRadius={85} paddingAngle={3}>
                    {(ch.requestsByStatus || []).map((entry, i) => (
                      <Cell key={i} fill={STATUS_COLORS[String(entry.status).toLowerCase()] || "#94A3B8"} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(v, n) => [v, n]}
                    contentStyle={{ borderRadius: 10, fontSize: 12, border: `1px solid ${border}`, backgroundColor: card }} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            )}
          </Paper>
        </Grid>
      </Grid>

      {/* Charts row 2 */}
      <Grid container spacing={2.5} mb={2.5}>
        {/* Donors by blood type */}
        <Grid size={{ xs: 12, md: 6 }}>
          <Paper elevation={0} sx={{ p: 3, borderRadius: '16px', border: `1px solid ${border}`, bgcolor: card }}>
            <Typography fontWeight={700} fontSize='0.95rem' mb={0.5}>{t('adm.analytics.donorsByBloodType')}</Typography>
            <Typography variant='caption' color='text.secondary' display='block' mb={2.5}>{t('adm.analytics.registeredDonorDistribution')}</Typography>
            {loading ? <Skeleton variant='rounded' height={200} /> : (
              <ResponsiveContainer width='100%' height={200}>
                <BarChart data={ch.donorsByBloodType || []} barSize={24} margin={{ left: -20 }}>
                  <CartesianGrid strokeDasharray='3 3' stroke={isDark ? '#334155' : '#E2E8F0'} vertical={false} />
                  <XAxis dataKey='bloodType' tick={{ fontSize: 11, fontWeight: 700 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={{ borderRadius: 10, fontSize: 12, border: `1px solid ${border}`, backgroundColor: card }} />
                  <Bar dataKey='count' name={t('adm.analytics.series.donors')} radius={[5, 5, 0, 0]}>
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
        <Grid size={{ xs: 12, md: 6 }}>
          <Paper elevation={0} sx={{ p: 3, borderRadius: '16px', border: `1px solid ${border}`, bgcolor: card }}>
            <Typography fontWeight={700} fontSize='0.95rem' mb={0.5}>{t('adm.analytics.inventoryLevels')}</Typography>
            <Typography variant='caption' color='text.secondary' display='block' mb={2.5}>{t('adm.analytics.currentUnitsPerBlood')}</Typography>
            {loading ? <Skeleton variant='rounded' height={200} /> : (
              <ResponsiveContainer width='100%' height={200}>
                <BarChart data={ch.inventory || []} barSize={24} margin={{ left: -20 }}>
                  <CartesianGrid strokeDasharray='3 3' stroke={isDark ? '#334155' : '#E2E8F0'} vertical={false} />
                  <XAxis dataKey='bloodType' tick={{ fontSize: 11, fontWeight: 700 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={{ borderRadius: 10, fontSize: 12, border: `1px solid ${border}`, backgroundColor: card }} />
                  <Bar dataKey='units' name={t('adm.analytics.series.units')} radius={[5, 5, 0, 0]}>
                    {(ch.inventory || []).map((entry, i) => (
                      <Cell key={i} fill={
                        entry.status === 'critical' || entry.status === 'empty' ? '#C91D32' :
                        entry.status === 'low' ? '#F59E0B' : '#16A34A'
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
          bgcolor: isDark ? 'rgba(201,29,50,0.06)' : '#FFF1F2',
          display: 'flex', gap: 1.5, alignItems: 'flex-start',
        }}>
          <WarningAmberIcon sx={{ color: '#C91D32', mt: 0.1, flexShrink: 0 }} />
          <Box>
            <Typography fontWeight={700} fontSize='0.9rem' color='error.main'>{t('adm.analytics.criticalBloodInventoryAlert')}</Typography>
            <Typography variant='caption' color='text.secondary'>
              {rich('adm.analytics.criticalText', { types: <strong>{ov.criticalBloodTypes.join(', ')}</strong> })}
            </Typography>
          </Box>
        </Paper>
      )}
    </Box>
  );
}
