'use client';
import { memo } from 'react';
import { Box, Typography, useTheme } from '@mui/material';
import { ResponsiveContainer, BarChart, Bar, Cell, LabelList, XAxis, YAxis, CartesianGrid, Tooltip as ChartTooltip, PieChart, Pie } from 'recharts';
import { STOCK } from '@/lib/inventory';

// Both charts live in this file so the heavy `recharts` library is pulled in by one
// dynamic import (see the admin dashboard) instead of shipping with the page's first load.

/** Units per blood type, each bar coloured by stock level. `stock` = completeByType(...). */
export const StockBarChart = memo(function StockBarChart({ stock }) {
  const theme = useTheme();
  const tick = { fill: theme.palette.text.secondary, fontSize: 12 };
  const axisTitle = { fill: theme.palette.text.secondary, fontSize: 11, fontWeight: 600 };
  return (
    <Box sx={{ height: 300 }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={stock} margin={{ top: 22, right: 8, left: 4, bottom: 14 }}>
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
          <ChartTooltip
            cursor={{ fill: theme.palette.action.hover }}
            formatter={(v, _n, item) => [`${v} units · ${STOCK[item.payload.status].label}`, item.payload.bloodType]}
            contentStyle={{ borderRadius: 10, border: `1px solid ${theme.palette.divider}`, background: theme.palette.background.paper, color: theme.palette.text.primary }}
          />
          <Bar dataKey="units" radius={[6, 6, 0, 0]} maxBarSize={56}>
            {stock.map((i) => <Cell key={i.bloodType} fill={STOCK[i.status].color} />)}
            <LabelList
              dataKey="units"
              position="top"
              content={({ x, y, width, value, index }) => (
                <text x={x + width / 2} y={y - 7} textAnchor="middle" fontSize={12} fontWeight={700}
                  fill={value === 0 ? theme.palette.text.disabled : STOCK[stock[index].status].color}>
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
