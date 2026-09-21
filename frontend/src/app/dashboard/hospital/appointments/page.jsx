'use client';
import { useEffect, useState, useCallback } from 'react';
import {
  Box, Typography, Paper, Table, TableHead, TableBody, TableRow, TableCell, Chip, Button,
  CircularProgress, Alert,
} from '@mui/material';
import axios from 'axios';
import { useAuth } from '@/store/AuthContext';
import API_BASE from '@/lib/config';

const STATUS_COLOR = { Pending: 'warning', Confirmed: 'info', CheckedIn: 'success', Cancelled: 'default' };

export default function HospitalAppointments() {
  const { staff, token } = useAuth();
  const [appts, setAppts] = useState(null);
  const [error, setError] = useState('');
  const [busyId, setBusyId] = useState(null);

  const load = useCallback(() => {
    if (!staff?.hospitalId) return;
    axios.get(`${API_BASE}/api/appointments?hospital=${staff.hospitalId}`)
      .then(res => setAppts(res.data.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))))
      .catch(() => setError('Failed to load appointments.'));
  }, [staff]);

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
                  <TableCell>{a.fullName}<br /><Typography fontSize="0.72rem" color="text.secondary">{a.email}</Typography></TableCell>
                  <TableCell><Chip label={a.bloodType} size="small" /></TableCell>
                  <TableCell>{a.date}</TableCell>
                  <TableCell>{a.time}</TableCell>
                  <TableCell><Chip label={a.status} size="small" color={STATUS_COLOR[a.status]} /></TableCell>
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
