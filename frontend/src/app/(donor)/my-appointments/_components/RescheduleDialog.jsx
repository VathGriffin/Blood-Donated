'use client';
import { useEffect, useState } from 'react';
import axios from 'axios';
import {
  Alert, Box, Button, ButtonBase, CircularProgress, Dialog, IconButton, ListItemText, MenuItem, Popover, Select, TextField,
  Typography, useMediaQuery,
} from '@mui/material';
import { alpha } from '@mui/material/styles';
import CloseIcon from '@mui/icons-material/Close';
import EditCalendarOutlinedIcon from '@mui/icons-material/EditCalendarOutlined';
import CalendarMonthOutlinedIcon from '@mui/icons-material/CalendarMonthOutlined';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import InfoIcon from '@mui/icons-material/Info';
import SendIcon from '@mui/icons-material/Send';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import HourglassTopIcon from '@mui/icons-material/HourglassTop';
import API_BASE from '@/lib/config';
import { apiErrorMessage } from '@/lib/api-error';
import { Pill } from '@/components/donor/ui';
import CalendarPicker from '@/app/(public)/appointments/_components/CalendarPicker';
import { TIME_SLOTS, parseIso, slotStartMinutes } from '@/app/(public)/appointments/_components/booking';
import { shortDay, slotRange, whenLabel } from './appointments';

const REASON_MAX = 500;
const REASON_MIN = 5;

const fieldSx = {
  height: 48, borderRadius: '10px', border: '1px solid', borderColor: (t) => t.custom.surface.borderStrong, bgcolor: 'background.paper',
  px: 1.75, display: 'flex', alignItems: 'center', gap: 1.25, justifyContent: 'flex-start', width: '100%', font: 'inherit',
  fontSize: '0.95rem', color: 'text.primary', transition: 'border-color .15s, box-shadow .15s',
  '&:hover': { borderColor: 'text.secondary' },
  '&.Mui-focusVisible, &[aria-expanded="true"]': { borderColor: 'primary.main', boxShadow: (t) => `0 0 0 3px ${alpha(t.palette.primary.main, 0.14)}` },
};
const labelSx = { fontWeight: 700, fontSize: '0.92rem', mb: 1, display: 'block' };

/**
 * Change an appointment's date and time.
 *   - Confirmed: sends a reschedule request (POST /reschedule-requests). The appointment stays as it
 *     is until the hospital approves.
 *   - Pending: the hospital hasn't committed yet, so the change applies at once (PATCH /schedule).
 * Slot availability comes from the server; the server checks it again on submit and on approval.
 */
