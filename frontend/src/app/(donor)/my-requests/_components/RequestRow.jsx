'use client';
import Link from 'next/link';
import { Box, Button, Paper, Typography } from '@mui/material';
import LocalHospitalOutlinedIcon from '@mui/icons-material/LocalHospitalOutlined';
import PlaceOutlinedIcon from '@mui/icons-material/PlaceOutlined';
import EventOutlinedIcon from '@mui/icons-material/EventOutlined';
import Inventory2OutlinedIcon from '@mui/icons-material/Inventory2Outlined';
import SignalCellularAltIcon from '@mui/icons-material/SignalCellularAlt';
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined';
import HeadsetMicOutlinedIcon from '@mui/icons-material/HeadsetMicOutlined';
import ChatBubbleOutlineIcon from '@mui/icons-material/ChatBubbleOutline';
import DoNotDisturbOnOutlinedIcon from '@mui/icons-material/DoNotDisturbOnOutlined';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import HourglassTopIcon from '@mui/icons-material/HourglassTop';
import Inventory2Icon from '@mui/icons-material/Inventory2';
import CancelIcon from '@mui/icons-material/Cancel';
import AddIcon from '@mui/icons-material/Add';
import {
  BloodBadge, CardMenu, MetaLine, Pill, REQUEST_STATUS, URGENCY_TONE, actionBtnSx, dangerBtnSx, formatDate,
} from '@/components/donor/ui';
import { statusOf } from './requests';

const STATUS_ICON = {
  Pending: <HourglassTopIcon />, Approved: <CheckCircleIcon />, Fulfilled: <Inventory2Icon />,
  Rejected: <CancelIcon />, Cancelled: <DoNotDisturbOnOutlinedIcon />,
};

// The line under the status badge — only dates the API actually records.
const statusNote = (r) => {
  const s = statusOf(r);
  if (s === 'Pending') return 'Awaiting review by the hospital team';
  if (s === 'Fulfilled') return formatDate(r.fulfilledAt) ? `Fulfilled on ${formatDate(r.fulfilledAt)}` : 'Blood delivered';
  if (s === 'Cancelled') return formatDate(r.cancelledAt) ? `Cancelled on ${formatDate(r.cancelledAt)}` : 'Cancelled by you';
  if (s === 'Approved') return 'The hospital is arranging the blood';
  if (s === 'Rejected') return 'Not approved by the hospital team';
  return null;
};

const telHref = (phone) => (phone ? `tel:${phone.replace(/[^\d+]/g, '')}` : null);

/**
 * One of the donor's own blood requests. Only actions the API allows a donor are offered:
 * viewing, contacting the hospital / BloodLife team, and cancelling while Pending
 * (PATCH /api/requests/:id/cancel re-checks ownership and status). Editing is staff-only.
 */
