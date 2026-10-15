'use client';
import Link from 'next/link';
import { Box, Button, Paper, Typography } from '@mui/material';
import LocalHospitalOutlinedIcon from '@mui/icons-material/LocalHospitalOutlined';
import EventOutlinedIcon from '@mui/icons-material/EventOutlined';
import Inventory2OutlinedIcon from '@mui/icons-material/Inventory2Outlined';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined';
import ChatBubbleOutlineIcon from '@mui/icons-material/ChatBubbleOutline';
import HeadsetMicOutlinedIcon from '@mui/icons-material/HeadsetMicOutlined';
import DoNotDisturbOnOutlinedIcon from '@mui/icons-material/DoNotDisturbOnOutlined';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import HourglassTopIcon from '@mui/icons-material/HourglassTop';
import TaskAltIcon from '@mui/icons-material/TaskAlt';
import CancelIcon from '@mui/icons-material/Cancel';
import AddIcon from '@mui/icons-material/Add';
import {
  BloodBadge, CardMenu, MetaLine, Notice, Pill, REQUEST_STATUS, URGENCY_TONE, actionBtnSx, dangerBtnSx, formatDate, itemCardSx,
} from '@/components/donor/ui';

const STATUS_ICON = {
  Pending: <HourglassTopIcon />, Approved: <CheckCircleIcon />, Fulfilled: <TaskAltIcon />,
  Rejected: <CancelIcon />, Cancelled: <DoNotDisturbOnOutlinedIcon />,
};

