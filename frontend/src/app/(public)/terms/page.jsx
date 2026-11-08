'use client';
import { Box, Container, Typography, useTheme, Paper, Divider, Chip } from "@mui/material";
import GavelIcon from "@mui/icons-material/Gavel";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";
import { useI18n } from "@/i18n/I18nProvider";
import LEGAL from "@/i18n/messages/legal";

// The sections and list items, in order (their text: legal.terms.sections.* in i18n/messages/legal.js).
const SECTIONS = LEGAL.en.terms.sections;
const keysOf = (obj) => Object.keys(obj || {});
const EMAIL = "support@bloodlife.kh";

function Section({ title, children, isDark, border, card }) {
  return (
    <Paper elevation={0} sx={{ p: { xs: 3, md: 4 }, borderRadius: "20px", mb: 3, border: `1px solid ${border}`, bgcolor: card }}>
      <Typography fontWeight={800} fontSize="1.05rem" letterSpacing="-0.01em" mb={1.5}
        sx={{ color: isDark ? "#F8FAFC" : "#172B4D" }}>
        {title}
      </Typography>
      <Divider sx={{ mb: 2.5, borderColor: isDark ? "#334155" : "#E2E8F0" }} />
      {children}
    </Paper>
  );
}

function Bullet({ children, warn }) {
  return (
    <Box display="flex" gap={1.5} mb={1.2}>
      {warn
        ? <WarningAmberIcon sx={{ fontSize: 16, color: "#F59E0B", mt: 0.3, flexShrink: 0 }} />
        : <CheckCircleIcon  sx={{ fontSize: 16, color: "#C91D32", mt: 0.3, flexShrink: 0 }} />}
      <Typography variant="body2" color="text.secondary" lineHeight={1.8}>{children}</Typography>
    </Box>
  );
}

export default function Terms() {
  const { t, rich } = useI18n();
  const theme  = useTheme();
  const isDark = theme.palette.mode === "dark";
  const bg     = isDark ? "#0B1220" : "#F6F8FC";
  const card   = isDark ? "#17263D" : "#ffffff";
  const border = isDark ? "#334155" : "#E2E8F0";
  const email = (
    <Box component="a" href={`mailto:${EMAIL}`} sx={{ color: "#C91D32", textDecoration: "none", fontWeight: 700 }}>
      {EMAIL}
    </Box>
  );

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
            <GavelIcon sx={{ color: "white", fontSize: 30 }} />
          </Box>
          <Typography component="h1" fontWeight={900} fontSize={{ xs: "2rem", md: "2.6rem" }}
            letterSpacing="-0.03em" sx={{ color: isDark ? "#F8FAFC" : "#172B4D", mb: 1.5 }}>
            {t("legal.terms.title")}
          </Typography>
          <Typography color="text.secondary" lineHeight={1.7} maxWidth={520} mx="auto">
            {t("legal.terms.lead")}
          </Typography>
          <Chip label={t("legal.terms.effective")} size="small" sx={{ mt: 2,
            bgcolor: isDark ? "rgba(201,29,50,0.12)" : "#fff1f2", color: "#C91D32", fontWeight: 600 }} />
        </Box>

        {Object.entries(SECTIONS).map(([id, sec]) => {
          const k = `legal.terms.sections.${id}`;
          const hasList = !!(sec.items || sec.warnings);
          return (
            <Section key={id} title={t(`${k}.title`)} isDark={isDark} border={border} card={card}>
              {sec.notice && (
                <Box sx={{
                  p: 2, borderRadius: "10px", mb: 2,
                  bgcolor: isDark ? "rgba(217,119,6,0.1)" : "#fffbeb",
                  border: `1px solid ${isDark ? "rgba(217,119,6,0.25)" : "#fde68a"}`,
                }}>
                  <Typography variant="body2" fontWeight={700} sx={{ color: "#B45309" }}>{t(`${k}.notice`)}</Typography>
                </Box>
              )}
              {sec.text && (
                <Typography variant="body2" color="text.secondary" mb={hasList ? 2 : 0} lineHeight={1.8}>{t(`${k}.text`)}</Typography>
              )}
              {keysOf(sec.items).map((i) => <Bullet key={i}>{t(`${k}.items.${i}`)}</Bullet>)}
              {keysOf(sec.warnings).map((i) => <Bullet key={`w${i}`} warn>{t(`${k}.warnings.${i}`)}</Bullet>)}
              {sec.after && (
                <Typography variant="body2" color="text.secondary" mt={2} lineHeight={1.8}>{t(`${k}.after`)}</Typography>
              )}
            </Section>
          );
        })}

        <Paper elevation={0} sx={{
          p: 3, borderRadius: "16px", textAlign: "center",
          border: `1px solid ${isDark ? "rgba(201,29,50,0.2)" : "#fecaca"}`,
          bgcolor: isDark ? "rgba(201,29,50,0.06)" : "#FFF1F2",
        }}>
          <Typography variant="body2" color="text.secondary" lineHeight={1.8}>
            {rich("legal.terms.questions", { email })}
          </Typography>
        </Paper>

      </Container>
    </Box>
  );
}
