'use client';
import React, { useState } from 'react';
import {
  Box, Typography, Paper, useTheme, Avatar, List, ListItemButton,
  ListItemIcon, ListItemText, TextField, Button,
  Chip, Alert, IconButton, Tooltip, CircularProgress,
  Dialog, DialogTitle, DialogContent, DialogActions,
  MenuItem, FormControl, InputLabel, Select, Menu, Switch,
} from '@mui/material';
import {
  Settings, SmartToy, Bloodtype, CalendarMonth,
  Security, Person, Delete, AddAPhoto, Lock, PersonAdd,
  MoreVert, Edit, Visibility, VisibilityOff, HideImage,
} from '@mui/icons-material';
import API_BASE from '@/lib/config';
import { useAuth } from '@/store/AuthContext';

const SECTIONS = [
  { id: 'profile',     label: 'My Profile',           icon: <Person sx={{ fontSize: 18 }} /> },
  { id: 'homepage',    label: 'Homepage Profiles',    icon: <Settings sx={{ fontSize: 18 }} /> },
  { id: 'ai',          label: 'AI Configuration',     icon: <SmartToy sx={{ fontSize: 18 }} /> },
  { id: 'blood',       label: 'Blood Rules',          icon: <Bloodtype sx={{ fontSize: 18 }} /> },
  { id: 'appointment', label: 'Appointment Rules',    icon: <CalendarMonth sx={{ fontSize: 18 }} /> },
  { id: 'security',    label: 'Security',             icon: <Security sx={{ fontSize: 18 }} /> },
];

const ROLE_LABEL = { admin: 'Administrator', hospital_staff: 'Hospital Staff' };
const MAX_PHOTO_SIZE = 10 * 1024 * 1024; // must match the multer limit in Backend/src/common/upload.js
const PHOTO_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']; // same list the server accepts

// Role choices for homepage profiles. Each also sets the badge, which picks the card's icon on the homepage.
const HP_ROLES = [
  { label: 'Blood Donor',             badge: 'Blood Donor' },
  { label: 'Volunteer',               badge: 'Community Volunteer' },
  { label: 'Hospital Representative', badge: 'Healthcare Partner' },
];

const hpPhotoUrl = (photo) => (photo ? (photo.startsWith('http') ? photo : `${API_BASE}${photo}`) : null);

// Label/value row used inside every settings card — takes `children` for an
// interactive control (TextField, Chip) or a plain `value` for read-only text.
const Row = ({ label, children, value, border }) => (
  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', py: 1.5,
    borderBottom: `1px solid ${border}`, '&:last-child': { borderBottom: 'none' } }}>
    <Typography fontSize="0.88rem" fontWeight={500} color="text.secondary">{label}</Typography>
    <Box sx={{ minWidth: 240, display: 'flex', justifyContent: 'flex-end' }}>
      {children ?? <Typography fontSize="0.85rem" fontWeight={600} textAlign="right">{value}</Typography>}
    </Box>
  </Box>
);

const SectionTitle = ({ children, sub }) => (
  <Box mb={2.5}>
    <Typography fontWeight={800} fontSize="1rem" letterSpacing="-0.01em">{children}</Typography>
    {sub && <Typography variant="caption" color="text.secondary">{sub}</Typography>}
  </Box>
);

// Shared GET-and-parse for the read-only status panels below.
async function getJson(url, options) {
  const res = await fetch(url, options);
  if (!res.ok) throw new Error(`Server returned ${res.status}`);
  return res.json();
}

// Shared saving/error/finally wrapper for the two write actions below.
async function withSaving(setSaving, setMsg, action) {
  setSaving(true);
  setMsg(null);
  try {
    await action();
  } catch (err) {
    setMsg({ type: 'error', text: err.message });
  } finally {
    setSaving(false);
  }
}

