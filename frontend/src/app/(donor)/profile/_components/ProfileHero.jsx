'use client';
import Link from 'next/link';
import { Avatar, Box, Button, CircularProgress, Typography } from '@mui/material';
import FavoriteIcon from '@mui/icons-material/Favorite';
import CameraAltIcon from '@mui/icons-material/CameraAlt';
import EmailIcon from '@mui/icons-material/Email';
import PhoneIcon from '@mui/icons-material/Phone';
import PlaceIcon from '@mui/icons-material/Place';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import QrCode2Icon from '@mui/icons-material/QrCode2';
import AddIcon from '@mui/icons-material/Add';
import { script } from '@/lib/fonts';
import HeartArt from '@/components/donor/HeartArt';

function InfoLine({ icon, children }) {
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25, minWidth: 0, color: '#fff', fontSize: { xs: '0.9rem', sm: '1rem' } }}>
      <Box component="span" aria-hidden="true" sx={{ display: 'flex', '& svg': { fontSize: 19 } }}>{icon}</Box>
      <Box component="span" sx={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{children}</Box>
    </Box>
  );
}

const btnBase = {
  height: 50, px: 2.5, borderRadius: '12px', fontWeight: 700, fontSize: '0.95rem', whiteSpace: 'nowrap',
  '&.Mui-focusVisible': { outline: '2px solid #fff', outlineOffset: 2 },
};

/**
 * Red profile banner: photo (with change-photo button), "Donor Account" badge, name, contact
 * details, and the Edit Profile / My QR Card / New Request actions.
 * `donor` is the matching donor record (location / blood type) when one exists.
 */
