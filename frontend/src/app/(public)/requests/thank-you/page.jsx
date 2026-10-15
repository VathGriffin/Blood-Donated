'use client';
import Link from 'next/link';
import { Box, Container, Typography, Button, useTheme } from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import { C } from '../../appointments/_components/booking';

const NEXT_STEPS = [
  'The hospital reviews your request and verifies the medical need.',
  'Blood stock is checked and matching donors are alerted.',
  'You get a notification each time the status changes.',
];

const RequestThankYou = () => {
  const isDark = useTheme().palette.mode === 'dark';
  const border = isDark ? '#262626' : C.border;

  return (
    <Box sx={{ bgcolor: isDark ? '#0f0f0f' : C.bg, minHeight: '80vh', display: 'flex', alignItems: 'center', py: { xs: 6, md: 10 } }}>
      <Container maxWidth="sm">
        <Box sx={{
          bgcolor: 'background.paper', borderRadius: '20px', overflow: 'hidden', border: `1px solid ${border}`,
          boxShadow: isDark ? 'none' : '0 1px 2px rgba(15,23,42,0.04), 0 12px 32px rgba(15,23,42,0.06)',
        }}>
          <Box sx={{ textAlign: 'center', px: 3, py: { xs: 4, sm: 5 }, color: '#fff', background: `linear-gradient(135deg, ${C.primary} 0%, ${C.dark} 100%)` }}>
            <Box sx={{
              width: 76, height: 76, mx: 'auto', mb: 2, borderRadius: '50%', bgcolor: 'rgba(255,255,255,0.16)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              animation: 'popIn 0.45s cubic-bezier(0.34, 1.56, 0.64, 1) both',
              '@keyframes popIn': { from: { transform: 'scale(0)', opacity: 0 }, to: { transform: 'scale(1)', opacity: 1 } },
              '@media (prefers-reduced-motion: reduce)': { animation: 'none' },
            }}>
              <CheckCircleIcon sx={{ fontSize: 46 }} aria-hidden="true" />
            </Box>
            <Typography component="h1" sx={{ fontWeight: 800, fontSize: { xs: '1.6rem', sm: '1.9rem' }, letterSpacing: '-0.02em' }}>
              Request Submitted
            </Typography>
            <Typography sx={{ mt: 1, opacity: 0.9, maxWidth: 380, mx: 'auto', lineHeight: 1.6 }}>
              Thank you. Your blood request is on its way to the hospital team.
            </Typography>
          </Box>

          <Box sx={{ p: { xs: 2.5, sm: 3.5 } }}>
            <Typography component="h2" sx={{ fontWeight: 800, fontSize: '1rem', mb: 1.5 }}>What happens next</Typography>
            <Box component="ol" sx={{ listStyle: 'none', m: 0, p: 0, display: 'flex', flexDirection: 'column', gap: 1.25 }}>
              {NEXT_STEPS.map((text, i) => (
                <Box component="li" key={text} sx={{ display: 'flex', gap: 1.5, alignItems: 'flex-start' }}>
                  <Box sx={{
                    width: 26, height: 26, borderRadius: '50%', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontWeight: 700, fontSize: '0.8rem', color: C.primary, bgcolor: isDark ? 'rgba(185,28,44,0.16)' : C.soft,
                  }}>{i + 1}</Box>
                  <Typography sx={{ fontSize: '0.92rem', lineHeight: 1.5, pt: '2px' }}>{text}</Typography>
                </Box>
              ))}
            </Box>

            <Box sx={{ mt: 3.5, display: 'flex', gap: 1.5, flexDirection: { xs: 'column', sm: 'row' } }}>
              <Button component={Link} href="/my-requests" variant="contained" endIcon={<ArrowForwardIcon />} fullWidth
                sx={{
                  py: 1.25, fontWeight: 700, borderRadius: '12px', textTransform: 'none', bgcolor: C.primary,
                  boxShadow: `0 8px 20px ${C.ring}`, '&:hover': { bgcolor: C.dark },
                }}>
                Track My Requests
              </Button>
              <Button component={Link} href="/" variant="outlined" fullWidth
                sx={{
                  py: 1.25, fontWeight: 700, borderRadius: '12px', textTransform: 'none', color: C.primary, borderColor: border,
                  '&:hover': { borderColor: C.primary, bgcolor: isDark ? 'rgba(185,28,44,0.1)' : C.softer },
                }}>
                Back to Home
              </Button>
            </Box>
          </Box>
        </Box>
      </Container>
    </Box>
  );
};

export default RequestThankYou;
