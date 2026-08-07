'use client';
import React, { useState } from "react";
import {
  Typography, Grid, Card, CardContent, Box, LinearProgress,
  IconButton, Tooltip, Paper, Dialog, DialogTitle, DialogContent,
  DialogActions, Button, TextField, useTheme,
} from "@mui/material";
import BloodtypeIcon from "@mui/icons-material/Bloodtype";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";
import EditIcon from "@mui/icons-material/Edit";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis,
  Tooltip as ChartTooltip, CartesianGrid,
} from "recharts";

const MAX_UNITS = 200;

const BLOOD_COLORS = {
  "A+":  "#dc2626",
  "A-":  "#b91c1c",
  "B+":  "#7c3aed",
  "B-":  "#6d28d9",
  "O+":  "#2563eb",
  "O-":  "#1d4ed8",
  "AB+": "#059669",
  "AB-": "#047857",
};

const initInventory = [
  { blood: "A+", units: 120 },
  { blood: "A-", units: 45 },
  { blood: "B+", units: 85 },
  { blood: "B-", units: 30 },
  { blood: "O+", units: 160 },
  { blood: "O-", units: 20 },
  { blood: "AB+", units: 32 },
  { blood: "AB-", units: 15 },
];

const getStatus = (units, isDark) => {
  if (units < 40) return { label: "Critical", bg: isDark ? "rgba(220,38,38,0.15)" : "#ffebee", color: "#dc2626" };
  if (units < 80) return { label: "Low",      bg: isDark ? "rgba(217,119,6,0.15)"  : "#fff8e1", color: "#d97706" };
  return            { label: "Normal",  bg: isDark ? "rgba(22,163,74,0.15)"  : "#e8f5e9", color: "#16a34a" };
};

