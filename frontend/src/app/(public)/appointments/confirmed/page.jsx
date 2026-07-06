'use client';
import Link from 'next/link';
import React, { useEffect, useState } from "react";
import {
  Box,
  Container,
  Typography,
  Button,
  Paper,
  useTheme,
} from "@mui/material";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import CalendarMonthIcon from "@mui/icons-material/CalendarMonth";
import HomeIcon from "@mui/icons-material/Home";

const steps = [
  "You will receive a confirmation email with your appointment details.",
  "Arrive 10 minutes early and bring a valid ID on the day.",
  "Drink plenty of water and have a light meal before donating.",
];

const AppointmentConfirmed = () => {
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 100);
    return () => clearTimeout(t);
  }, []);

  return (
    <Box
      sx={{
        minHeight: "100vh",
        backgroundColor: isDark ? "#121212" : "#f9f9f9",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        py: 8,
        px: 2,
      }}
    >
      <Container maxWidth="sm">
        <Paper
          elevation={6}
          sx={{
            borderRadius: 5,
            overflow: "hidden",
            transform: visible ? "translateY(0)" : "translateY(40px)",
            opacity: visible ? 1 : 0,
            transition: "all 0.6s cubic-bezier(0.34, 1.56, 0.64, 1)",
          }}
        >
          {/* Top banner */}
          <Box
            sx={{
              background: isDark
                ? "linear-gradient(135deg, #1a0000 0%, #2d0505 100%)"
                : "linear-gradient(135deg, #b71c1c 0%, #7f0000 100%)",
              py: 5,
              textAlign: "center",
            }}
          >
            <Box
              sx={{
                width: 90,
                height: 90,
                borderRadius: "50%",
                backgroundColor: "rgba(255,255,255,0.15)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                mx: "auto",
                mb: 2,
                animation: "popIn 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) 0.3s both",
                "@keyframes popIn": {
                  from: { transform: "scale(0)", opacity: 0 },
                  to: { transform: "scale(1)", opacity: 1 },
                },
              }}
            >
              <CheckCircleIcon sx={{ fontSize: 56, color: "white" }} />
            </Box>
            <Typography variant="h4" fontWeight={800} color="white" gutterBottom>
              Appointment Booked!
            </Typography>
            <Typography
              variant="body1"
              sx={{ color: "rgba(255,255,255,0.85)", maxWidth: 360, mx: "auto", lineHeight: 1.6 }}
            >
              Thank you for scheduling your blood donation. You're helping save lives!
            </Typography>
          </Box>

          {/* Body */}
          <Box sx={{ p: { xs: 3, sm: 5 } }}>
            <Typography variant="subtitle1" fontWeight={700} color="error.main" sx={{ mb: 2 }}>
              What to expect next
            </Typography>

            <Box sx={{ display: "flex", flexDirection: "column", gap: 2, mb: 4 }}>
              {steps.map((step, i) => (
                <Box
                  key={i}
                  sx={{
                    display: "flex",
                    alignItems: "flex-start",
                    gap: 2,
                    opacity: visible ? 1 : 0,
                    transform: visible ? "translateX(0)" : "translateX(-20px)",
                    transition: `all 0.5s ease ${0.4 + i * 0.12}s`,
                  }}
                >
                  <Box
                    sx={{
                      minWidth: 28,
                      height: 28,
                      borderRadius: "50%",
                      bgcolor: "#b71c1c",
                      color: "white",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: "0.8rem",
                      fontWeight: 700,
                      flexShrink: 0,
                    }}
                  >
                    {i + 1}
                  </Box>
                  <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.7, pt: 0.4 }}>
                    {step}
                  </Typography>
                </Box>
              ))}
            </Box>

            <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap" }}>
              <Button
                variant="contained"
                color="error"
                size="large"
                component={Link}
                href="/appointments"
                startIcon={<CalendarMonthIcon />}
                sx={{
                  flex: 1,
                  fontWeight: 700,
                  borderRadius: 3,
                  py: 1.3,
                  boxShadow: "0 4px 14px rgba(183,28,28,0.35)",
                  "&:hover": { boxShadow: "0 6px 20px rgba(183,28,28,0.5)" },
                }}
              >
                Book Another
              </Button>
              <Button
                variant="outlined"
                color="error"
                size="large"
                component={Link}
                href="/"
                startIcon={<HomeIcon />}
                sx={{ flex: 1, fontWeight: 700, borderRadius: 3, py: 1.3 }}
              >
                Go Home
              </Button>
            </Box>
          </Box>
        </Paper>
      </Container>
    </Box>
  );
};

export default AppointmentConfirmed;
