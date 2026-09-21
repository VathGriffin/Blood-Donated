'use client';
import { Box, Typography } from '@mui/material';

/**
 * Page title block: optional eyebrow, title, subtitle, and a right-aligned action
 * area. Stacks vertically on phones so long titles and several buttons never collide.
 */
export default function PageHeader({ title, subtitle, eyebrow, actions, sx }) {
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
      <Box sx={{ minWidth: 0 }}>
        {eyebrow && <Typography variant="overline" color="primary">{eyebrow}</Typography>}
        <Typography variant="h4" component="h1">{title}</Typography>
        {subtitle && (
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>{subtitle}</Typography>
        )}
      </Box>
      {actions && (
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, flexShrink: 0 }}>{actions}</Box>
      )}
    </Box>
  );
}