export default function ProfileHero({ user, photoSrc, initials, donor, photoLoading, onPhotoClick, onEdit }) {
  const bloodType = donor?.found ? donor.bloodType : '';

  return (
    <Box component="section" aria-labelledby="profile-name" sx={{
      position: 'relative', overflow: 'hidden', color: '#fff', borderRadius: '18px', minHeight: { lg: 224 },
      background: (t) => (t.palette.mode === 'dark'
        ? 'linear-gradient(100deg, #6E1019 0%, #8F1522 50%, #5C0F18 100%)'
        : 'linear-gradient(100deg, #A3172A 0%, #B91C2C 40%, #C7283A 68%, #9B1726 100%)'),
      boxShadow: (t) => (t.palette.mode === 'dark' ? 'none' : '0 14px 34px rgba(136,29,42,0.22)'),
    }}>
      {/* Decoration: soft light, heart + heartbeat, script tagline */}
      <Box aria-hidden="true" sx={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
        <Box sx={{ position: 'absolute', right: -120, top: -160, width: 520, height: 520, borderRadius: '50%', background: 'radial-gradient(circle, rgba(255,255,255,0.14) 0%, transparent 62%)' }} />
        <Box sx={{ position: 'absolute', left: -80, bottom: -140, width: 320, height: 320, borderRadius: '50%', background: 'radial-gradient(circle, rgba(0,0,0,0.12) 0%, transparent 65%)' }} />
        <Box sx={{ display: { xs: 'none', lg: 'block' }, position: 'absolute', right: 0, top: 4, width: { lg: 280, xl: 330 }, height: { lg: 170, xl: 200 } }}>
          <HeartArt />
        </Box>
        <Typography className={script.className} sx={{
          display: { xs: 'none', xl: 'block' }, position: 'absolute', right: 360, top: 34, transform: 'rotate(-10deg)',
          fontSize: '2.6rem', lineHeight: 1.05, fontWeight: 700, color: '#fff', textAlign: 'center',
          textShadow: '0 2px 10px rgba(90,8,18,0.35)',
        }}>
          Give Blood<br />Give Hope
          <FavoriteIcon sx={{ fontSize: 26, ml: 0.5, verticalAlign: 'top' }} />
        </Typography>
      </Box>

      <Box sx={{
        position: 'relative', px: { xs: 2.5, sm: 4, md: 5 }, py: { xs: 3, md: 3.5 },
        display: 'flex', flexDirection: { xs: 'column', xl: 'row' }, alignItems: { xs: 'stretch', xl: 'flex-end' },
        justifyContent: 'space-between', gap: { xs: 2.5, xl: 3 },
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 2, sm: 4 }, minWidth: 0 }}>
          {/* Photo + change-photo button (the upload itself is handled by the page) */}
          <Box sx={{ position: 'relative', flexShrink: 0 }}>
            <Avatar src={photoSrc || undefined} alt="" sx={{
              width: { xs: 88, sm: 128, md: 140 }, height: { xs: 88, sm: 128, md: 140 },
              fontSize: { xs: '2rem', sm: '2.8rem' }, fontWeight: 800,
              bgcolor: '#F3C1C7', color: 'primary.dark', border: '5px solid #fff',
              boxShadow: '0 10px 28px rgba(0,0,0,0.22)', opacity: photoLoading ? 0.6 : 1, transition: 'opacity .2s',
            }}>
              {!photoSrc && initials}
            </Avatar>
            <Box component="button" type="button" onClick={onPhotoClick} disabled={photoLoading}
              aria-label={photoLoading ? 'Uploading photo' : 'Change profile photo'}
              sx={{
                position: 'absolute', right: { xs: -2, sm: 0 }, bottom: { xs: -2, sm: 6 },
                width: { xs: 32, sm: 38 }, height: { xs: 32, sm: 38 }, borderRadius: '50%', p: 0,
                display: 'grid', placeItems: 'center', cursor: photoLoading ? 'progress' : 'pointer',
                bgcolor: 'primary.main', color: '#fff', border: '3px solid #fff', boxShadow: '0 4px 10px rgba(0,0,0,0.2)',
                '&:hover': { bgcolor: 'primary.dark' },
                '&:focus-visible': { outline: '2px solid #fff', outlineOffset: 2 },
              }}>
              {photoLoading ? <CircularProgress size={14} color="inherit" /> : <CameraAltIcon sx={{ fontSize: 18 }} />}
            </Box>
          </Box>

          <Box sx={{ minWidth: 0 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap', mb: 1 }}>
              <Box component="span" sx={{
                px: 1.75, py: 0.6, borderRadius: '999px', bgcolor: 'rgba(255,255,255,0.18)',
                border: '1px solid rgba(255,255,255,0.22)', fontSize: '0.85rem', fontWeight: 700,
              }}>
                Donor Account
              </Box>
              {bloodType && (
                <Box component="span" sx={{ px: 1.25, py: 0.6, borderRadius: '999px', bgcolor: '#fff', color: 'primary.main', fontSize: '0.85rem', fontWeight: 800 }}>
                  {bloodType}
                </Box>
              )}
            </Box>
            <Typography id="profile-name" component="h1" sx={{
              fontWeight: 800, fontSize: { xs: '1.6rem', sm: '2.3rem' }, lineHeight: 1.1, letterSpacing: '-0.02em', overflowWrap: 'anywhere',
            }}>
              {user?.fullName || 'Your profile'}
            </Typography>
            <Box sx={{ mt: 1.25, display: 'flex', flexDirection: 'column', gap: 0.75 }}>
              {user?.email && <InfoLine icon={<EmailIcon />}>{user.email}</InfoLine>}
              {user?.phone && <InfoLine icon={<PhoneIcon />}>{user.phone}</InfoLine>}
              {donor?.location && <InfoLine icon={<PlaceIcon />}>{donor.location}</InfoLine>}
            </Box>
          </Box>
        </Box>

        <Box sx={{
          display: 'grid', gap: 1.5, flexShrink: 0,
          gridTemplateColumns: { xs: '1fr 1fr', sm: 'repeat(3, auto)' }, justifyContent: { sm: 'start', xl: 'end' },
        }}>
          <Button variant="outlined" startIcon={<EditOutlinedIcon />} onClick={onEdit} sx={{
            ...btnBase, color: '#fff', borderColor: 'rgba(255,255,255,0.85)', borderWidth: 1.5, bgcolor: 'rgba(255,255,255,0.04)',
            '&:hover': { borderColor: '#fff', borderWidth: 1.5, bgcolor: 'rgba(255,255,255,0.12)' },
          }}>
            Edit Profile
          </Button>
          <Button component={Link} href="/qr-card" variant="contained" disableElevation startIcon={<QrCode2Icon />} sx={{
            ...btnBase, bgcolor: '#fff', color: 'primary.main', '&:hover': { bgcolor: '#FDF2F3' },
          }}>
            My QR Card
          </Button>
          <Button component={Link} href="/requests" variant="contained" disableElevation startIcon={<AddIcon />} sx={{
            ...btnBase, gridColumn: { xs: '1 / -1', sm: 'auto' },
            bgcolor: 'primary.main', color: '#fff', border: '1.5px solid #fff', '&:hover': { bgcolor: 'primary.dark' },
          }}>
            New Request
          </Button>
        </Box>
      </Box>
    </Box>
  );
}
