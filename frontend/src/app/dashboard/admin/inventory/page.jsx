'use client';
import { useI18n } from '@/i18n/I18nProvider';
import { translateServerMessage } from '@/lib/api-error';
import { useState, useEffect, useCallback } from "react";
import {
  Typography, Grid, Card, CardContent, Box, LinearProgress, IconButton, Tooltip, Paper,
  Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField, useTheme, Skeleton,
  Alert, Chip,
} from "@mui/material";
import BloodtypeIcon from "@mui/icons-material/Bloodtype";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";
import EditIcon from "@mui/icons-material/Edit";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import RefreshIcon from "@mui/icons-material/Refresh";
import dynamic from "next/dynamic";
import API_BASE from "@/lib/config";
import { useAuth } from "@/store/AuthContext";

// recharts is large and the chart sits below the stock cards, so load it on demand.
const ChartSlot = () => <Skeleton variant="rounded" height={200} />;
const InventoryTypeChart = dynamic(() => import("@/components/inventory/InventoryTypeChart"), { ssr: false, loading: ChartSlot });

const MAX_UNITS = 200;

// Blood types share the brand red (as on the hospital inventory); stock level is shown by STATUS_MAP.
const BLOOD_COLORS = {
  "A+": "#C91D32", "A-": "#C91D32",
  "B+": "#C91D32", "B-": "#C91D32",
  "O+": "#C91D32", "O-": "#C91D32",
  "AB+": "#C91D32", "AB-": "#C91D32",
};

// Labels: adm.inv.status.<status>
const STATUS_MAP = {
  empty:    { color: "#64748B" },
  critical: { color: "#C91D32" },
  low:      { color: "#F59E0B" },
  adequate: { color: "#16A34A" },
};

// A failed load/save: the server's own text when it sent one (translated at render), else a fallback key.
const failure = (key, text = '') => Object.assign(new Error(text), { key, serverText: text });

const statusBg = (status, isDark) => ({
  empty:    isDark ? "rgba(148,163,184,0.15)" : "#F1F5F9",
  critical: isDark ? "rgba(201,29,50,0.15)" : "#FFF1F2",
  low:      isDark ? "rgba(245,158,11,0.15)" : "#FEF3C7",
  adequate: isDark ? "rgba(22,163,74,0.15)"  : "#DCFCE7",
}[status] || "#F1F5F9");

