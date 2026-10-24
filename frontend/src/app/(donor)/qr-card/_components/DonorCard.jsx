'use client';
import { forwardRef } from 'react';
import { Avatar, Box, Button, CircularProgress, Typography } from '@mui/material';
import FavoriteIcon from '@mui/icons-material/Favorite';
import VerifiedIcon from '@mui/icons-material/Verified';
import LockIcon from '@mui/icons-material/Lock';
import RefreshIcon from '@mui/icons-material/Refresh';
import QRCode from 'react-qr-code';
import { BRAND } from '@/lib/brand';

// The card uses fixed colours (not theme colours) so it looks the same in light and dark
// mode, in the downloaded PNG and on paper.
const RED = 'linear-gradient(125deg, #A3172A 0%, #B91C2C 45%, #8E1424 100%)';
const QR_INK = '#1A1A1A'; // near-black: the most reliable contrast for scanners

function Field({ label, children }) {
  return (
    <Box sx={{ minWidth: 0 }}>
      <Typography sx={{ fontSize: '0.62rem', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.7)' }}>
        {label}
      </Typography>
      <Typography component="div" sx={{ fontSize: '0.86rem', fontWeight: 700, color: '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
        {children}
      </Typography>
    </Box>
  );
}

/**
 * The donor ID card: name, photo, blood type, donor ID and the QR code. The QR encodes only
 * the server-signed token — staff scan it to load the donor's live record.
 * qrState: 'ready' | 'loading' | 'error' | 'locked'
 */
const DonorCard = forwardRef(function DonorCard(
  { name, photoSrc, initials, bloodType, donorId, verified, qrToken, qrState, validUntil, onRetry }, ref,
) {
  return (
    <Box ref={ref} id="donor-card" sx={{
      position: 'relative', overflow: 'hidden', borderRadius: '20px', color: '#fff', background: RED,
      boxShadow: '0 18px 40px rgba(136,29,42,0.28)', width: '100%', maxWidth: 560, mx: 'auto',
      printColorAdjust: 'exact', WebkitPrintColorAdjust: 'exact',
    }}>
      {/* Decoration */}
      <Box aria-hidden="true" sx={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
        <Box sx={{ position: 'absolute', right: -90, top: -120, width: 320, height: 320, borderRadius: '50%', background: 'radial-gradient(circle, rgba(255,255,255,0.16) 0%, transparent 62%)' }} />
        <Box sx={{ position: 'absolute', left: -70, bottom: -110, width: 240, height: 240, borderRadius: '50%', background: 'radial-gradient(circle, rgba(0,0,0,0.16) 0%, transparent 65%)' }} />
        <svg viewBox="0 0 400 40" preserveAspectRatio="none" style={{ position: 'absolute', left: 0, right: 0, bottom: 44, width: '100%', height: 34, opacity: 0.16 }}>
          <polyline fill="none" stroke="#fff" strokeWidth="2" points="0,20 150,20 165,20 175,4 188,36 200,12 210,20 400,20" />
        </svg>
      </Box>

      {/* Header */}
      <Box sx={{ position: 'relative', display: 'flex', alignItems: 'center', gap: 1.25, px: { xs: 2.25, sm: 3 }, pt: { xs: 2.25, sm: 2.75 } }}>
        <Box aria-hidden="true" sx={{ width: 34, height: 34, borderRadius: '10px', bgcolor: '#fff', color: '#B91C2C', display: 'grid', placeItems: 'center', flexShrink: 0 }}>
          <FavoriteIcon sx={{ fontSize: 20 }} />
        </Box>
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography sx={{ fontWeight: 800, fontSize: '1rem', lineHeight: 1.1, color: '#fff' }}>{BRAND.name}</Typography>
          <Typography sx={{ fontSize: '0.64rem', fontWeight: 600, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.75)' }}>
            Blood Donor ID Card
          </Typography>
        </Box>
        <Box sx={{
          px: 1.5, py: 0.5, borderRadius: '12px', bgcolor: '#fff', color: '#B91C2C', textAlign: 'center', flexShrink: 0,
          boxShadow: '0 6px 14px rgba(0,0,0,0.18)',
        }}>
          <Typography sx={{ fontSize: '0.55rem', fontWeight: 700, letterSpacing: '0.12em', color: 'rgba(185,28,44,0.75)', lineHeight: 1.2 }}>TYPE</Typography>
          <Typography sx={{ fontWeight: 900, fontSize: '1.45rem', lineHeight: 1, letterSpacing: '-0.02em' }}>{bloodType || '—'}</Typography>
        </Box>
      </Box>

      {/* Body */}
      <Box sx={{ position: 'relative', display: 'flex', alignItems: 'center', gap: { xs: 1.75, sm: 3 }, px: { xs: 2.25, sm: 3 }, py: { xs: 2.25, sm: 2.75 } }}>
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2, minWidth: 0 }}>
            <Avatar src={photoSrc || undefined} alt="" imgProps={{ crossOrigin: 'anonymous' }} sx={{
              width: { xs: 52, sm: 64 }, height: { xs: 52, sm: 64 }, fontSize: { xs: '1.2rem', sm: '1.45rem' }, fontWeight: 800,
              bgcolor: '#F3C1C7', color: '#7F1220', border: '3px solid #fff', boxShadow: '0 6px 16px rgba(0,0,0,0.2)',
            }}>
              {!photoSrc && initials}
            </Avatar>
            <Box sx={{ minWidth: 0 }}>
              <Typography sx={{ fontWeight: 800, fontSize: { xs: '1.05rem', sm: '1.25rem' }, lineHeight: 1.15, color: '#fff', overflowWrap: 'anywhere' }}>
                {name || 'Donor'}
              </Typography>
              <Box sx={{
                mt: 0.6, display: 'inline-flex', alignItems: 'center', gap: 0.5, px: 1, py: 0.25, borderRadius: '999px',
                bgcolor: verified ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.18)', border: '1px solid rgba(255,255,255,0.28)',
                fontSize: '0.7rem', fontWeight: 700, color: '#fff',
              }}>
                {verified ? <VerifiedIcon sx={{ fontSize: 13 }} /> : <LockIcon sx={{ fontSize: 12 }} />}
                {verified ? 'Verified donor' : 'Not registered'}
              </Box>
            </Box>
          </Box>
          <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1.5 }}>
            <Field label="Donor ID"><Box component="span" sx={{ fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace', letterSpacing: '0.04em' }}>{donorId}</Box></Field>
            <Field label="QR valid until">{validUntil || '—'}</Field>
          </Box>
        </Box>

        {/* QR tile */}
        <Box sx={{
          flexShrink: 0, p: { xs: 1, sm: 1.25 }, borderRadius: '14px', bgcolor: '#fff', boxShadow: '0 8px 20px rgba(0,0,0,0.2)',
          width: { xs: 112, sm: 150 }, height: { xs: 112, sm: 150 }, display: 'grid', placeItems: 'center',
        }}>
          {qrState === 'ready' ? (
            <QRCode value={qrToken} size={256} fgColor={QR_INK} bgColor="#FFFFFF" level="M"
              style={{ width: '100%', height: '100%' }} title="Donor QR code" />
          ) : qrState === 'loading' ? (
            <CircularProgress size={26} sx={{ color: '#B91C2C' }} aria-label="Generating QR code" />
          ) : qrState === 'error' ? (
            <Box sx={{ textAlign: 'center', color: '#5F5F5F' }}>
              <Typography sx={{ fontSize: '0.7rem', fontWeight: 600, mb: 0.5 }}>Couldn’t load QR</Typography>
              <Button size="small" onClick={onRetry} startIcon={<RefreshIcon sx={{ fontSize: 16 }} />}
                sx={{ fontSize: '0.72rem', fontWeight: 700, color: '#B91C2C', minWidth: 0, px: 1 }}>
                Retry
              </Button>
            </Box>
          ) : (
            <Box sx={{ textAlign: 'center', color: '#8A8A8A' }}>
              <LockIcon sx={{ fontSize: 28 }} />
              <Typography sx={{ fontSize: '0.66rem', fontWeight: 600, mt: 0.25, lineHeight: 1.3 }}>Register to<br />unlock</Typography>
            </Box>
          )}
        </Box>
      </Box>

      {/* Footer */}
      <Box sx={{
        position: 'relative', px: { xs: 2.25, sm: 3 }, py: 1.1, bgcolor: 'rgba(0,0,0,0.18)',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 2,
      }}>
        <Typography sx={{ fontSize: '0.68rem', color: 'rgba(255,255,255,0.85)', fontWeight: 600 }}>
          Show at any partner hospital or blood drive
        </Typography>
        <Typography sx={{ fontSize: '0.68rem', color: 'rgba(255,255,255,0.85)', fontWeight: 600, whiteSpace: 'nowrap' }}>
          {BRAND.tagline}
        </Typography>
      </Box>
    </Box>
  );
});

export default DonorCard;
