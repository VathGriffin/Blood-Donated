'use client';
import { Box, Typography } from '@mui/material';

/**
 * Centered "nothing here yet" block for empty lists, tables and search results.
 * Drop it inside a table as `<TableRow><TableCell colSpan={n}><EmptyState … /></TableCell></TableRow>`.
 */
export default function EmptyState({ icon, title, description, action, sx }) {
  return (
    <Box
      sx={[
        { textAlign: 'center', py: { xs: 5, md: 7 }, px: 2, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1 },
        ...(Array.isArray(sx) ? sx : [sx]),
      ]}
    >
      {icon && (
        <Box
          sx={(t) => ({
            width: 56, height: 56, borderRadius: '50%', mb: 0.5,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            bgcolor: t.custom.tones.neutral.bg, color: t.custom.tones.neutral.fg,
          })}
        >
          {icon}
        </Box>
      )}
      <Typography variant="subtitle2">{title}</Typography>
      {description && (
        <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 360 }}>{description}</Typography>
      )}
      {action && <Box sx={{ mt: 1.5 }}>{action}</Box>}
    </Box>
  );
}
