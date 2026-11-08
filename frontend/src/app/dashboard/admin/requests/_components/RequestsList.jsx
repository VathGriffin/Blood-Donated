'use client';
import { useT } from '@/i18n/I18nProvider';
import {
  Box, CircularProgress, IconButton, Paper, Skeleton,
  Table, TableBody, TableCell, TableHead, TableRow, Tooltip, Typography, alpha,
} from '@mui/material';
import { Apartment, CalendarToday, Cancel, CheckCircle, DeleteOutline, EditOutlined, VisibilityOutlined } from '@mui/icons-material';
import { formatDate } from '@/lib/format';
import { reqStatus } from './requests';
import { BloodTypeChip } from '@/components/ui';
import { PatientAvatar, RequestStatusBadge, UrgencyBadge } from './RequestBadges';

// Headings: adm.reqList.cols.<key>
const COLUMNS = [
  { key: 'patient' }, { key: 'hospital' }, { key: 'blood' }, { key: 'units', align: 'center' }, { key: 'urgency' },
  { key: 'status' }, { key: 'date' }, { key: 'reason' }, { key: 'actions', align: 'right' },
];

// Square outlined icon button used for every row action.
function ActionButton({ title, label, color, onClick, disabled, children }) {
  return (
    <Tooltip title={title} arrow>
      <span>
        <IconButton
          size="small"
          aria-label={label}
          disabled={disabled}
          onClick={onClick}
          sx={(t) => {
            const c = color === 'default' ? t.palette.text.secondary : t.palette[color].main;
            return {
              width: 34, height: 34, borderRadius: '10px', border: 1, color: c,
              borderColor: alpha(c, t.palette.mode === 'dark' ? 0.4 : 0.25), bgcolor: 'background.paper',
              '& svg': { fontSize: 18 },
              '&:hover': { bgcolor: alpha(c, 0.08), borderColor: c },
              '&.Mui-disabled': { borderColor: 'divider' },
              '&:focus-visible': { outline: `2px solid ${c}`, outlineOffset: 1 },
            };
          }}
        >
          {children}
        </IconButton>
      </span>
    </Tooltip>
  );
}

/** Approve / Reject (pending only), then View, Edit and Delete. Edit and Delete need `canManage`. */
export function RequestActions({ req, busy, canManage, onStatus, onView, onEdit, onDelete }) {
  const t = useT();
  const who = req.patientName || t('adm.reqList.thisPatient');
  const pending = reqStatus(req) === 'Pending';
  return (
    <Box role="group" aria-label={t('adm.reqList.actionsFor', { who })} sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 0.75, flexShrink: 0 }}>
      {pending && (busy ? (
        <Box sx={{ width: 74, display: 'flex', justifyContent: 'center' }}><CircularProgress size={18} aria-label={t('adm.reqList.updatingStatus')} /></Box>
      ) : (
        <>
          <ActionButton title={t('adm.reqList.approve')} label={t('adm.reqList.approveFor', { who })} color="success" onClick={() => onStatus(req._id, 'Approved')}>
            <CheckCircle />
          </ActionButton>
          <ActionButton title={t('adm.reqList.reject')} label={t('adm.reqList.rejectFor', { who })} color="error" onClick={() => onStatus(req._id, 'Rejected')}>
            <Cancel />
          </ActionButton>
        </>
      ))}
      <ActionButton title={t('adm.reqList.viewDetails')} label={t('adm.reqList.viewFor', { who })} color="default" onClick={() => onView(req)}>
        <VisibilityOutlined />
      </ActionButton>
      {canManage && (
        <>
          <ActionButton title={t('adm.reqList.edit')} label={t('adm.reqList.editFor', { who })} color="info" onClick={() => onEdit(req)} disabled={busy}>
            <EditOutlined />
          </ActionButton>
          <ActionButton title={t('adm.reqList.delete')} label={t('adm.reqList.deleteFor', { who })} color="primary" onClick={() => onDelete(req)} disabled={busy}>
            <DeleteOutline />
          </ActionButton>
        </>
      )}
    </Box>
  );
}

const urgentRowSx = (t) => ({ boxShadow: `inset 3px 0 0 ${t.palette.primary.main}` });
const isUrgentPending = (req) => req.urgency === 'Critical' && reqStatus(req) === 'Pending';

