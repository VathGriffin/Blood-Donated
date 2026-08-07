'use client';
import React, { useState, useEffect, useCallback } from "react";
import {
  Grid, Paper, Typography, useTheme, Box,
  IconButton, Button, CircularProgress, Tooltip,
  Table, TableBody, TableCell, TableHead, TableRow,
  Avatar, Chip,
} from "@mui/material";
import FavoriteIcon from "@mui/icons-material/Favorite";
import BloodtypeIcon from "@mui/icons-material/Bloodtype";
import PendingActionsIcon from "@mui/icons-material/PendingActions";
import CalendarMonthIcon from "@mui/icons-material/CalendarMonth";
import MailOutlineIcon from "@mui/icons-material/MailOutline";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";
import RefreshIcon from "@mui/icons-material/Refresh";
import FileDownloadIcon from "@mui/icons-material/FileDownload";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";
import TrendingDownIcon from "@mui/icons-material/TrendingDown";
import PersonIcon from "@mui/icons-material/Person";
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis,
  Tooltip as ChartTooltip, PieChart, Pie, Cell,
  CartesianGrid,
} from "recharts";
import axios from "axios";
import API_BASE from "@/lib/config";
import { useAuth } from "@/store/AuthContext";

const statusColor = (s) => {
  if (!s) return { bg: "#f5f5f5", color: "#888888" };
  const l = s.toLowerCase();
  if (l === "approved")  return { bg: "#e8f5e9", color: "#388e3c" };
  if (l === "pending")   return { bg: "#fff8e1", color: "#f9a825" };
  if (l === "rejected")  return { bg: "#ffebee", color: "#c62828" };
  if (l === "critical")  return { bg: "#ffebee", color: "#c62828" };
  if (l === "completed") return { bg: "#e3f2fd", color: "#1565c0" };
  return { bg: "#f5f5f5", color: "#888888" };
};

const urgencyColor = (u) => {
  if (!u) return { bg: "#f5f5f5", color: "#888888" };
  const l = u.toLowerCase();
  if (l === "critical") return { bg: "#ffebee", color: "#c62828" };
  if (l === "urgent")   return { bg: "#fff3e0", color: "#e65100" };
  return { bg: "#e8f5e9", color: "#388e3c" };
};

const initials = (name) => {
  if (!name) return "?";
  return name.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase();
};

