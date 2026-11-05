'use client';
import Link from 'next/link';
import { Avatar, Box, Button, CircularProgress, Typography } from '@mui/material';
import CameraAltIcon from '@mui/icons-material/CameraAlt';
import EmailIcon from '@mui/icons-material/Email';
import PhoneIcon from '@mui/icons-material/Phone';
import PlaceIcon from '@mui/icons-material/Place';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import QrCode2Icon from '@mui/icons-material/QrCode2';
import AddIcon from '@mui/icons-material/Add';

function InfoLine({ icon, children }) {
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, minWidth: 0, color: 'rgba(255,255,255,0.92)', fontSize: { xs: '0.88rem', sm: '0.95rem' } }}>
      <Box component="span" aria-hidden="true" sx={{ display: 'flex', color: 'rgba(255,255,255,0.75)', '& svg': { fontSize: 18 } }}>{icon}</Box>
      <Box component="span" sx={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{children}</Box>
    </Box>
  );
}

// Red blood drop with a white medical cross and a heartbeat line either side. Decoration only.
function DropArt() {
  return (
    <Box component="svg" viewBox="0 0 340 170" aria-hidden="true" sx={{ width: '100%', height: '100%', overflow: 'visible' }}>
      <defs>
        <radialGradient id="ph-drop" cx="38%" cy="38%" r="75%">
          <stop offset="0%" stopColor="#EF5361" />
          <stop offset="50%" stopColor="#E63946" />
          <stop offset="100%" stopColor="#A91529" />
        </radialGradient>
        <radialGradient id="ph-glow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#E63946" stopOpacity="0.45" />
          <stop offset="100%" stopColor="#E63946" stopOpacity="0" />
        </radialGradient>
        <filter id="ph-shadow" x="-40%" y="-30%" width="180%" height="170%">
          <feDropShadow dx="0" dy="10" stdDeviation="9" floodColor="#0B1220" floodOpacity="0.5" />
        </filter>
      </defs>
      <ellipse cx="170" cy="92" rx="95" ry="85" fill="url(#ph-glow)" />
      <polyline fill="none" stroke="#fff" strokeOpacity="0.85" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
        points="0,95 58,95 70,72 82,122 94,58 106,95 122,95" />
      <polyline fill="none" stroke="#fff" strokeOpacity="0.85" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
        points="218,95 234,95 246,60 258,124 270,74 282,95 340,95" />
      <path filter="url(#ph-shadow)" fill="url(#ph-drop)"
        d="M170 8 C 150 42, 120 74, 120 106 C 120 136, 143 158, 170 158 C 197 158, 220 136, 220 106 C 220 74, 190 42, 170 8 Z" />
      <path fill="#fff" fillOpacity="0.28" d="M146 82 C 150 66, 160 52, 166 42 C 164 60, 158 74, 156 92 C 150 94, 146 90, 146 82 Z" />
      <rect x="161" y="88" width="18" height="50" rx="4" fill="#fff" />
      <rect x="145" y="104" width="50" height="18" rx="4" fill="#fff" />
    </Box>
  );
}

const btnBase = {
  height: 44, px: 2.25, borderRadius: '10px', fontWeight: 700, fontSize: '0.9rem', whiteSpace: 'nowrap',
  transition: 'background-color .18s ease, border-color .18s ease, box-shadow .18s ease',
  '&.Mui-focusVisible': { outline: '2px solid #fff', outlineOffset: 2 },
};

/**
 * Navy profile banner: photo (with change-photo button), "Donor Account" + blood type badges,
 * name, contact details, and the Edit Profile / My QR Card / New Request actions.
 * `donor` is the matching donor record (location / blood type) when one exists.
 */
