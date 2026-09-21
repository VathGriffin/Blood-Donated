'use client';
import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { Container, Box, Typography, Paper, Skeleton, Button, LinearProgress, useTheme } from '@mui/material';
import LocalHospitalIcon from '@mui/icons-material/LocalHospital';
import BloodtypeIcon from '@mui/icons-material/Bloodtype';
import TaskAltIcon from '@mui/icons-material/TaskAlt';
import EventAvailableIcon from '@mui/icons-material/EventAvailable';
import TipsAndUpdatesIcon from '@mui/icons-material/TipsAndUpdates';
import API_BASE from '@/lib/config';

const RED = '#b71c1c';
const URGENCY_COLORS = { Critical: '#b71c1c', High: '#ef6c00', Medium: '#f9a825', Low: '#78909c' };
const nf = new Intl.NumberFormat('en-US');

// Plain-language takeaways generated from the live figures — only ever states what the data shows.
function buildTakeaways(d) {
  const out = [];
  const { stock, requests } = d;

  if (stock.totalUnits > 0) {
    const empty = stock.byBloodType.filter((t) => t.units === 0).map((t) => t.type);
    if (empty.length) {
      out.push(`No stock is reported yet for ${empty.join(', ')}.`);
    } else {
      const lowest = stock.byBloodType.reduce((a, b) => (b.units < a.units ? b : a));
      out.push(`${lowest.type} is the scarcest blood type across the network — ${nf.format(lowest.units)} units in stock.`);
    }
  }

  const top = requests.byBloodType.reduce((a, b) => (b.count > a.count ? b : a), { type: '', count: 0 });
  if (top.count > 0) out.push(`${top.type} is requested most often — ${nf.format(top.count)} of ${nf.format(requests.total)} requests.`);

  const critical = requests.byUrgency.find((u) => u.urgency === 'Critical')?.count || 0;
  if (critical > 0) out.push(`${nf.format(critical)} ${critical === 1 ? 'request was' : 'requests were'} raised as Critical.`);

  const decided = requests.total - requests.rejected;
  if (decided > 0) out.push(`${Math.round((requests.fulfilled / decided) * 100)}% of requests that weren’t rejected have been fulfilled.`);

  if (d.hospitals > 0) out.push(`${nf.format(d.hospitalsReportingStock)} of ${nf.format(d.hospitals)} partner hospitals currently report their blood stock.`);
  return out;
}

function Panel({ title, subtitle, children, sx }) {
  const isDark = useTheme().palette.mode === 'dark';
  return (
    <Paper elevation={0} sx={{
      p: { xs: 2.5, md: 3.5 }, borderRadius: 4, height: '100%',
      bgcolor: isDark ? '#1a1a1a' : '#fff', border: `1px solid ${isDark ? '#2a2a2a' : '#efe3e3'}`,
      boxShadow: isDark ? 'none' : '0 4px 24px rgba(120,20,20,0.05)', ...sx,
    }}>
      <Typography fontWeight={800} fontSize="1.05rem">{title}</Typography>
      {subtitle && <Typography color="text.secondary" fontSize="0.82rem" sx={{ mt: 0.25 }}>{subtitle}</Typography>}
      <Box sx={{ mt: 2.5 }}>{children}</Box>
    </Paper>
  );
}

function Kpi({ icon, value, label, note, delay }) {
  const isDark = useTheme().palette.mode === 'dark';
  return (
    <Paper elevation={0} data-aos="fade-up" data-aos-delay={delay} sx={{
      p: 3, borderRadius: 4, bgcolor: isDark ? '#1a1a1a' : '#fff', border: `1px solid ${isDark ? '#2a2a2a' : '#efe3e3'}`,
      boxShadow: isDark ? 'none' : '0 4px 24px rgba(120,20,20,0.05)',
    }}>
      <Box sx={{ width: 44, height: 44, borderRadius: '12px', mb: 1.5, display: 'flex', alignItems: 'center', justifyContent: 'center', color: RED, bgcolor: isDark ? 'rgba(211,47,47,0.15)' : '#fdecea' }}>
        {icon}
      </Box>
      <Typography sx={{ fontSize: '2rem', fontWeight: 800, lineHeight: 1.1, color: isDark ? '#ef9a9a' : RED }}>{value}</Typography>
      <Typography fontWeight={700} fontSize="0.9rem" sx={{ mt: 0.5 }}>{label}</Typography>
      <Typography color="text.secondary" fontSize="0.78rem" sx={{ mt: 0.25, minHeight: '1.2em' }}>{note}</Typography>
    </Paper>
  );
}

