'use client';
import { Box } from '@mui/material';

// "CheckedIn" -> "Checked in", "adequate" -> "Adequate"
const humanize = (s) => {
  const spaced = String(s).replace(/([a-z])([A-Z])/g, '$1 $2');
  return spaced.charAt(0).toUpperCase() + spaced.slice(1).toLowerCase();
};

/**
 * Pill badge for any domain status. The colour comes from `statusTone` in
 * lib/design-tokens.js, so "Pending" (etc.) is the same colour on every screen.
 * Override with `tone` for one-offs, or `label` to change the text.
 */
export default function StatusBadge({ status, label, tone, dot = true, size = 'medium', sx }) {
  return (
    <Box
      component="span"
      sx={[
        (t) => {
          const c = t.custom.tones[tone || t.custom.statusTone[status] || 'neutral'] || t.custom.tones.neutral;
          return {
            display: 'inline-flex',
            alignItems: 'center',
            gap: 0.75,
            px: size === 'small' ? 1 : 1.25,
            height: size === 'small' ? 22 : 26,
            borderRadius: `${t.custom.radius.pill}px`,
            bgcolor: c.bg,
            color: c.fg,
            fontSize: size === 'small' ? '0.72rem' : '0.78rem',
            fontWeight: 600,
            lineHeight: 1,
            whiteSpace: 'nowrap',
            '&::before': dot
              ? { content: '""', width: 6, height: 6, borderRadius: '50%', bgcolor: c.dot, flexShrink: 0 }
              : undefined,
          };
        },
        ...(Array.isArray(sx) ? sx : [sx]),
      ]}
    >
      {label ?? humanize(status)}
    </Box>
  );
}
