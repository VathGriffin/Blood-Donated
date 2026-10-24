'use client';
import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import {
  Box, Button, Dialog, DialogContent, GlobalStyles, IconButton, Skeleton, Snackbar, Alert, Typography,
} from '@mui/material';
import QrCode2Icon from '@mui/icons-material/QrCode2';
import DownloadIcon from '@mui/icons-material/Download';
import PrintIcon from '@mui/icons-material/Print';
import FullscreenIcon from '@mui/icons-material/Fullscreen';
import CloseIcon from '@mui/icons-material/Close';
import LockIcon from '@mui/icons-material/Lock';
import VerifiedIcon from '@mui/icons-material/Verified';
import PersonOffIcon from '@mui/icons-material/PersonOff';
import ShieldOutlinedIcon from '@mui/icons-material/ShieldOutlined';
import WaterDropIcon from '@mui/icons-material/WaterDrop';
import EventAvailableOutlinedIcon from '@mui/icons-material/EventAvailableOutlined';
import HistoryIcon from '@mui/icons-material/History';
import FavoriteBorderIcon from '@mui/icons-material/FavoriteBorder';
import QRCode from 'react-qr-code';
import axios from 'axios';
import { useUserAuth } from '@/store/UserAuthContext';
import API_BASE from '@/lib/config';
import { initialsOf } from '@/lib/format';
import DonorPageHero from '@/components/donor/PageHero';
import { IconCircle, Notice, Pill, cardSx, formatDate } from '@/components/donor/ui';
import DonorCard from './_components/DonorCard';

const ELIGIBILITY_DAYS = 56; // same interval as the API (Backend/src/common/eligibility.js)

// Expiry of the signed QR token, read from its payload (display only — the server checks it).
function tokenExpiry(token) {
  try {
    const payload = JSON.parse(atob(token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')));
    return payload.exp ? new Date(payload.exp * 1000) : null;
  } catch {
    return null;
  }
}

function nextEligible(lastDonation) {
  if (!lastDonation) return null;
  const d = new Date(new Date(lastDonation).getTime() + ELIGIBILITY_DAYS * 86400000);
  return d > new Date() ? d : null;
}

const STEPS = [
  { title: 'Open or print your card', text: 'Keep it on your phone, or print it to carry in your wallet.' },
  { title: 'Show it at check-in', text: 'Hand it to staff at any partner hospital or blood drive.' },
  { title: 'Staff scan the QR', text: 'They see your live donor record instantly — no forms to fill in.' },
];

function InfoRow({ icon, label, children }) {
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, py: 1.4, '&:not(:last-of-type)': { borderBottom: '1px solid', borderColor: 'divider' } }}>
      <IconCircle size={38}>{icon}</IconCircle>
      <Typography sx={{ flex: 1, fontSize: '0.9rem', color: 'text.secondary', fontWeight: 600 }}>{label}</Typography>
      <Box sx={{ fontSize: '0.9rem', fontWeight: 700, textAlign: 'right' }}>{children}</Box>
    </Box>
  );
}

const actionSx = { height: 46, borderRadius: '12px', fontWeight: 700, textTransform: 'none', flex: { sm: 1 } };

