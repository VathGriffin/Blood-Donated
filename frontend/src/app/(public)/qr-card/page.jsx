'use client';
import React, { useRef, useState, useEffect } from 'react';
import {
  Box, Typography, Button, Avatar, Chip, useTheme,
  ToggleButtonGroup, ToggleButton, Tooltip, CircularProgress,
} from '@mui/material';
import DownloadIcon    from '@mui/icons-material/Download';
import PrintIcon       from '@mui/icons-material/Print';
import BloodtypeIcon   from '@mui/icons-material/Bloodtype';
import FavoriteIcon    from '@mui/icons-material/Favorite';
import VerifiedIcon    from '@mui/icons-material/Verified';
import LockIcon        from '@mui/icons-material/Lock';
import PersonOffIcon   from '@mui/icons-material/PersonOff';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import Link            from 'next/link';
import QRCode          from 'react-qr-code';
import axios           from 'axios';
import { useUserAuth } from '@/store/UserAuthContext';
import API_BASE        from '@/lib/config';

const BLOOD_TYPES = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

const BLOOD_COLORS = {
  'A+': '#b71c1c', 'A-': '#c62828', 'B+': '#ad1457', 'B-': '#880e4f',
  'AB+': '#6a1b9a', 'AB-': '#4a148c', 'O+': '#1565c0', 'O-': '#0d47a1',
};

