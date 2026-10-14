'use client';
import { Box, Typography } from '@mui/material';

/** Shared card header for SectionCard and TableCard: optional red icon, title, subtitle, right-hand action. */
export default function CardHeader({ icon, title, subtitle, action, pb = 1.5 }) {
  return (
    <Box sx={{ display: 'flex', alignItems: icon ? 'flex-start' : 'center', justifyContent: 'space-between', gap: 2, flexWrap: 'wrap', px: { xs: 2, md: 3 }, pt: 2.5, pb }}>
      <Box sx={{ display: 'flex', gap: 1.25, minWidth: 0 }}>
        {icon && <Box sx={{ color: 'primary.main', display: 'flex', mt: '1px', '& svg': { fontSize: 24 } }}>{icon}</Box>}
        <Box sx={{ minWidth: 0 }}>
          {title && <Typography variant="h6" component="h2" sx={{ fontWeight: 700, lineHeight: 1.3 }}>{title}</Typography>}
          {subtitle && <Typography variant="caption" color="text.secondary">{subtitle}</Typography>}
        </Box>
      </Box>
      {action && <Box sx={{ flexShrink: 0, display: 'flex', gap: 1, flexWrap: 'wrap' }}>{action}</Box>}
    </Box>
  );
}
