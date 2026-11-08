'use client';
import React from "react";
import { Box, Container, Typography, useTheme, Paper, Divider, Chip } from "@mui/material";
import ShieldIcon from "@mui/icons-material/Shield";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import LockIcon from "@mui/icons-material/Lock";
import PersonIcon from "@mui/icons-material/Person";
import StorageIcon from "@mui/icons-material/Storage";
import ShareIcon from "@mui/icons-material/Share";
import DeleteIcon from "@mui/icons-material/Delete";
import EmailIcon from "@mui/icons-material/Email";
import { useI18n } from "@/i18n/I18nProvider";
import LEGAL from "@/i18n/messages/legal";

// Section ids and icons, in order; their text is legal.privacy.<id> in i18n/messages/legal.js.
const SECTIONS = [
  { id: "collect",  icon: <StorageIcon /> },
  { id: "use",      icon: <PersonIcon /> },
  { id: "share",    icon: <ShareIcon /> },
  { id: "security", icon: <LockIcon /> },
  { id: "rights",   icon: <ShieldIcon /> },
  { id: "retention",icon: <DeleteIcon /> },
  { id: "contact",  icon: <EmailIcon /> },
];
const P = LEGAL.en.privacy;
const EMAIL = "support@bloodlife.kh";

function Section({ id, icon, title, children, isDark, border, card }) {
  return (
    <Paper id={id} elevation={0} sx={{
      p: { xs: 3, md: 4 }, borderRadius: "20px", mb: 3,
      border: `1px solid ${border}`, bgcolor: card,
    }}>
      <Box display="flex" alignItems="center" gap={1.5} mb={2.5}>
        <Box sx={{
          width: 42, height: 42, borderRadius: "12px", flexShrink: 0,
          bgcolor: isDark ? "rgba(201,29,50,0.12)" : "#fff1f2",
          display: "flex", alignItems: "center", justifyContent: "center",
          color: "#C91D32",
        }}>
          {React.cloneElement(icon, { sx: { fontSize: 20, color: "#C91D32" } })}
        </Box>
        <Typography fontWeight={800} fontSize="1.05rem" letterSpacing="-0.01em"
          sx={{ color: isDark ? "#F8FAFC" : "#172B4D" }}>
          {title}
        </Typography>
      </Box>
      <Divider sx={{ mb: 2.5, borderColor: isDark ? "#334155" : "#E2E8F0" }} />
      {children}
    </Paper>
  );
}

function Bullet({ children }) {
  return (
    <Box display="flex" gap={1.5} mb={1}>
      <CheckCircleIcon sx={{ fontSize: 16, color: "#C91D32", mt: 0.3, flexShrink: 0 }} />
      <Typography variant="body2" color="text.secondary" lineHeight={1.8}>{children}</Typography>
    </Box>
  );
}