export default function ProfileHero({ user, photoSrc, initials, donor, photoLoading, onPhotoClick, onEdit }) {
  const bloodType = donor?.found ? donor.bloodType : '';

  return (
    <Box component="section" aria-labelledby="profile-name" sx={{
      position: 'relative', overflow: 'hidden', color: '#fff', borderRadius: '18px',
      background: (t) => (t.palette.mode === 'dark'
        ? 'linear-gradient(115deg, #0F2038 0%, #102541 55%, #142D50 100%)'
        : 'linear-gradient(115deg, #102541 0%, #173B63 58%, #245481 100%)'),
      boxShadow: (t) => (t.palette.mode === 'dark' ? 'none' : '0 14px 34px rgba(16,37,65,0.22)'),
    }}>
      {/* Decoration: soft light, waves, drop + heartbeat */}
      <Box aria-hidden="true" sx={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
        <Box sx={{ position: 'absolute', right: -100, top: -180, width: 520, height: 520, borderRadius: '50%', background: 'radial-gradient(circle, rgba(255,255,255,0.10) 0%, transparent 62%)' }} />
        <Box component="svg" viewBox="0 0 1200 200" preserveAspectRatio="none" sx={{ position: 'absolute', left: 0, right: 0, bottom: 0, width: '100%', height: '70%' }}>
          <path d="M0 150 C 240 90, 420 200, 660 140 S 1020 60, 1200 120 L 1200 200 L 0 200 Z" fill="#fff" fillOpacity="0.04" />
          <path d="M0 175 C 300 130, 520 205, 780 165 S 1080 120, 1200 150 L 1200 200 L 0 200 Z" fill="#fff" fillOpacity="0.05" />
          <path d="M0 120 C 260 60, 480 170, 720 110 S 1040 40, 1200 90" fill="none" stroke="#fff" strokeOpacity="0.07" strokeWidth="1.5" />
        </Box>
        <Box sx={{ display: { xs: 'none', lg: 'block' }, position: 'absolute', right: { lg: 8, xl: 24 }, top: '50%', transform: 'translateY(-50%)', width: { lg: 260, xl: 320 }, height: { lg: 130, xl: 160 } }}>
          <DropArt />
        </Box>
      </Box>

      <Box sx={{
        position: 'relative', px: { xs: 2.5, sm: 4, md: 5 }, py: { xs: 3, md: 3.5 }, pr: { lg: '300px', xl: '360px' },
        display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, alignItems: { xs: 'flex-start', sm: 'center' }, gap: { xs: 2.5, sm: 4 },
      }}>
        {/* Photo + change-photo button (the upload itself is handled by the page) */}
        <Box sx={{ position: 'relative', flexShrink: 0 }}>
          <Avatar src={photoSrc || undefined} alt="" sx={{
            width: { xs: 92, sm: 120, md: 128 }, height: { xs: 92, sm: 120, md: 128 },
            fontSize: { xs: '2rem', sm: '2.6rem' }, fontWeight: 800,
            bgcolor: '#F5C6CC', color: 'primary.dark', border: '4px solid #fff',
            boxShadow: '0 10px 28px rgba(0,0,0,0.3)', opacity: photoLoading ? 0.6 : 1, transition: 'opacity .2s',
          }}>
            {!photoSrc && initials}
          </Avatar>
          <Box component="button" type="button" onClick={onPhotoClick} disabled={photoLoading}
            aria-label={photoLoading ? 'Uploading photo' : 'Change profile photo'}
            sx={{
              position: 'absolute', right: { xs: -2, sm: 2 }, bottom: { xs: -2, sm: 4 },
              width: 36, height: 36, borderRadius: '50%', p: 0,
              display: 'grid', placeItems: 'center', cursor: photoLoading ? 'progress' : 'pointer',
              bgcolor: 'primary.main', color: '#fff', border: '3px solid #fff', boxShadow: '0 4px 10px rgba(0,0,0,0.25)',
              transition: 'background-color .18s ease',
              '&:hover': { bgcolor: 'primary.dark' },
              '&:focus-visible': { outline: '2px solid #fff', outlineOffset: 2 },
            }}>
            {photoLoading ? <CircularProgress size={14} color="inherit" /> : <CameraAltIcon sx={{ fontSize: 17 }} />}
          </Box>
        </Box>

        <Box sx={{ minWidth: 0, flex: 1, width: '100%' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap', mb: 0.75 }}>
            <Box component="span" sx={{
              px: 1.5, py: 0.5, borderRadius: '999px', bgcolor: 'rgba(255,255,255,0.14)',
              border: '1px solid rgba(255,255,255,0.2)', fontSize: '0.78rem', fontWeight: 700,
            }}>
              Donor Account
            </Box>
            {bloodType && (
              <Box component="span" aria-label={`Blood type ${bloodType}`} sx={{ px: 1.25, py: 0.5, borderRadius: '999px', bgcolor: '#fff', color: 'primary.main', fontSize: '0.8rem', fontWeight: 800 }}>
                {bloodType}
              </Box>
            )}
          </Box>
          <Typography id="profile-name" component="h1" sx={{
            fontWeight: 800, fontSize: { xs: '1.6rem', sm: '2.1rem' }, lineHeight: 1.15, letterSpacing: '-0.02em', overflowWrap: 'anywhere',
          }}>
            {user?.fullName || 'Your profile'}
          </Typography>
          <Box sx={{ mt: 1, display: 'flex', flexDirection: { xs: 'column', md: 'row' }, flexWrap: 'wrap', columnGap: 3, rowGap: 0.6 }}>
            {user?.email && <InfoLine icon={<EmailIcon />}>{user.email}</InfoLine>}
            {user?.phone && <InfoLine icon={<PhoneIcon />}>{user.phone}</InfoLine>}
            {donor?.location && <InfoLine icon={<PlaceIcon />}>{donor.location}</InfoLine>}
          </Box>

          <Box sx={{
            mt: 2.25, display: 'grid', gap: 1.25,
            gridTemplateColumns: { xs: '1fr 1fr', sm: 'repeat(3, auto)' }, justifyContent: { sm: 'start' },
          }}>
            <Button variant="outlined" startIcon={<EditOutlinedIcon />} onClick={onEdit} sx={{
              ...btnBase, color: '#fff', borderColor: 'rgba(255,255,255,0.75)', borderWidth: 1.5, bgcolor: 'transparent',
              '&:hover': { borderColor: '#fff', borderWidth: 1.5, bgcolor: 'rgba(255,255,255,0.1)' },
            }}>
              Edit Profile
            </Button>
            <Button component={Link} href="/qr-card" variant="contained" disableElevation startIcon={<QrCode2Icon />} sx={{
              ...btnBase, background: '#fff', color: 'primary.main', boxShadow: 'none', '&:hover': { background: '#FFF1F2', boxShadow: 'none' },
            }}>
              My QR Card
            </Button>
            <Button component={Link} href="/requests" variant="contained" disableElevation startIcon={<AddIcon />} sx={{
              ...btnBase, gridColumn: { xs: '1 / -1', sm: 'auto' },
              background: 'linear-gradient(135deg, #E63946 0%, #C91D32 100%)', color: '#fff',
              boxShadow: '0 6px 16px rgba(201,29,50,0.35)',
              '&:hover': { background: 'linear-gradient(135deg, #C91D32 0%, #A91529 100%)' },
            }}>
              New Request
            </Button>
          </Box>
        </Box>
      </Box>
    </Box>
  );
}
