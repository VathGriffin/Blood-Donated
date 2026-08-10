'use client';
import React, { useState, useEffect, useCallback } from "react";
import {
  Typography, Grid, Card, CardContent, Box, LinearProgress,
  IconButton, Tooltip, Paper, Dialog, DialogTitle, DialogContent,
  DialogActions, Button, TextField, useTheme, Skeleton, Alert, Chip,
} from "@mui/material";
import BloodtypeIcon from "@mui/icons-material/Bloodtype";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";
import EditIcon from "@mui/icons-material/Edit";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import RefreshIcon from "@mui/icons-material/Refresh";
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis,
  Tooltip as ChartTooltip, CartesianGrid, Cell,
} from "recharts";
import API_BASE from "@/lib/config";
import { useAuth } from "@/store/AuthContext";

const MAX_UNITS = 200;

const BLOOD_COLORS = {
  "A+": "#dc2626", "A-": "#b91c1c",
  "B+": "#7c3aed", "B-": "#6d28d9",
  "O+": "#2563eb", "O-": "#1d4ed8",
  "AB+": "#059669", "AB-": "#047857",
};

const STATUS_MAP = {
  empty:    { label: "Empty",    color: "#dc2626" },
  critical: { label: "Critical", color: "#dc2626" },
  low:      { label: "Low",      color: "#d97706" },
  adequate: { label: "Normal",   color: "#16a34a" },
};

const statusBg = (status, isDark) => ({
  empty:    isDark ? "rgba(220,38,38,0.15)" : "#ffebee",
  critical: isDark ? "rgba(220,38,38,0.15)" : "#ffebee",
  low:      isDark ? "rgba(217,119,6,0.15)"  : "#fff8e1",
  adequate: isDark ? "rgba(22,163,74,0.15)"  : "#e8f5e9",
}[status] || "#f5f5f5");

