'use client';
import Link from 'next/link';
import { Box, Paper, Skeleton, Typography } from '@mui/material';

/**
 * KPI tile: small label, big number, optional hint line, and a tinted icon on the right.
 * `tone` is one of primary | success | warning | error | info | neutral.
 * With `href` the whole card is a link; `loading` swaps the value for a skeleton.
 */
export default function StatCard({ label, value, icon, hint, tone = 'primary', href, loading = false, sx }) {
  const interactive = Boolean(href);
  return (
    <Paper
      variant="outlined"
      {...(interactive ? { component: Link, href } : {})}
      sx={[
        (t) => ({
          p: { xs: 2, md: 2.5 },
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          gap: 2,
          minWidth: 0,
          textDecoration: 'none',
          color: 'text.primary',
          borderRadius: `${t.custom.radius.card}px`,
          boxShadow: t.custom.shadow.sm,
          transition: 'border-color .15s ease, box-shadow .15s ease, transform .15s ease',
          ...(interactive && {
            '&:hover': { borderColor: t.custom.tones[tone].dot, boxShadow: t.custom.shadow.md, transform: 'translateY(-1px)' },
          }),
        }),
        ...(Array.isArray(sx) ? sx : [sx]),
      ]}
    >
      <Box sx={{ minWidth: 0 }}>
        <Typography variant="body2" color="text.secondary" noWrap sx={{ fontWeight: 500 }}>{label}</Typography>
        {loading ? (
          <Skeleton variant="text" width={72} height={40} />
        ) : (
          <Typography sx={{ fontSize: '1.75rem', fontWeight: 800, lineHeight: 1.2, letterSpacing: '-0.02em', mt: 0.25 }}>
            {value}
          </Typography>
        )}
        {hint && <Typography variant="caption" color="text.secondary" component="div" sx={{ mt: 0.5 }}>{hint}</Typography>}
      </Box>
      {icon && (
        <Box
          sx={(t) => ({
            width: 46, height: 46, borderRadius: '12px', flexShrink: 0,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            bgcolor: t.custom.tones[tone].bg, color: t.custom.tones[tone].fg,
          })}
        >
          {icon}
        </Box>
      )}
    </Paper>
  );
}
