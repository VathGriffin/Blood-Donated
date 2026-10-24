'use client';
import { useState } from 'react';
import Link from 'next/link';
import { Box, Typography } from '@mui/material';
import ErrorIcon from '@mui/icons-material/Error';
import CampaignOutlinedIcon from '@mui/icons-material/CampaignOutlined';
import WaterDropOutlinedIcon from '@mui/icons-material/WaterDropOutlined';
import LightbulbOutlinedIcon from '@mui/icons-material/LightbulbOutlined';
import BadgeOutlinedIcon from '@mui/icons-material/BadgeOutlined';
import BloodtypeOutlinedIcon from '@mui/icons-material/BloodtypeOutlined';
import SpeedOutlinedIcon from '@mui/icons-material/SpeedOutlined';
import EventOutlinedIcon from '@mui/icons-material/EventOutlined';
import MedicalInformationOutlinedIcon from '@mui/icons-material/MedicalInformationOutlined';
import ContactPhoneOutlinedIcon from '@mui/icons-material/ContactPhoneOutlined';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import PhoneOutlinedIcon from '@mui/icons-material/PhoneOutlined';
import HeartArt from '@/components/donor/HeartArt';
import { BLOOD_TYPES } from '@/lib/inventory';
import { RECEIVES_FROM } from '@/lib/blood-compat';

export const panelSx = {
  bgcolor: 'background.paper', borderRadius: '16px', border: '1px solid', borderColor: 'divider',
  boxShadow: (t) => t.custom.shadow.xs, p: { xs: 2, sm: 2.5 },
};

function PanelTitle({ id, icon, children, sub }) {
  return (
    <Box sx={{ display: 'flex', gap: 1.25, alignItems: 'flex-start', mb: 2 }}>
      <Box aria-hidden="true" sx={{ color: 'primary.main', display: 'flex', mt: '2px', '& svg': { fontSize: 22 } }}>{icon}</Box>
      <Box>
        <Typography id={id} component="h2" sx={{ fontWeight: 800, fontSize: '1.02rem', lineHeight: 1.3 }}>{children}</Typography>
        {sub && <Typography sx={{ fontSize: '0.8rem', color: 'text.secondary', mt: 0.25 }}>{sub}</Typography>}
      </Box>
    </Box>
  );
}

export function LifeBanner() {
  return (
    <Box component="section" aria-labelledby="life-banner-title" sx={{
      position: 'relative', overflow: 'hidden', borderRadius: '16px', minHeight: { xs: 150, sm: 150 },
      border: '1px solid', borderColor: 'divider', boxShadow: (t) => t.custom.shadow.sm,
      background: (t) => (t.palette.mode === 'dark'
        ? 'linear-gradient(100deg, #161616 0%, #1d1415 55%, #3a1018 100%)'
        : 'linear-gradient(100deg, #FFFFFF 0%, #FFF5F6 50%, #FBD5DB 100%)'),
      px: { xs: 2.5, sm: 3.5 }, py: { xs: 2.5, sm: 2.75 },
    }}>
      {/* red sweep along the bottom-right corner, like the reference */}
      <Box aria-hidden="true" component="svg" viewBox="0 0 400 120" preserveAspectRatio="none"
        sx={{ position: 'absolute', right: 0, bottom: 0, width: { xs: '70%', sm: '55%' }, height: '60%' }}>
        <path d="M0 120 C 120 110, 220 60, 400 20 V120 Z" fill="#D71920" opacity="0.92" />
        <path d="M60 120 C 170 100, 260 70, 400 50 V120 Z" fill="#B91C2C" opacity="0.6" />
      </Box>
      <Box aria-hidden="true" sx={{
        position: 'absolute', right: { xs: -30, sm: 10 }, top: { xs: 10, sm: 0 }, width: { xs: 170, sm: 240 }, height: { xs: 110, sm: 150 },
        opacity: { xs: 0.35, sm: 1 },
      }}>
        <HeartArt idPrefix="req-banner" />
      </Box>
      <Box sx={{ position: 'relative', maxWidth: { xs: '100%', sm: '62%' } }}>
        <Typography id="life-banner-title" component="h2" sx={{ fontWeight: 800, fontSize: { xs: '1.35rem', sm: '1.6rem' }, lineHeight: 1.15, letterSpacing: '-0.02em' }}>
          Your Request<br />
          <Box component="span" sx={{ color: 'primary.main', fontSize: { xs: '1.6rem', sm: '1.95rem' } }}>Can Save a Life</Box>
        </Typography>
        <Typography sx={{ mt: 1, color: 'text.secondary', fontSize: '0.9rem', lineHeight: 1.6 }}>
          Help patients get the blood they need. Accurate information helps the hospital respond faster.
        </Typography>
      </Box>
    </Box>
  );
}

