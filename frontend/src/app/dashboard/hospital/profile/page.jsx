'use client';
import { useRef, useState } from 'react';
import {
  Box, Typography, Paper, Avatar, Button, Alert, CircularProgress, Divider,
} from '@mui/material';
import { AddAPhoto, Delete } from '@mui/icons-material';
import API_BASE from '@/lib/config';
import { useAuth } from '@/store/AuthContext';

const MAX_PHOTO_SIZE = 10 * 1024 * 1024; // must match the multer limit in Backend/src/common/upload.js
const PHOTO_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']; // same list the server accepts

// Hospital staff's own profile. POST /api/staff/me/photo replaces the photo, DELETE removes
// it; updateStaff() pushes the change into the top-bar account menu straight away.
export default function HospitalProfile() {
  const { token, staff, updateStaff } = useAuth();
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState(null); // { type: 'success'|'error', text }
  const fileInput = useRef(null);

  const photoSrc = staff?.photo ? `${API_BASE}${staff.photo}` : undefined;
  const initials = (staff?.fullName || 'S').split(/\s+/).map((w) => w[0]).slice(0, 2).join('').toUpperCase();
  const authHeader = { Authorization: `Bearer ${token}` };

  const run = async (action) => {
    setBusy(true);
    setMsg(null);
    try {
      await action();
    } catch (err) {
      setMsg({ type: 'error', text: err.message });
    } finally {
      setBusy(false);
    }
  };

  const changePhoto = (e) => {
    const file = e.target.files?.[0];
    e.target.value = ''; // allow re-selecting the same file later
    if (!file) return;
    if (!PHOTO_TYPES.includes(file.type)) { setMsg({ type: 'error', text: 'Please choose a JPG, PNG, WebP or GIF image.' }); return; }
    if (file.size > MAX_PHOTO_SIZE) { setMsg({ type: 'error', text: `Image is too large — max ${MAX_PHOTO_SIZE / (1024 * 1024)} MB.` }); return; }
    run(async () => {
      const form = new FormData();
      form.append('photo', file);
      const res = await fetch(`${API_BASE}/api/staff/me/photo`, { method: 'POST', headers: authHeader, body: form });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.message || 'Photo upload failed.');
      updateStaff({ photo: data.photo });
      setMsg({ type: 'success', text: 'Profile photo updated.' });
    });
  };

  const removePhoto = () => run(async () => {
    const res = await fetch(`${API_BASE}/api/staff/me/photo`, { method: 'DELETE', headers: authHeader });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.message || 'Could not remove the photo.');
    updateStaff({ photo: null });
    setMsg({ type: 'success', text: 'Profile photo removed.' });
  });

  return (
    <Box sx={{ maxWidth: 560 }}>
      <Typography fontWeight={800} fontSize="1.1rem" mb={0.5}>My Profile</Typography>
      <Typography variant="body2" color="text.secondary" mb={2.5}>
        Your photo appears in the account menu at the top of the dashboard.
      </Typography>

      <Paper elevation={0} sx={{ borderRadius: 3, border: 1, borderColor: 'divider', p: { xs: 2, sm: 3 } }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2.5, flexWrap: 'wrap' }}>
          <Avatar src={photoSrc} alt="" sx={{ width: 88, height: 88, fontSize: '1.6rem', fontWeight: 800, bgcolor: 'primary.main', opacity: busy ? 0.5 : 1 }}>
            {initials}
          </Avatar>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, alignItems: 'flex-start' }}>
            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
              <Button size="small" variant="outlined" color="error" disabled={busy}
                startIcon={busy ? <CircularProgress size={14} color="inherit" /> : <AddAPhoto sx={{ fontSize: 16 }} />}
                onClick={() => fileInput.current?.click()}
                sx={{ textTransform: 'none', fontWeight: 700, borderRadius: 2 }}>
                {busy ? 'Working…' : staff?.photo ? 'Change photo' : 'Upload photo'}
              </Button>
              {staff?.photo && (
                <Button size="small" color="inherit" disabled={busy} startIcon={<Delete sx={{ fontSize: 15 }} />}
                  onClick={removePhoto} sx={{ textTransform: 'none', color: 'text.secondary', fontWeight: 600 }}>
                  Remove photo
                </Button>
              )}
            </Box>
            <Typography variant="caption" color="text.secondary">JPG, PNG, WebP or GIF · up to 10 MB</Typography>
          </Box>
          <input ref={fileInput} type="file" hidden accept={PHOTO_TYPES.join(',')} onChange={changePhoto} />
        </Box>

        <Divider sx={{ my: 2.5 }} />

        <Box sx={{ display: 'grid', gridTemplateColumns: 'auto 1fr', columnGap: 3, rowGap: 1.25 }}>
          <Typography variant="body2" color="text.secondary">Name</Typography>
          <Typography variant="body2" fontWeight={600} sx={{ wordBreak: 'break-word' }}>{staff?.fullName}</Typography>
          <Typography variant="body2" color="text.secondary">Email</Typography>
          <Typography variant="body2" fontWeight={600} sx={{ wordBreak: 'break-all' }}>{staff?.email}</Typography>
          <Typography variant="body2" color="text.secondary">Role</Typography>
          <Typography variant="body2" fontWeight={600}>Hospital Staff</Typography>
        </Box>
      </Paper>

      {msg && <Alert severity={msg.type} sx={{ mt: 2, borderRadius: 2 }}>{msg.text}</Alert>}
    </Box>
  );
}
