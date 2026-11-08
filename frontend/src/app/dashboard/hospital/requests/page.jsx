'use client';
import { componentLabel } from '@/app/(donor)/requests/_components/formModel';
import { statusLabel } from '@/components/ui/StatusBadge';
import { apiErrorMessage } from '@/lib/api-error';
import { useT } from '@/i18n/I18nProvider';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Alert, Box, Button, CircularProgress, Stack, Tab, Table, TableBody, TableCell, TableHead,
  TableRow, Tabs, Typography,
} from '@mui/material';
import CheckIcon from '@mui/icons-material/Check';
import CloseIcon from '@mui/icons-material/Close';
import DescriptionIcon from '@mui/icons-material/Description';
import axios from 'axios';
import { useAuth } from '@/store/AuthContext';
import API_BASE from '@/lib/config';
import { PageHeader, SectionCard, StatusBadge, TableCard, EmptyState } from '@/components/ui';
import { formatDate, formatDateTime, shortRequestId } from '@/lib/format';

// Labels: hosp.reqs.tabs.<key>
const TABS = ['All', 'Pending', 'Approved', 'Fulfilled', 'Rejected', 'Cancelled'].map((key) => ({ key }));


// Steps a request moves through. Only two timestamps exist in the data (submitted =
// createdAt, fulfilled = fulfilledAt), so the others show a state, not an invented time.
function timelineFor(t, r) {
  const s = (key, vars) => t(`hosp.reqs.timeline.${key}`, vars);
  if (r.status === 'Cancelled') {
    return [
      { label: s('submitted'), state: 'done', note: formatDateTime(r.createdAt) },
      { label: s('cancelled'), state: 'error', note: r.cancelledAt ? s('byRequesterAt', { date: formatDateTime(r.cancelledAt) }) : s('byRequester') },
    ];
  }
  if (r.status === 'Rejected') {
    return [
      { label: s('submitted'), state: 'done', note: formatDateTime(r.createdAt) },
      { label: s('rejected'), state: 'error', note: s('declined') },
    ];
  }
  const rank = { Pending: 1, Approved: 2, Fulfilled: 3 }[r.status] ?? 1;
  return [
    { label: s('submitted'), state: 'done', note: formatDateTime(r.createdAt) },
    { label: s('approved'), state: rank >= 2 ? 'done' : 'current', note: rank >= 2 ? s('approved') : s('awaitingReview') },
    {
      label: s('fulfilled'),
      state: rank >= 3 ? 'done' : rank === 2 ? 'current' : 'todo',
      note: rank >= 3 ? (r.fulfilledAt ? formatDateTime(r.fulfilledAt) : s('completed')) : rank === 2 ? s('ready') : s('notYet'),
    },
  ];
}

function StepDot({ state }) {
  const base = { width: 30, height: 30, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, position: 'relative', zIndex: 1 };
  if (state === 'done') return <Box sx={{ ...base, bgcolor: 'success.main', color: '#fff' }}><CheckIcon sx={{ fontSize: 18 }} /></Box>;
  if (state === 'error') return <Box sx={{ ...base, bgcolor: 'error.main', color: '#fff' }}><CloseIcon sx={{ fontSize: 18 }} /></Box>;
  if (state === 'current') return <Box sx={{ ...base, bgcolor: 'background.paper', border: '2px solid', borderColor: 'primary.main' }}><Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: 'primary.main' }} /></Box>;
  return <Box sx={{ ...base, bgcolor: 'background.paper', border: '2px solid', borderColor: 'divider' }} />;
}

function RequestTimeline({ request }) {
  const t = useT();
  const steps = timelineFor(t, request);
  return (
    <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, gap: { xs: 2, sm: 0 } }}>
      {steps.map((s, i) => (
        <Box key={s.label} sx={{ flex: 1, position: 'relative', display: 'flex', flexDirection: { xs: 'row', sm: 'column' }, alignItems: { xs: 'center', sm: 'center' }, gap: { xs: 1.5, sm: 0.75 }, textAlign: { sm: 'center' } }}>
          {i < steps.length - 1 && (
            <Box
              sx={{
                display: { xs: 'none', sm: 'block' }, position: 'absolute', top: 14, left: '50%', width: '100%', height: 2,
                bgcolor: s.state === 'done' && steps[i + 1].state !== 'todo' ? 'success.main' : 'divider',
              }}
            />
          )}
          <StepDot state={s.state} />
          <Box>
            <Typography variant="body2" sx={{ fontWeight: 700 }}>{s.label}</Typography>
            <Typography variant="caption" sx={{ color: s.state === 'current' ? 'primary.main' : s.state === 'error' ? 'error.main' : 'text.secondary', fontWeight: s.state === 'current' ? 700 : 400 }}>
              {s.note}
            </Typography>
          </Box>
        </Box>
      ))}
    </Box>
  );
}

// Marks a failed list load; the alert shows it in the current language.
const LOAD_FAILED = 'load-failed';

