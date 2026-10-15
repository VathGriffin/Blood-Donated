'use client';
// Shared building blocks for the donor dashboard pages (/profile, /my-appointments).
import Link from 'next/link';
import { useState } from 'react';
import { Box, ButtonBase, IconButton, ListItemIcon, Menu, MenuItem, Typography } from '@mui/material';
import { alpha } from '@mui/material/styles';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import WaterDropIcon from '@mui/icons-material/WaterDrop';

// Status → theme tone (theme.custom.tones) and label. Only states the API can return.
export const REQUEST_STATUS = {
  Pending:   { tone: 'warning', label: 'Pending' },
  Approved:  { tone: 'success', label: 'Approved' },
  Fulfilled: { tone: 'info',    label: 'Fulfilled' },
  Rejected:  { tone: 'error',   label: 'Rejected' },
  Cancelled: { tone: 'neutral', label: 'Cancelled' },
};
export const REQUEST_FILTERS = ['All', 'Pending', 'Approved', 'Fulfilled', 'Rejected', 'Cancelled'];

export const APPT_STATUS = {
  Pending:   { tone: 'warning', label: 'Pending' },
  Confirmed: { tone: 'success', label: 'Confirmed' },
  CheckedIn: { tone: 'info',    label: 'Checked in' },
  Cancelled: { tone: 'neutral', label: 'Cancelled' },
};
export const APPT_FILTERS = ['All', 'Pending', 'Confirmed', 'CheckedIn', 'Cancelled'];

export const URGENCY_TONE = { Critical: 'error', High: 'warning', Medium: 'warning', Low: 'neutral' };

export const formatDate = (value, opts = { day: 'numeric', month: 'short', year: 'numeric' }) => {
  if (!value) return null;
  // Appointment dates are plain "YYYY-MM-DD" strings: read them as local days, not UTC.
  const d = typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value) ? new Date(`${value}T00:00:00`) : new Date(value);
  return Number.isNaN(d.getTime()) ? null : d.toLocaleDateString('en-US', opts);
};

export const todayKey = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

export const cardSx = {
  borderRadius: '16px',
  border: '1px solid', borderColor: 'divider', bgcolor: 'background.paper',
  boxShadow: (t) => t.custom.shadow.xs,
};

// Soft round icon used in cards ("light red circle, red glyph").
export function IconCircle({ children, size = 52, tone = 'primary' }) {
  return (
    <Box aria-hidden="true" sx={{
      width: size, height: size, borderRadius: '50%', flexShrink: 0, display: 'grid', placeItems: 'center',
      bgcolor: (t) => t.custom.tones[tone].bg,
      color: (t) => (tone === 'primary' ? t.palette.primary.main : t.custom.tones[tone].fg),
      '& svg': { fontSize: size * 0.48 },
    }}>
      {children}
    </Box>
  );
}

export function Pill({ tone = 'neutral', children, icon, sx }) {
  return (
    <Box component="span" sx={{
      display: 'inline-flex', alignItems: 'center', gap: 0.5, px: 1.1, py: 0.35, borderRadius: '999px',
      fontSize: '0.75rem', fontWeight: 700, lineHeight: 1.4, whiteSpace: 'nowrap',
      bgcolor: (t) => t.custom.tones[tone].bg, color: (t) => t.custom.tones[tone].fg,
      '& svg': { fontSize: 15 }, ...sx,
    }}>
      {icon}
      {children}
    </Box>
  );
}

// Blood-bag style tag: a pale-red rounded tile with a drop above the type (e.g. "A-").
export function BloodBadge({ type, width = 64, height = 80 }) {
  return (
    <Box role="img" aria-label={`Blood type ${type || 'unknown'}`} sx={{ position: 'relative', flexShrink: 0, pt: '6px' }}>
      <Box aria-hidden="true" sx={{
        position: 'absolute', top: 0, left: '50%', transform: 'translateX(-50%)', width: 14, height: 10,
        borderRadius: '4px 4px 0 0', bgcolor: (t) => t.custom.tones.primary.bg,
        border: '1px solid', borderBottom: 0, borderColor: (t) => (t.palette.mode === 'dark' ? 'rgba(255,255,255,0.08)' : '#F3C1C7'),
      }} />
      <Box sx={{
        width, height, borderRadius: '12px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 0.5,
        bgcolor: (t) => t.custom.tones.primary.bg, color: 'primary.main',
        border: '1px solid', borderColor: (t) => (t.palette.mode === 'dark' ? 'rgba(255,255,255,0.08)' : '#F3C1C7'),
      }}>
        <WaterDropIcon aria-hidden="true" sx={{ fontSize: 20 }} />
        <Typography component="span" sx={{ fontWeight: 800, fontSize: '1.3rem', lineHeight: 1, letterSpacing: '-0.02em' }}>{type || '—'}</Typography>
      </Box>
    </Box>
  );
}

