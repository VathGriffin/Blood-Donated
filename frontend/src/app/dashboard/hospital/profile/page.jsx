'use client';
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
    if (!PHOTO_TYPES.includes(file.type)) { setPhotoError('Please choose a JPG, PNG, WebP or GIF image.'); return; }
    if (file.size > MAX_PHOTO_SIZE) { setPhotoError(`Image is too large — max ${MAX_PHOTO_SIZE / (1024 * 1024)} MB.`); return; }
    setPhotoBusy(true);
    setPhotoError('');
    try {
      const form = new FormData();
      form.append('photo', file);
      const { data } = await axios.post(`${API_BASE}/api/staff/me/photo`, form, auth);
      updateStaff({ photo: data.photo });
      setToast('Profile photo updated.');
    } catch (err) {
      setPhotoError(apiErrorMessage(err, 'Photo upload failed.'));
    } finally { setPhotoBusy(false); }
  };

  const removePhoto = async () => {
    setPhotoBusy(true);
    setPhotoError('');
    try {
      await axios.delete(`${API_BASE}/api/staff/me/photo`, auth);
      updateStaff({ photo: null });
      setToast('Profile photo removed.');
    } catch (err) {
      setPhotoError(apiErrorMessage(err, 'Could not remove the photo.'));
    } finally { setPhotoBusy(false); }
  };

  // ── Name ──
  const [name, setName] = useState(staff?.fullName || '');
  const [nameBusy, setNameBusy] = useState(false);
  const [nameError, setNameError] = useState('');
  const nameChanged = name.trim() && name.trim() !== staff?.fullName;

  const saveName = async (e) => {
    e.preventDefault();
    if (!name.trim()) { setNameError('Your name can’t be empty.'); return; }
    setNameBusy(true);
    setNameError('');
    try {
      const { data } = await axios.patch(`${API_BASE}/api/staff/me`, { fullName: name.trim() }, auth);
      updateStaff({ fullName: data.fullName || name.trim() });
      setName(data.fullName || name.trim());
      setToast('Name updated.');
    } catch (err) {
      setNameError(apiErrorMessage(err, 'Could not update your name.'));
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
    if (!pw.current || !pw.next) { setPwError('Fill in your current and new password.'); return; }
    if (tooShort || mismatch) return;
    if (pw.current === pw.next) { setPwError('Choose a password different from your current one.'); return; }
    setPwBusy(true);
    setPwError('');
    try {
      await axios.patch(`${API_BASE}/api/staff/me/password`, { currentPassword: pw.current, newPassword: pw.next }, auth);
      setPw(emptyPw);
      setToast('Password changed.');
    } catch (err) {
      setPwError(apiErrorMessage(err, 'Could not change your password.'));
    } finally { setPwBusy(false); }
  };

  const eye = (
    <InputAdornment position="end">
      <IconButton size="small" aria-label={showPw ? 'Hide passwords' : 'Show passwords'} onClick={() => setShowPw((s) => !s)}>
        {showPw ? <VisibilityOff fontSize="small" /> : <Visibility fontSize="small" />}
      </IconButton>
    </InputAdornment>
  );

  return (
    <Box sx={{ maxWidth: 980 }}>
      <PageHeader title="My Profile" subtitle="Your photo, name and password for the hospital dashboard." />

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
              <Typography variant="body2" color="text.secondary">Hospital Staff</Typography>
            </Box>
            <Box display="flex" gap={1} flexWrap="wrap" justifyContent="center">
              <Button size="small" variant="outlined" disabled={photoBusy} startIcon={<AddAPhoto />} onClick={() => fileInput.current?.click()}>
                {staff?.photo ? 'Change photo' : 'Upload photo'}
              </Button>
              {staff?.photo && (
                <Button size="small" color="inherit" disabled={photoBusy} startIcon={<Delete />} onClick={removePhoto} sx={{ color: 'text.secondary' }}>
                  Remove
                </Button>
              )}
            </Box>
            <Typography variant="caption" color={photoError ? 'error' : 'text.secondary'}>
              {photoError || 'JPG, PNG, WebP or GIF · up to 10 MB'}
            </Typography>
            <input ref={fileInput} type="file" hidden accept={PHOTO_TYPES.join(',')} onChange={changePhoto} />

            <Box sx={{ width: '100%', borderTop: 1, borderColor: 'divider', pt: 2, mt: 0.5, display: 'flex', flexDirection: 'column', gap: 1.25, textAlign: 'left' }}>
              {[
                { icon: <LocalHospital />, label: 'Hospital', value: hospitalName || '—' },
                { icon: <Email />, label: 'Sign-in email', value: staff?.email },
                { icon: <BadgeIcon />, label: 'Role', value: 'Hospital Staff' },
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
          <SectionCard icon={<Person />} title="Display name" subtitle="Shown in the dashboard and on actions you take.">
            <Box component="form" onSubmit={saveName} display="flex" gap={1.5} flexWrap="wrap" alignItems="flex-start">
              <TextField label="Full name" value={name} onChange={(e) => { setName(e.target.value); setNameError(''); }}
                error={!!nameError} helperText={nameError} autoComplete="name" sx={{ flex: '1 1 260px' }} />
              <Button type="submit" variant="contained" disabled={!nameChanged || nameBusy} sx={{ height: 56 }}
                startIcon={nameBusy ? <CircularProgress size={16} color="inherit" /> : <Save />}>
                Save
              </Button>
            </Box>
          </SectionCard>

          {/* Password */}
          <SectionCard icon={<Lock />} title="Change password" subtitle={`Use at least ${PASSWORD_MIN} characters.`}>
            <Box component="form" onSubmit={savePassword} display="grid" gap={2} gridTemplateColumns={{ xs: '1fr', sm: '1fr 1fr' }}>
              <TextField label="Current password" type={showPw ? 'text' : 'password'} value={pw.current} onChange={setPwField('current')}
                autoComplete="current-password" sx={{ gridColumn: '1 / -1' }} slotProps={{ input: { endAdornment: eye } }} />
              <TextField label="New password" type={showPw ? 'text' : 'password'} value={pw.next} onChange={setPwField('next')}
                autoComplete="new-password" error={!!tooShort} helperText={tooShort ? `At least ${PASSWORD_MIN} characters.` : ' '} />
              <TextField label="Confirm new password" type={showPw ? 'text' : 'password'} value={pw.confirm} onChange={setPwField('confirm')}
                autoComplete="new-password" error={!!mismatch} helperText={mismatch ? 'Passwords don’t match.' : ' '} />
              {pwError && <Alert severity="error" sx={{ gridColumn: '1 / -1', borderRadius: 2 }}>{pwError}</Alert>}
              <Box sx={{ gridColumn: '1 / -1' }}>
                <Button type="submit" variant="contained" disabled={pwBusy || !pw.current || !pw.next || !pw.confirm || !!tooShort || !!mismatch}
                  startIcon={pwBusy ? <CircularProgress size={16} color="inherit" /> : <Lock />}>
                  Change password
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
