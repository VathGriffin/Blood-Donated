'use client';
import { memo } from 'react';
import Link from 'next/link';
import { Box, Paper, Skeleton, Typography, alpha, useTheme } from '@mui/material';
import { Sparkline, TrendChip } from './Trend';
import { useT } from '@/i18n/I18nProvider';

/**
 * KPI tile: tinted icon tile, small label, big number and an optional hint line.
 * `tone` is one of primary | success | warning | error | info | neutral; `color` (a hex
 * value) overrides it with a fixed accent. With `href` the whole card is a link;
 * `loading` swaps the value for a skeleton.
 *
 * Pass `trend` to add a footer and sparkline: one metric from /api/stats/trends
 * ({ current, previous, change, series }), `undefined` while loading, or `null` when
 * unavailable. `trendKey` picks the footer wording (ui.trend.<key>: new | joined | last30,
 * e.g. "3 new vs 2 prior"). Omit `trend` for no footer.
 *
 * `decorated` is the richer KPI style (hospital dashboard): a stronger soft gradient, a faint
 * wave in the corner, 20px corners, a larger number and a lift on hover.
 */
function StatCard({ label, value, icon, hint, tone = 'primary', color, href, loading = false, trendKey = 'new', decorated = false, sx, ...rest }) {
  const hasTrend = 'trend' in rest;
  const { trend } = rest;
  const theme = useTheme();
  const t = useT();
  const accent = color || theme.custom.tones[tone].dot;
  return (
    <Paper
      variant="outlined"
      {...(href ? { component: Link, href } : {})}
      sx={[
        (theme) => ({
          p: { xs: 2, md: 2.5 },
          display: 'flex',
          alignItems: 'flex-start',
          gap: 2,
          minWidth: 0,
          textDecoration: 'none',
          color: 'text.primary',
          borderRadius: decorated ? '20px' : `${theme.custom.radius.card}px`,
          boxShadow: theme.custom.shadow.sm,
          background: decorated
            ? `linear-gradient(135deg, ${alpha(accent, theme.palette.mode === 'dark' ? 0.18 : 0.10)} 0%, ${theme.palette.background.paper} 72%)`
            : `linear-gradient(135deg, ${alpha(accent, theme.palette.mode === 'dark' ? 0.14 : 0.07)} 0%, ${theme.palette.background.paper} 60%)`,
          transition: 'border-color .2s ease, box-shadow .2s ease, transform .2s ease',
          ...(decorated && {
            position: 'relative', overflow: 'hidden', p: { xs: 2.25, md: 3 }, borderColor: alpha(accent, 0.16),
            // Faint wave in the bottom-right corner — decoration only.
            '&::after': {
              content: '""', position: 'absolute', right: 0, bottom: 0, width: '62%', height: '70%', pointerEvents: 'none',
              opacity: theme.palette.mode === 'dark' ? 0.5 : 1,
              backgroundRepeat: 'no-repeat', backgroundPosition: 'right bottom', backgroundSize: '100% 100%',
              backgroundImage: `url("data:image/svg+xml,${encodeURIComponent(
                `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 300 120' preserveAspectRatio='none'><path d='M0 90 C 70 40, 140 120, 210 70 S 300 30, 300 30 L300 120 L0 120 Z' fill='${alpha(accent, 0.07)}'/><path d='M40 110 C 110 70, 170 125, 240 90 S 300 70, 300 70 L300 120 L40 120 Z' fill='${alpha(accent, 0.06)}'/></svg>`,
              )}")`,
            },
            '& > *': { position: 'relative', zIndex: 1 },
          }),
          ...(href && {
            '&:hover': { borderColor: accent, boxShadow: theme.custom.shadow.md, transform: decorated ? 'translateY(-3px)' : 'translateY(-1px)' },
          }),
          '@media (prefers-reduced-motion: reduce)': { transition: 'none', '&:hover': { transform: 'none' } },
        }),
        ...(Array.isArray(sx) ? sx : [sx]),
      ]}
    >
      {icon && (
        <Box
          sx={(theme) => ({
            width: decorated ? 56 : 50, height: decorated ? 56 : 50, borderRadius: decorated ? '16px' : '14px', flexShrink: 0,
            display: 'flex', alignItems: 'center', justifyContent: 'center', '& svg': { fontSize: 26 },
            ...(color ? { bgcolor: alpha(color, 0.14), color } : { bgcolor: theme.custom.tones[tone].bg, color: theme.custom.tones[tone].fg }),
          })}
        >
          {icon}
        </Box>
      )}
      <Box sx={{ minWidth: 0, flexGrow: 1 }}>
        <Typography variant="body2" color={decorated ? 'text.primary' : 'text.secondary'} noWrap={!decorated}
          sx={{ fontWeight: decorated ? 700 : 600, fontSize: decorated ? '0.98rem' : undefined }}>{label}</Typography>
        {loading ? (
          <Skeleton variant="text" width={64} height={44} />
        ) : (
          <Typography sx={{ fontSize: decorated ? { xs: '2rem', md: '2.4rem' } : '1.9rem', fontWeight: 800, lineHeight: 1.15, letterSpacing: '-0.02em', mt: 0.25 }}>{value ?? '—'}</Typography>
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
                  {t(`ui.trend.${trendKey}`, { current: trend.current, previous: trend.previous })}
                </Typography>
              </>
            ) : (
              <Typography variant="caption" color="text.disabled">{t('ui.trend.unavailable')}</Typography>
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
