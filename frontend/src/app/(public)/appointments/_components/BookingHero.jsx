'use client';
import { Box, Container, Typography, useTheme } from '@mui/material';
import { script } from '@/lib/fonts';
import { HeartArt } from '@/components/auth/AuthArt';


// Title on the left; a heart with a heartbeat line and the slogan on the right (wide screens).
export default function BookingHero() {
  const isDark = useTheme().palette.mode === 'dark';
  return (
    <Box sx={{
      position: 'relative', overflow: 'hidden',
      background: isDark
        ? 'linear-gradient(110deg, #2a1010 0%, #141414 60%)'
        : 'linear-gradient(110deg, #fdeaea 0%, #fff7f7 45%, #ffffff 100%)',
    }}>
      <Container maxWidth={false} sx={{ maxWidth: 1400, py: { xs: 4, md: 5.5 }, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 3 }}>
        <Box sx={{ position: 'relative', zIndex: 1 }}>
          <Typography component="h1" sx={{ fontWeight: 900, fontSize: { xs: '2rem', sm: '2.6rem', md: '3.2rem' }, letterSpacing: '-0.03em', lineHeight: 1.08 }}>
            Book Donation <Box component="span" sx={{ color: '#c62828' }}>Appointment</Box>
          </Typography>
          <Typography sx={{ color: 'text.secondary', mt: 1.5, fontSize: { xs: '0.98rem', md: '1.12rem' }, maxWidth: 640 }}>
            Choose a convenient time, location, and help save lives. Every donation counts!
          </Typography>
        </Box>

        <Box aria-hidden="true" sx={{ display: { xs: 'none', md: 'flex' }, alignItems: 'center', flexShrink: 0, mr: { md: 2, lg: 6 } }}>
          {/* heartbeat line running into the heart, and a short trace leaving it */}
          <svg width="250" height="70" viewBox="0 0 250 70" style={{ marginRight: -14 }}>
            <path d="M0 36 H96 l10 -8 l10 8 h14 l10 -30 l16 60 l10 -34 h12 H250" fill="none" stroke="#e57373" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" opacity="0.75" />
          </svg>
          <HeartArt size={150} />
          <svg width="80" height="70" viewBox="0 0 80 70" style={{ marginLeft: -14 }}>
            <path d="M0 36 H14 l8 -14 l12 42 l8 -26 h10 H80" fill="none" stroke="#e57373" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" opacity="0.75" />
          </svg>
          <Typography sx={{ fontFamily: script.style.fontFamily, color: '#c62828', fontSize: '2.1rem', lineHeight: 0.95, fontWeight: 700, ml: 1, transform: 'rotate(-6deg)' }}>
            Your<br />Blood<br />Their<br />Hope
          </Typography>
        </Box>
      </Container>
    </Box>
  );
}
