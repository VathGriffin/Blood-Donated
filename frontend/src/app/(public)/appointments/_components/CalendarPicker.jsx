'use client';
import { useMemo, useState } from 'react';
import { Box, Typography, IconButton, useTheme } from '@mui/material';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import Panel from './Panel';
import { toIso, parseIso } from './booking';

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export default function CalendarPicker({ value, onChange }) {
  const isDark = useTheme().palette.mode === 'dark';
  const today = useMemo(() => { const d = new Date(); return new Date(d.getFullYear(), d.getMonth(), d.getDate()); }, []);
  const [view, setView] = useState(() => { const d = value ? parseIso(value) : today; return { year: d.getFullYear(), month: d.getMonth() }; });

  // Six full weeks starting on the Sunday on/before the 1st, so the grid never changes height.
  const cells = useMemo(() => {
    const first = new Date(view.year, view.month, 1);
    const start = new Date(view.year, view.month, 1 - first.getDay());
    return Array.from({ length: 42 }, (_, i) => new Date(start.getFullYear(), start.getMonth(), start.getDate() + i));
  }, [view]);

  const atCurrentMonth = view.year === today.getFullYear() && view.month === today.getMonth();
  const shift = (delta) => setView(({ year, month }) => { const d = new Date(year, month + delta, 1); return { year: d.getFullYear(), month: d.getMonth() }; });
  const title = new Date(view.year, view.month, 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  const arrow = { border: '1px solid', borderColor: 'divider', borderRadius: '10px', width: 34, height: 34 };

  return (
    <Panel icon={<CalendarMonthIcon />} title="Select Date" subtitle="Choose a date for your donation" sx={{ height: '100%' }}>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1.5 }}>
        <IconButton onClick={() => shift(-1)} disabled={atCurrentMonth} aria-label="Previous month" sx={arrow}><ChevronLeftIcon fontSize="small" /></IconButton>
        <Typography sx={{ fontWeight: 800 }} aria-live="polite">{title}</Typography>
        <IconButton onClick={() => shift(1)} aria-label="Next month" sx={arrow}><ChevronRightIcon fontSize="small" /></IconButton>
      </Box>

      <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', mb: 0.5 }}>
        {WEEKDAYS.map((d) => <Typography key={d} sx={{ textAlign: 'center', color: 'text.secondary', fontSize: '0.75rem', fontWeight: 600, py: 0.75 }}>{d}</Typography>)}
      </Box>

      <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', rowGap: 0.5 }}>
        {cells.map((date) => {
          const iso = toIso(date.getFullYear(), date.getMonth(), date.getDate());
          const past = date < today;
          const inMonth = date.getMonth() === view.month;
          const selected = iso === value;
          const isToday = date.getTime() === today.getTime();
          return (
            <Box key={iso} component="button" type="button" disabled={past} aria-pressed={selected}
              aria-label={date.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
              onClick={() => { onChange(iso); if (!inMonth) setView({ year: date.getFullYear(), month: date.getMonth() }); }}
              sx={{
                mx: 'auto', width: 38, height: 38, borderRadius: '50%', border: 'none', font: 'inherit', fontSize: '0.88rem',
                fontWeight: selected ? 800 : 500, cursor: past ? 'default' : 'pointer', transition: 'background-color .12s',
                bgcolor: selected ? '#c62828' : 'transparent',
                color: selected ? '#fff' : past || !inMonth ? (isDark ? '#4a4a4a' : '#c9c1c1') : 'text.primary',
                outline: isToday && !selected ? '1.5px solid #c62828' : 'none', outlineOffset: -2,
                boxShadow: selected ? '0 4px 12px rgba(198,40,40,0.4)' : 'none',
                '&:hover:not(:disabled)': { bgcolor: selected ? '#b71c1c' : isDark ? 'rgba(198,40,40,0.18)' : '#fdeaea' },
                '&:focus-visible': { boxShadow: '0 0 0 3px rgba(198,40,40,0.4)' },
              }}>
              {date.getDate()}
            </Box>
          );
        })}
      </Box>
    </Panel>
  );
}
