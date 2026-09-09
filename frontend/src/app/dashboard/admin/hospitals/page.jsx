'use client';
import React, { useEffect, useState, useCallback } from 'react';
import {
  Box, Typography, Paper, Table, TableHead, TableBody, TableRow, TableCell,
  Button, TextField, Grid, Dialog, DialogTitle, DialogContent, DialogActions,
  MenuItem, Alert, Chip, IconButton, CircularProgress,
} from '@mui/material';
import { Add, Delete, PersonAdd } from '@mui/icons-material';
import axios from 'axios';
import { useAuth } from '@/store/AuthContext';
import API_BASE from '@/lib/config';

export default function AdminHospitals() {
  const { token } = useAuth();
  const headers = { Authorization: `Bearer ${token}` };
  const [hospitals, setHospitals] = useState(null);
  const [staff, setStaff] = useState([]);
  const [error, setError] = useState('');

  const [hospitalDialog, setHospitalDialog] = useState(false);
  const [hospitalForm, setHospitalForm] = useState({ name: '', address: '', city: '', phone: '', email: '' });

  const [staffDialog, setStaffDialog] = useState(false);
  const [staffForm, setStaffForm] = useState({ fullName: '', email: '', password: '', hospital: '' });
  const [saving, setSaving] = useState(false);

  const load = useCallback(() => {
    axios.get(`${API_BASE}/api/hospitals`).then(res => setHospitals(res.data)).catch(() => setError('Failed to load hospitals.'));
    axios.get(`${API_BASE}/api/staff`, { headers }).then(res => setStaff(res.data)).catch(() => {});
  }, [token]);

  useEffect(() => { load(); }, [load]);

  const createHospital = async () => {
    setSaving(true);
    setError('');
    try {
      await axios.post(`${API_BASE}/api/hospitals`, hospitalForm, { headers });
      setHospitalDialog(false);
      setHospitalForm({ name: '', address: '', city: '', phone: '', email: '' });
      load();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create hospital.');
    } finally { setSaving(false); }
  };

  const deleteHospital = async (id) => {
    if (!confirm('Delete this hospital? This does not delete its staff accounts.')) return;
    try {
      await axios.delete(`${API_BASE}/api/hospitals/${id}`, { headers });
      load();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete hospital.');
    }
  };

  const createStaff = async () => {
    setSaving(true);
    setError('');
    try {
      await axios.post(`${API_BASE}/api/staff`, { ...staffForm, role: 'hospital_staff' }, { headers });
      setStaffDialog(false);
      setStaffForm({ fullName: '', email: '', password: '', hospital: '' });
      load();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create staff account.');
    } finally { setSaving(false); }
  };

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography variant="h5" fontWeight={800}>Hospitals</Typography>
        <Box display="flex" gap={1}>
          <Button variant="outlined" startIcon={<PersonAdd />} onClick={() => setStaffDialog(true)}>Add Hospital Staff</Button>
          <Button variant="contained" color="error" startIcon={<Add />} onClick={() => setHospitalDialog(true)}>Add Hospital</Button>
        </Box>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>{error}</Alert>}

      {!hospitals ? <CircularProgress size={28} /> : (
        <Paper elevation={0} sx={{ borderRadius: 3, border: '1px solid', borderColor: 'divider', overflow: 'auto' }}>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Name</TableCell>
                <TableCell>City</TableCell>
                <TableCell>Phone</TableCell>
                <TableCell>Staff Accounts</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {hospitals.length === 0 && (
                <TableRow><TableCell colSpan={5} align="center" sx={{ py: 4, color: 'text.secondary' }}>No hospitals yet.</TableCell></TableRow>
              )}
              {hospitals.map((h) => (
                <TableRow key={h._id} hover>
                  <TableCell>{h.name}</TableCell>
                  <TableCell>{h.city || '—'}</TableCell>
                  <TableCell>{h.phone || '—'}</TableCell>
                  <TableCell>
                    {staff.filter(s => s.hospital?._id === h._id).map(s => (
                      <Chip key={s._id} label={s.fullName} size="small" sx={{ mr: 0.5, mb: 0.5 }} />
                    ))}
                  </TableCell>
                  <TableCell align="right">
                    <IconButton size="small" color="error" onClick={() => deleteHospital(h._id)}><Delete fontSize="small" /></IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Paper>
      )}

      <Dialog open={hospitalDialog} onClose={() => setHospitalDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Add Hospital</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} mt={0.5}>
            <Grid item xs={12}><TextField fullWidth label="Name" value={hospitalForm.name} onChange={e => setHospitalForm(f => ({ ...f, name: e.target.value }))} /></Grid>
            <Grid item xs={6}><TextField fullWidth label="City" value={hospitalForm.city} onChange={e => setHospitalForm(f => ({ ...f, city: e.target.value }))} /></Grid>
            <Grid item xs={6}><TextField fullWidth label="Phone" value={hospitalForm.phone} onChange={e => setHospitalForm(f => ({ ...f, phone: e.target.value }))} /></Grid>
            <Grid item xs={12}><TextField fullWidth label="Address" value={hospitalForm.address} onChange={e => setHospitalForm(f => ({ ...f, address: e.target.value }))} /></Grid>
            <Grid item xs={12}><TextField fullWidth label="Email" value={hospitalForm.email} onChange={e => setHospitalForm(f => ({ ...f, email: e.target.value }))} /></Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setHospitalDialog(false)}>Cancel</Button>
          <Button variant="contained" color="error" disabled={saving || !hospitalForm.name} onClick={createHospital}>
            {saving ? <CircularProgress size={18} color="inherit" /> : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={staffDialog} onClose={() => setStaffDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Add Hospital Staff Account</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} mt={0.5}>
            <Grid item xs={12}><TextField fullWidth label="Full Name" value={staffForm.fullName} onChange={e => setStaffForm(f => ({ ...f, fullName: e.target.value }))} /></Grid>
            <Grid item xs={12}><TextField fullWidth label="Email" value={staffForm.email} onChange={e => setStaffForm(f => ({ ...f, email: e.target.value }))} /></Grid>
            <Grid item xs={12}><TextField fullWidth type="password" label="Password" value={staffForm.password} onChange={e => setStaffForm(f => ({ ...f, password: e.target.value }))} /></Grid>
            <Grid item xs={12}>
              <TextField fullWidth select label="Hospital" value={staffForm.hospital} onChange={e => setStaffForm(f => ({ ...f, hospital: e.target.value }))}>
                {(hospitals || []).map(h => <MenuItem key={h._id} value={h._id}>{h.name}</MenuItem>)}
              </TextField>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setStaffDialog(false)}>Cancel</Button>
          <Button variant="contained" color="error" disabled={saving || !staffForm.email || !staffForm.password || !staffForm.hospital} onClick={createStaff}>
            {saving ? <CircularProgress size={18} color="inherit" /> : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