export default function QRCardPage() {
  const { isAuth, user, token } = useUserAuth();
  const cardRef = useRef(null);

  const [donor, setDonor] = useState(null);           // null = loading, false = not registered
  const [qrToken, setQrToken] = useState(null);       // signed, opaque — issued by the server, never built client-side
  const [qrStatus, setQrStatus] = useState('idle');   // idle | loading | ready | error
  const [bigQr, setBigQr] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [toast, setToast] = useState(null);

  const loadQr = useCallback((donorId) => {
    setQrStatus('loading');
    axios.get(`${API_BASE}/api/donors/${donorId}/qr-token`, { headers: { Authorization: `Bearer ${token}` } })
      .then((res) => { setQrToken(res.data.token); setQrStatus('ready'); })
      .catch(() => { setQrToken(null); setQrStatus('error'); });
  }, [token]);

  useEffect(() => {
    if (!isAuth || !user?.email) return;
    setDonor(null);
    axios.get(`${API_BASE}/api/donors/lookup?email=${encodeURIComponent(user.email)}`, { headers: { Authorization: `Bearer ${token}` } })
      .then((res) => {
        if (!res.data.found) { setDonor(false); return; }
        setDonor(res.data);
        loadQr(res.data._id);
      })
      .catch(() => setDonor(false));
  }, [isAuth, user?.email, token, loadQr]);

  if (!isAuth) {
    return (
      <Box sx={{ ...cardSx, maxWidth: 480, mx: 'auto', mt: 6, p: 4, textAlign: 'center' }}>
        <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2 }}><IconCircle size={64}><LockIcon /></IconCircle></Box>
        <Typography variant="h5" fontWeight={800} gutterBottom>Log in to view your QR card</Typography>
        <Typography variant="body2" color="text.secondary" mb={3}>Your donor ID card is only available when you’re signed in.</Typography>
        <Box sx={{ display: 'flex', gap: 1.5, justifyContent: 'center' }}>
          <Button variant="contained" component={Link} href="/login" sx={{ borderRadius: '12px', fontWeight: 700 }}>Log in</Button>
          <Button variant="outlined" component={Link} href="/register" sx={{ borderRadius: '12px', fontWeight: 700 }}>Sign up</Button>
        </Box>
      </Box>
    );
  }

  const loading = donor === null;
  const verified = !!donor;
  const donorId = user?.id ? `BD-${String(user.id).slice(-6).toUpperCase()}` : 'BD-XXXXXX';
  const photoSrc = user?.photo ? `${API_BASE}${user.photo}` : null;
  const expiry = qrToken ? tokenExpiry(qrToken) : null;
  const eligibleOn = verified ? nextEligible(donor.lastDonation) : null;
  const qrState = !verified ? 'locked' : qrStatus === 'ready' ? 'ready' : qrStatus === 'error' ? 'error' : 'loading';
  const canExport = qrState === 'ready';

  const handleDownload = async () => {
    if (!cardRef.current) return;
    setDownloading(true);
    try {
      const { default: html2canvas } = await import('html2canvas');
      const canvas = await html2canvas(cardRef.current, { scale: 3, useCORS: true, backgroundColor: null });
      const link = document.createElement('a');
      link.download = `bloodlife-donor-card-${donorId}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    } catch {
      setToast('Couldn’t create the image. Try Print → Save as PDF instead.');
    } finally {
      setDownloading(false);
    }
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: { xs: 2, md: 2.5 }, pb: 4, minWidth: 0 }}>
      {/* Print only the card */}
      <GlobalStyles styles={{
        '@media print': {
          '@page': { margin: '12mm' },
          'body *': { visibility: 'hidden' },
          '#donor-card, #donor-card *': { visibility: 'visible' },
          '#donor-card': { position: 'absolute', top: 0, left: 0, width: '120mm !important', boxShadow: 'none !important' },
        },
      }} />

      <DonorPageHero id="qr-title" icon={<QrCode2Icon />} title="My QR Card"
        subtitle="Your digital donor ID. Show it at any partner hospital or blood drive for a faster check-in." />

      {loading ? (
        <Skeleton variant="rounded" height={48} sx={{ borderRadius: '12px' }} />
      ) : verified ? (
        <Notice tone="success" icon={<VerifiedIcon />}>
          You’re a verified donor — your card is ready to use.
        </Notice>
      ) : (
        <Notice tone="warning" icon={<PersonOffIcon />}>
          You’re not registered as a donor yet. <Box component={Link} href="/donate" sx={{ color: 'inherit', fontWeight: 800 }}>Register on the Donate page</Box> to unlock your QR code.
        </Notice>
      )}

      <Box sx={{ display: 'grid', gap: { xs: 2, md: 2.5 }, gridTemplateColumns: { xs: '1fr', lg: 'minmax(0, 1.35fr) minmax(0, 1fr)' }, alignItems: 'start' }}>
        {/* Card + actions */}
        <Box sx={{ ...cardSx, p: { xs: 2, sm: 3 }, display: 'flex', flexDirection: 'column', gap: 2.5 }}>
          {loading ? (
            <Skeleton variant="rounded" sx={{ borderRadius: '20px', width: '100%', maxWidth: 560, mx: 'auto', height: { xs: 230, sm: 270 } }} />
          ) : (
            <DonorCard ref={cardRef} name={user?.fullName} photoSrc={photoSrc} initials={initialsOf(user?.fullName)}
              bloodType={verified ? donor.bloodType : null} donorId={donorId} verified={verified}
              qrToken={qrToken} qrState={qrState} validUntil={expiry ? formatDate(expiry) : null}
              onRetry={() => loadQr(donor._id)} />
          )}

          {verified || loading ? (
            <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, gap: 1.25, maxWidth: 560, width: '100%', mx: 'auto' }}>
              <Button variant="contained" disableElevation startIcon={<FullscreenIcon />} disabled={!canExport}
                onClick={() => setBigQr(true)} sx={actionSx}>
                Show QR
              </Button>
              <Button variant="outlined" startIcon={<DownloadIcon />} disabled={!canExport || downloading}
                onClick={handleDownload} sx={actionSx}>
                {downloading ? 'Preparing…' : 'Download'}
              </Button>
              <Button variant="outlined" startIcon={<PrintIcon />} disabled={!canExport}
                onClick={() => window.print()} sx={actionSx}>
                Print
              </Button>
            </Box>
          ) : (
            <Button variant="contained" disableElevation component={Link} href="/donate" startIcon={<FavoriteBorderIcon />}
              sx={{ ...actionSx, alignSelf: 'center', px: 3 }}>
              Register as a donor
            </Button>
          )}
        </Box>

        {/* Side panel */}
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: { xs: 2, md: 2.5 } }}>
          <Box sx={{ ...cardSx, p: { xs: 2, sm: 2.5 } }}>
            <Typography sx={{ fontWeight: 800, fontSize: '1.05rem', mb: 0.5 }}>Donation status</Typography>
            {loading ? (
              [0, 1, 2].map((i) => <Skeleton key={i} height={52} />)
            ) : (
              <>
                <InfoRow icon={<WaterDropIcon />} label="Blood type">{verified ? donor.bloodType : '—'}</InfoRow>
                <InfoRow icon={<HistoryIcon />} label="Last donation">
                  {verified && donor.lastDonation ? formatDate(donor.lastDonation) : 'None yet'}
                </InfoRow>
                <InfoRow icon={<EventAvailableOutlinedIcon />} label="Can donate">
                  {!verified ? '—'
                    : eligibleOn ? <Pill tone="warning">From {formatDate(eligibleOn)}</Pill>
                    : donor.available ? <Pill tone="success">Now</Pill>
                    : <Pill tone="neutral">Marked unavailable</Pill>}
                </InfoRow>
              </>
            )}
          </Box>

          <Box sx={{ ...cardSx, p: { xs: 2, sm: 2.5 } }}>
            <Typography sx={{ fontWeight: 800, fontSize: '1.05rem', mb: 1.5 }}>How to use your card</Typography>
            <Box component="ol" sx={{ listStyle: 'none', m: 0, p: 0, display: 'flex', flexDirection: 'column', gap: 1.75 }}>
              {STEPS.map((s, i) => (
                <Box component="li" key={s.title} sx={{ display: 'flex', gap: 1.5 }}>
                  <Box aria-hidden="true" sx={{
                    width: 28, height: 28, borderRadius: '50%', flexShrink: 0, display: 'grid', placeItems: 'center',
                    bgcolor: 'primary.main', color: '#fff', fontWeight: 800, fontSize: '0.82rem',
                  }}>
                    {i + 1}
                  </Box>
                  <Box>
                    <Typography sx={{ fontWeight: 700, fontSize: '0.92rem' }}>{s.title}</Typography>
                    <Typography variant="body2" color="text.secondary">{s.text}</Typography>
                  </Box>
                </Box>
              ))}
            </Box>
            <Box sx={{ mt: 2.25 }}>
              <Notice tone="neutral" icon={<ShieldOutlinedIcon />}>
                The QR holds a signed code only — none of your personal details. Only hospital staff can use it to look you up.
              </Notice>
            </Box>
          </Box>
        </Box>
      </Box>

      {/* Large QR for scanning from a phone screen */}
      <Dialog open={bigQr} onClose={() => setBigQr(false)} fullWidth maxWidth="xs" aria-labelledby="big-qr-title"
        PaperProps={{ sx: { borderRadius: '20px' } }}>
        <IconButton onClick={() => setBigQr(false)} aria-label="Close" sx={{ position: 'absolute', right: 10, top: 10 }}>
          <CloseIcon />
        </IconButton>
        <DialogContent sx={{ textAlign: 'center', pt: 5, pb: 4 }}>
          <Typography id="big-qr-title" sx={{ fontWeight: 800, fontSize: '1.25rem' }}>{user?.fullName}</Typography>
          <Typography color="text.secondary" sx={{ fontSize: '0.9rem', mb: 2.5 }}>
            {verified ? `${donor.bloodType} · ` : ''}{donorId}
          </Typography>
          {qrToken && (
            <Box sx={{ p: 2, bgcolor: '#fff', borderRadius: '16px', border: '1px solid', borderColor: 'divider', width: 'min(100%, 300px)', mx: 'auto' }}>
              <QRCode value={qrToken} size={512} fgColor="#1A1A1A" bgColor="#FFFFFF" level="M" style={{ width: '100%', height: 'auto' }} />
            </Box>
          )}
          <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
            Turn up your screen brightness for an easier scan.
          </Typography>
        </DialogContent>
      </Dialog>

      <Snackbar open={!!toast} autoHideDuration={5000} onClose={() => setToast(null)} anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}>
        <Alert severity="error" onClose={() => setToast(null)} sx={{ borderRadius: '12px' }}>{toast}</Alert>
      </Snackbar>
    </Box>
  );
}
