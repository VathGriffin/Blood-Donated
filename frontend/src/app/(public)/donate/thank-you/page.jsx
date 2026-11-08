'use client';
import Link from 'next/link';
import { useEffect, useState } from "react";
import { Box, Container, Typography, Button, Paper, useTheme } from "@mui/material";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import VolunteerActivismIcon from "@mui/icons-material/VolunteerActivism";
import GroupIcon from "@mui/icons-material/Group";
import HistoryIcon from "@mui/icons-material/History";
import { useUserAuth } from "@/store/UserAuthContext";
import { useT } from "@/i18n/I18nProvider";

// donate.thanks.steps.<key> in i18n/messages/donate.js
const steps = ["review", "confirm", "ready"];

const ThankYou = () => {
  const { isAuth } = useUserAuth();
  const t = useT();
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
        backgroundColor: isDark ? "#0B1220" : "#F6F8FC",
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
                ? "linear-gradient(160deg, #0F2038 0%, #0B1220 100%)"
                : "linear-gradient(120deg, #102541 0%, #173B63 55%, #245481 100%)",
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
              {t("donate.thanks.title")}
            </Typography>
            <Typography
              variant="body1"
              sx={{ color: "rgba(255,255,255,0.85)", maxWidth: 360, mx: "auto", lineHeight: 1.6 }}
            >
              {t("donate.thanks.lead")}
            </Typography>
          </Box>

          {/* Body */}
          <Box sx={{ p: { xs: 3, sm: 5 } }}>
            <Typography
              variant="subtitle1"
              fontWeight={700}
              color="primary.main"
              gutterBottom
              sx={{ mb: 2 }}
            >
              {t("donate.thanks.nextTitle")}
            </Typography>

            <Box sx={{ display: "flex", flexDirection: "column", gap: 2, mb: 4 }}>
              {steps.map((step, i) => (
                <Box
                  key={step}
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
                      backgroundColor: "primary.main",
                      bgcolor: "#A91529",
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
                    {t(`donate.thanks.steps.${step}`)}
                  </Typography>
                </Box>
              ))}
            </Box>

            <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap" }}>
              <Button
                variant="contained"
                color="primary"
                size="large"
                component={Link}
                href="/donors"
                startIcon={<GroupIcon />}
                sx={{
                  flex: 1,
                  fontWeight: 700,
                  borderRadius: 3,
                  py: 1.3,
                  boxShadow: "0 4px 14px rgba(201,29,50,0.35)",
                  "&:hover": { boxShadow: "0 6px 20px rgba(201,29,50,0.5)" },
                }}
              >
                {t("donate.thanks.viewDonors")}
              </Button>
              <Button
                variant="outlined"
                color="primary"
                size="large"
                component={Link}
                href="/donate"
                startIcon={<VolunteerActivismIcon />}
                sx={{ flex: 1, fontWeight: 700, borderRadius: 3, py: 1.3 }}
              >
                {t("donate.thanks.another")}
              </Button>
            </Box>

            {isAuth && (
              <Button fullWidth variant="text" color="primary" component={Link} href="/profile?tab=history"
                startIcon={<HistoryIcon />} sx={{ mt: 2, fontWeight: 700 }}>
                {t("donate.thanks.inProfile")}
              </Button>
            )}
            <Button
              fullWidth
              component={Link}
              href="/"
              sx={{ mt: 2, color: "text.secondary", fontWeight: 500 }}
            >
              {t("donate.thanks.home")}
            </Button>
          </Box>
        </Paper>
      </Container>
    </Box>
  );
};

export default ThankYou;
