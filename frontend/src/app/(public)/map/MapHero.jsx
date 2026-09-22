'use client';
import Link from 'next/link';
import { Box, Typography, useTheme } from '@mui/material';
import LocalHospitalIcon from '@mui/icons-material/LocalHospital';
import GroupsIcon from '@mui/icons-material/Groups';
import WaterDropIcon from '@mui/icons-material/WaterDrop';
import VerifiedUserIcon from '@mui/icons-material/VerifiedUser';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import FavoriteBorderIcon from '@mui/icons-material/FavoriteBorder';
import { script } from '@/lib/fonts';
import { PROVINCES } from '@/lib/places';

const PAGE_WIDTH = { maxWidth: 1600, mx: 'auto', px: { xs: 2, md: 4 } };

const formatCount = (value) => (typeof value === 'number' ? value.toLocaleString() : '—');

function StatCard({ icon, color, tint, value, label, onClick }) {
  const isDark = useTheme().palette.mode === 'dark';
  const Root = onClick ? 'button' : 'div';
  return (
    <Box
      component={Root}
      onClick={onClick}
      type={onClick ? 'button' : undefined}
      sx={{
        display: 'flex', alignItems: 'center', gap: { xs: 1.25, md: 2 }, p: { xs: 1.5, md: 2.25 }, textAlign: 'left', font: 'inherit', color: 'inherit',
        bgcolor: 'background.paper', border: '1px solid', borderColor: isDark ? '#2a2a2a' : '#f3e3e3', borderRadius: '20px',
        boxShadow: isDark ? '0 8px 28px rgba(0,0,0,0.4)' : '0 10px 30px rgba(120,20,20,0.10)', cursor: onClick ? 'pointer' : 'default',
        transition: 'transform .18s ease, box-shadow .18s ease',
        ...(onClick && { '&:hover': { transform: 'translateY(-2px)', boxShadow: '0 14px 34px rgba(120,20,20,0.18)' }, '&:focus-visible': { outline: `2px solid ${color}`, outlineOffset: 2 } }),
      }}
    >
      <Box aria-hidden="true" sx={{ width: { xs: 44, md: 56 }, height: { xs: 44, md: 56 }, flexShrink: 0, borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: isDark ? `${color}26` : tint, color, '& svg': { fontSize: { xs: 24, md: 30 } } }}>
        {icon}
      </Box>
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Typography sx={{ fontSize: { xs: '1.3rem', md: '1.6rem' }, fontWeight: 800, lineHeight: 1.1 }}>{value}</Typography>
        <Typography sx={{ fontSize: { xs: '0.74rem', md: '0.84rem' }, color: 'text.secondary', mt: 0.25 }}>{label}</Typography>
      </Box>
      {onClick && <ChevronRightIcon aria-hidden="true" sx={{ color: 'text.disabled', display: { xs: 'none', sm: 'block' } }} />}
    </Box>
  );
}

// Decorative only (the same hospital photo the Contact page uses); the red gradient over it keeps the text readable.
const HERO_PHOTO = 'https://images.unsplash.com/photo-1586773860418-d37222d8fce3?auto=format&fit=crop&w=1600&q=60';

