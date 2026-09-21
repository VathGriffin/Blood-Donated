'use client';
import { useEffect, useRef, useState } from 'react';
import { Box, Typography, Alert, CircularProgress } from '@mui/material';
import { CameraAlt } from '@mui/icons-material';

const SCANNER_ELEMENT_ID = 'donor-qr-scanner';

export default function QrScanner({ onDecode }) {
  const scannerRef = useRef(null);
  const [error, setError] = useState('');
  const [starting, setStarting] = useState(true);

  useEffect(() => {
    let cancelled = false;

    import('html5-qrcode').then(({ Html5Qrcode }) => {
      if (cancelled) return;
      const scanner = new Html5Qrcode(SCANNER_ELEMENT_ID);
      scannerRef.current = scanner;

      scanner.start(
        { facingMode: 'environment' },
        { fps: 10, qrbox: { width: 240, height: 240 } },
        (decodedText) => {
          onDecode(decodedText);
        },
        () => { /* per-frame decode failures are expected while aiming — ignore */ }
      ).then(() => setStarting(false)).catch((err) => {
        setStarting(false);
        setError('Could not access the camera. Check browser permissions and try again.');
        console.error('QR scanner start failed:', err);
      });
    });

    return () => {
      cancelled = true;
      if (scannerRef.current) {
        scannerRef.current.stop().then(() => scannerRef.current.clear()).catch(() => {});
      }
    };
  }, [onDecode]);

  return (
    <Box>
      {error ? (
        <Alert severity="error" sx={{ borderRadius: 2, mb: 2 }}>{error}</Alert>
      ) : (
        <Box sx={{ position: 'relative', borderRadius: 3, overflow: 'hidden', border: '1px solid', borderColor: 'divider' }}>
          {starting && (
            <Box sx={{
              position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center',
              justifyContent: 'center', gap: 1, bgcolor: 'background.paper', zIndex: 1,
            }}>
              <CircularProgress size={28} color="info" />
              <Typography fontSize="0.8rem" color="text.secondary">Starting camera…</Typography>
            </Box>
          )}
          <div id={SCANNER_ELEMENT_ID} style={{ width: '100%' }} />
        </Box>
      )}
      <Box display="flex" alignItems="center" gap={0.8} mt={1.5} color="text.secondary">
        <CameraAlt sx={{ fontSize: 16 }} />
        <Typography fontSize="0.78rem">Point the camera at a donor&apos;s QR card.</Typography>
      </Box>
    </Box>
  );
}
