'use client';
import Link from 'next/link';
import { Box, Typography, useTheme } from '@mui/material';
import EventNoteIcon from '@mui/icons-material/EventNote';
import ApartmentIcon from '@mui/icons-material/Apartment';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import PersonOutlineIcon from '@mui/icons-material/PersonOutline';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import FavoriteIcon from '@mui/icons-material/Favorite';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import Panel from './Panel';
import { formatLongDate } from './booking';

function SummaryRow({ icon, primary, secondary, placeholder }) {
  const isDark = useTheme().palette.mode === 'dark';
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, py: 1.15 }}>
      <Box sx={{ width: 38, height: 38, borderRadius: '10px', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#c62828', bgcolor: isDark ? 'rgba(198,40,40,0.16)' : '#fdeaea' }}>
        {icon}
      </Box>
      <Box sx={{ minWidth: 0 }}>
        <Typography sx={{ fontWeight: 700, fontSize: '0.95rem', lineHeight: 1.3, color: placeholder ? 'text.disabled' : 'text.primary' }}>{primary}</Typography>
        {secondary && <Typography sx={{ color: 'text.secondary', fontSize: '0.8rem' }}>{secondary}</Typography>}
      </Box>
    </Box>
  );
}

// "Your Appointment": updates live as choices are made. `person` is null until known.
export function AppointmentSummary({ center, date, time, person, onEdit }) {
  const place = center ? [center.address, center.city].filter(Boolean).join(', ') : '';
  return (
    <Panel icon={<EventNoteIcon />} title="Your Appointment" subtitle="Review your selected details">
      <SummaryRow icon={<ApartmentIcon fontSize="small" />} primary={center ? center.name : 'No center selected'} secondary={place || undefined} placeholder={!center} />
      <SummaryRow icon={<CalendarMonthIcon fontSize="small" />} primary={date ? formatLongDate(date) : 'No date selected'} placeholder={!date} />
      <SummaryRow icon={<AccessTimeIcon fontSize="small" />} primary={time || 'No time selected'} placeholder={!time} />
      <SummaryRow icon={<PersonOutlineIcon fontSize="small" />} primary={person?.name || 'Your details'} secondary={person ? person.role : 'Added on the next step'} placeholder={!person?.name} />
      {onEdit && (
        <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 0.5 }}>
          <Box component="button" type="button" onClick={onEdit}
            sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.5, border: 'none', bgcolor: 'transparent', color: '#c62828', font: 'inherit', fontWeight: 700, fontSize: '0.85rem', cursor: 'pointer', p: 0 }}>
            <EditOutlinedIcon sx={{ fontSize: 16 }} /> Edit Selection
          </Box>
        </Box>
      )}
    </Panel>
  );
}

// Same rules the Donate page asks donors to confirm.
const REQUIREMENTS = [
  'Be between 18 and 60 years old',
  'Weigh at least 45 kg',
  'Be in good health, with no active infection',
  'Not have donated blood in the past 3 months',
  'Bring a valid photo ID',
];

export function DonateChecklist() {
  const isDark = useTheme().palette.mode === 'dark';
  return (
    <Box sx={{ borderRadius: '18px', p: { xs: 2, sm: 2.75 }, bgcolor: isDark ? 'rgba(198,40,40,0.1)' : '#fdeeee', border: `1px solid ${isDark ? '#3a1a1a' : '#f6d6d6'}` }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1.75 }}>
        <Box sx={{ width: 44, height: 44, borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#c62828', bgcolor: isDark ? 'rgba(198,40,40,0.2)' : '#fbdcdc' }}>
          <FavoriteIcon />
        </Box>
        <Box>
          <Typography sx={{ fontWeight: 800, color: '#c62828', fontSize: '1.05rem', lineHeight: 1.2 }}>Before You Donate</Typography>
          <Typography sx={{ color: 'text.secondary', fontSize: '0.82rem' }}>Make sure you meet the basic requirements</Typography>
        </Box>
      </Box>
      <Box component="ul" sx={{ listStyle: 'none', m: 0, p: 0, display: 'flex', flexDirection: 'column', gap: 1.1 }}>
        {REQUIREMENTS.map((text) => (
          <Box component="li" key={text} sx={{ display: 'flex', alignItems: 'center', gap: 1.25, fontSize: '0.88rem' }}>
            <CheckCircleIcon sx={{ color: '#c62828', fontSize: 20, flexShrink: 0 }} />{text}
          </Box>
        ))}
      </Box>
      <Box component={Link} href="/donate" sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.5, mt: 2, color: '#c62828', fontWeight: 700, fontSize: '0.88rem', textDecoration: 'none', mx: 'auto', width: '100%', justifyContent: 'center' }}>
        Learn more about eligibility <ArrowForwardIcon sx={{ fontSize: 16 }} />
      </Box>
    </Box>
  );
}
