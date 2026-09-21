'use client';
import { Box, Typography, useTheme } from '@mui/material';
import { ResponsiveContainer, BarChart, Bar, Cell, XAxis, YAxis, CartesianGrid, Tooltip as ChartTooltip, PieChart, Pie } from 'recharts';
import { STOCK } from '@/lib/inventory';

// Both charts live in this file so the heavy `recharts` library is pulled in by one
// dynamic import (see the admin dashboard) instead of shipping with the page's first load.

/** Units per blood type, each bar coloured by stock level. `stock` = completeByType(...). */
export function StockBarChart({ stock }) {
  const theme = useTheme();
  const tick = { fill: theme.palette.text.secondary, fontSize: 12 };
  return (
    <Box sx={{ height: 300 }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={stock} margin={{ top: 8, right: 8, left: -12, bottom: 0 }}>
          <CartesianGrid vertical={false} strokeDasharray="3 3" stroke={theme.palette.divider} />
          <XAxis dataKey="bloodType" tick={tick} axisLine={false} tickLine={false} />
          <YAxis tick={tick} axisLine={false} tickLine={false} allowDecimals={false} />
          <ChartTooltip
            cursor={{ fill: theme.palette.action.hover }}
            formatter={(v, _n, item) => [`${v} units · ${STOCK[item.payload.status].label}`, item.payload.bloodType]}
            contentStyle={{ borderRadius: 10, border: `1px solid ${theme.palette.divider}`, background: theme.palette.background.paper, color: theme.palette.text.primary }}
          />
          <Bar dataKey="units" radius={[6, 6, 0, 0]} maxBarSize={44}>
            {stock.map((i) => <Cell key={i.bloodType} fill={STOCK[i.status].color} />)}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </Box>
  );
}

/** Donut of units by stock level with the grand total in the middle. `slices` = [{ key, value, color }]. */
export function StockDonut({ slices, totalUnits }) {
  return (
    <Box sx={{ position: 'relative', width: 200, height: 200, flexShrink: 0, mt: 1 }}>
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie data={slices} dataKey="value" innerRadius={62} outerRadius={90} paddingAngle={2} stroke="none" isAnimationActive={false}>
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
}
