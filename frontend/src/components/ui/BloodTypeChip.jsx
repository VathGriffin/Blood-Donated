'use client';
import { Box, alpha } from '@mui/material';
import { WaterDrop } from '@mui/icons-material';

/**
 * Soft red pill with a drop icon for a blood type, for tables and cards. (BloodPill is the
 * solid, always-brand-red variant.) `size`: medium | large.
 */
export default function BloodTypeChip({ type, size = 'medium' }) {
  const large = size === 'large';
  return (
    <Box
      component="span"
      aria-label={`Blood type ${type || 'unknown'}`}
      sx={(t) => ({
        display: 'inline-flex', alignItems: 'center', gap: 0.4, px: large ? 1.5 : 1.1,
        height: large ? 34 : 26, borderRadius: 999, whiteSpace: 'nowrap',
        bgcolor: alpha(t.palette.primary.main, t.palette.mode === 'dark' ? 0.16 : 0.07),
        border: 1, borderColor: alpha(t.palette.primary.main, 0.22),
        color: 'primary.main', fontWeight: 800, fontSize: large ? '1rem' : '0.8rem',
      })}
    >
      <WaterDrop aria-hidden="true" sx={{ fontSize: large ? 17 : 14 }} />{type || '—'}
    </Box>
  );
}
