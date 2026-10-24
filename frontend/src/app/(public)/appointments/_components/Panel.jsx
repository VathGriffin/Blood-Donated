'use client';
import { useId } from 'react';
import { Box, Typography, useTheme } from '@mui/material';
import { C } from './booking';

// White card with a soft-red icon tile, an h2 title, subtitle and an optional action on the right.
// The section is labelled by its title so screen-reader landmarks read well.
export default function Panel({ icon, title, subtitle, action, children, sx }) {
  const isDark = useTheme().palette.mode === 'dark';
  const headingId = useId();
  return (
    <Box component="section" aria-labelledby={headingId} sx={{
      bgcolor: 'background.paper', borderRadius: '14px', p: { xs: 2, sm: 2.25 },
      border: `1px solid ${isDark ? '#262626' : C.border}`,
      boxShadow: isDark ? 'none' : '0 1px 2px rgba(15,23,42,0.04)',
      ...sx,
    }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2.5, flexWrap: 'wrap' }}>
        <Box aria-hidden="true" sx={{ width: 40, height: 40, borderRadius: '12px', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', color: C.primary, bgcolor: isDark ? 'rgba(185,28,44,0.16)' : C.soft, '& svg': { fontSize: 22 } }}>
          {icon}
        </Box>
        <Box sx={{ flex: 1, minWidth: 180 }}>
          <Typography component="h2" id={headingId} sx={{ fontWeight: 700, fontSize: '1.1rem', lineHeight: 1.25, letterSpacing: '-0.01em' }}>{title}</Typography>
          {subtitle && <Typography sx={{ color: 'text.secondary', fontSize: '0.84rem', mt: 0.25 }}>{subtitle}</Typography>}
        </Box>
        {action}
      </Box>
      {children}
    </Box>
  );
}
