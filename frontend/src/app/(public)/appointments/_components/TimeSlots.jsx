'use client';
import { Box, Typography, useTheme } from '@mui/material';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import Panel from './Panel';
import { TIME_SLOTS, parseIso, slotStartMinutes } from './booking';

export default function TimeSlots({ date, value, onChange }) {
  const isDark = useTheme().palette.mode === 'dark';
  const now = new Date();
  const isToday = !!date && parseIso(date).toDateString() === now.toDateString();
  const nowMinutes = now.getHours() * 60 + now.getMinutes();

  return (
    <Panel icon={<AccessTimeIcon />} title="Select Time" subtitle={date ? 'Choose an available time slot' : 'Pick a date first'} sx={{ height: '100%' }}>
      <Box role="radiogroup" aria-label="Time slot" sx={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 1.25 }}>
        {TIME_SLOTS.map((slot) => {
          const passed = isToday && slotStartMinutes(slot) <= nowMinutes; // can't book a slot that already started
          const disabled = !date || passed;
          const selected = value === slot;
          return (
            <Box key={slot} component="button" type="button" role="radio" aria-checked={selected} disabled={disabled}
              onClick={() => onChange(slot)}
              sx={{
                py: 1.15, borderRadius: '10px', font: 'inherit', fontSize: '0.88rem', fontWeight: selected ? 800 : 500,
                cursor: disabled ? 'not-allowed' : 'pointer', transition: 'all .14s',
                border: '1.5px solid', borderColor: selected ? '#c62828' : isDark ? '#2c2c2c' : '#eadede',
                bgcolor: selected ? (isDark ? 'rgba(198,40,40,0.16)' : '#fff1f1') : 'background.paper',
                color: selected ? '#c62828' : disabled ? 'text.disabled' : 'text.primary',
                textDecoration: passed ? 'line-through' : 'none',
                '&:hover:not(:disabled)': { borderColor: '#c62828' },
                '&:focus-visible': { boxShadow: '0 0 0 3px rgba(198,40,40,0.35)' },
              }}>
              {slot}
            </Box>
          );
        })}
      </Box>
      {!date && <Typography sx={{ color: 'text.secondary', fontSize: '0.78rem', mt: 1.5 }}>Time slots unlock once you choose a date.</Typography>}
    </Panel>
  );
}
