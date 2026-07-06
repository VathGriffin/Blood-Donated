'use client';
import Link from 'next/link';
import React, { useEffect } from "react";
import {
  Container, Typography, Box, Grid, Chip,
  Button, Paper, useTheme,
} from "@mui/material";
import BloodtypeIcon from "@mui/icons-material/Bloodtype";
import VolunteerActivismIcon from "@mui/icons-material/VolunteerActivism";
import LocalHospitalIcon from "@mui/icons-material/LocalHospital";
import LocalShippingIcon from "@mui/icons-material/LocalShipping";
import RocketLaunchIcon from "@mui/icons-material/RocketLaunch";
import SecurityIcon from "@mui/icons-material/Security";
import GroupsIcon from "@mui/icons-material/Groups";
import NotificationsActiveIcon from "@mui/icons-material/NotificationsActive";
import EmojiEventsIcon from "@mui/icons-material/EmojiEvents";
import FavoriteIcon from "@mui/icons-material/Favorite";
import AOS from "aos";
import "aos/dist/aos.css";

const HERO_IMG =
  "https://images.unsplash.com/photo-1516549655169-df83a0774514?auto=format&fit=crop&w=1920&q=80";
const MISSION_IMG =
  "https://images.unsplash.com/photo-1576091160550-2173dba999ef?auto=format&fit=crop&w=1920&q=80";
const CTA_IMG =
  "https://images.unsplash.com/photo-1579154204601-01588f351e67?auto=format&fit=crop&w=1920&q=80";

const stats = [
  { icon: <BloodtypeIcon color="error" sx={{ fontSize: 36 }} />, label: "15,000+", desc: "Units of Blood Collected" },
  { icon: <VolunteerActivismIcon color="error" sx={{ fontSize: 36 }} />, label: "5,000+", desc: "Active Donors" },
  { icon: <LocalHospitalIcon color="error" sx={{ fontSize: 36 }} />, label: "50+", desc: "Partner Hospitals" },
  { icon: <LocalShippingIcon color="error" sx={{ fontSize: 36 }} />, label: "20+", desc: "Annual Blood Drives" },
];

const reasons = [
  { icon: <GroupsIcon sx={{ color: "#b71c1c", fontSize: 22 }} />, text: "Bridges hospitals, donors, and the community" },
  { icon: <BloodtypeIcon sx={{ color: "#b71c1c", fontSize: 22 }} />, text: "Enables data-driven blood inventory management" },
  { icon: <NotificationsActiveIcon sx={{ color: "#b71c1c", fontSize: 22 }} />, text: "Real-time stock updates and instant notifications" },
  { icon: <SecurityIcon sx={{ color: "#b71c1c", fontSize: 22 }} />, text: "Prioritizes user privacy and data security" },
  { icon: <VolunteerActivismIcon sx={{ color: "#b71c1c", fontSize: 22 }} />, text: "Cultivates voluntary blood donation nationwide" },
];

const timeline = [
  { year: "2024 Q1", event: "Project Kick-off", desc: "Identified Cambodia's blood supply gap. Team assembled at ITC.", icon: <RocketLaunchIcon sx={{ fontSize: 20, color: "#fff" }} /> },
  { year: "2024 Q2", event: "MVP Launched", desc: "Donor registration and inventory tracking live. First 200 donors registered.", icon: <BloodtypeIcon sx={{ fontSize: 20, color: "#fff" }} /> },
  { year: "2024 Q3", event: "Hospital Integrations", desc: "Partnered with 10 hospitals for real-time blood request processing.", icon: <LocalHospitalIcon sx={{ fontSize: 20, color: "#fff" }} /> },
  { year: "2024 Q4", event: "Automated Alerts", desc: "Push notifications for critical shortages, reaching 1,000+ donors.", icon: <NotificationsActiveIcon sx={{ fontSize: 20, color: "#fff" }} /> },
  { year: "2025", event: "Scale Nationwide", desc: "Expanding to all provinces with mobile app support planned.", icon: <EmojiEventsIcon sx={{ fontSize: 20, color: "#fff" }} /> },
];

