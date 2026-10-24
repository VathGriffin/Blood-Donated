'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Box, Button, Container, Skeleton, Typography } from '@mui/material';
import { alpha } from '@mui/material/styles';
import WaterDropIcon from '@mui/icons-material/WaterDrop';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import PeopleAltOutlinedIcon from '@mui/icons-material/PeopleAltOutlined';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import { formatDistanceToNow } from 'date-fns';
import API_BASE from '@/lib/config';
import { BLOOD_TYPES } from '@/lib/inventory';
import { GIVES_TO, RECEIVES_FROM } from '@/lib/blood-compat';

// Stock status from GET /api/inventory/network (same thresholds as the dashboards).
const STATUS = {
  adequate: { label: 'Good supply', tone: 'success' },
  low: { label: 'Running low', tone: 'warning' },
  critical: { label: 'Critical', tone: 'error' },
  empty: { label: 'Out of stock', tone: 'error' },
};
const NEEDS_DONORS = new Set(['low', 'critical', 'empty']);

// How full the bar is: three times the minimum counts as a comfortable, full supply.
const fillOf = (row) => (row ? Math.max(0.04, Math.min(1, row.units / Math.max(1, row.minUnits * 3))) : 0);

function TypeTile({ type, row, selected, loading, onSelect }) {
  const status = row ? STATUS[row.status] : null;
  return (
    <Box component="button" type="button" role="radio" aria-checked={selected} onClick={onSelect}
      aria-label={`${type}${status ? `, ${status.label}, ${row.units} units` : ''}`}
      sx={{
        all: 'unset', boxSizing: 'border-box', cursor: 'pointer', p: { xs: 1.5, sm: 1.75 }, borderRadius: '14px',
        display: 'flex', flexDirection: 'column', justifyContent: 'space-between', minHeight: { xs: 92, sm: 104 },
        border: '1.5px solid', borderColor: selected ? 'primary.main' : 'divider', bgcolor: 'background.paper',
        boxShadow: (t) => (selected ? `0 8px 24px ${alpha(t.palette.primary.main, 0.18)}` : t.custom.shadow.xs),
        transition: 'border-color .15s, box-shadow .2s, transform .2s',
        '&:hover': { borderColor: 'primary.main', transform: 'translateY(-2px)' },
        '&:focus-visible': { outline: '2px solid', outlineColor: 'primary.main', outlineOffset: 2 },
        '@media (prefers-reduced-motion: reduce)': { transition: 'none', '&:hover': { transform: 'none' } },
      }}>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1 }}>
        <Typography component="span" sx={{ fontWeight: 900, fontSize: { xs: '1.35rem', sm: '1.55rem' }, letterSpacing: '-0.03em', color: 'primary.main', lineHeight: 1 }}>
          {type}
        </Typography>
        {status && (
          <Box component="span" aria-hidden="true" sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: (t) => t.custom.tones[status.tone].dot }} />
        )}
      </Box>
      {loading ? (
        <><Skeleton height={8} sx={{ mt: 1.25, transform: 'none', borderRadius: 4 }} /><Skeleton width="60%" /></>
      ) : row ? (
        <>
          <Box aria-hidden="true" sx={{ mt: 1.25, height: 6, borderRadius: 3, bgcolor: (t) => t.custom.surface.subtle, overflow: 'hidden' }}>
            <Box sx={{ height: '100%', width: `${fillOf(row) * 100}%`, borderRadius: 3, bgcolor: (t) => t.custom.tones[status.tone].dot }} />
          </Box>
          <Typography component="span" sx={{ display: 'block', mt: 0.75, fontSize: '0.74rem', fontWeight: 700, color: (t) => t.custom.tones[status.tone].fg }}>
            {status.label}
          </Typography>
        </>
      ) : (
        <Typography component="span" sx={{ display: 'block', mt: 1.25, fontSize: '0.74rem', color: 'text.secondary' }}>Stock unavailable</Typography>
      )}
    </Box>
  );
}

function TypeList({ label, types, tone }) {
  return (
    <Box>
      <Typography sx={{ fontSize: '0.78rem', fontWeight: 700, color: 'text.secondary', mb: 0.75 }}>{label}</Typography>
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.75 }}>
        {types.map((t) => (
          <Box key={t} component="span" sx={{
            px: 1.1, py: 0.35, borderRadius: '8px', fontWeight: 800, fontSize: '0.85rem',
            bgcolor: (th) => th.custom.tones[tone].bg, color: (th) => th.custom.tones[tone].fg,
          }}>{t}</Box>
        ))}
      </Box>
    </Box>
  );
}

