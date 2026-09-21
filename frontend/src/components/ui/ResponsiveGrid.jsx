'use client';
import { Box } from '@mui/material';

/**
 * Auto-wrapping CSS grid for cards: as many columns as fit at `min` px each, sharing
 * the row evenly, collapsing to one column on phones. Use it for StatCards and
 * card lists instead of MUI's <Grid> (whose v7 API dropped the `item`/`xs` props).
 */
export default function ResponsiveGrid({ min = 220, gap = { xs: 2, md: 3 }, children, sx }) {
  return (
    <Box
      sx={[
        { display: 'grid', gridTemplateColumns: `repeat(auto-fit, minmax(min(${min}px, 100%), 1fr))`, gap },
        ...(Array.isArray(sx) ? sx : [sx]),
      ]}
    >
      {children}
    </Box>
  );
}
