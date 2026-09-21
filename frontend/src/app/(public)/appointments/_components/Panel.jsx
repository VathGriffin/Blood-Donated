'use client';
import { Box, Typography, useTheme } from '@mui/material';

// White rounded card with a red icon tile, title, subtitle and an optional action on the right.
export default function Panel({ icon, title, subtitle, action, children, sx }) {
  const isDark = useTheme().palette.mode === 'dark';
  return (
    <Box sx={{
      bgcolor: 'background.paper', borderRadius: '18px', p: { xs: 2, sm: 2.75 },
      border: `1px solid ${isDark ? '#262626' : '#f0e4e4'}`,
      boxShadow: isDark ? 'none' : '0 6px 28px rgba(120,20,20,0.05)',
      ...sx,
    }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2.25, flexWrap: 'wrap' }}>
        <Box sx={{ width: 44, height: 44, borderRadius: '12px', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#c62828', bgcolor: isDark ? 'rgba(198,40,40,0.16)' : '#fdeaea' }}>
          {icon}
        </Box>
        <Box sx={{ flex: 1, minWidth: 180 }}>
          <Typography sx={{ fontWeight: 800, fontSize: '1.08rem', lineHeight: 1.2 }}>{title}</Typography>
          {subtitle && <Typography sx={{ color: 'text.secondary', fontSize: '0.84rem', mt: 0.25 }}>{subtitle}</Typography>}
        </Box>
        {action}
      </Box>
      {children}
    </Box>
  );
}
