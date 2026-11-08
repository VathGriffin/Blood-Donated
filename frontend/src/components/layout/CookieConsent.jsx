'use client';
import { useState, useEffect } from "react";
import Link from "next/link";
import { Box, Button, Typography, useTheme, Slide } from "@mui/material";
import CookieIcon from "@mui/icons-material/Cookie";
import { useT } from "@/i18n/I18nProvider";

export default function CookieConsent() {
  const theme  = useTheme();
  const isDark = theme.palette.mode === "dark";
  const [visible, setVisible] = useState(false);
  const t = useT();

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
        bgcolor: isDark ? "#17263D" : "#ffffff",
        border: `1px solid ${isDark ? "#334155" : "#E2E8F0"}`,
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
            bgcolor: isDark ? "rgba(201,29,50,0.12)" : "#fff1f2",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <CookieIcon sx={{ fontSize: 18, color: "#C91D32" }} />
          </Box>
          <Box>
            <Typography fontWeight={700} fontSize="0.9rem" sx={{ color: isDark ? "#F8FAFC" : "#172B4D", mb: 0.5 }}>
              {t("layout.cookie.title")}
            </Typography>
            <Typography variant="caption" color="text.secondary" lineHeight={1.7}>
              {t("layout.cookie.body")}{" "}
              <Link href="/privacy" style={{ color: "#C91D32", fontWeight: 600, textDecoration: "none" }}>
                {t("layout.cookie.privacy")}
              </Link>
            </Typography>
          </Box>
        </Box>

        <Box display="flex" gap={1}>
          <Button fullWidth variant="contained" size="small" onClick={accept}
            sx={{
              bgcolor: "#C91D32", fontWeight: 700, borderRadius: "8px",
              textTransform: "none", fontSize: "0.82rem",
              "&:hover": { bgcolor: "#A91529" },
            }}>
            {t("layout.cookie.accept")}
          </Button>
          <Button fullWidth variant="outlined" size="small" onClick={decline}
            sx={{
              borderColor: isDark ? "#334155" : "#E2E8F0",
              color: isDark ? "#94A3B8" : "#64748B",
              fontWeight: 600, borderRadius: "8px",
              textTransform: "none", fontSize: "0.82rem",
              "&:hover": { borderColor: "#C91D32", color: "#C91D32" },
            }}>
            {t("layout.cookie.decline")}
          </Button>
        </Box>
      </Box>
    </Slide>
  );
}
