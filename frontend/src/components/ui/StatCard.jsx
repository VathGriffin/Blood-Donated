'use client';
import { memo } from 'react';
import Link from 'next/link';
import { Box, Paper, Skeleton, Typography, alpha, useTheme } from '@mui/material';
import { Sparkline, TrendChip } from './Trend';

/**
 * KPI tile: tinted icon tile, small label, big number and an optional hint line.
 * `tone` is one of primary | success | warning | error | info | neutral; `color` (a hex
 * value) overrides it with a fixed accent. With `href` the whole card is a link;
 * `loading` swaps the value for a skeleton.
 *
 * Pass `trend` to add a footer and sparkline: one metric from /api/stats/trends
 * ({ current, previous, change, series }), `undefined` while loading, or `null` when
 * unavailable. `noun` words the footer ("3 new vs 2 prior"). Omit `trend` for no footer.
 */
function StatCard({ label, value, icon, hint, tone = 'primary', color, href, loading = false, noun = 'new', sx, ...rest }) {
  const hasTrend = 'trend' in rest;
  const { trend } = rest;
  const theme = useTheme();
  const accent = color || theme.custom.tones[tone].dot;
  return (
    <Paper
      variant="outlined"
      {...(href ? { component: Link, href } : {})}
      sx={[
        (t) => ({
          p: { xs: 2, md: 2.5 },
          display: 'flex',
          alignItems: 'flex-start',
          gap: 2,
          minWidth: 0,
          textDecoration: 'none',
          color: 'text.primary',
          borderRadius: `${t.custom.radius.card}px`,
          boxShadow: t.custom.shadow.sm,
          background: `linear-gradient(135deg, ${alpha(accent, t.palette.mode === 'dark' ? 0.14 : 0.07)} 0%, ${t.palette.background.paper} 60%)`,
          transition: 'border-color .15s ease, box-shadow .15s ease, transform .15s ease',
          ...(href && {
            '&:hover': { borderColor: accent, boxShadow: t.custom.shadow.md, transform: 'translateY(-1px)' },
          }),
        }),
        ...(Array.isArray(sx) ? sx : [sx]),
      ]}
    >
      {icon && (
        <Box
          sx={(t) => ({
            width: 50, height: 50, borderRadius: '14px', flexShrink: 0,
            display: 'flex', alignItems: 'center', justifyContent: 'center', '& svg': { fontSize: 26 },
            ...(color ? { bgcolor: alpha(color, 0.14), color } : { bgcolor: t.custom.tones[tone].bg, color: t.custom.tones[tone].fg }),
          })}
        >
          {icon}
        </Box>
      )}
      <Box sx={{ minWidth: 0, flexGrow: 1 }}>
        <Typography variant="body2" color="text.secondary" noWrap sx={{ fontWeight: 600 }}>{label}</Typography>
        {loading ? (
          <Skeleton variant="text" width={64} height={44} />
        ) : (
          <Typography sx={{ fontSize: '1.9rem', fontWeight: 800, lineHeight: 1.15, letterSpacing: '-0.02em', mt: 0.25 }}>{value ?? '—'}</Typography>
        )}
        {hint && <Typography variant="caption" color="text.secondary" component="div" noWrap>{hint}</Typography>}
        {/* The trend counts additions in the selected range vs the equally long period before it. */}
        {hasTrend && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, mt: 1, minHeight: 22, flexWrap: 'wrap' }}>
            {loading || trend === undefined ? (
              <Skeleton variant="text" width={110} />
            ) : trend ? (
              <>
                <TrendChip change={trend.change} />
                <Typography variant="caption" color="text.secondary" noWrap>
                  {trend.current} {noun} vs {trend.previous} prior
                </Typography>
              </>
            ) : (
              <Typography variant="caption" color="text.disabled">Trend unavailable</Typography>
            )}
          </Box>
        )}
      </Box>
      {trend?.series?.some((v) => v > 0) && (
        <Box sx={{ alignSelf: 'center', display: { xs: 'none', sm: 'block' } }}>
          <Sparkline data={trend.series} color={accent} />
        </Box>
      )}
    </Paper>
  );
}

export default memo(StatCard);
