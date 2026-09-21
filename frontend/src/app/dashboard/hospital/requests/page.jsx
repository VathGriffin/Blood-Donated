'use client';
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

const TABS = [
  { key: 'All', label: 'All Requests' },
  { key: 'Pending', label: 'Pending' },
  { key: 'Approved', label: 'Approved' },
  { key: 'Fulfilled', label: 'Fulfilled' },
  { key: 'Rejected', label: 'Rejected' },
];


// Steps a request moves through. Only two timestamps exist in the data (submitted =
// createdAt, fulfilled = fulfilledAt), so the others show a state, not an invented time.
function timelineFor(r) {
  if (r.status === 'Rejected') {
    return [
      { label: 'Submitted', state: 'done', note: formatDateTime(r.createdAt) },
      { label: 'Rejected', state: 'error', note: 'Request declined' },
    ];
  }
  const rank = { Pending: 1, Approved: 2, Fulfilled: 3 }[r.status] ?? 1;
  return [
    { label: 'Submitted', state: 'done', note: formatDateTime(r.createdAt) },
    { label: 'Approved', state: rank >= 2 ? 'done' : 'current', note: rank >= 2 ? 'Approved' : 'Awaiting review' },
    {
      label: 'Fulfilled',
      state: rank >= 3 ? 'done' : rank === 2 ? 'current' : 'todo',
      note: rank >= 3 ? (r.fulfilledAt ? formatDateTime(r.fulfilledAt) : 'Completed') : rank === 2 ? 'Ready to fulfil' : 'Not yet',
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
  const steps = timelineFor(request);
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

export default function HospitalRequests() {
  const { staff, token } = useAuth();
  const [requests, setRequests] = useState(null);
  const [error, setError] = useState('');
  const [busyId, setBusyId] = useState(null);
  const [tab, setTab] = useState('All');
  const [selectedId, setSelectedId] = useState(null);

  const load = useCallback(() => {
    if (!staff?.hospitalId) return;
    axios.get(`${API_BASE}/api/requests?hospital=${staff.hospitalId}`)
      .then((res) => setRequests([...res.data].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))))
      .catch(() => setError('Failed to load requests.'));
  }, [staff]);

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
      setError(err.response?.data?.error || `Failed to ${action.toLowerCase()} request.`);
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
      <PageHeader title="Blood Request Management" subtitle="Review, approve and fulfil blood requests for your hospital" />
      {error && <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError('')}>{error}</Alert>}

      {!requests && !error ? <CircularProgress size={28} /> : requests && (
        <>
          <TableCard
            minWidth={760}
            toolbar={
              <Tabs value={tab} onChange={(_, v) => setTab(v)} variant="scrollable" scrollButtons="auto" sx={{ minHeight: 40, mx: -1 }}>
                {TABS.map((t) => <Tab key={t.key} value={t.key} label={`${t.label} (${counts[t.key] || 0})`} sx={{ minHeight: 40 }} />)}
              </Tabs>
            }
          >
            <Table size="small">
              <TableHead>
                <TableRow>
                  {['ID', 'Patient', 'Blood Type', 'Units', 'Urgency', 'Status', 'Requested Date'].map((h) => <TableCell key={h}>{h}</TableCell>)}
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {visible.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={8}>
                      <EmptyState
                        icon={<DescriptionIcon />}
                        title={tab === 'All' ? 'No requests yet' : `No ${tab.toLowerCase()} requests`}
                        description={tab === 'All' ? 'Requests assigned to your hospital will appear here.' : undefined}
                      />
                    </TableCell>
                  </TableRow>
                )}
                {visible.map((r) => (
                  <TableRow key={r._id} hover selected={selected?._id === r._id} onClick={() => setSelectedId(r._id)} sx={{ cursor: 'pointer' }}>
                    <TableCell sx={{ fontWeight: 600 }}>{shortRequestId(r._id)}</TableCell>
                    <TableCell>{r.patientName}</TableCell>
                    <TableCell sx={{ color: 'primary.main', fontWeight: 800 }}>{r.bloodType}</TableCell>
                    <TableCell>{r.unitsNeeded}</TableCell>
                    <TableCell><StatusBadge status={r.urgency} size="small" dot={false} /></TableCell>
                    <TableCell><StatusBadge status={r.status} size="small" /></TableCell>
                    <TableCell sx={{ whiteSpace: 'nowrap' }}>{formatDate(r.createdAt)}</TableCell>
                    <TableCell align="right" onClick={(e) => e.stopPropagation()}>
                      <Stack direction="row" spacing={1} justifyContent="flex-end">
                        {r.status === 'Pending' && (
                          <>
                            <Button size="small" variant="outlined" color="success" disabled={busyId === r._id} onClick={() => act(r._id, 'Approved')}>Approve</Button>
                            <Button size="small" variant="outlined" color="error" disabled={busyId === r._id} onClick={() => act(r._id, 'Rejected')}>Reject</Button>
                          </>
                        )}
                        {r.status === 'Approved' && (
                          <Button size="small" variant="contained" disabled={busyId === r._id} onClick={() => act(r._id, 'Fulfilled')}>
                            {busyId === r._id ? <CircularProgress size={16} color="inherit" /> : 'Fulfill'}
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
              title={`Request Status Timeline (${shortRequestId(selected._id)})`}
              subtitle={`${selected.patientName} · ${selected.unitsNeeded} unit${selected.unitsNeeded === 1 ? '' : 's'} of ${selected.bloodType}`}
            >
              <RequestTimeline request={selected} />
            </SectionCard>
          )}
        </>
      )}
    </Box>
  );
}
