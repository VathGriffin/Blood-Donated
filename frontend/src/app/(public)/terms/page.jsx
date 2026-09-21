'use client';
import { Box, Container, Typography, useTheme, Paper, Divider, Chip } from "@mui/material";
import GavelIcon from "@mui/icons-material/Gavel";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";

function Section({ title, children, isDark, border, card }) {
  return (
    <Paper elevation={0} sx={{ p: { xs: 3, md: 4 }, borderRadius: "20px", mb: 3, border: `1px solid ${border}`, bgcolor: card }}>
      <Typography fontWeight={800} fontSize="1.05rem" letterSpacing="-0.01em" mb={1.5}
        sx={{ color: isDark ? "#f5f5f5" : "#111" }}>
        {title}
      </Typography>
      <Divider sx={{ mb: 2.5, borderColor: isDark ? "#1f1f1f" : "#f0f0f0" }} />
      {children}
    </Paper>
  );
}

function Bullet({ children, warn }) {
  return (
    <Box display="flex" gap={1.5} mb={1.2}>
      {warn
        ? <WarningAmberIcon sx={{ fontSize: 16, color: "#d97706", mt: 0.3, flexShrink: 0 }} />
        : <CheckCircleIcon  sx={{ fontSize: 16, color: "#dc2626", mt: 0.3, flexShrink: 0 }} />}
      <Typography variant="body2" color="text.secondary" lineHeight={1.8}>{children}</Typography>
    </Box>
  );
}

