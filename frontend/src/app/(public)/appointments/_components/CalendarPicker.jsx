'use client';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Box, Typography, IconButton, useTheme } from '@mui/material';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import Panel from './Panel';
import { C, toIso, parseIso } from './booking';

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const addDays = (d, n) => new Date(d.getFullYear(), d.getMonth(), d.getDate() + n);
const isoOf = (d) => toIso(d.getFullYear(), d.getMonth(), d.getDate());

// Month grid. Past days can't be booked; every other day is open. Arrow keys move by day / week,
// PageUp/PageDown by month, Enter or Space picks — focus follows into the next month when needed.
export default function CalendarPicker({ value, onChange }) {
  const isDark = useTheme().palette.mode === 'dark';
  const today = useMemo(() => { const d = new Date(); return new Date(d.getFullYear(), d.getMonth(), d.getDate()); }, []);
  const [view, setView] = useState(() => { const d = value ? parseIso(value) : today; return { year: d.getFullYear(), month: d.getMonth() }; });
  const [focusDate, setFocusDate] = useState(() => (value ? parseIso(value) : today));
  const gridRef = useRef(null);
  const moveFocus = useRef(false);

  // Six full weeks starting on the Sunday on/before the 1st, so the grid never changes height.
  const cells = useMemo(() => {
    const first = new Date(view.year, view.month, 1);
    const start = new Date(view.year, view.month, 1 - first.getDay());
    return Array.from({ length: 42 }, (_, i) => addDays(start, i));
  }, [view]);

  // After a keyboard move, put DOM focus on the newly focused day (it may be in a re-rendered month).
  useEffect(() => {
    if (!moveFocus.current) return;
    moveFocus.current = false;
    gridRef.current?.querySelector(`[data-iso="${isoOf(focusDate)}"]`)?.focus();
  }, [focusDate, view]);

  const atCurrentMonth = view.year === today.getFullYear() && view.month === today.getMonth();
  const shift = (delta) => setView(({ year, month }) => { const d = new Date(year, month + delta, 1); return { year: d.getFullYear(), month: d.getMonth() }; });
  const title = new Date(view.year, view.month, 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  // The one tabbable day in the grid: the focused day if it's visible and open, else the first open day.
  const focusIso = isoOf(focusDate);
  const visibleOpen = cells.filter((d) => d >= today && d.getMonth() === view.month);
  const tabIso = visibleOpen.some((d) => isoOf(d) === focusIso) ? focusIso : visibleOpen[0] && isoOf(visibleOpen[0]);

  const onKeyDown = (e, date) => {
    const steps = { ArrowLeft: -1, ArrowRight: 1, ArrowUp: -7, ArrowDown: 7 };
    let next;
    if (e.key in steps) next = addDays(date, steps[e.key]);
    else if (e.key === 'PageUp') next = new Date(date.getFullYear(), date.getMonth() - 1, date.getDate());
    else if (e.key === 'PageDown') next = new Date(date.getFullYear(), date.getMonth() + 1, date.getDate());
    else if (e.key === 'Home') next = addDays(date, -date.getDay());
    else if (e.key === 'End') next = addDays(date, 6 - date.getDay());
    else return;
    e.preventDefault();
    if (next < today) next = today;
    moveFocus.current = true;
    setFocusDate(next);
    if (next.getMonth() !== view.month || next.getFullYear() !== view.year) setView({ year: next.getFullYear(), month: next.getMonth() });
  };

  const arrow = { border: '1px solid', borderColor: isDark ? '#333' : C.border, borderRadius: '10px', width: 36, height: 36, '&:focus-visible': { boxShadow: `0 0 0 3px ${C.ring}` } };

  return (
    <Panel icon={<CalendarMonthIcon />} title="Select Date" subtitle="Choose a date for your donation" sx={{ height: '100%' }}>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1.5 }}>
        <IconButton onClick={() => shift(-1)} disabled={atCurrentMonth} aria-label="Previous month" sx={arrow}><ChevronLeftIcon fontSize="small" /></IconButton>
        <Typography sx={{ fontWeight: 700 }} aria-live="polite">{title}</Typography>
        <IconButton onClick={() => shift(1)} aria-label="Next month" sx={arrow}><ChevronRightIcon fontSize="small" /></IconButton>
      </Box>

      <Box aria-hidden="true" sx={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', mb: 0.5 }}>
        {WEEKDAYS.map((d) => <Typography key={d} sx={{ textAlign: 'center', color: 'text.secondary', fontSize: '0.72rem', fontWeight: 600, letterSpacing: '0.04em', textTransform: 'uppercase', py: 0.75 }}>{d}</Typography>)}
      </Box>

      <Box ref={gridRef} role="group" aria-label={`Dates in ${title}`} sx={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', rowGap: 0.5 }}>
        {cells.map((date) => {
          const iso = isoOf(date);
          const past = date < today;
          const inMonth = date.getMonth() === view.month;
          const selected = iso === value;
          const isToday = date.getTime() === today.getTime();
          return (
            <Box key={iso} component="button" type="button" data-iso={iso} disabled={past} aria-pressed={selected}
              tabIndex={iso === tabIso ? 0 : -1}
              aria-label={`${date.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}${isToday ? ', today' : ''}${past ? ', unavailable' : ''}`}
              onClick={() => { onChange(iso); setFocusDate(date); if (!inMonth) setView({ year: date.getFullYear(), month: date.getMonth() }); }}
              onKeyDown={(e) => onKeyDown(e, date)}
              sx={{
                position: 'relative', mx: 'auto', width: { xs: 36, sm: 40 }, height: { xs: 36, sm: 40 }, borderRadius: '10px', border: 'none', font: 'inherit', fontSize: '0.88rem',
                fontWeight: selected || isToday ? 700 : 500, cursor: past ? 'not-allowed' : 'pointer', transition: 'background-color .12s',
                bgcolor: selected ? C.primary : 'transparent',
                color: selected ? '#fff' : past ? (isDark ? '#4a4a4a' : '#CBD5E1') : !inMonth ? 'text.secondary' : 'text.primary',
                opacity: !inMonth && !selected ? 0.6 : 1,
                textDecoration: past && inMonth ? 'line-through' : 'none',
                outline: isToday && !selected ? `1.5px solid ${C.primary}` : 'none', outlineOffset: -2,
                boxShadow: selected ? '0 4px 12px rgba(185,28,44,0.35)' : 'none',
                '&:hover:not(:disabled)': { bgcolor: selected ? C.dark : isDark ? 'rgba(185,28,44,0.18)' : C.soft },
                '&:focus-visible': { boxShadow: `0 0 0 3px ${C.ring}` },
                // small dot under open days in this month = bookable
                '&::after': !past && inMonth && !selected ? {
                  content: '""', position: 'absolute', left: '50%', bottom: 5, width: 4, height: 4, ml: '-2px', borderRadius: '50%', bgcolor: C.ok, opacity: 0.8,
                } : undefined,
              }}>
              {date.getDate()}
            </Box>
          );
        })}
      </Box>

      <Box component="ul" aria-label="Calendar legend" sx={{ listStyle: 'none', p: 0, m: 0, mt: 2, display: 'flex', flexWrap: 'wrap', justifyContent: 'center', columnGap: 2.5, rowGap: 1, fontSize: '0.75rem', color: 'text.secondary' }}>
        <Legend swatch={{ width: 8, height: 8, borderRadius: '50%', bgcolor: C.ok }}>Available</Legend>
        <Legend swatch={{ width: 8, height: 8, borderRadius: '50%', border: `1.5px solid ${C.primary}` }}>Today</Legend>
        <Legend swatch={{ width: 8, height: 8, borderRadius: '50%', bgcolor: isDark ? '#444' : '#CBD5E1' }}>Unavailable</Legend>
      </Box>
    </Panel>
  );
}

function Legend({ swatch, children }) {
  return (
    <Box component="li" sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
      <Box aria-hidden="true" sx={{ flexShrink: 0, ...swatch }} />{children}
    </Box>
  );
}