// Bordered, tinted message strip inside a card.
export function Notice({ tone = 'neutral', icon, children }) {
  return (
    <Box sx={{
      display: 'flex', alignItems: 'center', gap: 1.25, px: 2, py: 1.25, borderRadius: '12px',
      bgcolor: (t) => t.custom.tones[tone].bg, color: (t) => t.custom.tones[tone].fg,
      border: '1px solid', borderColor: (t) => alpha(t.custom.tones[tone].dot, 0.3),
      fontSize: '0.86rem', fontWeight: 600, lineHeight: 1.5,
      '& svg': { fontSize: 20, flexShrink: 0, color: (t) => t.custom.tones[tone].dot },
    }}>
      {icon}
      <Box sx={{ minWidth: 0, overflowWrap: 'anywhere' }}>{children}</Box>
    </Box>
  );
}

// White list card used for requests, appointments and donations.
export const itemCardSx = {
  p: { xs: 2, sm: 2.5 }, borderRadius: '16px', display: 'flex', flexDirection: 'column', gap: 2,
  border: '1px solid', borderColor: 'divider', bgcolor: 'background.paper',
  boxShadow: (t) => t.custom.shadow.xs, transition: 'box-shadow .15s, border-color .15s',
  '&:hover': { boxShadow: (t) => t.custom.shadow.sm },
};

export function EmptyPanel({ icon, title, text, action }) {
  return (
    <Box sx={{ py: { xs: 6, md: 7 }, px: 3, textAlign: 'center' }}>
      <Box sx={{ display: 'flex', justifyContent: 'center', mb: 1.75 }}><IconCircle size={60}>{icon}</IconCircle></Box>
      <Typography sx={{ fontWeight: 700 }}>{title}</Typography>
      {text && <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5, maxWidth: 400, mx: 'auto' }}>{text}</Typography>}
      {action && <Box sx={{ mt: 2.25 }}>{action}</Box>}
    </Box>
  );
}

/**
 * Summary card: icon circle, small title, big number, a sub line and a chevron. The whole
 * card is one control — a link when `href` is given, otherwise a button calling `onClick`.
 */
export function StatCard({ icon, label, value, sub, loading, href, onClick, tone = 'primary', selected = false, compact = false }) {
  const linkProps = href ? { component: Link, href } : { onClick };
  return (
    <ButtonBase {...linkProps} focusRipple aria-label={`${label}: ${loading ? 'loading' : value}${sub ? `. ${sub}` : ''}`}
      aria-pressed={onClick ? selected : undefined} sx={{
      ...cardSx, ...(selected && { borderColor: 'primary.main', boxShadow: (t) => `0 0 0 1px ${t.palette.primary.main}` }),
      p: compact ? { xs: 1.75, xl: 1.75 } : { xs: 2, sm: 2.5 }, display: 'flex', alignItems: 'flex-start', justifyContent: 'flex-start', gap: compact ? 1.25 : 2,
      textAlign: 'left', width: '100%', height: '100%', minWidth: 0, transition: 'box-shadow .15s, border-color .15s',
      '&:hover': { boxShadow: (t) => t.custom.shadow.md, borderColor: (t) => alpha(t.palette.primary.main, 0.3) },
      '&.Mui-focusVisible': { outline: '2px solid', outlineColor: 'primary.main', outlineOffset: 2 },
    }}>
      <IconCircle size={compact ? 44 : 54} tone={tone}>{icon}</IconCircle>
      <Box sx={{ minWidth: 0, flex: 1 }}>
        <Typography sx={{ fontSize: '0.92rem', fontWeight: 700, color: 'text.primary', lineHeight: 1.3 }}>{label}</Typography>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1, mt: 0.5 }}>
          <Typography sx={{ fontWeight: 800, fontSize: '1.9rem', lineHeight: 1.1, letterSpacing: '-0.02em', color: 'text.primary' }}>
            {loading ? '…' : value}
          </Typography>
          <Box aria-hidden="true" sx={{
            width: 30, height: 30, borderRadius: '50%', flexShrink: 0, display: 'grid', placeItems: 'center',
            bgcolor: (t) => t.custom.tones.primary.bg, color: 'primary.main',
          }}>
            <ChevronRightIcon sx={{ fontSize: 20 }} />
          </Box>
        </Box>
        {sub && <Typography variant="body2" color="text.secondary" sx={{ mt: 0.75, fontSize: '0.84rem' }}>{sub}</Typography>}
      </Box>
    </ButtonBase>
  );
}