export default function RequestRow({ req, hospital, onView, onCancel, cancelling = false }) {
  const status = statusOf(req);
  const meta = REQUEST_STATUS[status] || REQUEST_STATUS.Pending;
  const units = req.unitsNeeded || 1;
  const tel = telHref(hospital?.phone);
  const city = hospital?.city;

  const viewBtn = (
    <Button variant="outlined" startIcon={<VisibilityOutlinedIcon />} onClick={() => onView(req)} sx={actionBtnSx}
      aria-label={`View details of the request for ${req.patientName}`}>
      View Details
    </Button>
  );
  let second = null;
  if (status === 'Pending') {
    second = (
      <Button variant="outlined" startIcon={<DoNotDisturbOnOutlinedIcon />} onClick={() => onCancel(req)} disabled={cancelling}
        sx={dangerBtnSx} aria-label={`Cancel the request for ${req.patientName}`}>
        {cancelling ? 'Cancelling…' : 'Cancel Request'}
      </Button>
    );
  } else if (status === 'Approved') {
    second = tel ? (
      <Button component="a" href={tel} variant="outlined" startIcon={<HeadsetMicOutlinedIcon />} sx={dangerBtnSx}
        aria-label={`Call ${hospital.name}`}>
        Contact Hospital
      </Button>
    ) : (
      <Button component={Link} href="/notification" variant="outlined" startIcon={<ChatBubbleOutlineIcon />} sx={dangerBtnSx}>
        Send Message
      </Button>
    );
  }

  const menuItems = [
    { label: 'View details', icon: <VisibilityOutlinedIcon />, onClick: () => onView(req) },
    tel && { label: 'Contact hospital', icon: <HeadsetMicOutlinedIcon />, href: tel, external: true },
    { label: 'Message BloodLife team', icon: <ChatBubbleOutlineIcon />, href: '/notification' },
    { label: 'New blood request', icon: <AddIcon />, href: '/requests' },
    status === 'Pending' && {
      label: cancelling ? 'Cancelling…' : 'Cancel request', icon: <DoNotDisturbOnOutlinedIcon />,
      onClick: () => onCancel(req), danger: true, disabled: cancelling,
    },
  ].filter(Boolean);

  return (
    <Paper component="article" elevation={0} aria-label={`Blood request for ${req.patientName}, ${meta.label}`} sx={{
      p: { xs: 1.75, sm: 2.25 }, borderRadius: '16px', border: '1px solid', borderColor: 'divider', bgcolor: 'background.paper',
      boxShadow: (t) => t.custom.shadow.xs, transition: 'box-shadow .15s', '&:hover': { boxShadow: (t) => t.custom.shadow.sm },
      display: 'grid', columnGap: { xs: 1.75, sm: 2.5 }, rowGap: 1.75,
      gridTemplateColumns: { xs: 'auto minmax(0, 1fr) auto', lg: 'auto minmax(0, 1fr) auto auto' },
      gridTemplateAreas: {
        xs: '"badge info menu" "status status status" "actions actions actions"',
        lg: '"badge info status menu" "badge info actions actions"',
      },
    }}>
      <Box sx={{ gridArea: 'badge' }}><BloodBadge type={req.bloodType} width={72} height={88} /></Box>

      <Box sx={{ gridArea: 'info', minWidth: 0 }}>
        <Typography component="h3" sx={{ fontWeight: 800, fontSize: { xs: '1.05rem', sm: '1.15rem' }, overflowWrap: 'anywhere' }}>
          {req.patientName}
        </Typography>
        <Box sx={{ mt: 0.75, display: 'flex', flexWrap: 'wrap', columnGap: 3, rowGap: 0.6 }}>
          <MetaLine icon={<LocalHospitalOutlinedIcon />}>{req.hospitalName}</MetaLine>
          {city && <MetaLine icon={<PlaceOutlinedIcon />}>{city}</MetaLine>}
        </Box>
        <Box sx={{ mt: 0.75, display: 'flex', flexWrap: 'wrap', alignItems: 'center', columnGap: 3, rowGap: 0.6 }}>
          {formatDate(req.createdAt) && <MetaLine icon={<EventOutlinedIcon />}>Requested {formatDate(req.createdAt)}</MetaLine>}
          <MetaLine icon={<Inventory2OutlinedIcon />}>{units} unit{units !== 1 ? 's' : ''}</MetaLine>
          {req.urgency && (
            <Pill tone={URGENCY_TONE[req.urgency] || 'neutral'} icon={<SignalCellularAltIcon />}>{req.urgency}</Pill>
          )}
        </Box>
        <Typography sx={{ mt: 1.25, fontSize: '0.88rem', fontWeight: 700 }}>Reason</Typography>
        <Typography variant="body2" sx={{
          color: req.reason?.trim() ? 'text.secondary' : 'text.disabled', fontStyle: req.reason?.trim() ? 'normal' : 'italic',
          overflowWrap: 'anywhere', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden',
        }}>
          {req.reason?.trim() || 'No additional details provided.'}
        </Typography>
      </Box>

      <Box sx={{ gridArea: 'status', display: 'flex', flexDirection: { xs: 'row', lg: 'column' }, alignItems: { xs: 'center', lg: 'flex-start' }, gap: 0.75, flexWrap: 'wrap', minWidth: { lg: 200 } }}>
        <Pill tone={meta.tone} icon={STATUS_ICON[status]} sx={{ fontSize: '0.82rem', py: 0.5, px: 1.25 }}>{meta.label}</Pill>
        {statusNote(req) && <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.82rem' }}>{statusNote(req)}</Typography>}
      </Box>

      <Box sx={{ gridArea: 'actions', display: 'flex', gap: 1.25, flexWrap: 'wrap', justifyContent: { lg: 'flex-end' }, alignSelf: 'end', '& > *': { flex: { xs: '1 1 auto', lg: '0 0 auto' } } }}>
        {viewBtn}
        {second}
      </Box>

      <Box sx={{ gridArea: 'menu', alignSelf: 'start' }}>
        <CardMenu id={req._id} label={`the request for ${req.patientName}`} items={menuItems} />
      </Box>
    </Paper>
  );
}