const Dashboard = () => {
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";
  const { token } = useAuth();
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState(null);
  const [error, setError] = useState(null);

  const fetchStats = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await axios.get(`${API_BASE}/api/stats`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setStats(data);
    } catch (err) {
      setError(err.response?.data?.error || "Failed to load dashboard data.");
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => { fetchStats(); }, [fetchStats]);

  const cardBg = isDark ? "#111111" : "#ffffff";
  const border = isDark ? "#1f1f1f" : "#e5e5e5";

  const now = new Date();
  const dateStr = now.toLocaleDateString("en-US", {
    weekday: "long", year: "numeric", month: "long", day: "numeric",
  });

  const statCards = stats ? [
    {
      title: "Total Donors",
      value: stats.donors.total,
      sub: `${stats.donors.available} available`,
      trendUp: true,
      icon: <FavoriteIcon sx={{ fontSize: 20 }} />,
      color: "#dc2626",
      bg: isDark ? "rgba(220,38,38,0.12)" : "#fff0f0",
    },
    {
      title: "Blood Requests",
      value: stats.requests.total,
      sub: `${stats.requests.pending} pending`,
      badge: stats.requests.critical > 0 ? `${stats.requests.critical} critical` : null,
      trendUp: false,
      icon: <BloodtypeIcon sx={{ fontSize: 20 }} />,
      color: "#f59e0b",
      bg: isDark ? "rgba(245,158,11,0.12)" : "#fffbeb",
    },
    {
      title: "Appointments",
      value: stats.appointments.total,
      sub: `${stats.appointments.pending} pending`,
      trendUp: true,
      icon: <CalendarMonthIcon sx={{ fontSize: 20 }} />,
      color: "#3b82f6",
      bg: isDark ? "rgba(59,130,246,0.12)" : "#eff6ff",
    },
    {
      title: "Contact Messages",
      value: stats.messages.total,
      sub: "Inbox",
      trendUp: true,
      icon: <MailOutlineIcon sx={{ fontSize: 20 }} />,
      color: "#8b5cf6",
      bg: isDark ? "rgba(139,92,246,0.12)" : "#f5f3ff",
    },
  ] : [];

  const bloodTypeChartData = stats?.bloodTypeBreakdown ?? [];

  const pendingCount  = stats?.requests?.pending ?? 0;
  const criticalCount = stats?.requests?.critical ?? 0;
  const otherCount    = (stats?.requests?.total ?? 0) - pendingCount - criticalCount;
  const pieTotal = pendingCount + criticalCount + Math.max(otherCount, 0) || 1;

  const pieData = [
    { name: "Pending",  value: pendingCount,           color: "#f59e0b" },
    { name: "Critical", value: criticalCount,           color: "#ef4444" },
    { name: "Other",    value: Math.max(otherCount, 0), color: "#3b82f6" },
  ].filter(d => d.value > 0);

  const recentRequests = stats?.recentRequests ?? [];
  const recentDonors   = stats?.recentDonors ?? [];

  const handleExport = () => {
    if (!stats) return;
    const rows = [
      ["Metric", "Value"],
      ["Total Donors", stats.donors.total],
      ["Available Donors", stats.donors.available],
      ["Total Requests", stats.requests.total],
      ["Pending Requests", stats.requests.pending],
      ["Critical Requests", stats.requests.critical],
      ["Total Appointments", stats.appointments.total],
      ["Pending Appointments", stats.appointments.pending],
      ["Contact Messages", stats.messages.total],
    ];
    const csv = rows.map(r => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = "dashboard_report.csv"; a.click();
    URL.revokeObjectURL(url);
  };

  const StatCard = ({ stat }) => (
    <Paper elevation={0} sx={{
      borderRadius: "16px", border: `1px solid ${border}`, bgcolor: cardBg,
      p: 2.5, transition: "all 0.22s ease",
      "&:hover": {
        boxShadow: isDark ? "0 8px 32px rgba(0,0,0,0.4)" : "0 8px 32px rgba(0,0,0,0.08)",
        transform: "translateY(-2px)",
      },
    }}>
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography variant="caption" color="text.secondary" fontWeight={600}
            sx={{ textTransform: "uppercase", letterSpacing: "0.07em", fontSize: "0.7rem", display: "block", mb: 1 }}>
            {stat.title}
          </Typography>
          <Typography sx={{ fontSize: "2rem", fontWeight: 800, letterSpacing: "-0.03em", color: isDark ? "#f5f5f5" : "#111111", lineHeight: 1 }}>
            {loading ? "—" : stat.value.toLocaleString()}
          </Typography>
          <Box sx={{ display: "flex", alignItems: "center", gap: 0.8, mt: 0.8, flexWrap: "wrap" }}>
            <Typography variant="caption" color="text.secondary" sx={{ fontSize: "0.72rem" }}>
              {stat.sub}
            </Typography>
            {stat.badge && (
              <Box sx={{ display: "flex", alignItems: "center", gap: 0.3 }}>
                <WarningAmberIcon sx={{ fontSize: 11, color: "#ef4444" }} />
                <Typography variant="caption" sx={{ color: "#ef4444", fontWeight: 700, fontSize: "0.7rem" }}>
                  {stat.badge}
                </Typography>
              </Box>
            )}
          </Box>
        </Box>
        <Box sx={{
          width: 44, height: 44, borderRadius: "12px", flexShrink: 0, ml: 1,
          backgroundColor: stat.bg, display: "flex", alignItems: "center", justifyContent: "center",
          color: stat.color,
        }}>
          {stat.icon}
        </Box>
      </Box>
    </Paper>
  );

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", mb: 4 }}>
        <Box>
          <Typography sx={{ fontSize: "1.6rem", fontWeight: 800, letterSpacing: "-0.025em", color: isDark ? "#f5f5f5" : "#111111", lineHeight: 1.2 }}>
            Admin Dashboard
          </Typography>
          <Typography variant="body2" color="text.secondary" mt={0.5}>{dateStr}</Typography>
        </Box>
        <Box display="flex" gap={1} alignItems="center">
          <Button variant="outlined" size="small" startIcon={<FileDownloadIcon sx={{ fontSize: "0.9rem" }} />}
            onClick={handleExport} disabled={!stats}
            sx={{
              textTransform: "none", borderRadius: "10px",
              borderColor: border, color: "text.secondary", fontSize: "0.8rem",
              "&:hover": { borderColor: "#dc2626", color: "#dc2626" },
            }}>
            Export CSV
          </Button>
          <Tooltip title="Refresh data">
            <IconButton onClick={fetchStats} disabled={loading} size="small"
              sx={{ border: `1px solid ${border}`, borderRadius: "10px", width: 34, height: 34 }}>
              {loading ? <CircularProgress size={15} sx={{ color: "#dc2626" }} /> : <RefreshIcon sx={{ fontSize: 18 }} />}
            </IconButton>
          </Tooltip>
        </Box>
      </Box>

      {/* Error */}
      {error && (
        <Paper elevation={0} sx={{ p: 2, mb: 3, borderRadius: "12px", border: "1px solid #fca5a5", bgcolor: "#fff0f0" }}>
          <Typography color="error" fontSize="0.85rem" fontWeight={600}>{error}</Typography>
        </Paper>
      )}

      {/* Stat Cards */}
      <Grid container spacing={2} mb={3}>
        {loading && !stats
          ? Array.from({ length: 4 }).map((_, i) => (
              <Grid item xs={12} sm={6} md={3} key={i}>
                <Paper elevation={0} sx={{ borderRadius: "16px", border: `1px solid ${border}`, bgcolor: cardBg, p: 2.5, height: 110, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <CircularProgress size={22} sx={{ color: "#dc2626" }} />
                </Paper>
              </Grid>
            ))
          : statCards.map((stat, i) => (
              <Grid item xs={12} sm={6} md={3} key={i}>
                <StatCard stat={stat} />
              </Grid>
            ))
        }
      </Grid>

      {/* Charts Row */}
      <Grid container spacing={2} mb={2.5}>
        {/* Blood Type Distribution */}
        <Grid item xs={12} md={7}>
          <Paper elevation={0} sx={{ p: 3, borderRadius: "16px", border: `1px solid ${border}`, bgcolor: cardBg }}>
            <Box sx={{ mb: 2.5 }}>
              <Typography fontWeight={700} fontSize="0.95rem" letterSpacing="-0.01em">Donors by Blood Type</Typography>
              <Typography variant="caption" color="text.secondary">Registered donor distribution</Typography>
            </Box>
            {bloodTypeChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={bloodTypeChartData} barSize={26}>
                  <defs>
                    <linearGradient id="invGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#dc2626" stopOpacity={0.9} />
                      <stop offset="100%" stopColor="#fca5a5" stopOpacity={0.4} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke={isDark ? "#1f1f1f" : "#f0f0f0"} vertical={false} />
                  <XAxis dataKey="type" tick={{ fontSize: 11, fontWeight: 600 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 10 }} axisLine={false} tickLine={false} allowDecimals={false} />
                  <ChartTooltip
                    contentStyle={{ borderRadius: 10, fontSize: 12, border: `1px solid ${border}`, boxShadow: "0 8px 24px rgba(0,0,0,0.12)", backgroundColor: cardBg }}
                    cursor={{ fill: isDark ? "rgba(255,255,255,0.03)" : "rgba(0,0,0,0.02)" }}
                    formatter={(v) => [`${v} donors`, "Count"]}
                  />
                  <Bar dataKey="count" fill="url(#invGrad)" radius={[5, 5, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <Box sx={{ height: 220, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Typography color="text.secondary" fontSize="0.85rem">No donor data yet</Typography>
              </Box>
            )}
          </Paper>
        </Grid>

        {/* Request Status Pie */}
        <Grid item xs={12} md={5}>
          <Paper elevation={0} sx={{ p: 3, borderRadius: "16px", border: `1px solid ${border}`, bgcolor: cardBg }}>
            <Typography fontWeight={700} fontSize="0.95rem" letterSpacing="-0.01em" mb={0.5}>Requests by Status</Typography>
            <Typography variant="caption" color="text.secondary" display="block" mb={2}>Current distribution</Typography>
            {pieData.length > 0 ? (
              <>
                <ResponsiveContainer width="100%" height={175}>
                  <PieChart>
                    <Pie data={pieData} innerRadius={52} outerRadius={80} paddingAngle={3} dataKey="value">
                      {pieData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                    </Pie>
                    <ChartTooltip
                      contentStyle={{ borderRadius: 10, fontSize: 12, border: `1px solid ${border}`, backgroundColor: cardBg }}
                    />
                  </PieChart>
                </ResponsiveContainer>
                <Box sx={{ display: "flex", flexDirection: "column", gap: 0.8, mt: 1 }}>
                  {pieData.map((d, i) => (
                    <Box key={i} sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                      <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                        <Box sx={{ width: 8, height: 8, borderRadius: "50%", bgcolor: d.color }} />
                        <Typography variant="caption" fontWeight={500}>{d.name}</Typography>
                      </Box>
                      <Typography variant="caption" color="text.secondary" fontWeight={700}>
                        {d.value} ({Math.round(d.value / pieTotal * 100)}%)
                      </Typography>
                    </Box>
                  ))}
                </Box>
              </>
            ) : (
              <Box sx={{ height: 220, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Typography color="text.secondary" fontSize="0.85rem">No request data yet</Typography>
              </Box>
            )}
          </Paper>
        </Grid>
      </Grid>

      {/* Bottom Row */}
      <Grid container spacing={2}>
        {/* Recent Blood Requests */}
        <Grid item xs={12} md={7}>
          <Paper elevation={0} sx={{ p: 3, borderRadius: "16px", border: `1px solid ${border}`, bgcolor: cardBg }}>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={2.5}>
              <Box>
                <Typography fontWeight={700} fontSize="0.95rem" letterSpacing="-0.01em">Recent Blood Requests</Typography>
                <Typography variant="caption" color="text.secondary">Latest 5 requests</Typography>
              </Box>
              <Button size="small" endIcon={<ArrowForwardIcon sx={{ fontSize: "0.8rem !important" }} />}
                href="/dashboard/admin/requests"
                sx={{ color: "#dc2626", textTransform: "none", fontWeight: 600, fontSize: "0.78rem", p: 0 }}>
                View all
              </Button>
            </Box>
            {recentRequests.length === 0 && !loading ? (
              <Box sx={{ py: 4, textAlign: "center" }}>
                <PendingActionsIcon sx={{ fontSize: 36, color: "text.disabled", mb: 1 }} />
                <Typography color="text.secondary" fontSize="0.85rem">No requests yet</Typography>
              </Box>
            ) : (
              <Table size="small">
                <TableHead>
                  <TableRow>
                    {["Patient", "Hospital", "Type", "Urgency", "Status", "Date"].map(h => (
                      <TableCell key={h} sx={{
                        color: "text.secondary", fontWeight: 600, fontSize: "0.7rem",
                        borderBottom: `1px solid ${border}`, pb: 1,
                        textTransform: "uppercase", letterSpacing: "0.06em",
                      }}>
                        {h}
                      </TableCell>
                    ))}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {recentRequests.map((req, i) => {
                    const sc = statusColor(req.status);
                    const uc = urgencyColor(req.urgency);
                    return (
                      <TableRow key={req._id || i} sx={{ "&:last-child td": { border: 0 } }}>
                        <TableCell sx={{ fontSize: "0.8rem", fontWeight: 500, maxWidth: 110, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {req.patientName || "—"}
                        </TableCell>
                        <TableCell sx={{ fontSize: "0.78rem", color: "text.secondary", maxWidth: 110, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {req.hospitalName || "—"}
                        </TableCell>
                        <TableCell sx={{ fontSize: "0.82rem", fontWeight: 800, color: "#dc2626" }}>
                          {req.bloodType || "—"}
                        </TableCell>
                        <TableCell>
                          <Box sx={{ display: "inline-block", px: 1, py: 0.3, borderRadius: "6px", bgcolor: uc.bg, color: uc.color, fontSize: "0.68rem", fontWeight: 700 }}>
                            {req.urgency || "Normal"}
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Box sx={{ display: "inline-block", px: 1, py: 0.3, borderRadius: "6px", bgcolor: sc.bg, color: sc.color, fontSize: "0.68rem", fontWeight: 700 }}>
                            {req.status || "Pending"}
                          </Box>
                        </TableCell>
                        <TableCell sx={{ fontSize: "0.73rem", color: "text.secondary" }}>
                          {req.createdAt ? new Date(req.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric" }) : "—"}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </Paper>
        </Grid>

        {/* Recent Donors */}
        <Grid item xs={12} md={5}>
          <Paper elevation={0} sx={{ p: 3, borderRadius: "16px", border: `1px solid ${border}`, bgcolor: cardBg, height: "100%" }}>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={2.5}>
              <Box>
                <Typography fontWeight={700} fontSize="0.95rem" letterSpacing="-0.01em">Recent Donors</Typography>
                <Typography variant="caption" color="text.secondary">Newly registered</Typography>
              </Box>
              <Button size="small" endIcon={<ArrowForwardIcon sx={{ fontSize: "0.8rem !important" }} />}
                href="/dashboard/admin/donors"
                sx={{ color: "#dc2626", textTransform: "none", fontWeight: 600, fontSize: "0.78rem", p: 0 }}>
                View all
              </Button>
            </Box>
            {recentDonors.length === 0 && !loading ? (
              <Box sx={{ py: 4, textAlign: "center" }}>
                <PersonIcon sx={{ fontSize: 36, color: "text.disabled", mb: 1 }} />
                <Typography color="text.secondary" fontSize="0.85rem">No donors registered yet</Typography>
              </Box>
            ) : (
              <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
                {recentDonors.map((donor, i) => (
                  <Box key={donor._id || i} sx={{
                    display: "flex", alignItems: "center", gap: 1.5,
                    p: 1.2, borderRadius: "12px",
                    bgcolor: isDark ? "rgba(255,255,255,0.03)" : "#fafafa",
                    border: `1px solid ${border}`,
                  }}>
                    <Avatar
                      src={donor.photo ? `${API_BASE}${donor.photo}` : undefined}
                      sx={{ width: 38, height: 38, bgcolor: "#dc2626", fontSize: "0.8rem", fontWeight: 700 }}
                    >
                      {!donor.photo && initials(donor.fullName)}
                    </Avatar>
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Typography fontSize="0.82rem" fontWeight={600} noWrap>{donor.fullName || "Unknown"}</Typography>
                      <Typography fontSize="0.72rem" color="text.secondary" noWrap>{donor.location || "No location"}</Typography>
                    </Box>
                    <Box sx={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 0.5, flexShrink: 0 }}>
                      <Box sx={{
                        px: 1, py: 0.2, borderRadius: "5px",
                        bgcolor: isDark ? "rgba(220,38,38,0.15)" : "#fff0f0",
                        color: "#dc2626", fontSize: "0.72rem", fontWeight: 800,
                      }}>
                        {donor.bloodType || "?"}
                      </Box>
                      <Box sx={{
                        px: 1, py: 0.2, borderRadius: "5px", fontSize: "0.65rem", fontWeight: 600,
                        bgcolor: donor.available ? (isDark ? "rgba(34,197,94,0.12)" : "#f0fdf4") : (isDark ? "rgba(156,163,175,0.1)" : "#f5f5f5"),
                        color: donor.available ? "#16a34a" : "#9ca3af",
                      }}>
                        {donor.available ? "Available" : "Unavailable"}
                      </Box>
                    </Box>
                  </Box>
                ))}
              </Box>
            )}
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default Dashboard;
