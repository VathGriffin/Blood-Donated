'use client';
import { Box, Button, Dialog, IconButton, Typography } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import CheckIcon from '@mui/icons-material/Check';
import { whenLabel } from './appointments';

// Decorative confetti around the tick: [x, y, colour, size, rotation].
const CONFETTI = [
  [-62, -30, '#E11D48', 6, 20], [-48, 26, '#16A34A', 5, 0], [-70, 4, '#16A34A', 4, 45], [56, -34, '#16A34A', 5, 0],
  [66, -4, '#F97316', 6, 30], [50, 30, '#E11D48', 4, 60], [-24, -48, '#F97316', 4, 0], [22, -50, '#16A34A', 4, 15],
  [-34, 44, '#F97316', 4, 0], [30, 46, '#16A34A', 5, 45],
];

/** Shown after a reschedule request is sent (or a pending booking moved directly). */
export default function SubmittedDialog({ mode, request, onClose }) {
  const requested = mode === 'requested';
  return (
    <Dialog open onClose={onClose} maxWidth="xs" fullWidth aria-labelledby="submitted-title" aria-describedby="submitted-text"
      slotProps={{ paper: { sx: { borderRadius: '16px' } } }}>
      <Box sx={{ position: 'relative', px: { xs: 3, sm: 4 }, pt: 5, pb: 4, textAlign: 'center' }}>
        <IconButton onClick={onClose} aria-label="Close" sx={{ position: 'absolute', top: 10, right: 10 }}><CloseIcon /></IconButton>

        <Box aria-hidden="true" sx={{ position: 'relative', width: 72, height: 72, mx: 'auto', mb: 3 }}>
          {CONFETTI.map(([x, y, c, s, r], i) => (
            <Box key={i} sx={{
              position: 'absolute', left: '50%', top: '50%', width: s, height: s * 1.6, borderRadius: 1, bgcolor: c,
              transform: `translate(${x}px, ${y}px) rotate(${r}deg)`,
              animation: `bl-confetti .5s cubic-bezier(.2,.8,.2,1) ${i * 25}ms backwards`,
              '@keyframes bl-confetti': { from: { opacity: 0, transform: 'translate(0, 0) scale(.4)' } },
            }} />
          ))}
          <Box sx={{
            width: 72, height: 72, borderRadius: '50%', bgcolor: 'success.main', color: '#fff', display: 'grid', placeItems: 'center',
            boxShadow: '0 8px 24px rgba(22,163,74,0.35)',
            animation: 'bl-pop .45s cubic-bezier(.2,.9,.3,1.3) backwards',
            '@keyframes bl-pop': { from: { transform: 'scale(.5)', opacity: 0 } },
          }}>
            <CheckIcon sx={{ fontSize: 42 }} />
          </Box>
        </Box>

        <Typography id="submitted-title" component="h2" sx={{ fontWeight: 700, fontSize: '1.2rem' }}>
          {requested ? 'Reschedule Request Submitted' : 'Appointment Date Changed'}
        </Typography>
        <Typography id="submitted-text" color="text.secondary" sx={{ mt: 1.25, fontSize: '0.92rem', lineHeight: 1.65 }}>
          {requested
            ? 'Your request to change the appointment date has been sent to the hospital. You will receive a notification once the hospital responds.'
            : `Your appointment is now on ${request ? whenLabel(request.toDate, request.toTime) : 'the new date'}. The hospital will confirm the new slot.`}
        </Typography>
        <Button variant="contained" onClick={onClose} autoFocus sx={{ mt: 3.5, minWidth: 150, height: 44 }}>OK</Button>
      </Box>
    </Dialog>
  );
}
