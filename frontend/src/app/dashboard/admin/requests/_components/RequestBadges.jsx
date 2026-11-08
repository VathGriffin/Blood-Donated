'use client';
import { statusLabel } from '@/components/ui/StatusBadge';
import { useT } from '@/i18n/I18nProvider';
import { Avatar, alpha } from '@mui/material';
import { Block, Cancel, CheckCircle, HourglassTop, TaskAlt } from '@mui/icons-material';
import { StatusBadge } from '@/components/ui';
import { uploadUrl } from '@/lib/config';

// Green = approved / fulfilled / low, amber = pending / medium, orange = high, red = critical / rejected.
const STATUS_TONE = { Pending: 'warning', Approved: 'success', Rejected: 'error', Fulfilled: 'info', Cancelled: 'neutral' };
const STATUS_ICON = { Pending: HourglassTop, Approved: CheckCircle, Rejected: Cancel, Fulfilled: TaskAlt, Cancelled: Block };
const URGENCY_TONE = { Low: 'success', Medium: 'warning', High: 'warning', Critical: 'error' };

// The theme has no orange tone, so High gets its own colours on top of the amber one.
const highUrgencySx = (t) => {
  const dark = t.palette.mode === 'dark';
  return { bgcolor: dark ? 'rgba(234,88,12,0.18)' : '#FFEDD5', color: dark ? '#FDBA74' : '#C2410C', '&::before': { bgcolor: '#EA580C' } };
};

export function RequestStatusBadge({ status, size = 'small' }) {
  const t = useT();
  const Icon = STATUS_ICON[status] || HourglassTop;
  return (
    <StatusBadge
      status={status}
      tone={STATUS_TONE[status] || 'neutral'}
      dot={false}
      size={size}
      sx={{ gap: 0.5, fontWeight: 700, pl: 0.9 }}
      label={<><Icon aria-hidden="true" sx={{ fontSize: 14 }} />{statusLabel(t, status)}</>}
    />
  );
}

export function UrgencyBadge({ urgency, size = 'small' }) {
  const t = useT();
  return (
    <StatusBadge
      status={urgency || 'Low'}
      label={urgency ? statusLabel(t, urgency) : '—'}
      tone={URGENCY_TONE[urgency] || 'neutral'}
      size={size}
      sx={[
        { fontWeight: 700 },
        urgency === 'High' && highUrgencySx,
        urgency === 'Critical' && {
          // A slow pulse on the dot draws the eye to critical requests (off for reduced motion).
          '&::before': { animation: 'urgentPulse 1.6s ease-in-out infinite' },
          '@keyframes urgentPulse': { '0%,100%': { opacity: 1 }, '50%': { opacity: 0.25 } },
          '@media (prefers-reduced-motion: reduce)': { '&::before': { animation: 'none' } },
        },
      ]}
    />
  );
}

export function PatientAvatar({ req, size = 38, onOpenPhoto }) {
  const src = uploadUrl(req?.photo);
  return (
    <Avatar
      src={src}
      alt={req.patientName}
      onClick={() => req.photo && onOpenPhoto?.({ url: src, name: req.patientName })}
      sx={(t) => ({
        width: size, height: size, flexShrink: 0, fontSize: size * 0.4, fontWeight: 700,
        bgcolor: alpha(t.palette.primary.main, t.palette.mode === 'dark' ? 0.2 : 0.09),
        color: 'primary.main', cursor: req.photo ? 'pointer' : 'default',
      })}
    >
      {req.patientName?.charAt(0)?.toUpperCase()}
    </Avatar>
  );
}
