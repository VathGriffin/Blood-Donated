'use client';
import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Box, Button, Typography, useTheme, Slide } from "@mui/material";
import CookieIcon from "@mui/icons-material/Cookie";

export default function CookieConsent() {
  const theme  = useTheme();
  const isDark = theme.palette.mode === "dark";
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem("cookie_consent");
    if (!consent) {
      const t = setTimeout(() => setVisible(true), 1200);
      return () => clearTimeout(t);
    }
  }, []);

  const accept = () => {
    localStorage.setItem("cookie_consent", "accepted");
    setVisible(false);
  };

  const decline = () => {
    localStorage.setItem("cookie_consent", "declined");
    setVisible(false);
  };

  return (
    <Slide direction="up" in={visible} mountOnEnter unmountOnExit>
      <Box sx={{
        position: "fixed", bottom: { xs: 0, sm: 24 }, left: { xs: 0, sm: 24 },
        right: { xs: 0, sm: "auto" },
        zIndex: 9999,
        maxWidth: { sm: 420 },
        bgcolor: isDark ? "#111111" : "#ffffff",
        border: `1px solid ${isDark ? "#2a2a2a" : "#e5e5e5"}`,
        borderRadius: { xs: "16px 16px 0 0", sm: "16px" },
        boxShadow: isDark
          ? "0 -4px 40px rgba(0,0,0,0.6)"
          : "0 8px 40px rgba(0,0,0,0.14)",
        p: { xs: 2.5, sm: 3 },
        display: "flex", flexDirection: "column", gap: 2,
      }}>
        <Box display="flex" gap={1.5} alignItems="flex-start">
          <Box sx={{
            width: 36, height: 36, borderRadius: "10px", flexShrink: 0,
            bgcolor: isDark ? "rgba(220,38,38,0.12)" : "#fff1f2",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <CookieIcon sx={{ fontSize: 18, color: "#dc2626" }} />
          </Box>
          <Box>
            <Typography fontWeight={700} fontSize="0.9rem" sx={{ color: isDark ? "#f5f5f5" : "#111", mb: 0.5 }}>
              We use cookies
            </Typography>
            <Typography variant="caption" color="text.secondary" lineHeight={1.7}>
              We use essential cookies for authentication and security. No tracking or advertising cookies.{" "}
              <Link href="/privacy" style={{ color: "#dc2626", fontWeight: 600, textDecoration: "none" }}>
                Privacy Policy
              </Link>
            </Typography>
          </Box>
        </Box>

        <Box display="flex" gap={1}>
          <Button fullWidth variant="contained" size="small" onClick={accept}
            sx={{
              bgcolor: "#dc2626", fontWeight: 700, borderRadius: "8px",
              textTransform: "none", fontSize: "0.82rem",
              "&:hover": { bgcolor: "#b91c1c" },
            }}>
            Accept
          </Button>
          <Button fullWidth variant="outlined" size="small" onClick={decline}
            sx={{
              borderColor: isDark ? "#2a2a2a" : "#e0e0e0",
              color: isDark ? "#aaa" : "#666",
              fontWeight: 600, borderRadius: "8px",
              textTransform: "none", fontSize: "0.82rem",
              "&:hover": { borderColor: "#dc2626", color: "#dc2626" },
            }}>
            Decline
          </Button>
        </Box>
      </Box>
    </Slide>
  );
}
