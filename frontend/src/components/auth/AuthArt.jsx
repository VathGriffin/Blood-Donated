'use client';
import { Box, Typography } from '@mui/material';
import { Caveat } from 'next/font/google';
import { WaterDrop, Groups, Favorite } from '@mui/icons-material';
import DropHeart from './DropHeart';
import { RED } from './authUi';

const script = Caveat({ subsets: ['latin'], weight: ['600', '700'], display: 'swap' });

// A glowing heart with a drop in it, ringed by soft pulses — stands in for a photo so nothing is downloaded.
export function HeartArt({ size = 300 }) {
  return (
    <svg viewBox="0 0 300 300" width={size} height={size} aria-hidden="true">
      <defs>
        <linearGradient id="heartGrad" x1="0.15" y1="0" x2="0.85" y2="1">
          <stop offset="0%" stopColor="#ef5350" />
          <stop offset="100%" stopColor="#a91717" />
        </linearGradient>
        <linearGradient id="dropGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#ffffff" />
          <stop offset="100%" stopColor="#ffe0e0" />
        </linearGradient>
        <radialGradient id="glow" cx="0.5" cy="0.5" r="0.5">
          <stop offset="0%" stopColor="#c62828" stopOpacity="0.16" />
          <stop offset="100%" stopColor="#c62828" stopOpacity="0" />
        </radialGradient>
      </defs>
      <circle cx="150" cy="150" r="148" fill="url(#glow)" />
      <circle cx="150" cy="150" r="128" fill="none" stroke="#c62828" strokeOpacity="0.10" strokeWidth="1.5" />
      <circle cx="150" cy="150" r="98" fill="none" stroke="#c62828" strokeOpacity="0.14" strokeWidth="1.5" strokeDasharray="3 7" />
      <ellipse cx="150" cy="262" rx="62" ry="8" fill="#7f0000" opacity="0.14" />
      <path d="M150 250C62 192 34 146 34 104c0-34 26-58 56-58 24 0 46 13 60 34 14-21 36-34 60-34 30 0 56 24 56 58 0 42-28 88-116 146Z" fill="url(#heartGrad)" />
      <path d="M62 92c4-20 20-32 40-32" stroke="#fff" strokeOpacity="0.35" strokeWidth="6" strokeLinecap="round" fill="none" />
      <path d="M150 96c0 0-34 40-34 66a34 34 0 0 0 68 0c0-26-34-66-34-66Z" fill="url(#dropGrad)" />
      <path d="M134 166c1 10 8 18 18 20" stroke="#ef9a9a" strokeOpacity="0.7" strokeWidth="4" strokeLinecap="round" fill="none" />
      {/* small drifting drops */}
      <path d="M262 84c0 0-9 11-9 18a9 9 0 0 0 18 0c0-7-9-18-9-18Z" fill="#c62828" opacity="0.5" />
      <path d="M40 196c0 0-7 9-7 15a7 7 0 0 0 14 0c0-6-7-15-7-15Z" fill="#c62828" opacity="0.35" />
      <path d="M248 214c0 0-5 7-5 11a5 5 0 0 0 10 0c0-4-5-11-5-11Z" fill="#c62828" opacity="0.3" />
    </svg>
  );
}

// Artwork for the login page (large screens only): the slogan and heart on the left,
// faint drops on the right so the card doesn't float in empty space.
export function LoginArt() {
  return (
    <>
      <Box sx={{ display: { xs: 'none', lg: 'block' }, position: 'absolute', top: 0, bottom: 0, left: 0, width: 360, pointerEvents: 'none', zIndex: 1 }}>
        <Box sx={{ position: 'absolute', top: '24%', left: 56 }}>
          <Typography sx={{ fontFamily: script.style.fontFamily, fontSize: '3.6rem', lineHeight: 0.95, fontWeight: 700, color: 'text.primary' }}>
            Give<br />Blood<br />Give Hope
          </Typography>
          <Box sx={{ width: 34, height: 3, bgcolor: RED, my: 2.5, borderRadius: 2 }} />
          <Typography sx={{ color: 'text.secondary', fontSize: '1.05rem', lineHeight: 1.5, maxWidth: 200 }}>
            A small act can make a big difference.
          </Typography>
        </Box>
        {/* short screens: the heart would run into the slogan, so it's dropped there */}
        <Box sx={{ position: 'absolute', bottom: 84, left: 28, '@media (max-height: 820px)': { display: 'none' } }}>
          <HeartArt size={270} />
        </Box>
        <Typography sx={{ position: 'absolute', bottom: 40, left: 56, maxWidth: 250, color: 'text.secondary', fontSize: '0.8rem', lineHeight: 1.5 }}>
          One donation can help save up to three lives.
        </Typography>
      </Box>

      <Box aria-hidden="true" sx={{ display: { xs: 'none', xl: 'block' }, position: 'absolute', top: 0, bottom: 0, right: 0, width: 360, pointerEvents: 'none', zIndex: 0, overflow: 'hidden' }}>
        <Box sx={{ position: 'absolute', top: 120, right: 70, opacity: 0.07 }}><DropHeart size={150} heart="transparent" /></Box>
        <Box sx={{ position: 'absolute', top: '46%', right: -40, opacity: 0.05 }}><DropHeart size={260} heart="transparent" /></Box>
        <Box sx={{ position: 'absolute', bottom: 90, right: 150, opacity: 0.06 }}><DropHeart size={90} heart="transparent" /></Box>
      </Box>
    </>
  );
}

const POINTS = [
  { icon: <WaterDrop />, text: 'Save Lives' },
  { icon: <Groups />, text: 'Build Communities' },
  { icon: <Favorite />, text: 'Create a Healthier Tomorrow' },
];

// Red side panel for the register page (large screens only).
export function RegisterPanel({ width = 300 }) {
  return (
    <Box sx={{
      display: { xs: 'none', lg: 'flex' }, position: 'absolute', top: 0, right: 0, bottom: 0, width, zIndex: 1,
      flexDirection: 'column', justifyContent: 'space-between', overflow: 'hidden',
      px: 5, py: 6, color: '#fff',
      background: 'linear-gradient(170deg, #c62828 0%, #8e1515 100%)',
      borderRadius: '90px 0 0 90px / 50% 0 0 50%',
      pl: 8,
    }}>
      <Box sx={{ position: 'absolute', top: 150, right: -30, opacity: 0.09 }}><DropHeart size={190} color="#fff" heart="transparent" /></Box>
      <Box sx={{ position: 'absolute', bottom: 120, right: 20, opacity: 0.07 }}><DropHeart size={230} color="#fff" heart="transparent" /></Box>

      <Box sx={{ position: 'relative' }}>
        <Typography sx={{ fontWeight: 800, fontSize: '1.55rem', lineHeight: 1.25 }}>Be a Donor<br />Be a Hero</Typography>
        <Box sx={{ width: 30, height: 2, bgcolor: 'rgba(255,255,255,0.7)', mt: 2 }} />
      </Box>

      <Box sx={{ position: 'relative', display: 'flex', flexDirection: 'column', gap: 3.5 }}>
        {POINTS.map((p) => (
          <Box key={p.text} sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Box sx={{ display: 'flex', '& svg': { fontSize: 30 } }}>{p.icon}</Box>
            <Typography sx={{ fontSize: '0.88rem', lineHeight: 1.35, maxWidth: 120 }}>{p.text}</Typography>
          </Box>
        ))}
      </Box>

      <Typography sx={{ position: 'relative', fontSize: '1.15rem', lineHeight: 1.4, maxWidth: 170 }}>Every donation counts.</Typography>
    </Box>
  );
}