export default function Terms() {
  const theme  = useTheme();
  const isDark = theme.palette.mode === "dark";
  const bg     = isDark ? "#0a0a0a" : "#f8f8f8";
  const card   = isDark ? "#111111" : "#ffffff";
  const border = isDark ? "#1f1f1f" : "#e5e5e5";

  return (
    <Box sx={{ bgcolor: bg, minHeight: "100vh", pt: { xs: 10, md: 12 }, pb: 10 }}>
      <Container maxWidth="md">

        {/* Header */}
        <Box textAlign="center" mb={6}>
          <Box sx={{
            width: 64, height: 64, borderRadius: "18px", mx: "auto", mb: 3,
            background: "linear-gradient(135deg, #dc2626 0%, #991b1b 100%)",
            display: "flex", alignItems: "center", justifyContent: "center",
            boxShadow: "0 8px 24px rgba(220,38,38,0.35)",
          }}>
            <GavelIcon sx={{ color: "white", fontSize: 30 }} />
          </Box>
          <Typography fontWeight={900} fontSize={{ xs: "2rem", md: "2.6rem" }}
            letterSpacing="-0.03em" sx={{ color: isDark ? "#f5f5f5" : "#111", mb: 1.5 }}>
            Terms of Service
          </Typography>
          <Typography color="text.secondary" lineHeight={1.7} maxWidth={520} mx="auto">
            By using BloodLife you agree to these terms. Please read them carefully.
          </Typography>
          <Chip label="Effective: August 2026" size="small" sx={{ mt: 2,
            bgcolor: isDark ? "rgba(220,38,38,0.12)" : "#fff1f2", color: "#dc2626", fontWeight: 600 }} />
        </Box>

        <Section title="1. Acceptance of Terms" isDark={isDark} border={border} card={card}>
          <Typography variant="body2" color="text.secondary" lineHeight={1.8}>
            By accessing or using the BloodLife platform ("Service"), you agree to be bound by these Terms of Service and our Privacy Policy.
            If you do not agree to these terms, please do not use the Service. These terms apply to all visitors, donors, and registered users.
          </Typography>
        </Section>

        <Section title="2. Eligibility" isDark={isDark} border={border} card={card}>
          <Typography variant="body2" color="text.secondary" mb={2} lineHeight={1.8}>
            To register as a donor on BloodLife, you must meet the following criteria:
          </Typography>
          <Bullet>Be between 18 and 60 years of age</Bullet>
          <Bullet>Weigh at least 45 kg</Bullet>
          <Bullet>Not have donated blood within the past 3 months</Bullet>
          <Bullet>Be free of active infections, certain chronic conditions, or communicable diseases</Bullet>
          <Bullet>Provide accurate and truthful information during registration</Bullet>
          <Typography variant="body2" color="text.secondary" mt={2} lineHeight={1.8}>
            BloodLife reserves the right to remove any donor profile that does not meet these eligibility requirements.
          </Typography>
        </Section>

        <Section title="3. User Responsibilities" isDark={isDark} border={border} card={card}>
          <Bullet>Provide accurate, current, and complete information at registration and keep it updated</Bullet>
          <Bullet>Keep your account credentials confidential and not share your password</Bullet>
          <Bullet>Use the platform only for lawful, legitimate blood donation and request purposes</Bullet>
          <Bullet>Not submit false blood requests or donor registrations</Bullet>
          <Bullet>Not attempt to scrape, reverse-engineer, or abuse the platform's APIs</Bullet>
          <Bullet warn>Misuse of the blood request system for non-medical purposes may result in permanent account suspension and legal action</Bullet>
        </Section>

        <Section title="4. Medical Disclaimer" isDark={isDark} border={border} card={card}>
          <Box sx={{
            p: 2, borderRadius: "10px", mb: 2,
            bgcolor: isDark ? "rgba(217,119,6,0.1)" : "#fffbeb",
            border: `1px solid ${isDark ? "rgba(217,119,6,0.25)" : "#fde68a"}`,
          }}>
            <Typography variant="body2" fontWeight={700} sx={{ color: "#d97706" }}>
              BloodLife is not a medical provider.
            </Typography>
          </Box>
          <Typography variant="body2" color="text.secondary" lineHeight={1.8}>
            The platform facilitates connections between blood donors and patients but does not provide medical advice, diagnosis, or treatment.
            All blood collection and transfusion procedures must be performed by qualified medical professionals at licensed facilities.
            BloodLife is not liable for any medical outcomes resulting from blood donations or transfusions arranged through the platform.
          </Typography>
        </Section>

        <Section title="5. Intellectual Property" isDark={isDark} border={border} card={card}>
          <Typography variant="body2" color="text.secondary" lineHeight={1.8}>
            All content, design, code, and trademarks on the BloodLife platform are the intellectual property of the development team
            at the Institute of Technology of Cambodia. You may not copy, modify, distribute, or use any part of the platform
            without prior written permission, except as expressly permitted by these terms.
          </Typography>
        </Section>

        <Section title="6. Limitation of Liability" isDark={isDark} border={border} card={card}>
          <Bullet warn>BloodLife provides the platform "as is" without warranty of any kind</Bullet>
          <Bullet warn>We are not liable for any direct, indirect, or consequential damages arising from use of the Service</Bullet>
          <Bullet warn>We do not guarantee continuous, uninterrupted availability of the platform</Bullet>
          <Bullet warn>We are not responsible for the accuracy of donor or patient information submitted by users</Bullet>
        </Section>

        <Section title="7. Termination" isDark={isDark} border={border} card={card}>
          <Typography variant="body2" color="text.secondary" lineHeight={1.8}>
            We reserve the right to suspend or terminate your account at any time if you violate these terms.
            You may delete your account at any time through your profile settings or by contacting us.
            Upon termination, your personal data will be deleted in accordance with our Privacy Policy.
          </Typography>
        </Section>

        <Section title="8. Changes to Terms" isDark={isDark} border={border} card={card}>
          <Typography variant="body2" color="text.secondary" lineHeight={1.8}>
            We may update these Terms of Service from time to time. We will notify registered users of material changes via email.
            Continued use of the platform after changes are posted constitutes acceptance of the updated terms.
            The "Last updated" date at the top of this page will reflect any revisions.
          </Typography>
        </Section>

        <Section title="9. Governing Law" isDark={isDark} border={border} card={card}>
          <Typography variant="body2" color="text.secondary" lineHeight={1.8}>
            These terms are governed by the laws of the Kingdom of Cambodia. Any disputes arising from the use of BloodLife
            shall be resolved in the competent courts of Phnom Penh, Cambodia.
          </Typography>
        </Section>

        <Paper elevation={0} sx={{
          p: 3, borderRadius: "16px", textAlign: "center",
          border: `1px solid ${isDark ? "rgba(220,38,38,0.2)" : "#fecaca"}`,
          bgcolor: isDark ? "rgba(220,38,38,0.06)" : "#fff0f0",
        }}>
          <Typography variant="body2" color="text.secondary" lineHeight={1.8}>
            Questions about these terms? Contact us at{" "}
            <Box component="a" href="mailto:Vath.V211006@sis.hust.edu.vn"
              sx={{ color: "#dc2626", textDecoration: "none", fontWeight: 700 }}>
              Vath.V211006@sis.hust.edu.vn
            </Box>
          </Typography>
        </Paper>

      </Container>
    </Box>
  );
}