const Inventory = () => {
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";
  const [inventory, setInventory] = useState(initInventory);
  const [editItem, setEditItem] = useState(null);
  const [editValue, setEditValue] = useState("");

  const totalUnits = inventory.reduce((s, i) => s + i.units, 0);
  const criticalCount = inventory.filter(i => i.units < 40).length;
  const lowCount = inventory.filter(i => i.units >= 40 && i.units < 80).length;
  const normalCount = inventory.filter(i => i.units >= 80).length;

  const handleEdit = (item) => { setEditItem(item); setEditValue(String(item.units)); };
  const handleSave = () => {
    setInventory(prev =>
      prev.map(i => i.blood === editItem.blood ? { ...i, units: Math.max(0, parseInt(editValue) || 0) } : i)
    );
    setEditItem(null);
  };

  const cardBg = isDark ? "#111111" : "#ffffff";
  const border = isDark ? "#1f1f1f" : "#e5e5e5";

  const chartData = inventory.map(i => ({ type: i.blood, units: i.units, color: BLOOD_COLORS[i.blood] }));

  return (
    <Box>
      {/* Header */}
      <Box display="flex" alignItems="flex-start" justifyContent="space-between" mb={4}>
        <Box>
          <Typography sx={{
            fontSize: "1.6rem", fontWeight: 800, letterSpacing: "-0.025em",
            color: isDark ? "#f5f5f5" : "#111111", lineHeight: 1.2,
          }}>
            Blood Inventory
          </Typography>
          <Typography variant="body2" color="text.secondary" mt={0.5}>
            {totalUnits.toLocaleString()} total units across {inventory.length} blood types
          </Typography>
        </Box>
        {criticalCount > 0 && (
          <Box sx={{
            display: "flex", alignItems: "center", gap: 0.8,
            px: 1.5, py: 0.7, borderRadius: "10px",
            bgcolor: "#ffebee", border: "1px solid #fca5a5",
          }}>
            <WarningAmberIcon sx={{ fontSize: 16, color: "#dc2626" }} />
            <Typography sx={{ fontSize: "0.78rem", fontWeight: 700, color: "#dc2626" }}>
              {criticalCount} type{criticalCount > 1 ? "s" : ""} critically low
            </Typography>
          </Box>
        )}
      </Box>

      {/* Summary Cards */}
      <Grid container spacing={2} mb={4}>
        {[
          { label: "Total Units", value: totalUnits, color: "#3b82f6", bg: isDark ? "rgba(59,130,246,0.10)" : "#eff6ff" },
          { label: "Blood Types", value: inventory.length, color: "#8b5cf6", bg: isDark ? "rgba(139,92,246,0.10)" : "#f5f3ff" },
          { label: "Critical",    value: criticalCount,    color: "#dc2626", bg: isDark ? "rgba(220,38,38,0.10)"  : "#fff0f0" },
          { label: "Normal",      value: normalCount,      color: "#16a34a", bg: isDark ? "rgba(22,163,74,0.10)"  : "#f0fdf4" },
        ].map((s, i) => (
          <Grid item xs={6} sm={3} key={i}>
            <Paper elevation={0} sx={{
              p: 2.5, borderRadius: "16px", textAlign: "center",
              border: `1px solid ${border}`, bgcolor: cardBg,
              transition: "all 0.2s ease",
              "&:hover": { transform: "translateY(-2px)", boxShadow: isDark ? "0 8px 24px rgba(0,0,0,0.3)" : "0 8px 24px rgba(0,0,0,0.06)" },
            }}>
              <Box sx={{
                width: 40, height: 40, borderRadius: "10px", mx: "auto", mb: 1,
                bgcolor: s.bg, display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                <BloodtypeIcon sx={{ fontSize: 20, color: s.color }} />
              </Box>
              <Typography sx={{ fontSize: "1.8rem", fontWeight: 800, letterSpacing: "-0.03em", color: s.color, lineHeight: 1 }}>
                {s.value}
              </Typography>
              <Typography variant="caption" color="text.secondary" mt={0.4} display="block">
                {s.label}
              </Typography>
            </Paper>
          </Grid>
        ))}
      </Grid>

      {/* Blood Type Cards */}
      <Grid container spacing={2} mb={4}>
        {inventory.map((item) => {
          const pct = Math.min((item.units / MAX_UNITS) * 100, 100);
          const color = BLOOD_COLORS[item.blood] || "#dc2626";
          const status = getStatus(item.units, isDark);
          const isCritical = item.units < 40;

          return (
            <Grid item xs={12} sm={6} md={3} key={item.blood}>
              <Card elevation={0} sx={{
                borderRadius: "16px",
                border: `1px solid ${isCritical ? "rgba(220,38,38,0.4)" : border}`,
                bgcolor: cardBg,
                transition: "all 0.22s ease",
                position: "relative", overflow: "visible",
                "&:hover": {
                  transform: "translateY(-4px)",
                  boxShadow: isDark ? `0 16px 40px rgba(0,0,0,0.4)` : `0 16px 40px ${color}18`,
                  borderColor: color,
                },
              }}>
                {isCritical && (
                  <Box sx={{
                    position: "absolute", top: -8, right: -8,
                    bgcolor: "#dc2626", borderRadius: "50%",
                    width: 24, height: 24,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    boxShadow: "0 2px 8px rgba(220,38,38,0.5)", zIndex: 1,
                  }}>
                    <WarningAmberIcon sx={{ fontSize: 13, color: "white" }} />
                  </Box>
                )}

                <CardContent sx={{ p: 2.5 }}>
                  <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={2}>
                    <Box>
                      <Typography sx={{ fontSize: "2.2rem", fontWeight: 900, color, lineHeight: 1, letterSpacing: "-0.04em" }}>
                        {item.blood}
                      </Typography>
                      <Box sx={{
                        display: "inline-flex", px: 1, py: 0.3, borderRadius: "6px", mt: 0.8,
                        bgcolor: status.bg, color: status.color,
                      }}>
                        <Typography sx={{ fontSize: "0.68rem", fontWeight: 700 }}>{status.label}</Typography>
                      </Box>
                    </Box>
                    <Tooltip title="Edit units">
                      <IconButton size="small" onClick={() => handleEdit(item)}
                        sx={{
                          color: "text.secondary", borderRadius: "8px",
                          bgcolor: isDark ? "#1a1a1a" : "#f5f5f5",
                          "&:hover": { bgcolor: isDark ? "#2a2a2a" : "#ebebeb" },
                        }}>
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
                      height: 7, borderRadius: "100px",
                      bgcolor: `${color}18`,
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
          Units per blood type
        </Typography>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={chartData} barSize={28}>
            <CartesianGrid strokeDasharray="3 3" stroke={isDark ? "#1f1f1f" : "#f0f0f0"} vertical={false} />
            <XAxis dataKey="type" tick={{ fontSize: 11, fontWeight: 700 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
            <ChartTooltip
              contentStyle={{ borderRadius: 10, fontSize: 12, border: `1px solid ${border}`, backgroundColor: cardBg }}
              cursor={{ fill: isDark ? "rgba(255,255,255,0.03)" : "rgba(0,0,0,0.02)" }}
            />
            <Bar dataKey="units" radius={[5, 5, 0, 0]}
              fill="#dc2626"
              label={false}
            />
          </BarChart>
        </ResponsiveContainer>
      </Paper>

      {/* Edit Dialog */}
      <Dialog open={!!editItem} onClose={() => setEditItem(null)} maxWidth="xs" fullWidth>
        <DialogTitle fontWeight={700} sx={{ pb: 1 }}>
          Update {editItem?.blood} Stock
        </DialogTitle>
        <DialogContent>
          <TextField
            autoFocus fullWidth type="number" label="Available Units"
            value={editValue} onChange={e => setEditValue(e.target.value)}
            inputProps={{ min: 0, max: 999 }} margin="dense" variant="outlined"
            helperText={`Current: ${editItem?.units} units. Max display: ${MAX_UNITS}`}
            sx={{ "& .MuiOutlinedInput-root": { borderRadius: "10px" } }}
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5, gap: 1 }}>
          <Button onClick={() => setEditItem(null)} color="inherit" sx={{ borderRadius: "10px", textTransform: "none" }}>
            Cancel
          </Button>
          <Button onClick={handleSave} variant="contained" color="error"
            startIcon={<CheckCircleIcon fontSize="small" />}
            sx={{ borderRadius: "10px", textTransform: "none", fontWeight: 700 }}>
            Save Changes
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Inventory;
