'use client';
import { useI18n } from '@/i18n/I18nProvider';
import { memo } from 'react';
import Link from 'next/link';
import {
  Avatar, Box, Button, IconButton, Paper, Skeleton, Table, TableBody, TableCell, TableHead, TableRow,
  Tooltip, Typography, alpha,
} from '@mui/material';
import { CalendarMonthOutlined, ChatBubbleOutline, LocationOnOutlined, VisibilityOutlined, WaterDrop } from '@mui/icons-material';
import { currentIntlLocale } from '@/i18n/config';
import { formatRelative } from '@/i18n/format';
import { formatDate, initialsOf } from '@/lib/format';
import { uploadUrl } from '@/lib/config';
import { BloodTypeChip } from '@/components/ui';
import { BLOOD_TYPES } from '@/lib/inventory';
import { GIVES_TO } from '@/lib/blood-compat';
import { eligibilityOf, validDate } from '@/lib/eligibility';

// "3 weeks ago" in the interface language (components re-render when it changes).
export const relative = (date) => (validDate(date) ? formatRelative(date, currentIntlLocale()) : null);

export function DonorAvatar({ donor, size = 44 }) {
  return (
    <Box sx={{ position: 'relative', flexShrink: 0 }}>
      <Avatar src={uploadUrl(donor.photo)} alt="" slotProps={{ img: { loading: 'lazy' } }}
        sx={{ width: size, height: size, fontWeight: 700, fontSize: size * 0.36, bgcolor: (theme) => theme.custom.tones.neutral.bg, color: 'text.primary' }}>
        {initialsOf(donor.fullName)}
      </Avatar>
      {donor.available && (
        <Box aria-hidden="true" sx={{
          position: 'absolute', right: 0, bottom: 0, width: size * 0.28, height: size * 0.28, borderRadius: '50%',
          bgcolor: 'success.main', border: '2px solid', borderColor: 'background.paper',
        }} />
      )}
    </Box>
  );
}

/** "Available" / "Not available", and when available but inside the 56-day interval, when they can give again. */
export function AvailabilityBadge({ donor }) {
  const { t } = useI18n();
  const { eligible, nextDate } = eligibilityOf(donor.lastDonation);
  const tone = donor.available ? 'success' : 'warning';
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 0.4 }}>
      <Box component="span" sx={(theme) => ({
        display: 'inline-flex', alignItems: 'center', gap: 0.6, px: 1.1, height: 24, borderRadius: 999,
        fontSize: '0.75rem', fontWeight: 700, whiteSpace: 'nowrap',
        bgcolor: theme.custom.tones[tone].bg, color: theme.custom.tones[tone].fg,
      })}>
        <Box component="span" aria-hidden="true" sx={(theme) => ({ width: 7, height: 7, borderRadius: '50%', bgcolor: theme.custom.tones[tone].dot })} />
        {t(donor.available ? 'directory.available' : 'directory.notAvailable')}
      </Box>
      {donor.available && !eligible && (
        <Typography variant="caption" color="text.secondary" sx={{ lineHeight: 1.2, whiteSpace: 'nowrap' }}>
          {t('directory.canGiveFrom', { date: formatDate(nextDate) })}
        </Typography>
      )}
    </Box>
  );
}

const subline = (d, t) => {
  const n = d.donationCount || 0;
  const joined = relative(d.createdAt);
  return [t('directory.donations', { count: n }), joined && t('directory.joined', { time: joined })].filter(Boolean).join(' · ');
};

/** View Profile, Message (to the BloodLife team) and Request Blood. `compact` uses icon buttons for the first two. */
export function DonorActions({ donor, onView, onMessage, compact = false, stacked = false }) {
  const { t } = useI18n();
  const name = donor.fullName || t('directory.message.thisDonor');
  const iconBtn = (title, label, onClick, icon, color) => (
    <Tooltip title={title} arrow>
      <IconButton size="small" aria-label={label} onClick={onClick}
        sx={(theme) => {
          const c = color === 'primary' ? theme.palette.primary.main : theme.palette.text.secondary;
          return { width: 36, height: 36, borderRadius: '10px', border: 1, borderColor: alpha(c, 0.3), color: c, '& svg': { fontSize: 19 }, '&:hover': { bgcolor: alpha(c, 0.08), borderColor: c } };
        }}>
        {icon}
      </IconButton>
    </Tooltip>
  );
  return (
    <Box role="group" aria-label={t('directory.actions.group', { name })}
      sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 1, flexWrap: stacked ? 'wrap' : 'nowrap', '& .MuiButton-root': { whiteSpace: 'nowrap', borderRadius: '10px' } }}>
      {compact ? (
        <>
          {iconBtn(t('directory.actions.viewTip'), t('directory.actions.viewLabel', { name }), () => onView(donor), <VisibilityOutlined />, 'default')}
          {iconBtn(t('directory.actions.messageTip'), t('directory.actions.messageLabel', { name }), () => onMessage(donor), <ChatBubbleOutline />, 'primary')}
        </>
      ) : (
        <>
          <Button size="small" variant="outlined" color="inherit" startIcon={<VisibilityOutlined />} onClick={() => onView(donor)}
            aria-label={t('directory.actions.viewLabel', { name })} sx={{ borderColor: 'divider', flex: stacked ? 1 : 'none' }}>
            {t('directory.actions.view')}
          </Button>
          <Button size="small" variant="outlined" startIcon={<ChatBubbleOutline />} onClick={() => onMessage(donor)}
            aria-label={t('directory.actions.messageLabel', { name })} sx={{ flex: stacked ? 1 : 'none' }}>
            {t('directory.actions.message')}
          </Button>
        </>
      )}
      <Button size="small" variant="contained" component={Link} href="/requests" startIcon={<WaterDrop />}
        aria-label={t('directory.actions.requestLabel', { type: donor.bloodType || t('directory.actions.anyType') })} sx={{ flex: stacked ? '1 1 100%' : 'none' }}>
        {t('directory.actions.request')}
      </Button>
    </Box>
  );
}

