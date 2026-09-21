'use client';
import { Box, Typography, useTheme } from '@mui/material';
import CheckIcon from '@mui/icons-material/Check';

const STEPS = [
  { label: 'Select Location', sub: 'Choose a donation center' },
  { label: 'Select Date & Time', sub: 'Pick a convenient slot' },
  { label: 'Confirm Details', sub: 'Review your information' },
  { label: 'Complete', sub: 'Appointment booked' },
];

// `active` is the 0-based current step; earlier steps show a check and a filled connector.
export default function BookingStepper({ active }) {
  const isDark = useTheme().palette.mode === 'dark';
  return (
    <Box component="ol" aria-label="Booking progress" sx={{ listStyle: 'none', m: 0, p: 0, display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: { xs: 0.5, sm: 2 } }}>
      {STEPS.map((step, i) => {
        const done = i < active;
        const current = i === active;
        return (
          <Box component="li" key={step.label} aria-current={current ? 'step' : undefined} sx={{ minWidth: 0 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25 }}>
              <Box sx={{
                width: { xs: 32, sm: 40 }, height: { xs: 32, sm: 40 }, borderRadius: '50%', flexShrink: 0, fontWeight: 800, fontSize: '0.95rem',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                bgcolor: done || current ? '#c62828' : 'background.paper', color: done || current ? '#fff' : 'text.secondary',
                border: '2px solid', borderColor: done || current ? '#c62828' : isDark ? '#3a3a3a' : '#e0d6d6',
                boxShadow: current ? '0 6px 16px rgba(198,40,40,0.35)' : 'none',
              }}>
                {done ? <CheckIcon sx={{ fontSize: 20 }} /> : i + 1}
              </Box>
              <Box sx={{ flex: 1, height: 3, borderRadius: 2, bgcolor: isDark ? '#2a2a2a' : '#e8dede', overflow: 'hidden' }}>
                <Box sx={{ height: '100%', width: done ? '100%' : current ? '30%' : 0, bgcolor: '#c62828', transition: 'width .3s ease' }} />
              </Box>
            </Box>
            <Typography sx={{ fontWeight: 700, fontSize: { xs: '0.72rem', sm: '0.95rem' }, mt: 1, lineHeight: 1.25, color: current ? 'text.primary' : 'text.secondary' }}>
              {step.label}
            </Typography>
            <Typography sx={{ display: { xs: 'none', sm: 'block' }, color: 'text.secondary', fontSize: '0.78rem', mt: 0.25 }}>{step.sub}</Typography>
          </Box>
        );
      })}
    </Box>
  );
}
