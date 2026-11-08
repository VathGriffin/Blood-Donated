'use client';
import { componentLabel } from '@/app/(donor)/requests/_components/formModel';
import { statusLabel } from '@/components/ui/StatusBadge';
import { useI18n, useT } from '@/i18n/I18nProvider';
import { useRef } from 'react';
import {
  Alert, Autocomplete, Avatar, Badge, Box, Button, CircularProgress, Dialog, DialogActions, DialogContent,
  DialogTitle, IconButton, MenuItem, TextField, Tooltip, Typography, alpha,
} from '@mui/material';
import {
  Bloodtype, CalendarToday, CameraAlt, Cancel, CheckCircle, Close, Delete, DeleteOutline, Edit,
  LocalHospital, Notes, Phone, Visibility, WarningAmber,
} from '@mui/icons-material';
import { uploadUrl } from '@/lib/config';
import { formatDate, formatDateTime } from '@/lib/format';
import { BLOOD_TYPES, LIMITS, UNITS, URGENCY_LEVELS, reqStatus } from './requests';
import { RequestStatusBadge, UrgencyBadge } from './RequestBadges';

export function PhotoDialog({ photo, onClose }) {
  const t = useT();
  return (
    <Dialog open={!!photo} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', pb: 1 }}>
        <Typography component="span" sx={{ fontWeight: 700 }}>{photo?.name}</Typography>
        <IconButton size="small" aria-label={t('adm.reqDlg.close')} onClick={onClose}><Close fontSize="small" /></IconButton>
      </DialogTitle>
      <DialogContent sx={{ p: 0 }}>
        <Box component="img" src={photo?.url} alt={photo?.name}
          sx={{ width: '100%', maxHeight: 480, objectFit: 'contain', display: 'block', bgcolor: 'action.hover' }} />
      </DialogContent>
    </Dialog>
  );
}