export default function Inventory() {
  const { t, lang } = useI18n();
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";
  const { token } = useAuth();

  const [inventory, setInventory] = useState([]);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState("");
  const [saving, setSaving]       = useState(false);
  const [editItem, setEditItem]   = useState(null);
  const [editValue, setEditValue] = useState("");

  const cardBg = isDark ? "#17263D" : "#ffffff";
  const border = isDark ? "#334155" : "#E2E8F0";

  const fetchInventory = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res  = await fetch(`${API_BASE}/api/inventory`);
      const data = await res.json();
      if (!res.ok) throw failure("loadFailed", data.message);
      setInventory(data);
    } catch (err) {
      setError({ key: err.key || 'loadFailed', text: err.serverText || '' });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchInventory(); }, [fetchInventory]);

  const handleSave = async () => {
    const units = Math.max(0, parseInt(editValue) || 0);
    setSaving(true);
    try {
      const res = await fetch(`${API_BASE}/api/inventory/${encodeURIComponent(editItem.bloodType)}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ units }),
      });
      const updated = await res.json();
      if (!res.ok) throw failure("saveFailed", updated.message);
      setInventory(prev => prev.map(i => i.bloodType === editItem.bloodType ? updated : i));
      setEditItem(null);
    } catch (err) {
      setError({ key: err.key || 'saveFailed', text: err.serverText || '' });
    } finally {
      setSaving(false);
    }
  };

  const totalUnits    = inventory.reduce((s, i) => s + i.units, 0);
  const criticalCount = inventory.filter(i => i.status === "critical" || i.status === "empty").length;
  const normalCount   = inventory.filter(i => i.status === "adequate").length;
  const chartData     = inventory.map(i => ({ type: i.bloodType, units: i.units }));

  if (loading) return (
    <Box>
      <Skeleton variant="text" width={220} height={40} sx={{ mb: 1 }} />
      <Grid container spacing={2} mb={4}>
        {[...Array(4)].map((_, i) => <Grid size={{ xs: 6, sm: 3 }} key={i}><Skeleton variant="rounded" height={110} /></Grid>)}
      </Grid>
      <Grid container spacing={2}>
        {[...Array(8)].map((_, i) => <Grid size={{ xs: 12, sm: 6, md: 3 }} key={i}><Skeleton variant="rounded" height={160} /></Grid>)}
      </Grid>
    </Box>
  );

  return (
    <Box>
      {/* Header */}
      <Box display="flex" alignItems="flex-start" justifyContent="space-between" mb={4}>
        <Box>
          <Typography sx={{ fontSize: "1.6rem", fontWeight: 800, letterSpacing: "-0.025em",
            color: isDark ? "#F8FAFC" : "#172B4D", lineHeight: 1.2 }}>
            {t('adm.inv.bloodInventory')}
          </Typography>
          <Typography variant="body2" color="text.secondary" mt={0.5}>
            {t('adm.inv.synced', { count: totalUnits, total: totalUnits.toLocaleString() })}
          </Typography>
        </Box>
        <Box display="flex" gap={1} alignItems="center">
          {criticalCount > 0 && (
            <Chip icon={<WarningAmberIcon sx={{ fontSize: "14px !important" }} />}
              label={t('adm.inv.criticalTypes', { count: criticalCount })}
              size="small"
              sx={{ bgcolor: "#FFF1F2", color: "#C91D32", fontWeight: 700, border: "1px solid #F5C6CC" }} />
          )}
          <Tooltip title={t('adm.inv.refresh')}>
            <IconButton onClick={fetchInventory} size="small"
              sx={{ bgcolor: isDark ? "#1C2E49" : "#F1F5F9", borderRadius: "8px" }}>
              <RefreshIcon sx={{ fontSize: 18 }} />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }} onClose={() => setError("")}>{translateServerMessage(error.text, lang, t(`adm.inv.${error.key}`)) || t(`adm.inv.${error.key}`)}</Alert>
      )}

      {/* Summary Cards */}
      <Grid container spacing={2} mb={4}>
        {[
          { label: t('adm.inv.stats.total'),  value: totalUnits,    color: "#2563EB", bg: isDark ? "rgba(37,99,235,0.12)" : "#EFF6FF" },
          { label: t('adm.inv.stats.types'),  value: inventory.length, color: "#173B63", bg: isDark ? "rgba(148,163,184,0.12)" : "#EEF2F7" },
          { label: t('adm.inv.stats.critical'), value: criticalCount, color: "#C91D32", bg: isDark ? "rgba(201,29,50,0.10)" : "#FFF1F2" },
          { label: t('adm.inv.stats.normal'),       value: normalCount,   color: "#16a34a", bg: isDark ? "rgba(22,163,74,0.10)" : "#f0fdf4" },
        ].map((s, i) => (
          <Grid size={{ xs: 6, sm: 3 }} key={i}>
            <Paper elevation={0} sx={{
              p: 2.5, borderRadius: "16px", textAlign: "center",
              border: `1px solid ${border}`, bgcolor: cardBg,
              transition: "all 0.2s ease",
              "&:hover": { transform: "translateY(-2px)", boxShadow: isDark ? "0 8px 24px rgba(0,0,0,0.3)" : "0 8px 24px rgba(0,0,0,0.06)" },
            }}>
              <Box sx={{ width: 40, height: 40, borderRadius: "10px", mx: "auto", mb: 1,
                bgcolor: s.bg, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <BloodtypeIcon sx={{ fontSize: 20, color: s.color }} />
              </Box>
              <Typography sx={{ fontSize: "1.8rem", fontWeight: 800, letterSpacing: "-0.03em", color: s.color, lineHeight: 1 }}>
                {s.value}
              </Typography>
              <Typography variant="caption" color="text.secondary" mt={0.4} display="block">{s.label}</Typography>
            </Paper>
          </Grid>
        ))}
      </Grid>

      {/* Blood Type Cards */}
      <Grid container spacing={2} mb={4}>
        {inventory.map((item) => {
          const pct    = Math.min((item.units / MAX_UNITS) * 100, 100);
          const color  = BLOOD_COLORS[item.bloodType] || "#C91D32";
          const st     = STATUS_MAP[item.status] || STATUS_MAP.adequate;
          const isBad  = item.status === "critical" || item.status === "empty";

          return (
            <Grid size={{ xs: 12, sm: 6, md: 3 }} key={item.bloodType}>
              <Card elevation={0} sx={{
                borderRadius: "16px",
                border: `1px solid ${item.status === "critical" ? "rgba(201,29,50,0.4)" : border}`,
                bgcolor: cardBg, position: "relative", overflow: "visible",
                transition: "all 0.22s ease",
                "&:hover": { transform: "translateY(-4px)",
                  boxShadow: isDark ? "0 16px 40px rgba(0,0,0,0.4)" : `0 16px 40px ${color}18`,
                  borderColor: color },
              }}>
                {isBad && (
                  <Box sx={{ position: "absolute", top: -8, right: -8,
                    bgcolor: st.color, borderRadius: "50%", width: 24, height: 24, zIndex: 1,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    boxShadow: `0 2px 8px ${st.color}80` }}>
                    <WarningAmberIcon sx={{ fontSize: 13, color: "white" }} />
                  </Box>
                )}
                <CardContent sx={{ p: 2.5 }}>
                  <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={2}>
                    <Box>
                      <Typography sx={{ fontSize: "2.2rem", fontWeight: 900, color, lineHeight: 1, letterSpacing: "-0.04em" }}>
                        {item.bloodType}
                      </Typography>
                      <Box sx={{ display: "inline-flex", px: 1, py: 0.3, borderRadius: "6px", mt: 0.8,
                        bgcolor: statusBg(item.status, isDark), color: st.color }}>
                        <Typography sx={{ fontSize: "0.68rem", fontWeight: 700 }}>{t(`adm.inv.status.${STATUS_MAP[item.status] ? item.status : 'adequate'}`)}</Typography>
                      </Box>
                    </Box>
                    <Tooltip title={t('adm.inv.editUnits')}>
                      <IconButton size="small" onClick={() => { setEditItem(item); setEditValue(String(item.units)); }}
                        sx={{ color: "text.secondary", borderRadius: "8px",
                          bgcolor: isDark ? "#1C2E49" : "#F1F5F9",
                          "&:hover": { bgcolor: isDark ? "#334155" : "#E2E8F0" } }}>
                        <EditIcon sx={{ fontSize: 16 }} />
                      </IconButton>
                    </Tooltip>
                  </Box>
                  <Typography sx={{ fontSize: "1.5rem", fontWeight: 800, lineHeight: 1, mb: 0.3 }}>
                    {item.units}
                    <Box component="span" sx={{ fontSize: "0.82rem", color: "text.secondary", fontWeight: 400, ml: 0.5 }}>
                      / {MAX_UNITS} units
                    </Box>
                  </Typography>
                  <Box mt={1.8}>
                    <Box display="flex" justifyContent="space-between" mb={0.6}>
                      <Typography variant="caption" color="text.secondary">{t('adm.inv.stockLevel')}</Typography>
                      <Typography variant="caption" color="text.secondary" fontWeight={700}>{Math.round(pct)}%</Typography>
                    </Box>
                    <LinearProgress variant="determinate" value={pct} sx={{
                      height: 7, borderRadius: "100px", bgcolor: `${st.color}18`,
                      "& .MuiLinearProgress-bar": { bgcolor: st.color, borderRadius: "100px" },
                    }} />
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          );
        })}
      </Grid>

      {/* Bar Chart */}
      <Paper elevation={0} sx={{ p: 3, borderRadius: "16px", border: `1px solid ${border}`, bgcolor: cardBg }}>
        <Typography fontWeight={700} fontSize="0.95rem" letterSpacing="-0.01em" mb={0.5}>
          {t('adm.inv.inventoryOverview')}
        </Typography>
        <Typography variant="caption" color="text.secondary" display="block" mb={2.5}>
          {t('adm.inv.unitsPerBloodType')}
        </Typography>
        <InventoryTypeChart data={chartData} colors={BLOOD_COLORS} />
      </Paper>

      {/* Edit Dialog */}
      <Dialog open={!!editItem} onClose={() => setEditItem(null)} maxWidth="xs" fullWidth>
        <DialogTitle fontWeight={700} sx={{ pb: 1 }}>
          {t('adm.inv.updateTitle', { type: editItem?.bloodType })}
        </DialogTitle>
        <DialogContent>
          <TextField
            autoFocus fullWidth type="number" label={t('adm.inv.availableUnits')}
            value={editValue} onChange={e => setEditValue(e.target.value)}
            inputProps={{ min: 0, max: 999 }} margin="dense" variant="outlined"
            helperText={t('adm.inv.current', { count: editItem?.units ?? 0 })}
            sx={{ "& .MuiOutlinedInput-root": { borderRadius: "10px" } }}
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5, gap: 1 }}>
          <Button onClick={() => setEditItem(null)} color="inherit" sx={{ borderRadius: "10px", textTransform: "none" }}>
            {t('adm.inv.cancel')}
          </Button>
          <Button onClick={handleSave} variant="contained" color="error" disabled={saving}
            startIcon={<CheckCircleIcon fontSize="small" />}
            sx={{ borderRadius: "10px", textTransform: "none", fontWeight: 700 }}>
            {saving ? t('adm.inv.saving') : t('adm.inv.saveChanges')}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
