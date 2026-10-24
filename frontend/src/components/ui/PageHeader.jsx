'use client';
import { Box, Typography, alpha } from '@mui/material';

/**
 * Page title block: optional icon tile and eyebrow, title, subtitle, and a right-aligned
 * action area. Stacks vertically on phones so long titles and several buttons never collide.
 */
export default function PageHeader({ title, subtitle, eyebrow, icon, actions, sx }) {
  return (
    <Box
      sx={[
        {
          display: 'flex',
          flexDirection: { xs: 'column', sm: 'row' },
          alignItems: { xs: 'flex-start', sm: 'center' },
          justifyContent: 'space-between',
          gap: 2,
          mb: { xs: 3, md: 4 },
        },
        ...(Array.isArray(sx) ? sx : [sx]),
      ]}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, minWidth: 0 }}>
        {icon && (
          <Box sx={(t) => ({ width: 58, height: 58, borderRadius: '16px', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', '& svg': { fontSize: 30 }, background: `linear-gradient(135deg, ${t.palette.primary.light} 0%, ${t.palette.primary.main} 100%)`, boxShadow: `0 8px 18px ${alpha(t.palette.primary.main, 0.3)}` })}>
            {icon}
          </Box>
        )}
        <Box sx={{ minWidth: 0 }}>
          {eyebrow && <Typography variant="overline" color="primary">{eyebrow}</Typography>}
          <Typography variant="h4" component="h1">{title}</Typography>
          {subtitle && (
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>{subtitle}</Typography>
          )}
        </Box>
      </Box>
      {actions && (
        <Box sx={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 1, flexShrink: 0, width: { xs: '100%', sm: 'auto' } }}>{actions}</Box>
      )}
    </Box>
  );
}
