'use client';
import { useRef } from 'react';
import { Box, Typography, useTheme } from '@mui/material';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import EventBusyOutlinedIcon from '@mui/icons-material/EventBusyOutlined';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import CheckIcon from '@mui/icons-material/Check';
import Panel from './Panel';
import { C, TIME_SLOTS, parseIso, radioKeyDown, slotStartMinutes } from './booking';

const COLUMNS = 3;

export default function TimeSlots({ date, value, onChange }) {
  const isDark = useTheme().palette.mode === 'dark';
  const refs = useRef([]);
  const now = new Date();
  const isToday = !!date && parseIso(date).toDateString() === now.toDateString();
  const nowMinutes = now.getHours() * 60 + now.getMinutes();

  const slots = TIME_SLOTS.map((slot, i) => {
    const passed = isToday && slotStartMinutes(slot) <= nowMinutes; // can't book a slot that already started
    return { slot, i, passed, disabled: !date || passed, get el() { return refs.current[i]; } };
  });
  const open = slots.filter((s) => !s.disabled);
  const selectedIdx = slots.findIndex((s) => s.slot === value && !s.disabled);
  const tabbable = selectedIdx >= 0 ? selectedIdx : open[0]?.i;

  return (
    <Panel icon={<AccessTimeIcon />} title="Select Time" subtitle={date ? 'Pick an available time slot' : 'Pick a date first'}
      sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {date && !open.length ? (
        <Box role="status" sx={{ textAlign: 'center', py: 4, px: 2, borderRadius: '14px', border: `1px dashed ${isDark ? '#333' : C.border}` }}>
          <EventBusyOutlinedIcon sx={{ fontSize: 34, color: 'text.disabled' }} aria-hidden="true" />
          <Typography sx={{ fontWeight: 700, mt: 1 }}>No more slots today</Typography>
          <Typography sx={{ color: 'text.secondary', fontSize: '0.85rem', mt: 0.5 }}>Every slot for today has already started. Please choose another date.</Typography>
        </Box>
      ) : (
        <Box role="radiogroup" aria-label="Time slot" sx={{ display: 'grid', gridTemplateColumns: `repeat(${COLUMNS}, 1fr)`, gap: 1 }}>
          {slots.map((s) => {
            const selected = value === s.slot;
            const sub = !date ? 'Pick a date' : s.passed ? 'Started' : 'Available';
            return (
              <Box key={s.slot} ref={(el) => { refs.current[s.i] = el; }}
                component="button" type="button" role="radio" aria-checked={selected} disabled={s.disabled}
                tabIndex={s.i === tabbable ? 0 : -1}
                aria-label={`${s.slot}${s.passed ? ', already started' : ''}`}
                onClick={() => onChange(s.slot)}
                onKeyDown={(e) => radioKeyDown(e, s.i, slots, (n) => onChange(slots[n].slot), COLUMNS)}
                sx={{
                  position: 'relative', py: 0.9, px: 0.5, borderRadius: '10px', font: 'inherit', lineHeight: 1.2,
                  display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 0.25,
                  cursor: s.disabled ? 'not-allowed' : 'pointer', transition: 'border-color .14s, background-color .14s',
                  border: '1.5px solid', borderColor: selected ? C.primary : isDark ? '#2c2c2c' : C.border,
                  bgcolor: selected ? (isDark ? 'rgba(185,28,44,0.16)' : C.soft) : s.disabled ? (isDark ? 'rgba(255,255,255,0.02)' : C.bg) : 'background.paper',
                  color: s.disabled ? 'text.disabled' : 'text.primary',
                  '&:hover:not(:disabled)': { borderColor: C.primary, bgcolor: selected ? undefined : isDark ? 'rgba(185,28,44,0.1)' : C.softer },
                  '&:focus-visible': { outline: 'none', boxShadow: `0 0 0 3px ${C.ring}` },
                }}>
                {selected && (
                  <Box aria-hidden="true" sx={{
                    position: 'absolute', top: -7, right: -7, width: 18, height: 18, borderRadius: '50%', bgcolor: C.primary,
                    border: '2px solid', borderColor: 'background.paper', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <CheckIcon sx={{ fontSize: 11, color: '#fff' }} />
                  </Box>
                )}
                <Box component="span" sx={{ fontSize: '0.86rem', fontWeight: selected ? 700 : 600, fontVariantNumeric: 'tabular-nums', color: selected ? C.primary : 'inherit', textDecoration: s.passed ? 'line-through' : 'none' }}>
                  {s.slot}
                </Box>
                <Box component="span" aria-hidden="true" sx={{ fontSize: '0.7rem', color: selected ? C.primary : 'text.secondary', opacity: s.disabled ? 0.7 : 1 }}>
                  {sub}
                </Box>
              </Box>
            );
          })}
        </Box>
      )}

      <Typography sx={{ display: 'flex', gap: 0.75, alignItems: 'flex-start', color: 'text.secondary', fontSize: '0.76rem', mt: 'auto', pt: 2 }}>
        <InfoOutlinedIcon sx={{ fontSize: 15, mt: '1px', flexShrink: 0 }} aria-hidden="true" />
        {date ? 'The donation center reviews each booking and confirms your slot.' : 'Time slots unlock once you choose a date.'}
      </Typography>
    </Panel>
  );
}
