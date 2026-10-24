'use client';
import { useId } from 'react';
import { Box, alpha } from '@mui/material';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';

/** Smooth SVG sparkline with a soft fill underneath. `data` = array of numbers. */
export function Sparkline({ data = [], color, width = 84, height = 40 }) {
  const id = useId();
  if (data.length < 2) return <Box sx={{ width, height }} />;
  const max = Math.max(...data, 1);
  const pad = 3;
  const pts = data.map((v, i) => [
    (i / (data.length - 1)) * width,
    height - pad - (v / max) * (height - pad * 2),
  ]);
  // Catmull-Rom → cubic Bézier, so the line curves through every point.
  let d = `M${pts[0][0]},${pts[0][1]}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[i - 1] || pts[i];
    const [p1, p2] = [pts[i], pts[i + 1]];
    const p3 = pts[i + 2] || p2;
    const c1 = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6];
    const c2 = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6];
    d += ` C${c1[0]},${c1[1]} ${c2[0]},${c2[1]} ${p2[0]},${p2[1]}`;
  }
  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} aria-hidden="true" style={{ overflow: 'visible', flexShrink: 0 }}>
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity={0.22} />
          <stop offset="100%" stopColor={color} stopOpacity={0} />
        </linearGradient>
      </defs>
      <path d={`${d} L${width},${height} L0,${height} Z`} fill={`url(#${id})`} />
      <path d={d} fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" />
    </svg>
  );
}

/** Green ↑ / red ↓ percentage pill. Renders nothing when there is no previous period to compare. */
export function TrendChip({ change }) {
  if (change == null) return null;
  const up = change >= 0;
  const Icon = up ? ArrowUpwardIcon : ArrowDownwardIcon;
  return (
    <Box
      component="span"
      sx={(t) => {
        const c = up ? t.palette.success : t.palette.error;
        return {
          display: 'inline-flex', alignItems: 'center', gap: 0.25, px: 0.75, height: 22,
          borderRadius: 999, fontSize: '0.72rem', fontWeight: 700,
          bgcolor: alpha(c.main, 0.12), color: t.palette.mode === 'dark' ? c.light : c.dark,
        };
      }}
    >
      <Icon sx={{ fontSize: 13 }} />{Math.abs(change)}%
    </Box>
  );
}
