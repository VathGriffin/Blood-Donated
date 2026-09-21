'use client';
import Link from 'next/link';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Box, Container, Typography, IconButton, useTheme } from '@mui/material';
import { keyframes } from '@mui/system';
import { Caveat } from 'next/font/google';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import FavoriteIcon from '@mui/icons-material/Favorite';
import WaterDropIcon from '@mui/icons-material/WaterDrop';
import GroupsIcon from '@mui/icons-material/Groups';
import LocalHospitalIcon from '@mui/icons-material/LocalHospital';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import DropHeart from '@/components/auth/DropHeart';
import API_BASE from '@/lib/config';

const script = Caveat({ subsets: ['latin'], weight: ['600', '700'], display: 'swap' });
const fadeUp = keyframes`from { opacity: 0; transform: translateY(24px); } to { opacity: 1; transform: translateY(0); }`;
const GAP_PX = 24;

// The badge text is free-form (admin-edited), so pick its icon by keyword.
const badgeIcon = (badge = '') => {
  const b = badge.toLowerCase();
  if (/(medical|partner|doctor|hospital|clinic)/.test(b)) return <LocalHospitalIcon />;
  if (/(champion|community|volunteer|advocate)/.test(b)) return <GroupsIcon />;
  if (/(donor|blood)/.test(b)) return <WaterDropIcon />;
  return <FavoriteIcon />;
};

const photoUrl = (photo) => (photo ? (photo.startsWith('http') ? photo : `${API_BASE}${photo}`) : null);

function Stat({ icon, value, label, color }) {
  return (
    <Box sx={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1.25 }}>
      <Box sx={{ display: 'flex', color, '& svg': { fontSize: 26 } }}>{icon}</Box>
      <Box sx={{ textAlign: 'left' }}>
        <Typography sx={{ fontSize: '1.45rem', fontWeight: 900, lineHeight: 1, color }}>{value}</Typography>
        <Typography sx={{ fontSize: '0.72rem', color: 'text.secondary', mt: 0.25 }}>{label}</Typography>
      </Box>
    </Box>
  );
}

function ProfileCard({ profile, index, active }) {
  const isDark = useTheme().palette.mode === 'dark';
  const color = profile.color || '#c62828';
  const photo = photoUrl(profile.photo);
  return (
    <Box component="article" sx={{
      flex: { xs: '0 0 86%', sm: `0 0 calc((100% - ${GAP_PX}px) / 2)`, md: `0 0 calc((100% - ${GAP_PX * 2}px) / 3)` },
      scrollSnapAlign: 'start', minWidth: 0, borderRadius: '24px', overflow: 'hidden', textAlign: 'center',
      bgcolor: 'background.paper', border: '1.5px solid',
      borderColor: active ? '#e53935' : isDark ? '#2a2a2a' : '#f3dede',
      boxShadow: active ? '0 20px 54px rgba(229,57,53,0.22)' : isDark ? 'none' : '0 8px 30px rgba(120,20,20,0.07)',
      transition: 'transform .25s ease, box-shadow .25s ease, border-color .25s ease',
      animation: `${fadeUp} .6s ease ${index * 0.1}s both`,
      '&:hover': { transform: 'translateY(-6px)', borderColor: '#e53935', boxShadow: '0 24px 60px rgba(229,57,53,0.26)' },
    }}>
      {/* Cover: the person's photo, or a tinted pattern when there isn't one */}
      <Box sx={{ position: 'relative', height: 204, background: `linear-gradient(135deg, ${color} 0%, ${color}bb 100%)` }}>
        {photo ? (
          <Box component="img" src={photo} alt={`${profile.name}`} loading="lazy" sx={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center 22%', display: 'block' }} />
        ) : (
          <Box aria-hidden="true" sx={{ position: 'absolute', inset: 0, backgroundImage: 'radial-gradient(rgba(255,255,255,0.16) 1.5px, transparent 1.5px)', backgroundSize: '20px 20px' }} />
        )}
        <Box aria-hidden="true" sx={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, transparent 55%, rgba(0,0,0,0.22) 100%)' }} />
        <Box aria-hidden="true" sx={{
          position: 'absolute', left: '50%', bottom: 0, transform: 'translate(-50%, 50%)', width: 74, height: 74, borderRadius: '50%',
          display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: color, color: '#fff', fontWeight: 900, fontSize: '1.4rem',
          border: '5px solid', borderColor: 'background.paper', boxShadow: `0 10px 26px ${color}66`,
        }}>{profile.initials}</Box>
      </Box>

      <Box sx={{ px: { xs: 2.5, md: 3.25 }, pt: 6, pb: 3 }}>
        {profile.badge && (
          <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.75, px: 1.75, py: 0.55, borderRadius: 999, mb: 1.5, color, bgcolor: `${color}18`, '& svg': { fontSize: 16 } }}>
            {badgeIcon(profile.badge)}
            <Typography sx={{ fontSize: '0.8rem', fontWeight: 700 }}>{profile.badge}</Typography>
          </Box>
        )}
        <Typography component="h3" sx={{ fontWeight: 900, fontSize: '1.4rem', letterSpacing: '-0.01em', lineHeight: 1.2 }}>{profile.name}</Typography>
        <Typography sx={{ color: 'text.secondary', fontSize: '0.88rem', mt: 0.5, mb: 2 }}>{profile.role}</Typography>
        <Typography sx={{ color: 'text.secondary', fontSize: '0.92rem', lineHeight: 1.75, minHeight: { md: 132 } }}>{profile.bio}</Typography>

        <Box sx={{ display: 'flex', alignItems: 'center', mt: 2.5, pt: 2.25, borderTop: '1px solid', borderColor: isDark ? '#2a2a2a' : '#f1e4e4' }}>
          <Stat icon={<FavoriteIcon />} value={profile.donations ?? 0} label="Donations" color="#e53935" />
          <Box sx={{ width: '1px', height: 40, bgcolor: isDark ? '#2a2a2a' : '#f1e4e4' }} />
          <Stat icon={<WaterDropIcon />} value={profile.bloodType || '—'} label="Blood Type" color="#e53935" />
        </Box>
      </Box>
    </Box>
  );
}