export default function HospitalRequests() {
  const { staff, token } = useAuth();
  const t = useT();
  const [requests, setRequests] = useState(null);
  const [error, setError] = useState('');
  const [busyId, setBusyId] = useState(null);
  const [tab, setTab] = useState('All');
  const [selectedId, setSelectedId] = useState(null);

  const load = useCallback(() => {
    if (!staff?.hospitalId) return;
    axios.get(`${API_BASE}/api/requests?hospital=${staff.hospitalId}`, { headers: { Authorization: `Bearer ${token}` } })
      .then((res) => setRequests([...res.data].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))))
      .catch(() => setError(LOAD_FAILED));
  }, [staff, token]);

  useEffect(() => { load(); }, [load]);

  const act = async (id, action) => {
    setBusyId(id);
    setError('');
    try {
      const headers = { Authorization: `Bearer ${token}` };
      if (action === 'Approved' || action === 'Rejected') {
        await axios.patch(`${API_BASE}/api/requests/${id}/status`, { status: action }, { headers });
      } else if (action === 'Fulfilled') {
        await axios.patch(`${API_BASE}/api/requests/${id}/fulfill`, {}, { headers });
      }
      load();
    } catch (err) {
      setError(apiErrorMessage(err, t(`hosp.reqs.actionFailed.${action}`)));
    } finally {
      setBusyId(null);
    }
  };

  const counts = useMemo(() => {
    const c = { All: requests?.length || 0 };
    (requests || []).forEach((r) => { c[r.status] = (c[r.status] || 0) + 1; });
    return c;
  }, [requests]);

  const visible = useMemo(() => (requests || []).filter((r) => tab === 'All' || r.status === tab), [requests, tab]);
  const selected = visible.find((r) => r._id === selectedId) || visible[0] || null;

  return (
    <Box>
      <PageHeader title={t('hosp.reqs.bloodRequestManagement')} subtitle={t('hosp.reqs.reviewApproveAndFulfil')} />
      {error && <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError('')}>{error === LOAD_FAILED ? t('hosp.reqs.loadFailed') : error}</Alert>}

      {!requests && !error ? <CircularProgress size={28} /> : requests && (
        <>
          <TableCard
            minWidth={760}
            toolbar={
              <Tabs value={tab} onChange={(_, v) => setTab(v)} variant="scrollable" scrollButtons="auto" sx={{ minHeight: 40, mx: -1 }}>
                {TABS.map((d) => <Tab key={d.key} value={d.key} label={`${t(`hosp.reqs.tabs.${d.key}`)} (${counts[d.key] || 0})`} sx={{ minHeight: 40 }} />)}
              </Tabs>
            }
          >
            <Table size="small">
              <TableHead>
                <TableRow>
                  {['id', 'patient', 'bloodType', 'units', 'urgency', 'neededBy', 'status', 'requested'].map((h) => <TableCell key={h}>{t(`hosp.reqs.cols.${h}`)}</TableCell>)}
                  <TableCell align="right">{t('hosp.reqs.actions')}</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {visible.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={9}>
                      <EmptyState
                        icon={<DescriptionIcon />}
                        title={tab === 'All' ? t('hosp.reqs.noneYet') : t('hosp.reqs.noneStatus', { status: statusLabel(t, tab) })}
                        description={tab === 'All' ? t('hosp.reqs.noneText') : undefined}
                      />
                    </TableCell>
                  </TableRow>
                )}
                {visible.map((r) => (
                  <TableRow key={r._id} hover selected={selected?._id === r._id} onClick={() => setSelectedId(r._id)} sx={{ cursor: 'pointer' }}>
                    <TableCell sx={{ fontWeight: 600 }}>{shortRequestId(r._id)}</TableCell>
                    <TableCell>{r.patientName}</TableCell>
                    <TableCell sx={{ color: 'error.main', fontWeight: 800 }}>{r.bloodType}</TableCell>
                    <TableCell>{r.unitsNeeded}</TableCell>
                    <TableCell><StatusBadge status={r.urgency} size="small" dot={false} /></TableCell>
                    <TableCell sx={{ whiteSpace: 'nowrap' }}>{r.requiredBy ? formatDateTime(r.requiredBy) : '—'}</TableCell>
                    <TableCell><StatusBadge status={r.status} size="small" /></TableCell>
                    <TableCell sx={{ whiteSpace: 'nowrap' }}>{formatDate(r.createdAt)}</TableCell>
                    <TableCell align="right" onClick={(e) => e.stopPropagation()}>
                      <Stack direction="row" spacing={1} justifyContent="flex-end">
                        {r.status === 'Pending' && (
                          <>
                            <Button size="small" variant="outlined" color="success" disabled={busyId === r._id} onClick={() => act(r._id, 'Approved')}>{t('hosp.reqs.approve')}</Button>
                            <Button size="small" variant="outlined" color="error" disabled={busyId === r._id} onClick={() => act(r._id, 'Rejected')}>{t('hosp.reqs.reject')}</Button>
                          </>
                        )}
                        {r.status === 'Approved' && (
                          <Button size="small" variant="contained" disabled={busyId === r._id} onClick={() => act(r._id, 'Fulfilled')}>
                            {busyId === r._id ? <CircularProgress size={16} color="inherit" /> : t('hosp.reqs.fulfill')}
                          </Button>
                        )}
                      </Stack>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableCard>

          {selected && (
            <SectionCard
              sx={{ mt: { xs: 2, md: 3 } }}
              title={t('hosp.reqs.timelineTitle', { id: shortRequestId(selected._id) })}
              subtitle={[
                selected.patientAge != null ? t('hosp.reqs.patientAge', { name: selected.patientName, age: selected.patientAge }) : selected.patientName,
                `${t('hosp.reqs.unitsOf', { units: t('hosp.reqs.units', { count: selected.unitsNeeded }), type: selected.bloodType })}${selected.component ? ` · ${componentLabel(selected.component)}` : ''}`,
                selected.requiredBy && t('hosp.reqs.neededBy', { date: formatDateTime(selected.requiredBy) }),
                selected.contact && t('hosp.reqs.contact', { contact: selected.contact }),
              ].filter(Boolean).join(' · ')}
            >
              <RequestTimeline request={selected} />
            </SectionCard>
          )}
        </>
      )}
    </Box>
  );
}
