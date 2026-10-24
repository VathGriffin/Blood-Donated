'use client';
import Link from 'next/link';
import { Box, Typography, Button, useTheme } from '@mui/material';
import EventNoteIcon from '@mui/icons-material/EventNote';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import AccessTimeFilledIcon from '@mui/icons-material/AccessTimeFilled';
import PersonIcon from '@mui/icons-material/Person';
import WaterDropIcon from '@mui/icons-material/WaterDrop';
import PlaceIcon from '@mui/icons-material/Place';
import FavoriteIcon from '@mui/icons-material/Favorite';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import HeadsetMicOutlinedIcon from '@mui/icons-material/HeadsetMicOutlined';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import HospitalPhoto from './HospitalPhoto';
import { C, formatLongDate, openAssistant } from './booking';

const cardSx = (isDark) => ({
  bgcolor: 'background.paper', borderRadius: '16px', p: { xs: 2, sm: 2.5 },
  border: `1px solid ${isDark ? '#262626' : C.border}`,
  boxShadow: isDark ? 'none' : '0 1px 2px rgba(15,23,42,0.04), 0 8px 24px rgba(15,23,42,0.04)',
});

const tile = (isDark, size = 36) => ({
  width: size, height: size, borderRadius: '50%', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
  color: C.primary, bgcolor: isDark ? 'rgba(185,28,44,0.16)' : C.soft, '& svg': { fontSize: size * 0.52 },
});

function Row({ icon, primary, secondary, placeholder }) {
  const isDark = useTheme().palette.mode === 'dark';
  return (
    <Box component="li" sx={{ display: 'flex', alignItems: 'center', gap: 1.5, py: 1.1 }}>
      <Box aria-hidden="true" sx={{ ...tile(isDark), ...(placeholder && { color: 'text.disabled', bgcolor: isDark ? '#1f1f1f' : '#F1F5F9' }) }}>{icon}</Box>
      <Box sx={{ minWidth: 0 }}>
        <Typography sx={{ fontWeight: secondary ? 700 : 500, fontSize: '0.92rem', lineHeight: 1.35, color: placeholder ? 'text.disabled' : 'text.primary', overflowWrap: 'anywhere' }}>{primary}</Typography>
        {secondary && <Typography sx={{ color: 'text.secondary', fontSize: '0.8rem' }}>{secondary}</Typography>}
      </Box>
    </Box>
  );
}

// "Your Appointment": updates live as choices are made.
export function AppointmentSummary({ center, date, time, name, role, bloodType, onChange }) {
  const isDark = useTheme().palette.mode === 'dark';
  const mapHref = center?.city ? `/map?city=${encodeURIComponent(center.city)}` : '/map';
  return (
    <Box component="section" aria-labelledby="appt-summary-title" sx={cardSx(isDark)}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25, mb: 2 }}>
        <Box aria-hidden="true" sx={{ ...tile(isDark, 36), borderRadius: '10px' }}><EventNoteIcon /></Box>
        <Typography component="h2" id="appt-summary-title" sx={{ flex: 1, fontWeight: 800, fontSize: '1.15rem', letterSpacing: '-0.01em' }}>Your Appointment</Typography>
        {onChange && (
          <Button size="small" variant="outlined" onClick={onChange}
            sx={{ textTransform: 'none', fontWeight: 600, color: C.primary, borderColor: isDark ? '#333' : C.border, borderRadius: '8px', px: 1.5, minWidth: 0, '&:hover': { borderColor: C.primary, bgcolor: C.softer } }}>
            Change
          </Button>
        )}
      </Box>

      <Box component="ul" aria-live="polite" sx={{ listStyle: 'none', m: 0, p: 0 }}>
        {/* Hospital */}
        <Box component="li" sx={{ display: 'flex', alignItems: 'center', gap: 1.5, pb: 1.5, mb: 0.5, borderBottom: `1px solid ${isDark ? '#262626' : C.border}` }}>
          {center ? (
            <Box sx={{ width: 96, flexShrink: 0 }}><HospitalPhoto src={center.image} name={center.name} height={60} radius={8} /></Box>
          ) : (
            <Box aria-hidden="true" sx={{ width: 96, height: 56, flexShrink: 0, borderRadius: '8px', bgcolor: isDark ? '#1f1f1f' : '#F1F5F9', border: `1px dashed ${isDark ? '#333' : '#CBD5E1'}` }} />
          )}
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography sx={{ fontWeight: 700, fontSize: '0.95rem', lineHeight: 1.3, color: center ? 'text.primary' : 'text.disabled' }}>{center ? center.name : 'No center selected'}</Typography>
            {center && (
              <Box sx={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', columnGap: 1, mt: 0.25 }}>
                {center.city && <Typography component="span" sx={{ color: 'text.secondary', fontSize: '0.82rem' }}>{center.city}</Typography>}
                {center.city && <Box component="span" aria-hidden="true" sx={{ width: 3, height: 3, borderRadius: '50%', bgcolor: 'text.disabled' }} />}
                <Box component={Link} href={mapHref} aria-label={`View ${center.name} on the map`} sx={{
                  display: 'inline-flex', alignItems: 'center', gap: 0.25, color: C.primary, fontWeight: 600, fontSize: '0.8rem', textDecoration: 'none', borderRadius: '4px',
                  '&:hover': { textDecoration: 'underline' }, '&:focus-visible': { outline: `2px solid ${C.primary}`, outlineOffset: 2 },
                }}>
                  <PlaceIcon sx={{ fontSize: 14 }} aria-hidden="true" />View on Map
                </Box>
              </Box>
            )}
          </Box>
        </Box>
        <Row icon={<CalendarMonthIcon />} primary={date ? formatLongDate(date) : 'No date selected'} placeholder={!date} />
        <Row icon={<AccessTimeFilledIcon />} primary={time || 'No time selected'} placeholder={!time} />
        <Row icon={<PersonIcon />} primary={name || 'Your name'} secondary={name ? role : undefined} placeholder={!name} />
        <Row icon={<WaterDropIcon />} primary="Blood Type" secondary={bloodType || 'Added in Your Information'} placeholder={!bloodType} />
      </Box>
    </Box>
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
    <Box component="section" aria-labelledby="before-donate-title" sx={{
      position: 'relative', overflow: 'hidden', borderRadius: '16px', p: { xs: 2, sm: 2.5 },
      bgcolor: isDark ? 'rgba(185,28,44,0.1)' : '#FDF0F2', border: `1px solid ${isDark ? 'rgba(185,28,44,0.25)' : '#F6D5DA'}`,
    }}>
      <BloodBagArt />
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2, position: 'relative' }}>
        <Box aria-hidden="true" sx={{ ...tile(isDark, 44), bgcolor: isDark ? 'rgba(185,28,44,0.2)' : '#FFFFFF' }}><FavoriteIcon /></Box>
        <Box>
          <Typography component="h2" id="before-donate-title" sx={{ fontWeight: 800, fontSize: '1.1rem', color: C.primary, lineHeight: 1.25 }}>Before You Donate</Typography>
          <Typography sx={{ color: 'text.secondary', fontSize: '0.82rem' }}>Make sure you meet the basic requirements</Typography>
        </Box>
      </Box>
      <Box component="ul" sx={{ listStyle: 'none', m: 0, p: 0, pr: { sm: 9 }, display: 'flex', flexDirection: 'column', gap: 1.1, position: 'relative' }}>
        {REQUIREMENTS.map((text) => (
          <Box component="li" key={text} sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.1, fontSize: '0.88rem', lineHeight: 1.45 }}>
            <CheckCircleIcon aria-hidden="true" sx={{ color: C.primary, fontSize: 19, flexShrink: 0, mt: '1px' }} />{text}
          </Box>
        ))}
      </Box>
      <Box sx={{ textAlign: 'center', mt: 2, position: 'relative' }}>
        <Box component={Link} href="/donate" sx={{
          display: 'inline-flex', alignItems: 'center', gap: 0.5, color: C.primary, fontWeight: 700, fontSize: '0.86rem', textDecoration: 'none', borderRadius: '6px',
          '&:hover': { textDecoration: 'underline' }, '&:focus-visible': { outline: `2px solid ${C.primary}`, outlineOffset: 2 },
        }}>
          Learn more about eligibility <ArrowForwardIcon sx={{ fontSize: 16 }} aria-hidden="true" />
        </Box>
      </Box>
    </Box>
  );
}