/** Read-only details, with Approve / Reject for a pending request and Edit / Delete for admins. */
export function DetailsDialog({ req, onClose, fullScreen, busy, canManage, onStatus, onEdit, onDelete, onOpenPhoto }) {
  const t = useT();
  const photoUrl = uploadUrl(req?.photo);
  return (
    <Dialog open={!!req} onClose={onClose} maxWidth="xs" fullWidth fullScreen={fullScreen} aria-labelledby="request-details-title">
      {req && (
        <>
          <Box
            sx={(t) => ({
              background: `linear-gradient(135deg, ${t.palette.primary.main} 0%, ${t.palette.primary.dark} 100%)`,
              pt: 3.5, pb: 3, px: 3, position: 'relative',
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1.2,
            })}
          >
            <IconButton size="small" aria-label={t('adm.reqDlg.close')} onClick={onClose} sx={{ position: 'absolute', top: 10, right: 10, color: 'rgba(255,255,255,0.85)' }}>
              <Close fontSize="small" />
            </IconButton>
            <Avatar src={photoUrl} alt={req.patientName}
              onClick={() => req.photo && onOpenPhoto({ url: photoUrl, name: req.patientName })}
              sx={{ width: 80, height: 80, bgcolor: 'rgba(255,255,255,0.2)', color: '#fff', fontSize: '2rem', fontWeight: 800,
                border: '3px solid rgba(255,255,255,0.5)', cursor: req.photo ? 'pointer' : 'default' }}>
              {req.patientName?.charAt(0)?.toUpperCase()}
            </Avatar>
            <Typography id="request-details-title" component="h2" sx={{ fontWeight: 800, fontSize: '1.1rem', color: '#fff', textAlign: 'center' }}>
              {req.patientName}
            </Typography>
            <Box sx={{ display: 'flex', gap: 0.75, justifyContent: 'center', flexWrap: 'wrap' }}>
              <Box component="span" sx={{ px: 1.25, height: 24, borderRadius: 999, display: 'inline-flex', alignItems: 'center',
                bgcolor: 'rgba(255,255,255,0.2)', color: '#fff', fontWeight: 800, fontSize: '0.75rem' }}>
                {req.bloodType}
              </Box>
              <UrgencyBadge urgency={req.urgency} />
              <RequestStatusBadge status={reqStatus(req)} />
            </Box>
          </Box>

          <DialogContent sx={{ p: 2.5 }}>
            <Box sx={{ border: 1, borderColor: 'divider', borderRadius: 2.5, overflow: 'hidden', mb: 2 }}>
              {[
                { icon: <LocalHospital />, label: t('adm.reqDlg.rows.hospital'), value: req.hospitalName },
                { icon: <Bloodtype />, label: t('adm.reqDlg.rows.units'), value: `${req.unitsNeeded}${req.component ? ` · ${componentLabel(req.component)}` : ''}` },
                ...(req.patientAge != null ? [{ icon: <Notes />, label: t('adm.reqDlg.rows.age'), value: req.patientAge }] : []),
                ...(req.requiredBy ? [{ icon: <CalendarToday />, label: t('adm.reqDlg.rows.requiredBy'), value: formatDateTime(req.requiredBy) }] : []),
                { icon: <Phone />, label: t('adm.reqDlg.rows.contact'), value: req.contact },
                { icon: <Notes />, label: t('adm.reqDlg.rows.reason'), value: req.reason },
                { icon: <CalendarToday />, label: t('adm.reqDlg.rows.submitted'), value: formatDate(req.createdAt) },
                ...(req.cancellationReason ? [{ icon: <Cancel />, label: t('adm.reqDlg.rows.cancelReason'), value: req.cancellationReason }] : []),
              ].map((row, i, arr) => (
                <Box key={row.label} sx={{
                  display: 'flex', alignItems: 'flex-start', gap: 1.5, px: 2, py: 1.4,
                  bgcolor: i % 2 ? 'action.hover' : 'background.paper',
                  borderBottom: i < arr.length - 1 ? 1 : 0, borderColor: 'divider',
                }}>
                  <Box sx={{ mt: 0.3, flexShrink: 0, color: 'primary.main', display: 'flex', '& svg': { fontSize: 18 } }}>{row.icon}</Box>
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography sx={{ fontSize: '0.68rem', color: 'text.secondary', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', mb: 0.2 }}>
                      {row.label}
                    </Typography>
                    <Typography sx={{ fontSize: '0.875rem', fontWeight: 600, wordBreak: 'break-word' }}>{row.value || '—'}</Typography>
                  </Box>
                </Box>
              ))}
            </Box>

            {reqStatus(req) === 'Pending' && (
              <Box sx={{ display: 'flex', gap: 1.5, mb: 1.5 }}>
                <Button fullWidth variant="contained" color="success" startIcon={busy ? <CircularProgress size={16} color="inherit" /> : <CheckCircle />}
                  disabled={busy} onClick={() => onStatus(req._id, 'Approved')}>
                  {t('adm.reqDlg.approve')}
                </Button>
                <Button fullWidth variant="contained" color="error" startIcon={<Cancel />}
                  disabled={busy} onClick={() => onStatus(req._id, 'Rejected')}>
                  {t('adm.reqDlg.reject')}
                </Button>
              </Box>
            )}
            {canManage && (
              <Box sx={{ display: 'flex', gap: 1.5 }}>
                <Button fullWidth variant="outlined" startIcon={<Edit />} onClick={() => onEdit(req)}>{t('adm.reqDlg.edit')}</Button>
                <Button fullWidth variant="outlined" color="error" startIcon={<Delete />} onClick={() => onDelete(req)}>{t('adm.reqDlg.delete')}</Button>
              </Box>
            )}
            {req.photo && (
              <Button fullWidth size="small" startIcon={<Visibility fontSize="small" />} sx={{ mt: 1.5 }}
                onClick={() => onOpenPhoto({ url: photoUrl, name: req.patientName })}>
                {t('adm.reqDlg.viewFullPhoto')}
              </Button>
            )}
          </DialogContent>
        </>
      )}
    </Dialog>
  );
}

export function DeleteDialog({ req, deleting, onCancel, onConfirm }) {
  const { t, rich } = useI18n();
  return (
    <Dialog open={!!req} onClose={() => !deleting && onCancel()} maxWidth="xs" fullWidth
      aria-labelledby="delete-request-title" aria-describedby="delete-request-desc">
      <DialogTitle id="delete-request-title" sx={{ display: 'flex', alignItems: 'center', gap: 1.5, fontWeight: 800 }}>
        <Box sx={(t) => ({ width: 40, height: 40, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
          bgcolor: alpha(t.palette.error.main, 0.12), color: 'error.main' })}>
          <WarningAmber />
        </Box>
        {t('adm.reqDlg.deleteThisRequest')}
      </DialogTitle>
      <DialogContent>
        <Typography id="delete-request-desc" variant="body2" color="text.secondary">
          {rich('adm.reqDlg.deleteText', { patient: <b>{req?.patientName}</b> }, { type: req?.bloodType, units: t('adm.reqDlg.units', { count: req?.unitsNeeded || 0 }), hospital: req?.hospitalName })}
        </Typography>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2.5 }}>
        <Button color="inherit" onClick={onCancel} disabled={deleting} autoFocus>{t('adm.reqDlg.cancel')}</Button>
        <Button variant="contained" color="error" onClick={onConfirm} disabled={deleting}
          startIcon={deleting ? <CircularProgress size={16} color="inherit" /> : <Delete />}>
          {deleting ? t('adm.reqDlg.deleting') : t('adm.reqDlg.delete')}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

// Character count shown under a text field once it gets close to its limit.
const counter = (value, max) => (value.length > max * 0.8 ? `${value.length}/${max}` : ' ');

/** New / Edit request form. Field errors come from validateRequestForm (same rules as the API). */
export function RequestFormDialog({
  open, editing, form, errors, formError, saving, fullScreen, hospitalOptions, photoPreview,
  onField, onPickPhoto, onRemovePhoto, onClose, onSubmit,
}) {
  const t = useT();
  const fileInputRef = useRef(null);
  const pick = () => fileInputRef.current?.click();
  const text = (name, label, props = {}) => (
    <TextField
      fullWidth
      label={label}
      name={name}
      value={form[name]}
      onChange={(e) => onField(name, e.target.value)}
      error={!!errors[name]}
      helperText={errors[name] || counter(form[name], LIMITS[name])}
      slotProps={{ htmlInput: { maxLength: LIMITS[name] } }}
      {...props}
    />
  );
  const select = (name, label, options) => (
    <TextField select fullWidth required label={label} name={name} value={form[name]}
      onChange={(e) => onField(name, e.target.value)} error={!!errors[name]} helperText={errors[name] || ' '}>
      {options.map((o) => <MenuItem key={o} value={o}>{name === 'urgency' ? statusLabel(t, o) : o}</MenuItem>)}
    </TextField>
  );
  return (
    <Dialog open={open} onClose={() => !saving && onClose()} maxWidth="sm" fullWidth fullScreen={fullScreen}>
      <Box component="form" noValidate onSubmit={(e) => { e.preventDefault(); onSubmit(); }}>
        <DialogTitle sx={{ fontWeight: 800 }}>
          {editing ? t('adm.reqDlg.editTitle') : t('adm.reqDlg.newTitle')}
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            {editing ? t('adm.reqDlg.requiredNote') : t('adm.reqDlg.newNote')}
          </Typography>
        </DialogTitle>
        <DialogContent dividers>
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mb: 2.5, mt: 1 }}>
            <Badge overlap="circular" anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
              badgeContent={
                <Tooltip title={t('adm.reqDlg.changePhoto')}>
                  <IconButton size="small" aria-label={t('adm.reqDlg.changePhoto')} onClick={pick}
                    sx={{ bgcolor: 'primary.main', color: '#fff', width: 32, height: 32, border: '2px solid', borderColor: 'background.paper',
                      '&:hover': { bgcolor: 'primary.dark' } }}>
                    <CameraAlt sx={{ fontSize: 16 }} />
                  </IconButton>
                </Tooltip>
              }>
              <Avatar src={photoPreview || undefined} alt="" onClick={pick}
                sx={(t) => ({ width: 96, height: 96, bgcolor: alpha(t.palette.primary.main, 0.1), color: 'primary.main', fontSize: '2rem', fontWeight: 700, cursor: 'pointer' })}>
                {!photoPreview && form.patientName?.trim().charAt(0)?.toUpperCase()}
              </Avatar>
            </Badge>
            <input ref={fileInputRef} type="file" accept="image/*" hidden
              onChange={(e) => { const f = e.target.files[0]; e.target.value = ''; if (f) onPickPhoto(f); }} />
            <Box sx={{ display: 'flex', gap: 1, mt: 1.5 }}>
              <Button size="small" variant="outlined" onClick={pick}>{photoPreview ? t('adm.reqDlg.changePhoto') : t('adm.reqDlg.uploadPhoto')}</Button>
              {photoPreview && (
                <Button size="small" variant="outlined" color="inherit" startIcon={<DeleteOutline />} onClick={onRemovePhoto}>{t('adm.reqDlg.remove')}</Button>
              )}
            </Box>
            <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5 }}>{t('adm.reqDlg.jpgPngWebpMax')}</Typography>
          </Box>

          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, columnGap: 2, rowGap: 0.5 }}>
            {text('patientName', t('adm.reqDlg.fields.patient'), { required: true, autoFocus: !editing })}
            {/* Suggests hospitals already used in requests; any name can still be typed. */}
            <Autocomplete
              freeSolo
              options={hospitalOptions}
              inputValue={form.hospitalName}
              onInputChange={(_, v) => onField('hospitalName', v)}
              renderInput={(params) => (
                <TextField {...params} label={t('adm.reqDlg.hospitalName')} required error={!!errors.hospitalName}
                  helperText={errors.hospitalName || counter(form.hospitalName, LIMITS.hospitalName)}
                  slotProps={{ htmlInput: { ...params.inputProps, maxLength: LIMITS.hospitalName } }} />
              )}
            />
            {select('bloodType', t('adm.reqDlg.fields.bloodType'), BLOOD_TYPES)}
            {select('unitsNeeded', t('adm.reqDlg.fields.units'), UNITS)}
            {select('urgency', t('adm.reqDlg.fields.urgency'), URGENCY_LEVELS)}
            {text('contact', t('adm.reqDlg.fields.contact'))}
            {text('reason', t('adm.reqDlg.fields.reason'), { required: true, multiline: true, minRows: 3, sx: { gridColumn: '1 / -1' } })}
          </Box>
          {formError && <Alert severity="error" sx={{ mt: 1.5 }}>{formError}</Alert>}
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button onClick={onClose} color="inherit" disabled={saving}>{t('adm.reqDlg.cancel')}</Button>
          <Button type="submit" variant="contained" disabled={saving}
            startIcon={saving ? <CircularProgress size={16} color="inherit" /> : null}>
            {saving ? t('adm.reqDlg.saving') : editing ? t('adm.reqDlg.saveChanges') : t('adm.reqDlg.create')}
          </Button>
        </DialogActions>
      </Box>
    </Dialog>
  );
}
