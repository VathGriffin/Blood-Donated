'use client';
import Link from 'next/link';
import Image from 'next/image';
import { Box, Typography } from '@mui/material';
import logoMark from '@/assets/logo-mark.png';
import { BRAND } from '@/lib/brand';

/**
 * Logo mark + product name, with an optional caption (e.g. "Admin Panel").
 * The mark sits on a white tile so it reads on the dark-red sidebar; pass
 * `onDark={false}` for use on a light surface.
 */
export default function BrandLogo({ href = '/', caption, onDark = true, onClick }) {
  return (
    <Box
      component={Link}
      href={href}
      onClick={onClick}
      aria-label={`${BRAND.name} — ${caption || 'home'}`}
      sx={{ display: 'flex', alignItems: 'center', gap: 1.5, textDecoration: 'none', minWidth: 0 }}
    >
      <Box
        sx={{
          width: onDark ? 52 : 50, height: 42, flexShrink: 0, borderRadius: '12px',
          // The mark is dark red/black on transparent: it needs a white tile on the dark-red
          // sidebar and in dark mode, but sits bare on a light surface.
          bgcolor: onDark ? '#FFFFFF' : (t) => (t.palette.mode === 'dark' ? '#FFFFFF' : 'transparent'),
          boxShadow: onDark ? '0 2px 8px rgba(0,0,0,0.25)' : 'none',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}
      >
        <Image src={logoMark} alt="" width={onDark ? 40 : 44} height={onDark ? 20 : 22} priority style={{ width: onDark ? 40 : 44, height: 'auto' }} />
      </Box>
      <Box sx={{ minWidth: 0 }}>
        <Typography
          noWrap
          sx={{ fontWeight: 800, fontSize: '1.05rem', lineHeight: 1.15, letterSpacing: '-0.02em', color: onDark ? '#FFFFFF' : 'text.primary' }}
        >
          {BRAND.name}
        </Typography>
        {caption && (
          <Typography
            noWrap
            sx={{
              fontSize: '0.72rem', fontWeight: 500, lineHeight: 1.5,
              color: onDark ? 'rgba(255,255,255,0.72)' : 'text.secondary',
            }}
          >
            {caption}
          </Typography>
        )}
      </Box>
    </Box>
  );
}