export function ImportantNotice({ hospital }) {
  const tel = hospital?.phone ? `tel:${hospital.phone.replace(/[^\d+]/g, '')}` : null;
  return (
    <Box component="section" aria-labelledby="notice-title" sx={{
      position: 'relative', overflow: 'hidden', borderRadius: '16px', p: { xs: 2, sm: 2.5 }, pr: { sm: 12 },
      bgcolor: (t) => t.custom.tones.primary.bg, border: '1px solid', borderColor: (t) => (t.palette.mode === 'dark' ? 'rgba(215,25,32,0.3)' : '#F6CDD2'),
    }}>
      <CampaignOutlinedIcon aria-hidden="true" sx={{
        position: 'absolute', right: 20, top: '50%', transform: 'translateY(-50%) rotate(-12deg)', fontSize: 84,
        color: 'primary.main', opacity: 0.12, display: { xs: 'none', sm: 'block' },
      }} />
      <Box sx={{ display: 'flex', gap: 1.5 }}>
        <ErrorIcon aria-hidden="true" sx={{ color: 'primary.main', fontSize: 28, flexShrink: 0 }} />
        <Box>
          <Typography id="notice-title" component="h2" sx={{ fontWeight: 800, color: 'primary.main', fontSize: '1rem' }}>Important Notice</Typography>
          <Box component="ul" sx={{ m: 0, mt: 0.75, pl: 2.25, '& li': { fontSize: '0.86rem', lineHeight: 1.6, color: 'text.primary', '&::marker': { color: 'primary.main' } } }}>
            <li>Please provide accurate information so the hospital can review your request quickly.</li>
            <li>The hospital will review the request and contact you to confirm.</li>
            <li>
              In an emergency, call the hospital directly — don&apos;t wait for a reply here.
              {tel && (
                <Box component="a" href={tel} sx={{ ml: 0.75, color: 'primary.main', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: 0.4, whiteSpace: 'nowrap' }}>
                  <PhoneOutlinedIcon aria-hidden="true" sx={{ fontSize: 16 }} />Call {hospital.name}
                </Box>
              )}
            </li>
          </Box>
        </Box>
      </Box>
    </Box>
  );
}

