'use client';
import React, { useEffect, useState, useCallback } from 'react';
import {
  Box, Typography, Paper, Table, TableHead, TableBody, TableRow, TableCell,
  Chip, Button, Stack, CircularProgress, Alert,
} from '@mui/material';
import axios from 'axios';
import { useAuth } from '@/store/AuthContext';
import API_BASE from '@/lib/config';

const STATUS_COLOR = { Pending: 'warning', Approved: 'info', Fulfilled: 'success', Rejected: 'error' };
const URGENCY_COLOR = { Low: 'default', Medium: 'info', High: 'warning', Critical: 'error' };

export default function HospitalRequests() {
  const { staff, token } = useAuth();
  const [requests, setRequests] = useState(null);
  const [error, setError] = useState('');
  const [busyId, setBusyId] = useState(null);

  const load = useCallback(() => {
    if (!staff?.hospitalId) return;
    axios.get(`${API_BASE}/api/requests?hospital=${staff.hospitalId}`)
      .then(res => setRequests(res.data.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))))
      .catch(() => setError('Failed to load requests.'));
  }, [staff]);

  useEffect(() => { load(); }, [load]);

  const act = async (id, action) => {
    setBusyId(id);
    setError('');
    try {
      const headers = { Authorization: `Bearer ${token}` };
      if (action === 'Approved' || action === 'Rejected') {
        await axios.patch(`${API_BASE}/api/requests/${id}/status`, { status: action }, { headers });
      } else if (action === 'Fulfilled') {
        await axios.patch(`${API_BASE}/api/requests/${id}/fulfill`, {}, { headers });
      }
      load();
    } catch (err) {
      setError(err.response?.data?.error || `Failed to ${action.toLowerCase()} request.`);
    } finally {
      setBusyId(null);
    }
  };

  return (
    <Box>
      <Typography variant="h5" fontWeight={800} mb={2}>Blood Requests</Typography>
      {error && <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>{error}</Alert>}

      {!requests ? <CircularProgress size={28} /> : (
        <Paper elevation={0} sx={{ borderRadius: 3, border: '1px solid', borderColor: 'divider', overflow: 'auto' }}>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Patient</TableCell>
                <TableCell>Blood Type</TableCell>
                <TableCell>Units</TableCell>
                <TableCell>Urgency</TableCell>
                <TableCell>Status</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {requests.length === 0 && (
                <TableRow><TableCell colSpan={6} align="center" sx={{ py: 4, color: 'text.secondary' }}>No requests assigned to your hospital yet.</TableCell></TableRow>
              )}
              {requests.map((r) => (
                <TableRow key={r._id} hover>
                  <TableCell>{r.patientName}</TableCell>
                  <TableCell><Chip label={r.bloodType} size="small" /></TableCell>
                  <TableCell>{r.unitsNeeded}</TableCell>
                  <TableCell><Chip label={r.urgency} size="small" color={URGENCY_COLOR[r.urgency]} /></TableCell>
                  <TableCell><Chip label={r.status} size="small" color={STATUS_COLOR[r.status]} /></TableCell>
                  <TableCell align="right">
                    <Stack direction="row" spacing={1} justifyContent="flex-end">
                      {r.status === 'Pending' && (
                        <>
                          <Button size="small" variant="outlined" color="success" disabled={busyId === r._id} onClick={() => act(r._id, 'Approved')}>Approve</Button>
                          <Button size="small" variant="outlined" color="error" disabled={busyId === r._id} onClick={() => act(r._id, 'Rejected')}>Reject</Button>
                        </>
                      )}
                      {r.status === 'Approved' && (
                        <Button size="small" variant="contained" color="info" disabled={busyId === r._id} onClick={() => act(r._id, 'Fulfilled')}>
                          {busyId === r._id ? <CircularProgress size={16} color="inherit" /> : 'Fulfill'}
                        </Button>
                      )}
                    </Stack>
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
