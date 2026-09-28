'use client';
import Link from 'next/link';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Box, Container, Typography, IconButton, Tooltip, useTheme } from '@mui/material';
import { keyframes } from '@mui/system';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import FavoriteIcon from '@mui/icons-material/Favorite';
import WaterDropIcon from '@mui/icons-material/WaterDrop';
import GroupsIcon from '@mui/icons-material/Groups';
import LocalHospitalIcon from '@mui/icons-material/LocalHospital';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import CampaignIcon from '@mui/icons-material/Campaign';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import PlaceIcon from '@mui/icons-material/Place';
import FormatQuoteIcon from '@mui/icons-material/FormatQuote';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import API_BASE from '@/lib/config';

const fadeUp = keyframes`from { opacity: 0; transform: translateY(24px); } to { opacity: 1; transform: translateY(0); }`;
const GAP_PX = 24;

// The badge text is free-form (admin-edited), so pick the card's kind — icon and stat row — by keyword.
const profileKind = (badge = '') => {
  const b = badge.toLowerCase();
  if (/(medical|partner|doctor|hospital|clinic|health)/.test(b)) return 'partner';
  if (/(champion|community|volunteer|advocate)/.test(b)) return 'volunteer';
  return 'donor';
};

const KIND_ICON = { donor: <WaterDropIcon />, volunteer: <GroupsIcon />, partner: <LocalHospitalIcon /> };

// Stats per kind. The profile's own numbers are used where the model stores them; the rest is demo copy.
const kindStats = (kind, p) => {
  if (kind === 'volunteer') return [
    { icon: <CampaignIcon />, value: p.donations ?? 0, label: 'Campaigns' },
    { icon: <GroupsIcon />, value: '120+', label: 'People Reached' },
    { icon: <AccessTimeIcon />, value: '1 Year', label: 'Active Volunteer' },
  ];
  if (kind === 'partner') return [
    { icon: <LocalHospitalIcon />, value: p.donations ?? 0, label: 'Hospital Requests' },
    { icon: <WaterDropIcon />, value: p.bloodType || '—', label: 'Commonly Needed' },
    { icon: <GroupsIcon />, value: '50+', label: 'Patients Supported' },
  ];
  return [
    { icon: <FavoriteIcon />, value: p.donations ?? 0, label: 'Donations' },
    { icon: <CalendarMonthIcon />, value: '12 Mar 2025', label: 'Last Donation' },
    { icon: <WaterDropIcon />, value: p.bloodType || '—', label: 'Blood Type' },
  ];
};

const photoUrl = (photo) => (photo ? (photo.startsWith('http') ? photo : `${API_BASE}${photo}`) : null);

function Stat({ icon, value, label }) {
  return (
    <Box sx={{ flex: 1, minWidth: 0, display: 'flex', alignItems: 'center', gap: 0.875, px: { xs: 0.75, xl: 1.25 }, '&:first-of-type': { pl: 0 } }}>
      <Box sx={{ display: 'flex', color: '#e53935', flexShrink: 0, '& svg': { fontSize: 24 } }}>{icon}</Box>
      <Box sx={{ minWidth: 0 }}>
        <Typography sx={{ fontSize: '0.98rem', fontWeight: 800, lineHeight: 1.2, color: 'text.primary', whiteSpace: { xs: 'normal', sm: 'nowrap' } }}>{value}</Typography>
        <Typography sx={{ fontSize: '0.7rem', lineHeight: 1.3, color: 'text.secondary', mt: 0.25 }}>{label}</Typography>
      </Box>
    </Box>
  );
}