// ── Card actions ──────────────────────────────────────────────────────────────

export const actionBtnSx = {
  height: 46, px: 2.25, borderRadius: '12px', fontWeight: 700, fontSize: '0.92rem', whiteSpace: 'nowrap',
  bgcolor: 'background.paper', borderColor: 'divider', color: 'text.primary', borderWidth: 1.5,
  '&:hover': { borderColor: 'text.secondary', bgcolor: 'background.paper', borderWidth: 1.5 },
};
export const dangerBtnSx = {
  ...actionBtnSx, color: 'primary.main', borderColor: 'primary.main',
  '&:hover': { borderColor: 'primary.dark', bgcolor: (t) => t.custom.tones.primary.bg, borderWidth: 1.5 },
};

export function MetaLine({ icon, children, sx }) {
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.85, color: 'text.secondary', fontSize: '0.92rem', minWidth: 0, ...sx }}>
      <Box component="span" aria-hidden="true" sx={{ display: 'flex', '& svg': { fontSize: 18 } }}>{icon}</Box>
      <Box component="span" sx={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{children}</Box>
    </Box>
  );
}

/**
 * ⋮ overflow menu for one card. `items` are only actions the API allows for that record:
 * { label, icon, onClick? | href? (+ external for tel:), danger?, disabled? }.
 * Clicks never reach the card underneath, and the menu renders in a portal so the card's
 * overflow can't clip it. MUI's Menu handles Escape, click-outside, arrow keys and focus return.
 */
export function CardMenu({ id, label, items }) {
  const [anchor, setAnchor] = useState(null);
  const open = Boolean(anchor);
  if (!items.length) return null;
  const buttonId = `menu-btn-${id}`;
  const menuId = `menu-${id}`;
  const close = () => setAnchor(null);

  return (
    <>
      <IconButton id={buttonId} aria-label={`More actions for ${label}`} aria-haspopup="menu"
        aria-controls={open ? menuId : undefined} aria-expanded={open ? 'true' : undefined}
        onClick={(e) => { e.stopPropagation(); setAnchor(e.currentTarget); }}
        sx={{
          width: 38, height: 38, mr: -0.75, color: 'text.secondary', flexShrink: 0,
          bgcolor: open ? 'action.selected' : 'transparent',
          transition: 'background-color .15s, color .15s',
          '&:hover': { bgcolor: 'action.hover', color: 'text.primary' },
          '&.Mui-focusVisible': { bgcolor: 'action.hover', outline: '2px solid', outlineColor: 'primary.main', outlineOffset: 1 },
        }}>
        <MoreVertIcon />
      </IconButton>
      <Menu id={menuId} anchorEl={anchor} open={open} onClose={close} onClick={(e) => e.stopPropagation()}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }} transformOrigin={{ vertical: 'top', horizontal: 'right' }}
        slotProps={{
          list: { 'aria-labelledby': buttonId, dense: false, sx: { py: 0.75 } },
          paper: { elevation: 0, sx: {
            mt: 0.75, minWidth: 220, borderRadius: '12px', border: '1px solid', borderColor: 'divider',
            boxShadow: (t) => t.custom.shadow.lg,
          } },
        }}>
        {items.map((it) => (
          <MenuItem key={it.label} disabled={it.disabled}
            onClick={() => { close(); it.onClick?.(); }}
            {...(it.href ? { component: it.external ? 'a' : Link, href: it.href } : {})}
            sx={{
              mx: 0.75, px: 1.25, py: 1, borderRadius: '8px', fontSize: '0.9rem', fontWeight: 500, gap: 0.25,
              ...(it.danger && { color: 'error.main', '&:hover': { bgcolor: (t) => t.custom.tones.error.bg } }),
            }}>
            <ListItemIcon sx={{ color: 'inherit', minWidth: '32px !important', '& svg': { fontSize: 19 } }}>{it.icon}</ListItemIcon>
            {it.label}
          </MenuItem>
        ))}
      </Menu>
    </>
  );
}
