'use client';
import React, { useState } from 'react';
import {
  Box, Typography, Paper, useTheme, Avatar, List, ListItemButton,
  ListItemIcon, ListItemText, TextField, Button,
  Chip, Alert, IconButton, Tooltip, CircularProgress,
} from '@mui/material';
import {
  Settings, SmartToy, Bloodtype, CalendarMonth,
  Security, Person, Delete, AddAPhoto, Lock,
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

export default function AdminSettings() {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const { token, staff, login } = useAuth();

  const [section, setSection] = useState('profile');

  const card  = isDark ? '#111111' : '#ffffff';
  const border = isDark ? '#1f1f1f' : '#e5e5e5';
  const subBg  = isDark ? '#0a0a0a' : '#f8f8f8';

  const authHeader = () => ({ Authorization: `Bearer ${token}` });

  // ── My Profile ──────────────────────────────────────────────────────────
  const [fullName, setFullName] = useState(staff?.fullName || '');
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileMsg, setProfileMsg] = useState(null); // { type: 'success'|'error', text }

  const saveProfile = async () => {
    if (!fullName.trim()) return;
    setProfileSaving(true);
    setProfileMsg(null);
    try {
      const res = await fetch(`${API_BASE}/api/staff/me`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', ...authHeader() },
        body: JSON.stringify({ fullName: fullName.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to update profile.');
      login(token, { ...staff, fullName: data.fullName });
      setProfileMsg({ type: 'success', text: 'Profile updated.' });
    } catch (err) {
      setProfileMsg({ type: 'error', text: err.message });
    } finally {
      setProfileSaving(false);
    }
  };

  // ── Homepage profiles (real, unchanged) ─────────────────────────────────
  const [hpProfiles, setHpProfiles]     = useState([]);
  const [hpLoading, setHpLoading]       = useState(false);
  const [hpUploading, setHpUploading]   = useState({});
  const [hpError, setHpError]           = useState('');
  const photoInputRefs = React.useRef({});

  const loadHpProfiles = React.useCallback(() => {
    setHpLoading(true);
    setHpError('');
    fetch(`${API_BASE}/api/homepage`)
      .then(r => {
        if (!r.ok) throw new Error(`Server returned ${r.status}`);
        return r.json();
      })
      .then(data => setHpProfiles(Array.isArray(data) ? data : []))
      .catch(err => setHpError(err.message || 'Failed to load profiles.'))
      .finally(() => setHpLoading(false));
  }, []);

  React.useEffect(() => {
    if (section !== 'homepage') return;
    loadHpProfiles();
  }, [section, loadHpProfiles]);

  const handlePhotoUpload = async (profileId, file) => {
    if (!file) return;
    setHpUploading(p => ({ ...p, [profileId]: true }));
    const form = new FormData();
    form.append('photo', file);
    try {
      const res = await fetch(`${API_BASE}/api/homepage/${profileId}/photo`, {
        method: 'POST',
        headers: authHeader(),
        body: form,
      });
      const updated = await res.json();
      if (!res.ok) throw new Error(updated.message || 'Upload failed');
      setHpProfiles(prev => prev.map(p => p._id === profileId ? { ...p, photo: updated.photo } : p));
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
        headers: authHeader(),
      });
      if (!res.ok) throw new Error('Remove failed');
      setHpProfiles(prev => prev.map(p => p._id === profileId ? { ...p, photo: null } : p));
    } catch (err) {
      setHpError(err.message);
    } finally {
      setHpUploading(p => ({ ...p, [profileId]: false }));
    }
  };

  // ── AI configuration (real, read-only status) ───────────────────────────
  const [aiStatus, setAiStatus]   = useState(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError]     = useState('');

  const loadAiStatus = React.useCallback(() => {
    setAiLoading(true);
    setAiError('');
    fetch(`${API_BASE}/api/chat/status`, { headers: authHeader() })
      .then(r => {
        if (!r.ok) throw new Error(`Server returned ${r.status}`);
        return r.json();
      })
      .then(setAiStatus)
      .catch(err => setAiError(err.message || 'Failed to load AI status.'))
      .finally(() => setAiLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

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
    setPwSaving(true);
    try {
      const res = await fetch(`${API_BASE}/api/staff/me/password`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', ...authHeader() },
        body: JSON.stringify({
          currentPassword: pwForm.currentPassword,
          newPassword: pwForm.newPassword,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to change password.');
      setPwMsg({ type: 'success', text: 'Password updated.' });
      setPwForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err) {
      setPwMsg({ type: 'error', text: err.message });
    } finally {
      setPwSaving(false);
    }
  };

  const Row = ({ label, children }) => (
    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', py: 1.5,
      borderBottom: `1px solid ${border}`, '&:last-child': { borderBottom: 'none' } }}>
      <Typography fontSize="0.88rem" fontWeight={500} color="text.secondary">{label}</Typography>
      <Box sx={{ minWidth: 240, display: 'flex', justifyContent: 'flex-end' }}>{children}</Box>
    </Box>
  );

  const SectionTitle = ({ children, sub }) => (
    <Box mb={2.5}>
      <Typography fontWeight={800} fontSize="1rem" letterSpacing="-0.01em">{children}</Typography>
      {sub && <Typography variant="caption" color="text.secondary">{sub}</Typography>}
    </Box>
  );

  const InfoRow = ({ label, value }) => (
    <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 1.2, borderBottom: `1px solid ${border}`, '&:last-child': { borderBottom: 'none' } }}>
      <Typography fontSize="0.85rem" color="text.secondary">{label}</Typography>
      <Typography fontSize="0.85rem" fontWeight={600} textAlign="right">{value}</Typography>
    </Box>
  );

  const renderContent = () => {
    switch (section) {

      /* ── MY PROFILE ── */
      case 'profile':
        return (
          <Box>
            <SectionTitle sub="Your own admin account details">My Profile</SectionTitle>
            <Paper elevation={0} sx={{ borderRadius: 3, border: `1px solid ${border}`, bgcolor: card, overflow: 'hidden', mb: 2.5 }}>
              <Box px={3} py={2}>
                <Row label="Display Name">
                  <TextField size="small" value={fullName} onChange={e => setFullName(e.target.value)} sx={{ width: 240 }} />
                </Row>
                <Row label="Email">
                  <Typography fontSize="0.86rem" color="text.secondary">{staff?.email}</Typography>
                </Row>
                <Row label="Role">
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
            <SectionTitle sub="Update profile photos shown in the 'People Behind the Mission' section">
              Homepage Profiles
            </SectionTitle>
            {hpError && (
              <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}
                action={
                  <Button color="error" size="small" onClick={loadHpProfiles} sx={{ fontWeight: 700, textTransform: 'none' }}>
                    Retry
                  </Button>
                }
              >
                {hpError} — make sure the backend server is running.
              </Alert>
            )}
            {hpLoading ? (
              <Typography color="text.secondary" fontSize="0.9rem">Loading profiles…</Typography>
            ) : (
              <Box display="grid" gridTemplateColumns={{ xs: '1fr', sm: 'repeat(3, 1fr)' }} gap={2.5}>
                {hpProfiles.map(p => {
                  const photoUrl = p.photo
                    ? (p.photo.startsWith('http') ? p.photo : `${API_BASE}${p.photo}`)
                    : null;
                  const isUploading = !!hpUploading[p._id];
                  return (
                    <Paper key={p._id} elevation={0} sx={{
                      p: 3, borderRadius: 3, border: `1px solid ${border}`, bgcolor: card,
                      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1.5, textAlign: 'center',
                    }}>
                      {/* Avatar */}
                      <Box sx={{ position: 'relative' }}>
                        <Avatar
                          src={photoUrl || undefined}
                          sx={{
                            width: 88, height: 88, fontSize: '1.4rem', fontWeight: 900,
                            bgcolor: p.color,
                            border: '3px solid',
                            borderColor: isDark ? '#2a2a2a' : '#f5f5f5',
                            boxShadow: `0 6px 20px ${p.color}44`,
                          }}
                        >
                          {p.initials}
                        </Avatar>
                        <Tooltip title="Upload photo">
                          <IconButton
                            size="small"
                            disabled={isUploading}
                            onClick={() => photoInputRefs.current[p._id]?.click()}
                            sx={{
                              position: 'absolute', bottom: 0, right: -4,
                              bgcolor: '#dc2626', color: 'white', width: 28, height: 28,
                              '&:hover': { bgcolor: '#b91c1c' },
                              '&.Mui-disabled': { bgcolor: '#ccc' },
                            }}
                          >
                            <AddAPhoto sx={{ fontSize: 14 }} />
                          </IconButton>
                        </Tooltip>
                        <input
                          type="file" accept="image/*" hidden
                          ref={el => { photoInputRefs.current[p._id] = el; }}
                          onChange={e => handlePhotoUpload(p._id, e.target.files[0])}
                        />
                      </Box>

                      <Box>
                        <Typography fontWeight={700} fontSize="0.92rem">{p.name}</Typography>
                        <Typography variant="caption" color="text.disabled">{p.role}</Typography>
                      </Box>

                      <Chip
                        label={p.badge} size="small"
                        sx={{ bgcolor: isDark ? 'rgba(220,38,38,0.12)' : '#fff1f2', color: '#dc2626', fontWeight: 700, fontSize: '0.7rem' }}
                      />

                      <Box display="flex" gap={1} mt={0.5} width="100%">
                        <Button
                          fullWidth size="small" variant="outlined" color="error"
                          disabled={isUploading}
                          onClick={() => photoInputRefs.current[p._id]?.click()}
                          sx={{ textTransform: 'none', fontWeight: 600, borderRadius: 2, fontSize: '0.78rem' }}
                        >
                          {isUploading ? 'Uploading…' : 'Change Photo'}
                        </Button>
                        {photoUrl && (
                          <Tooltip title="Remove photo">
                            <IconButton
                              size="small" color="error"
                              disabled={isUploading}
                              onClick={() => handlePhotoRemove(p._id)}
                              sx={{ border: `1px solid ${border}`, borderRadius: 2, flexShrink: 0 }}
                            >
                              <Delete sx={{ fontSize: 16 }} />
                            </IconButton>
                          </Tooltip>
                        )}
                      </Box>
                    </Paper>
                  );
                })}
              </Box>
            )}
            <Typography variant="caption" color="text.disabled" display="block" mt={2.5}>
              Photos are shown on the public homepage. Max file size: 5 MB. Supported formats: JPG, PNG, WebP.
            </Typography>
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
              <Paper elevation={0} sx={{ borderRadius: 3, border: `1px solid ${border}`, bgcolor: card, overflow: 'hidden', mb: 2.5 }}>
                <Box px={3} py={2}>
                  <Row label="Status">
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
                  <Row label="Model"><Typography fontSize="0.86rem" fontFamily="monospace">{aiStatus.model}</Typography></Row>
                  <Row label="Max Tool Iterations"><Typography fontSize="0.86rem">{aiStatus.maxToolIterations}</Typography></Row>
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
            <Paper elevation={0} sx={{ borderRadius: 3, border: `1px solid ${border}`, bgcolor: card, overflow: 'hidden', mb: 2.5 }}>
              <Box px={3} py={2}>
                <InfoRow label="Minimum interval between donations" value="56 days" />
                <InfoRow label="Enforced by" value="QR check-in & AI eligibility tool" />
                <InfoRow label="Defined in" value="Backend/src/common/eligibility.js" />
              </Box>
            </Paper>
            <Alert severity="info" sx={{ borderRadius: 3, fontSize: '0.82rem' }}>
              Age (18–60) and weight (45kg+) requirements are shown to donors as guidance text during
              registration, but are not currently validated server-side — this dashboard shows what's
              actually enforced in code rather than editable fields that wouldn't do anything.
            </Alert>
          </Box>
        );

      /* ── APPOINTMENT RULES (real, read-only) ── */
      case 'appointment':
        return (
          <Box>
            <SectionTitle sub="Booking configuration actually used by the appointment flow">Appointment Rules</SectionTitle>
            <Paper elevation={0} sx={{ borderRadius: 3, border: `1px solid ${border}`, bgcolor: card, overflow: 'hidden', mb: 2.5 }}>
              <Box px={3} py={2}>
                <InfoRow label="Morning slots" value="08:00, 09:00, 10:00, 11:00 AM" />
                <InfoRow label="Afternoon slots" value="01:00, 02:00, 03:00, 04:00 PM" />
                <InfoRow label="Defined in" value="frontend/.../appointments/page.jsx" />
              </Box>
            </Paper>
            <Alert severity="info" sx={{ borderRadius: 3, fontSize: '0.82rem' }}>
              There is currently no server-side cap on appointments per day, no cancellation window, and
              no automated reminder system — booking a slot doesn't check how many others already picked it.
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

            <Paper elevation={0} sx={{ borderRadius: 3, border: `1px solid ${border}`, bgcolor: card, overflow: 'hidden' }}>
              <Box px={3} py={1} sx={{ borderBottom: `1px solid ${border}`, bgcolor: subBg }}>
                <Typography fontWeight={700} fontSize="0.85rem" py={1}>What's Actually Enforced</Typography>
              </Box>
              <Box px={3} py={1}>
                <InfoRow label="Password storage" value="bcrypt hash" />
                <InfoRow label="Session length" value="7 days (JWT expiry)" />
                <InfoRow label="Auth rate limiting" value="10 req / 15 min per IP (dev)" />
                <InfoRow label="Input sanitization" value="NoSQL injection stripping" />
                <InfoRow label="HTTP headers" value="helmet" />
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
            Your profile, and the platform's real configuration
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
