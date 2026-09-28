'use client';
import Link from 'next/link';
import { Box, Container, Typography, useTheme } from '@mui/material';
import { keyframes } from '@mui/system';
import WaterDropIcon from '@mui/icons-material/WaterDrop';
import MedicalServicesIcon from '@mui/icons-material/MedicalServices';
import GroupsIcon from '@mui/icons-material/Groups';
import MenuBookIcon from '@mui/icons-material/MenuBook';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import MonitorHeartIcon from '@mui/icons-material/MonitorHeart';
import DropHeart from '@/components/auth/DropHeart';

const fadeUp = keyframes`from { opacity: 0; transform: translateY(22px); } to { opacity: 1; transform: translateY(0); }`;

// ── Card illustrations: small flat SVGs in the site's reds, so no image files are needed ──
function BloodBagArt() {
  return (
    <svg viewBox="0 0 150 130" width="100%" aria-hidden="true">
      <rect x="96" y="6" width="18" height="6" rx="3" fill="#e5b8b8" />
      <path d="M105 12 V18" stroke="#e5b8b8" strokeWidth="3" />
      <rect x="82" y="18" width="46" height="62" rx="11" fill="#d32f2f" />
      <rect x="90" y="30" width="30" height="30" rx="6" fill="#fff" opacity="0.92" />
      <path d="M105 35c0 0-8 9-8 14a8 8 0 0 0 16 0c0-5-8-14-8-14Z" fill="#d32f2f" />
      <path d="M96 66h18M96 72h12" stroke="#fff" strokeOpacity="0.7" strokeWidth="2.5" strokeLinecap="round" />
      <path d="M105 80 C105 104 84 98 74 112" fill="none" stroke="#e57373" strokeWidth="4" strokeLinecap="round" />
      <g transform="rotate(-24 40 108)">
        <rect x="6" y="96" width="78" height="24" rx="12" fill="#f6cfc6" />
        <rect x="34" y="96" width="16" height="24" fill="#fff" opacity="0.9" />
        <path d="M42 102v12M36 108h12" stroke="#e57373" strokeWidth="2.5" strokeLinecap="round" />
      </g>
      <path d="M58 28c0 0-9 -10 -14 -3a7 7 0 0 0 4 10l10 8 10 -8a7 7 0 0 0 4 -10c-5 -7 -14 3 -14 3Z" fill="#ef9a9a" transform="translate(-12 -6) scale(.9)" />
    </svg>
  );
}

function ClipboardArt() {
  return (
    <svg viewBox="0 0 150 130" width="100%" aria-hidden="true">
      <rect x="62" y="16" width="70" height="98" rx="10" fill="#7f0000" opacity="0.35" transform="translate(8 6)" />
      <rect x="62" y="16" width="70" height="98" rx="10" fill="#fff" opacity="0.96" />
      <rect x="82" y="8" width="30" height="16" rx="6" fill="#ffcdd2" />
      <circle cx="97" cy="16" r="3.5" fill="#c62828" />
      <circle cx="97" cy="48" r="15" fill="#fdeaea" />
      <path d="M97 38c0 0-9 10-9 15a9 9 0 0 0 18 0c0-5-9-15-9-15Z" fill="#d32f2f" />
      <path d="M74 74h46M74 86h46M74 98h30" stroke="#d7b8b8" strokeWidth="4" strokeLinecap="round" />
      <path d="M74 74h6M74 86h6M74 98h6" stroke="#c62828" strokeWidth="4" strokeLinecap="round" />
    </svg>
  );
}

function PeopleArt() {
  return (
    <svg viewBox="0 0 150 130" width="100%" aria-hidden="true">
      <path d="M78 30c0 0-9 -11 -15 -3a8 8 0 0 0 4 11l11 9 11 -9a8 8 0 0 0 4 -11c-6 -8 -15 3 -15 3Z" fill="#c62828" transform="translate(-2 -14)" />
      <g fill="#ef9a9a"><circle cx="34" cy="66" r="12" /><path d="M12 112c0-16 10-26 22-26s22 10 22 26Z" /></g>
      <g fill="#e57373"><circle cx="116" cy="66" r="12" /><path d="M94 112c0-16 10-26 22-26s22 10 22 26Z" /></g>
      <g fill="#c62828"><circle cx="75" cy="56" r="14" /><path d="M50 112c0-19 11-30 25-30s25 11 25 30Z" /></g>
    </svg>
  );
}

