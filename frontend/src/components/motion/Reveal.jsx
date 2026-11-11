'use client';
import { useEffect, useRef, useState } from 'react';
import { Box } from '@mui/material';

/**
 * Fades and slides its content up the first time it scrolls into view. Use it for content
 * below the fold only: until it is revealed the content is transparent.
 *
 * `delay` (ms) staggers items in a row. Browsers without IntersectionObserver (and tests)
 * show the content straight away. The global reduced-motion rule in theme.js shortens the
 * transition to nothing.
 */
export default function Reveal({ children, delay = 0, y = 18, sx, ...rest }) {
  const ref = useRef(null);
  const [shown, setShown] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el || typeof IntersectionObserver === 'undefined') { setShown(true); return; }
    const obs = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) { setShown(true); obs.disconnect(); }
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.12 });
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  return (
    <Box
      ref={ref}
      sx={[
        (t) => ({
          opacity: shown ? 1 : 0,
          transform: shown ? 'none' : `translateY(${y}px)`,
          transition: `opacity ${t.custom.motion.reveal}, transform ${t.custom.motion.reveal}`,
          transitionDelay: shown ? `${delay}ms` : '0ms',
        }),
        ...(Array.isArray(sx) ? sx : [sx]),
      ]}
      {...rest}
    >
      {children}
    </Box>
  );
}