function ProfileCard({ profile, index }) {
  const isDark = useTheme().palette.mode === 'dark';
  const kind = profileKind(profile.badge);
  const photo = photoUrl(profile.photo);
  const line = isDark ? '#2a2a2a' : '#f1e4e4';
  const stats = kindStats(kind, profile);
  return (
    <Box component="article" sx={{
      flex: { xs: '0 0 88%', sm: `0 0 calc((100% - ${GAP_PX}px) / 2)`, lg: `0 0 calc((100% - ${GAP_PX * 2}px) / 3)` },
      scrollSnapAlign: 'start', minWidth: 0, position: 'relative', display: 'flex', flexDirection: 'column',
      borderRadius: '20px', p: { xs: 2.5, md: 3 }, bgcolor: 'background.paper',
      border: '1px solid', borderColor: isDark ? '#2a2a2a' : '#f6e6e6',
      boxShadow: isDark ? 'none' : '0 10px 34px rgba(120,20,20,0.07)',
      transition: 'transform .25s ease, box-shadow .25s ease',
      animation: `${fadeUp} .6s ease ${index * 0.1}s both`,
      '&:hover': { transform: 'translateY(-4px)', boxShadow: '0 20px 48px rgba(229,57,53,0.16)' },
    }}>
      <Tooltip title="Sample profile for demonstration — not a real person" arrow>
        <Box sx={{
          position: 'absolute', top: 18, right: 18, display: 'inline-flex', alignItems: 'center', gap: 0.75,
          px: 1.5, py: 0.5, borderRadius: 999, fontSize: '0.75rem', color: '#c62828',
          bgcolor: isDark ? 'rgba(198,40,40,0.16)' : '#fdeeee', '& svg': { fontSize: 16 },
        }}>
          Demo Profile <InfoOutlinedIcon />
        </Box>
      </Tooltip>

      {/* Header: round photo beside the badge, name, role, and location */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 2, md: 2.5 }, mt: 3.5 }}>
        <Box sx={{
          width: { xs: 96, md: 128 }, height: { xs: 96, md: 128 }, flexShrink: 0, borderRadius: '50%', overflow: 'hidden',
          display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 900, fontSize: '1.8rem',
          background: 'linear-gradient(135deg, #e53935, #c62828)',
          border: '4px solid', borderColor: isDark ? '#3a1d1d' : '#fde3e3',
        }}>
          {photo
            ? <Box component="img" src={photo} alt={profile.name} loading="lazy" sx={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
            : profile.initials}
        </Box>
        <Box sx={{ minWidth: 0 }}>
          {profile.badge && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1, flexWrap: 'wrap' }}>
              <Box aria-hidden="true" sx={{ width: 34, height: 34, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: '#e53935', color: '#fff', '& svg': { fontSize: 19 } }}>
                {KIND_ICON[kind]}
              </Box>
              <Box sx={{ px: 1.5, py: 0.5, borderRadius: 999, fontSize: '0.8rem', fontWeight: 700, color: '#c62828', bgcolor: isDark ? 'rgba(198,40,40,0.16)' : '#fdeaea' }}>
                {profile.badge}
              </Box>
            </Box>
          )}
          <Typography component="h3" sx={{ fontWeight: 900, fontSize: { xs: '1.2rem', md: '1.4rem' }, letterSpacing: '-0.01em', lineHeight: 1.2 }}>{profile.name}</Typography>
          <Typography sx={{ color: 'text.secondary', fontSize: '0.86rem', mt: 0.5 }}>{profile.role}</Typography>
          {profile.location && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.75, color: 'text.primary' }}>
              <PlaceIcon sx={{ fontSize: 18, color: 'text.secondary' }} />
              <Typography sx={{ fontSize: '0.86rem', fontWeight: 600 }}>{profile.location}</Typography>
            </Box>
          )}
        </Box>
      </Box>

      <Typography sx={{ color: 'text.secondary', fontSize: '0.92rem', lineHeight: 1.7, mt: 2.5, flexGrow: 1 }}>{profile.bio}</Typography>

      <Box sx={{ display: 'flex', mt: 2.5, pt: 2.25, borderTop: '1px solid', borderColor: line, '& > * + *': { borderLeft: '1px solid', borderColor: line } }}>
        {stats.map((s) => <Stat key={s.label} {...s} />)}
      </Box>

      {profile.quote && (
        <Box sx={{ display: 'flex', gap: 1.5, mt: 2.5, px: 2.5, py: 2, borderRadius: '14px', bgcolor: isDark ? 'rgba(198,40,40,0.1)' : '#fdf1f1' }}>
          <FormatQuoteIcon aria-hidden="true" sx={{ color: '#e53935', fontSize: 28, transform: 'scaleX(-1)', flexShrink: 0 }} />
          <Typography component="blockquote" sx={{ m: 0, fontStyle: 'italic', fontSize: '0.92rem', lineHeight: 1.6, color: 'text.primary' }}>
            {profile.quote}
          </Typography>
        </Box>
      )}
    </Box>
  );
}