function BookArt() {
  return (
    <svg viewBox="0 0 150 130" width="100%" aria-hidden="true">
      <g stroke="#c62828" strokeWidth="3" strokeLinecap="round">
        <path d="M75 6v8M52 14l5 6M98 14l-5 6M40 34h8M102 34h8" />
      </g>
      <path d="M75 20a20 20 0 0 0-12 36c3 3 4 6 4 10h16c0-4 1-7 4-10a20 20 0 0 0-12-36Z" fill="#ffe0e0" stroke="#c62828" strokeWidth="3" />
      <path d="M69 74h12M71 80h8" stroke="#c62828" strokeWidth="3" strokeLinecap="round" />
      <path d="M8 84 L75 96 L75 124 L8 112 Z" fill="#fff" stroke="#c62828" strokeWidth="3" strokeLinejoin="round" />
      <path d="M142 84 L75 96 L75 124 L142 112 Z" fill="#fff" stroke="#c62828" strokeWidth="3" strokeLinejoin="round" />
      <path d="M18 92l50 9M18 100l50 9M132 92l-50 9M132 100l-50 9" stroke="#e57373" strokeWidth="2.5" strokeLinecap="round" />
    </svg>
  );
}

const SERVICES = [
  { title: 'Donate Blood', desc: 'Schedule an appointment at a nearby center and donate in under an hour.', href: '/donate', icon: <WaterDropIcon />, Art: BloodBagArt },
  { title: 'Request Blood', desc: 'Submit an urgent request for a patient who needs blood now.', href: '/requests', icon: <MedicalServicesIcon />, Art: ClipboardArt, featured: true },
  { title: 'Volunteer', desc: 'Join our network of volunteers and help run donation drives.', href: '/about#team-section', icon: <GroupsIcon />, Art: PeopleArt },
  { title: 'Learn More', desc: 'Explore eligibility, blood types, and the impact of your donation.', href: '/about', icon: <MenuBookIcon />, Art: BookArt },
];

function ServiceCard({ service, index }) {
  const isDark = useTheme().palette.mode === 'dark';
  const { title, desc, href, icon, Art, featured } = service;
  return (
    <Box
      component={Link}
      href={href}
      sx={{
        position: 'relative', overflow: 'hidden', display: 'flex', flexDirection: 'column', textDecoration: 'none',
        minHeight: { xs: 250, md: 264 }, p: { xs: 3, md: 3.5 }, borderRadius: '22px',
        color: featured ? '#fff' : 'text.primary',
        background: featured ? 'linear-gradient(150deg, #d32f2f 0%, #a51212 100%)' : undefined,
        bgcolor: featured ? undefined : 'background.paper',
        border: '1px solid', borderColor: featured ? 'transparent' : isDark ? '#2a2a2a' : '#f3dede',
        boxShadow: featured ? '0 18px 44px rgba(198,40,40,0.38)' : isDark ? 'none' : '0 6px 26px rgba(120,20,20,0.06)',
        transform: featured ? { md: 'translateY(-6px)' } : 'none',
        transition: 'transform .25s ease, box-shadow .25s ease',
        animation: `${fadeUp} .5s ease ${index * 0.09}s both`,
        '&:hover': { transform: 'translateY(-10px)', boxShadow: featured ? '0 26px 60px rgba(198,40,40,0.5)' : isDark ? '0 20px 50px rgba(198,40,40,0.16)' : '0 22px 54px rgba(120,20,20,0.14)' },
        '&:hover .cta-arrow': { transform: 'translateX(5px)' },
        '&:focus-visible': { outline: '3px solid rgba(198,40,40,0.5)', outlineOffset: 3 },
      }}
    >
      {/* soft shape behind the illustration */}
      <Box aria-hidden="true" sx={{ position: 'absolute', top: '-22%', right: '-16%', width: 210, height: 210, borderRadius: '50%', bgcolor: featured ? 'rgba(255,255,255,0.09)' : isDark ? 'rgba(198,40,40,0.09)' : '#fdeeee' }} />
      <Box sx={{ position: 'absolute', top: 14, right: 14, width: { xs: 104, md: 128 }, pointerEvents: 'none' }}><Art /></Box>

      <Box sx={{
        position: 'relative', width: 64, height: 64, borderRadius: '18px', mb: 'auto', display: 'flex', alignItems: 'center', justifyContent: 'center',
        color: featured ? '#fff' : '#c62828',
        bgcolor: featured ? 'rgba(255,255,255,0.2)' : isDark ? 'rgba(198,40,40,0.16)' : '#fdeaea',
        border: '1px solid', borderColor: featured ? 'rgba(255,255,255,0.3)' : isDark ? 'rgba(198,40,40,0.25)' : '#f8d4d4',
        '& svg': { fontSize: 30 },
      }}>{icon}</Box>

      <Box sx={{ position: 'relative', mt: 6 }}>
        <Typography sx={{ fontWeight: 800, fontSize: '1.2rem', mb: 0.75 }}>{title}</Typography>
        <Typography sx={{ fontSize: '0.92rem', lineHeight: 1.65, maxWidth: 240, color: featured ? 'rgba(255,255,255,0.88)' : 'text.secondary', mb: 2.25 }}>{desc}</Typography>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.75, fontWeight: 700, fontSize: '0.92rem', color: featured ? '#fff' : '#c62828' }}>
            Get started <ArrowForwardIcon className="cta-arrow" sx={{ fontSize: 17, transition: 'transform .22s ease' }} />
          </Box>
          {featured && (
            <Box aria-hidden="true" sx={{ width: 44, height: 44, borderRadius: '50%', border: '1.5px solid rgba(255,255,255,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <ArrowForwardIcon sx={{ fontSize: 22 }} />
            </Box>
          )}
        </Box>
      </Box>
    </Box>
  );
}

