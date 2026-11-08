'use client';
import { useT } from '@/i18n/I18nProvider';
import { useEffect, useRef, useState } from 'react';
import {
  Box, Typography, Avatar, Button, Alert, CircularProgress, TextField, Snackbar, InputAdornment, IconButton,
} from '@mui/material';
import {
  AddAPhoto, Delete, Person, Lock, Visibility, VisibilityOff, LocalHospital, Email, Badge as BadgeIcon, Save,
} from '@mui/icons-material';
import axios from 'axios';
import API_BASE, { uploadUrl } from '@/lib/config';
import { apiErrorMessage } from '@/lib/api-error';
import { initialsOf } from '@/lib/format';
import { useAuth } from '@/store/AuthContext';
import { PageHeader, SectionCard } from '@/components/ui';

const MAX_PHOTO_SIZE = 10 * 1024 * 1024; // must match the multer limit in Backend/src/common/upload.js
const PHOTO_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']; // same list the server accepts
const PASSWORD_MIN = 8; // must match Backend/src/staff/password-rules.js

// Hospital staff's own profile: photo (POST/DELETE /api/staff/me/photo), display name
// (PATCH /api/staff/me) and password (PATCH /api/staff/me/password). updateStaff() pushes
// changes into the top-bar account menu straight away.
export default function HospitalProfile() {
  const { token, staff, updateStaff } = useAuth();
  const t = useT();
  const auth = { headers: { Authorization: `Bearer ${token}` } };
  const [toast, setToast] = useState('');

  // The saved session has the hospital's id but not its name.
  const [hospitalName, setHospitalName] = useState('');
  useEffect(() => {
    if (!token) return undefined;
    let alive = true;
    axios.get(`${API_BASE}/api/staff/me`, { headers: { Authorization: `Bearer ${token}` } })
      .then(({ data }) => { if (alive) setHospitalName(data.hospitalName || ''); })
      .catch(() => {});
    return () => { alive = false; };
  }, [token]);

  // ── Photo ──
  const [photoBusy, setPhotoBusy] = useState(false);
  const [photoError, setPhotoError] = useState('');
  const fileInput = useRef(null);

  const changePhoto = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = ''; // allow re-selecting the same file later
    if (!file) return;
    if (!PHOTO_TYPES.includes(file.type)) { setPhotoError(t('hosp.profile.photoType')); return; }
    if (file.size > MAX_PHOTO_SIZE) { setPhotoError(t('hosp.profile.photoSize', { max: MAX_PHOTO_SIZE / (1024 * 1024) })); return; }
    setPhotoBusy(true);
    setPhotoError('');
    try {
      const form = new FormData();
      form.append('photo', file);
      const { data } = await axios.post(`${API_BASE}/api/staff/me/photo`, form, auth);
      updateStaff({ photo: data.photo });
      setToast(t('hosp.profile.photoUpdated'));
    } catch (err) {
      setPhotoError(apiErrorMessage(err, t('hosp.profile.photoFailed')));
    } finally { setPhotoBusy(false); }
  };

  const removePhoto = async () => {
    setPhotoBusy(true);
    setPhotoError('');
    try {
      await axios.delete(`${API_BASE}/api/staff/me/photo`, auth);
      updateStaff({ photo: null });
      setToast(t('hosp.profile.photoRemoved'));
    } catch (err) {
      setPhotoError(apiErrorMessage(err, t('hosp.profile.removeFailed')));
    } finally { setPhotoBusy(false); }
  };

  // ── Name ──
  const [name, setName] = useState(staff?.fullName || '');
  const [nameBusy, setNameBusy] = useState(false);
  const [nameError, setNameError] = useState('');
  const nameChanged = name.trim() && name.trim() !== staff?.fullName;

  const saveName = async (e) => {
    e.preventDefault();
    if (!name.trim()) { setNameError(t('hosp.profile.nameEmpty')); return; }
    setNameBusy(true);
    setNameError('');
    try {
      const { data } = await axios.patch(`${API_BASE}/api/staff/me`, { fullName: name.trim() }, auth);
      updateStaff({ fullName: data.fullName || name.trim() });
      setName(data.fullName || name.trim());
      setToast(t('hosp.profile.nameUpdated'));
    } catch (err) {
      setNameError(apiErrorMessage(err, t('hosp.profile.nameFailed')));
    } finally { setNameBusy(false); }
  };

  // ── Password ──
  const emptyPw = { current: '', next: '', confirm: '' };
  const [pw, setPw] = useState(emptyPw);
  const [showPw, setShowPw] = useState(false);
  const [pwBusy, setPwBusy] = useState(false);
  const [pwError, setPwError] = useState('');
  const setPwField = (k) => (e) => { setPw((p) => ({ ...p, [k]: e.target.value })); setPwError(''); };
  const tooShort = pw.next && pw.next.length < PASSWORD_MIN;
  const mismatch = pw.confirm && pw.next !== pw.confirm;

  const savePassword = async (e) => {
    e.preventDefault();
    if (!pw.current || !pw.next) { setPwError(t('hosp.profile.pwMissing')); return; }
    if (tooShort || mismatch) return;
    if (pw.current === pw.next) { setPwError(t('hosp.profile.pwSame')); return; }
    setPwBusy(true);
    setPwError('');
    try {
      await axios.patch(`${API_BASE}/api/staff/me/password`, { currentPassword: pw.current, newPassword: pw.next }, auth);
      setPw(emptyPw);
      setToast(t('hosp.profile.pwChanged'));
    } catch (err) {
      setPwError(apiErrorMessage(err, t('hosp.profile.pwFailed')));
    } finally { setPwBusy(false); }
  };

  const eye = (
    <InputAdornment position="end">
      <IconButton size="small" aria-label={t(showPw ? 'auth.hidePasswords' : 'auth.showPasswords')} onClick={() => setShowPw((s) => !s)}>
        {showPw ? <VisibilityOff fontSize="small" /> : <Visibility fontSize="small" />}
      </IconButton>
    </InputAdornment>
  );

  return (
    <Box sx={{ maxWidth: 980 }}>
      <PageHeader title={t('hosp.profile.myProfile')} subtitle={t('hosp.profile.yourPhotoNameAnd')} />

      <Box sx={{ display: 'grid', gap: { xs: 2, md: 3 }, gridTemplateColumns: { xs: 'minmax(0,1fr)', md: '320px minmax(0,1fr)' }, alignItems: 'start' }}>
        {/* Identity card */}
        <SectionCard>
          <Box display="flex" flexDirection="column" alignItems="center" textAlign="center" gap={1.5}>
            <Box position="relative">
              <Avatar src={uploadUrl(staff?.photo)} alt=""
                sx={(t) => ({ width: 112, height: 112, fontSize: '2.2rem', fontWeight: 800, bgcolor: t.custom.tones.primary.bg, color: 'primary.main',
                  border: '4px solid', borderColor: 'background.paper', boxShadow: t.custom.shadow.md, opacity: photoBusy ? 0.5 : 1 })}>
                {initialsOf(staff?.fullName)}
              </Avatar>
              {photoBusy && <CircularProgress size={36} sx={{ position: 'absolute', top: 38, left: 38 }} />}
            </Box>
            <Box>
              <Typography fontWeight={800} fontSize="1.15rem">{staff?.fullName}</Typography>
              <Typography variant="body2" color="text.secondary">{t('hosp.profile.hospitalStaff')}</Typography>
            </Box>
            <Box display="flex" gap={1} flexWrap="wrap" justifyContent="center">
              <Button size="small" variant="outlined" disabled={photoBusy} startIcon={<AddAPhoto />} onClick={() => fileInput.current?.click()}>
                {staff?.photo ? t('hosp.profile.changePhoto') : t('hosp.profile.uploadPhoto')}
              </Button>
              {staff?.photo && (
                <Button size="small" color="inherit" disabled={photoBusy} startIcon={<Delete />} onClick={removePhoto} sx={{ color: 'text.secondary' }}>
                  {t('hosp.profile.remove')}
                </Button>
              )}
            </Box>
            <Typography variant="caption" color={photoError ? 'error' : 'text.secondary'}>
              {photoError || t('hosp.profile.photoHint')}
            </Typography>
            <input ref={fileInput} type="file" hidden accept={PHOTO_TYPES.join(',')} onChange={changePhoto} />

            <Box sx={{ width: '100%', borderTop: 1, borderColor: 'divider', pt: 2, mt: 0.5, display: 'flex', flexDirection: 'column', gap: 1.25, textAlign: 'left' }}>
              {[
                { icon: <LocalHospital />, label: t('hosp.profile.hospital'), value: hospitalName || '—' },
                { icon: <Email />, label: t('hosp.profile.signInEmail'), value: staff?.email },
                { icon: <BadgeIcon />, label: t('hosp.profile.role'), value: t('hosp.profile.hospitalStaff') },
              ].map((r) => (
                <Box key={r.label} display="flex" gap={1.25} alignItems="flex-start">
                  <Box sx={{ color: 'primary.main', display: 'flex', mt: 0.25, '& svg': { fontSize: 18 } }}>{r.icon}</Box>
                  <Box minWidth={0}>
                    <Typography fontSize="0.7rem" fontWeight={700} color="text.secondary" textTransform="uppercase" letterSpacing="0.05em">{r.label}</Typography>
                    <Typography fontSize="0.88rem" fontWeight={600} sx={{ overflowWrap: 'anywhere' }}>{r.value}</Typography>
                  </Box>
                </Box>
              ))}
            </Box>
          </Box>
        </SectionCard>

        <Box display="flex" flexDirection="column" gap={{ xs: 2, md: 3 }}>
          {/* Name */}
          <SectionCard icon={<Person />} title={t('hosp.profile.displayName')} subtitle={t('hosp.profile.shownInTheDashboard')}>
            <Box component="form" onSubmit={saveName} display="flex" gap={1.5} flexWrap="wrap" alignItems="flex-start">
              <TextField label={t('hosp.profile.fullName')} value={name} onChange={(e) => { setName(e.target.value); setNameError(''); }}
                error={!!nameError} helperText={nameError} autoComplete="name" sx={{ flex: '1 1 260px' }} />
              <Button type="submit" variant="contained" disabled={!nameChanged || nameBusy} sx={{ height: 56 }}
                startIcon={nameBusy ? <CircularProgress size={16} color="inherit" /> : <Save />}>
                {t('hosp.profile.save')}
              </Button>
            </Box>
          </SectionCard>

          {/* Password */}
          <SectionCard icon={<Lock />} title={t('hosp.profile.changePassword')} subtitle={t('hosp.profile.pwRule', { min: PASSWORD_MIN })}>
            <Box component="form" onSubmit={savePassword} display="grid" gap={2} gridTemplateColumns={{ xs: '1fr', sm: '1fr 1fr' }}>
              <TextField label={t('hosp.profile.currentPassword')} type={showPw ? 'text' : 'password'} value={pw.current} onChange={setPwField('current')}
                autoComplete="current-password" sx={{ gridColumn: '1 / -1' }} slotProps={{ input: { endAdornment: eye } }} />
              <TextField label={t('hosp.profile.newPassword')} type={showPw ? 'text' : 'password'} value={pw.next} onChange={setPwField('next')}
                autoComplete="new-password" error={!!tooShort} helperText={tooShort ? t('hosp.profile.pwShort', { min: PASSWORD_MIN }) : ' '} />
              <TextField label={t('hosp.profile.confirmNewPassword')} type={showPw ? 'text' : 'password'} value={pw.confirm} onChange={setPwField('confirm')}
                autoComplete="new-password" error={!!mismatch} helperText={mismatch ? t('hosp.profile.pwMismatch') : ' '} />
              {pwError && <Alert severity="error" sx={{ gridColumn: '1 / -1', borderRadius: 2 }}>{pwError}</Alert>}
              <Box sx={{ gridColumn: '1 / -1' }}>
                <Button type="submit" variant="contained" disabled={pwBusy || !pw.current || !pw.next || !pw.confirm || !!tooShort || !!mismatch}
                  startIcon={pwBusy ? <CircularProgress size={16} color="inherit" /> : <Lock />}>
                  {t('hosp.profile.changePassword')}
                </Button>
              </Box>
            </Box>
          </SectionCard>
        </Box>
      </Box>

      <Snackbar open={!!toast} autoHideDuration={3000} onClose={() => setToast('')} message={toast} anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }} />
    </Box>
  );
}