// Red-cell compatibility for the eight ABO/Rh groups. Picking a tile shows which donor groups
// that patient can receive red cells from — with a clear note that the hospital confirms it.
export function BloodTypeInfo({ selected }) {
  const [picked, setPicked] = useState(null);
  const active = picked || selected || 'O+';
  const donors = RECEIVES_FROM[active] || [];
  const note = { 'O-': 'Universal red-cell donor', 'AB+': 'Universal red-cell recipient' };
  return (
    <Box component="section" aria-labelledby="bt-info-title" sx={panelSx}>
      <PanelTitle id="bt-info-title" icon={<WaterDropOutlinedIcon />} sub="Tap a group to see who can give red cells to it">
        Blood Type Information
      </PanelTitle>
      <Box role="radiogroup" aria-labelledby="bt-info-title" sx={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 1 }}>
        {BLOOD_TYPES.map((t) => {
          const isActive = t === active;
          const canGive = donors.includes(t);
          return (
            <Box key={t} component="button" type="button" role="radio" aria-checked={isActive} onClick={() => setPicked(t)}
              sx={{
                all: 'unset', boxSizing: 'border-box', cursor: 'pointer', textAlign: 'center', borderRadius: '10px',
                py: 1.1, px: 0.5, minHeight: 58, display: 'flex', flexDirection: 'column', justifyContent: 'center',
                border: '1.5px solid', borderColor: isActive ? 'primary.main' : 'transparent',
                bgcolor: (th) => (isActive ? th.custom.tones.primary.bg : canGive ? th.custom.tones.success.bg : th.custom.surface.subtle),
                color: isActive ? 'primary.main' : canGive ? (th) => th.custom.tones.success.fg : 'text.secondary',
                transition: 'background-color .15s, border-color .15s',
                '&:hover': { borderColor: 'primary.main' },
                '&:focus-visible': { outline: '2px solid', outlineColor: 'primary.main', outlineOffset: 2 },
              }}>
              <Typography component="span" sx={{ fontWeight: 800, fontSize: '1.05rem', lineHeight: 1.2 }}>{t}</Typography>
              {note[t] && <Typography component="span" sx={{ fontSize: '0.6rem', fontWeight: 600, lineHeight: 1.2, mt: 0.25 }}>{note[t]}</Typography>}
            </Box>
          );
        })}
      </Box>
      <Typography aria-live="polite" sx={{ mt: 1.5, fontSize: '0.84rem' }}>
        <Box component="strong">{active}</Box> patients can receive red cells from{' '}
        <Box component="strong" sx={{ color: (t) => t.custom.tones.success.fg }}>{donors.join(', ')}</Box>.
      </Typography>
      <Typography sx={{ mt: 0.75, fontSize: '0.74rem', color: 'text.secondary', lineHeight: 1.5 }}>
        A general guide to red-cell compatibility only. Plasma and platelets follow different rules, and the hospital
        always confirms compatibility with its own tests.
      </Typography>
      <Box component={Link} href="/donors" sx={{ mt: 1.25, display: 'inline-flex', alignItems: 'center', gap: 0.5, color: 'primary.main', fontWeight: 700, fontSize: '0.86rem', textDecoration: 'none', '&:hover': { textDecoration: 'underline' } }}>
        Find compatible donors <ArrowForwardIcon aria-hidden="true" sx={{ fontSize: 17 }} />
      </Box>
    </Box>
  );
}

const TIPS = [
  { icon: <BadgeOutlinedIcon />, text: 'Provide accurate patient information' },
  { icon: <BloodtypeOutlinedIcon />, text: 'Select the correct blood type and component' },
  { icon: <SpeedOutlinedIcon />, text: 'Choose the appropriate urgency level' },
  { icon: <EventOutlinedIcon />, text: 'Specify the required date and time' },
  { icon: <MedicalInformationOutlinedIcon />, text: 'Include a clear medical reason' },
  { icon: <ContactPhoneOutlinedIcon />, text: 'Keep your contact number up to date' },
];

export function Tips() {
  return (
    <Box component="section" aria-labelledby="tips-title" sx={panelSx}>
      <PanelTitle id="tips-title" icon={<LightbulbOutlinedIcon />}>Tips for a Successful Request</PanelTitle>
      <Box component="ul" sx={{ listStyle: 'none', m: 0, p: 0, display: 'flex', flexDirection: 'column', gap: 1.25 }}>
        {TIPS.map((tip) => (
          <Box component="li" key={tip.text} sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Box aria-hidden="true" sx={{
              width: 32, height: 32, borderRadius: '50%', flexShrink: 0, display: 'grid', placeItems: 'center',
              bgcolor: (t) => t.custom.tones.primary.bg, color: 'primary.main', '& svg': { fontSize: 18 },
            }}>
              {tip.icon}
            </Box>
            <Typography sx={{ fontSize: '0.86rem' }}>{tip.text}</Typography>
          </Box>
        ))}
      </Box>
    </Box>
  );
}
