'use client';
import { Box, Typography, useTheme } from '@mui/material';
import CheckIcon from '@mui/icons-material/Check';
import { C } from './booking';

export const STEPS = [
  { label: 'Select', rest: 'Donation Center' },
  { label: 'Choose', rest: 'Date & Time' },
  { label: 'Your', rest: 'Information' },
  { label: 'Review &', rest: 'Confirm' },
];
const fullLabel = (s) => `${s.label} ${s.rest}`;

// `active` is the 0-based current step. A vertical rail on desktop (inside the booking card),
// a compact horizontal bar on tablets and phones.
export default function BookingStepper({ active }) {
  const isDark = useTheme().palette.mode === 'dark';
  const track = isDark ? '#2a2a2a' : C.border;

  const dot = (i, size) => {
    const done = i < active;
    const current = i === active;
    return (
      <Box aria-hidden="true" sx={{
        width: size, height: size, borderRadius: '50%', flexShrink: 0, fontWeight: 700, fontSize: '0.9rem',
        display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all .2s ease', position: 'relative', zIndex: 1,
        bgcolor: done || current ? C.primary : 'background.paper',
        color: done || current ? '#fff' : 'text.secondary',
        border: '1.5px solid', borderColor: done || current ? C.primary : isDark ? '#3a3a3a' : '#CBD5E1',
        boxShadow: current ? `0 0 0 5px ${isDark ? 'rgba(185,28,44,0.2)' : 'rgba(185,28,44,0.12)'}` : 'none',
      }}>
        {done ? <CheckIcon sx={{ fontSize: 18 }} /> : i + 1}
      </Box>
    );
  };
  const status = (i) => (i < active ? ' (completed)' : i === active ? ' (current step)' : '');

  return (
    <Box component="nav" aria-label="Booking progress">
      {/* Desktop: vertical rail */}
      <Box component="ol" sx={{ display: { xs: 'none', md: 'flex' }, flexDirection: 'column', listStyle: 'none', m: 0, p: 0, pt: 1 }}>
        {STEPS.map((step, i) => {
          const current = i === active;
          const lit = i <= active;
          return (
            <Box component="li" key={step.label} aria-current={current ? 'step' : undefined}
              sx={{ position: 'relative', display: 'flex', gap: 1.5, pb: i < STEPS.length - 1 ? 6 : 0 }}>
              {i < STEPS.length - 1 && (
                <Box aria-hidden="true" sx={{ position: 'absolute', left: 17, top: 38, bottom: 4, width: 2, borderRadius: 1, bgcolor: i < active ? C.primary : track }} />
              )}
              {dot(i, 36)}
              <Typography sx={{ pt: 0.4, fontSize: '0.9rem', lineHeight: 1.35, fontWeight: current ? 700 : 500, color: current ? C.primary : lit ? 'text.primary' : 'text.secondary' }}>
                {step.label}<br />{step.rest}
                <Box component="span" sx={visuallyHidden}>{status(i)}</Box>
              </Typography>
            </Box>
          );
        })}
      </Box>

      {/* Tablet / phone: horizontal bar */}
      <Box sx={{ display: { xs: 'block', md: 'none' } }}>
        <Typography aria-hidden="true" sx={{ fontSize: '0.8rem', color: 'text.secondary', mb: 1.25 }}>
          Step {active + 1} of {STEPS.length} · <Box component="span" sx={{ color: C.primary, fontWeight: 700 }}>{fullLabel(STEPS[active])}</Box>
        </Typography>
        <Box component="ol" sx={{ listStyle: 'none', m: 0, p: 0, display: 'grid', gridTemplateColumns: `repeat(${STEPS.length}, 1fr)`, gap: 0.75 }}>
          {STEPS.map((step, i) => (
            <Box component="li" key={step.label} aria-current={i === active ? 'step' : undefined} sx={{ display: 'flex', alignItems: 'center', gap: 0.75, minWidth: 0 }}>
              {dot(i, 28)}
              {i < STEPS.length - 1 && <Box aria-hidden="true" sx={{ flex: 1, height: 2, borderRadius: 1, bgcolor: i < active ? C.primary : track }} />}
              <Box component="span" sx={visuallyHidden}>{fullLabel(step)}{status(i)}</Box>
            </Box>
          ))}
        </Box>
      </Box>
    </Box>
  );
}

const visuallyHidden = { position: 'absolute', width: '1px', height: '1px', p: 0, m: '-1px', overflow: 'hidden', clip: 'rect(0 0 0 0)', whiteSpace: 'nowrap', border: 0 };
