'use client';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Alert, Box, Button, Dialog, DialogActions, DialogContent, DialogTitle, IconButton,
  InputAdornment, LinearProgress, MenuItem, Table, TableBody, TableCell, TableHead,
  TableRow, TextField, ToggleButton, ToggleButtonGroup, Tooltip, Typography,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import RemoveIcon from '@mui/icons-material/Remove';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import SearchIcon from '@mui/icons-material/Search';
import WaterDropIcon from '@mui/icons-material/WaterDrop';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import axios from 'axios';
import { useAuth } from '@/store/AuthContext';
import API_BASE from '@/lib/config';
import { PageHeader, StatCard, StatusBadge, TableCard, EmptyState, ResponsiveGrid } from '@/components/ui';
import { BLOOD_TYPES, STOCK, completeByType, summarize } from '@/lib/inventory';
import { formatDate } from '@/lib/format';

const PROGRESS_COLOR = { adequate: 'success', low: 'warning', critical: 'error', empty: 'error' };

export default function HospitalInventory() {
  const { staff, token } = useAuth();
  const [items, setItems] = useState(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(null);
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [dialog, setDialog] = useState(null); // { mode: 'add' | 'set', bloodType, units }
  const [saving, setSaving] = useState(false);

  const headers = { Authorization: `Bearer ${token}` };

  const load = useCallback(() => {
    if (!staff?.hospitalId) return;
    axios.get(`${API_BASE}/api/inventory?hospital=${staff.hospitalId}`)
      .then((res) => setItems(res.data))
      .catch(() => setError('Failed to load inventory.'));
  }, [staff]);

  useEffect(() => { load(); }, [load]);

  // Replace (or add) the row the server just returned, so the table updates in place.
  const applyRow = (row) => setItems((prev) => {
    const list = prev || [];
    return list.some((i) => i.bloodType === row.bloodType) ? list.map((i) => (i.bloodType === row.bloodType ? row : i)) : [...list, row];
  });

  const adjust = async (bloodType, delta) => {
    setBusy(bloodType);
    setError('');
    try {
      const { data } = await axios.patch(`${API_BASE}/api/inventory/${encodeURIComponent(bloodType)}/adjust`, { delta }, { headers });
      applyRow(data);
      return true;
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update inventory.');
      return false;
    } finally {
      setBusy(null);
    }
  };

  const setTotal = async (bloodType, units) => {
    setBusy(bloodType);
    setError('');
    try {
      const { data } = await axios.put(`${API_BASE}/api/inventory/${encodeURIComponent(bloodType)}`, { units }, { headers });
      applyRow(data);
      return true;
    } catch (err) {
      setError(err.response?.data?.message || err.response?.data?.errors?.[0]?.msg || 'Failed to update inventory.');
      return false;
    } finally {
      setBusy(null);
    }
  };

  const submitDialog = async () => {
    const n = Number(dialog.units);
    if (!Number.isInteger(n) || n < (dialog.mode === 'add' ? 1 : 0)) return;
    setSaving(true);
    const ok = dialog.mode === 'add' ? await adjust(dialog.bloodType, n) : await setTotal(dialog.bloodType, n);
    setSaving(false);
    if (ok) setDialog(null);
  };

  const rows = useMemo(() => completeByType(items || []), [items]);
  const totals = useMemo(() => summarize(items || []), [items]);
  const visible = rows.filter(
    (r) => (statusFilter === 'all' || r.status === statusFilter) && r.bloodType.toLowerCase().includes(query.trim().toLowerCase())
  );
  const loading = !items && !error;
  const dialogValid = dialog && Number.isInteger(Number(dialog.units)) && Number(dialog.units) >= (dialog.mode === 'add' ? 1 : 0) && dialog.units !== '';

  return (
    <Box>
      <PageHeader
        title="Blood Inventory"
        subtitle="Manage blood units and stock for your hospital"
        actions={<Button variant="contained" startIcon={<AddIcon />} onClick={() => setDialog({ mode: 'add', bloodType: 'O+', units: '' })}>Add Blood Units</Button>}
      />
      {error && <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError('')}>{error}</Alert>}

      <ResponsiveGrid min={200}>
        <StatCard label="Total Units" value={totals.totalUnits} loading={loading} icon={<WaterDropIcon />} tone="primary" hint={`${items?.length || 0} of ${BLOOD_TYPES.length} types tracked`} />
        <StatCard label="Adequate" value={totals.adequate.types} loading={loading} icon={<CheckCircleOutlineIcon />} tone="success" hint={`${totals.adequate.units} units`} />
        <StatCard label="Low" value={totals.low.types} loading={loading} icon={<WarningAmberIcon />} tone="warning" hint={`${totals.low.units} units`} />
        <StatCard label="Critical / Empty" value={totals.critical.types + totals.empty.types} loading={loading} icon={<ErrorOutlineIcon />} tone="error"
          hint={`${totals.critical.units} units`} />
      </ResponsiveGrid>

      <TableCard
        sx={{ mt: { xs: 2, md: 3 } }}
        minWidth={720}
        toolbar={
          <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap' }}>
            <TextField
              size="small" placeholder="Search blood type (e.g. O+)" value={query} onChange={(e) => setQuery(e.target.value)}
              slotProps={{ input: { startAdornment: <InputAdornment position="start"><SearchIcon fontSize="small" /></InputAdornment> } }}
              sx={{ flex: '1 1 220px', maxWidth: 320 }}
            />
            <TextField select size="small" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} sx={{ minWidth: 170 }} aria-label="Filter by status">
              <MenuItem value="all">All Statuses</MenuItem>
              {Object.entries(STOCK).map(([k, v]) => <MenuItem key={k} value={k}>{v.label}</MenuItem>)}
            </TextField>
          </Box>
        }
      >
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Blood Type</TableCell>
              <TableCell>Units in Stock</TableCell>
              <TableCell>Minimum</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Last Updated</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {visible.length === 0 && (
              <TableRow><TableCell colSpan={6}><EmptyState icon={<WaterDropIcon />} title="No matching blood types" description="Try a different search or status filter." /></TableCell></TableRow>
            )}
            {visible.map((r) => (
              <TableRow key={r.bloodType} hover>
                <TableCell sx={{ color: 'primary.main', fontWeight: 800, fontSize: '1rem' }}>{r.bloodType}</TableCell>
                <TableCell sx={{ minWidth: 170 }}>
                  <Typography sx={{ fontWeight: 700 }}>{r.units}</Typography>
                  <LinearProgress
                    variant="determinate"
                    value={Math.min(100, (r.units / ((r.minUnits || 10) * 2)) * 100)}
                    color={PROGRESS_COLOR[r.status]}
                    sx={{ mt: 0.5, height: 6, maxWidth: 140 }}
                    aria-label={`${r.bloodType} stock level`}
                  />
                </TableCell>
                <TableCell>{r.minUnits ?? 10}</TableCell>
                <TableCell><StatusBadge status={r.status} label={STOCK[r.status].label} /></TableCell>
                <TableCell sx={{ whiteSpace: 'nowrap' }}>{r.missing ? <Typography variant="body2" color="text.disabled">Not tracked yet</Typography> : formatDate(r.lastUpdated)}</TableCell>
                <TableCell align="right" sx={{ whiteSpace: 'nowrap' }}>
                  <Tooltip title="Remove 1 unit">
                    <span>
                      <IconButton size="small" disabled={busy === r.bloodType || r.units === 0} onClick={() => adjust(r.bloodType, -1)} aria-label={`Remove one ${r.bloodType} unit`}>
                        <RemoveIcon fontSize="small" />
                      </IconButton>
                    </span>
                  </Tooltip>
                  <Tooltip title="Add 1 unit">
                    <span>
                      <IconButton size="small" disabled={busy === r.bloodType} onClick={() => adjust(r.bloodType, 1)} aria-label={`Add one ${r.bloodType} unit`}>
                        <AddIcon fontSize="small" />
                      </IconButton>
                    </span>
                  </Tooltip>
                  <Tooltip title="Set exact quantity">
                    <IconButton size="small" onClick={() => setDialog({ mode: 'set', bloodType: r.bloodType, units: String(r.units) })} aria-label={`Set ${r.bloodType} quantity`}>
                      <EditOutlinedIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableCard>

      <Dialog open={Boolean(dialog)} onClose={() => !saving && setDialog(null)} fullWidth maxWidth="xs">
        {dialog && (
          <>
            <DialogTitle>{dialog.mode === 'add' ? 'Add Blood Units' : 'Set Stock Quantity'}</DialogTitle>
            <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: '8px !important' }}>
              <ToggleButtonGroup
                exclusive size="small" value={dialog.mode} fullWidth
                onChange={(_, v) => v && setDialog({ ...dialog, mode: v })}
              >
                <ToggleButton value="add">Add units</ToggleButton>
                <ToggleButton value="set">Set total</ToggleButton>
              </ToggleButtonGroup>
              <TextField select label="Blood type" value={dialog.bloodType} onChange={(e) => setDialog({ ...dialog, bloodType: e.target.value })}>
                {BLOOD_TYPES.map((t) => <MenuItem key={t} value={t}>{t}</MenuItem>)}
              </TextField>
              <TextField
                label={dialog.mode === 'add' ? 'Units to add' : 'Total units in stock'}
                type="number" value={dialog.units} autoFocus
                onChange={(e) => setDialog({ ...dialog, units: e.target.value })}
                slotProps={{ htmlInput: { min: dialog.mode === 'add' ? 1 : 0, step: 1 } }}
                helperText={dialog.mode === 'add' ? 'Added to the current stock.' : 'Replaces the current stock.'}
                onKeyDown={(e) => { if (e.key === 'Enter' && dialogValid) submitDialog(); }}
              />
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setDialog(null)} disabled={saving} color="inherit">Cancel</Button>
              <Button variant="contained" onClick={submitDialog} disabled={saving || !dialogValid}>{saving ? 'Saving…' : 'Save'}</Button>
            </DialogActions>
          </>
        )}
      </Dialog>
    </Box>
  );
}
