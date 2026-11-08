'use client';
import { useI18n } from '@/i18n/I18nProvider';
import { useEffect, useRef, useState } from 'react';
import axios from 'axios';
import API_BASE from '@/lib/config';
import { Box, Typography, useTheme } from '@mui/material';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import EventBusyOutlinedIcon from '@mui/icons-material/EventBusyOutlined';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import CheckIcon from '@mui/icons-material/Check';
import Panel from './Panel';
import { C, TIME_SLOTS, formatSlot, parseIso, radioKeyDown, slotStartMinutes } from './booking';

const COLUMNS = 3;

// `hospitalId` (optional): grey out slots that center has no room left in. The server checks
// again on booking, so a failed availability lookup just leaves every slot open.
export default function TimeSlots({ date, value, onChange, hospitalId }) {
  const isDark = useTheme().palette.mode === 'dark';
  const { t } = useI18n();
  const refs = useRef([]);
  const [full, setFull] = useState(() => new Set());

  useEffect(() => {
    setFull(new Set());
    if (!date || !hospitalId) return undefined;
    let alive = true;
    axios.get(`${API_BASE}/api/appointments/availability`, { params: { hospital: hospitalId, date } })
      .then(({ data }) => { if (alive) setFull(new Set((data.slots || []).filter((x) => !x.available).map((x) => x.time))); })
      .catch(() => { /* leave slots open; booking re-checks */ });
    return () => { alive = false; };
  }, [date, hospitalId]);

  // A selected slot that turns out to be full is cleared.
  useEffect(() => { if (value && full.has(value)) onChange(''); }, [full, value, onChange]);
  const now = new Date();
  const isToday = !!date && parseIso(date).toDateString() === now.toDateString();
  const nowMinutes = now.getHours() * 60 + now.getMinutes();

  const slots = TIME_SLOTS.map((slot, i) => {
    const passed = isToday && slotStartMinutes(slot) <= nowMinutes; // can't book a slot that already started
    const isFull = !passed && full.has(slot);
    return { slot, i, passed, full: isFull, disabled: !date || passed || isFull, get el() { return refs.current[i]; } };
  });
  const open = slots.filter((s) => !s.disabled);
  const selectedIdx = slots.findIndex((s) => s.slot === value && !s.disabled);
  const tabbable = selectedIdx >= 0 ? selectedIdx : open[0]?.i;

  return (
    <Panel icon={<AccessTimeIcon />} title={t('booking.time.title')} subtitle={t(date ? 'booking.time.subtitle' : 'booking.time.pickDateFirst')}
      sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {date && !open.length ? (
        <Box role="status" sx={{ textAlign: 'center', py: 4, px: 2, borderRadius: '14px', border: `1px dashed ${isDark ? '#334155' : C.border}` }}>
          <EventBusyOutlinedIcon sx={{ fontSize: 34, color: 'text.disabled' }} aria-hidden="true" />
          <Typography sx={{ fontWeight: 700, mt: 1 }}>{t(isToday ? 'booking.time.noneToday' : 'booking.time.fullDay')}</Typography>
          <Typography sx={{ color: 'text.secondary', fontSize: '0.85rem', mt: 0.5 }}>
            {t(isToday ? 'booking.time.noneTodayText' : 'booking.time.fullDayText')}
          </Typography>
        </Box>
      ) : (
        <Box role="radiogroup" aria-label={t('booking.time.label')} sx={{ display: 'grid', gridTemplateColumns: `repeat(${COLUMNS}, 1fr)`, gap: 1 }}>
          {slots.map((s) => {
            const selected = value === s.slot;
            const sub = t(!date ? 'booking.time.pickDate' : s.passed ? 'booking.time.started' : s.full ? 'booking.time.full' : 'booking.time.available');
            return (
              <Box key={s.slot} ref={(el) => { refs.current[s.i] = el; }}
                component="button" type="button" role="radio" aria-checked={selected} disabled={s.disabled}
                tabIndex={s.i === tabbable ? 0 : -1}
                aria-label={s.passed ? t('booking.time.startedLabel', { slot: formatSlot(s.slot) }) : s.full ? t('booking.time.fullLabel', { slot: formatSlot(s.slot) }) : formatSlot(s.slot)}
                onClick={() => onChange(s.slot)}
                onKeyDown={(e) => radioKeyDown(e, s.i, slots, (n) => onChange(slots[n].slot), COLUMNS)}
                sx={{
                  position: 'relative', py: 0.9, px: 0.5, borderRadius: '10px', font: 'inherit', lineHeight: 1.2,
                  display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 0.25,
                  cursor: s.disabled ? 'not-allowed' : 'pointer', transition: 'border-color .14s, background-color .14s',
                  border: '1.5px solid', borderColor: selected ? C.primary : isDark ? '#334155' : C.border,
                  bgcolor: selected ? (isDark ? 'rgba(201,29,50,0.16)' : C.soft) : s.disabled ? (isDark ? 'rgba(255,255,255,0.02)' : C.bg) : 'background.paper',
                  color: s.disabled ? 'text.disabled' : 'text.primary',
                  '&:hover:not(:disabled)': { borderColor: C.primary, bgcolor: selected ? undefined : isDark ? 'rgba(201,29,50,0.1)' : C.softer },
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
                  {formatSlot(s.slot)}
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
        {t(date ? 'booking.time.reviewNote' : 'booking.time.unlockNote')}
      </Typography>
    </Panel>
  );
}