export default function HelpSection() {
  const isDark = useTheme().palette.mode === 'dark';
  return (
    <Box component="section" aria-labelledby="help-title" sx={{
      position: 'relative', overflow: 'hidden', py: { xs: 8, md: 11 },
      background: isDark ? '#0f0f0f' : 'linear-gradient(180deg, #ffffff 0%, #fff5f5 60%, #fdeaea 100%)',
    }}>
      {/* faint drops in the corners */}
      <Box aria-hidden="true" sx={{ position: 'absolute', left: { xs: -20, md: 40 }, bottom: 30, opacity: isDark ? 0.08 : 0.16 }}><DropHeart size={90} heart="transparent" /></Box>
      <Box aria-hidden="true" sx={{ position: 'absolute', right: { xs: -20, md: 30 }, bottom: 70, opacity: isDark ? 0.08 : 0.18 }}><DropHeart size={70} heart="transparent" /></Box>
      <Box aria-hidden="true" sx={{ position: 'absolute', right: '-6%', top: '-25%', width: 520, height: 520, borderRadius: '50%', background: 'radial-gradient(circle, rgba(198,40,40,0.08) 0%, transparent 68%)', pointerEvents: 'none' }} />

      <Container maxWidth="lg" sx={{ position: 'relative', zIndex: 1 }}>
        <Box sx={{ textAlign: 'center', mb: { xs: 5, md: 6.5 } }}>
          <Box sx={{ display: 'inline-block', px: 2.25, py: 0.75, borderRadius: 999, mb: 2, fontWeight: 800, fontSize: '0.72rem', letterSpacing: '0.14em', color: '#c62828', bgcolor: isDark ? 'rgba(198,40,40,0.16)' : '#fdeaea' }}>
            OUR SERVICES
          </Box>
          <Typography id="help-title" component="h2" sx={{ fontWeight: 900, fontSize: { xs: '2.1rem', md: '2.9rem' }, letterSpacing: '-0.03em', lineHeight: 1.1 }}>
            How Can We <Box component="span" sx={{ color: '#c62828' }}>Help?</Box>
          </Typography>
          <Typography sx={{ color: 'text.secondary', mt: 1.5, fontSize: '1.05rem' }}>
            Choose what you need and we&apos;ll guide you through every step.
          </Typography>
        </Box>

        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', lg: 'repeat(4, 1fr)' }, gap: 3, alignItems: 'stretch' }}>
          {SERVICES.map((service, i) => <ServiceCard key={service.title} service={service} index={i} />)}
        </Box>

        {/* Closing banner: points at the community stories further down the page */}
        <Box sx={{
          mt: { xs: 5, md: 7 }, mx: 'auto', maxWidth: 1040, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 3, flexWrap: 'wrap',
          px: { xs: 3, md: 5 }, py: { xs: 2.5, md: 3 }, borderRadius: '999px', bgcolor: 'background.paper',
          border: '1px solid', borderColor: isDark ? '#2a2a2a' : '#f3dede', boxShadow: isDark ? 'none' : '0 8px 34px rgba(120,20,20,0.07)',
          '@media (max-width: 700px)': { borderRadius: '28px' },
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2.25, minWidth: 0 }}>
            <MonitorHeartIcon sx={{ fontSize: 58, color: '#c62828', flexShrink: 0 }} />
            <Box>
              <Typography sx={{ fontWeight: 800, fontSize: { xs: '1.05rem', md: '1.2rem' } }}>Together, We Can Save More Lives</Typography>
              <Typography sx={{ color: 'text.secondary', fontSize: '0.92rem' }}>Your support helps patients, families, and communities in need.</Typography>
            </Box>
          </Box>
          <Box component="a" href="#stories" sx={{
            display: 'inline-flex', alignItems: 'center', gap: 1, px: 3.5, py: 1.4, borderRadius: 999, textDecoration: 'none', fontWeight: 700, fontSize: '0.95rem', color: '#fff',
            background: 'linear-gradient(135deg, #d32f2f, #b71c1c)', boxShadow: '0 8px 22px rgba(198,40,40,0.35)', whiteSpace: 'nowrap',
            '&:hover': { boxShadow: '0 10px 28px rgba(198,40,40,0.48)' },
          }}>
            See Real Stories <ArrowForwardIcon sx={{ fontSize: 18 }} />
          </Box>
        </Box>
      </Container>
    </Box>
  );
}
