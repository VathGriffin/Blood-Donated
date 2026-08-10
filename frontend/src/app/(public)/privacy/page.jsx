'use client';
import React, { useState } from "react";
import { Box, Container, Typography, useTheme, Paper, Divider, Chip, List, ListItem, ListItemIcon, ListItemText } from "@mui/material";
import ShieldIcon from "@mui/icons-material/Shield";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import LockIcon from "@mui/icons-material/Lock";
import PersonIcon from "@mui/icons-material/Person";
import StorageIcon from "@mui/icons-material/Storage";
import ShareIcon from "@mui/icons-material/Share";
import DeleteIcon from "@mui/icons-material/Delete";
import EmailIcon from "@mui/icons-material/Email";

const SECTIONS = [
  { id: "collect",  icon: <StorageIcon />, title: "Data We Collect" },
  { id: "use",      icon: <PersonIcon />,  title: "How We Use Your Data" },
  { id: "share",    icon: <ShareIcon />,   title: "Data Sharing" },
  { id: "security", icon: <LockIcon />,    title: "Security" },
  { id: "rights",   icon: <ShieldIcon />,  title: "Your Rights" },
  { id: "retention",icon: <DeleteIcon />,  title: "Data Retention" },
  { id: "contact",  icon: <EmailIcon />,   title: "Contact Us" },
];

function Section({ id, icon, title, children, isDark, border, card }) {
  return (
    <Paper id={id} elevation={0} sx={{
      p: { xs: 3, md: 4 }, borderRadius: "20px", mb: 3,
      border: `1px solid ${border}`, bgcolor: card,
    }}>
      <Box display="flex" alignItems="center" gap={1.5} mb={2.5}>
        <Box sx={{
          width: 42, height: 42, borderRadius: "12px", flexShrink: 0,
          bgcolor: isDark ? "rgba(220,38,38,0.12)" : "#fff1f2",
          display: "flex", alignItems: "center", justifyContent: "center",
          color: "#dc2626",
        }}>
          {React.cloneElement(icon, { sx: { fontSize: 20, color: "#dc2626" } })}
        </Box>
        <Typography fontWeight={800} fontSize="1.05rem" letterSpacing="-0.01em"
          sx={{ color: isDark ? "#f5f5f5" : "#111" }}>
          {title}
        </Typography>
      </Box>
      <Divider sx={{ mb: 2.5, borderColor: isDark ? "#1f1f1f" : "#f0f0f0" }} />
      {children}
    </Paper>
  );
}

function Bullet({ children, isDark }) {
  return (
    <Box display="flex" gap={1.5} mb={1}>
      <CheckCircleIcon sx={{ fontSize: 16, color: "#dc2626", mt: 0.3, flexShrink: 0 }} />
      <Typography variant="body2" color="text.secondary" lineHeight={1.8}>{children}</Typography>
    </Box>
  );
}

