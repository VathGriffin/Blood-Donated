'use client';
import React, { useState } from "react";
import {
    Typography,
    Grid,
    Card,
    CardContent,
    Box,
    Chip,
    Avatar,
    LinearProgress,
    IconButton,
    Tooltip,
    Paper,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    TextField,
    useTheme,
} from "@mui/material";
import BloodtypeIcon from "@mui/icons-material/Bloodtype";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";
import EditIcon from "@mui/icons-material/Edit";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";

const MAX_UNITS = 200;

const BLOOD_COLORS = {
    "A+": "#ef5350",
    "A-": "#e53935",
    "B+": "#ab47bc",
    "B-": "#8e24aa",
    "O+": "#42a5f5",
    "O-": "#1e88e5",
    "AB+": "#66bb6a",
    "AB-": "#43a047",
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

const getStatus = (units) => {
    if (units < 40) return { label: "Critical", color: "error" };
    if (units < 80) return { label: "Low", color: "warning" };
    return { label: "Normal", color: "success" };
};

const Inventory = () => {
    const theme = useTheme();
    const isDark = theme.palette.mode === "dark";
    const [inventory, setInventory] = useState(initInventory);
    const [editItem, setEditItem] = useState(null);
    const [editValue, setEditValue] = useState("");

    const totalUnits = inventory.reduce((s, i) => s + i.units, 0);
    const criticalCount = inventory.filter((i) => i.units < 40).length;
    const normalCount = inventory.filter((i) => i.units >= 80).length;

    const handleEdit = (item) => {
        setEditItem(item);
        setEditValue(String(item.units));
    };

    const handleSave = () => {
        setInventory((prev) =>
            prev.map((i) =>
                i.blood === editItem.blood ? { ...i, units: Math.max(0, parseInt(editValue) || 0) } : i
            )
        );
        setEditItem(null);
    };

    const cardBg = isDark ? "#1a1a1a" : "#fff";
    const cardBorder = isDark ? "#2a2a2a" : "#f0f0f0";

    return (
        <Box>
            {/* Header */}
            <Box display="flex" alignItems="center" justifyContent="space-between" mb={3}>
                <Box display="flex" alignItems="center" gap={1.5}>
                    <Avatar sx={{ bgcolor: "#b71c1c", width: 52, height: 52 }}>
                        <BloodtypeIcon sx={{ fontSize: 26 }} />
                    </Avatar>
                    <Box>
                        <Typography
                            variant="h5"
                            fontWeight={800}
                            sx={{
                                background: "linear-gradient(to right, #b71c1c, #d32f2f)",
                                WebkitBackgroundClip: "text",
                                WebkitTextFillColor: "transparent",
                                lineHeight: 1.2,
                            }}
                        >
                            Blood Inventory
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                            {totalUnits.toLocaleString()} total units across {inventory.length} blood types
                        </Typography>
                    </Box>
                </Box>
                {criticalCount > 0 && (
                    <Chip
                        icon={<WarningAmberIcon />}
                        label={`${criticalCount} type${criticalCount > 1 ? "s" : ""} critically low`}
                        color="error"
                        variant="outlined"
                        sx={{ fontWeight: 600 }}
                    />
                )}
            </Box>

            {/* Summary Strip */}
            <Grid container spacing={2} mb={4}>
                {[
                    { label: "Total Units", value: totalUnits, color: "#2196f3" },
                    { label: "Blood Types", value: inventory.length, color: "#9c27b0" },
                    { label: "Critical", value: criticalCount, color: "#f44336" },
                    { label: "Normal", value: normalCount, color: "#4caf50" },
                ].map((s, i) => (
                    <Grid item xs={6} sm={3} key={i}>
                        <Paper
                            elevation={0}
                            sx={{
                                p: 2,
                                borderRadius: 3,
                                textAlign: "center",
                                border: `1px solid ${cardBorder}`,
                                bgcolor: cardBg,
                            }}
                        >
                            <Typography variant="h5" fontWeight={800} sx={{ color: s.color }}>
                                {s.value}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                                {s.label}
                            </Typography>
                        </Paper>
                    </Grid>
                ))}
            </Grid>

            {/* Blood Type Cards */}
            <Grid container spacing={2.5}>
                {inventory.map((item) => {
                    const pct = Math.min((item.units / MAX_UNITS) * 100, 100);
                    const color = BLOOD_COLORS[item.blood] || "#ef5350";
                    const status = getStatus(item.units);
                    const isCritical = item.units < 40;

                    return (
                        <Grid item xs={12} sm={6} md={3} key={item.blood}>
                            <Card
                                elevation={0}
                                sx={{
                                    borderRadius: 3,
                                    border: `1px solid ${isCritical ? "#ffcdd2" : cardBorder}`,
                                    bgcolor: cardBg,
                                    transition: "0.3s ease",
                                    position: "relative",
                                    overflow: "visible",
                                    "&:hover": { transform: "translateY(-4px)", boxShadow: 6 },
                                }}
                            >
                                {isCritical && (
                                    <Box
                                        sx={{
                                            position: "absolute",
                                            top: -10,
                                            right: -10,
                                            bgcolor: "#f44336",
                                            borderRadius: "50%",
                                            width: 26,
                                            height: 26,
                                            display: "flex",
                                            alignItems: "center",
                                            justifyContent: "center",
                                            boxShadow: "0 2px 6px rgba(244,67,54,0.5)",
                                            zIndex: 1,
                                        }}
                                    >
                                        <WarningAmberIcon sx={{ fontSize: 14, color: "white" }} />
                                    </Box>
                                )}

                                <CardContent sx={{ p: 2.5 }}>
                                    <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={2}>
                                        <Box>
                                            <Typography
                                                variant="h3"
                                                fontWeight={900}
                                                sx={{ color, lineHeight: 1, letterSpacing: "-1px" }}
                                            >
                                                {item.blood}
                                            </Typography>
                                            <Chip
                                                label={status.label}
                                                color={status.color}
                                                size="small"
                                                sx={{ mt: 0.8, fontSize: "0.7rem", fontWeight: 700 }}
                                            />
                                        </Box>
                                        <Tooltip title="Edit units">
                                            <IconButton
                                                size="small"
                                                onClick={() => handleEdit(item)}
                                                sx={{
                                                    color: "text.secondary",
                                                    bgcolor: isDark ? "#2a2a2a" : "#f5f5f5",
                                                    "&:hover": { bgcolor: isDark ? "#333" : "#eeeeee" },
                                                }}
                                            >
                                                <EditIcon fontSize="small" />
                                            </IconButton>
                                        </Tooltip>
                                    </Box>

                                    <Typography variant="h4" fontWeight={800} mb={0.3} lineHeight={1}>
                                        {item.units}
                                        <Typography
                                            component="span"
                                            variant="body2"
                                            color="text.secondary"
                                            fontWeight={400}
                                            ml={0.5}
                                        >
                                            / {MAX_UNITS} units
                                        </Typography>
                                    </Typography>

                                    <Box mt={1.5}>
                                        <Box display="flex" justifyContent="space-between" mb={0.6}>
                                            <Typography variant="caption" color="text.secondary">
                                                Stock level
                                            </Typography>
                                            <Typography variant="caption" color="text.secondary" fontWeight={600}>
                                                {Math.round(pct)}%
                                            </Typography>
                                        </Box>
                                        <LinearProgress
                                            variant="determinate"
                                            value={pct}
                                            sx={{
                                                height: 8,
                                                borderRadius: 4,
                                                bgcolor: `${color}22`,
                                                "& .MuiLinearProgress-bar": {
                                                    bgcolor: color,
                                                    borderRadius: 4,
                                                },
                                            }}
                                        />
                                    </Box>
                                </CardContent>
                            </Card>
                        </Grid>
                    );
                })}
            </Grid>

            {/* Edit Dialog */}
            <Dialog
                open={!!editItem}
                onClose={() => setEditItem(null)}
                maxWidth="xs"
                fullWidth
                slotProps={{ paper: { sx: { borderRadius: 3 } }}}
            >
                <DialogTitle fontWeight={700}>
                    Update {editItem?.blood} Stock
                </DialogTitle>
                <DialogContent>
                    <TextField
                        autoFocus
                        fullWidth
                        type="number"
                        label="Available Units"
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        inputProps={{ min: 0, max: 999 }}
                        margin="dense"
                        variant="outlined"
                        helperText={`Current: ${editItem?.units} units. Max display: ${MAX_UNITS}`}
                    />
                </DialogContent>
                <DialogActions sx={{ px: 3, pb: 2.5 }}>
                    <Button onClick={() => setEditItem(null)} color="inherit">
                        Cancel
                    </Button>
                    <Button
                        onClick={handleSave}
                        variant="contained"
                        color="error"
                        startIcon={<CheckCircleIcon />}
                        sx={{ borderRadius: 2 }}
                    >
                        Save
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default Inventory;
