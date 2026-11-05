'use client';
import { Box } from '@mui/material';
import { brand } from '@/lib/design-tokens';

/** Solid red pill for a blood type, as in the request and low-stock tables. Always brand red,
 *  even where the theme's primary colour is different (the blue hospital dashboard). */
export default function BloodPill({ type }) {
  return (
    <Box component="span" sx={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', minWidth: 44, height: 26, px: 1, borderRadius: 999, bgcolor: brand.primary, color: '#fff', fontSize: '0.75rem', fontWeight: 800 }}>
      {type}
    </Box>
  );
}