export default function PrivacyPolicy() {
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
            <ShieldIcon sx={{ color: "white", fontSize: 30 }} />
          </Box>
          <Typography fontWeight={900} fontSize={{ xs: "2rem", md: "2.6rem" }}
            letterSpacing="-0.03em" sx={{ color: isDark ? "#f5f5f5" : "#111", mb: 1.5 }}>
            Privacy Policy
          </Typography>
          <Typography color="text.secondary" lineHeight={1.7} maxWidth={520} mx="auto">
            We are committed to protecting your personal data and your right to privacy.
            This policy explains how BloodLife collects, uses, and safeguards your information.
          </Typography>
          <Box display="flex" gap={1.5} justifyContent="center" flexWrap="wrap" mt={2.5}>
            <Chip label="Last updated: August 2026" size="small"
              sx={{ bgcolor: isDark ? "rgba(220,38,38,0.12)" : "#fff1f2", color: "#dc2626", fontWeight: 600 }} />
            <Chip label="GDPR Compliant" size="small" icon={<CheckCircleIcon sx={{ fontSize: "14px !important", color: "#16a34a !important" }} />}
              sx={{ bgcolor: isDark ? "rgba(22,163,74,0.1)" : "#f0fdf4", color: "#16a34a", fontWeight: 600 }} />
          </Box>
        </Box>

        {/* Quick nav */}
        <Paper elevation={0} sx={{ p: 2.5, borderRadius: "16px", border: `1px solid ${border}`, bgcolor: card, mb: 4 }}>
          <Typography fontWeight={700} fontSize="0.82rem" color="text.secondary" mb={1.5}
            sx={{ textTransform: "uppercase", letterSpacing: "0.06em" }}>Contents</Typography>
          <Box display="flex" flexWrap="wrap" gap={1}>
            {SECTIONS.map(s => (
              <Chip key={s.id} label={s.title} size="small" clickable
                onClick={() => document.getElementById(s.id)?.scrollIntoView({ behavior: "smooth", block: "start" })}
                sx={{ fontSize: "0.78rem", fontWeight: 600,
                  bgcolor: isDark ? "#1a1a1a" : "#f5f5f5",
                  "&:hover": { bgcolor: isDark ? "rgba(220,38,38,0.12)" : "#fff1f2", color: "#dc2626" } }} />
            ))}
          </Box>
        </Paper>

        {/* 1. Data We Collect */}
        <Section id="collect" icon={<StorageIcon />} title="Data We Collect" isDark={isDark} border={border} card={card}>
          <Typography variant="body2" color="text.secondary" mb={2} lineHeight={1.8}>
            We collect only the information necessary to operate the BloodLife platform and facilitate blood donation matching.
          </Typography>
          <Typography fontWeight={700} fontSize="0.88rem" mb={1} sx={{ color: isDark ? "#f5f5f5" : "#111" }}>Personal Information</Typography>
          <Bullet isDark={isDark}>Full name, email address, and phone number when you register</Bullet>
          <Bullet isDark={isDark}>Blood type, location, and donation history when you register as a donor</Bullet>
          <Bullet isDark={isDark}>Profile photo (optional) that you choose to upload</Bullet>
          <Bullet isDark={isDark}>Patient information provided in blood request forms</Bullet>
          <Typography fontWeight={700} fontSize="0.88rem" mb={1} mt={2.5} sx={{ color: isDark ? "#f5f5f5" : "#111" }}>Technical Data</Typography>
          <Bullet isDark={isDark}>IP address, browser type, and device information for security logging</Bullet>
          <Bullet isDark={isDark}>Session tokens used for authentication (stored securely, never in cookies)</Bullet>
          <Bullet isDark={isDark}>API request logs retained for 30 days for security auditing</Bullet>
        </Section>

        {/* 2. How We Use Your Data */}
        <Section id="use" icon={<PersonIcon />} title="How We Use Your Data" isDark={isDark} border={border} card={card}>
          <Typography variant="body2" color="text.secondary" mb={2} lineHeight={1.8}>
            Your data is used exclusively to operate the platform and improve blood donation outcomes in Cambodia.
          </Typography>
          <Bullet isDark={isDark}>Matching blood donors with patients who have compatible blood types</Bullet>
          <Bullet isDark={isDark}>Sending appointment reminders and donation confirmations</Bullet>
          <Bullet isDark={isDark}>Displaying your donor profile on the public donor directory (only if you choose to be available)</Bullet>
          <Bullet isDark={isDark}>Generating anonymized statistics for public health reporting</Bullet>
          <Bullet isDark={isDark}>Verifying your identity and preventing fraudulent requests</Bullet>
          <Bullet isDark={isDark}>Improving the platform through aggregated, anonymized usage analytics</Bullet>
          <Box sx={{
            mt: 2.5, p: 2, borderRadius: "10px",
            bgcolor: isDark ? "rgba(220,38,38,0.06)" : "#fff0f0",
            border: `1px solid ${isDark ? "rgba(220,38,38,0.2)" : "#fecaca"}`,
          }}>
            <Typography variant="body2" fontWeight={600} color="error.main">
              We never use your data for advertising, marketing profiling, or sell it to third parties.
            </Typography>
          </Box>
        </Section>

        {/* 3. Data Sharing */}
        <Section id="share" icon={<ShareIcon />} title="Data Sharing" isDark={isDark} border={border} card={card}>
          <Typography variant="body2" color="text.secondary" mb={2} lineHeight={1.8}>
            We do not sell, rent, or trade your personal information. Data may only be shared in the following limited circumstances:
          </Typography>
          <Bullet isDark={isDark}><strong>Partner hospitals:</strong> Your contact information may be shared with verified partner hospitals when a blood match is confirmed and you have consented</Bullet>
          <Bullet isDark={isDark}><strong>Legal obligations:</strong> We may disclose data if required by Cambodian law or court order</Bullet>
          <Bullet isDark={isDark}><strong>Service providers:</strong> Cloud infrastructure providers (MongoDB Atlas) under strict data processing agreements</Bullet>
          <Bullet isDark={isDark}><strong>AI assistant:</strong> Chat messages sent to the AI assistant are processed by Anthropic's API and are not stored on our servers</Bullet>
        </Section>

        {/* 4. Security */}
        <Section id="security" icon={<LockIcon />} title="Security" isDark={isDark} border={border} card={card}>
          <Typography variant="body2" color="text.secondary" mb={2} lineHeight={1.8}>
            We implement industry-standard technical and organizational measures to protect your data.
          </Typography>
          <Bullet isDark={isDark}>All passwords are hashed using bcrypt with a minimum cost factor of 12</Bullet>
          <Bullet isDark={isDark}>Authentication tokens (JWT) expire after 8 hours and are signed with a secure secret</Bullet>
          <Bullet isDark={isDark}>All API requests are protected against NoSQL injection and XSS attacks</Bullet>
          <Bullet isDark={isDark}>Rate limiting prevents brute-force attacks (10 login attempts per 15 minutes per IP)</Bullet>
          <Bullet isDark={isDark}>HTTPS enforced in production; all data in transit is encrypted via TLS 1.2+</Bullet>
          <Bullet isDark={isDark}>File uploads are validated for type and size; stored outside the web root</Bullet>
          <Bullet isDark={isDark}>Security headers (HSTS, X-Frame-Options, CSP) enforced via Helmet.js</Bullet>
          <Bullet isDark={isDark}>Server request logs are reviewed and purged every 30 days</Bullet>
        </Section>

        {/* 5. Your Rights */}
        <Section id="rights" icon={<ShieldIcon />} title="Your Rights" isDark={isDark} border={border} card={card}>
          <Typography variant="body2" color="text.secondary" mb={2} lineHeight={1.8}>
            You have the following rights regarding your personal data:
          </Typography>
          {[
            ["Right of Access",       "Request a copy of all personal data we hold about you"],
            ["Right to Rectification","Correct inaccurate or incomplete personal data at any time via your profile settings"],
            ["Right to Erasure",      "Request deletion of your account and all associated data"],
            ["Right to Portability",  "Receive your data in a machine-readable format (JSON) upon request"],
            ["Right to Object",       "Opt out of your donor profile being visible on the public directory"],
            ["Right to Restrict",     "Request that we limit processing of your data in certain circumstances"],
          ].map(([right, desc]) => (
            <Box key={right} sx={{
              display: "flex", gap: 1.5, mb: 1.5, p: 1.5, borderRadius: "10px",
              bgcolor: isDark ? "#1a1a1a" : "#f8f8f8",
              border: `1px solid ${border}`,
            }}>
              <CheckCircleIcon sx={{ fontSize: 16, color: "#dc2626", mt: 0.3, flexShrink: 0 }} />
              <Box>
                <Typography fontWeight={700} fontSize="0.85rem" sx={{ color: isDark ? "#f0f0f0" : "#111" }}>{right}</Typography>
                <Typography variant="caption" color="text.secondary" lineHeight={1.6}>{desc}</Typography>
              </Box>
            </Box>
          ))}
          <Typography variant="body2" color="text.secondary" mt={2} lineHeight={1.8}>
            To exercise any of these rights, contact us at{" "}
            <Box component="a" href="mailto:Vath.V211006@sis.hust.edu.vn"
              sx={{ color: "#dc2626", textDecoration: "none", fontWeight: 600 }}>
              Vath.V211006@sis.hust.edu.vn
            </Box>. We will respond within 30 days.
          </Typography>
        </Section>

        {/* 6. Retention */}
        <Section id="retention" icon={<DeleteIcon />} title="Data Retention" isDark={isDark} border={border} card={card}>
          <Bullet isDark={isDark}>Active donor and user accounts: retained while the account is active</Bullet>
          <Bullet isDark={isDark}>Deleted accounts: all personal data purged within 30 days of deletion request</Bullet>
          <Bullet isDark={isDark}>Blood request records: anonymized and retained for 2 years for public health statistics</Bullet>
          <Bullet isDark={isDark}>Server access logs: retained for 30 days, then automatically deleted</Bullet>
          <Bullet isDark={isDark}>Uploaded photos: permanently deleted when account is closed or photo is removed</Bullet>
        </Section>

        {/* 7. Contact */}
        <Section id="contact" icon={<EmailIcon />} title="Contact Us" isDark={isDark} border={border} card={card}>
          <Typography variant="body2" color="text.secondary" mb={2} lineHeight={1.8}>
            If you have any questions, concerns, or requests regarding this privacy policy or your personal data, please reach out:
          </Typography>
          <Box sx={{ p: 2.5, borderRadius: "12px", bgcolor: isDark ? "#1a1a1a" : "#f8f8f8", border: `1px solid ${border}` }}>
            <Typography fontWeight={700} fontSize="0.9rem" mb={1} sx={{ color: isDark ? "#f5f5f5" : "#111" }}>BloodLife Data Controller</Typography>
            <Typography variant="body2" color="text.secondary" lineHeight={2}>
              Institute of Technology of Cambodia<br />
              Phnom Penh, Cambodia<br />
              Email:{" "}
              <Box component="a" href="mailto:Vath.V211006@sis.hust.edu.vn"
                sx={{ color: "#dc2626", textDecoration: "none", fontWeight: 600 }}>
                Vath.V211006@sis.hust.edu.vn
              </Box>
            </Typography>
          </Box>
        </Section>

      </Container>
    </Box>
  );
}
