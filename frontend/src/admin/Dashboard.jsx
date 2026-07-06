import React, { useState, useEffect } from "react";
import {
    Grid, Paper, Typography, useTheme, Box, Divider,
    IconButton, Button, Avatar, CircularProgress, Tooltip,
    List, ListItem, ListItemAvatar, ListItemText, Chip,
} from "@mui/material";
import FavoriteIcon from "@mui/icons-material/Favorite";
import BloodtypeIcon from "@mui/icons-material/Bloodtype";
import PendingActionsIcon from "@mui/icons-material/PendingActions";
import RefreshIcon from "@mui/icons-material/Refresh";
import FileDownloadIcon from "@mui/icons-material/FileDownload";
import DashboardIcon from "@mui/icons-material/Dashboard";
import ContactMailIcon from "@mui/icons-material/ContactMail";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";
import GroupIcon from "@mui/icons-material/Group";
import {
    ResponsiveContainer,
    BarChart,
    Bar,
    XAxis,
    YAxis,
    Tooltip as ChartTooltip,
    PieChart,
    Pie,
    Cell,
    Legend,
    CartesianGrid,
} from "recharts";
import axios from "axios";
import API_BASE from "../config";

const getUrgencyColor = (u) => {
    if (!u) return "default";
    switch (u.toLowerCase()) {
        case "critical":
        case "high":
            return "error";
        case "medium":
            return "warning";
        case "low":
            return "success";
        default:
            return "default";
    }
};