export default function RescheduleDialog({ appt, token, onClose, onDone, onSessionExpired }) {
  const fullScreen = useMediaQuery((t) => t.breakpoints.down('sm'));
  const needsApproval = appt.status === 'Confirmed';
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [reason, setReason] = useState('');
  const [calAnchor, setCalAnchor] = useState(null);
  const [slots, setSlots] = useState(null); // null = not loaded; [] = loaded
  const [slotState, setSlotState] = useState('idle'); // idle | loading | error
  const [touched, setTouched] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  // Free places per slot for the chosen day at this hospital (this appointment excluded).
  useEffect(() => {
    if (!date) return undefined;
    if (!appt.hospital) { setSlots(TIME_SLOTS.map((t) => ({ time: t, available: true, remaining: null }))); return undefined; }
    let alive = true;
    setSlotState('loading');
    axios.get(`${API_BASE}/api/appointments/availability`, { params: { hospital: appt.hospital, date, exclude: appt._id } })
      .then(({ data }) => { if (alive) { setSlots(data.slots || []); setSlotState('idle'); } })
      .catch(() => { if (alive) { setSlots(TIME_SLOTS.map((t) => ({ time: t, available: true, remaining: null }))); setSlotState('error'); } });
    return () => { alive = false; };
  }, [date, appt.hospital, appt._id]);

  const now = new Date();
  const isToday = date && parseIso(date).toDateString() === now.toDateString();
  const nowMinutes = now.getHours() * 60 + now.getMinutes();
  const slotInfo = (s) => {
    if (isToday && slotStartMinutes(s.time) <= nowMinutes) return { disabled: true, note: 'Started' };
    if (date === appt.date && s.time === appt.time) return { disabled: true, note: 'Current time' };
    if (!s.available) return { disabled: true, note: 'Full' };
    return { disabled: false, note: s.remaining != null ? `${s.remaining} ${s.remaining === 1 ? 'place' : 'places'} left` : '' };
  };

  // A time picked for another day may not be free on the new one.
  useEffect(() => {
    if (!time || !slots) return;
    const s = slots.find((x) => x.time === time);
    if (!s || slotInfo(s).disabled) setTime('');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slots]);

  const trimmed = reason.trim();
  const errors = {
    date: !date ? 'Choose a new date.' : '',
    time: !time ? 'Choose a time slot.' : '',
    reason: needsApproval && trimmed.length < REASON_MIN ? 'Tell the hospital briefly why you need a new date.' : '',
  };
  const valid = !errors.date && !errors.time && !errors.reason;

  const submit = async () => {
    setTouched(true);
    setError('');
    if (!valid) return;
    setSaving(true);
    const auth = { headers: { Authorization: `Bearer ${token}` } };
    try {
      const { data } = needsApproval
        ? await axios.post(`${API_BASE}/api/appointments/${appt._id}/reschedule-requests`, { date, time, reason: trimmed }, auth)
        : await axios.patch(`${API_BASE}/api/appointments/${appt._id}/schedule`, { date, time, reason: trimmed }, auth);
      onDone(data, needsApproval ? 'requested' : 'changed');
    } catch (err) {
      if (onSessionExpired?.(err)) return;
      setError(apiErrorMessage(err, 'We couldn’t send your request. Please try again.'));
      setSaving(false);
    }
  };

  const statusPill = appt.status === 'Confirmed'
    ? <Pill tone="success" icon={<CheckCircleIcon />} sx={{ py: 0.6, px: 1.25, borderRadius: '8px' }}>Confirmed</Pill>
    : <Pill tone="warning" icon={<HourglassTopIcon />} sx={{ py: 0.6, px: 1.25, borderRadius: '8px' }}>Awaiting confirmation</Pill>;

  return (
    <Dialog open onClose={saving ? undefined : onClose} fullScreen={fullScreen} maxWidth="sm" fullWidth aria-labelledby="reschedule-title"
      slotProps={{ paper: { sx: { borderRadius: { xs: 0, sm: '16px' } } } }}>
      <Box component="form" noValidate onSubmit={(e) => { e.preventDefault(); submit(); }} sx={{ p: { xs: 2.5, sm: 3 } }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2.5 }}>
          <EditCalendarOutlinedIcon aria-hidden="true" sx={{ color: 'primary.main', fontSize: 28 }} />
          <Typography id="reschedule-title" component="h2" sx={{ fontWeight: 700, fontSize: { xs: '1.08rem', sm: '1.2rem' }, flex: 1 }}>
            {needsApproval ? 'Request to Change Appointment Date' : 'Change Appointment Date'}
          </Typography>
          <IconButton onClick={onClose} disabled={saving} aria-label="Close" sx={{ mr: -1 }}><CloseIcon /></IconButton>
        </Box>

        <Box sx={{
          display: 'flex', gap: 1.5, p: 2, borderRadius: '10px', mb: 2.5,
          bgcolor: (t) => t.custom.tones[needsApproval ? 'warning' : 'info'].bg,
          border: '1px solid', borderColor: (t) => alpha(t.custom.tones[needsApproval ? 'warning' : 'info'].dot, 0.3),
          color: (t) => t.custom.tones[needsApproval ? 'warning' : 'info'].fg,
        }}>
          <InfoIcon aria-hidden="true" sx={{ color: (t) => t.custom.tones[needsApproval ? 'warning' : 'info'].dot, fontSize: 22, mt: 0.1 }} />
          {needsApproval ? (
            <Typography sx={{ fontSize: '0.9rem', lineHeight: 1.55 }}>
              <strong>Your current appointment is confirmed by the hospital.</strong><br />
              To change the date, you need to submit a request and wait for hospital approval.
              Your current appointment will remain until the new date is approved.
            </Typography>
          ) : (
            <Typography sx={{ fontSize: '0.9rem', lineHeight: 1.55 }}>
              <strong>The hospital hasn&apos;t confirmed this booking yet.</strong><br />
              Your new date and time apply straight away, and the hospital will confirm the new slot.
            </Typography>
          )}
        </Box>

        <Typography component="span" sx={labelSx}>Current Appointment</Typography>
        <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center', flexWrap: 'wrap', mb: 2.5 }}>
          <Box sx={{ ...fieldSx, width: 'auto', height: 42, cursor: 'default', '&:hover': {} }}>
            <CalendarMonthOutlinedIcon aria-hidden="true" sx={{ color: 'text.secondary', fontSize: 20 }} />
            <span>{whenLabel(appt.date, appt.time)}</span>
          </Box>
          {statusPill}
        </Box>

        <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, mb: 2.5 }}>
          <Box>
            <Typography component="label" id="new-date-label" sx={labelSx}>Select New Date</Typography>
            <ButtonBase aria-labelledby="new-date-label new-date-value" aria-haspopup="dialog" aria-expanded={Boolean(calAnchor)}
              onClick={(e) => setCalAnchor(e.currentTarget)}
              sx={{ ...fieldSx, ...(touched && errors.date && { borderColor: 'error.main' }) }}>
              <CalendarMonthOutlinedIcon aria-hidden="true" sx={{ color: 'text.secondary', fontSize: 20 }} />
              <Box id="new-date-value" component="span" sx={{ flex: 1, textAlign: 'left', color: date ? 'text.primary' : 'text.secondary' }}>
                {date ? shortDay(date).replace(/^\w+, /, '') : 'Choose a date'}
              </Box>
              <KeyboardArrowDownIcon aria-hidden="true" sx={{ color: 'text.secondary' }} />
            </ButtonBase>
            {touched && errors.date && <Typography role="alert" sx={{ color: 'error.main', fontSize: '0.78rem', mt: 0.5 }}>{errors.date}</Typography>}
            <Popover open={Boolean(calAnchor)} anchorEl={calAnchor} onClose={() => setCalAnchor(null)}
              anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }} transformOrigin={{ vertical: 'top', horizontal: 'left' }}
              slotProps={{ paper: { sx: { mt: 0.75, width: 340, maxWidth: 'calc(100vw - 32px)', borderRadius: '14px' } } }}>
              <CalendarPicker value={date} onChange={(iso) => { setDate(iso); setCalAnchor(null); }} />
            </Popover>
          </Box>

          <Box>
            <Typography component="label" id="new-time-label" sx={labelSx}>Select New Time</Typography>
            <Select value={time} onChange={(e) => setTime(e.target.value)} displayEmpty disabled={!date || slotState === 'loading'}
              inputProps={{ 'aria-labelledby': 'new-time-label' }} error={touched && !!errors.time}
              IconComponent={KeyboardArrowDownIcon}
              startAdornment={slotState === 'loading'
                ? <CircularProgress size={18} sx={{ mr: 1.25 }} />
                : <AccessTimeIcon aria-hidden="true" sx={{ color: 'text.secondary', fontSize: 20, mr: 1.25 }} />}
              renderValue={(v) => (v ? slotRange(v) : <Box component="span" sx={{ color: 'text.secondary' }}>{date ? 'Choose a time' : 'Pick a date first'}</Box>)}
              MenuProps={{ slotProps: { paper: { sx: { maxHeight: 320 } } } }}
              sx={{ width: '100%', height: 48, borderRadius: '10px' }}>
              {(slots || []).map((s) => {
                const info = slotInfo(s);
                return (
                  <MenuItem key={s.time} value={s.time} disabled={info.disabled}>
                    <ListItemText primary={slotRange(s.time)} secondary={info.note}
                      slotProps={{ secondary: { sx: { fontSize: '0.75rem' } } }} />
                  </MenuItem>
                );
              })}
            </Select>
            {touched && errors.time && <Typography role="alert" sx={{ color: 'error.main', fontSize: '0.78rem', mt: 0.5 }}>{errors.time}</Typography>}
            {slotState === 'error' && (
              <Typography sx={{ color: 'text.secondary', fontSize: '0.78rem', mt: 0.5 }}>
                Couldn&apos;t load availability. The hospital will check it when you submit.
              </Typography>
            )}
          </Box>
        </Box>

        <Typography component="label" htmlFor="reschedule-reason" sx={labelSx}>
          Reason for Change{!needsApproval && <Box component="span" sx={{ color: 'text.secondary', fontWeight: 500 }}> (optional)</Box>}
        </Typography>
        <TextField id="reschedule-reason" value={reason} onChange={(e) => setReason(e.target.value.slice(0, REASON_MAX))}
          multiline minRows={3} fullWidth placeholder="e.g. I have a personal matter and would like to reschedule to a later date."
          error={touched && !!errors.reason}
          helperText={(
            <Box component="span" sx={{ display: 'flex', justifyContent: 'space-between', gap: 2 }}>
              <span>{touched && errors.reason}</span>
              <span>{reason.length}/{REASON_MAX}</span>
            </Box>
          )}
          slotProps={{ htmlInput: { maxLength: REASON_MAX }, formHelperText: { component: 'div', sx: { mx: 0 } } }} />

        {error && <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>}

        <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1.5, mt: 3, flexDirection: { xs: 'column-reverse', sm: 'row' } }}>
          <Button variant="outlined" onClick={onClose} disabled={saving}
            sx={{ minWidth: 120, height: 46, color: 'text.primary', borderColor: 'divider', '&:hover': { borderColor: 'text.secondary' } }}>
            Cancel
          </Button>
          <Button type="submit" variant="contained" disabled={saving}
            startIcon={saving ? <CircularProgress size={18} color="inherit" /> : <SendIcon sx={{ transform: 'rotate(-30deg)' }} />}
            sx={{ minWidth: 190, height: 46 }}>
            {saving ? 'Sending…' : needsApproval ? 'Submit Request' : 'Save New Date'}
          </Button>
        </Box>
      </Box>
    </Dialog>
  );
}