/** Desktop (lg and up): one row per request. */
export function RequestsTable({ rows, loading, empty, actionsFor, onOpenPhoto }) {
  const t = useT();
  return (
    <Table sx={{ minWidth: 1080 }}>
      <TableHead>
        <TableRow
          sx={(t) => ({
            '& th': {
              bgcolor: t.palette.mode === 'dark' ? alpha('#fff', 0.03) : '#F8FAFC',
              fontWeight: 700, fontSize: '0.8rem', color: 'text.secondary', whiteSpace: 'nowrap', py: 1.5,
            },
          })}
        >
          {COLUMNS.map((c) => <TableCell key={c.key} align={c.align}>{t(`adm.reqList.cols.${c.key}`)}</TableCell>)}
        </TableRow>
      </TableHead>
      <TableBody>
        {loading ? Array.from({ length: 5 }, (_, i) => (
          <TableRow key={i} aria-hidden="true">
            <TableCell>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25 }}>
                <Skeleton variant="circular" width={38} height={38} />
                <Box><Skeleton width={90} /><Skeleton width={70} height={14} /></Box>
              </Box>
            </TableCell>
            <TableCell><Skeleton width={130} /></TableCell>
            <TableCell><Skeleton variant="rounded" width={56} height={26} sx={{ borderRadius: 999 }} /></TableCell>
            <TableCell align="center"><Skeleton width={16} sx={{ mx: 'auto' }} /></TableCell>
            <TableCell><Skeleton variant="rounded" width={72} height={22} sx={{ borderRadius: 999 }} /></TableCell>
            <TableCell><Skeleton variant="rounded" width={84} height={22} sx={{ borderRadius: 999 }} /></TableCell>
            <TableCell><Skeleton width={90} /></TableCell>
            <TableCell><Skeleton width={110} /></TableCell>
            <TableCell align="right"><Skeleton variant="rounded" width={118} height={34} sx={{ ml: 'auto' }} /></TableCell>
          </TableRow>
        )) : rows.length === 0 ? (
          <TableRow><TableCell colSpan={COLUMNS.length} sx={{ border: 0 }}>{empty}</TableCell></TableRow>
        ) : rows.map((req) => (
          <TableRow key={req._id} hover sx={isUrgentPending(req) ? urgentRowSx : undefined}>
            <TableCell sx={{ py: 1.5 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25 }}>
                <PatientAvatar req={req} onOpenPhoto={onOpenPhoto} />
                <Box sx={{ minWidth: 0 }}>
                  <Typography noWrap sx={{ fontWeight: 700, fontSize: '0.88rem', maxWidth: 160 }}>{req.patientName || '—'}</Typography>
                  {req.contact && <Typography noWrap sx={{ fontSize: '0.75rem', color: 'text.secondary', maxWidth: 160 }}>{req.contact}</Typography>}
                </Box>
              </Box>
            </TableCell>
            <TableCell sx={{ maxWidth: 200 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Apartment aria-hidden="true" sx={{ fontSize: 18, color: 'info.main', flexShrink: 0 }} />
                <Typography
                  title={req.hospitalName}
                  sx={{ fontSize: '0.86rem', fontWeight: 600, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}
                >
                  {req.hospitalName || '—'}
                </Typography>
              </Box>
            </TableCell>
            <TableCell><BloodTypeChip type={req.bloodType} /></TableCell>
            <TableCell align="center" sx={{ fontWeight: 700 }}>{req.unitsNeeded ?? '—'}</TableCell>
            <TableCell><UrgencyBadge urgency={req.urgency} /></TableCell>
            <TableCell><RequestStatusBadge status={reqStatus(req)} /></TableCell>
            <TableCell sx={{ whiteSpace: 'nowrap', fontSize: '0.85rem' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                <CalendarToday aria-hidden="true" sx={{ fontSize: 15, color: 'text.secondary' }} />{formatDate(req.createdAt)}
              </Box>
            </TableCell>
            <TableCell sx={{ maxWidth: 200 }}>
              <Typography noWrap title={req.reason} sx={{ fontSize: '0.85rem', color: 'text.secondary' }}>{req.reason || '—'}</Typography>
            </TableCell>
            <TableCell align="right" sx={{ width: 1, whiteSpace: 'nowrap' }}>{actionsFor(req)}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

/** Phones and tablets: one card per request, two columns from the sm breakpoint. */
export function RequestCards({ rows, loading, empty, actionsFor, onOpenPhoto }) {
  const t = useT();
  if (!loading && rows.length === 0) return empty;
  return (
    <Box sx={{ p: { xs: 1.5, sm: 2 }, display: 'grid', gap: 1.5, gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' } }}>
      {loading ? Array.from({ length: 4 }, (_, i) => <Skeleton key={i} variant="rounded" height={170} sx={{ borderRadius: 3 }} />)
        : rows.map((req) => (
          <Paper
            key={req._id}
            variant="outlined"
            sx={[{ p: 2, borderRadius: 3, display: 'flex', flexDirection: 'column', minWidth: 0 }, isUrgentPending(req) && urgentRowSx]}
          >
            <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5 }}>
              <PatientAvatar req={req} size={42} onOpenPhoto={onOpenPhoto} />
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1 }}>
                  <Typography noWrap sx={{ fontWeight: 700 }}>{req.patientName || '—'}</Typography>
                  <RequestStatusBadge status={reqStatus(req)} />
                </Box>
                <Typography variant="body2" color="text.secondary" noWrap sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <Apartment aria-hidden="true" sx={{ fontSize: 15 }} />{req.hospitalName || '—'}
                </Typography>
              </Box>
            </Box>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 1, mt: 1.5 }}>
              <BloodTypeChip type={req.bloodType} />
              <Typography variant="body2" sx={{ fontWeight: 600 }}>{req.unitsNeeded == null ? '—' : t('adm.reqDlg.units', { count: req.unitsNeeded })}</Typography>
              <UrgencyBadge urgency={req.urgency} />
              <Typography variant="caption" color="text.secondary" sx={{ ml: 'auto', display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <CalendarToday aria-hidden="true" sx={{ fontSize: 13 }} />{formatDate(req.createdAt)}
              </Typography>
            </Box>
            {req.reason && (
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                {req.reason}
              </Typography>
            )}
            {/* Pushes the actions to the bottom so cards in the same row line up. */}
            <Box sx={{ flexGrow: 1 }} />
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 1.5, pt: 1.25, borderTop: 1, borderColor: 'divider' }}>
              {actionsFor(req)}
            </Box>
          </Paper>
        ))}
    </Box>
  );
}
