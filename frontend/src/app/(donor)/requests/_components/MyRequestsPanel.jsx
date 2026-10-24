'use client';
import { useDeferredValue, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  Alert, Avatar, Box, Button, IconButton, InputBase, Pagination, Skeleton, Tab, Tabs, Typography,
} from '@mui/material';
import { alpha } from '@mui/material/styles';
import AssignmentOutlinedIcon from '@mui/icons-material/AssignmentOutlined';
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined';
import WaterDropIcon from '@mui/icons-material/WaterDrop';
import SearchIcon from '@mui/icons-material/Search';
import CloseIcon from '@mui/icons-material/Close';
import DoNotDisturbOnOutlinedIcon from '@mui/icons-material/DoNotDisturbOnOutlined';
import ListAltIcon from '@mui/icons-material/ListAlt';
import LocalHospitalOutlinedIcon from '@mui/icons-material/LocalHospitalOutlined';
import AccessTimeFilledIcon from '@mui/icons-material/AccessTimeFilled';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import VerifiedIcon from '@mui/icons-material/Verified';
import RemoveCircleIcon from '@mui/icons-material/RemoveCircle';
import SearchOffIcon from '@mui/icons-material/SearchOff';
import { CardMenu, Pill, URGENCY_TONE } from '@/components/donor/ui';
import { hospitalImageUrl, HOSPITAL_FALLBACK_IMAGE } from '@/app/(public)/appointments/_components/booking';
import { HISTORY_TABS, STATUS_META, fmtDate, statusOf } from './formModel';
import { panelSx } from './SidePanels';

const PAGE_SIZE = 5;
const STATUS_ICON = {
  Pending: <AccessTimeFilledIcon />, Approved: <CheckCircleIcon />, Rejected: <CancelIcon />,
  Fulfilled: <VerifiedIcon />, Cancelled: <RemoveCircleIcon />,
};

export function StatusBadge({ status }) {
  const meta = STATUS_META[status] || STATUS_META.Pending;
  return <Pill tone={meta.tone} icon={STATUS_ICON[status]}>{meta.label}</Pill>;
}

function HospitalCell({ request, hospital }) {
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, minWidth: 0 }}>
      <Avatar variant="rounded" alt="" src={hospitalImageUrl(hospital?.image) || HOSPITAL_FALLBACK_IMAGE}
        sx={{ width: 32, height: 32, borderRadius: '6px', bgcolor: '#EEF2F7' }}>
        <LocalHospitalOutlinedIcon fontSize="small" />
      </Avatar>
      <Typography noWrap title={request.hospitalName} sx={{ fontSize: '0.84rem', fontWeight: 600 }}>{request.hospitalName}</Typography>
    </Box>
  );
}

const BloodType = ({ type }) => (
  <Box component="span" sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.4, fontWeight: 700, fontSize: '0.84rem' }}>
    <WaterDropIcon aria-hidden="true" sx={{ fontSize: 15, color: 'primary.main' }} />{type}
  </Box>
);
const units = (n = 1) => `${n} unit${n !== 1 ? 's' : ''}`;

/**
 * The signed-in donor's own requests (the API only returns those), with status tabs, search and
 * paging. Actions follow the API's rules: only a Pending request can be cancelled by its owner.
 */
