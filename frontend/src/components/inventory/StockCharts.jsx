'use client';
import { memo } from 'react';
import { Box, Typography, useTheme } from '@mui/material';
import { ResponsiveContainer, BarChart, Bar, Cell, LabelList, XAxis, YAxis, CartesianGrid, Tooltip as ChartTooltip, PieChart, Pie, Rectangle } from 'recharts';
import { STOCK } from '@/lib/inventory';

// Both charts live in this file so the heavy `recharts` library is pulled in by one
// dynamic import (see the admin dashboard) instead of shipping with the page's first load.

// Hover card: blood type, exact units, the type's minimum and its stock level.
function StockTooltip({ active, payload }) {
  const theme = useTheme();
  if (!active || !payload?.length) return null;
  const i = payload[0].payload;
  const level = STOCK[i.status];
  return (
    <Box sx={{ px: 1.5, py: 1.25, borderRadius: '12px', border: 1, borderColor: 'divider', bgcolor: 'background.paper', boxShadow: theme.custom.shadow.md, minWidth: 150 }}>
      <Typography sx={{ fontWeight: 800, fontSize: '0.95rem' }}>{i.bloodType}</Typography>
      <Typography sx={{ fontSize: '0.85rem', mt: 0.25 }}><b>{i.units}</b> unit{i.units === 1 ? '' : 's'} in stock</Typography>
      <Typography sx={{ fontSize: '0.78rem', color: 'text.secondary' }}>Minimum {i.minUnits ?? 10}</Typography>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, mt: 0.75 }}>
        <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: level.color }} />
        <Typography sx={{ fontSize: '0.78rem', fontWeight: 700, color: level.color }}>{level.label}</Typography>
      </Box>
    </Box>
  );
}

/** Units per blood type, each bar coloured by stock level. `stock` = completeByType(...). */
export const StockBarChart = memo(function StockBarChart({ stock }) {
  const theme = useTheme();
  const tick = { fill: theme.palette.text.secondary, fontSize: 12 };
  const axisTitle = { fill: theme.palette.text.secondary, fontSize: 11, fontWeight: 600 };
  const emptyStroke = theme.palette.mode === 'dark' ? '#94A3B8' : '#9CA3AF';
  // Out-of-stock types get a dashed grey stub instead of an invisible zero-height bar.
  const barShape = (props) => (props.payload.units === 0
    ? <rect x={props.x + 3} y={props.y - 10} width={Math.max(props.width - 6, 0)} height={10} rx={4}
      fill="none" stroke={emptyStroke} strokeWidth={1.5} strokeDasharray="4 3" />
    : <Rectangle {...props} />);
  return (
    <Box sx={{ height: { xs: 260, md: 300 } }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={stock} margin={{ top: 24, right: 8, left: 4, bottom: 14 }}>
          <defs>
            {Object.entries(STOCK).map(([k, v]) => (
              <linearGradient key={k} id={`stock-${k}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={v.color} stopOpacity={0.95} />
                <stop offset="100%" stopColor={v.color} stopOpacity={0.72} />
              </linearGradient>
            ))}
          </defs>
          <CartesianGrid vertical={false} strokeDasharray="3 3" stroke={theme.palette.divider} />
          <XAxis
            dataKey="bloodType"
            tick={{ ...tick, fontWeight: 600, fill: theme.palette.text.primary }}
            axisLine={{ stroke: theme.palette.divider }}
            tickLine={false}
            label={{ value: 'Blood type', position: 'insideBottom', offset: -10, style: axisTitle }}
          />
          <YAxis
            tick={tick}
            axisLine={false}
            tickLine={false}
            allowDecimals={false}
            width={44}
            label={{ value: 'Units', angle: -90, position: 'insideLeft', offset: 10, style: { ...axisTitle, textAnchor: 'middle' } }}
          />
          <ChartTooltip cursor={{ fill: theme.palette.action.hover, radius: 8 }} content={<StockTooltip />} />
          <Bar dataKey="units" radius={[8, 8, 0, 0]} maxBarSize={60} shape={barShape}>
            {stock.map((i) => <Cell key={i.bloodType} fill={`url(#stock-${i.status})`} />)}
            <LabelList
              dataKey="units"
              position="top"
              content={({ x, y, width, value, index }) => (
                <text x={x + width / 2} y={value === 0 ? y - 16 : y - 7} textAnchor="middle" fontSize={12} fontWeight={700}
                  fill={value === 0 ? emptyStroke : STOCK[stock[index].status].color}>
                  {value}
                </text>
              )}
            />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </Box>
  );
});

/** Donut of units by stock level with the grand total in the middle. `slices` = [{ key, value, color }]. */
export const StockDonut = memo(function StockDonut({ slices, totalUnits, size = 200 }) {
  const ring = size / 200;
  return (
    <Box sx={{ position: 'relative', width: size, height: size, flexShrink: 0 }}>
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie data={slices} dataKey="value" innerRadius={62 * ring} outerRadius={90 * ring} paddingAngle={2} stroke="none" isAnimationActive={false}>
            {slices.map((d) => <Cell key={d.key} fill={d.color} />)}
          </Pie>
        </PieChart>
      </ResponsiveContainer>
      <Box sx={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none' }}>
        <Typography sx={{ fontSize: '1.75rem', fontWeight: 800, lineHeight: 1.1 }}>{totalUnits.toLocaleString()}</Typography>
        <Typography variant="caption" color="text.secondary">Total Units</Typography>
      </Box>
    </Box>
  );
});