const values = [
  { icon: "❤️", title: "Save Lives", desc: "Every feature we build is measured by one metric — lives saved." },
  { icon: "🔒", title: "Privacy First", desc: "Donor data is encrypted and never shared without consent." },
  { icon: "🌏", title: "Nationwide Access", desc: "Designed to scale from Phnom Penh to every province in Cambodia." },
  { icon: "🤝", title: "Community", desc: "A platform built on trust between donors, patients, and hospitals." },
  { icon: "⚡", title: "Real-time", desc: "Live inventory and instant shortage alerts keep hospitals ready." },
  { icon: "🎓", title: "Open Science", desc: "Built by Data Science students at ITC using industry best practices." },
];

const About = () => {
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";

  useEffect(() => { AOS.init({ duration: 900, once: true }); }, []);

  return (
    <Box sx={{ backgroundColor: isDark ? "#121212" : "#f9f9f9" }}>

      {/* ── Hero — Hospital Photo Background ──────────────────────────────── */}
      <Box sx={{
        position: "relative",
        minHeight: { xs: "70vh", md: "80vh" },
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        textAlign: "center",
        backgroundImage: `url('${HERO_IMG}')`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundAttachment: { xs: "scroll", md: "fixed" },
        "&::before": {
          content: '""',
          position: "absolute",
          inset: 0,
          background: isDark
            ? "linear-gradient(135deg, rgba(10,0,0,0.93) 0%, rgba(70,0,0,0.85) 100%)"
            : "linear-gradient(135deg, rgba(90,0,0,0.90) 0%, rgba(183,28,28,0.82) 100%)",
          zIndex: 1,
        },
      }}>
        <Box sx={{ position: "relative", zIndex: 2, px: 3, pt: { xs: 12, md: 8 }, pb: { xs: 8, md: 6 } }} data-aos="fade-up">
          <Chip
            icon={<LocalHospitalIcon sx={{ color: "white !important", fontSize: "18px !important" }} />}
            label="Cambodia's Blood Donation Platform"
            sx={{ backgroundColor: "rgba(255,255,255,0.15)", color: "white", fontWeight: 700, mb: 3, backdropFilter: "blur(4px)", fontSize: "0.82rem" }}
          />
          <Typography variant="h2" fontWeight={800} color="white"
            sx={{ lineHeight: 1.15, mb: 2, fontSize: { xs: "2.4rem", md: "3.6rem" }, textShadow: "0 2px 24px rgba(0,0,0,0.6)" }}>
            About Blood Donated
          </Typography>
          <Typography variant="h5" sx={{ color: "#ffcdd2", fontWeight: 700, mb: 2, fontSize: { xs: "1.2rem", md: "1.5rem" } }}>
            Revolutionizing Blood Donation Across Cambodia
          </Typography>
          <Typography variant="h6" sx={{
            color: "rgba(255,255,255,0.82)", maxWidth: 620, mx: "auto", lineHeight: 1.8,
            fontWeight: 400, fontSize: { xs: "1rem", md: "1.1rem" },
          }}>
            Built by 4th-year Data Science students at the Institute of Technology of Cambodia —
            powered by purpose, driven by data.
          </Typography>

          <Box sx={{ display: "flex", gap: 2, justifyContent: "center", flexWrap: "wrap", mt: 5 }}>
            <Button component={Link} href="/donate" variant="contained" size="large" sx={{
              backgroundColor: "white", color: "#b71c1c", fontWeight: 800, px: 4.5, py: 1.5, borderRadius: 3,
              boxShadow: "0 8px 32px rgba(0,0,0,0.35)",
              "&:hover": { backgroundColor: "#ffcdd2", transform: "translateY(-2px)" }, transition: "all 0.25s",
            }}>
              Become a Donor
            </Button>
            <Button component={Link} href="/team" variant="outlined" size="large" sx={{
              borderColor: "rgba(255,255,255,0.7)", color: "white", fontWeight: 700, px: 4.5, py: 1.5, borderRadius: 3,
              backdropFilter: "blur(4px)",
              "&:hover": { backgroundColor: "rgba(255,255,255,0.15)", borderColor: "white", transform: "translateY(-2px)" }, transition: "all 0.25s",
            }}>
              Meet the Team
            </Button>
          </Box>
        </Box>
      </Box>

      {/* ── Stats Strip ───────────────────────────────────────────────────── */}
      <Box sx={{
        backgroundColor: isDark ? "#1a1a1a" : "#fff", py: 8,
        borderBottom: `1px solid ${isDark ? "#2a2a2a" : "#eee"}`,
        boxShadow: isDark ? "none" : "0 4px 24px rgba(0,0,0,0.05)",
      }}>
        <Container maxWidth="lg">
          <Grid container spacing={4} justifyContent="center">
            {stats.map((item, idx) => (
              <Grid item xs={6} sm={3} key={idx} data-aos="zoom-in" data-aos-delay={idx * 80}>
                <Box textAlign="center">
                  <Box sx={{ mb: 1.5 }}>{item.icon}</Box>
                  <Typography variant="h4" fontWeight={800} color="error.main">{item.label}</Typography>
                  <Typography variant="body2" color="text.secondary">{item.desc}</Typography>
                </Box>
              </Grid>
            ))}
          </Grid>
        </Container>
      </Box>

      {/* ── Mission — Photo Background ─────────────────────────────────────── */}
      <Box sx={{
        position: "relative",
        py: { xs: 10, md: 14 },
        backgroundImage: `url('${MISSION_IMG}')`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundAttachment: { xs: "scroll", md: "fixed" },
        "&::before": {
          content: '""',
          position: "absolute",
          inset: 0,
          background: "linear-gradient(135deg, rgba(10,10,10,0.93) 0%, rgba(50,0,0,0.88) 100%)",
        },
      }}>
        <Container maxWidth="lg" sx={{ position: "relative", zIndex: 1 }}>
          <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" }, gap: 6, alignItems: "center" }}>

            {/* Left text */}
            <Box data-aos="fade-right">
              <Typography variant="overline" sx={{ color: "#ffcdd2", fontWeight: 700, letterSpacing: "0.15em" }}>
                Our Purpose
              </Typography>
              <Typography variant="h3" fontWeight={800} color="white" mt={0.5} gutterBottom
                sx={{ fontSize: { xs: "2rem", md: "2.6rem" }, lineHeight: 1.2 }}>
                Our Mission
              </Typography>
              <Typography variant="body1" sx={{ color: "rgba(255,255,255,0.80)", lineHeight: 1.9, mb: 2.5, fontSize: "1.05rem" }}>
                <strong style={{ color: "#ffcdd2" }}>Blood Donated</strong> is a full-stack web application built to solve a
                real problem — Cambodia's blood supply gap. We connect donors, hospitals,
                and patients in a single platform that's fast, transparent, and life-saving.
              </Typography>
              <Typography variant="body1" sx={{ color: "rgba(255,255,255,0.75)", lineHeight: 1.9, fontSize: "1.05rem" }}>
                With real-time inventory tracking, donor management, and automated shortage
                alerts, no life should be lost due to a lack of blood.
              </Typography>

              <Box sx={{ display: "flex", gap: 3, mt: 4 }}>
                {[
                  { value: "45K+", label: "Lives Saved" },
                  { value: "120+", label: "Hospitals" },
                  { value: "15K+", label: "Donors" },
                ].map((item, i) => (
                  <Box key={i} textAlign="center">
                    <Typography variant="h4" fontWeight={800} color="#ffcdd2">{item.value}</Typography>
                    <Typography variant="caption" sx={{ color: "rgba(255,255,255,0.65)", fontWeight: 600 }}>{item.label}</Typography>
                  </Box>
                ))}
              </Box>
            </Box>

            {/* Right: Why This Matters */}
            <Box data-aos="fade-left">
              <Box sx={{
                backgroundColor: "rgba(255,255,255,0.07)",
                backdropFilter: "blur(12px)",
                border: "1px solid rgba(255,255,255,0.15)",
                borderRadius: 4, p: 4,
              }}>
                <Typography variant="h6" fontWeight={700} color="white" gutterBottom>
                  Why This Matters
                </Typography>
                <Box sx={{ display: "flex", flexDirection: "column", gap: 2, mt: 2 }}>
                  {reasons.map((r, i) => (
                    <Box key={i} sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                      <Box sx={{
                        width: 40, height: 40, borderRadius: 2, flexShrink: 0,
                        background: "linear-gradient(135deg, #b71c1c 0%, #d32f2f 100%)",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        boxShadow: "0 4px 12px rgba(183,28,28,0.4)",
                      }}>
                        {React.cloneElement(r.icon, { sx: { color: "#fff", fontSize: 22 } })}
                      </Box>
                      <Typography variant="body2" sx={{ color: "rgba(255,255,255,0.80)", lineHeight: 1.6 }}>
                        {r.text}
                      </Typography>
                    </Box>
                  ))}
                </Box>
              </Box>
            </Box>
          </Box>
        </Container>
      </Box>

      {/* ── Our Values ────────────────────────────────────────────────────── */}
      <Box sx={{ backgroundColor: isDark ? "#121212" : "#f9f9f9", py: 12 }}>
        <Container maxWidth="lg">
          <Box textAlign="center" mb={8} data-aos="fade-up">
            <Typography variant="overline" color="error" fontWeight={700} letterSpacing="0.15em">What We Stand For</Typography>
            <Typography variant="h4" fontWeight={700} color={isDark ? "white" : "text.primary"} mt={0.5}>
              Our Values
            </Typography>
          </Box>
          <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr 1fr", md: "repeat(3, 1fr)" }, gap: 3 }}>
            {values.map((v, idx) => (
              <Paper key={idx} data-aos="fade-up" data-aos-delay={idx * 80} elevation={isDark ? 0 : 2} sx={{
                p: 3.5, borderRadius: 4, textAlign: "center", transition: "0.3s",
                backgroundColor: isDark ? "#1a1a1a" : "#fff",
                border: isDark ? "1px solid #2a2a2a" : "none",
                "&:hover": { transform: "translateY(-6px)", boxShadow: 6 },
              }}>
                <Typography fontSize="2.4rem" mb={1.5}>{v.icon}</Typography>
                <Typography variant="subtitle1" fontWeight={700} gutterBottom>{v.title}</Typography>
                <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.7 }}>{v.desc}</Typography>
              </Paper>
            ))}
          </Box>
        </Container>
      </Box>

      {/* ── Timeline ──────────────────────────────────────────────────────── */}
      <Box sx={{ backgroundColor: isDark ? "#1a1a1a" : "#fff", py: 12 }}>
        <Container maxWidth="md">
          <Box textAlign="center" mb={8} data-aos="fade-up">
            <Typography variant="overline" color="error" fontWeight={700} letterSpacing="0.15em">Milestones</Typography>
            <Typography variant="h4" fontWeight={700} color={isDark ? "white" : "text.primary"} mt={0.5}>
              Our Journey
            </Typography>
            <Typography variant="body1" color="text.secondary" mt={1}>
              From idea to impact — key milestones in our project's evolution.
            </Typography>
          </Box>

          <Box sx={{ position: "relative" }}>
            {/* Vertical line */}
            <Box sx={{
              position: "absolute",
              left: { xs: 20, md: "50%" },
              top: 0, bottom: 0, width: 2,
              backgroundColor: isDark ? "#4a1515" : "#ffcdd2",
              transform: { md: "translateX(-50%)" },
            }} />

            <Box sx={{ display: "flex", flexDirection: "column", gap: 5 }}>
              {timeline.map((item, idx) => {
                const isRight = idx % 2 === 0;
                return (
                  <Box
                    key={idx}
                    data-aos={isRight ? "fade-right" : "fade-left"}
                    data-aos-delay={idx * 80}
                    sx={{
                      display: "flex",
                      flexDirection: { xs: "row", md: isRight ? "row" : "row-reverse" },
                      gap: 3,
                      alignItems: "center",
                      position: "relative",
                    }}
                  >
                    {/* Dot */}
                    <Box sx={{
                      position: { md: "absolute" },
                      left: { xs: "auto", md: "50%" },
                      transform: { md: "translateX(-50%)" },
                      width: 44, height: 44, borderRadius: "50%", flexShrink: 0,
                      background: "linear-gradient(135deg, #b71c1c 0%, #d32f2f 100%)",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      boxShadow: `0 0 0 5px ${isDark ? "#1a1a1a" : "#fff"}, 0 4px 16px rgba(183,28,28,0.4)`,
                      zIndex: 2,
                    }}>
                      {item.icon}
                    </Box>

                    {/* Card */}
                    <Box sx={{
                      flex: 1,
                      ml: { xs: 2, md: isRight ? 0 : "auto" },
                      mr: { xs: 0, md: isRight ? "auto" : 0 },
                      maxWidth: { md: "42%" },
                    }}>
                      <Paper elevation={isDark ? 0 : 3} sx={{
                        p: 3, borderRadius: 3,
                        backgroundColor: isDark ? "#1f1f1f" : "#fff",
                        border: isDark ? "1px solid #2a2a2a" : "none",
                        transition: "0.3s",
                        "&:hover": { transform: "translateY(-3px)", boxShadow: 5 },
                      }}>
                        <Chip
                          label={item.year}
                          size="small"
                          sx={{ backgroundColor: "#b71c1c", color: "white", fontWeight: 700, fontSize: "0.75rem", mb: 1 }}
                        />
                        <Typography variant="subtitle1" fontWeight={700} gutterBottom>{item.event}</Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.7 }}>{item.desc}</Typography>
                      </Paper>
                    </Box>
                  </Box>
                );
              })}
            </Box>
          </Box>
        </Container>
      </Box>

      {/* ── CTA — Photo Background ─────────────────────────────────────────── */}
      <Box sx={{
        position: "relative",
        py: 14,
        textAlign: "center",
        backgroundImage: `url('${CTA_IMG}')`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundAttachment: { xs: "scroll", md: "fixed" },
        "&::before": {
          content: '""',
          position: "absolute",
          inset: 0,
          background: "linear-gradient(135deg, rgba(80,0,0,0.90) 0%, rgba(183,28,28,0.82) 50%, rgba(40,0,0,0.90) 100%)",
        },
      }} data-aos="fade-up">
        <Container maxWidth="md" sx={{ position: "relative", zIndex: 1 }}>
          <FavoriteIcon sx={{ fontSize: 60, color: "#ffcdd2", mb: 2 }} />
          <Typography variant="h3" fontWeight={800} color="white" gutterBottom
            sx={{ textShadow: "0 2px 20px rgba(0,0,0,0.5)", fontSize: { xs: "2rem", md: "2.8rem" } }}>
            Ready to Make a Difference?
          </Typography>
          <Typography variant="h6" sx={{
            color: "rgba(255,255,255,0.85)", mb: 6, lineHeight: 1.8,
            maxWidth: 540, mx: "auto", fontWeight: 400,
          }}>
            Join thousands of donors across Cambodia and help us build a future
            where no life is lost due to a lack of blood.
          </Typography>
          <Box sx={{ display: "flex", justifyContent: "center", gap: 2.5, flexWrap: "wrap" }}>
            <Button component={Link} href="/donate" variant="contained" size="large" sx={{
              backgroundColor: "white", color: "#b71c1c", fontWeight: 800, px: 5, py: 1.7, borderRadius: 3, fontSize: "1rem",
              boxShadow: "0 8px 32px rgba(0,0,0,0.4)",
              "&:hover": { backgroundColor: "#ffcdd2", transform: "translateY(-3px)" }, transition: "all 0.25s",
            }}>
              Become a Donor
            </Button>
            <Button component={Link} href="/contact" variant="outlined" size="large" sx={{
              borderColor: "rgba(255,255,255,0.7)", color: "white", fontWeight: 700, px: 5, py: 1.7, borderRadius: 3, fontSize: "1rem",
              backdropFilter: "blur(4px)",
              "&:hover": { backgroundColor: "rgba(255,255,255,0.15)", borderColor: "white", transform: "translateY(-3px)" }, transition: "all 0.25s",
            }}>
              Contact Us
            </Button>
          </Box>
        </Container>
      </Box>

    </Box>
  );
};

export default About;
