'use client';
import { useState } from 'react';
import { Box, Typography, Button, Skeleton, useTheme } from '@mui/material';
import ApartmentIcon from '@mui/icons-material/Apartment';
import LocalHospitalIcon from '@mui/icons-material/LocalHospital';
import PlaceOutlinedIcon from '@mui/icons-material/PlaceOutlined';
import MyLocationIcon from '@mui/icons-material/MyLocation';
import RadioButtonUncheckedIcon from '@mui/icons-material/RadioButtonUnchecked';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import Panel from './Panel';

const INITIAL_VISIBLE = 4;

export default function CenterPicker({ centers, loading, selectedKey, onSelect, distances, onLocate, locating, note }) {
  const isDark = useTheme().palette.mode === 'dark';
  const [showAll, setShowAll] = useState(false);
  const selectedIndex = centers.findIndex((c) => c.key === selectedKey);
  const expanded = showAll || selectedIndex >= INITIAL_VISIBLE; // never hide the chosen one
  const visible = expanded ? centers : centers.slice(0, INITIAL_VISIBLE);

  return (
    <Panel
      icon={<ApartmentIcon />}
      title="Select Donation Center"
      subtitle="Choose a hospital or blood donation center near you"
      action={
        <Button size="small" variant="outlined" onClick={onLocate} disabled={locating}
          startIcon={<MyLocationIcon sx={{ fontSize: 16 }} />}
          sx={{ textTransform: 'none', fontWeight: 600, borderRadius: '10px', color: 'text.primary', borderColor: 'divider' }}>
          {locating ? 'Locating…' : 'Use My Location'}
        </Button>
      }
    >
      {note && <Typography sx={{ color: 'text.secondary', fontSize: '0.8rem', mb: 1.5 }}>{note}</Typography>}

      <Box role="radiogroup" aria-label="Donation center" sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(190px, 1fr))', gap: 1.75 }}>
        {loading && [0, 1, 2, 3].map((i) => <Skeleton key={i} variant="rounded" height={190} sx={{ borderRadius: '14px' }} />)}

        {!loading && visible.map((center) => {
          const selected = center.key === selectedKey;
          const km = distances[center.key];
          const place = [center.address, center.city].filter(Boolean).join(', ');
          return (
            <Box key={center.key} role="radio" aria-checked={selected} tabIndex={0}
              onClick={() => onSelect(center.key)}
              onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onSelect(center.key); } }}
              sx={{
                position: 'relative', cursor: 'pointer', p: 1.25, borderRadius: '14px', outline: 'none',
                border: '1.5px solid', borderColor: selected ? '#c62828' : isDark ? '#2c2c2c' : '#eadede',
                bgcolor: selected ? (isDark ? 'rgba(198,40,40,0.1)' : '#fff5f5') : 'transparent',
                boxShadow: selected ? '0 6px 20px rgba(198,40,40,0.14)' : 'none',
                transition: 'all .18s ease',
                '&:hover': { borderColor: '#c62828' },
                '&:focus-visible': { boxShadow: '0 0 0 3px rgba(198,40,40,0.35)' },
              }}>
              {/* No photos exist for these centers, so a neutral tile stands in for one */}
              <Box sx={{
                height: 92, borderRadius: '10px', mb: 1.25, position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: isDark ? '#ef9a9a' : '#c62828',
                background: isDark ? 'linear-gradient(135deg, #2a1515, #1c1c1c)' : 'linear-gradient(135deg, #fdeaea 0%, #f6f1f1 100%)',
              }}>
                <LocalHospitalIcon sx={{ fontSize: 44, opacity: 0.85 }} />
                <Box sx={{ position: 'absolute', top: 6, right: 6, display: 'flex', color: selected ? '#c62828' : 'text.disabled', bgcolor: 'background.paper', borderRadius: '50%' }}>
                  {selected ? <CheckCircleIcon sx={{ fontSize: 22 }} /> : <RadioButtonUncheckedIcon sx={{ fontSize: 22 }} />}
                </Box>
              </Box>
              <Typography sx={{ fontWeight: 700, fontSize: '0.9rem', lineHeight: 1.3 }}>{center.name}</Typography>
              {place && (
                <Typography sx={{ color: 'text.secondary', fontSize: '0.76rem', mt: 0.4, display: 'flex', gap: 0.5, alignItems: 'flex-start' }}>
                  <PlaceOutlinedIcon sx={{ fontSize: 14, mt: '2px', flexShrink: 0 }} />{place}
                </Typography>
              )}
              {typeof km === 'number' && (
                <Typography sx={{ color: 'text.secondary', fontSize: '0.76rem', mt: 0.4, fontWeight: 600 }}>
                  {km < 10 ? km.toFixed(1) : Math.round(km)} km away
                </Typography>
              )}
            </Box>
          );
        })}
      </Box>

      {!loading && centers.length > INITIAL_VISIBLE && (
        <Button size="small" onClick={() => setShowAll((v) => !v)} sx={{ mt: 1.5, textTransform: 'none', fontWeight: 700, color: '#c62828' }}>
          {expanded ? 'Show fewer centers' : `Show all ${centers.length} centers`}
        </Button>
      )}
    </Panel>
  );
}
