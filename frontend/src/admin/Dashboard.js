import React from "react";
import {
  Grid,
  Paper,
  Typography,
  useTheme,
  Box,
  Divider,
  IconButton,
  Button,
  Avatar
} from "@mui/material";
import FavoriteIcon from "@mui/icons-material/Favorite";
import BloodtypeIcon from "@mui/icons-material/Bloodtype";
import LocalHospitalIcon from "@mui/icons-material/LocalHospital";
import PendingActionsIcon from "@mui/icons-material/PendingActions";
import RefreshIcon from "@mui/icons-material/Refresh";
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import DashboardIcon from '@mui/icons-material/Dashboard';

const stats = [
  { title: "Total Donors", value: 130, icon: <FavoriteIcon color="error" /> },
  {
    title: "Pending Requests",
    value: 14,
    icon: <PendingActionsIcon sx={{ color: '#ff9800' }} />,
  },
  {
    title: "Units Available",
    value: 356,
    icon: <BloodtypeIcon sx={{ color: '#2196f3' }} />,
  },
  {
    title: "Hospitals Linked",
    value: 12,
    icon: <LocalHospitalIcon sx={{ color: '#4caf50' }} />,
  },
];

const Dashboard = () => {
  const theme = useTheme();

  return (
    <Box>
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mb: 3,
        }}
      >
        <Box display="flex" alignItems="center" gap={1}>
          <Avatar sx={{ bgcolor: 'primary.main' }}>
            <DashboardIcon />
          </Avatar>
          <Typography
            variant="h4"
            fontWeight="bold"
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
          <Button
            variant="outlined"
            startIcon={<FileDownloadIcon />}
            sx={{ textTransform: 'none' }}
          >
            Export Report
          </Button>
          <IconButton>
            <RefreshIcon color="primary" />
          </IconButton>
        </Box>
      </Box>

      <Divider sx={{ mb: 3 }} />

      <Grid container spacing={3}>
        {stats.map((stat, index) => (
          <Grid item xs={12} sm={6} md={3} key={index}>
            <Paper
              elevation={6}
              sx={{
                p: 3,
                borderRadius: 4,
                textAlign: "center",
                transition: "all 0.3s ease",
                bgcolor:
                  theme.palette.mode === "dark"
                    ? "#1e1e1e"
                    : "#ffffff",
                boxShadow: theme.palette.mode === 'dark' ? 3 : 4,
                '&:hover': {
                  transform: 'translateY(-5px)',
                  boxShadow: 8,
                },
              }}
            >
              <Box display="flex" justifyContent="center" mb={1}>
                {stat.icon}
              </Box>
              <Typography
                variant="subtitle1"
                fontWeight="medium"
                color="text.secondary"
                gutterBottom
              >
                {stat.title}
              </Typography>
              <Typography
                variant="h3"
                fontWeight="bold"
                color="primary"
              >
                {stat.value}
              </Typography>
            </Paper>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
};

export default Dashboard;