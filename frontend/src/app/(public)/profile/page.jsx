'use client';
import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import {
  Box, Container, Typography, Avatar, Paper, Chip, Button,
  useTheme, Grid, Skeleton, Tooltip, IconButton, Dialog,
  DialogTitle, DialogContent, DialogActions, TextField, CircularProgress,
} from '@mui/material';
import BloodtypeIcon      from '@mui/icons-material/Bloodtype';
import HourglassEmptyIcon from '@mui/icons-material/HourglassEmpty';
import CheckCircleIcon    from '@mui/icons-material/CheckCircle';
import CancelIcon         from '@mui/icons-material/Cancel';
import AccessTimeIcon     from '@mui/icons-material/AccessTime';
import LocalHospitalIcon  from '@mui/icons-material/LocalHospital';
import QrCode2Icon        from '@mui/icons-material/QrCode2';
import AddCircleIcon      from '@mui/icons-material/AddCircle';
import LockIcon           from '@mui/icons-material/Lock';
import EditIcon           from '@mui/icons-material/Edit';
import CameraAltIcon      from '@mui/icons-material/CameraAlt';
import axios              from 'axios';
import API_BASE           from '@/lib/config';
import { useUserAuth }    from '@/store/UserAuthContext';

const STATUS_META = {
  Pending:  { color: '#d97706', bg: 'rgba(217,119,6,0.12)',  darkBg: 'rgba(217,119,6,0.15)',  label: 'Pending',  icon: <HourglassEmptyIcon sx={{ fontSize: 13 }} /> },
  Approved: { color: '#16a34a', bg: 'rgba(22,163,74,0.1)',   darkBg: 'rgba(22,163,74,0.15)',  label: 'Approved', icon: <CheckCircleIcon   sx={{ fontSize: 13 }} /> },
  Rejected: { color: '#dc2626', bg: 'rgba(220,38,38,0.1)',   darkBg: 'rgba(220,38,38,0.15)',  label: 'Rejected', icon: <CancelIcon        sx={{ fontSize: 13 }} /> },
};

const URGENCY_COLOR = { Critical: '#dc2626', High: '#ea580c', Medium: '#d97706', Low: '#16a34a' };

