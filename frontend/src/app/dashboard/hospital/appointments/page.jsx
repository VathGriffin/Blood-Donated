'use client';
import { useEffect, useState, useCallback } from 'react';
import {
  Box, Typography, Paper, Table, TableHead, TableBody, TableRow, TableCell, Chip, Button,
  CircularProgress, Alert, Avatar,
} from '@mui/material';
import axios from 'axios';
import { useAuth } from '@/store/AuthContext';
import RescheduleRequestsPanel from '@/components/appointments/RescheduleRequestsPanel';
import API_BASE from '@/lib/config';

// Uploaded photos are served by the API as "/uploads/…"; full URLs pass through.
const photoUrl = (photo) => (!photo ? undefined : /^https?:\/\//.test(photo) ? photo : `${API_BASE}${photo}`);
const initials = (name = '') =>
  name.split(' ').filter(Boolean).slice(0, 2).map((w) => w[0].toUpperCase()).join('') || '?';

const STATUS_COLOR = { Pending: 'warning', Confirmed: 'info', CheckedIn: 'success', Cancelled: 'default' };

export default function HospitalAppointments() {
  const { staff, token } = useAuth();
  const [appts, setAppts] = useState(null);
  const [error, setError] = useState('');
  const [busyId, setBusyId] = useState(null);

  const load = useCallback(() => {
    if (!staff?.hospitalId) return;
    axios.get(`${API_BASE}/api/appointments?hospital=${staff.hospitalId}`, { headers: { Authorization: `Bearer ${token}` } })
      .then(res => setAppts(res.data.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))))
      .catch(() => setError('Failed to load appointments.'));
  }, [staff, token]);

  useEffect(() => { load(); }, [load]);

  const headers = { Authorization: `Bearer ${token}` };

  const confirm = async (id) => {
    setBusyId(id);
    setError('');
    try {
      await axios.put(`${API_BASE}/api/appointments/${id}`, { status: 'Confirmed' }, { headers });
      load();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to confirm appointment.');
    } finally { setBusyId(null); }
  };

  const checkIn = async (id) => {
    setBusyId(id);
    setError('');
    try {
      await axios.patch(`${API_BASE}/api/appointments/${id}/check-in`, {}, { headers });
      load();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to check in donor.');
    } finally { setBusyId(null); }
  };

  return (
    <Box>
      <Typography variant="h5" fontWeight={800} mb={2}>Appointments</Typography>
      {error && <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>{error}</Alert>}

      {appts && (
        <RescheduleRequestsPanel appointments={appts} token={token}
          onUpdated={(data) => setAppts((list) => list.map((a) => (a._id === data._id ? { donorPhoto: a.donorPhoto, ...data } : a)))} />
      )}

      {!appts ? <CircularProgress size={28} /> : (
        <Paper elevation={0} sx={{ borderRadius: 3, border: '1px solid', borderColor: 'divider', overflow: 'auto' }}>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Donor</TableCell>
                <TableCell>Blood Type</TableCell>
                <TableCell>Date</TableCell>
                <TableCell>Time</TableCell>
                <TableCell>Status</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {appts.length === 0 && (
                <TableRow><TableCell colSpan={6} align="center" sx={{ py: 4, color: 'text.secondary' }}>No appointments assigned to your hospital yet.</TableCell></TableRow>
              )}
              {appts.map((a) => (
                <TableRow key={a._id} hover>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                      <Avatar src={photoUrl(a.donorPhoto)} alt={a.fullName}
                        sx={{ width: 36, height: 36, fontSize: '0.8rem', fontWeight: 700, bgcolor: 'primary.main' }}>
                        {initials(a.fullName)}
                      </Avatar>
                      <Box sx={{ minWidth: 0 }}>
                        {a.fullName}
                        <Typography fontSize="0.72rem" color="text.secondary">{a.email}</Typography>
                      </Box>
                    </Box>
                  </TableCell>
                  <TableCell><Chip label={a.bloodType} size="small" /></TableCell>
                  <TableCell>{a.date}</TableCell>
                  <TableCell>{a.time}</TableCell>
                  <TableCell>
                    <Chip label={a.status} size="small" color={STATUS_COLOR[a.status]} />
                    {a.rescheduleRequests?.some((r) => r.status === 'Pending') && (
                      <Chip label="Change requested" size="small" color="warning" variant="outlined" sx={{ ml: 0.75 }} />
                    )}
                  </TableCell>
                  <TableCell align="right">
                    {a.status === 'Pending' && (
                      <Button size="small" variant="outlined" color="info" disabled={busyId === a._id} onClick={() => confirm(a._id)}>Confirm</Button>
                    )}
                    {a.status === 'Confirmed' && (
                      <Button size="small" variant="contained" color="success" disabled={busyId === a._id} onClick={() => checkIn(a._id)}>
                        {busyId === a._id ? <CircularProgress size={16} color="inherit" /> : 'Check In'}
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Paper>
      )}
    </Box>
  );
}