export default function MyRequestsPanel({ requests, state, onRetry, hospitalFor, onView, onCancel, busyId }) {
  const [tab, setTab] = useState('All');
  const [query, setQuery] = useState('');
  const [page, setPage] = useState(1);
  const q = useDeferredValue(query).trim().toLowerCase();

  const searched = useMemo(() => (q
    ? requests.filter((r) => [r.patientName, r.hospitalName, r.bloodType, r.urgency, r.component].some((v) => v?.toLowerCase().includes(q)))
    : requests), [requests, q]);
  const counts = useMemo(() => searched.reduce((acc, r) => {
    acc[statusOf(r)] = (acc[statusOf(r)] || 0) + 1; return acc;
  }, { All: searched.length }), [searched]);
  const shown = tab === 'All' ? searched : searched.filter((r) => statusOf(r) === tab);
  const pages = Math.max(1, Math.ceil(shown.length / PAGE_SIZE));
  const current = Math.min(page, pages);
  const pageItems = shown.slice((current - 1) * PAGE_SIZE, current * PAGE_SIZE);
  const ready = state === 'ready';

  const menuItems = (r) => [
    { label: 'View details', icon: <VisibilityOutlinedIcon />, onClick: () => onView(r) },
    statusOf(r) === 'Pending' && {
      label: 'Cancel request', icon: <DoNotDisturbOnOutlinedIcon />, danger: true, disabled: busyId === r._id, onClick: () => onCancel(r),
    },
    { label: 'Open in My Requests', icon: <ListAltIcon />, href: '/my-requests' },
  ].filter(Boolean);

  const viewBtn = (r) => (
    <Button size="small" variant="outlined" color="inherit" onClick={() => onView(r)} startIcon={<VisibilityOutlinedIcon />}
      aria-label={`View request for ${r.patientName}`}
      sx={{ borderColor: 'divider', fontWeight: 600, minWidth: 0, px: 1.5, flexShrink: 0 }}>
      View
    </Button>
  );

  return (
    <Box component="section" aria-labelledby="my-requests-title" sx={{ ...panelSx, p: 0, overflow: 'hidden' }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25, px: { xs: 2, sm: 2.5 }, pt: { xs: 2, sm: 2.25 }, flexWrap: 'wrap' }}>
        <AssignmentOutlinedIcon aria-hidden="true" sx={{ color: 'primary.main' }} />
        <Typography id="my-requests-title" component="h2" sx={{ fontWeight: 800, fontSize: '1.1rem', flex: 1 }}>My Blood Requests</Typography>
        <Box sx={{
          display: 'flex', alignItems: 'center', gap: 0.75, px: 1.25, height: 36, borderRadius: '9px', width: { xs: '100%', sm: 220 }, order: { xs: 3, sm: 0 },
          border: '1px solid', borderColor: 'divider',
          '&:focus-within': { borderColor: 'primary.main', boxShadow: (t) => `0 0 0 3px ${alpha(t.palette.primary.main, 0.14)}` },
        }}>
          <SearchIcon aria-hidden="true" sx={{ fontSize: 19, color: 'text.secondary' }} />
          <InputBase value={query} onChange={(e) => { setQuery(e.target.value); setPage(1); }} placeholder="Search requests…" fullWidth
            inputProps={{ 'aria-label': 'Search your requests', type: 'search' }} sx={{ fontSize: '0.85rem' }} />
          {query && <IconButton size="small" aria-label="Clear search" onClick={() => setQuery('')}><CloseIcon sx={{ fontSize: 16 }} /></IconButton>}
        </Box>
        <Button component={Link} href="/my-requests" size="small" sx={{ fontWeight: 700 }}>View All</Button>
      </Box>

      <Tabs value={tab} onChange={(_, v) => { setTab(v); setPage(1); }} variant="scrollable" scrollButtons={false}
        aria-label="Filter requests by status"
        sx={{
          px: { xs: 1, sm: 1.5 }, mt: 1, borderBottom: '1px solid', borderColor: 'divider', minHeight: 46,
          '& .MuiTab-root': { minHeight: 46, fontWeight: 600, fontSize: '0.88rem', px: 1.75, color: 'text.secondary' },
          '& .MuiTab-root.Mui-selected': { color: 'primary.main', fontWeight: 700 },
          '& .MuiTabs-indicator': { height: 3, borderRadius: '3px 3px 0 0' },
        }}>
        {HISTORY_TABS.map((t) => (
          <Tab key={t.value} value={t.value} id={`hist-tab-${t.value}`} aria-controls="hist-panel"
            label={`${t.label}${ready ? ` (${counts[t.value] || 0})` : ''}`} />
        ))}
      </Tabs>

      <Box id="hist-panel" role="tabpanel" aria-labelledby={`hist-tab-${tab}`} aria-busy={state === 'loading'} sx={{ p: { xs: 1.5, sm: 2 } }}>
        {state === 'loading' ? (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
            {[0, 1, 2].map((i) => <Skeleton key={i} variant="rounded" height={46} sx={{ borderRadius: '10px' }} />)}
          </Box>
        ) : state === 'error' ? (
          <Alert severity="error" variant="outlined" sx={{ borderRadius: '10px', alignItems: 'center' }}
            action={<Button color="error" size="small" onClick={onRetry}>Try again</Button>}>
            We couldn&apos;t load your requests. Check your connection and try again.
          </Alert>
        ) : requests.length === 0 ? (
          <Box sx={{ py: 4, textAlign: 'center' }}>
            <AssignmentOutlinedIcon aria-hidden="true" sx={{ fontSize: 40, color: 'text.disabled' }} />
            <Typography sx={{ fontWeight: 700, mt: 1 }}>No requests yet</Typography>
            <Typography variant="body2" color="text.secondary">Requests you submit with the form will appear here.</Typography>
          </Box>
        ) : shown.length === 0 ? (
          <Box sx={{ py: 4, textAlign: 'center' }}>
            <SearchOffIcon aria-hidden="true" sx={{ fontSize: 40, color: 'text.disabled' }} />
            <Typography sx={{ fontWeight: 700, mt: 1 }}>No requests match</Typography>
            <Button size="small" onClick={() => { setTab('All'); setQuery(''); }} sx={{ mt: 1 }}>Show all requests</Button>
          </Box>
        ) : (
          <>
            {/* Table on wider screens */}
            <Box component="table" sx={{
              display: { xs: 'none', md: 'table' }, width: '100%', borderCollapse: 'collapse', tableLayout: 'fixed',
              '& th': { textAlign: 'left', fontSize: '0.78rem', fontWeight: 700, color: 'text.secondary', py: 1, px: 1, bgcolor: (t) => t.custom.surface.subtle },
              '& th:first-of-type': { borderRadius: '8px 0 0 8px' }, '& th:last-of-type': { borderRadius: '0 8px 8px 0' },
              '& td': { py: 1.1, px: 1, borderBottom: '1px solid', borderColor: 'divider', fontSize: '0.84rem', verticalAlign: 'middle' },
              '& tr:last-of-type td': { borderBottom: 0 },
            }}>
              <caption style={{ position: 'absolute', width: 1, height: 1, overflow: 'hidden', clip: 'rect(0 0 0 0)' }}>
                Your blood requests, {HISTORY_TABS.find((t) => t.value === tab).label.toLowerCase()}
              </caption>
              <colgroup>
                <col style={{ width: 34 }} /><col /><col style={{ width: 70 }} /><col style={{ width: 72 }} />
                <col style={{ width: 88 }} /><col style={{ width: 104 }} /><col style={{ width: 118 }} /><col style={{ width: 120 }} />
              </colgroup>
              <thead>
                <tr>
                  <th scope="col">#</th><th scope="col">Hospital</th><th scope="col">Blood</th><th scope="col">Quantity</th>
                  <th scope="col">Urgency</th><th scope="col">Required By</th><th scope="col">Status</th>
                  <th scope="col"><Box component="span" sx={{ pl: 0.5 }}>Actions</Box></th>
                </tr>
              </thead>
              <tbody>
                {pageItems.map((r, i) => (
                  <tr key={r._id}>
                    <td>{(current - 1) * PAGE_SIZE + i + 1}</td>
                    <td><HospitalCell request={r} hospital={hospitalFor(r)} /></td>
                    <td><BloodType type={r.bloodType} /></td>
                    <td>{units(r.unitsNeeded)}</td>
                    <td><Pill tone={URGENCY_TONE[r.urgency] || 'neutral'}>{r.urgency}</Pill></td>
                    <td>{fmtDate(r.requiredBy) || <Box component="span" sx={{ color: 'text.disabled' }} title="Not specified">—</Box>}</td>
                    <td><StatusBadge status={statusOf(r)} /></td>
                    <td>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.25 }}>
                        {viewBtn(r)}
                        <CardMenu id={`hist-${r._id}`} label={`request for ${r.patientName}`} items={menuItems(r)} />
                      </Box>
                    </td>
                  </tr>
                ))}
              </tbody>
            </Box>

            {/* Cards on phones */}
            <Box component="ul" sx={{ display: { xs: 'flex', md: 'none' }, flexDirection: 'column', gap: 1.25, listStyle: 'none', m: 0, p: 0 }}>
              {pageItems.map((r) => (
                <Box component="li" key={r._id} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: '12px', p: 1.5 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Box sx={{ flex: 1, minWidth: 0 }}><HospitalCell request={r} hospital={hospitalFor(r)} /></Box>
                    <StatusBadge status={statusOf(r)} />
                  </Box>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 1.25, mt: 1.25, fontSize: '0.84rem' }}>
                    <BloodType type={r.bloodType} />
                    <span>{units(r.unitsNeeded)}</span>
                    <Pill tone={URGENCY_TONE[r.urgency] || 'neutral'}>{r.urgency}</Pill>
                    <Box component="span" sx={{ color: 'text.secondary' }}>
                      {r.requiredBy ? `By ${fmtDate(r.requiredBy)}` : `Sent ${fmtDate(r.createdAt) || ''}`}
                    </Box>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', mt: 1 }}>
                    {viewBtn(r)}
                    <CardMenu id={`hist-m-${r._id}`} label={`request for ${r.patientName}`} items={menuItems(r)} />
                  </Box>
                </Box>
              ))}
            </Box>

            {pages > 1 && (
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 1.5, flexWrap: 'wrap', gap: 1 }}>
                <Typography sx={{ fontSize: '0.8rem', color: 'text.secondary' }} aria-live="polite">
                  {(current - 1) * PAGE_SIZE + 1}–{Math.min(current * PAGE_SIZE, shown.length)} of {shown.length}
                </Typography>
                <Pagination size="small" shape="rounded" color="primary" count={pages} page={current} onChange={(_, p) => setPage(p)} />
              </Box>
            )}
          </>
        )}
      </Box>
    </Box>
  );
}