export default function ProfilePage() {
  const theme  = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const { isAuth, user, token, updateUser } = useUserAuth();

  const [requests,     setRequests]     = useState([]);
  const [loading,      setLoading]      = useState(false);
  const [photoLoading, setPhotoLoading] = useState(false);
  const [photoError,   setPhotoError]   = useState('');
  const [editOpen,     setEditOpen]     = useState(false);
  const [editName,     setEditName]     = useState('');
  const [editPhone,    setEditPhone]    = useState('');
  const [saving,       setSaving]       = useState(false);
  const [saveError,    setSaveError]    = useState('');

  const fileInputRef = useRef(null);

  useEffect(() => {
    if (!isAuth || !user?.email) return;
    setLoading(true);
    axios.get(`${API_BASE}/api/requests?email=${encodeURIComponent(user.email)}`)
      .then(res => setRequests(Array.isArray(res.data) ? res.data : []))
      .catch(() => setRequests([]))
      .finally(() => setLoading(false));
  }, [isAuth, user?.email]);

  if (!isAuth) {
    return (
      <Box sx={{ minHeight: '70vh', display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center', gap: 2, textAlign: 'center', px: 3 }}>
        <LockIcon sx={{ fontSize: 52, color: '#b71c1c' }} />
        <Typography variant="h5" fontWeight={700}>Sign in to view your profile</Typography>
        <Typography color="text.secondary" fontSize="0.9rem">
          Your blood requests and donor information are only visible when logged in.
        </Typography>
        <Box display="flex" gap={2} mt={1}>
          <Button variant="contained" color="error" component={Link} href="/login" sx={{ borderRadius: 3 }}>Log In</Button>
          <Button variant="outlined" color="error" component={Link} href="/register" sx={{ borderRadius: 3 }}>Sign Up</Button>
        </Box>
      </Box>
    );
  }

  const initials  = user?.fullName?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) ?? '?';
  const statCount = (s) => s === 'All' ? requests.length : requests.filter(r => (r.status || 'Pending') === s).length;
  const card   = isDark ? '#111111' : '#ffffff';
  const border = isDark ? '#1f1f1f' : '#e5e5e5';
  const subBg  = isDark ? '#0d0d0d' : '#f8f8f8';

  const authHeader = () => ({ headers: { Authorization: `Bearer ${token}` } });

  const handlePhotoClick = () => {
    if (photoLoading) return;
    setPhotoError('');
    fileInputRef.current?.click();
  };

  const handlePhotoChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) {
      setPhotoError('Image must be under 10 MB.');
      e.target.value = '';
      return;
    }
    setPhotoLoading(true);
    setPhotoError('');
    try {
      const form = new FormData();
      form.append('photo', file);
      // Do NOT set Content-Type — axios sets it automatically with the correct multipart boundary
      const res = await axios.post(`${API_BASE}/api/user/photo`, form, {
        headers: { Authorization: `Bearer ${token}` },
      });
      updateUser({ photo: res.data.photo });
    } catch (err) {
      setPhotoError(err.response?.data?.message || 'Photo upload failed.');
    } finally {
      setPhotoLoading(false);
      e.target.value = '';
    }
  };

  const openEdit = () => {
    setEditName(user?.fullName || '');
    setEditPhone(user?.phone || '');
    setSaveError('');
    setEditOpen(true);
  };

  const handleSaveProfile = async () => {
    if (!editName.trim()) { setSaveError('Name cannot be empty.'); return; }
    setSaving(true);
    setSaveError('');
    try {
      const res = await axios.put(`${API_BASE}/api/user/profile`, { fullName: editName.trim(), phone: editPhone }, authHeader());
      updateUser({ fullName: res.data.fullName, phone: res.data.phone });
      setEditOpen(false);
    } catch (err) {
      setSaveError(err.response?.data?.message || 'Failed to save. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const photoSrc = user?.photo ? `${API_BASE}${user.photo}` : null;

  return (
    <Box sx={{ bgcolor: isDark ? '#0a0a0a' : '#f4f4f4', minHeight: '100vh', pb: 8 }}>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        style={{ display: 'none' }}
        onChange={handlePhotoChange}
      />

      {/* Hero banner */}
      <Box sx={{
        background: isDark
          ? 'linear-gradient(135deg, #1a0000 0%, #2d0505 100%)'
          : 'linear-gradient(135deg, #b71c1c 0%, #7f0000 100%)',
        pt: { xs: 10, md: 12 }, pb: 8,
      }}>
        <Container maxWidth="md">
          <Box display="flex" flexDirection={{ xs: 'column', sm: 'row' }} alignItems={{ xs: 'center', sm: 'flex-end' }}
            gap={3}>

            {/* Avatar with camera badge */}
            <Box sx={{ flexShrink: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0.5 }}>
              <Tooltip title={photoLoading ? 'Uploading…' : 'Change photo'}>
                <Box sx={{ position: 'relative', cursor: photoLoading ? 'not-allowed' : 'pointer' }}
                  onClick={handlePhotoClick}>
                  <Avatar
                    src={photoSrc || undefined}
                    sx={{
                      width: 96, height: 96, bgcolor: 'rgba(255,255,255,0.2)',
                      fontSize: '2.4rem', fontWeight: 800,
                      border: '3px solid rgba(255,255,255,0.5)',
                      boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
                      opacity: photoLoading ? 0.6 : 1,
                      transition: 'opacity 0.2s',
                    }}
                  >
                    {!photoSrc && initials}
                  </Avatar>
                  <Box sx={{
                    position: 'absolute', bottom: 0, right: 0,
                    width: 28, height: 28, borderRadius: '50%',
                    bgcolor: '#dc2626', border: '2px solid white',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    {photoLoading
                      ? <CircularProgress size={12} sx={{ color: 'white' }} />
                      : <CameraAltIcon sx={{ fontSize: 14, color: 'white' }} />
                    }
                  </Box>
                </Box>
              </Tooltip>
              {photoError && (
                <Typography fontSize="0.68rem" color="#fca5a5" textAlign="center" maxWidth={100}>
                  {photoError}
                </Typography>
              )}
            </Box>

            <Box flex={1} textAlign={{ xs: 'center', sm: 'left' }}>
              <Box display="flex" alignItems="center" gap={1} justifyContent={{ xs: 'center', sm: 'flex-start' }}>
                <Typography variant="h4" fontWeight={900} color="white" sx={{ letterSpacing: '-0.02em' }}>
                  {user?.fullName}
                </Typography>
                <Tooltip title="Edit profile">
                  <IconButton onClick={openEdit} size="small"
                    sx={{ color: 'rgba(255,255,255,0.7)', '&:hover': { color: 'white', bgcolor: 'rgba(255,255,255,0.1)' } }}>
                    <EditIcon sx={{ fontSize: 18 }} />
                  </IconButton>
                </Tooltip>
              </Box>
              <Typography color="rgba(255,255,255,0.65)" fontSize="0.9rem" mt={0.5}>
                {user?.email}
              </Typography>
              {user?.phone && (
                <Typography color="rgba(255,255,255,0.5)" fontSize="0.82rem" mt={0.2}>
                  {user.phone}
                </Typography>
              )}
            </Box>

            <Box display="flex" gap={1.5} flexWrap="wrap" justifyContent={{ xs: 'center', sm: 'flex-end' }}>
              <Button component={Link} href="/qr-card" variant="outlined" startIcon={<QrCode2Icon />}
                sx={{ color: 'white', borderColor: 'rgba(255,255,255,0.4)', borderRadius: 2,
                  textTransform: 'none', fontWeight: 600, fontSize: '0.85rem',
                  '&:hover': { bgcolor: 'rgba(255,255,255,0.1)', borderColor: 'white' } }}>
                QR Card
              </Button>
              <Button component={Link} href="/requests" variant="contained" startIcon={<AddCircleIcon />}
                sx={{ bgcolor: 'white', color: '#b91c1c', borderRadius: 2,
                  textTransform: 'none', fontWeight: 700, fontSize: '0.85rem',
                  '&:hover': { bgcolor: '#fff1f2' } }}>
                New Request
              </Button>
            </Box>
          </Box>
        </Container>
      </Box>

      <Container maxWidth="md" sx={{ mt: -3 }}>

        {/* Stats row */}
        <Grid container spacing={2} mb={3}>
          {[
            { label: 'Total',    value: statCount('All'),      color: '#b71c1c' },
            { label: 'Pending',  value: statCount('Pending'),  color: '#d97706' },
            { label: 'Approved', value: statCount('Approved'), color: '#16a34a' },
            { label: 'Rejected', value: statCount('Rejected'), color: '#dc2626' },
          ].map(s => (
            <Grid item xs={6} sm={3} key={s.label}>
              <Paper elevation={0} sx={{ p: 2, borderRadius: 3, border: `1px solid ${border}`,
                bgcolor: card, textAlign: 'center' }}>
                <Typography fontWeight={900} fontSize="2rem" sx={{ color: s.color }} lineHeight={1}>
                  {s.value}
                </Typography>
                <Typography fontSize="0.72rem" fontWeight={700} color="text.secondary"
                  textTransform="uppercase" letterSpacing="0.06em" mt={0.4}>
                  {s.label}
                </Typography>
              </Paper>
            </Grid>
          ))}
        </Grid>

        {/* Requests section */}
        <Paper elevation={0} sx={{ borderRadius: 3, border: `1px solid ${border}`, bgcolor: card, overflow: 'hidden' }}>
          <Box sx={{ px: 3, py: 2.5, borderBottom: `1px solid ${border}`,
            display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Box display="flex" alignItems="center" gap={1.5}>
              <BloodtypeIcon sx={{ color: '#b71c1c', fontSize: 22 }} />
              <Box>
                <Typography fontWeight={800} fontSize="1rem">My Blood Requests</Typography>
                <Typography variant="caption" color="text.secondary">
                  {requests.length} total request{requests.length !== 1 ? 's' : ''} submitted by you
                </Typography>
              </Box>
            </Box>
            <Button component={Link} href="/requests" variant="outlined" color="error" size="small"
              startIcon={<AddCircleIcon />}
              sx={{ textTransform: 'none', fontWeight: 700, borderRadius: 2, fontSize: '0.8rem' }}>
              New Request
            </Button>
          </Box>

          {loading ? (
            <Box sx={{ p: 3, display: 'flex', flexDirection: 'column', gap: 2 }}>
              {[...Array(3)].map((_, i) => (
                <Skeleton key={i} variant="rounded" height={90} sx={{ borderRadius: 2 }} />
              ))}
            </Box>
          ) : requests.length === 0 ? (
            <Box sx={{ py: 8, textAlign: 'center' }}>
              <LocalHospitalIcon sx={{ fontSize: 48, color: 'text.disabled', mb: 1.5 }} />
              <Typography fontWeight={700} color="text.secondary" gutterBottom>No requests yet</Typography>
              <Typography variant="caption" color="text.disabled" display="block" mb={3}>
                Blood requests you submit will appear here.
              </Typography>
              <Button component={Link} href="/requests" variant="contained" color="error"
                startIcon={<AddCircleIcon />}
                sx={{ textTransform: 'none', fontWeight: 700, borderRadius: 2 }}>
                Submit Your First Request
              </Button>
            </Box>
          ) : (
            <Box sx={{ p: 2, display: 'flex', flexDirection: 'column', gap: 1.5 }}>
              {requests.map((req) => {
                const status   = req.status || 'Pending';
                const stMeta   = STATUS_META[status] || STATUS_META.Pending;
                const urgColor = URGENCY_COLOR[req.urgency] || '#888';
                return (
                  <Paper key={req._id} elevation={0} sx={{
                    borderRadius: 2.5, border: `1px solid ${border}`, bgcolor: subBg,
                    overflow: 'hidden',
                    transition: 'box-shadow 0.15s',
                    '&:hover': { boxShadow: isDark ? '0 4px 20px rgba(0,0,0,0.4)' : '0 4px 20px rgba(0,0,0,0.08)' },
                  }}>
                    <Box sx={{ height: 3, bgcolor: urgColor }} />
                    <Box sx={{ p: 2, display: 'flex', gap: 2, alignItems: 'flex-start', flexWrap: 'wrap' }}>
                      <Box sx={{
                        width: 48, height: 48, borderRadius: 2, flexShrink: 0,
                        bgcolor: isDark ? 'rgba(183,28,28,0.15)' : '#fff0f0',
                        border: `1.5px solid ${isDark ? 'rgba(183,28,28,0.3)' : '#ffcdd2'}`,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                      }}>
                        <Typography fontWeight={900} fontSize="0.95rem" color="#dc2626">
                          {req.bloodType}
                        </Typography>
                      </Box>

                      <Box flex={1} minWidth={0}>
                        <Box display="flex" alignItems="center" gap={1} flexWrap="wrap" mb={0.5}>
                          <Typography fontWeight={700} fontSize="0.92rem" noWrap>{req.patientName}</Typography>
                          <Chip
                            icon={stMeta.icon}
                            label={stMeta.label}
                            size="small"
                            sx={{
                              fontSize: '0.7rem', fontWeight: 700, height: 22,
                              bgcolor: isDark ? stMeta.darkBg : stMeta.bg,
                              color: stMeta.color,
                              '& .MuiChip-icon': { color: stMeta.color },
                            }}
                          />
                          <Chip label={req.urgency} size="small"
                            sx={{
                              fontSize: '0.68rem', fontWeight: 700, height: 22,
                              bgcolor: isDark ? `${urgColor}18` : `${urgColor}12`,
                              color: urgColor,
                            }} />
                        </Box>
                        <Box display="flex" alignItems="center" gap={0.6} mb={0.3}>
                          <LocalHospitalIcon sx={{ fontSize: 13, color: 'text.disabled' }} />
                          <Typography fontSize="0.78rem" color="text.secondary" noWrap>{req.hospitalName}</Typography>
                        </Box>
                        {req.reason && (
                          <Typography fontSize="0.78rem" color="text.disabled"
                            sx={{ display: '-webkit-box', WebkitLineClamp: 1, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                            {req.reason}
                          </Typography>
                        )}
                      </Box>

                      <Box textAlign="right" flexShrink={0}>
                        <Box display="flex" alignItems="center" gap={0.5} justifyContent="flex-end">
                          <AccessTimeIcon sx={{ fontSize: 12, color: 'text.disabled' }} />
                          <Typography fontSize="0.72rem" color="text.disabled">
                            {req.createdAt
                              ? new Date(req.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
                              : '—'}
                          </Typography>
                        </Box>
                        <Typography fontSize="0.7rem" color="text.disabled" mt={0.3}>
                          {req.unitsNeeded || 1} unit{req.unitsNeeded !== 1 ? 's' : ''}
                        </Typography>
                      </Box>
                    </Box>

                    {status === 'Approved' && (
                      <Box sx={{ px: 2, pb: 1.5, pt: 0 }}>
                        <Box sx={{ px: 1.5, py: 0.8, borderRadius: 1.5,
                          bgcolor: isDark ? 'rgba(22,163,74,0.1)' : '#f0fdf4',
                          border: '1px solid rgba(22,163,74,0.2)' }}>
                          <Typography fontSize="0.75rem" color="#16a34a" fontWeight={600}>
                            ✓ Your request has been approved. Our team will contact you shortly.
                          </Typography>
                        </Box>
                      </Box>
                    )}
                    {status === 'Rejected' && (
                      <Box sx={{ px: 2, pb: 1.5, pt: 0 }}>
                        <Box sx={{ px: 1.5, py: 0.8, borderRadius: 1.5,
                          bgcolor: isDark ? 'rgba(220,38,38,0.08)' : '#fff0f0',
                          border: '1px solid rgba(220,38,38,0.2)' }}>
                          <Typography fontSize="0.75rem" color="#dc2626" fontWeight={600}>
                            This request was not approved. Please contact us or submit a new request.
                          </Typography>
                        </Box>
                      </Box>
                    )}
                  </Paper>
                );
              })}
            </Box>
          )}
        </Paper>

        {/* Quick links */}
        <Grid container spacing={2} mt={1}>
          {[
            { label: 'My QR Card',    desc: 'Download your donor ID card', href: '/qr-card',  icon: <QrCode2Icon sx={{ color: '#b71c1c' }} /> },
            { label: 'Find Hospital', desc: 'Locate nearby hospitals',      href: '/map',      icon: <LocalHospitalIcon sx={{ color: '#b71c1c' }} /> },
            { label: 'New Request',   desc: 'Submit a blood request',        href: '/requests', icon: <BloodtypeIcon sx={{ color: '#b71c1c' }} /> },
          ].map(item => (
            <Grid item xs={12} sm={4} key={item.label}>
              <Paper component={Link} href={item.href} elevation={0}
                sx={{
                  p: 2.5, borderRadius: 3, border: `1px solid ${border}`,
                  bgcolor: card, display: 'flex', alignItems: 'center', gap: 1.5,
                  textDecoration: 'none', color: 'inherit',
                  transition: 'all 0.15s',
                  '&:hover': { borderColor: '#dc2626', boxShadow: '0 4px 16px rgba(183,28,28,0.12)', transform: 'translateY(-1px)' },
                }}>
                <Box sx={{ width: 40, height: 40, borderRadius: 2, flexShrink: 0,
                  bgcolor: isDark ? 'rgba(183,28,28,0.12)' : '#fff0f0',
                  display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {item.icon}
                </Box>
                <Box>
                  <Typography fontWeight={700} fontSize="0.85rem">{item.label}</Typography>
                  <Typography fontSize="0.72rem" color="text.secondary">{item.desc}</Typography>
                </Box>
              </Paper>
            </Grid>
          ))}
        </Grid>
      </Container>

      {/* Edit Profile Dialog */}
      <Dialog open={editOpen} onClose={() => setEditOpen(false)} maxWidth="xs" fullWidth
        PaperProps={{ sx: { borderRadius: 3, bgcolor: isDark ? '#111' : '#fff' } }}>
        <DialogTitle sx={{ fontWeight: 800, fontSize: '1rem', pb: 1 }}>
          Edit Profile
        </DialogTitle>
        <DialogContent sx={{ pt: 2, pb: 2 }}>
          <TextField
            label="Full Name"
            value={editName}
            onChange={e => setEditName(e.target.value)}
            fullWidth
            size="small"
            sx={{ mb: 2 }}
          />
          <TextField
            label="Phone Number"
            value={editPhone}
            onChange={e => setEditPhone(e.target.value)}
            fullWidth
            size="small"
            placeholder="+855 ..."
          />
          {saveError && (
            <Typography color="error" fontSize="0.82rem" mt={1.5}>{saveError}</Typography>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5 }}>
          <Button onClick={() => setEditOpen(false)} color="inherit"
            sx={{ textTransform: 'none', fontWeight: 600 }}>
            Cancel
          </Button>
          <Button onClick={handleSaveProfile} variant="contained" color="error" disabled={saving}
            sx={{ textTransform: 'none', fontWeight: 700, borderRadius: 2, minWidth: 90 }}>
            {saving ? <CircularProgress size={16} sx={{ color: 'white' }} /> : 'Save'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
