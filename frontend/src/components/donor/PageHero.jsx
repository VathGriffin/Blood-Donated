'use client';
import Link from 'next/link';
import { Box, Button, Typography } from '@mui/material';
import FavoriteIcon from '@mui/icons-material/Favorite';
import AddIcon from '@mui/icons-material/Add';
import HeartArt from '@/components/donor/HeartArt';
import { script } from '@/lib/fonts';

/**
 * Red page banner for the donor dashboard pages (/my-appointments, /my-requests), in the same
 * style as the profile banner: icon tile, title, subtitle and an optional primary action.
 */
export default function DonorPageHero({ id, icon, title, subtitle, actionHref, actionLabel, badge }) {
  return (
    <Box component="section" aria-labelledby={id} sx={{
      position: 'relative', overflow: 'hidden', color: '#fff', borderRadius: '18px',
      background: (t) => (t.palette.mode === 'dark'
        ? 'linear-gradient(100deg, #6E1019 0%, #8F1522 50%, #5C0F18 100%)'
        : 'linear-gradient(100deg, #A3172A 0%, #B91C2C 40%, #C7283A 68%, #9B1726 100%)'),
      boxShadow: (t) => (t.palette.mode === 'dark' ? 'none' : '0 14px 34px rgba(136,29,42,0.22)'),
    }}>
      <Box aria-hidden="true" sx={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
        <Box sx={{ position: 'absolute', right: -120, top: -170, width: 480, height: 480, borderRadius: '50%', background: 'radial-gradient(circle, rgba(255,255,255,0.14) 0%, transparent 62%)' }} />
        <Box sx={{ display: { xs: 'none', lg: 'block' }, position: 'absolute', right: { lg: 250, xl: 380 }, top: -6, width: 230, height: 140 }}>
          <HeartArt idPrefix={`${id}-heart`} />
        </Box>
        <Typography className={script.className} sx={{
          display: { xs: 'none', xl: 'block' }, position: 'absolute', right: 225, top: 26, transform: 'rotate(-10deg)',
          fontSize: '2.1rem', lineHeight: 1.05, fontWeight: 700, color: '#fff', textAlign: 'center', textShadow: '0 2px 10px rgba(90,8,18,0.35)',
        }}>
          Give Blood<br />Give Hope
          <FavoriteIcon sx={{ fontSize: 22, ml: 0.5, verticalAlign: 'top' }} />
        </Typography>
      </Box>

      <Box sx={{
        position: 'relative', px: { xs: 2.5, sm: 4 }, py: { xs: 2.75, md: 3.5 },
        display: 'flex', alignItems: { xs: 'flex-start', md: 'center' }, flexDirection: { xs: 'column', md: 'row' }, gap: { xs: 2, md: 3 },
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 2, sm: 3 }, flex: 1, minWidth: 0 }}>
          <Box aria-hidden="true" sx={{
            width: { xs: 56, sm: 72 }, height: { xs: 56, sm: 72 }, borderRadius: '16px', flexShrink: 0, display: 'grid', placeItems: 'center',
            bgcolor: '#fff', color: 'primary.main', boxShadow: '0 8px 20px rgba(0,0,0,0.18)', '& svg': { fontSize: { xs: 30, sm: 38 } },
          }}>
            {icon}
          </Box>
          <Box sx={{ minWidth: 0, maxWidth: { lg: 460, xl: 520 } }}>
            <Typography id={id} component="h1" sx={{ fontWeight: 800, fontSize: { xs: '1.5rem', sm: '2rem' }, lineHeight: 1.15, letterSpacing: '-0.02em' }}>
              {title}
              {badge && (
                <Box component="span" sx={{
                  ml: 1.5, px: 1.25, py: 0.35, borderRadius: '999px', verticalAlign: 'middle', display: 'inline-block',
                  bgcolor: 'rgba(255,255,255,0.2)', border: '1px solid rgba(255,255,255,0.3)', fontSize: '0.8rem', fontWeight: 700, letterSpacing: 0,
                }}>
                  {badge}
                </Box>
              )}
            </Typography>
            <Typography sx={{ mt: 0.75, color: 'rgba(255,255,255,0.9)', fontSize: { xs: '0.9rem', sm: '1rem' } }}>
              {subtitle}
            </Typography>
          </Box>
        </Box>
        {actionHref && (
        <Button component={Link} href={actionHref} variant="contained" disableElevation startIcon={<AddIcon />} sx={{
          flexShrink: 0, height: 50, px: 2.75, borderRadius: '12px', fontWeight: 700, fontSize: '0.95rem',
          bgcolor: '#fff', color: 'primary.main', width: { xs: '100%', md: 'auto' },
          '&:hover': { bgcolor: '#FDF2F3' }, '&.Mui-focusVisible': { outline: '2px solid #fff', outlineOffset: 2 },
        }}>
          {actionLabel}
        </Button>
        )}
      </Box>
    </Box>
  );
}