/**
 * Live blood supply across the network (central pool + every hospital), per blood type, with
 * red-cell compatibility for the selected type. Kept at #compatibility for the site search link.
 */
export default function BloodSupplySection() {
  const [rows, setRows] = useState(null);
  const [state, setState] = useState('loading'); // 'loading' | 'ready' | 'error'
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    const ctrl = new AbortController();
    fetch(`${API_BASE}/api/inventory/network`, { signal: ctrl.signal })
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((data) => {
        const list = Array.isArray(data) ? data : [];
        setRows(Object.fromEntries(list.map((r) => [r.bloodType, r])));
        setState('ready');
        // Open on the type that most needs donors, so the section leads with what matters.
        const order = ['empty', 'critical', 'low'];
        const neediest = [...list].filter((r) => NEEDS_DONORS.has(r.status))
          .sort((a, b) => order.indexOf(a.status) - order.indexOf(b.status) || a.units - b.units)[0];
        setSelected((s) => s || neediest?.bloodType || 'O-');
      })
      .catch((err) => { if (err?.name !== 'AbortError') { setState('error'); setSelected((s) => s || 'O-'); } });
    return () => ctrl.abort();
  }, []);

  const active = selected || 'O-';
  const row = rows?.[active];
  const status = row ? STATUS[row.status] : null;
  const needs = row && NEEDS_DONORS.has(row.status);
  const lowTypes = rows ? BLOOD_TYPES.filter((t) => rows[t] && NEEDS_DONORS.has(rows[t].status)) : [];
  const updated = rows && Object.values(rows).map((r) => r.lastUpdated).filter(Boolean).sort().pop();

  return (
    <Box component="section" id="compatibility" aria-labelledby="supply-title" sx={{
      pt: { xs: 5, md: 7 }, pb: { xs: 7, md: 9 }, scrollMarginTop: { xs: 64, md: 68 },
      background: (t) => (t.palette.mode === 'dark'
        ? 'linear-gradient(180deg, #0a0a0a 0%, #140c0d 100%)'
        : 'linear-gradient(180deg, #FFFFFF 0%, #FFF5F6 100%)'),
    }}>
      <Container maxWidth="lg">
        <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, alignItems: { md: 'flex-end' }, justifyContent: 'space-between', gap: 2, mb: { xs: 3, md: 4 } }}>
          <Box sx={{ maxWidth: 620 }}>
            <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.75, px: 1.25, py: 0.4, borderRadius: '999px', mb: 1.5,
              bgcolor: (t) => t.custom.tones.primary.bg, color: 'primary.main', fontWeight: 700, fontSize: '0.75rem' }}>
              <Box component="span" aria-hidden="true" sx={{
                width: 8, height: 8, borderRadius: '50%', bgcolor: 'primary.main',
                '@media (prefers-reduced-motion: no-preference)': { animation: 'supplyPulse 1.6s ease-in-out infinite' },
                '@keyframes supplyPulse': { '0%,100%': { opacity: 1 }, '50%': { opacity: 0.35 } },
              }} />
              LIVE BLOOD SUPPLY
            </Box>
            <Typography id="supply-title" component="h2" sx={{ fontSize: { xs: '1.7rem', md: '2.2rem' }, fontWeight: 800, letterSpacing: '-0.025em', lineHeight: 1.15 }}>
              Which blood types are needed now?
            </Typography>
            <Typography sx={{ mt: 1, color: 'text.secondary', lineHeight: 1.65 }}>
              {state === 'ready' && lowTypes.length
                ? <>Stock of <Box component="strong" sx={{ color: 'primary.main' }}>{lowTypes.join(', ')}</Box> is running low across our partner hospitals. Pick a type to see who it can help.</>
                : 'Current stock across our partner hospitals. Pick a type to see who it can help.'}
            </Typography>
          </Box>
          {updated && (
            <Typography sx={{ fontSize: '0.8rem', color: 'text.secondary', whiteSpace: 'nowrap' }}>
              Updated {formatDistanceToNow(new Date(updated), { addSuffix: true })}
            </Typography>
          )}
        </Box>

        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'minmax(0, 1.35fr) minmax(0, 1fr)' }, gap: { xs: 2.5, md: 3 }, alignItems: 'stretch' }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: { xs: 1.25, sm: 1.5 } }}>
            <Box role="radiogroup" aria-label="Blood type" sx={{
              flex: 1, display: 'grid', gridTemplateColumns: { xs: 'repeat(2, 1fr)', sm: 'repeat(4, 1fr)' }, gridAutoRows: '1fr', gap: { xs: 1.25, sm: 1.5 },
            }}>
              {BLOOD_TYPES.map((t) => (
                <TypeTile key={t} type={t} row={rows?.[t]} loading={state === 'loading'} selected={t === active} onSelect={() => setSelected(t)} />
              ))}
            </Box>
            {state === 'ready' && rows && Object.keys(rows).length > 0 && (
              <Box sx={{
                display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: { xs: 1.25, sm: 2.5 }, px: 2, py: 1.5, borderRadius: '14px',
                bgcolor: 'background.paper', border: '1px solid', borderColor: 'divider',
              }}>
                {[['success', 'Good supply', ['adequate']], ['warning', 'Running low', ['low']], ['error', 'Critical / out', ['critical', 'empty']]].map(([tone, label, keys]) => (
                  <Box key={label} sx={{ display: 'flex', alignItems: 'center', gap: 0.75, fontSize: '0.82rem' }}>
                    <Box component="span" aria-hidden="true" sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: (t) => t.custom.tones[tone].dot }} />
                    <Box component="span" sx={{ fontWeight: 800 }}>{Object.values(rows).filter((r) => keys.includes(r.status)).length}</Box>
                    <Box component="span" sx={{ color: 'text.secondary' }}>{label}</Box>
                  </Box>
                ))}
                <Typography sx={{ ml: { sm: 'auto' }, fontSize: '0.82rem', color: 'text.secondary' }}>
                  <Box component="strong" sx={{ color: 'text.primary' }}>{Object.values(rows).reduce((n, r) => n + r.units, 0).toLocaleString()}</Box> units in stock
                </Typography>
              </Box>
            )}
          </Box>

          <Box aria-live="polite" sx={{
            borderRadius: '18px', p: { xs: 2.5, sm: 3 }, bgcolor: 'background.paper', border: '1px solid', borderColor: 'divider',
            boxShadow: (t) => t.custom.shadow.md, display: 'flex', flexDirection: 'column', gap: 2,
          }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.75 }}>
              <Box aria-hidden="true" sx={{
                width: 64, height: 64, borderRadius: '16px', flexShrink: 0, display: 'grid', placeItems: 'center',
                bgcolor: 'primary.main', color: 'primary.contrastText', position: 'relative',
              }}>
                <WaterDropIcon sx={{ position: 'absolute', fontSize: 52, opacity: 0.18 }} />
                <Typography component="span" sx={{ fontWeight: 900, fontSize: '1.45rem', position: 'relative' }}>{active}</Typography>
              </Box>
              <Box sx={{ minWidth: 0 }}>
                <Typography component="h3" sx={{ fontWeight: 800, fontSize: '1.15rem' }}>Blood type {active}</Typography>
                {status ? (
                  <Typography sx={{ fontSize: '0.88rem', color: (t) => t.custom.tones[status.tone].fg, fontWeight: 700 }}>
                    {status.label} · {row.units.toLocaleString()} unit{row.units !== 1 ? 's' : ''} in stock
                  </Typography>
                ) : (
                  <Typography sx={{ fontSize: '0.88rem', color: 'text.secondary' }}>
                    {state === 'loading' ? 'Checking stock…' : 'Live stock is unavailable right now.'}
                  </Typography>
                )}
              </Box>
            </Box>

            <TypeList label={`${active} donors can give red cells to`} types={GIVES_TO[active]} tone="success" />
            <TypeList label={`${active} patients can receive red cells from`} types={RECEIVES_FROM[active]} tone="info" />

            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mt: 'auto' }}>
              <Button component={Link} href="/appointments" variant={needs ? 'contained' : 'outlined'} startIcon={<CalendarMonthIcon />}
                sx={{ fontWeight: 700, flex: { xs: '1 1 100%', sm: '1 1 auto' }, ...(needs ? {} : { borderWidth: 1.5, '&:hover': { borderWidth: 1.5 } }) }}>
                {needs ? `Donate ${active} — book now` : 'Book a donation'}
              </Button>
              <Button component={Link} href={`/donors?type=${encodeURIComponent(active)}`} color="inherit" startIcon={<PeopleAltOutlinedIcon />} endIcon={<ArrowForwardIcon />}
                sx={{ fontWeight: 700, color: 'text.secondary', flex: { xs: '1 1 100%', sm: '0 1 auto' } }}>
                {active} donors
              </Button>
            </Box>
            <Typography sx={{ display: 'flex', gap: 0.75, fontSize: '0.74rem', color: 'text.secondary', lineHeight: 1.5 }}>
              <InfoOutlinedIcon aria-hidden="true" sx={{ fontSize: 15, mt: '1px' }} />
              A general guide to red-cell compatibility. Hospitals always confirm compatibility with their own tests before a transfusion.
            </Typography>
          </Box>
        </Box>
      </Container>
    </Box>
  );
}