// The numbers are all real: the platform's own public totals (/api/stats/public) and the fixed
// province list. Nothing is padded; a figure that hasn't loaded shows "—".
export default function MapHero({ stats, onShowHospitals, onShowDonors }) {
  return (
    <>
      <Box sx={{ position: 'relative', overflow: 'hidden', color: '#fff', pt: { xs: 3, md: 4 }, pb: { xs: 11, md: 12 }, bgcolor: '#5c0000' }}>
        <Box aria-hidden="true" sx={{ position: 'absolute', inset: 0, backgroundImage: `url(${HERO_PHOTO})`, backgroundSize: 'cover', backgroundPosition: 'center 40%', pointerEvents: 'none' }} />
        <Box aria-hidden="true" sx={{ position: 'absolute', inset: 0, background: 'linear-gradient(120deg, rgba(92,0,0,0.94) 0%, rgba(142,17,17,0.9) 45%, rgba(198,40,40,0.82) 100%)', pointerEvents: 'none' }} />
        <LocalHospitalIcon aria-hidden="true" sx={{ position: 'absolute', right: { xs: -60, md: '18%' }, top: { xs: -30, md: -50 }, fontSize: { xs: 260, md: 380 }, color: 'rgba(255,255,255,0.07)', pointerEvents: 'none' }} />
        <Box aria-hidden="true" sx={{ position: 'absolute', inset: 0, backgroundImage: 'radial-gradient(rgba(255,255,255,0.09) 1.5px, transparent 1.5px)', backgroundSize: '26px 26px', pointerEvents: 'none' }} />

        <Box sx={{ ...PAGE_WIDTH, position: 'relative', display: 'flex', alignItems: { xs: 'flex-start', md: 'center' }, justifyContent: 'space-between', gap: 3, flexWrap: 'wrap' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 1.75, md: 2.5 }, minWidth: 0 }}>
            <Box aria-hidden="true" sx={{ width: { xs: 52, md: 64 }, height: { xs: 52, md: 64 }, flexShrink: 0, borderRadius: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: 'rgba(255,255,255,0.16)', border: '1px solid rgba(255,255,255,0.28)', backdropFilter: 'blur(6px)' }}>
              <LocalHospitalIcon sx={{ fontSize: { xs: 30, md: 38 } }} />
            </Box>
            <Box sx={{ minWidth: 0 }}>
              <Typography component="h1" sx={{ fontWeight: 800, fontSize: { xs: '1.55rem', md: '2.3rem' }, letterSpacing: '-0.02em', lineHeight: 1.15 }}>
                Find a Hospital or Clinic
              </Typography>
              <Typography sx={{ color: 'rgba(255,255,255,0.85)', fontSize: { xs: '0.9rem', md: '1rem' }, mt: 0.5 }}>
                Locate nearby hospitals and available donors — every second counts.
              </Typography>
            </Box>
          </Box>

          <Box sx={{ display: { xs: 'none', md: 'flex' }, alignItems: 'center', gap: 4 }}>
            <Box component={Link} href="/donate" sx={{
              display: 'flex', alignItems: 'center', gap: 1.5, px: 2.5, py: 1.4, borderRadius: '16px', textDecoration: 'none', color: '#5c0000',
              bgcolor: 'rgba(255,255,255,0.92)', boxShadow: '0 8px 24px rgba(0,0,0,0.2)', transition: 'transform .18s ease', '&:hover': { transform: 'translateY(-2px)' },
            }}>
              <WaterDropIcon sx={{ color: '#c62828' }} />
              <Typography sx={{ fontWeight: 800, lineHeight: 1.2, fontSize: '0.98rem' }}>Together<br />We Save Lives</Typography>
              <ChevronRightIcon sx={{ ml: 1, color: '#c62828' }} />
            </Box>
            <Typography aria-hidden="true" sx={{ fontFamily: script.style.fontFamily, fontWeight: 700, fontSize: '2.3rem', lineHeight: 0.95, transform: 'rotate(-5deg)', display: { xs: 'none', lg: 'flex' }, alignItems: 'center', gap: 1 }}>
              <span>Give Blood<br />Give Hope</span>
              <FavoriteBorderIcon sx={{ fontSize: 44 }} />
            </Typography>
          </Box>
        </Box>
      </Box>

      <Box sx={{ ...PAGE_WIDTH, mt: { xs: -8, md: -9 }, position: 'relative', zIndex: 2, display: 'grid', gap: { xs: 1.25, md: 2 }, gridTemplateColumns: { xs: 'repeat(2, minmax(0, 1fr))', lg: 'repeat(4, minmax(0, 1fr))' } }}>
        <StatCard icon={<LocalHospitalIcon />} color="#c62828" tint="#ffebee" value={formatCount(stats?.hospitals)} label="Partner Hospitals" onClick={onShowHospitals} />
        <StatCard icon={<GroupsIcon />} color="#c62828" tint="#ffebee" value={formatCount(stats?.availableDonors)} label="Active Donors" onClick={onShowDonors} />
        <StatCard icon={<WaterDropIcon />} color="#c62828" tint="#ffebee" value={formatCount(stats?.units)} label="Units Available" />
        <StatCard icon={<VerifiedUserIcon />} color="#2e7d32" tint="#e8f5e9" value={PROVINCES.length} label="Provinces Covered" />
      </Box>
    </>
  );
}

export { PAGE_WIDTH };