// Decorative blood bag and drops in the checklist's corner.
function BloodBagArt() {
  return (
    <Box aria-hidden="true" sx={{ display: { xs: 'none', sm: 'block' }, position: 'absolute', right: 10, top: 64, opacity: 0.95 }}>
      <svg width="78" height="130" viewBox="0 0 78 130">
        <path d="M44 4c0 0-10 13-10 20a10 10 0 0 0 20 0c0-7-10-20-10-20Z" fill="#E11D2E" />
        <path d="M18 34c0 0-6 8-6 12a6 6 0 0 0 12 0c0-4-6-12-6-12Z" fill="#F87171" opacity="0.7" />
        <rect x="24" y="48" width="44" height="58" rx="10" fill="#FFFFFF" stroke="#FCA5A5" strokeWidth="2" />
        <rect x="28" y="66" width="36" height="36" rx="7" fill="#F43F5E" />
        <rect x="42" y="72" width="8" height="24" rx="2" fill="#FFFFFF" />
        <rect x="34" y="80" width="24" height="8" rx="2" fill="#FFFFFF" />
        <rect x="40" y="42" width="12" height="8" rx="2" fill="#FECDD3" />
        <path d="M46 106 v8 c0 8 -14 6 -14 14" fill="none" stroke="#F87171" strokeWidth="2" strokeLinecap="round" />
      </svg>
    </Box>
  );
}

// One-line help card that opens the floating BloodLife AI assistant; the contact page is the human fallback.
export function NeedHelp() {
  const isDark = useTheme().palette.mode === 'dark';
  return (
    <Box component="section" aria-labelledby="need-help-title" sx={{ ...cardSx(isDark), display: 'flex', alignItems: 'center', gap: 1.75, py: 2 }}>
      <Box aria-hidden="true" sx={tile(isDark, 48)}><HeadsetMicOutlinedIcon /></Box>
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Typography component="h2" id="need-help-title" sx={{ fontWeight: 700, fontSize: '1rem' }}>Need Help?</Typography>
        <Typography sx={{ color: 'text.secondary', fontSize: '0.84rem' }}>
          <Box component="button" type="button" onClick={openAssistant} sx={linkBtn}>Ask BloodLife AI</Box>
          {' or '}
          <Box component={Link} href="/contact" sx={linkBtn}>contact our team</Box>
        </Typography>
      </Box>
      <ChevronRightIcon aria-hidden="true" sx={{ color: 'text.disabled' }} />
    </Box>
  );
}

const linkBtn = {
  p: 0, border: 0, bgcolor: 'transparent', font: 'inherit', color: C.primary, fontWeight: 600, cursor: 'pointer', textDecoration: 'none', borderRadius: '4px',
  '&:hover': { textDecoration: 'underline' }, '&:focus-visible': { outline: `2px solid ${C.primary}`, outlineOffset: 2 },
};