export default function CommunitySection({ profiles }) {
  const isDark = useTheme().palette.mode === 'dark';
  const trackRef = useRef(null);
  const [scroll, setScroll] = useState({ canPrev: false, canNext: false });

  const measure = useCallback(() => {
    const el = trackRef.current;
    if (!el || !el.firstElementChild) return;
    setScroll({
      canPrev: el.scrollLeft > 4,
      canNext: el.scrollLeft < el.scrollWidth - el.clientWidth - 4,
    });
  }, []);

  useEffect(() => {
    const el = trackRef.current;
    if (!el) return undefined;
    measure();
    el.addEventListener('scroll', measure, { passive: true });
    const observer = new ResizeObserver(measure);
    observer.observe(el);
    return () => { el.removeEventListener('scroll', measure); observer.disconnect(); };
  }, [measure, profiles.length]);

  const move = (direction) => {
    const el = trackRef.current;
    if (!el?.firstElementChild) return;
    el.scrollBy({ left: direction * (el.firstElementChild.offsetWidth + GAP_PX), behavior: 'smooth' });
  };

  const arrow = (side) => ({
    position: 'absolute', top: '46%', [side]: { xs: 4, lg: -22 }, zIndex: 3, width: 46, height: 46,
    bgcolor: 'background.paper', color: '#e53935', border: '1px solid', borderColor: isDark ? '#333' : '#f3dede',
    boxShadow: '0 6px 20px rgba(120,20,20,0.16)', '&:hover': { bgcolor: isDark ? '#222' : '#fff5f5' },
  });

  return (
    <Box id="stories" component="section" aria-labelledby="community-title" sx={{
      position: 'relative', overflow: 'hidden', py: { xs: 8, md: 11 }, scrollMarginTop: '72px',
      background: isDark ? '#0f0f0f' : 'linear-gradient(180deg, #fffafa 0%, #fff3f3 55%, #fde9e9 100%)',
    }}>
      {/* decoration: a heart and heartbeat trace on the left, a large drop with a cross on the right */}
      <Box aria-hidden="true" sx={{ position: 'absolute', left: '4%', top: 90, display: { xs: 'none', lg: 'block' }, opacity: isDark ? 0.25 : 1 }}>
        <svg width="300" height="120" viewBox="0 0 300 120" fill="none" stroke="#f3b4b4" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
          <path d="M42 96 C10 72 4 50 14 34 C24 18 44 20 52 36 C60 20 80 18 90 34 C100 50 94 72 62 96 L52 104 Z" />
          <path d="M96 64 H150 l8 -18 l12 54 l12 -80 l12 64 l8 -20 H300" />
        </svg>
      </Box>
      <Box aria-hidden="true" sx={{ position: 'absolute', right: '-2%', top: 40, display: { xs: 'none', lg: 'block' }, opacity: isDark ? 0.12 : 1 }}>
        <svg width="320" height="300" viewBox="0 0 320 300" fill="none">
          <path d="M200 0 C170 60 90 130 90 200 C90 262 140 300 200 300 C260 300 310 262 310 200 C310 130 230 60 200 0 Z" fill="#fbd9d9" opacity="0.7" />
          <circle cx="110" cy="230" r="80" fill="#fbe0e0" opacity="0.8" />
          <path d="M200 160 v70 M165 195 h70" stroke="#fff" strokeWidth="26" strokeLinecap="square" opacity="0.9" />
        </svg>
      </Box>

      <Container maxWidth="xl" sx={{ position: 'relative', zIndex: 1 }}>
        <Box sx={{ textAlign: 'center', mb: { xs: 5, md: 6.5 } }}>
          <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 1, px: 2.25, py: 0.75, borderRadius: 999, mb: 2, fontWeight: 800, fontSize: '0.78rem', letterSpacing: '0.1em', color: '#c62828', bgcolor: isDark ? 'rgba(198,40,40,0.16)' : '#fde3e3', '& svg': { fontSize: 18 } }}>
            <GroupsIcon /> OUR COMMUNITY
          </Box>
          <Typography id="community-title" component="h2" sx={{ fontWeight: 900, fontSize: { xs: '2.1rem', md: '3.4rem' }, letterSpacing: '-0.03em', lineHeight: 1.1 }}>
            People Behind <Box component="span" sx={{ color: '#c62828' }}>the Mission</Box>
          </Typography>
          <Typography sx={{ color: 'text.secondary', mt: 2, fontSize: { xs: '1rem', md: '1.1rem' }, maxWidth: 820, mx: 'auto', lineHeight: 1.65 }}>
            BloodLife AI is made possible by a community of blood donors, volunteers, and healthcare partners who share
            the same goal — saving lives and building a healthier tomorrow.
          </Typography>
        </Box>

        <Box sx={{ position: 'relative' }}>
          {scroll.canPrev && <IconButton aria-label="Previous stories" onClick={() => move(-1)} sx={arrow('left')}><ChevronLeftIcon /></IconButton>}
          {scroll.canNext && <IconButton aria-label="Next stories" onClick={() => move(1)} sx={arrow('right')}><ChevronRightIcon /></IconButton>}

          <Box ref={trackRef} sx={{
            // Generous padding (cancelled by the negative margins) so the cards' glow and hover lift aren't sliced off
            // by the scroll container's overflow clipping.
            display: 'flex', gap: `${GAP_PX}px`, overflowX: 'auto', scrollSnapType: 'x mandatory', scrollPaddingLeft: '32px',
            pt: 3, pb: 8, px: 4, mx: -4, mb: -5,
            // soft fade at both ends: hides the next card's sliver and hints there is more to scroll
            WebkitMaskImage: 'linear-gradient(to right, transparent 0, #000 30px, #000 calc(100% - 30px), transparent 100%)',
            maskImage: 'linear-gradient(to right, transparent 0, #000 30px, #000 calc(100% - 30px), transparent 100%)',
            scrollbarWidth: 'none', '&::-webkit-scrollbar': { display: 'none' },
          }}>
            {profiles.map((profile, i) => <ProfileCard key={profile._id || profile.name} profile={profile} index={i} />)}
          </Box>
        </Box>

        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'flex-start', gap: 1.25, mt: { xs: 2, md: 3 }, px: 2 }}>
          <InfoOutlinedIcon aria-hidden="true" sx={{ fontSize: 20, color: 'text.secondary', mt: '1px' }} />
          <Typography sx={{ fontSize: '0.82rem', color: 'text.secondary', lineHeight: 1.6 }}>
            <Box component="strong" sx={{ color: 'text.primary' }}>Note:</Box> The profiles above are sample/demo data used for demonstration purposes only.
            <Box component="br" sx={{ display: { xs: 'none', md: 'block' } }} /> They do not represent real individuals or actual medical professionals/donors.
          </Typography>
        </Box>

        <Box sx={{ textAlign: 'center', mt: { xs: 3, md: 4 } }}>
          <Box component={Link} href="/register" sx={{
            display: 'inline-flex', alignItems: 'center', gap: 1.25, px: 4.5, py: 1.7, borderRadius: '14px', textDecoration: 'none', color: '#fff', fontWeight: 800, fontSize: '1.02rem',
            background: 'linear-gradient(135deg, #e53935, #c62828)', boxShadow: '0 12px 30px rgba(198,40,40,0.36)', transition: 'transform .2s, box-shadow .2s',
            '&:hover': { transform: 'translateY(-2px)', boxShadow: '0 16px 38px rgba(198,40,40,0.46)' },
          }}>
            <GroupsIcon /> Join Our Community <ArrowForwardIcon sx={{ fontSize: 20 }} />
          </Box>
        </Box>
      </Container>
    </Box>
  );
}
