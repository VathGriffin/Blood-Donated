'use client';
import { Box } from '@mui/material';

/**
 * Fades each page in as it mounts. Used from route `template.jsx` files, which
 * remount on every navigation, so the layout (header, sidebar) stays put and only
 * the page content animates.
 *
 * The fill mode is `backwards` on purpose: once the animation ends no transform is
 * left on the wrapper, so `position: fixed` / `sticky` children behave normally.
 */
export default function PageTransition({ children }) {
  return (
    <Box sx={(t) => ({ animation: `bl-page-enter ${t.custom.motion.page} backwards` })}>
      {children}
    </Box>
  );
}
