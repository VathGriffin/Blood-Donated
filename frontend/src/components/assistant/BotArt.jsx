'use client';
import { Box } from '@mui/material';
import { alpha } from '@mui/material/styles';
import SmartToyRoundedIcon from '@mui/icons-material/SmartToyRounded';

/** Round assistant avatar used beside its messages. */
export function BotAvatar({ size = 40 }) {
  return (
    <Box aria-hidden="true" sx={(theme) => ({
      width: size, height: size, borderRadius: '50%', flexShrink: 0, display: 'grid', placeItems: 'center',
      bgcolor: alpha(theme.palette.primary.main, theme.palette.mode === 'dark' ? 0.2 : 0.1), color: 'primary.main',
      border: '1px solid', borderColor: alpha(theme.palette.primary.main, 0.2),
      '& svg': { fontSize: size * 0.55 },
    })}>
      <SmartToyRoundedIcon />
    </Box>
  );
}

/** Friendly robot holding a heart, drawn inline (decorative). */
export default function BotArt() {
  return (
    <Box component="svg" viewBox="0 0 120 120" aria-hidden="true" sx={{ width: '100%', height: '100%' }}>
      <ellipse cx="60" cy="112" rx="32" ry="5" fill="#C8102E" opacity="0.12" />
      <rect x="28" y="62" width="64" height="44" rx="20" fill="#FFE4E8" />
      <path d="M60 77c-5-6-14-2-12 5 1 4 12 11 12 11s11-7 12-11c2-7-7-11-12-5z" fill="#C8102E" />
      <rect x="22" y="18" width="76" height="50" rx="24" fill="#FFF1F3" stroke="#F4B8C1" strokeWidth="2" />
      <rect x="32" y="28" width="56" height="30" rx="15" fill="#102B4E" />
      <circle cx="49" cy="42" r="5" fill="#7DD3FC" />
      <circle cx="71" cy="42" r="5" fill="#7DD3FC" />
      <path d="M54 50q6 4 12 0" stroke="#7DD3FC" strokeWidth="2" fill="none" strokeLinecap="round" />
      <line x1="60" y1="18" x2="60" y2="9" stroke="#F4B8C1" strokeWidth="2" />
      <circle cx="60" cy="7" r="4" fill="#C8102E" />
      <circle cx="18" cy="43" r="5" fill="#C8102E" />
      <circle cx="102" cy="43" r="5" fill="#C8102E" />
      <path d="M100 24c-2-3-7-1-6 2 0 2 6 6 6 6s6-4 6-6c1-3-4-5-6-2z" fill="#E3283C" opacity="0.8" />
    </Box>
  );
}
