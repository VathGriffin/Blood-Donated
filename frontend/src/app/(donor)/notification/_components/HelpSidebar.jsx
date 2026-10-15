'use client';
import { useState } from 'react';
import Link from 'next/link';
import { Box, Button, Collapse, Paper, Typography } from '@mui/material';
import HeadsetMicOutlinedIcon from '@mui/icons-material/HeadsetMicOutlined';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import MenuBookOutlinedIcon from '@mui/icons-material/MenuBookOutlined';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import MailOutlineIcon from '@mui/icons-material/MailOutline';
import PhoneOutlinedIcon from '@mui/icons-material/PhoneOutlined';
import PlaceOutlinedIcon from '@mui/icons-material/PlaceOutlined';
import { cardSx } from '@/components/donor/ui';
import { CONTACT } from '@/lib/contact';

// Short answers describing how the existing pages work, each with a link to that page.
const FAQ = [
  { q: 'How to book an appointment?', href: '/appointments', link: 'Book an appointment',
    a: 'Open Book Appointment, choose a donation center, pick a date and a free time slot, then confirm your details. Your booking appears under Appointment.' },
  { q: 'How to request blood?', href: '/requests', link: 'New blood request',
    a: 'Fill in the request form with the hospital, patient, blood type, units and urgency. The hospital team reviews it, and you can follow its status under Blood Request.' },
  { q: 'How to update my profile?', href: '/profile', link: 'Go to My Profile',
    a: 'On My Profile, use Edit Profile to change your name or phone number, or the camera button to change your photo.' },
  { q: 'How to get my QR card?', href: '/qr-card', link: 'Open My QR Card',
    a: 'My QR Card shows your personal donor code. Show it at the donation center so staff can check you in quickly.' },
  { q: 'How to contact a hospital?', href: '/my-requests', link: 'See my requests',
    a: 'Each blood request and appointment has a Contact action when the hospital has a phone number listed. You can also message our team here.' },
];

function FaqItem({ item, open, onToggle, id }) {
  return (
    <Box sx={{ borderBottom: '1px solid', borderColor: 'divider', '&:last-of-type': { borderBottom: 0 } }}>
      <Box component="button" type="button" onClick={onToggle} aria-expanded={open} aria-controls={`${id}-panel`} id={`${id}-btn`}
        sx={{
          width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1, py: 1.25, px: 0,
          border: 0, bgcolor: 'transparent', color: 'text.primary', font: 'inherit', fontSize: '0.9rem', textAlign: 'left', cursor: 'pointer',
          '&:hover': { color: 'primary.main' },
          '&:focus-visible': { outline: '2px solid', outlineColor: 'primary.main', outlineOffset: 2, borderRadius: '6px' },
        }}>
        {item.q}
        <ExpandMoreIcon aria-hidden="true" sx={{ fontSize: 20, color: 'text.secondary', transition: 'transform .2s', transform: open ? 'rotate(180deg)' : 'none' }} />
      </Box>
      <Collapse in={open} id={`${id}-panel`} role="region" aria-labelledby={`${id}-btn`}>
        <Typography variant="body2" color="text.secondary" sx={{ pb: 1 }}>{item.a}</Typography>
        <Button component={Link} href={item.href} size="small" endIcon={<ArrowForwardIcon />} sx={{ mb: 1.25, px: 0, minWidth: 0 }}>
          {item.link}
        </Button>
      </Collapse>
    </Box>
  );
}

function ContactLine({ icon, href, value, caption }) {
  const Inner = (
    <>
      <Box aria-hidden="true" sx={{ display: 'flex', color: 'primary.main', mt: '2px', '& svg': { fontSize: 21 } }}>{icon}</Box>
      <Box sx={{ minWidth: 0 }}>
        <Typography sx={{ fontWeight: 700, fontSize: '0.9rem', overflowWrap: 'anywhere', color: 'text.primary' }}>{value}</Typography>
        <Typography variant="body2" color="text.secondary">{caption}</Typography>
      </Box>
    </>
  );
  const sx = { display: 'flex', gap: 1.5, alignItems: 'flex-start', py: 1, textDecoration: 'none', borderRadius: '8px',
    '&:focus-visible': { outline: '2px solid', outlineColor: 'primary.main', outlineOffset: 2 } };
  return href ? <Box component="a" href={href} sx={{ ...sx, '&:hover p:first-of-type': { color: 'primary.main' } }}>{Inner}</Box> : <Box sx={sx}>{Inner}</Box>;
}

/** Right-hand help column: support info, common questions and contact methods (from lib/contact). */
export default function HelpSidebar() {
  const [openIdx, setOpenIdx] = useState(null);
  return (
    <Box component="aside" aria-label="Help" sx={{ display: 'flex', flexDirection: 'column', gap: 2, minWidth: 0 }}>
      <Paper elevation={0} sx={{ ...cardSx, p: 2.5 }}>
        <Box sx={{ display: 'flex', gap: 1.5 }}>
          <HeadsetMicOutlinedIcon aria-hidden="true" sx={{ color: 'primary.main', fontSize: 30 }} />
          <Box>
            <Typography component="h2" sx={{ fontWeight: 800, fontSize: '1.02rem' }}>Need Help?</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.25 }}>
              Our support team answers questions about BloodLife AI — appointments, requests and your account.
            </Typography>
          </Box>
        </Box>
        <Box sx={{ mt: 2, p: 1.5, borderRadius: '12px', display: 'flex', gap: 1.25, bgcolor: (t) => t.custom.tones.primary.bg }}>
          <AccessTimeIcon aria-hidden="true" sx={{ color: 'primary.main', fontSize: 22, mt: '1px' }} />
          <Box>
            <Typography sx={{ fontWeight: 700, fontSize: '0.88rem', color: 'primary.main' }}>Office Hours</Typography>
            <Typography variant="body2" color="text.secondary">{CONTACT.hours}</Typography>
          </Box>
        </Box>
      </Paper>

      <Paper elevation={0} sx={{ ...cardSx, p: 2.5 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25, mb: 0.75 }}>
          <MenuBookOutlinedIcon aria-hidden="true" sx={{ color: 'primary.main', fontSize: 26 }} />
          <Typography component="h2" sx={{ fontWeight: 800, fontSize: '1.02rem' }}>Common Questions</Typography>
        </Box>
        {FAQ.map((item, i) => (
          <FaqItem key={item.q} item={item} id={`faq-${i}`} open={openIdx === i} onToggle={() => setOpenIdx(openIdx === i ? null : i)} />
        ))}
        <Button component={Link} href="/assistant" endIcon={<ArrowForwardIcon />} sx={{ mt: 1, px: 0, fontWeight: 700 }}>
          Ask the AI Assistant
        </Button>
      </Paper>

      <Paper elevation={0} sx={{ ...cardSx, p: 2.5 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25, mb: 0.75 }}>
          <MailOutlineIcon aria-hidden="true" sx={{ color: 'primary.main', fontSize: 26 }} />
          <Typography component="h2" sx={{ fontWeight: 800, fontSize: '1.02rem' }}>Other Contact Methods</Typography>
        </Box>
        <ContactLine icon={<MailOutlineIcon />} href={`mailto:${CONTACT.email}`} value={CONTACT.email} caption="Email us" />
        <ContactLine icon={<PhoneOutlinedIcon />} href={CONTACT.phoneHref} value={CONTACT.phoneDisplay} caption={`Phone support · ${CONTACT.hours}`} />
        <ContactLine icon={<PlaceOutlinedIcon />} value={CONTACT.address} caption="Our office address" />
      </Paper>
    </Box>
  );
}
