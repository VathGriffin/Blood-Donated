'use client';
import { useMemo, useRef, useState } from 'react';
import { Box, Typography, Button, Skeleton, InputBase, Alert, CircularProgress, useTheme } from '@mui/material';
import ApartmentIcon from '@mui/icons-material/Apartment';
import PlaceOutlinedIcon from '@mui/icons-material/PlaceOutlined';
import NearMeOutlinedIcon from '@mui/icons-material/NearMeOutlined';
import PlaceIcon from '@mui/icons-material/Place';
import EventAvailableOutlinedIcon from '@mui/icons-material/EventAvailableOutlined';
import SearchIcon from '@mui/icons-material/Search';
import CloseIcon from '@mui/icons-material/Close';
import SearchOffIcon from '@mui/icons-material/SearchOff';
import CheckIcon from '@mui/icons-material/Check';
import Panel from './Panel';
import HospitalPhoto from './HospitalPhoto';
import { C, radioKeyDown } from './booking';

const INITIAL_VISIBLE = 4;

const formatKm = (km) => `${km < 10 ? km.toFixed(1) : Math.round(km)} km`;

// `source` says where the list came from: 'api' (registered hospitals), 'empty' (none registered
// yet, so the standard list is shown) or 'error' (the request failed; standard list + retry).
export default function CenterPicker({ centers, loading, source, onRetry, selectedKey, onSelect, distances, onLocate, locating, note }) {
  const isDark = useTheme().palette.mode === 'dark';
  const [query, setQuery] = useState('');
  const [showAll, setShowAll] = useState(false);
  const refs = useRef([]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return centers;
    return centers.filter((c) => [c.name, c.address, c.city].some((v) => v && v.toLowerCase().includes(q)));
  }, [centers, query]);

  const selectedIndex = filtered.findIndex((c) => c.key === selectedKey);
  const expanded = showAll || !!query.trim() || selectedIndex >= INITIAL_VISIBLE; // never hide the chosen one
  const visible = expanded ? filtered : filtered.slice(0, INITIAL_VISIBLE);
  const tabbable = selectedIndex >= 0 && selectedIndex < visible.length ? selectedIndex : 0;
  const items = visible.map((_, i) => ({ get el() { return refs.current[i]; } }));

  const border = isDark ? '#2c2c2c' : C.border;

  return (
    <Panel icon={<ApartmentIcon />} title="Select Donation Center" subtitle="Choose a hospital or blood donation center near you">
      {/* Search + location */}
      <Box sx={{ display: 'flex', gap: 1.25, flexWrap: 'wrap', mb: 2 }}>
        <Box sx={{
          flex: '1 1 240px', display: 'flex', alignItems: 'center', gap: 1, px: 1.5, height: 42, borderRadius: '10px',
          border: `1px solid ${border}`, bgcolor: isDark ? 'rgba(255,255,255,0.03)' : '#fff',
          transition: 'border-color .15s, box-shadow .15s',
          '&:focus-within': { borderColor: C.primary, boxShadow: `0 0 0 3px ${C.ring}` },
        }}>
          <SearchIcon sx={{ fontSize: 20, color: 'text.secondary' }} aria-hidden="true" />
          <InputBase value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search by hospital name or location…"
            inputProps={{ 'aria-label': 'Search donation centers', type: 'search' }} disabled={loading}
            sx={{ flex: 1, fontSize: '0.9rem', '& input::-webkit-search-cancel-button': { display: 'none' } }} />
          {query && (
            <Box component="button" type="button" onClick={() => setQuery('')} aria-label="Clear search"
              sx={{ display: 'flex', border: 0, bgcolor: 'transparent', p: 0.25, cursor: 'pointer', color: 'text.secondary', borderRadius: '6px', '&:focus-visible': { outline: `2px solid ${C.primary}` } }}>
              <CloseIcon sx={{ fontSize: 18 }} />
            </Box>
          )}
        </Box>
        <Button variant="outlined" onClick={onLocate} disabled={locating || loading}
          startIcon={locating ? <CircularProgress size={14} color="inherit" /> : <PlaceIcon sx={{ fontSize: 18 }} />}
          sx={{
            height: 42, px: 2.25, textTransform: 'none', fontWeight: 600, fontSize: '0.88rem', borderRadius: '10px',
            color: C.primary, borderColor: isDark ? 'rgba(185,28,44,0.5)' : C.border, bgcolor: isDark ? 'transparent' : '#fff',
            '&:hover': { borderColor: C.primary, bgcolor: isDark ? 'rgba(185,28,44,0.1)' : C.softer },
            '&:focus-visible': { boxShadow: `0 0 0 3px ${C.ring}` },
          }}>
          {locating ? 'Locating…' : 'Use My Location'}
        </Button>
      </Box>

      {note && <Typography role="status" sx={{ color: 'text.secondary', fontSize: '0.8rem', mb: 1.5 }}>{note}</Typography>}

      {!loading && source === 'error' && (
        <Alert severity="warning" sx={{ mb: 2, borderRadius: '12px', alignItems: 'center' }}
          action={<Button color="inherit" size="small" onClick={onRetry} sx={{ textTransform: 'none', fontWeight: 700 }}>Retry</Button>}>
          We couldn’t load the registered centers, so the standard list is shown.
        </Alert>
      )}
      {!loading && source === 'empty' && (
        <Typography sx={{ color: 'text.secondary', fontSize: '0.8rem', mb: 1.5 }}>
          No hospitals have registered on BloodLife AI yet, so the standard list of centers is shown.
        </Typography>
      )}

      {loading && (
        <Box role="status" aria-label="Loading donation centers" sx={grid}>
          {[0, 1, 2, 3].map((i) => (
            <Box key={i} sx={{ p: 1, borderRadius: '14px', border: `1px solid ${border}` }}>
              <Skeleton variant="rounded" height={130} sx={{ borderRadius: '10px', mb: 1.25 }} />
              <Skeleton width="80%" /><Skeleton width="55%" /><Skeleton variant="rounded" height={28} sx={{ mt: 1.25, borderRadius: '8px' }} />
            </Box>
          ))}
        </Box>
      )}

      {!loading && !filtered.length && (
        <Box sx={{ textAlign: 'center', py: 4, px: 2, borderRadius: '14px', border: `1px dashed ${border}` }}>
          <SearchOffIcon sx={{ fontSize: 36, color: 'text.disabled' }} aria-hidden="true" />
          <Typography sx={{ fontWeight: 700, mt: 1 }}>{query ? 'No centers match your search' : 'No donation centers available'}</Typography>
          <Typography sx={{ color: 'text.secondary', fontSize: '0.85rem', mt: 0.5 }}>
            {query ? 'Try a different name, address or city.' : 'Please check back later.'}
          </Typography>
          {query && <Button size="small" onClick={() => setQuery('')} sx={{ mt: 1.5, textTransform: 'none', fontWeight: 700, color: C.primary }}>Clear search</Button>}
        </Box>
      )}

      {!loading && !!filtered.length && (
        <Box role="radiogroup" aria-label="Donation center" sx={grid}>
          {visible.map((center, i) => {
            const selected = center.key === selectedKey;
            const km = distances[center.key];
            const place = [center.address, center.city].filter(Boolean).join(', ');
            return (
              <Box key={center.key} ref={(el) => { refs.current[i] = el; }}
                role="radio" aria-checked={selected} tabIndex={i === tabbable ? 0 : -1}
                onClick={() => onSelect(center.key)}
                onKeyDown={(e) => radioKeyDown(e, i, items, (n) => onSelect(visible[n].key))}
                sx={{
                  position: 'relative', cursor: 'pointer', p: 1, borderRadius: '14px', outline: 'none',
                  display: 'flex', flexDirection: 'column',
                  border: '1.5px solid', borderColor: selected ? C.primary : border,
                  bgcolor: selected ? (isDark ? 'rgba(185,28,44,0.1)' : C.softer) : 'background.paper',
                  boxShadow: selected ? '0 8px 22px rgba(185,28,44,0.14)' : '0 1px 2px rgba(15,23,42,0.04)',
                  transition: 'border-color .18s, box-shadow .18s, transform .18s',
                  '&:hover': { borderColor: selected ? C.primary : isDark ? '#555' : '#CBD5E1', transform: 'translateY(-1px)' },
                  '&:focus-visible': { boxShadow: `0 0 0 3px ${C.ring}` },
                  '@media (prefers-reduced-motion: reduce)': { transition: 'none', '&:hover': { transform: 'none' } },
                }}>
                <Box sx={{ position: 'relative', mb: 1.25 }}>
                  <HospitalPhoto src={center.image} name={center.name} height={130} />
                  <Box aria-hidden="true" sx={{
                    position: 'absolute', top: 7, right: 7, width: 22, height: 22, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    bgcolor: selected ? C.primary : 'rgba(255,255,255,0.92)', border: selected ? '2px solid #fff' : '1.5px solid #94A3B8',
                    boxShadow: selected ? '0 2px 6px rgba(185,28,44,0.4)' : 'none',
                  }}>
                    {selected && <CheckIcon sx={{ fontSize: 14, color: '#fff' }} />}
                  </Box>
                </Box>

                <Box sx={{ px: 0.5 }}>
                  <Typography sx={{ fontWeight: 700, fontSize: '0.9rem', lineHeight: 1.3 }}>{center.name}</Typography>
                  {place && (
                    <Typography sx={{ color: 'text.secondary', fontSize: '0.78rem', mt: 0.5, display: 'flex', gap: 0.5, alignItems: 'flex-start' }}>
                      <PlaceOutlinedIcon sx={{ fontSize: 14, mt: '2px', flexShrink: 0 }} aria-hidden="true" />{place}
                    </Typography>
                  )}
                  {typeof km === 'number' && (
                    <Typography sx={{ color: 'text.secondary', fontSize: '0.78rem', mt: 0.4, display: 'flex', gap: 0.5, alignItems: 'center' }}>
                      <NearMeOutlinedIcon sx={{ fontSize: 14, flexShrink: 0 }} aria-hidden="true" />{formatKm(km)} away
                    </Typography>
                  )}
                </Box>

                {/* Registered hospitals receive bookings on their own dashboard */}
                {center.hospitalId && (
                  <Box sx={{ mt: 'auto', pt: 1.25 }}>
                    <Box component="span" sx={{
                      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0.6, px: 1, py: 0.6, borderRadius: '8px',
                      fontSize: { xs: '0.68rem', sm: '0.74rem' }, whiteSpace: 'nowrap', fontWeight: 600,
                      color: isDark ? '#86EFAC' : C.ok, bgcolor: isDark ? 'rgba(22,163,74,0.14)' : '#F0FDF4',
                    }}>
                      <EventAvailableOutlinedIcon sx={{ fontSize: 15 }} aria-hidden="true" />Accepting bookings
                    </Box>
                  </Box>
                )}
              </Box>
            );
          })}
        </Box>
      )}

      {!loading && !query.trim() && filtered.length > INITIAL_VISIBLE && (
        <Button size="small" onClick={() => setShowAll((v) => !v)} aria-expanded={expanded}
          sx={{ mt: 1.5, textTransform: 'none', fontWeight: 700, color: C.primary }}>
          {expanded ? 'Show fewer centers' : `Show all ${filtered.length} centers`}
        </Button>
      )}
    </Panel>
  );
}

const grid = { display: 'grid', gridTemplateColumns: { xs: 'repeat(2, minmax(0, 1fr))', sm: 'repeat(auto-fill, minmax(165px, 1fr))' }, gap: { xs: 1.25, sm: 1.5 } };
