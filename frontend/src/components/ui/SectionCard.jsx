'use client';
import { Box, Paper } from '@mui/material';
import CardHeader from './CardHeader';

/**
 * The standard white card: outlined, rounded, subtle shadow. Give it a `title`
 * (and optional `icon` / `subtitle` / `action`) for a header, or use it bare.
 * Pass `padded={false}` when the content (e.g. a table) should touch the edges.
 */
export default function SectionCard({ title, subtitle, action, icon, padded = true, children, sx, ...rest }) {
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
          minWidth: 0,
        },
        ...(Array.isArray(sx) ? sx : [sx]),
      ]}
    >
      {hasHeader && <CardHeader icon={icon} title={title} subtitle={subtitle} action={action} pb={padded ? 0 : 1.5} />}
      <Box sx={padded ? { p: { xs: 2, md: 3 }, pt: hasHeader ? { xs: 1.5, md: 2 } : undefined } : undefined}>{children}</Box>
    </Paper>
  );
}
