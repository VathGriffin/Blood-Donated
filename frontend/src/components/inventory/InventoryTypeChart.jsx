'use client';
import { useTheme } from '@mui/material';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip as ChartTooltip, CartesianGrid, Cell } from 'recharts';

// Units per blood type, one colour per type. Its own file so the admin Inventory page can load
// `recharts` on demand (next/dynamic) instead of shipping it with the page's first load.
export default function InventoryTypeChart({ data, colors }) {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const border = isDark ? '#334155' : '#E2E8F0';
  return (
    <ResponsiveContainer width="100%" height={200}>
      <BarChart data={data} barSize={28}>
        <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#334155' : '#E2E8F0'} vertical={false} />
        <XAxis dataKey="type" tick={{ fontSize: 11, fontWeight: 700 }} axisLine={false} tickLine={false} />
        <YAxis tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
        <ChartTooltip contentStyle={{ borderRadius: 10, fontSize: 12, border: `1px solid ${border}`, backgroundColor: isDark ? '#17263D' : '#ffffff' }}
          cursor={{ fill: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)' }} />
        <Bar dataKey="units" radius={[5, 5, 0, 0]}>
          {data.map((entry, i) => (
            <Cell key={i} fill={colors[entry.type] || '#C91D32'} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
