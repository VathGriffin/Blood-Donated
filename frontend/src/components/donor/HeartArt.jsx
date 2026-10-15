'use client';
import { Box } from '@mui/material';

// Glossy heart with a white cross and a heartbeat line, drawn inline (no external image).
export default function HeartArt({ idPrefix = 'ha' }) {
  return (
    <Box component="svg" viewBox="0 0 330 200" aria-hidden="true" sx={{ width: '100%', height: '100%', overflow: 'visible' }}>
      <defs>
        <radialGradient id={`${idPrefix}-heart`} cx="38%" cy="30%" r="80%">
          <stop offset="0%" stopColor="#FF7A86" />
          <stop offset="45%" stopColor="#E3283C" />
          <stop offset="100%" stopColor="#9E1028" />
        </radialGradient>
        <radialGradient id={`${idPrefix}-glow`} cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#FFD7DC" stopOpacity="0.75" />
          <stop offset="100%" stopColor="#FFD7DC" stopOpacity="0" />
        </radialGradient>
        <filter id={`${idPrefix}-shadow`} x="-30%" y="-30%" width="160%" height="170%">
          <feDropShadow dx="0" dy="10" stdDeviation="9" floodColor="#5A0812" floodOpacity="0.45" />
        </filter>
      </defs>
      <ellipse cx="120" cy="100" rx="125" ry="105" fill={`url(#${idPrefix}-glow)`} />
      <g transform="translate(20 12)">
        <path filter={`url(#${idPrefix}-shadow)`} fill={`url(#${idPrefix}-heart)`}
          d="M100 165 C 40 122, 12 92, 12 58 C 12 30, 34 12, 60 12 C 78 12, 92 22, 100 36 C 108 22, 122 12, 140 12 C 166 12, 188 30, 188 58 C 188 92, 160 122, 100 165 Z" />
        <path fill="#fff" fillOpacity="0.3" d="M44 34 C 56 24, 74 26, 82 38 C 66 34, 54 40, 46 52 C 40 46, 40 40, 44 34 Z" />
        <rect x="88" y="52" width="24" height="64" rx="4" fill="#fff" />
        <rect x="68" y="72" width="64" height="24" rx="4" fill="#fff" />
      </g>
      {/* heartbeat line running out to the right */}
      <polyline fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" strokeOpacity="0.9"
        points="205,96 240,96 252,70 266,128 280,52 292,96 330,96" />
    </Box>
  );
}
