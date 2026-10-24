'use client';
import { Box, CircularProgress } from '@mui/material';

/**
 * Shown by route `loading.jsx` files while the next page loads: a thin bar along
 * the top edge right away, and a spinner only if the wait goes past ~350ms, so
 * quick navigations don't flicker.
 */
export default function RouteLoading({ minHeight = '60vh' }) {
  return (
    <Box role="status" aria-label="Loading page" sx={{ minHeight, position: 'relative' }}>
      <Box
        sx={{
          position: 'fixed', top: 0, left: 0, right: 0, height: 3, zIndex: (t) => t.zIndex.modal + 1,
          overflow: 'hidden', pointerEvents: 'none',
        }}
      >
        <Box
          sx={{
            height: '100%', width: '100%', bgcolor: 'primary.main', transformOrigin: 'left',
            animation: 'bl-route-progress 1.1s ease-in-out infinite',
          }}
        />
      </Box>
      <Box
        sx={{
          display: 'flex', justifyContent: 'center', pt: { xs: 12, md: 16 },
          animation: 'bl-fade-in .25s ease .35s backwards',
        }}
      >
        <CircularProgress size={28} thickness={4} />
      </Box>
    </Box>
  );
}