/** One of the signed-in donor's own blood requests. `hospitalPhone` comes from the public hospital directory. */
export default function RequestCard({ req, hospitalPhone, onCancel, onView, cancelling = false }) {
  const status = req.status || 'Pending';
  const meta = REQUEST_STATUS[status] || REQUEST_STATUS.Pending;
  const units = req.unitsNeeded || 1;
  const tel = hospitalPhone ? `tel:${hospitalPhone.replace(/[^\d+]/g, '')}` : null;
  const updated = req.updatedAt && req.updatedAt !== req.createdAt ? formatDate(req.updatedAt) : null;

  const sendMessage = (
    <Button component={Link} href="/notification" variant="outlined" startIcon={<ChatBubbleOutlineIcon />} sx={actionBtnSx}>
      Send Message
    </Button>
  );
  // Only offered when the hospital's public listing has a phone number to call.
  const contactHospital = tel && (
    <Button component="a" href={tel} variant="outlined" startIcon={<HeadsetMicOutlinedIcon />} sx={dangerBtnSx}
      aria-label={`Contact ${req.hospitalName} by phone`}>
      Contact Hospital
    </Button>
  );

  let notice = null;
  let actions = null;
  if (status === 'Pending') {
    notice = (
      <Notice tone="warning" icon={<HourglassTopIcon />}>
        Your request is waiting for review by the hospital team.
        <Box component="span" sx={{ display: 'block', fontWeight: 500 }}>You can still cancel it while it is pending.</Box>
      </Notice>
    );
    actions = (
      <>
        <Button variant="outlined" onClick={() => onCancel(req)} disabled={cancelling} startIcon={<DoNotDisturbOnOutlinedIcon />}
          aria-label={`Cancel blood request for ${req.patientName}`} sx={dangerBtnSx}>
          Cancel Request
        </Button>
        {contactHospital}
      </>
    );
  } else if (status === 'Approved') {
    notice = (
      <Notice tone="success" icon={<CheckCircleIcon />}>
        Your request has been approved and the hospital is arranging the blood.
        <Box component="span" sx={{ display: 'block', fontWeight: 500 }}>To change or cancel it, please contact the hospital team.</Box>
      </Notice>
    );
    actions = <>{sendMessage}{contactHospital}</>;
  } else if (status === 'Fulfilled') {
    notice = (
      <Notice tone="info" icon={<TaskAltIcon />}>
        This request was fulfilled{formatDate(req.fulfilledAt) ? ` on ${formatDate(req.fulfilledAt)}` : ''}.
        <Box component="span" sx={{ display: 'block', fontWeight: 500 }}>Thank you for using BloodLife.</Box>
      </Notice>
    );
  } else if (status === 'Rejected') {
    notice = (
      <Notice tone="error" icon={<CancelIcon />}>
        This request was not approved.
        <Box component="span" sx={{ display: 'block', fontWeight: 500 }}>Ask the team why, or submit a new request.</Box>
      </Notice>
    );
    actions = (
      <>
        {sendMessage}
        <Button component={Link} href="/requests" variant="outlined" startIcon={<AddIcon />} sx={dangerBtnSx}>New Request</Button>
      </>
    );
  } else if (status === 'Cancelled') {
    notice = (
      <Notice tone="neutral" icon={<DoNotDisturbOnOutlinedIcon />}>
        You cancelled this request{formatDate(req.cancelledAt) ? ` on ${formatDate(req.cancelledAt)}` : ''}.
        {req.cancellationReason && <Box component="span" sx={{ display: 'block', fontWeight: 500 }}>Reason: {req.cancellationReason}</Box>}
      </Notice>
    );
  }

  // Only actions the API supports for a donor. Editing is staff-only (PUT /api/requests/:id),
  // and only a Pending request can be cancelled (PATCH /:id/cancel re-checks both on the server).
  const menuItems = [
    { label: 'View details', icon: <VisibilityOutlinedIcon />, onClick: () => onView(req) },
    tel && { label: 'Contact hospital', icon: <HeadsetMicOutlinedIcon />, href: tel, external: true },
    { label: 'Message BloodLife team', icon: <ChatBubbleOutlineIcon />, href: '/notification' },
    status === 'Pending' && {
      label: cancelling ? 'Cancelling…' : 'Cancel request', icon: <DoNotDisturbOnOutlinedIcon />,
      onClick: () => onCancel(req), danger: true, disabled: cancelling,
    },
  ].filter(Boolean);

  return (
    <Paper component="article" elevation={0} aria-label={`Blood request for ${req.patientName}, ${meta.label}`} sx={itemCardSx}>
      <Box sx={{ display: 'flex', gap: { xs: 1.75, sm: 3 }, alignItems: 'flex-start' }}>
        <BloodBadge type={req.bloodType} />
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
            <Box sx={{ flex: 1, minWidth: 0, display: 'flex', alignItems: 'center', gap: 1.25, flexWrap: 'wrap' }}>
              <Typography component="h3" sx={{ fontWeight: 800, fontSize: '1.2rem', mr: 0.5, overflowWrap: 'anywhere' }}>
                {req.patientName}
              </Typography>
              <Pill tone={meta.tone} icon={STATUS_ICON[status]}>{meta.label}</Pill>
              {req.urgency && <Pill tone={URGENCY_TONE[req.urgency] || 'neutral'}>{req.urgency} urgency</Pill>}
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1, flexShrink: 0 }}>
              {updated && (
                <MetaLine icon={<AccessTimeIcon />} sx={{ display: { xs: 'none', md: 'flex' }, mt: 0.5, fontSize: '0.85rem' }}>
                  Updated {updated}
                </MetaLine>
              )}
              <CardMenu id={req._id} label={`the request for ${req.patientName}`} items={menuItems} />
            </Box>
          </Box>

          <Box sx={{ mt: 1.25, display: 'flex', flexWrap: 'wrap', columnGap: 3.5, rowGap: 0.75 }}>
            <MetaLine icon={<LocalHospitalOutlinedIcon />}>{req.hospitalName}</MetaLine>
            {formatDate(req.createdAt) && (
              <MetaLine icon={<EventOutlinedIcon />}>Requested {formatDate(req.createdAt, { day: 'numeric', month: 'short', year: 'numeric' })}</MetaLine>
            )}
            <MetaLine icon={<Inventory2OutlinedIcon />}>{units} unit{units !== 1 ? 's' : ''}</MetaLine>
          </Box>

          <Typography component="h4" sx={{ mt: 2, fontWeight: 700, fontSize: '0.95rem' }}>Request reason</Typography>
          <Typography variant="body2" sx={{
            mt: 0.4, color: req.reason?.trim() ? 'text.secondary' : 'text.disabled', fontStyle: req.reason?.trim() ? 'normal' : 'italic',
            fontSize: '0.92rem', lineHeight: 1.6, overflowWrap: 'anywhere', maxWidth: 720,
          }}>
            {req.reason?.trim() || 'No additional details provided.'}
          </Typography>
        </Box>
      </Box>

      {(notice || actions) && (
        <Box sx={{ display: 'flex', alignItems: { xs: 'stretch', md: 'center' }, flexDirection: { xs: 'column', md: 'row' }, gap: 2 }}>
          {notice && <Box sx={{ flex: 1, minWidth: 0 }}>{notice}</Box>}
          {actions && (
            <Box sx={{ display: 'flex', gap: 1.5, flexShrink: 0, flexWrap: 'wrap', '& > *': { flex: { xs: '1 1 auto', md: '0 0 auto' } } }}>
              {actions}
            </Box>
          )}
        </Box>
      )}
    </Paper>
  );
}