const Slogan = ({ children, sx }) => (
  <Typography aria-hidden="true" sx={{ position: 'absolute', display: { xs: 'none', lg: 'block' }, fontFamily: script.style.fontFamily, fontWeight: 700, fontSize: '2.3rem', lineHeight: 0.95, color: 'rgba(198,40,40,0.28)', pointerEvents: 'none', ...sx }}>
    {children}
  </Typography>
);

export default function CommunitySection({ profiles }) {
  const isDark = useTheme().palette.mode === 'dark';
  const trackRef = useRef(null);
  const [scroll, setScroll] = useState({ canPrev: false, canNext: false, active: 0 });

  const measure = useCallback(() => {
    const el = trackRef.current;
    if (!el || !el.firstElementChild) return;
    const step = el.firstElementChild.offsetWidth + GAP_PX;
    setScroll({
      canPrev: el.scrollLeft > 4,
      canNext: el.scrollLeft < el.scrollWidth - el.clientWidth - 4,
      active: Math.round(el.scrollLeft / step),
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
      {/* decoration: soft shapes, slogans, a heart with a drop and a heartbeat trace */}
      <Box aria-hidden="true" sx={{ position: 'absolute', right: '-8%', top: '-18%', width: 620, height: 620, borderRadius: '50%', background: 'radial-gradient(circle, rgba(198,40,40,0.09) 0%, transparent 66%)' }} />
      <Box aria-hidden="true" sx={{ position: 'absolute', left: -60, bottom: -70, opacity: isDark ? 0.08 : 0.16, transform: 'rotate(-14deg)' }}><DropHeart size={300} color="#e57373" heart="#fff" /></Box>
      <Slogan sx={{ left: '3.5%', top: 62, transform: 'rotate(-9deg)' }}>Real People<br />Real Impact</Slogan>
      <Slogan sx={{ right: '3.5%', top: 58, transform: 'rotate(-9deg)', textAlign: 'right' }}>Give Blood<br />Give Hope</Slogan>
      <Slogan sx={{ right: '3%', bottom: 46, transform: 'rotate(-10deg)' }}>Small Act<br />Big Change</Slogan>
      <Box aria-hidden="true" sx={{ position: 'absolute', right: 0, bottom: 150, display: { xs: 'none', lg: 'block' } }}>
        <svg width="140" height="140" viewBox="0 0 140 140" fill="none"><path d="M140 84 H108 l-8 -22 l-14 62 l-12 -50 l-8 10 H0" stroke="#e57373" strokeWidth="2" opacity="0.4" strokeLinecap="round" strokeLinejoin="round" /></svg>
      </Box>

      <Container maxWidth="lg" sx={{ position: 'relative', zIndex: 1 }}>
        <Box sx={{ textAlign: 'center', mb: { xs: 5, md: 6.5 } }}>
          <Box sx={{ display: 'inline-block', px: 2.25, py: 0.75, borderRadius: 999, mb: 2, fontWeight: 800, fontSize: '0.72rem', letterSpacing: '0.14em', color: '#c62828', bgcolor: isDark ? 'rgba(198,40,40,0.16)' : '#fdeaea' }}>
            OUR COMMUNITY
          </Box>
          <Typography id="community-title" component="h2" sx={{ fontWeight: 900, fontSize: { xs: '2.1rem', md: '3rem' }, letterSpacing: '-0.03em', lineHeight: 1.1 }}>
            People Behind <Box component="span" sx={{ color: '#c62828' }}>the Mission</Box>
          </Typography>
          <Typography sx={{ color: 'text.secondary', mt: 1.75, fontSize: '1.05rem', maxWidth: 520, mx: 'auto', lineHeight: 1.6 }}>
            Donors, families, and medical professionals united by one purpose — a healthier tomorrow.
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
            {profiles.map((profile, i) => <ProfileCard key={profile._id || profile.name} profile={profile} index={i} active={i === scroll.active} />)}
          </Box>
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
