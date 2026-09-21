'use client';
import { useCallback, useState } from 'react';
import dynamic from 'next/dynamic';
import {
  Box, Typography, Paper, Avatar, Chip, Alert, Button, CircularProgress, Divider,
} from '@mui/material';
import { Verified, ErrorOutline, Bloodtype, EventAvailable, Refresh } from '@mui/icons-material';
import axios from 'axios';
import { useAuth } from '@/store/AuthContext';
import API_BASE from '@/lib/config';

const QrScanner = dynamic(() => import('@/components/hospital/QrScanner'), { ssr: false });

export default function ScanDonorQr() {
  const { staff, token } = useAuth();
  const [result, setResult] = useState(null); // {donor, eligibility} | {error}
  const [loading, setLoading] = useState(false);
  const [scanKey, setScanKey] = useState(0);
  const [appointment, setAppointment] = useState(null); // matching open appointment, if any
  const [checkingIn, setCheckingIn] = useState(false);

  const handleDecode = useCallback(async (token_) => {
    if (loading) return;
    setLoading(true);
    setResult(null);
    setAppointment(null);
    try {
      const { data } = await axios.post(`${API_BASE}/api/donors/verify-qr`, { token: token_ },
        { headers: { Authorization: `Bearer ${token}` } });
      setResult(data);

      const { data: appts } = await axios.get(`${API_BASE}/api/appointments?hospital=${staff.hospitalId}`);
      const match = appts.find(a => a.email?.toLowerCase() === data.donor.email.toLowerCase() && ['Pending', 'Confirmed'].includes(a.status));
      if (match) setAppointment(match);
    } catch (err) {
      setResult({ valid: false, reason: err.response?.data?.reason || 'invalid', message: err.response?.data?.message });
    } finally {
      setLoading(false);
    }
  }, [loading, token, staff]);

  const checkIn = async () => {
    if (!appointment) return;
    setCheckingIn(true);
    try {
      await axios.patch(`${API_BASE}/api/appointments/${appointment._id}/check-in`, {},
        { headers: { Authorization: `Bearer ${token}` } });
      setAppointment({ ...appointment, status: 'CheckedIn' });
    } catch (err) {
      // surfaced inline below via appointment.status staying unchanged
    } finally {
      setCheckingIn(false);
    }
  };

  const reset = () => { setResult(null); setAppointment(null); setScanKey(k => k + 1); };

  return (
    <Box sx={{ maxWidth: 480 }}>
      <Typography variant="h5" fontWeight={800} mb={2}>Scan Donor QR</Typography>

      {!result && <QrScanner key={scanKey} onDecode={handleDecode} />}

      {loading && (
        <Box display="flex" alignItems="center" gap={1.5} mt={2}>
          <CircularProgress size={20} color="info" />
          <Typography fontSize="0.85rem" color="text.secondary">Verifying donor…</Typography>
        </Box>
      )}

      {result && !result.valid && (
        <Alert severity="error" icon={<ErrorOutline />} sx={{ borderRadius: 2, mt: 1 }}
          action={<Button size="small" onClick={reset} startIcon={<Refresh fontSize="small" />}>Scan Again</Button>}>
          {result.reason === 'expired' ? 'This QR code has expired — ask the donor to regenerate it.' :
            result.reason === 'not_found' ? 'This donor record no longer exists.' :
            'This QR code is invalid or could not be verified.'}
        </Alert>
      )}

      {result?.valid && (
        <Paper elevation={0} sx={{ borderRadius: 3, border: '1px solid', borderColor: 'divider', p: 3, mt: 1 }}>
          <Box display="flex" alignItems="center" gap={2} mb={2}>
            <Avatar src={result.donor.photo ? `${API_BASE}${result.donor.photo}` : undefined} sx={{ width: 56, height: 56 }}>
              {result.donor.fullName?.[0]}
            </Avatar>
            <Box>
              <Typography fontWeight={800}>{result.donor.fullName}</Typography>
              <Typography fontSize="0.78rem" color="text.secondary">{result.donor.email}</Typography>
            </Box>
            <Chip icon={<Verified sx={{ fontSize: '0.9rem !important' }} />} label="Verified" color="success" size="small" sx={{ ml: 'auto' }} />
          </Box>

          <Divider sx={{ my: 1.5 }} />

          <Box display="flex" gap={1} flexWrap="wrap" mb={1.5}>
            <Chip icon={<Bloodtype sx={{ fontSize: '0.9rem !important' }} />} label={result.donor.bloodType} size="small" />
            <Chip label={result.donor.available ? 'Available' : 'Not available'} size="small" color={result.donor.available ? 'success' : 'default'} />
            <Chip label={result.eligibility.eligible ? 'Eligible to donate' : `Eligible ${new Date(result.eligibility.nextEligibleDate).toLocaleDateString()}`}
              size="small" color={result.eligibility.eligible ? 'success' : 'warning'} />
          </Box>
          <Typography fontSize="0.8rem" color="text.secondary" mb={2}>
            {result.donor.donationCount} lifetime donation{result.donor.donationCount === 1 ? '' : 's'} · {result.donor.phone}
          </Typography>

          {appointment ? (
            <Button fullWidth variant="contained" color={appointment.status === 'CheckedIn' ? 'success' : 'info'}
              startIcon={<EventAvailable />} disabled={checkingIn || appointment.status === 'CheckedIn'} onClick={checkIn}>
              {appointment.status === 'CheckedIn' ? 'Checked In' : checkingIn ? <CircularProgress size={18} color="inherit" /> : `Check In (${appointment.time})`}
            </Button>
          ) : (
            <Alert severity="info" sx={{ borderRadius: 2, fontSize: '0.8rem' }}>No open appointment found for this donor at your hospital.</Alert>
          )}

          <Button fullWidth sx={{ mt: 1.5 }} onClick={reset} startIcon={<Refresh fontSize="small" />}>Scan Another</Button>
        </Paper>
      )}
    </Box>
  );
}