export default function PrivacyPolicy() {
  const { t, rich } = useI18n();
  const theme  = useTheme();
  const isDark = theme.palette.mode === "dark";
  const bg     = isDark ? "#0B1220" : "#F6F8FC";
  const card   = isDark ? "#17263D" : "#ffffff";
  const border = isDark ? "#334155" : "#E2E8F0";
  const heading = isDark ? "#F8FAFC" : "#172B4D";
  const email = (
    <Box component="a" href={`mailto:${EMAIL}`} sx={{ color: "#C91D32", textDecoration: "none", fontWeight: 600 }}>
      {EMAIL}
    </Box>
  );
  const section = (id) => ({ id, icon: SECTIONS.find((s) => s.id === id).icon, title: t(`legal.privacy.${id}.title`), isDark, border, card });
  const intro = (id) => (
    <Typography variant="body2" color="text.secondary" mb={2} lineHeight={1.8}>{t(`legal.privacy.${id}.intro`)}</Typography>
  );
  const bullets = (path, items) => Object.keys(items).map((k) => <Bullet key={k}>{t(`legal.privacy.${path}.${k}`)}</Bullet>);

  return (
    <Box sx={{ bgcolor: bg, minHeight: "100vh", pt: { xs: 10, md: 12 }, pb: 10 }}>
      <Container maxWidth="md">

        {/* Header */}
        <Box textAlign="center" mb={6}>
          <Box sx={{
            width: 64, height: 64, borderRadius: "18px", mx: "auto", mb: 3,
            background: "linear-gradient(135deg, #E63946 0%, #C91D32 100%)",
            display: "flex", alignItems: "center", justifyContent: "center",
            boxShadow: "0 8px 24px rgba(201,29,50,0.35)",
          }}>
            <ShieldIcon sx={{ color: "white", fontSize: 30 }} />
          </Box>
          <Typography component="h1" fontWeight={900} fontSize={{ xs: "2rem", md: "2.6rem" }}
            letterSpacing="-0.03em" sx={{ color: heading, mb: 1.5 }}>
            {t("legal.privacy.title")}
          </Typography>
          <Typography color="text.secondary" lineHeight={1.7} maxWidth={520} mx="auto">
            {t("legal.privacy.lead")}
          </Typography>
          <Box display="flex" gap={1.5} justifyContent="center" flexWrap="wrap" mt={2.5}>
            <Chip label={t("legal.privacy.updated")} size="small"
              sx={{ bgcolor: isDark ? "rgba(201,29,50,0.12)" : "#fff1f2", color: "#C91D32", fontWeight: 600 }} />
            <Chip label={t("legal.privacy.gdpr")} size="small" icon={<CheckCircleIcon sx={{ fontSize: "14px !important", color: "#16a34a !important" }} />}
              sx={{ bgcolor: isDark ? "rgba(22,163,74,0.1)" : "#f0fdf4", color: "#16a34a", fontWeight: 600 }} />
          </Box>
        </Box>

        {/* Quick nav */}
        <Paper elevation={0} sx={{ p: 2.5, borderRadius: "16px", border: `1px solid ${border}`, bgcolor: card, mb: 4 }}>
          <Typography fontWeight={700} fontSize="0.82rem" color="text.secondary" mb={1.5}
            sx={{ textTransform: "uppercase", letterSpacing: "0.06em" }}>{t("legal.privacy.contents")}</Typography>
          <Box display="flex" flexWrap="wrap" gap={1}>
            {SECTIONS.map(s => (
              <Chip key={s.id} label={t(`legal.privacy.${s.id}.title`)} size="small" clickable
                onClick={() => document.getElementById(s.id)?.scrollIntoView({ behavior: "smooth", block: "start" })}
                sx={{ fontSize: "0.78rem", fontWeight: 600,
                  bgcolor: isDark ? "#1C2E49" : "#F1F5F9",
                  "&:hover": { bgcolor: isDark ? "rgba(201,29,50,0.12)" : "#fff1f2", color: "#C91D32" } }} />
            ))}
          </Box>
        </Paper>

        <Section {...section("collect")}>
          {intro("collect")}
          <Typography fontWeight={700} fontSize="0.88rem" mb={1} sx={{ color: heading }}>{t("legal.privacy.collect.personalTitle")}</Typography>
          {bullets("collect.personal", P.collect.personal)}
          <Typography fontWeight={700} fontSize="0.88rem" mb={1} mt={2.5} sx={{ color: heading }}>{t("legal.privacy.collect.technicalTitle")}</Typography>
          {bullets("collect.technical", P.collect.technical)}
        </Section>

        <Section {...section("use")}>
          {intro("use")}
          {bullets("use.items", P.use.items)}
          <Box sx={{
            mt: 2.5, p: 2, borderRadius: "10px",
            bgcolor: isDark ? "rgba(201,29,50,0.06)" : "#FFF1F2",
            border: `1px solid ${isDark ? "rgba(201,29,50,0.2)" : "#fecaca"}`,
          }}>
            <Typography variant="body2" fontWeight={600} color="error.main">{t("legal.privacy.use.never")}</Typography>
          </Box>
        </Section>

        <Section {...section("share")}>
          {intro("share")}
          {Object.keys(P.share.items).map((k) => (
            <Bullet key={k}><strong>{t(`legal.privacy.share.items.${k}.label`)}</strong> {t(`legal.privacy.share.items.${k}.text`)}</Bullet>
          ))}
        </Section>

        <Section {...section("security")}>
          {intro("security")}
          {bullets("security.items", P.security.items)}
        </Section>

        <Section {...section("rights")}>
          {intro("rights")}
          {Object.keys(P.rights.items).map((k) => (
            <Box key={k} sx={{
              display: "flex", gap: 1.5, mb: 1.5, p: 1.5, borderRadius: "10px",
              bgcolor: isDark ? "#1C2E49" : "#F8FAFC",
              border: `1px solid ${border}`,
            }}>
              <CheckCircleIcon sx={{ fontSize: 16, color: "#C91D32", mt: 0.3, flexShrink: 0 }} />
              <Box>
                <Typography fontWeight={700} fontSize="0.85rem" sx={{ color: heading }}>{t(`legal.privacy.rights.items.${k}.label`)}</Typography>
                <Typography variant="caption" color="text.secondary" lineHeight={1.6}>{t(`legal.privacy.rights.items.${k}.text`)}</Typography>
              </Box>
            </Box>
          ))}
          <Typography variant="body2" color="text.secondary" mt={2} lineHeight={1.8}>
            {rich("legal.privacy.rights.exercise", { email })}
          </Typography>
        </Section>

        <Section {...section("retention")}>
          {bullets("retention.items", P.retention.items)}
        </Section>

        <Section {...section("contact")}>
          {intro("contact")}
          <Box sx={{ p: 2.5, borderRadius: "12px", bgcolor: isDark ? "#1C2E49" : "#F8FAFC", border: `1px solid ${border}` }}>
            <Typography fontWeight={700} fontSize="0.9rem" mb={1} sx={{ color: heading }}>{t("legal.privacy.contact.controller")}</Typography>
            <Typography variant="body2" color="text.secondary" lineHeight={2}>
              {t("legal.privacy.contact.org")}<br />
              {t("legal.privacy.contact.city")}<br />
              {rich("legal.privacy.contact.email", { email })}
            </Typography>
          </Box>
        </Section>

      </Container>
    </Box>
  );
}
