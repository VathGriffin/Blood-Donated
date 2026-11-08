'use client';
import { apiErrorMessage } from '@/lib/api-error';
import { useT } from '@/i18n/I18nProvider';
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

// Marks a failed list load; the alert shows it in the current language.
const LOAD_FAILED = 'load-failed';

export default function HospitalInventory() {
  const { staff, token } = useAuth();
  const t = useT();
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
      .catch(() => setError(LOAD_FAILED));
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
      setError(apiErrorMessage(err, t('hosp.inv.updateFailed')));
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
      setError(apiErrorMessage(err, t('hosp.inv.updateFailed')));
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
        title={t('hosp.inv.bloodInventory')}
        subtitle={t('hosp.inv.manageBloodUnitsAnd')}
        actions={<Button variant="contained" startIcon={<AddIcon />} onClick={() => setDialog({ mode: 'add', bloodType: 'O+', units: '' })}>{t('hosp.inv.addBloodUnits')}</Button>}
      />
      {error && <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError('')}>{error === LOAD_FAILED ? t('hosp.inv.loadFailed') : error}</Alert>}

      <ResponsiveGrid min={200}>
        <StatCard label={t('hosp.inv.totalUnits')} value={totals.totalUnits} loading={loading} icon={<WaterDropIcon />} tone="primary" hint={t('hosp.inv.tracked', { count: items?.length || 0, total: BLOOD_TYPES.length })} />
        <StatCard label={t('hosp.inv.adequate')} value={totals.adequate.types} loading={loading} icon={<CheckCircleOutlineIcon />} tone="success" hint={t('hosp.inv.units', { count: totals.adequate.units })} />
        <StatCard label={t('hosp.inv.low')} value={totals.low.types} loading={loading} icon={<WarningAmberIcon />} tone="warning" hint={t('hosp.inv.units', { count: totals.low.units })} />
        <StatCard label={t('hosp.inv.criticalEmpty')} value={totals.critical.types + totals.empty.types} loading={loading} icon={<ErrorOutlineIcon />} tone="error"
          hint={t('hosp.inv.units', { count: totals.critical.units })} />
      </ResponsiveGrid>

      <TableCard
        sx={{ mt: { xs: 2, md: 3 } }}
        minWidth={720}
        toolbar={
          <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap' }}>
            <TextField
              size="small" placeholder={t('hosp.inv.searchBloodTypeE')} value={query} onChange={(e) => setQuery(e.target.value)}
              slotProps={{ input: { startAdornment: <InputAdornment position="start"><SearchIcon fontSize="small" /></InputAdornment> } }}
              sx={{ flex: '1 1 220px', maxWidth: 320 }}
            />
            <TextField select size="small" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} sx={{ minWidth: 170 }} aria-label={t('hosp.inv.filterByStatus')}>
              <MenuItem value="all">{t('hosp.inv.allStatuses')}</MenuItem>
              {Object.entries(STOCK).map(([k, v]) => <MenuItem key={k} value={k}>{v.label}</MenuItem>)}
            </TextField>
          </Box>
        }
      >
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>{t('hosp.inv.bloodType')}</TableCell>
              <TableCell>{t('hosp.inv.unitsInStock')}</TableCell>
              <TableCell>{t('hosp.inv.minimum')}</TableCell>
              <TableCell>{t('hosp.inv.status')}</TableCell>
              <TableCell>{t('hosp.inv.lastUpdated')}</TableCell>
              <TableCell align="right">{t('hosp.inv.actions')}</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {visible.length === 0 && (
              <TableRow><TableCell colSpan={6}><EmptyState icon={<WaterDropIcon />} title={t('hosp.inv.noMatchingBloodTypes')} description={t('hosp.inv.tryADifferentSearch')} /></TableCell></TableRow>
            )}
            {visible.map((r) => (
              <TableRow key={r.bloodType} hover>
                <TableCell sx={{ color: 'error.main', fontWeight: 800, fontSize: '1rem' }}>{r.bloodType}</TableCell>
                <TableCell sx={{ minWidth: 170 }}>
                  <Typography sx={{ fontWeight: 700 }}>{r.units}</Typography>
                  <LinearProgress
                    variant="determinate"
                    value={Math.min(100, (r.units / ((r.minUnits || 10) * 2)) * 100)}
                    color={PROGRESS_COLOR[r.status]}
                    sx={{ mt: 0.5, height: 6, maxWidth: 140 }}
                    aria-label={t('hosp.inv.levelAria', { type: r.bloodType })}
                  />
                </TableCell>
                <TableCell>{r.minUnits ?? 10}</TableCell>
                <TableCell><StatusBadge status={r.status} label={STOCK[r.status].label} /></TableCell>
                <TableCell sx={{ whiteSpace: 'nowrap' }}>{r.missing ? <Typography variant="body2" color="text.disabled">{t('hosp.inv.notTrackedYet')}</Typography> : formatDate(r.lastUpdated)}</TableCell>
                <TableCell align="right" sx={{ whiteSpace: 'nowrap' }}>
                  <Tooltip title={t('hosp.inv.remove1Unit')}>
                    <span>
                      <IconButton size="small" disabled={busy === r.bloodType || r.units === 0} onClick={() => adjust(r.bloodType, -1)} aria-label={t('hosp.inv.removeAria', { type: r.bloodType })}>
                        <RemoveIcon fontSize="small" />
                      </IconButton>
                    </span>
                  </Tooltip>
                  <Tooltip title={t('hosp.inv.add1Unit')}>
                    <span>
                      <IconButton size="small" disabled={busy === r.bloodType} onClick={() => adjust(r.bloodType, 1)} aria-label={t('hosp.inv.addAria', { type: r.bloodType })}>
                        <AddIcon fontSize="small" />
                      </IconButton>
                    </span>
                  </Tooltip>
                  <Tooltip title={t('hosp.inv.setExactQuantity')}>
                    <IconButton size="small" onClick={() => setDialog({ mode: 'set', bloodType: r.bloodType, units: String(r.units) })} aria-label={t('hosp.inv.setAria', { type: r.bloodType })}>
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
            <DialogTitle>{dialog.mode === 'add' ? t('hosp.inv.addBloodUnits') : t('hosp.inv.setStock')}</DialogTitle>
            <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: '8px !important' }}>
              <ToggleButtonGroup
                exclusive size="small" value={dialog.mode} fullWidth
                onChange={(_, v) => v && setDialog({ ...dialog, mode: v })}
              >
                <ToggleButton value="add">{t('hosp.inv.addUnits')}</ToggleButton>
                <ToggleButton value="set">{t('hosp.inv.setTotal')}</ToggleButton>
              </ToggleButtonGroup>
              <TextField select label={t('hosp.inv.bloodType2')} value={dialog.bloodType} onChange={(e) => setDialog({ ...dialog, bloodType: e.target.value })}>
                {BLOOD_TYPES.map((bt) => <MenuItem key={bt} value={bt}>{bt}</MenuItem>)}
              </TextField>
              <TextField
                label={dialog.mode === 'add' ? t('hosp.inv.unitsToAdd') : t('hosp.inv.totalInStock')}
                type="number" value={dialog.units} autoFocus
                onChange={(e) => setDialog({ ...dialog, units: e.target.value })}
                slotProps={{ htmlInput: { min: dialog.mode === 'add' ? 1 : 0, step: 1 } }}
                helperText={dialog.mode === 'add' ? t('hosp.inv.addedHint') : t('hosp.inv.replacesHint')}
                onKeyDown={(e) => { if (e.key === 'Enter' && dialogValid) submitDialog(); }}
              />
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setDialog(null)} disabled={saving} color="inherit">{t('hosp.inv.cancel')}</Button>
              <Button variant="contained" onClick={submitDialog} disabled={saving || !dialogValid}>{saving ? t('hosp.inv.saving') : t('hosp.inv.save')}</Button>
            </DialogActions>
          </>
        )}
      </Dialog>
    </Box>
  );
}
