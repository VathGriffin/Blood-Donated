'use client';
import { Box, Paper, Typography } from '@mui/material';

/**
 * The standard white card: outlined, rounded, subtle shadow. Give it a `title`
 * (and optional `subtitle` / `action`) for a ruled header, or use it bare.
 * Pass `padded={false}` when the content (e.g. a table) should touch the edges.
 */
export default function SectionCard({ title, subtitle, action, padded = true, children, sx, ...rest }) {
  const hasHeader = title || subtitle || action;
  return (
    <Paper
      variant="outlined"
      {...rest}
      sx={[
        {
          borderRadius: (t) => `${t.custom.radius.card}px`,
          boxShadow: (t) => t.custom.shadow.sm,
          overflow: 'hidden',
        },
        ...(Array.isArray(sx) ? sx : [sx]),
      ]}
    >
      {hasHeader && (
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 2,
            flexWrap: 'wrap',
            px: { xs: 2, md: 3 },
            pt: 2.5,
            pb: padded ? 0 : 1.5,
          }}
        >
          <Box sx={{ minWidth: 0 }}>
            {title && <Typography variant="h6" component="h2">{title}</Typography>}
            {subtitle && <Typography variant="caption" color="text.secondary">{subtitle}</Typography>}
          </Box>
          {action && <Box sx={{ flexShrink: 0 }}>{action}</Box>}
        </Box>
      )}
      <Box sx={padded ? { p: { xs: 2, md: 3 }, pt: hasHeader ? { xs: 1.5, md: 2 } : undefined } : undefined}>{children}</Box>
    </Paper>
  );
}
