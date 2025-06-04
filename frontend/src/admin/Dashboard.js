import React from "react";
import { Grid, Paper, Typography, useTheme, Box } from "@mui/material";
import FavoriteIcon from "@mui/icons-material/Favorite";
import BloodtypeIcon from "@mui/icons-material/Bloodtype";
import LocalHospitalIcon from "@mui/icons-material/LocalHospital";
import PendingActionsIcon from "@mui/icons-material/PendingActions";

const stats = [
  { title: "Total Donors", value: 130, icon: <FavoriteIcon color="error" /> },
  {
    title: "Pending Requests",
    value: 14,
    icon: <PendingActionsIcon color="warning" />,
  },
  {
    title: "Units Available",
    value: 356,
    icon: <BloodtypeIcon color="primary" />,
  },
  {
    title: "Hospitals Linked",
    value: 12,
    icon: <LocalHospitalIcon color="success" />,
  },
];

const Dashboard = () => {
  const theme = useTheme();

  return (
    <Grid container spacing={3}>
      {stats.map((stat, index) => (
        <Grid item xs={12} sm={6} md={3} key={index}>
          <Paper
            elevation={4}
            sx={{
              p: 3,
              borderRadius: 3,
              textAlign: "center",
              transition: "all 0.3s ease",
              bgcolor:
                theme.palette.mode === "dark"
                  ? "grey.900"
                  : "linear-gradient(135deg, #fff3f3 0%, #ffeaea 100%)",
              "&:hover": {
                transform: "translateY(-4px)",
                boxShadow: 6,
              },
            }}
          >
            <Box display="flex" justifyContent="center" mb={1}>
              {stat.icon}
            </Box>
            <Typography
              variant="subtitle2"
              fontWeight="bold"
              color="text.secondary"
              gutterBottom
            >
              {stat.title}
            </Typography>
            <Typography variant="h4" fontWeight="bold" color="primary">
              {stat.value}
            </Typography>
          </Paper>
        </Grid>
      ))}
    </Grid>
  );
};

export default Dashboard;
