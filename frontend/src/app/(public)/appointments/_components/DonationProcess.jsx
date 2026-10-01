'use client';
import { Fragment } from 'react';
import { Box, Typography, useTheme } from '@mui/material';
import VolunteerActivismIcon from '@mui/icons-material/VolunteerActivism';
import AssignmentIndIcon from '@mui/icons-material/AssignmentInd';
import MonitorHeartIcon from '@mui/icons-material/MonitorHeart';
import BloodtypeIcon from '@mui/icons-material/Bloodtype';
import LocalCafeIcon from '@mui/icons-material/LocalCafe';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import { C } from './booking';

const STAGES = [
  { icon: <AssignmentIndIcon />, title: 'Registration', text: 'Check in with your ID' },
  { icon: <MonitorHeartIcon />, title: 'Health Screening', text: 'A quick health check' },
  { icon: <BloodtypeIcon />, title: 'Donation', text: 'Collected by trained staff' },
  { icon: <LocalCafeIcon />, title: 'Rest & Refreshment', text: 'A drink and a snack' },
];

// Compact strip: title on the left, the four stages in a row with arrows (wraps on smaller screens).
export default function DonationProcess() {
  const isDark = useTheme().palette.mode === 'dark';
  const circle = (size) => ({
    width: size, height: size, borderRadius: '50%', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
    color: C.primary, bgcolor: isDark ? 'rgba(185,28,44,0.2)' : '#FFFFFF', '& svg': { fontSize: size * 0.5 },
  });
  return (
    <Box component="section" aria-labelledby="donation-process-title" sx={{
      height: '100%', borderRadius: '16px', px: { xs: 2, sm: 2.5 }, py: 2,
      bgcolor: isDark ? 'rgba(185,28,44,0.08)' : '#FDF0F2', border: `1px solid ${isDark ? 'rgba(185,28,44,0.2)' : '#F6D5DA'}`,
      display: 'flex', alignItems: 'center', flexWrap: { xs: 'wrap', xl: 'nowrap' }, gap: { xs: 2, md: 2.5 },
    }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flexShrink: 0, width: { xs: '100%', xl: 'auto' } }}>
        <Box aria-hidden="true" sx={circle(52)}><VolunteerActivismIcon /></Box>
        <Box>
          <Typography component="h2" id="donation-process-title" sx={{ fontWeight: 800, fontSize: '1.02rem', color: C.primary }}>The Donation Process</Typography>
          <Typography sx={{ color: 'text.secondary', fontSize: '0.82rem' }}>A safe and simple process</Typography>
        </Box>
      </Box>

      <Box component="ol" sx={{
        listStyle: 'none', m: 0, p: 0, flex: 1, minWidth: 0,
        display: 'grid', gridTemplateColumns: { xs: '1fr 1fr', md: 'repeat(4, auto)' }, alignItems: 'center',
        justifyContent: { md: 'space-between' }, gap: { xs: 1.5, md: 1 },
      }}>
        {STAGES.map((s, i) => (
          <Fragment key={s.title}>
            <Box component="li" sx={{ display: 'flex', alignItems: 'center', gap: 1.1, minWidth: 0 }}>
              <Box aria-hidden="true" sx={{ ...circle(42), bgcolor: C.primary, color: '#fff', boxShadow: '0 4px 12px rgba(185,28,44,0.25)' }}>{s.icon}</Box>
              <Box sx={{ minWidth: 0 }}>
                <Typography component="h3" sx={{ fontWeight: 700, fontSize: '0.86rem', lineHeight: 1.25 }}>
                  <Box component="span" sx={srOnly}>Step {i + 1}: </Box>{s.title}
                </Typography>
                <Typography sx={{ color: 'text.secondary', fontSize: '0.76rem' }}>{s.text}</Typography>
              </Box>
              {i < STAGES.length - 1 && (
                <ArrowForwardIcon aria-hidden="true" sx={{ display: { xs: 'none', md: 'block' }, ml: 'auto', pl: 1, fontSize: 26, color: '#F19AA5', flexShrink: 0 }} />
              )}
            </Box>
          </Fragment>
        ))}
      </Box>
    </Box>
  );
}

const srOnly = { position: 'absolute', width: '1px', height: '1px', overflow: 'hidden', clip: 'rect(0 0 0 0)', whiteSpace: 'nowrap' };