export default function AdminSettings() {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const { token, staff, login, updateStaff } = useAuth();

  const [section, setSection] = useState('profile');

  const card  = isDark ? '#111111' : '#ffffff';
  const border = isDark ? '#1f1f1f' : '#e5e5e5';
  const subBg  = isDark ? '#0a0a0a' : '#f8f8f8';
  const cardSx = { borderRadius: 3, border: `1px solid ${border}`, bgcolor: card, overflow: 'hidden' };

  const authHeader = React.useMemo(() => ({ Authorization: `Bearer ${token}` }), [token]);

  // ── My Profile ──────────────────────────────────────────────────────────
  const [fullName, setFullName] = useState(staff?.fullName || '');
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileMsg, setProfileMsg] = useState(null); // { type: 'success'|'error', text }

  const saveProfile = async () => {
    if (!fullName.trim()) return;
    await withSaving(setProfileSaving, setProfileMsg, async () => {
      const res = await fetch(`${API_BASE}/api/staff/me`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', ...authHeader },
        body: JSON.stringify({ fullName: fullName.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to update profile.');
      login(token, { ...staff, fullName: data.fullName });
      setProfileMsg({ type: 'success', text: 'Profile updated.' });
    });
  };

  // Profile photo: POST /api/staff/me/photo replaces it, DELETE removes it. The server returns
  // the updated account, and updateStaff() pushes the new photo into the sidebar and menu.
  const [photoBusy, setPhotoBusy] = useState(false);
  const adminPhotoInput = React.useRef(null);
  const adminPhotoSrc = staff?.photo ? `${API_BASE}${staff.photo}` : undefined;
  const initials = (staff?.fullName || 'A').split(/\s+/).map((w) => w[0]).slice(0, 2).join('').toUpperCase();

  const changePhoto = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = ''; // allow re-selecting the same file later
    if (!file) return;
    if (!PHOTO_TYPES.includes(file.type)) { setProfileMsg({ type: 'error', text: 'Please choose a JPG, PNG, WebP or GIF image.' }); return; }
    if (file.size > MAX_PHOTO_SIZE) { setProfileMsg({ type: 'error', text: `Image is too large — max ${MAX_PHOTO_SIZE / (1024 * 1024)} MB.` }); return; }
    await withSaving(setPhotoBusy, setProfileMsg, async () => {
      const form = new FormData();
      form.append('photo', file);
      const res = await fetch(`${API_BASE}/api/staff/me/photo`, { method: 'POST', headers: authHeader, body: form });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.message || 'Photo upload failed.');
      updateStaff({ photo: data.photo });
      setProfileMsg({ type: 'success', text: 'Profile photo updated.' });
    });
  };

  const removePhoto = async () => {
    await withSaving(setPhotoBusy, setProfileMsg, async () => {
      const res = await fetch(`${API_BASE}/api/staff/me/photo`, { method: 'DELETE', headers: authHeader });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.message || 'Could not remove the photo.');
      updateStaff({ photo: null });
      setProfileMsg({ type: 'success', text: 'Profile photo removed.' });
    });
  };

  // ── Homepage profiles ───────────────────────────────────────────────────
  const [hpProfiles, setHpProfiles]     = useState([]);
  const [hpLoading, setHpLoading]       = useState(false);
  const [hpUploading, setHpUploading]   = useState({});
  const [hpError, setHpError]           = useState('');
  const photoInputRefs = React.useRef({});

  // /all includes profiles hidden from the homepage, so the admin can switch them back on.
  const loadHpProfiles = React.useCallback(() => {
    setHpLoading(true);
    setHpError('');
    getJson(`${API_BASE}/api/homepage/all`, { headers: authHeader })
      .then(data => setHpProfiles(Array.isArray(data) ? data : []))
      .catch(err => setHpError(err.message || 'Failed to load profiles.'))
      .finally(() => setHpLoading(false));
  }, [authHeader]);

  React.useEffect(() => {
    if (section !== 'homepage') return;
    loadHpProfiles();
  }, [section, loadHpProfiles]);

  const replaceHpProfile = (updated) => setHpProfiles(prev => prev.map(p => p._id === updated._id ? updated : p));

  // Returns an error message, or '' when the file is fine to upload.
  const photoFileError = (file) => {
    if (!PHOTO_TYPES.includes(file.type)) return 'Please choose a JPG, PNG, WebP or GIF image.';
    if (file.size > MAX_PHOTO_SIZE) return `Image is too large — max ${MAX_PHOTO_SIZE / (1024 * 1024)} MB.`;
    return '';
  };

  const uploadHpPhoto = async (profileId, file) => {
    const form = new FormData();
    form.append('photo', file);
    const res = await fetch(`${API_BASE}/api/homepage/${profileId}/photo`, { method: 'POST', headers: authHeader, body: form });
    const updated = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(updated.message || 'Photo upload failed.');
    return updated;
  };

  const handlePhotoUpload = async (profileId, file) => {
    if (!file) return;
    const invalid = photoFileError(file);
    if (invalid) { setHpError(invalid); return; }
    setHpUploading(p => ({ ...p, [profileId]: true }));
    try {
      replaceHpProfile(await uploadHpPhoto(profileId, file));
    } catch (err) {
      setHpError(err.message);
    } finally {
      setHpUploading(p => ({ ...p, [profileId]: false }));
    }
  };

  const handlePhotoRemove = async (profileId) => {
    setHpUploading(p => ({ ...p, [profileId]: true }));
    try {
      const res = await fetch(`${API_BASE}/api/homepage/${profileId}/photo`, {
        method: 'DELETE',
        headers: authHeader,
      });
      if (!res.ok) throw new Error('Remove failed');
      setHpProfiles(prev => prev.map(p => p._id === profileId ? { ...p, photo: null } : p));
    } catch (err) {
      setHpError(err.message);
    } finally {
      setHpUploading(p => ({ ...p, [profileId]: false }));
    }
  };

  const updateHpProfile = async (profileId, body) => {
    const res = await fetch(`${API_BASE}/api/homepage/${profileId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', ...authHeader },
      body: JSON.stringify(body),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.message || 'Failed to save profile.');
    return data;
  };

  const toggleHpVisible = async (profile) => {
    setHpError('');
    setHpUploading(p => ({ ...p, [profile._id]: true }));
    try {
      replaceHpProfile(await updateHpProfile(profile._id, { visible: profile.visible === false }));
    } catch (err) {
      setHpError(err.message);
    } finally {
      setHpUploading(p => ({ ...p, [profile._id]: false }));
    }
  };

  // Add / Edit dialog. editingId is null when adding a new profile.
  const emptyHpForm = { name: '', role: HP_ROLES[0].label, bio: '', visible: true };
  const [hpDialogOpen, setHpDialogOpen] = useState(false);
  const [hpEditingId, setHpEditingId]   = useState(null);
  const [hpForm, setHpForm]             = useState(emptyHpForm);
  const [hpPhotoFile, setHpPhotoFile]   = useState(null);
  const [hpPhotoPreview, setHpPhotoPreview] = useState(null);
  const [hpSaving, setHpSaving]         = useState(false);
  const [hpFormError, setHpFormError]   = useState('');
  const [hpDeleting, setHpDeleting]     = useState({});
  const [hpMenu, setHpMenu]             = useState(null); // { anchor, profile }; anchor is null while closing
  const hpDialogPhotoInput = React.useRef(null);
  // Keep the profile while the menu fades out, so its labels don't flip mid-animation.
  const closeHpMenu = () => setHpMenu(m => m && { ...m, anchor: null });

  // Free the object URL made for the dialog's photo preview once it's replaced or closed.
  React.useEffect(() => () => { if (hpPhotoPreview?.startsWith('blob:')) URL.revokeObjectURL(hpPhotoPreview); }, [hpPhotoPreview]);

  const openHpDialog = (profile = null) => {
    setHpEditingId(profile?._id || null);
    setHpForm(profile
      ? { name: profile.name, role: profile.role, bio: profile.bio || '', visible: profile.visible !== false }
      : emptyHpForm);
    setHpPhotoFile(null);
    setHpPhotoPreview(profile ? hpPhotoUrl(profile.photo) : null);
    setHpFormError('');
    setHpDialogOpen(true);
  };

  const pickHpDialogPhoto = (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    const invalid = photoFileError(file);
    if (invalid) { setHpFormError(invalid); return; }
    setHpFormError('');
    setHpPhotoFile(file);
    setHpPhotoPreview(URL.createObjectURL(file));
  };

  const handleSaveProfile = async () => {
    if (!hpForm.name.trim() || !hpForm.role.trim()) {
      setHpFormError('Full name and role are required.');
      return;
    }
    setHpSaving(true);
    setHpFormError('');
    // The preset roles also set the badge, which picks the card's icon on the homepage.
    const preset = HP_ROLES.find(r => r.label === hpForm.role);
    const body = {
      name: hpForm.name.trim(),
      role: hpForm.role.trim(),
      bio: hpForm.bio.trim(),
      visible: hpForm.visible,
      ...(preset && { badge: preset.badge }),
    };
    try {
      let saved;
      if (hpEditingId) {
        saved = await updateHpProfile(hpEditingId, body);
      } else {
        const res = await fetch(`${API_BASE}/api/homepage`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', ...authHeader },
          body: JSON.stringify(body),
        });
        saved = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(saved.message || 'Failed to add profile.');
        setHpProfiles(prev => [...prev, saved]);
        setHpEditingId(saved._id); // a failed photo upload below then retries as an edit, not a duplicate
      }
      if (hpPhotoFile) saved = await uploadHpPhoto(saved._id, hpPhotoFile);
      replaceHpProfile(saved);
      setHpDialogOpen(false);
    } catch (err) {
      setHpFormError(err.message);
    } finally {
      setHpSaving(false);
    }
  };

  const handleDeleteProfile = async (profileId) => {
    setHpDeleting(p => ({ ...p, [profileId]: true }));
    setHpError('');
    try {
      const res = await fetch(`${API_BASE}/api/homepage/${profileId}`, {
        method: 'DELETE',
        headers: authHeader,
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.message || 'Failed to delete profile.');
      }
      setHpProfiles(prev => prev.filter(p => p._id !== profileId));
    } catch (err) {
      setHpError(err.message);
    } finally {
      setHpDeleting(p => ({ ...p, [profileId]: false }));
    }
  };

  // ── AI configuration (real, read-only status) ───────────────────────────
  const [aiStatus, setAiStatus]   = useState(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError]     = useState('');

  const loadAiStatus = React.useCallback(() => {
    setAiLoading(true);
    setAiError('');
    getJson(`${API_BASE}/api/chat/status`, { headers: authHeader })
      .then(setAiStatus)
      .catch(err => setAiError(err.message || 'Failed to load AI status.'))
      .finally(() => setAiLoading(false));
  }, [authHeader]);

  React.useEffect(() => {
    if (section !== 'ai') return;
    loadAiStatus();
  }, [section, loadAiStatus]);

  // ── Security: change password ────────────────────────────────────────────
  const [pwForm, setPwForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [pwSaving, setPwSaving] = useState(false);
  const [pwMsg, setPwMsg] = useState(null);

  const changePassword = async () => {
    setPwMsg(null);
    if (pwForm.newPassword.length < 8) {
      setPwMsg({ type: 'error', text: 'New password must be at least 8 characters.' });
      return;
    }
    if (pwForm.newPassword !== pwForm.confirmPassword) {
      setPwMsg({ type: 'error', text: 'New password and confirmation do not match.' });
      return;
    }
    await withSaving(setPwSaving, setPwMsg, async () => {
      const res = await fetch(`${API_BASE}/api/staff/me/password`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', ...authHeader },
        body: JSON.stringify({
          currentPassword: pwForm.currentPassword,
          newPassword: pwForm.newPassword,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to change password.');
      setPwMsg({ type: 'success', text: 'Password updated.' });
      setPwForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    });
  };

  const renderContent = () => {
    switch (section) {

      /* ── MY PROFILE ── */
      case 'profile':
        return (
          <Box>
            <SectionTitle sub="Your own admin account details">My Profile</SectionTitle>
            <Paper elevation={0} sx={{ ...cardSx, mb: 2.5 }}>
              <Box px={3} py={2}>
                <Row label="Profile Photo" border={border}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Avatar src={adminPhotoSrc} alt="" sx={{ width: 64, height: 64, bgcolor: '#b71c1c', fontWeight: 800, opacity: photoBusy ? 0.5 : 1 }}>
                      {initials}
                    </Avatar>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.75, alignItems: 'flex-start' }}>
                      <Button size="small" variant="outlined" color="error" disabled={photoBusy}
                        startIcon={photoBusy ? <CircularProgress size={14} color="inherit" /> : <AddAPhoto sx={{ fontSize: 16 }} />}
                        onClick={() => adminPhotoInput.current?.click()}
                        sx={{ textTransform: 'none', fontWeight: 700, borderRadius: 2 }}>
                        {photoBusy ? 'Working…' : staff?.photo ? 'Change photo' : 'Upload photo'}
                      </Button>
                      {staff?.photo && (
                        <Button size="small" color="inherit" disabled={photoBusy} startIcon={<Delete sx={{ fontSize: 15 }} />}
                          onClick={removePhoto} sx={{ textTransform: 'none', color: 'text.secondary', fontWeight: 600, p: 0, minWidth: 0 }}>
                          Remove
                        </Button>
                      )}
                      <Typography variant="caption" color="text.secondary">JPG, PNG, WebP or GIF · up to 10 MB</Typography>
                    </Box>
                    <input ref={adminPhotoInput} type="file" hidden accept={PHOTO_TYPES.join(',')} onChange={changePhoto} />
                  </Box>
                </Row>
                <Row label="Display Name" border={border}>
                  <TextField size="small" value={fullName} onChange={e => setFullName(e.target.value)} sx={{ width: 240 }} />
                </Row>
                <Row label="Email" border={border}>
                  <Typography fontSize="0.86rem" color="text.secondary">{staff?.email}</Typography>
                </Row>
                <Row label="Role" border={border}>
                  <Chip label={ROLE_LABEL[staff?.role] || staff?.role} size="small"
                    sx={{ bgcolor: isDark ? 'rgba(220,38,38,0.12)' : '#fff0f0', color: '#dc2626', fontWeight: 700 }} />
                </Row>
              </Box>
            </Paper>
            {profileMsg && (
              <Alert severity={profileMsg.type} sx={{ mb: 2, borderRadius: 2 }}>{profileMsg.text}</Alert>
            )}
            <Button variant="contained" color="error" onClick={saveProfile} disabled={profileSaving || !fullName.trim()}
              sx={{ textTransform: 'none', fontWeight: 700, borderRadius: 2 }}>
              {profileSaving ? 'Saving…' : 'Save Profile'}
            </Button>
          </Box>
        );

      /* ── HOMEPAGE PROFILES ── */
      case 'homepage':
        return (
          <Box>
            <Box display="flex" alignItems="flex-start" justifyContent="space-between" gap={2}>
              <SectionTitle sub="Add, edit, and choose which profiles appear in the 'People Behind the Mission' section">
                Homepage Profiles
              </SectionTitle>
              <Button variant="contained" color="error" startIcon={<PersonAdd sx={{ fontSize: 18 }} />}
                onClick={() => openHpDialog()}
                sx={{ textTransform: 'none', fontWeight: 700, borderRadius: 2, flexShrink: 0 }}>
                Add Profile
              </Button>
            </Box>
            {hpError && (
              <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }} onClose={() => setHpError('')}
                action={
                  <Button color="error" size="small" onClick={loadHpProfiles} sx={{ fontWeight: 700, textTransform: 'none' }}>
                    Retry
                  </Button>
                }
              >
                {hpError}
              </Alert>
            )}
            {hpLoading ? (
              <Typography color="text.secondary" fontSize="0.9rem">Loading profiles…</Typography>
            ) : (
              <Box display="grid" gridTemplateColumns={{ xs: '1fr', sm: 'repeat(2, 1fr)', lg: 'repeat(3, 1fr)' }} gap={2.5}>
                {hpProfiles.map(p => {
                  const photoUrl = hpPhotoUrl(p.photo);
                  const isUploading = !!hpUploading[p._id];
                  const isDeleting  = !!hpDeleting[p._id];
                  const hidden = p.visible === false;
                  return (
                    <Paper key={p._id} elevation={0} sx={{
                      borderRadius: 3, border: `1px solid ${border}`, bgcolor: card, overflow: 'hidden',
                      display: 'flex', flexDirection: 'column',
                    }}>
                      {/* Profile photo, with the ⋮ menu over its corner */}
                      <Box sx={{ position: 'relative', height: 180, bgcolor: subBg,
                        display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        {photoUrl ? (
                          <Box component="img" src={photoUrl} alt={p.name}
                            sx={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center 25%', opacity: hidden ? 0.5 : 1 }} />
                        ) : (
                          <Avatar sx={{ width: 88, height: 88, fontSize: '1.6rem', fontWeight: 900, bgcolor: p.color || '#dc2626', opacity: hidden ? 0.5 : 1 }}>
                            {p.initials}
                          </Avatar>
                        )}
                        {isUploading && (
                          <Box sx={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: 'rgba(0,0,0,0.35)' }}>
                            <CircularProgress size={26} sx={{ color: '#fff' }} />
                          </Box>
                        )}
                        {hidden && (
                          <Chip icon={<VisibilityOff sx={{ fontSize: 14 }} />} label="Hidden" size="small"
                            sx={{ position: 'absolute', top: 10, left: 10, fontWeight: 700, bgcolor: 'rgba(0,0,0,0.65)', color: '#fff', '& .MuiChip-icon': { color: '#fff' } }} />
                        )}
                        <IconButton size="small" aria-label={`More actions for ${p.name}`}
                          onClick={(e) => setHpMenu({ anchor: e.currentTarget, profile: p })}
                          sx={{ position: 'absolute', top: 8, right: 8, bgcolor: 'rgba(255,255,255,0.9)', color: '#333',
                            '&:hover': { bgcolor: '#fff' } }}>
                          <MoreVert sx={{ fontSize: 18 }} />
                        </IconButton>
                        <input
                          type="file" accept={PHOTO_TYPES.join(',')} hidden
                          ref={el => { photoInputRefs.current[p._id] = el; }}
                          onChange={e => { handlePhotoUpload(p._id, e.target.files[0]); e.target.value = ''; }}
                        />
                      </Box>

                      <Box sx={{ p: 2.5, display: 'flex', flexDirection: 'column', gap: 0.5, flex: 1 }}>
                        <Typography fontWeight={800} fontSize="1rem">{p.name}</Typography>
                        <Typography fontSize="0.8rem" fontWeight={600} color="#dc2626">{p.role}</Typography>
                        <Typography fontSize="0.82rem" color="text.secondary" sx={{
                          mt: 0.5, display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden',
                        }}>
                          {p.bio || 'No description yet.'}
                        </Typography>

                        <Box display="flex" alignItems="center" gap={1} mt="auto" pt={2}>
                          <Button size="small" variant="contained" color="error" startIcon={<Edit sx={{ fontSize: 15 }} />}
                            onClick={() => openHpDialog(p)}
                            sx={{ textTransform: 'none', fontWeight: 700, borderRadius: 2, fontSize: '0.78rem', boxShadow: 'none' }}>
                            Edit
                          </Button>
                          <Button size="small" variant="outlined" color="error" startIcon={<AddAPhoto sx={{ fontSize: 15 }} />}
                            disabled={isUploading}
                            onClick={() => photoInputRefs.current[p._id]?.click()}
                            sx={{ textTransform: 'none', fontWeight: 600, borderRadius: 2, fontSize: '0.78rem' }}>
                            Change Photo
                          </Button>
                          <Tooltip title="Delete profile">
                            <span style={{ marginLeft: 'auto' }}>
                              <IconButton size="small" disabled={isDeleting} aria-label={`Delete ${p.name}`}
                                onClick={() => {
                                  if (window.confirm(`Delete "${p.name}"? This can't be undone.`)) handleDeleteProfile(p._id);
                                }}
                                sx={{ color: 'text.secondary', '&:hover': { color: '#dc2626' } }}>
                                {isDeleting ? <CircularProgress size={16} /> : <Delete sx={{ fontSize: 19 }} />}
                              </IconButton>
                            </span>
                          </Tooltip>
                        </Box>
                      </Box>
                    </Paper>
                  );
                })}
              </Box>
            )}
            <Typography variant="caption" color="text.disabled" display="block" mt={2.5}>
              Photos are shown on the public homepage. Max file size: {MAX_PHOTO_SIZE / (1024 * 1024)} MB. Supported formats: JPG, PNG, WebP, GIF.
            </Typography>

            <Menu anchorEl={hpMenu?.anchor} open={!!hpMenu?.anchor} onClose={closeHpMenu}
              anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }} transformOrigin={{ vertical: 'top', horizontal: 'right' }}>
              <MenuItem onClick={() => { openHpDialog(hpMenu.profile); closeHpMenu(); }}>
                <ListItemIcon><Edit fontSize="small" /></ListItemIcon>Edit profile
              </MenuItem>
              <MenuItem onClick={() => { toggleHpVisible(hpMenu.profile); closeHpMenu(); }}>
                <ListItemIcon>{hpMenu?.profile.visible === false ? <Visibility fontSize="small" /> : <VisibilityOff fontSize="small" />}</ListItemIcon>
                {hpMenu?.profile.visible === false ? 'Show on homepage' : 'Hide from homepage'}
              </MenuItem>
              {hpMenu?.profile.photo && (
                <MenuItem onClick={() => { handlePhotoRemove(hpMenu.profile._id); closeHpMenu(); }}>
                  <ListItemIcon><HideImage fontSize="small" /></ListItemIcon>Remove photo
                </MenuItem>
              )}
            </Menu>

            <Dialog open={hpDialogOpen} onClose={() => !hpSaving && setHpDialogOpen(false)} maxWidth="xs" fullWidth
              PaperProps={{ sx: { borderRadius: 3, bgcolor: isDark ? '#111' : '#fff' } }}>
              <DialogTitle sx={{ fontWeight: 800, fontSize: '1.05rem', pb: 1 }}>
                {hpEditingId ? 'Edit Profile' : 'Add Profile'}
              </DialogTitle>
              <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2.25, pt: '8px !important' }}>
                <Box>
                  <Typography fontSize="0.8rem" fontWeight={700} color="text.secondary" mb={1}>Photo</Typography>
                  <Box display="flex" alignItems="center" gap={2}>
                    <Avatar src={hpPhotoPreview || undefined} sx={{ width: 64, height: 64, bgcolor: '#dc2626', fontWeight: 800 }}>
                      {(hpForm.name.trim() || '?').split(/\s+/).map(w => w[0]).slice(0, 2).join('').toUpperCase()}
                    </Avatar>
                    <Button size="small" variant="outlined" color="error" startIcon={<AddAPhoto sx={{ fontSize: 16 }} />}
                      onClick={() => hpDialogPhotoInput.current?.click()}
                      sx={{ textTransform: 'none', fontWeight: 700, borderRadius: 2 }}>
                      {hpPhotoPreview ? 'Change Photo' : 'Upload Photo'}
                    </Button>
                    <input ref={hpDialogPhotoInput} type="file" hidden accept={PHOTO_TYPES.join(',')} onChange={pickHpDialogPhoto} />
                  </Box>
                </Box>
                <TextField label="Full Name" value={hpForm.name} required fullWidth size="small"
                  onChange={e => setHpForm(f => ({ ...f, name: e.target.value }))} />
                <FormControl fullWidth size="small" required>
                  <InputLabel>Role</InputLabel>
                  <Select label="Role" value={hpForm.role}
                    onChange={e => setHpForm(f => ({ ...f, role: e.target.value }))}>
                    {HP_ROLES.map(r => <MenuItem key={r.label} value={r.label}>{r.label}</MenuItem>)}
                    {/* Keep an older free-text role selectable so editing doesn't silently change it */}
                    {hpForm.role && !HP_ROLES.some(r => r.label === hpForm.role) && (
                      <MenuItem value={hpForm.role}>{hpForm.role}</MenuItem>
                    )}
                  </Select>
                </FormControl>
                <TextField label="Short Description" value={hpForm.bio} fullWidth multiline minRows={3} size="small"
                  inputProps={{ maxLength: 300 }} helperText={`${hpForm.bio.length}/300`}
                  onChange={e => setHpForm(f => ({ ...f, bio: e.target.value }))} />
                <Box display="flex" alignItems="center" justifyContent="space-between"
                  sx={{ px: 1.5, py: 1, borderRadius: 2, border: `1px solid ${border}` }}>
                  <Box>
                    <Typography fontSize="0.88rem" fontWeight={700}>Display on Homepage</Typography>
                    <Typography variant="caption" color="text.secondary">
                      {hpForm.visible ? 'Visible to everyone' : 'Hidden — only admins see it'}
                    </Typography>
                  </Box>
                  <Switch color="error" checked={hpForm.visible}
                    onChange={e => setHpForm(f => ({ ...f, visible: e.target.checked }))}
                    inputProps={{ 'aria-label': 'Display on homepage' }} />
                </Box>
                {hpFormError && <Alert severity="error" sx={{ borderRadius: 2 }}>{hpFormError}</Alert>}
              </DialogContent>
              <DialogActions sx={{ px: 3, pb: 2.5 }}>
                <Button onClick={() => setHpDialogOpen(false)} color="inherit" disabled={hpSaving} sx={{ textTransform: 'none', fontWeight: 600 }}>
                  Cancel
                </Button>
                <Button onClick={handleSaveProfile} variant="contained" color="error" disabled={hpSaving}
                  sx={{ textTransform: 'none', fontWeight: 700, borderRadius: 2, minWidth: 120 }}>
                  {hpSaving ? <CircularProgress size={16} sx={{ color: 'white' }} /> : 'Save Profile'}
                </Button>
              </DialogActions>
            </Dialog>
          </Box>
        );

      /* ── AI CONFIGURATION (real, read-only) ── */
      case 'ai':
        return (
          <Box>
            <SectionTitle sub="Live status of the Claude-powered chatbot">AI Configuration</SectionTitle>
            {aiError && (
              <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}
                action={<Button color="error" size="small" onClick={loadAiStatus} sx={{ fontWeight: 700, textTransform: 'none' }}>Retry</Button>}>
                {aiError}
              </Alert>
            )}
            {aiLoading ? (
              <Box display="flex" alignItems="center" gap={1.5} py={2}>
                <CircularProgress size={18} color="error" />
                <Typography color="text.secondary" fontSize="0.9rem">Checking status…</Typography>
              </Box>
            ) : aiStatus && (
              <Paper elevation={0} sx={{ ...cardSx, mb: 2.5 }}>
                <Box px={3} py={2}>
                  <Row label="Status" border={border}>
                    <Chip
                      label={aiStatus.configured ? 'Configured' : 'Not Configured'}
                      size="small"
                      sx={{
                        fontWeight: 700,
                        bgcolor: aiStatus.configured ? (isDark ? 'rgba(22,163,74,0.15)' : '#f0fdf4') : (isDark ? 'rgba(220,38,38,0.12)' : '#fff0f0'),
                        color: aiStatus.configured ? '#16a34a' : '#dc2626',
                      }}
                    />
                  </Row>
                  <Row label="Model" border={border}><Typography fontSize="0.86rem" fontFamily="monospace">{aiStatus.model}</Typography></Row>
                  <Row label="Max Tool Iterations" border={border}><Typography fontSize="0.86rem">{aiStatus.maxToolIterations}</Typography></Row>
                </Box>
              </Paper>
            )}
            <Alert severity="info" sx={{ borderRadius: 3, fontSize: '0.82rem' }}>
              {aiStatus?.configured === false
                ? 'The AI assistant is currently using rule-based fallback responses. Set ANTHROPIC_API_KEY in Backend/.env and restart the server to enable real Claude responses.'
                : 'To change the model, set ANTHROPIC_API_KEY / edit MODEL in Backend/src/chatbot/chat.routes.js and restart the server — there is no runtime model switch by design.'}
            </Alert>
          </Box>
        );

      /* ── BLOOD RULES (real, read-only) ── */
      case 'blood':
        return (
          <Box>
            <SectionTitle sub="Eligibility rules actually enforced by the platform">Blood Rules</SectionTitle>
            <Paper elevation={0} sx={{ ...cardSx, mb: 2.5 }}>
              <Box px={3} py={2}>
                <Row label="Minimum interval between donations" value="56 days" border={border} />
                <Row label="Enforced by" value="QR check-in & AI eligibility tool" border={border} />
                <Row label="Defined in" value="Backend/src/common/eligibility.js" border={border} />
              </Box>
            </Paper>
            <Alert severity="info" sx={{ borderRadius: 3, fontSize: '0.82rem' }}>
              Age (18–60) and weight (45kg+) requirements are shown to donors as guidance text during
              registration, but are not currently validated server-side — this dashboard shows what&apos;s
              actually enforced in code rather than editable fields that wouldn&apos;t do anything.
            </Alert>
          </Box>
        );

      /* ── APPOINTMENT RULES (real, read-only) ── */
      case 'appointment':
        return (
          <Box>
            <SectionTitle sub="Booking configuration actually used by the appointment flow">Appointment Rules</SectionTitle>
            <Paper elevation={0} sx={{ ...cardSx, mb: 2.5 }}>
              <Box px={3} py={2}>
                <Row label="Morning slots" value="08:00, 09:00, 10:00, 11:00 AM" border={border} />
                <Row label="Afternoon slots" value="01:00, 02:00, 03:00, 04:00 PM" border={border} />
                <Row label="Defined in" value="frontend/.../appointments/page.jsx" border={border} />
              </Box>
            </Paper>
            <Alert severity="info" sx={{ borderRadius: 3, fontSize: '0.82rem' }}>
              There is currently no server-side cap on appointments per day, no cancellation window, and
              no automated reminder system — booking a slot doesn&apos;t check how many others already picked it.
            </Alert>
          </Box>
        );

      /* ── SECURITY ── */
      case 'security':
        return (
          <Box>
            <SectionTitle sub="Change your password and review what's actually enforced">Security</SectionTitle>

            <Paper elevation={0} sx={{ p: 2.5, borderRadius: 3, border: `1px solid ${border}`, bgcolor: card, mb: 2.5 }}>
              <Typography fontWeight={700} fontSize="0.88rem" mb={1.5} display="flex" alignItems="center" gap={0.8}>
                <Lock sx={{ fontSize: 16 }} /> Change Password
              </Typography>
              <Box display="flex" flexDirection="column" gap={1.5} maxWidth={320}>
                <TextField label="Current Password" type="password" size="small" fullWidth
                  value={pwForm.currentPassword} onChange={e => setPwForm(p => ({ ...p, currentPassword: e.target.value }))} />
                <TextField label="New Password" type="password" size="small" fullWidth
                  value={pwForm.newPassword} onChange={e => setPwForm(p => ({ ...p, newPassword: e.target.value }))} />
                <TextField label="Confirm New Password" type="password" size="small" fullWidth
                  value={pwForm.confirmPassword} onChange={e => setPwForm(p => ({ ...p, confirmPassword: e.target.value }))} />
                {pwMsg && <Alert severity={pwMsg.type} sx={{ borderRadius: 2, fontSize: '0.8rem' }}>{pwMsg.text}</Alert>}
                <Button variant="outlined" color="error" onClick={changePassword}
                  disabled={pwSaving || !pwForm.currentPassword || !pwForm.newPassword || !pwForm.confirmPassword}
                  sx={{ textTransform: 'none', fontWeight: 700, borderRadius: 2, alignSelf: 'flex-start' }}>
                  {pwSaving ? 'Updating…' : 'Update Password'}
                </Button>
              </Box>
            </Paper>

            <Paper elevation={0} sx={cardSx}>
              <Box px={3} py={1} sx={{ borderBottom: `1px solid ${border}`, bgcolor: subBg }}>
                <Typography fontWeight={700} fontSize="0.85rem" py={1}>What&apos;s Actually Enforced</Typography>
              </Box>
              <Box px={3} py={1}>
                <Row label="Password storage" value="bcrypt hash" border={border} />
                <Row label="Session length" value="7 days (JWT expiry)" border={border} />
                <Row label="Auth rate limiting" value="10 req / 15 min per IP (dev)" border={border} />
                <Row label="Input sanitization" value="NoSQL injection stripping" border={border} />
                <Row label="HTTP headers" value="helmet" border={border} />
              </Box>
            </Paper>
          </Box>
        );

      default:
        return null;
    }
  };

  return (
    <Box>
      {/* Header */}
      <Box display="flex" alignItems="center" gap={1.5} mb={3}>
        <Avatar sx={{ bgcolor: '#b71c1c', width: 52, height: 52 }}>
          <Settings sx={{ fontSize: 26 }} />
        </Avatar>
        <Box>
          <Typography variant="h5" fontWeight={800}
            sx={{ background: 'linear-gradient(to right, #b71c1c, #d32f2f)',
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', lineHeight: 1.2 }}>
            System Settings
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Your profile, and the platform&apos;s real configuration
          </Typography>
        </Box>
      </Box>

      <Box display="flex" gap={2.5} alignItems="flex-start">
        {/* Sidebar nav */}
        <Paper elevation={0} sx={{
          width: 220, flexShrink: 0, borderRadius: 3,
          border: `1px solid ${border}`, bgcolor: card, overflow: 'hidden',
        }}>
          <List dense disablePadding sx={{ py: 1 }}>
            {SECTIONS.map((s) => (
              <ListItemButton key={s.id} selected={section === s.id} onClick={() => setSection(s.id)}
                sx={{
                  mx: 1, borderRadius: 2, mb: 0.3, py: 0.9,
                  '&.Mui-selected': {
                    bgcolor: isDark ? 'rgba(220,38,38,0.12)' : '#fff0f0',
                    color: '#dc2626',
                    '& .MuiListItemIcon-root': { color: '#dc2626' },
                  },
                  '&:hover': { bgcolor: isDark ? 'rgba(255,255,255,0.04)' : '#fafafa' },
                }}>
                <ListItemIcon sx={{ minWidth: 32, color: section === s.id ? '#dc2626' : 'text.disabled' }}>
                  {s.icon}
                </ListItemIcon>
                <ListItemText primary={s.label}
                  primaryTypographyProps={{ fontSize: '0.845rem', fontWeight: section === s.id ? 700 : 500 }} />
              </ListItemButton>
            ))}
          </List>
        </Paper>

        {/* Content panel */}
        <Box flex={1} minWidth={0}>
          {renderContent()}
        </Box>
      </Box>
    </Box>
  );
}