const COLUMNS = ['donor', 'bloodType', 'location', 'lastDonation', 'availability', 'actions'];

// One table row. Memoised: with stable onView / onMessage it only re-renders when its own donor
// (or the action style) changes, not when a dialog opens or a filter is being typed.
const DonorRow = memo(function DonorRow({ donor: d, compactActions, onView, onMessage }) {
  const { t } = useI18n();
  return (
    <TableRow hover>
      <TableCell sx={{ py: 1.5 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <DonorAvatar donor={d} />
          <Box sx={{ minWidth: 0 }}>
            <Typography component="h3" noWrap sx={{ fontWeight: 700, fontSize: '0.92rem', maxWidth: 200 }}>{d.fullName || t('directory.profile.donor')}</Typography>
            <Typography noWrap sx={{ fontSize: '0.76rem', color: 'text.secondary', maxWidth: 220 }}>{subline(d, t)}</Typography>
          </Box>
        </Box>
      </TableCell>
      <TableCell><BloodTypeChip type={d.bloodType} /></TableCell>
      <TableCell sx={{ maxWidth: 200 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
          <LocationOnOutlined aria-hidden="true" sx={{ fontSize: 18, color: 'text.secondary', flexShrink: 0 }} />
          <Typography noWrap title={d.location} sx={{ fontSize: '0.88rem' }}>{d.location || t('directory.notGiven')}</Typography>
        </Box>
      </TableCell>
      <TableCell sx={{ whiteSpace: 'nowrap' }}>
        <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 0.75 }}>
          <CalendarMonthOutlined aria-hidden="true" sx={{ fontSize: 18, color: 'text.secondary', mt: '1px' }} />
          {validDate(d.lastDonation) ? (
            <Box>
              <Typography sx={{ fontSize: '0.88rem', fontWeight: 600 }}>{formatDate(d.lastDonation)}</Typography>
              <Typography sx={{ fontSize: '0.74rem', color: 'text.secondary' }}>({relative(d.lastDonation)})</Typography>
            </Box>
          ) : (
            <Typography sx={{ fontSize: '0.86rem', color: 'text.secondary' }}>{t('directory.noneRecorded')}</Typography>
          )}
        </Box>
      </TableCell>
      <TableCell><AvailabilityBadge donor={d} /></TableCell>
      <TableCell align="right" sx={{ width: 1, whiteSpace: 'nowrap' }}>
        <DonorActions donor={d} onView={onView} onMessage={onMessage} compact={compactActions} />
      </TableCell>
    </TableRow>
  );
});

/** Desktop table. `compactActions` shows View / Message as icon buttons (narrower screens). */
export function DonorTable({ rows, loading, compactActions = false, onView, onMessage }) {
  const { t } = useI18n();
  return (
    <Table sx={{ minWidth: 980 }} aria-label={t('directory.section')}>
      <TableHead>
        <TableRow sx={(theme) => ({
          '& th': { bgcolor: theme.palette.mode === 'dark' ? alpha('#fff', 0.03) : '#F8FAFC', fontWeight: 700, fontSize: '0.82rem', color: 'text.secondary', whiteSpace: 'nowrap', py: 1.5 },
        })}>
          {COLUMNS.map((c) => <TableCell key={c} align={c === 'actions' ? 'right' : 'left'}>{t(`directory.columns.${c}`)}</TableCell>)}
        </TableRow>
      </TableHead>
      <TableBody>
        {loading ? Array.from({ length: 6 }, (_, i) => (
          <TableRow key={i} aria-hidden="true">
            <TableCell>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                <Skeleton variant="circular" width={44} height={44} />
                <Box><Skeleton width={110} /><Skeleton width={150} height={14} /></Box>
              </Box>
            </TableCell>
            <TableCell><Skeleton variant="rounded" width={58} height={26} sx={{ borderRadius: 999 }} /></TableCell>
            <TableCell><Skeleton width={110} /></TableCell>
            <TableCell><Skeleton width={100} /><Skeleton width={80} height={14} /></TableCell>
            <TableCell><Skeleton variant="rounded" width={84} height={24} sx={{ borderRadius: 999 }} /></TableCell>
            <TableCell align="right"><Skeleton variant="rounded" width={240} height={32} sx={{ ml: 'auto' }} /></TableCell>
          </TableRow>
        )) : rows.map((d) => (
          <DonorRow key={d._id} donor={d} compactActions={compactActions} onView={onView} onMessage={onMessage} />
        ))}
      </TableBody>
    </Table>
  );
}

// One donor card (phones and tablets). Memoised like DonorRow.
const DonorCard = memo(function DonorCard({ donor: d, onView, onMessage }) {
  const { t } = useI18n();
  return (
    <Paper component="article" variant="outlined" aria-labelledby={`donor-card-${d._id}`}
      sx={{ p: 2, borderRadius: 3, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
        <DonorAvatar donor={d} size={48} />
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography id={`donor-card-${d._id}`} component="h3" noWrap sx={{ fontWeight: 700 }}>{d.fullName || t('directory.profile.donor')}</Typography>
          <Typography variant="caption" color="text.secondary" noWrap sx={{ display: 'block' }}>{subline(d, t)}</Typography>
        </Box>
        <BloodTypeChip type={d.bloodType} />
      </Box>
      <Box sx={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', columnGap: 2, rowGap: 1, mt: 1.5 }}>
        <Typography variant="body2" sx={{ display: 'flex', alignItems: 'center', gap: 0.5, minWidth: 0 }}>
          <LocationOnOutlined aria-hidden="true" sx={{ fontSize: 17, color: 'text.secondary' }} />
          <Box component="span" sx={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{d.location || t('directory.notGiven')}</Box>
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
          <CalendarMonthOutlined aria-hidden="true" sx={{ fontSize: 17 }} />
          {validDate(d.lastDonation) ? t('directory.lastGave', { time: relative(d.lastDonation) }) : t('directory.noDonation')}
        </Typography>
      </Box>
      <Box sx={{ mt: 1.25 }}><AvailabilityBadge donor={d} /></Box>
      <Box sx={{ flexGrow: 1 }} />
      <Box sx={{ mt: 1.5, pt: 1.5, borderTop: 1, borderColor: 'divider' }}>
        <DonorActions donor={d} onView={onView} onMessage={onMessage} stacked />
      </Box>
    </Paper>
  );
});

/** Phones and tablets: one card per donor, two columns from the sm breakpoint. */
export function DonorCards({ rows, loading, onView, onMessage }) {
  return (
    <Box sx={{ p: { xs: 1.5, sm: 2 }, display: 'grid', gap: 1.5, gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' } }}>
      {loading ? Array.from({ length: 4 }, (_, i) => <Skeleton key={i} variant="rounded" height={200} sx={{ borderRadius: 3 }} />)
        : rows.map((d) => <DonorCard key={d._id} donor={d} onView={onView} onMessage={onMessage} />)}
    </Box>
  );
}

/**
 * By Blood Type: one tile per type with how many donors match the other filters.
 * `counts` is queryDirectory's typeCounts: { 'A+': { total, available }, … }.
 */
export function BloodTypeSummary({ counts, loading, onPick }) {
  const { t, formatNumber } = useI18n();
  return (
    <Box sx={{ p: { xs: 1.5, sm: 2, md: 2.5 }, display: 'grid', gap: 1.5, gridTemplateColumns: { xs: '1fr 1fr', md: 'repeat(4, 1fr)' } }}>
      {BLOOD_TYPES.map((type) => {
        const { total = 0, available = 0 } = counts[type] || {};
        return (
          <Paper key={type} variant="outlined" sx={{ p: 2, borderRadius: 3, display: 'flex', flexDirection: 'column', gap: 1.25, minWidth: 0 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1 }}>
              <BloodTypeChip type={type} size="large" />
              {loading ? <Skeleton width={40} height={36} /> : (
                <Typography sx={{ fontWeight: 800, fontSize: '1.6rem', lineHeight: 1 }}>{formatNumber(total)}</Typography>
              )}
            </Box>
            <Typography variant="body2" color="text.secondary">
              {loading ? <Skeleton width="70%" /> : <>{t('directory.types.availableNow', { count: formatNumber(available) })}</>}
            </Typography>
            <Typography variant="caption" color="text.secondary" sx={{ lineHeight: 1.4 }}>
              {t('directory.types.givesTo', { types: GIVES_TO[type].join(', ') })}
            </Typography>
            <Button size="small" variant="outlined" onClick={() => onPick(type)} disabled={loading || total === 0}
              sx={{ mt: 'auto', borderRadius: '10px' }} aria-label={t('directory.types.showLabel', { type })}>
              {t('directory.types.show')}
            </Button>
          </Paper>
        );
      })}
    </Box>
  );
}
