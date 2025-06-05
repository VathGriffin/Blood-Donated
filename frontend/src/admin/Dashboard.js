import React, { useState } from "react";
import {
  Grid,
  Paper,
  Typography,
  useTheme,
  Box,
  Divider,
  IconButton,
  Button,
  Avatar,
  CircularProgress,
  Tooltip
} from "@mui/material";
import FavoriteIcon from "@mui/icons-material/Favorite";
import BloodtypeIcon from "@mui/icons-material/Bloodtype";
import LocalHospitalIcon from "@mui/icons-material/LocalHospital";
import PendingActionsIcon from "@mui/icons-material/PendingActions";
import RefreshIcon from "@mui/icons-material/Refresh";
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import DashboardIcon from '@mui/icons-material/Dashboard';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip as ChartTooltip
} from 'recharts';

const stats = [
  { title: "Total Donors", value: 130, icon: <FavoriteIcon color="error" /> },
  { title: "Pending Requests", value: 14, icon: <PendingActionsIcon sx={{ color: '#ff9800' }} /> },
  { title: "Units Available", value: 356, icon: <BloodtypeIcon sx={{ color: '#2196f3' }} />, warning: 356 < 100 },
  { title: "Hospitals Linked", value: 12, icon: <LocalHospitalIcon sx={{ color: '#4caf50' }} /> },
];

const bloodData = [
  { bloodType: 'A+', units: 60 },
  { bloodType: 'A-', units: 40 },
  { bloodType: 'B+', units: 80 },
  { bloodType: 'O+', units: 100 },
  { bloodType: 'AB+', units: 30 },
];

const Dashboard = () => {
  const theme = useTheme();
  const [loading, setLoading] = useState(false);

  const handleRefresh = () => {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
    }, 1000);
  };

  const handleExport = () => {
    const csvContent = `Title,Value\n${stats.map(s => `${s.title},${s.value}`).join("\n")}`;
    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "dashboard_report.csv";
    a.click();
  };

  return (
    <Box>
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3 }}>
        <Box display="flex" alignItems="center" gap={1}>
          <Avatar sx={{ bgcolor: 'primary.main' }}>
            <DashboardIcon />
          </Avatar>
          <Typography variant="h4" fontWeight="bold"
            sx={{
              background: "linear-gradient(to right, #b71c1c, #d32f2f)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}
          >
            Dashboard Overview
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button variant="outlined" startIcon={<FileDownloadIcon />} sx={{ textTransform: 'none' }} onClick={handleExport}>
            Export Report
          </Button>
          <IconButton onClick={handleRefresh} disabled={loading} sx={{ transition: '0.3s ease' }}>
            {loading ? <CircularProgress size={24} /> : <RefreshIcon sx={{ '&:hover': { rotate: '90deg' } }} color="primary" />}
          </IconButton>
        </Box>
      </Box>

      <Divider sx={{ mb: 3 }} />

      <Grid container spacing={3}>
        {stats.map((stat, index) => (
          <Grid item xs={12} sm={6} md={3} key={index}>
            <Paper elevation={6} sx={{
              p: 3,
              borderRadius: 4,
              textAlign: "center",
              transition: "all 0.3s ease",
              bgcolor: theme.palette.mode === "dark" ? "#1e1e1e" : "#fff3f3",
              boxShadow: 3,
              '&:hover': {
                transform: 'scale(1.03)',
                boxShadow: 8,
              },
            }}>
              <Box display="flex" justifyContent="center" mb={1}>
                <Tooltip title={stat.title}>
                  {stat.icon}
                </Tooltip>
              </Box>
              <Typography variant="subtitle1" fontWeight="medium" color="text.secondary" gutterBottom>
                {stat.title}
              </Typography>
              <Typography variant="h3" fontWeight="bold" color={theme.palette.mode === 'dark' ? 'error.light' : 'primary'} sx={{ textShadow: '1px 1px 2px rgba(0,0,0,0.1)' }}>
                {stat.value.toLocaleString()}
              </Typography>
              {stat.warning && (
                <Typography color="error" variant="caption">⚠️ Low stock</Typography>
              )}
            </Paper>
          </Grid>
        ))}
      </Grid>

      <Box mt={6}>
        <Typography variant="h6" fontWeight="bold" gutterBottom>
          Blood Units by Blood Type
        </Typography>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={bloodData}>
            <defs>
              <linearGradient id="colorUv" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#ef5350" stopOpacity={0.9} />
                <stop offset="100%" stopColor="#ffcdd2" stopOpacity={0.6} />
              </linearGradient>
            </defs>
            <XAxis dataKey="bloodType" />
            <YAxis />
            <ChartTooltip />
            <Bar dataKey="units" fill="url(#colorUv)" radius={[8, 8, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </Box>
    </Box>
  );
};

export default Dashboard;