// One labelled horizontal bar: label, track, value.
function BarRow({ label, value, max, color, badge }) {
  const isDark = useTheme().palette.mode === 'dark';
  return (
    <Box sx={{ display: 'grid', gridTemplateColumns: '44px 1fr auto', alignItems: 'center', gap: 1.5, py: 0.6 }}>
      <Typography fontWeight={700} fontSize="0.85rem">{label}</Typography>
      <Box sx={{ height: 10, borderRadius: 5, bgcolor: isDark ? '#2a2a2a' : '#f3ecec', overflow: 'hidden' }}>
        <Box sx={{ height: '100%', width: `${max ? Math.max((value / max) * 100, value > 0 ? 3 : 0) : 0}%`, bgcolor: color, borderRadius: 5, transition: 'width .6s ease' }} />
      </Box>
      <Typography fontSize="0.82rem" fontWeight={600} sx={{ minWidth: 64, textAlign: 'right' }}>
        {nf.format(value)}{badge && <Box component="span" sx={{ ml: 0.75, fontSize: '0.65rem', fontWeight: 800, color: '#ef6c00' }}>{badge}</Box>}
      </Typography>
    </Box>
  );
}

export default function HospitalInsights() {
  const isDark = useTheme().palette.mode === 'dark';
  const [data, setData] = useState(null);
  const [status, setStatus] = useState('loading'); // loading | ok | error

  useEffect(() => {
    const ctrl = new AbortController();
    axios.get(`${API_BASE}/api/stats/hospital-insights`, { signal: ctrl.signal, timeout: 15000 })
      .then(({ data: d }) => { setData(d); setStatus('ok'); })
      .catch((err) => { if (!axios.isCancel(err)) setStatus('error'); });
    return () => ctrl.abort();
  }, []);

  const takeaways = useMemo(() => (data ? buildTakeaways(data) : []), [data]);
  const isEmpty = data && data.hospitals === 0 && data.requests.total === 0 && data.stock.totalUnits === 0;

  const header = (
    <Box textAlign="center" mb={6} data-aos="fade-up">
      <Typography variant="overline" color="error" fontWeight={700} letterSpacing="0.15em">Hospital Insights</Typography>
      <Typography variant="h4" fontWeight={700} mt={0.5}>What our partner hospitals are seeing</Typography>
      <Typography color="text.secondary" mt={1} maxWidth={620} mx="auto">
        Live, anonymous figures shared from the hospitals on the platform — blood stock, requests and check-ins.
        No patient or donor details are ever shown.
      </Typography>
    </Box>
  );

  let body;
  if (status === 'loading') {
    body = (
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr 1fr', md: 'repeat(4, 1fr)' }, gap: 2.5 }}>
        {[0, 1, 2, 3].map((i) => <Skeleton key={i} variant="rounded" height={150} sx={{ borderRadius: 4 }} />)}
      </Box>
    );
  } else if (status === 'error') {
    body = <Typography textAlign="center" color="text.secondary">Hospital insights are unavailable right now — please check back shortly.</Typography>;
  } else if (isEmpty) {
    body = (
      <Panel title="Insights will appear here soon" subtitle="Figures start showing once partner hospitals join and begin logging blood stock and requests.">
        <Button component={Link} href="/contact" variant="outlined" color="error" sx={{ textTransform: 'none', fontWeight: 700 }}>
          Register your hospital
        </Button>
      </Panel>
    );
  } else {
    const { requests, stock, appointments } = data;
    const decided = requests.total - requests.rejected;
    const rate = decided > 0 ? Math.round((requests.fulfilled / decided) * 100) : null;
    const maxStock = Math.max(...stock.byBloodType.map((t) => t.units), 0);
    const lowestUnits = Math.min(...stock.byBloodType.map((t) => t.units));
    const maxUrgency = Math.max(...requests.byUrgency.map((u) => u.count), 0);
    const belowMin = stock.status.critical + stock.status.empty;
    const topTypes = [...requests.byBloodType].filter((t) => t.count > 0).sort((a, b) => b.count - a.count).slice(0, 3);

    body = (
      <>
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr 1fr', md: 'repeat(4, 1fr)' }, gap: { xs: 1.5, md: 2.5 }, mb: 3 }}>
          <Kpi delay={0} icon={<LocalHospitalIcon />} value={nf.format(data.hospitals)} label="Partner hospitals"
            note={`${nf.format(data.hospitalsReportingStock)} reporting stock`} />
          <Kpi delay={80} icon={<TaskAltIcon />} value={nf.format(requests.fulfilled)} label="Requests fulfilled"
            note={rate !== null ? `${rate}% of ${nf.format(decided)} handled` : 'None handled yet'} />
          <Kpi delay={160} icon={<BloodtypeIcon />} value={nf.format(stock.totalUnits)} label="Units in stock"
            note={stock.status.adequate + stock.status.low + belowMin > 0 ? `${nf.format(belowMin)} stock lines below minimum` : 'No stock reported yet'} />
          <Kpi delay={240} icon={<EventAvailableIcon />} value={nf.format(appointments.checkedIn)} label="Donations checked in"
            note={`of ${nf.format(appointments.total)} appointments`} />
        </Box>

        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1.3fr 1fr' }, gap: 3, mb: 3 }}>
          <Panel title="Blood stock across the network" subtitle="Units on hand, all partner hospitals combined">
            {stock.totalUnits > 0 ? stock.byBloodType.map((t) => (
              <BarRow key={t.type} label={t.type} value={t.units} max={maxStock}
                color={t.units === lowestUnits ? '#ef6c00' : RED} badge={t.units === lowestUnits ? 'LOWEST' : null} />
            )) : <Typography color="text.secondary" fontSize="0.9rem">No stock has been reported yet.</Typography>}
          </Panel>

          <Panel title="What hospitals request" subtitle={`${nf.format(requests.total)} requests, by urgency`}>
            {requests.total > 0 ? (
              <>
                {requests.byUrgency.map((u) => <BarRow key={u.urgency} label={u.urgency} value={u.count} max={maxUrgency} color={URGENCY_COLORS[u.urgency]} />)}
                {topTypes.length > 0 && (
                  <Box sx={{ mt: 2.5, pt: 2, borderTop: `1px solid ${isDark ? '#2a2a2a' : '#f0e6e6'}` }}>
                    <Typography fontSize="0.78rem" color="text.secondary" fontWeight={600} sx={{ mb: 1 }}>MOST REQUESTED</Typography>
                    <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                      {topTypes.map((t) => (
                        <Box key={t.type} sx={{ px: 1.5, py: 0.5, borderRadius: 5, bgcolor: isDark ? 'rgba(211,47,47,0.15)' : '#fdecea', color: isDark ? '#ef9a9a' : RED, fontWeight: 800, fontSize: '0.85rem' }}>
                          {t.type} <Box component="span" sx={{ fontWeight: 600, opacity: 0.8 }}>· {nf.format(t.count)}</Box>
                        </Box>
                      ))}
                    </Box>
                  </Box>
                )}
              </>
            ) : <Typography color="text.secondary" fontSize="0.9rem">No blood requests yet.</Typography>}
          </Panel>
        </Box>

        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: data.topHospitals.length ? '1fr 1fr' : '1fr' }, gap: 3 }}>
          {takeaways.length > 0 && (
            <Panel title="Key takeaways" subtitle="Generated from the figures above">
              <Box component="ul" sx={{ listStyle: 'none', p: 0, m: 0, display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                {takeaways.map((t) => (
                  <Box component="li" key={t} sx={{ display: 'flex', gap: 1.25, alignItems: 'flex-start' }}>
                    <TipsAndUpdatesIcon sx={{ fontSize: 19, color: RED, mt: '2px', flexShrink: 0 }} />
                    <Typography fontSize="0.92rem" sx={{ lineHeight: 1.55 }}>{t}</Typography>
                  </Box>
                ))}
              </Box>
            </Panel>
          )}

          {data.topHospitals.length > 0 && (
            <Panel title="Most active hospitals" subtitle="By blood requests fulfilled">
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                {data.topHospitals.map((h, i) => (
                  <Box key={`${h.name}-${i}`}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 0.75 }}>
                      <Box sx={{ width: 26, height: 26, borderRadius: '50%', bgcolor: RED, color: '#fff', fontWeight: 800, fontSize: '0.78rem', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{i + 1}</Box>
                      <Box sx={{ minWidth: 0, flex: 1 }}>
                        <Typography fontWeight={700} fontSize="0.9rem" noWrap>{h.name}</Typography>
                        {h.city && <Typography color="text.secondary" fontSize="0.75rem" noWrap>{h.city}</Typography>}
                      </Box>
                      <Typography fontSize="0.8rem" fontWeight={600} sx={{ whiteSpace: 'nowrap' }}>{nf.format(h.fulfilled)} / {nf.format(h.requests)}</Typography>
                    </Box>
                    <LinearProgress variant="determinate" value={h.requests ? (h.fulfilled / h.requests) * 100 : 0} color="error"
                      sx={{ height: 6, borderRadius: 3, bgcolor: isDark ? '#2a2a2a' : '#f3ecec' }} />
                  </Box>
                ))}
              </Box>
            </Panel>
          )}
        </Box>

        <Box sx={{ mt: 4, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 2, flexWrap: 'wrap' }}>
          <Typography color="text.secondary" fontSize="0.8rem">
            Anonymous totals from the platform, refreshed every few minutes
            {data.generatedAt ? ` · updated ${new Date(data.generatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}` : ''}.
          </Typography>
          <Button component={Link} href="/contact" variant="outlined" color="error" sx={{ textTransform: 'none', fontWeight: 700, borderRadius: '10px' }}>
            Partner your hospital with us
          </Button>
        </Box>
      </>
    );
  }

  return (
    <Box id="hospital-insights" sx={{ bgcolor: isDark ? '#150f0f' : '#fff6f6', py: { xs: 9, md: 12 } }}>
      <Container maxWidth="lg">
        {header}
        {body}
      </Container>
    </Box>
  );
}