export default function Inventory() {
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";
  const { token } = useAuth();

  const [inventory, setInventory] = useState([]);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState("");
  const [saving, setSaving]       = useState(false);
  const [editItem, setEditItem]   = useState(null);
  const [editValue, setEditValue] = useState("");

  const cardBg = isDark ? "#111111" : "#ffffff";
  const border = isDark ? "#1f1f1f" : "#e5e5e5";

  const fetchInventory = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res  = await fetch(`${API_BASE}/api/inventory`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to load inventory");
      setInventory(data);
    } catch (err) {
      setError(err.message);
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
      if (!res.ok) throw new Error(updated.message || "Save failed");
      setInventory(prev => prev.map(i => i.bloodType === editItem.bloodType ? updated : i));
      setEditItem(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const totalUnits    = inventory.reduce((s, i) => s + i.units, 0);
  const criticalCount = inventory.filter(i => i.status === "critical" || i.status === "empty").length;
  const lowCount      = inventory.filter(i => i.status === "low").length;
  const normalCount   = inventory.filter(i => i.status === "adequate").length;
  const chartData     = inventory.map(i => ({ type: i.bloodType, units: i.units }));

  if (loading) return (
    <Box>
      <Skeleton variant="text" width={220} height={40} sx={{ mb: 1 }} />
      <Grid container spacing={2} mb={4}>
        {[...Array(4)].map((_, i) => <Grid item xs={6} sm={3} key={i}><Skeleton variant="rounded" height={110} /></Grid>)}
      </Grid>
      <Grid container spacing={2}>
        {[...Array(8)].map((_, i) => <Grid item xs={12} sm={6} md={3} key={i}><Skeleton variant="rounded" height={160} /></Grid>)}
      </Grid>
    </Box>
  );

  return (
    <Box>
      {/* Header */}
      <Box display="flex" alignItems="flex-start" justifyContent="space-between" mb={4}>
        <Box>
          <Typography sx={{ fontSize: "1.6rem", fontWeight: 800, letterSpacing: "-0.025em",
            color: isDark ? "#f5f5f5" : "#111111", lineHeight: 1.2 }}>
            Blood Inventory
          </Typography>
          <Typography variant="body2" color="text.secondary" mt={0.5}>
            {totalUnits.toLocaleString()} total units · Last synced from database
          </Typography>
        </Box>
        <Box display="flex" gap={1} alignItems="center">
          {criticalCount > 0 && (
            <Chip icon={<WarningAmberIcon sx={{ fontSize: "14px !important" }} />}
              label={`${criticalCount} type${criticalCount > 1 ? "s" : ""} critically low`}
              size="small"
              sx={{ bgcolor: "#ffebee", color: "#dc2626", fontWeight: 700, border: "1px solid #fca5a5" }} />
          )}
          <Tooltip title="Refresh">
            <IconButton onClick={fetchInventory} size="small"
              sx={{ bgcolor: isDark ? "#1a1a1a" : "#f5f5f5", borderRadius: "8px" }}>
              <RefreshIcon sx={{ fontSize: 18 }} />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }} onClose={() => setError("")}>{error}</Alert>
      )}

      {/* Summary Cards */}
      <Grid container spacing={2} mb={4}>
        {[
          { label: "Total Units",  value: totalUnits,    color: "#3b82f6", bg: isDark ? "rgba(59,130,246,0.10)" : "#eff6ff" },
          { label: "Blood Types",  value: inventory.length, color: "#8b5cf6", bg: isDark ? "rgba(139,92,246,0.10)" : "#f5f3ff" },
          { label: "Critical / Empty", value: criticalCount, color: "#dc2626", bg: isDark ? "rgba(220,38,38,0.10)" : "#fff0f0" },
          { label: "Normal",       value: normalCount,   color: "#16a34a", bg: isDark ? "rgba(22,163,74,0.10)" : "#f0fdf4" },
        ].map((s, i) => (
          <Grid item xs={6} sm={3} key={i}>
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
          const color  = BLOOD_COLORS[item.bloodType] || "#dc2626";
          const st     = STATUS_MAP[item.status] || STATUS_MAP.adequate;
          const isBad  = item.status === "critical" || item.status === "empty";

          return (
            <Grid item xs={12} sm={6} md={3} key={item.bloodType}>
              <Card elevation={0} sx={{
                borderRadius: "16px",
                border: `1px solid ${isBad ? "rgba(220,38,38,0.4)" : border}`,
                bgcolor: cardBg, position: "relative", overflow: "visible",
                transition: "all 0.22s ease",
                "&:hover": { transform: "translateY(-4px)",
                  boxShadow: isDark ? "0 16px 40px rgba(0,0,0,0.4)" : `0 16px 40px ${color}18`,
                  borderColor: color },
              }}>
                {isBad && (
                  <Box sx={{ position: "absolute", top: -8, right: -8,
                    bgcolor: "#dc2626", borderRadius: "50%", width: 24, height: 24, zIndex: 1,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    boxShadow: "0 2px 8px rgba(220,38,38,0.5)" }}>
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
                        <Typography sx={{ fontSize: "0.68rem", fontWeight: 700 }}>{st.label}</Typography>
                      </Box>
                    </Box>
                    <Tooltip title="Edit units">
                      <IconButton size="small" onClick={() => { setEditItem(item); setEditValue(String(item.units)); }}
                        sx={{ color: "text.secondary", borderRadius: "8px",
                          bgcolor: isDark ? "#1a1a1a" : "#f5f5f5",
                          "&:hover": { bgcolor: isDark ? "#2a2a2a" : "#ebebeb" } }}>
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
                      <Typography variant="caption" color="text.secondary">Stock level</Typography>
                      <Typography variant="caption" color="text.secondary" fontWeight={700}>{Math.round(pct)}%</Typography>
                    </Box>
                    <LinearProgress variant="determinate" value={pct} sx={{
                      height: 7, borderRadius: "100px", bgcolor: `${color}18`,
                      "& .MuiLinearProgress-bar": { bgcolor: color, borderRadius: "100px" },
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
          Inventory Overview
        </Typography>
        <Typography variant="caption" color="text.secondary" display="block" mb={2.5}>
          Units per blood type — live data from database
        </Typography>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={chartData} barSize={28}>
            <CartesianGrid strokeDasharray="3 3" stroke={isDark ? "#1f1f1f" : "#f0f0f0"} vertical={false} />
            <XAxis dataKey="type" tick={{ fontSize: 11, fontWeight: 700 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
            <ChartTooltip contentStyle={{ borderRadius: 10, fontSize: 12, border: `1px solid ${border}`, backgroundColor: cardBg }}
              cursor={{ fill: isDark ? "rgba(255,255,255,0.03)" : "rgba(0,0,0,0.02)" }} />
            <Bar dataKey="units" radius={[5, 5, 0, 0]}>
              {chartData.map((entry, i) => (
                <Cell key={i} fill={BLOOD_COLORS[entry.type] || "#dc2626"} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </Paper>

      {/* Edit Dialog */}
      <Dialog open={!!editItem} onClose={() => setEditItem(null)} maxWidth="xs" fullWidth>
        <DialogTitle fontWeight={700} sx={{ pb: 1 }}>
          Update {editItem?.bloodType} Stock
        </DialogTitle>
        <DialogContent>
          <TextField
            autoFocus fullWidth type="number" label="Available Units"
            value={editValue} onChange={e => setEditValue(e.target.value)}
            inputProps={{ min: 0, max: 999 }} margin="dense" variant="outlined"
            helperText={`Current: ${editItem?.units} units`}
            sx={{ "& .MuiOutlinedInput-root": { borderRadius: "10px" } }}
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5, gap: 1 }}>
          <Button onClick={() => setEditItem(null)} color="inherit" sx={{ borderRadius: "10px", textTransform: "none" }}>
            Cancel
          </Button>
          <Button onClick={handleSave} variant="contained" color="error" disabled={saving}
            startIcon={<CheckCircleIcon fontSize="small" />}
            sx={{ borderRadius: "10px", textTransform: "none", fontWeight: 700 }}>
            {saving ? "Saving…" : "Save Changes"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
