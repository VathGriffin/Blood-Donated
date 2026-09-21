'use client';
import { Box, Paper, TableContainer, Typography } from '@mui/material';

/**
 * Card wrapper for a MUI <Table>. Adds an optional header (`title`/`actions`), an
 * optional `toolbar` row for search and filters, and horizontal scrolling: below
 * `minWidth` the table scrolls inside the card instead of squashing its columns.
 * Cell, head and row styling comes from the theme, so a plain <Table> just works.
 */
export default function TableCard({ title, subtitle, actions, toolbar, minWidth = 640, children, sx }) {
  return (
    <Paper
      variant="outlined"
      sx={[
        {
          borderRadius: (t) => `${t.custom.radius.card}px`,
          boxShadow: (t) => t.custom.shadow.sm,
          overflow: 'hidden',
        },
        ...(Array.isArray(sx) ? sx : [sx]),
      ]}
    >
      {(title || actions) && (
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 2,
            flexWrap: 'wrap',
            px: { xs: 2, md: 3 },
            pt: 2.5,
            pb: 1.5,
          }}
        >
          <Box sx={{ minWidth: 0 }}>
            {title && <Typography variant="h6" component="h2">{title}</Typography>}
            {subtitle && <Typography variant="caption" color="text.secondary">{subtitle}</Typography>}
          </Box>
          {actions && <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>{actions}</Box>}
        </Box>
      )}
      {toolbar && (
        <Box sx={{ px: { xs: 2, md: 3 }, py: 1.5, borderBottom: 1, borderColor: 'divider' }}>{toolbar}</Box>
      )}
      <TableContainer sx={{ '& .MuiTable-root': { minWidth } }}>{children}</TableContainer>
    </Paper>
  );
}