const Dashboard = () => {
    const theme = useTheme();
    const isDark = theme.palette.mode === "dark";
    const [loading, setLoading] = useState(false);
    const [donors, setDonors] = useState([]);
    const [requests, setRequests] = useState([]);
    const [contacts, setContacts] = useState([]);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [d, r, c] = await Promise.all([
                axios.get(`${API_BASE}/api/donors`),
                axios.get(`${API_BASE}/api/requests`),
                axios.get(`${API_BASE}/api/contacts`),
            ]);
            setDonors(d.data);
            setRequests(r.data);
            setContacts(c.data);
        } catch (err) {
            console.error("Fetch failed:", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const bloodTypeData = Object.entries(
        donors.reduce((acc, d) => {
            if (d.bloodType) acc[d.bloodType] = (acc[d.bloodType] || 0) + 1;
            return acc;
        }, {})
    ).map(([bloodType, count]) => ({ bloodType, count }));

    const availableDonors = donors.filter((d) => d.available).length;
    const unavailableDonors = donors.length - availableDonors;

    const stats = [
        {
            title: "Total Donors",
            value: donors.length,
            sub: `${availableDonors} available`,
            icon: <FavoriteIcon />,
            color: "#ef5350",
        },
        {
            title: "Blood Requests",
            value: requests.length,
            sub: "active requests",
            icon: <PendingActionsIcon />,
            color: "#ff9800",
        },
        {
            title: "Blood Units",
            value: 356,
            sub: "in inventory",
            icon: <BloodtypeIcon />,
            color: "#2196f3",
            warning: 356 < 100,
        },
        {
            title: "Messages",
            value: contacts.length,
            sub: "contact messages",
            icon: <ContactMailIcon />,
            color: "#4caf50",
        },
    ];

    const handleExport = () => {
        const rows = [
            ["Metric", "Value"],
            ...stats.map((s) => [s.title, s.value]),
        ];
        const csv = rows.map((r) => r.join(",")).join("\n");
        const blob = new Blob([csv], { type: "text/csv" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "dashboard_report.csv";
        a.click();
    };

    const cardBg = isDark ? "#1a1a1a" : "#fff";
    const cardBorder = isDark ? "#2a2a2a" : "#f0f0f0";

    return (
        <Box>
            {/* Header */}
            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", mb: 3 }}>
                <Box display="flex" alignItems="center" gap={1.5}>
                    <Avatar sx={{ bgcolor: "#b71c1c", width: 52, height: 52 }}>
                        <DashboardIcon sx={{ fontSize: 26 }} />
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
                            Dashboard Overview
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                            Welcome back, Admin — real-time blood management at a glance.
                        </Typography>
                    </Box>
                </Box>
                <Box display="flex" gap={1} alignItems="center">
                    <Button
                        variant="outlined"
                        color="error"
                        startIcon={<FileDownloadIcon />}
                        onClick={handleExport}
                        size="small"
                        sx={{ textTransform: "none", borderRadius: 2 }}
                    >
                        Export CSV
                    </Button>
                    <Tooltip title="Refresh data">
                        <IconButton
                            onClick={fetchData}
                            disabled={loading}
                            color="error"
                            sx={{ border: "1px solid", borderColor: "error.light", borderRadius: 2 }}
                        >
                            {loading ? <CircularProgress size={20} color="error" /> : <RefreshIcon />}
                        </IconButton>
                    </Tooltip>
                </Box>
            </Box>

            <Divider sx={{ mb: 3 }} />

            {/* Stat Cards */}
            <Grid container spacing={2.5} mb={4}>
                {stats.map((stat, i) => (
                    <Grid item xs={12} sm={6} md={3} key={i}>
                        <Paper elevation={0} sx={{
                            borderRadius: 3, overflow: 'hidden',
                            border: `1px solid ${cardBorder}`,
                            bgcolor: cardBg,
                            transition: "all 0.25s ease",
                            "&:hover": { transform: "translateY(-4px)", boxShadow: `0 12px 32px ${stat.color}22`, borderColor: `${stat.color}44` },
                        }}>
                            {/* Color top bar */}
                            <Box sx={{ height: 4, background: `linear-gradient(90deg, ${stat.color} 0%, ${stat.color}88 100%)` }} />
                            <Box sx={{ p: 2.5, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                <Box>
                                    <Typography variant="body2" color="text.secondary" fontWeight={600} gutterBottom fontSize="0.8rem" textTransform="uppercase" letterSpacing="0.05em">
                                        {stat.title}
                                    </Typography>
                                    <Typography variant="h4" fontWeight={800} sx={{ color: stat.color, lineHeight: 1, mb: 0.5 }}>
                                        {loading ? "—" : stat.value.toLocaleString()}
                                    </Typography>
                                    <Typography variant="caption" color="text.secondary" display="block">
                                        {stat.sub}
                                    </Typography>
                                    {stat.warning && (
                                        <Chip label="⚠ Low stock" size="small" color="error" sx={{ mt: 1, fontSize: '0.68rem', height: 20 }} />
                                    )}
                                </Box>
                                <Avatar sx={{ bgcolor: `${stat.color}15`, color: stat.color, width: 52, height: 52, border: `2px solid ${stat.color}22` }}>
                                    {stat.icon}
                                </Avatar>
                            </Box>
                        </Paper>
                    </Grid>
                ))}
            </Grid>

            {/* Charts Row */}
            <Grid container spacing={2.5} mb={3}>
                {/* Bar chart */}
                <Grid item xs={12} md={8}>
                    <Paper
                        elevation={0}
                        sx={{ p: 3, borderRadius: 3, border: `1px solid ${cardBorder}`, bgcolor: cardBg }}
                    >
                        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2.5}>
                            <Box>
                                <Typography variant="h6" fontWeight={700} lineHeight={1.2}>
                                    Donors by Blood Type
                                </Typography>
                                <Typography variant="caption" color="text.secondary">
                                    Distribution of registered donors
                                </Typography>
                            </Box>
                            <TrendingUpIcon color="error" />
                        </Box>
                        <ResponsiveContainer width="100%" height={260}>
                            <BarChart data={bloodTypeData.length ? bloodTypeData : [{ bloodType: "—", count: 0 }]} barSize={32}>
                                <defs>
                                    <linearGradient id="barGrad" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="0%" stopColor="#ef5350" stopOpacity={0.9} />
                                        <stop offset="100%" stopColor="#ffcdd2" stopOpacity={0.5} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke={isDark ? "#2a2a2a" : "#f5f5f5"} vertical={false} />
                                <XAxis dataKey="bloodType" tick={{ fontSize: 12, fontWeight: 600 }} axisLine={false} tickLine={false} />
                                <YAxis tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                                <ChartTooltip
                                    contentStyle={{ borderRadius: 8, fontSize: 12, border: "none", boxShadow: "0 4px 12px rgba(0,0,0,0.12)" }}
                                    cursor={{ fill: isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.04)" }}
                                />
                                <Bar dataKey="count" fill="url(#barGrad)" radius={[6, 6, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </Paper>
                </Grid>

                {/* Pie chart */}
                <Grid item xs={12} md={4}>
                    <Paper
                        elevation={0}
                        sx={{ p: 3, borderRadius: 3, border: `1px solid ${cardBorder}`, bgcolor: cardBg, height: "100%" }}
                    >
                        <Typography variant="h6" fontWeight={700} lineHeight={1.2} mb={0.5}>
                            Donor Availability
                        </Typography>
                        <Typography variant="caption" color="text.secondary" display="block" mb={2}>
                            Available vs unavailable
                        </Typography>
                        <ResponsiveContainer width="100%" height={220}>
                            <PieChart>
                                <Pie
                                    data={[
                                        { name: "Available", value: availableDonors || 0 },
                                        { name: "Unavailable", value: unavailableDonors || 0 },
                                    ]}
                                    innerRadius={55}
                                    outerRadius={88}
                                    paddingAngle={4}
                                    dataKey="value"
                                >
                                    <Cell fill="#4caf50" />
                                    <Cell fill="#ef5350" />
                                </Pie>
                                <Legend
                                    iconType="circle"
                                    iconSize={9}
                                    formatter={(v) => <span style={{ fontSize: 12 }}>{v}</span>}
                                />
                                <ChartTooltip
                                    contentStyle={{ borderRadius: 8, fontSize: 12, border: "none", boxShadow: "0 4px 12px rgba(0,0,0,0.12)" }}
                                />
                            </PieChart>
                        </ResponsiveContainer>
                    </Paper>
                </Grid>
            </Grid>

            {/* Recent lists */}
            <Grid container spacing={2.5}>
                {/* Recent requests */}
                <Grid item xs={12} md={7}>
                    <Paper
                        elevation={0}
                        sx={{ p: 3, borderRadius: 3, border: `1px solid ${cardBorder}`, bgcolor: cardBg }}
                    >
                        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                            <Box>
                                <Typography variant="h6" fontWeight={700} lineHeight={1.2}>
                                    Recent Blood Requests
                                </Typography>
                                <Typography variant="caption" color="text.secondary">
                                    Latest {Math.min(requests.length, 5)} of {requests.length} requests
                                </Typography>
                            </Box>
                            <PendingActionsIcon sx={{ color: "text.disabled" }} />
                        </Box>
                        {requests.length === 0 ? (
                            <Box textAlign="center" py={4}>
                                <BloodtypeIcon sx={{ fontSize: 40, color: "text.disabled", mb: 1 }} />
                                <Typography color="text.secondary" fontSize="0.9rem">No requests yet.</Typography>
                            </Box>
                        ) : (
                            <List dense disablePadding>
                                {requests.slice(0, 5).map((req, idx) => (
                                    <ListItem
                                        key={req._id}
                                        disablePadding
                                        sx={{
                                            py: 1.3,
                                            borderBottom: idx < 4 ? `1px solid ${isDark ? "#222" : "#f5f5f5"}` : "none",
                                        }}
                                    >
                                        <ListItemAvatar>
                                            <Avatar
                                                sx={{
                                                    bgcolor: "#ffebee",
                                                    color: "#b71c1c",
                                                    fontWeight: 800,
                                                    fontSize: "0.8rem",
                                                    width: 40,
                                                    height: 40,
                                                    border: "2px solid #ffcdd2",
                                                }}
                                            >
                                                {req.bloodType}
                                            </Avatar>
                                        </ListItemAvatar>
                                        <ListItemText
                                            primary={
                                                <Typography fontWeight={600} fontSize="0.88rem">
                                                    {req.patientName || "Unknown Patient"}
                                                </Typography>
                                            }
                                            secondary={
                                                <Typography fontSize="0.76rem" color="text.secondary">
                                                    {req.hospitalName} • {req.reason}
                                                </Typography>
                                            }
                                        />
                                        <Chip
                                            label={req.urgency || "—"}
                                            color={getUrgencyColor(req.urgency)}
                                            size="small"
                                            sx={{ fontSize: "0.7rem", fontWeight: 700 }}
                                        />
                                    </ListItem>
                                ))}
                            </List>
                        )}
                    </Paper>
                </Grid>

                {/* Recent donors */}
                <Grid item xs={12} md={5}>
                    <Paper
                        elevation={0}
                        sx={{ p: 3, borderRadius: 3, border: `1px solid ${cardBorder}`, bgcolor: cardBg }}
                    >
                        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                            <Box>
                                <Typography variant="h6" fontWeight={700} lineHeight={1.2}>
                                    Recent Donors
                                </Typography>
                                <Typography variant="caption" color="text.secondary">
                                    Latest {Math.min(donors.length, 5)} registrations
                                </Typography>
                            </Box>
                            <GroupIcon sx={{ color: "text.disabled" }} />
                        </Box>
                        {donors.length === 0 ? (
                            <Box textAlign="center" py={4}>
                                <FavoriteIcon sx={{ fontSize: 40, color: "text.disabled", mb: 1 }} />
                                <Typography color="text.secondary" fontSize="0.9rem">No donors yet.</Typography>
                            </Box>
                        ) : (
                            <List dense disablePadding>
                                {donors.slice(0, 5).map((d, idx) => (
                                    <ListItem
                                        key={d._id}
                                        disablePadding
                                        sx={{
                                            py: 1.3,
                                            borderBottom: idx < 4 ? `1px solid ${isDark ? "#222" : "#f5f5f5"}` : "none",
                                        }}
                                    >
                                        <ListItemAvatar>
                                            <Avatar
                                                sx={{
                                                    bgcolor: "#b71c1c",
                                                    width: 38,
                                                    height: 38,
                                                    fontSize: "0.88rem",
                                                    fontWeight: 700,
                                                }}
                                            >
                                                {d.fullName?.charAt(0)?.toUpperCase()}
                                            </Avatar>
                                        </ListItemAvatar>
                                        <ListItemText
                                            primary={
                                                <Typography fontWeight={600} fontSize="0.88rem">
                                                    {d.fullName}
                                                </Typography>
                                            }
                                            secondary={
                                                <Typography fontSize="0.76rem" color="text.secondary">
                                                    {d.bloodType} • {d.location}
                                                </Typography>
                                            }
                                        />
                                        <Chip
                                            label={d.available ? "Available" : "Busy"}
                                            color={d.available ? "success" : "default"}
                                            size="small"
                                            sx={{ fontSize: "0.7rem" }}
                                        />
                                    </ListItem>
                                ))}
                            </List>
                        )}
                    </Paper>
                </Grid>
            </Grid>
        </Box>
    );
};

export default Dashboard;