export default function QRCardPage() {
  const { isAuth, user } = useUserAuth();
  const cardRef = useRef(null);
  const theme   = useTheme();
  const isDark  = theme.palette.mode === 'dark';

  const [bloodType,  setBloodType]  = useState('O+');
  const [donor,      setDonor]      = useState(null);   // null = loading, false = not found
  const [loading,    setLoading]    = useState(false);

  useEffect(() => {
    if (!isAuth || !user?.email) return;
    setLoading(true);
    axios.get(`${API_BASE}/api/donors/lookup?email=${encodeURIComponent(user.email)}`)
      .then(res => {
        if (res.data.found) {
          setDonor(res.data);
          setBloodType(res.data.bloodType);
        } else {
          setDonor(false);
        }
      })
      .catch(() => setDonor(false))
      .finally(() => setLoading(false));
  }, [isAuth, user?.email]);

  const isVerified = !!donor;
  const isAvailable = donor?.available ?? false;

  const donorId = user?.id
    ? `BD-${user.id.toString().slice(-6).toUpperCase()}`
    : 'BD-XXXXXX';

  const qrValue = JSON.stringify({
    name:      user?.fullName ?? '',
    email:     user?.email    ?? '',
    bloodType,
    id:        donorId,
    verified:  isVerified,
    org:       'BloodLife Cambodia',
  });

  const handlePrint    = () => window.print();
  const handleDownload = async () => {
    const { default: html2canvas } = await import('html2canvas');
    const canvas = await html2canvas(cardRef.current, { scale: 3, useCORS: true });
    const link   = document.createElement('a');
    link.download = `blood-donor-card-${donorId}.png`;
    link.href     = canvas.toDataURL('image/png');
    link.click();
  };

  if (!isAuth) {
    return (
      <Box sx={{ minHeight: '70vh', display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center', px: 2, textAlign: 'center' }}>
        <LockIcon sx={{ fontSize: 56, color: '#b71c1c', mb: 2 }} />
        <Typography variant="h5" fontWeight={700} gutterBottom>Log in to view your QR Card</Typography>
        <Typography variant="body2" color="text.secondary" mb={3}>
          Your personalised blood donor ID card is only available when signed in.
        </Typography>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button variant="contained" color="error" component={Link} href="/login" sx={{ borderRadius: 3 }}>Log In</Button>
          <Button variant="outlined" color="error" component={Link} href="/register" sx={{ borderRadius: 3 }}>Sign Up</Button>
        </Box>
      </Box>
    );
  }

  const initials = user?.fullName?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) ?? '?';

  return (
    <Box sx={{ backgroundColor: isDark ? '#121212' : '#f4f4f4', minHeight: '100vh', pb: 8 }}>
      {/* Hero */}
      <Box sx={{
        background: isDark
          ? 'linear-gradient(135deg, #1a0000 0%, #2d0505 100%)'
          : 'linear-gradient(135deg, #b71c1c 0%, #7f0000 100%)',
        color: 'white', pt: { xs: 7, md: 9 }, pb: { xs: 5, md: 6 }, textAlign: 'center', px: 3,
      }}>
        <BloodtypeIcon sx={{ fontSize: 48, mb: 1.5, opacity: 0.9 }} />
        <Typography variant="h4" fontWeight={800} gutterBottom>Your Donor QR Card</Typography>
        <Typography variant="body1" sx={{ opacity: 0.88 }}>
          Present this card at any partner hospital or blood drive event.
        </Typography>
      </Box>

      <Box sx={{ maxWidth: 480, mx: 'auto', px: 2, mt: 5 }}>

        {/* Donor status banner */}
        {loading ? (
          <Box display="flex" justifyContent="center" alignItems="center" gap={1.5} mb={3}
            sx={{ py: 1.5, px: 2.5, borderRadius: 2, bgcolor: isDark ? '#1a1a1a' : '#f5f5f5',
              border: `1px solid ${isDark ? '#2a2a2a' : '#e5e5e5'}` }}>
            <CircularProgress size={16} color="error" />
            <Typography fontSize="0.85rem" color="text.secondary">Looking up your donor profile…</Typography>
          </Box>
        ) : isVerified ? (
          <Box display="flex" alignItems="center" gap={1.5} mb={3}
            sx={{ py: 1.5, px: 2.5, borderRadius: 2,
              bgcolor: isDark ? 'rgba(22,163,74,0.1)' : '#f0fdf4',
              border: '1px solid rgba(22,163,74,0.3)' }}>
            <VerifiedIcon sx={{ color: '#16a34a', fontSize: 22, flexShrink: 0 }} />
            <Box>
              <Typography fontSize="0.85rem" fontWeight={700} color="#16a34a">Verified Donor</Typography>
              <Typography fontSize="0.75rem" color="text.secondary">
                Blood type <strong>{bloodType}</strong> · registered in BloodLife
                {isAvailable ? ' · Available to donate' : ''}
              </Typography>
            </Box>
          </Box>
        ) : (
          <Box display="flex" alignItems="center" gap={1.5} mb={3}
            sx={{ py: 1.5, px: 2.5, borderRadius: 2,
              bgcolor: isDark ? 'rgba(217,119,6,0.1)' : '#fffbeb',
              border: '1px solid rgba(217,119,6,0.3)' }}>
            <PersonOffIcon sx={{ color: '#d97706', fontSize: 22, flexShrink: 0 }} />
            <Box>
              <Typography fontSize="0.85rem" fontWeight={700} color="#d97706">Not Yet Registered as Donor</Typography>
              <Typography fontSize="0.75rem" color="text.secondary">
                Register on the <Link href="/donate" style={{ color: '#dc2626', fontWeight: 600 }}>Donate page</Link> to get verified status.
              </Typography>
            </Box>
          </Box>
        )}

        {/* Blood-type selector — locked if verified, manual if not */}
        {isVerified ? (
          <Box mb={4} textAlign="center">
            <Typography variant="subtitle2" fontWeight={700} color="text.secondary" mb={1}>
              YOUR BLOOD TYPE
            </Typography>
            <Box display="inline-flex" alignItems="center" gap={1} sx={{
              px: 3, py: 1.2, borderRadius: 3,
              bgcolor: isDark ? `${BLOOD_COLORS[bloodType]}18` : `${BLOOD_COLORS[bloodType]}12`,
              border: `2px solid ${BLOOD_COLORS[bloodType]}66`,
            }}>
              <BloodtypeIcon sx={{ color: BLOOD_COLORS[bloodType], fontSize: 20 }} />
              <Typography fontWeight={900} fontSize="1.3rem" sx={{ color: BLOOD_COLORS[bloodType] }}>
                {bloodType}
              </Typography>
              <CheckCircleIcon sx={{ color: '#16a34a', fontSize: 16, ml: 0.5 }} />
            </Box>
            <Typography variant="caption" color="text.disabled" display="block" mt={0.8}>
              Confirmed from your donor record
            </Typography>
          </Box>
        ) : (
          <Box mb={4}>
            <Typography variant="subtitle2" fontWeight={700} mb={1.5} color="text.secondary" textAlign="center">
              SELECT YOUR BLOOD TYPE
            </Typography>
            <Box sx={{ display: 'flex', justifyContent: 'center' }}>
              <ToggleButtonGroup
                value={bloodType} exclusive
                onChange={(_, v) => v && setBloodType(v)}
                sx={{ flexWrap: 'wrap', gap: 0.5, justifyContent: 'center',
                  '& .MuiToggleButtonGroup-grouped': { border: '1px solid', borderRadius: '8px !important', mx: 0 } }}>
                {BLOOD_TYPES.map(t => (
                  <ToggleButton key={t} value={t} size="small"
                    sx={{
                      fontWeight: 700, fontSize: '0.78rem', px: 1.5, py: 0.6, minWidth: 46,
                      color: bloodType === t ? 'white !important' : BLOOD_COLORS[t],
                      bgcolor: bloodType === t ? `${BLOOD_COLORS[t]} !important` : 'transparent',
                      borderColor: `${BLOOD_COLORS[t]} !important`,
                      '&:hover': { bgcolor: `${BLOOD_COLORS[t]}18` },
                    }}>
                    {t}
                  </ToggleButton>
                ))}
              </ToggleButtonGroup>
            </Box>
          </Box>
        )}

        {/* ── The Card ── */}
        <Box ref={cardRef} sx={{
          borderRadius: 4, overflow: 'hidden',
          boxShadow: '0 20px 60px rgba(0,0,0,0.25)',
          background: isDark ? '#1e1e1e' : '#fff',
          border: `1px solid ${isDark ? '#2a2a2a' : '#e8e8e8'}`,
        }}>
          {/* Header strip */}
          <Box sx={{
            background: `linear-gradient(135deg, ${BLOOD_COLORS[bloodType]} 0%, #7f0000 100%)`,
            px: 3, py: 2.5, display: 'flex', alignItems: 'center', gap: 1.5,
          }}>
            <FavoriteIcon sx={{ color: 'rgba(255,255,255,0.9)', fontSize: 22 }} />
            <Box sx={{ flex: 1 }}>
              <Typography fontWeight={900} fontSize="1rem" color="white" letterSpacing={0.3}>
                BLOOD DONATED
              </Typography>
              <Typography fontSize="0.65rem"
                sx={{ color: 'rgba(255,255,255,0.75)', letterSpacing: 1.5, textTransform: 'uppercase' }}>
                Donor Identification Card
              </Typography>
            </Box>
            <Chip label={bloodType} size="small" sx={{
              bgcolor: 'rgba(255,255,255,0.22)', color: 'white',
              fontWeight: 800, fontSize: '0.9rem', height: 32, px: 0.5,
              border: '1.5px solid rgba(255,255,255,0.4)', backdropFilter: 'blur(4px)',
            }} />
          </Box>

          {/* Card body */}
          <Box sx={{ px: 3, py: 3, display: 'flex', gap: 3, alignItems: 'center' }}>
            {/* Left: avatar + info */}
            <Box sx={{ flex: 1 }}>
              <Avatar sx={{
                width: 72, height: 72, mb: 1.5,
                bgcolor: BLOOD_COLORS[bloodType],
                fontSize: '1.6rem', fontWeight: 800,
                border: `3px solid ${BLOOD_COLORS[bloodType]}44`,
                boxShadow: `0 4px 16px ${BLOOD_COLORS[bloodType]}55`,
              }}>
                {initials}
              </Avatar>

              <Typography fontWeight={800} fontSize="1.05rem" lineHeight={1.2} mb={0.4}>
                {user?.fullName}
              </Typography>
              <Typography fontSize="0.72rem" color="text.secondary" mb={1.5}>
                {user?.email}
              </Typography>

              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.6 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.7 }}>
                  <Typography fontSize="0.68rem" color="text.disabled" sx={{ minWidth: 56 }}>DONOR ID</Typography>
                  <Typography fontSize="0.72rem" fontWeight={700} fontFamily="monospace">{donorId}</Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.7 }}>
                  <Typography fontSize="0.68rem" color="text.disabled" sx={{ minWidth: 56 }}>BLOOD TYPE</Typography>
                  <Typography fontSize="0.72rem" fontWeight={800} sx={{ color: BLOOD_COLORS[bloodType] }}>
                    {bloodType}
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.7 }}>
                  <Typography fontSize="0.68rem" color="text.disabled" sx={{ minWidth: 56 }}>STATUS</Typography>
                  {isVerified ? (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.4 }}>
                      <VerifiedIcon sx={{ fontSize: 13, color: '#16a34a' }} />
                      <Typography fontSize="0.72rem" fontWeight={700} color="#16a34a">Verified Donor</Typography>
                    </Box>
                  ) : (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.4 }}>
                      <PersonOffIcon sx={{ fontSize: 13, color: '#d97706' }} />
                      <Typography fontSize="0.72rem" fontWeight={700} color="#d97706">Unverified</Typography>
                    </Box>
                  )}
                </Box>
                {isVerified && isAvailable && (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.7 }}>
                    <Typography fontSize="0.68rem" color="text.disabled" sx={{ minWidth: 56 }}>AVAILABLE</Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.4 }}>
                      <Box sx={{ width: 7, height: 7, borderRadius: '50%', bgcolor: '#16a34a' }} />
                      <Typography fontSize="0.72rem" fontWeight={700} color="#16a34a">Ready to donate</Typography>
                    </Box>
                  </Box>
                )}
              </Box>
            </Box>

            {/* Right: QR code */}
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0.8, flexShrink: 0 }}>
              <Box sx={{
                p: 1.2, borderRadius: 2,
                border: `2px solid ${BLOOD_COLORS[bloodType]}44`,
                background: '#fff',
              }}>
                <QRCode
                  value={qrValue}
                  size={110}
                  fgColor={BLOOD_COLORS[bloodType]}
                  bgColor="#ffffff"
                  level="M"
                />
              </Box>
              <Typography fontSize="0.6rem" color="text.disabled" textAlign="center">Scan to verify</Typography>
            </Box>
          </Box>

          {/* Footer strip */}
          <Box sx={{
            px: 3, py: 1.2,
            background: isDark ? '#111' : '#fafafa',
            borderTop: `1px solid ${isDark ? '#2a2a2a' : '#f0f0f0'}`,
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          }}>
            <Typography fontSize="0.6rem" color="text.disabled">BloodLife Cambodia · blooddonated.org</Typography>
            <Typography fontSize="0.6rem" color="text.disabled">{new Date().getFullYear()}</Typography>
          </Box>
        </Box>

        {/* Action buttons */}
        <Box sx={{ display: 'flex', gap: 2, mt: 3 }}>
          <Tooltip title="Download as PNG">
            <Button fullWidth variant="contained" color="error" startIcon={<DownloadIcon />}
              onClick={handleDownload}
              sx={{ borderRadius: 3, fontWeight: 700, py: 1.3, textTransform: 'none',
                boxShadow: '0 4px 16px rgba(183,28,28,0.35)' }}>
              Download Card
            </Button>
          </Tooltip>
          <Tooltip title="Print">
            <Button fullWidth variant="outlined" color="error" startIcon={<PrintIcon />}
              onClick={handlePrint}
              sx={{ borderRadius: 3, fontWeight: 700, py: 1.3, textTransform: 'none' }}>
              Print
            </Button>
          </Tooltip>
        </Box>

        {!isVerified && !loading && (
          <Typography variant="caption" display="block" textAlign="center" mt={2} color="text.disabled">
            Select your blood type above — register as a donor to get it auto-filled.
          </Typography>
        )}
      </Box>
    </Box>
  );
}
