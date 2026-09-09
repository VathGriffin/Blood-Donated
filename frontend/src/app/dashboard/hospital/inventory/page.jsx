'use client';
import React, { useEffect, useState, useCallback } from 'react';
import {
  Box, Typography, Grid, Paper, TextField, IconButton, Chip, CircularProgress, Alert,
} from '@mui/material';
import { Add, Remove, Bloodtype } from '@mui/icons-material';
import axios from 'axios';
import { useAuth } from '@/store/AuthContext';
import API_BASE from '@/lib/config';

const STATUS_COLOR = { empty: 'error', critical: 'error', low: 'warning', adequate: 'success' };

export default function HospitalInventory() {
  const { staff, token } = useAuth();
  const [items, setItems] = useState(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(null);

  const load = useCallback(() => {
    if (!staff?.hospitalId) return;
    axios.get(`${API_BASE}/api/inventory?hospital=${staff.hospitalId}`)
      .then(res => setItems(res.data))
      .catch(() => setError('Failed to load inventory.'));
  }, [staff]);

  useEffect(() => { load(); }, [load]);

  const adjust = async (bloodType, delta) => {
    setBusy(bloodType);
    setError('');
    try {
      await axios.patch(`${API_BASE}/api/inventory/${encodeURIComponent(bloodType)}/adjust`, { delta },
        { headers: { Authorization: `Bearer ${token}` } });
      load();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update inventory.');
    } finally {
      setBusy(null);
    }
  };

  return (
    <Box>
      <Typography variant="h5" fontWeight={800} mb={2}>Blood Inventory</Typography>
      {error && <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>{error}</Alert>}

      {!items ? <CircularProgress size={28} /> : (
        <Grid container spacing={2}>
          {items.length === 0 && (
            <Grid item xs={12}>
              <Alert severity="info" sx={{ borderRadius: 2 }}>
                No inventory rows yet for your hospital — use the + button on any blood type below to start tracking stock.
              </Alert>
            </Grid>
          )}
          {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map((bt) => {
            const item = items.find((i) => i.bloodType === bt) || { bloodType: bt, units: 0, status: 'empty' };
            return (
              <Grid item xs={12} sm={6} md={3} key={bt}>
                <Paper elevation={0} sx={{ p: 2.5, borderRadius: 3, border: '1px solid', borderColor: 'divider', textAlign: 'center' }}>
                  <Bloodtype sx={{ color: '#1565c0', fontSize: 22, mb: 0.5 }} />
                  <Typography fontWeight={800} fontSize="1.2rem">{bt}</Typography>
                  <Typography fontSize="1.8rem" fontWeight={900} my={1}>{item.units}</Typography>
                  <Chip label={item.status} size="small" color={STATUS_COLOR[item.status] || 'default'} sx={{ mb: 1.5, textTransform: 'capitalize' }} />
                  <Box display="flex" justifyContent="center" gap={1}>
                    <IconButton size="small" disabled={busy === bt} onClick={() => adjust(bt, -1)} sx={{ border: '1px solid', borderColor: 'divider' }}>
                      <Remove fontSize="small" />
                    </IconButton>
                    <IconButton size="small" disabled={busy === bt} onClick={() => adjust(bt, 1)} sx={{ border: '1px solid', borderColor: 'divider' }}>
                      <Add fontSize="small" />
                    </IconButton>
                  </Box>
                </Paper>
              </Grid>
            );
          })}
        </Grid>
      )}
    </Box>
  );
}
