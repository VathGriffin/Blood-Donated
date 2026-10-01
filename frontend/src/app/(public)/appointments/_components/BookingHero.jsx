'use client';
import { Box, Container, Typography, useTheme } from '@mui/material';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import VerifiedUserIcon from '@mui/icons-material/VerifiedUser';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import FavoriteIcon from '@mui/icons-material/Favorite';
import { HeartArt } from '@/components/auth/AuthArt';
import { C } from './booking';

const POINTS = [
  { icon: <VerifiedUserIcon />, title: 'Safe & Secure', text: 'Your data is protected' },
  { icon: <AccessTimeIcon />, title: 'Quick & Easy', text: 'Book in minutes' },
  { icon: <FavoriteIcon />, title: 'Make an Impact', text: 'Help patients in need' },
];

// Icon badge + title + supportive line, three reassurance points underneath,
// and a heart illustration with a "Give Blood" speech bubble on wide screens.
export default function BookingHero() {
  const isDark = useTheme().palette.mode === 'dark';
  const tile = isDark ? 'rgba(185,28,44,0.18)' : '#FBE3E6';
  return (
    <Box sx={{
      position: 'relative', overflow: 'hidden',
      background: isDark
        ? 'linear-gradient(100deg, #1a1212 0%, #221416 60%, #2a1518 100%)'
        : 'linear-gradient(100deg, #FFF5F6 0%, #FDEBEE 55%, #FADADF 100%)',
    }}>
      {/* soft wave along the bottom edge */}
      <Box aria-hidden="true" component="svg" viewBox="0 0 1440 60" preserveAspectRatio="none"
        sx={{ position: 'absolute', left: 0, right: 0, bottom: -1, width: '100%', height: 36, display: 'block' }}>
        <path d="M0 40 C 360 0, 720 70, 1080 30 S 1440 20, 1440 20 V60 H0Z" fill={isDark ? '#0f0f0f' : C.bg} />
      </Box>

      <Container maxWidth={false} sx={{ maxWidth: 1440, position: 'relative', pt: { xs: 3.5, md: 4 }, pb: { xs: 5, md: 5.5 }, display: 'flex', alignItems: 'center', gap: 3 }}>
        <Box sx={{ display: 'flex', gap: { xs: 2, md: 3 }, alignItems: 'flex-start', flex: 1, minWidth: 0 }}>
          <Box aria-hidden="true" sx={{
            display: { xs: 'none', sm: 'flex' }, width: { sm: 68, md: 80 }, height: { sm: 68, md: 80 }, borderRadius: '50%', flexShrink: 0,
            alignItems: 'center', justifyContent: 'center', bgcolor: tile, color: C.primary, '& svg': { fontSize: { sm: 32, md: 38 } },
          }}>
            <CalendarMonthIcon />
          </Box>
          <Box sx={{ minWidth: 0 }}>
            <Typography component="h1" sx={{ fontWeight: 800, fontSize: { xs: '1.75rem', sm: '2.2rem', md: '2.5rem' }, letterSpacing: '-0.03em', lineHeight: 1.12 }}>
              Book Your <Box component="span" sx={{ color: C.primary }}>Donation</Box> Appointment
            </Typography>
            <Typography sx={{ color: 'text.secondary', mt: 0.75, fontSize: { xs: '0.98rem', md: '1.08rem' } }}>
              Your small act of kindness can save up to 3 lives.
            </Typography>

            <Box component="ul" sx={{ listStyle: 'none', p: 0, m: 0, mt: 2.5, display: 'flex', flexWrap: 'wrap', gap: { xs: 1.5, sm: 2, md: 0 } }}>
              {POINTS.map(({ icon, title, text }, i) => (
                <Box component="li" key={title} sx={{
                  display: 'flex', alignItems: 'center', gap: 1.25, pr: { md: 4 }, mr: { md: 4 },
                  borderRight: { md: i < POINTS.length - 1 ? `1px solid ${isDark ? 'rgba(255,255,255,0.08)' : 'rgba(185,28,44,0.14)'}` : 'none' },
                }}>
                  <Box aria-hidden="true" sx={{ width: 42, height: 42, borderRadius: '50%', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: tile, color: C.primary, '& svg': { fontSize: 22 } }}>
                    {icon}
                  </Box>
                  <Box>
                    <Typography sx={{ fontWeight: 700, fontSize: '0.9rem', lineHeight: 1.25 }}>{title}</Typography>
                    <Typography sx={{ color: 'text.secondary', fontSize: '0.8rem' }}>{text}</Typography>
                  </Box>
                </Box>
              ))}
            </Box>
          </Box>
        </Box>

        {/* Illustration (decorative) */}
        <Box aria-hidden="true" sx={{ display: { xs: 'none', lg: 'flex' }, position: 'relative', alignItems: 'center', flexShrink: 0, width: 420, height: 170 }}>
          <svg width="420" height="170" viewBox="0 0 420 170" style={{ position: 'absolute', inset: 0 }}>
            <path d="M10 120 C 90 150, 150 60, 230 100 S 360 150, 410 70" fill="none" stroke={C.primary} strokeWidth="1.75" strokeLinecap="round" opacity="0.35" />
            <path d="M250 96 h18 l8 -16 l12 34 l8 -22 h24" fill="none" stroke={C.primary} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" opacity="0.5" />
          </svg>
          <Box sx={{
            position: 'absolute', left: 36, top: 6, px: 2, py: 1.25, borderRadius: '16px', bgcolor: 'background.paper',
            boxShadow: '0 10px 30px rgba(185,28,44,0.14)', color: C.primary, fontWeight: 700, fontSize: '0.88rem', lineHeight: 1.35,
            '&::after': { content: '""', position: 'absolute', left: 30, bottom: -8, width: 16, height: 16, bgcolor: 'background.paper', transform: 'rotate(45deg)', borderRadius: '3px' },
          }}>
            Give Blood<br />Give Hope<br />Save Lives
            <FavoriteIcon sx={{ position: 'absolute', right: -8, top: -8, fontSize: 24, color: C.primary }} />
          </Box>
          <Box sx={{ position: 'absolute', right: 10, top: -4 }}><HeartArt size={176} /></Box>
        </Box>
      </Container>
    </Box>
  );
}
