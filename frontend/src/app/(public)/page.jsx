'use client';
import Link from 'next/link';
import React, { useState, useEffect, useRef } from "react";
import {
  Container, Box, Typography, Button, Card, CardContent,
  Grid, Chip, useTheme, Divider,
} from "@mui/material";
import VolunteerActivismIcon from "@mui/icons-material/VolunteerActivism";
import LocalHospitalIcon from "@mui/icons-material/LocalHospital";
import FavoriteIcon from "@mui/icons-material/Favorite";
import PeopleIcon from "@mui/icons-material/People";
import BloodtypeIcon from "@mui/icons-material/Bloodtype";
import LocalPharmacyIcon from "@mui/icons-material/LocalPharmacy";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import HowToRegIcon from "@mui/icons-material/HowToReg";
import ScienceIcon from "@mui/icons-material/Science";
import FavoriteBorderIcon from "@mui/icons-material/FavoriteBorder";
import FormatQuoteIcon from "@mui/icons-material/FormatQuote";
import VerifiedIcon from "@mui/icons-material/Verified";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import SecurityIcon from "@mui/icons-material/Security";
import AOS from "aos";
import "aos/dist/aos.css";

// ── Photo URLs (Unsplash CDN) ───────────────────────────────────────────────
const HERO_IMG =
  "https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?auto=format&fit=crop&w=1920&q=80";
const CTA_IMG =
  "https://images.unsplash.com/photo-1579154204601-01588f351e67?auto=format&fit=crop&w=1920&q=80";
const HOW_IMG =
  "https://images.unsplash.com/photo-1576091160550-2173dba999ef?auto=format&fit=crop&w=1920&q=80";

const features = [
  {
    icon: <VolunteerActivismIcon sx={{ fontSize: 36, color: "#b71c1c" }} />,
    title: "Donate Blood",
    desc: "Register now and become someone's hero today. Your single donation can save up to 3 lives.",
    link: "/donate",
    label: "DONATE NOW",
    bg: "#fdecea",
    darkBg: "#3d1515",
  },
  {
    icon: <LocalHospitalIcon sx={{ fontSize: 36, color: "#ad1457" }} />,
    title: "Request Blood",
    desc: "Submit your blood request and get immediate assistance from our verified donor network.",
    link: "/requests",
    label: "REQUEST NOW",
    bg: "#f3e5f5",
    darkBg: "#2d1530",
  },
  {
    icon: <FavoriteIcon sx={{ fontSize: 36, color: "#d81b60" }} />,
    title: "Find Donors",
    desc: "Browse our verified donor community and filter by blood type to find the perfect match.",
    link: "/donors",
    label: "VIEW DONORS",
    bg: "#fce4ec",
    darkBg: "#2d1520",
  },
];

const statistics = [
  { icon: <PeopleIcon sx={{ fontSize: 36 }} />, value: 15000, suffix: "+", label: "Registered Donors", color: "#e53935" },
  { icon: <BloodtypeIcon sx={{ fontSize: 36 }} />, value: 7500, suffix: "+", label: "Units Available", color: "#8e24aa" },
  { icon: <LocalPharmacyIcon sx={{ fontSize: 36 }} />, value: 120, suffix: "+", label: "Hospitals Supported", color: "#3949ab" },
  { icon: <FavoriteIcon sx={{ fontSize: 36 }} />, value: 45000, suffix: "+", label: "Lives Saved", color: "#d81b60" },
];

const howItWorks = [
  {
    step: "01",
    icon: <HowToRegIcon sx={{ fontSize: 40, color: "#fff" }} />,
    title: "Register as a Donor",
    desc: "Fill out our quick registration form with your basic information and blood type. Takes less than 2 minutes.",
  },
  {
    step: "02",
    icon: <ScienceIcon sx={{ fontSize: 40, color: "#fff" }} />,
    title: "Health Screening",
    desc: "Our team conducts a brief health check to ensure you're fit to donate. Your safety is our top priority.",
  },
  {
    step: "03",
    icon: <FavoriteBorderIcon sx={{ fontSize: 40, color: "#fff" }} />,
    title: "Save a Life",
    desc: "Donate blood at one of our partner hospitals or collection drives. One donation can save up to 3 lives.",
  },
];

const bloodTypes = [
  { type: "A+", donors: "A+, A-, O+, O-", patients: "A+, AB+" },
  { type: "B+", donors: "B+, B-, O+, O-", patients: "B+, AB+" },
  { type: "O+", donors: "O+, O-", patients: "A+, B+, O+, AB+" },
  { type: "O-", donors: "O-", patients: "Everyone" },
  { type: "AB+", donors: "Everyone", patients: "AB+" },
  { type: "A-", donors: "A-, O-", patients: "A+, A-, AB+, AB-" },
  { type: "B-", donors: "B-, O-", patients: "B+, B-, AB+, AB-" },
  { type: "AB-", donors: "AB-, A-, B-, O-", patients: "AB+, AB-" },
];

const testimonials = [
  {
    quote: "Donating blood is the most meaningful thing I've ever done. This platform made it so easy to register and connect with hospitals.",
    author: "Sopheak M.",
    role: "Regular Donor",
    avatar: "SM",
  },
  {
    quote: "My son needed an emergency transfusion. Within hours, Blood Donated connected us with a matching donor. They saved his life.",
    author: "Chanthou K.",
    role: "Parent",
    avatar: "CK",
  },
  {
    quote: "As a hospital coordinator, this system has cut our blood sourcing time in half. The inventory management is outstanding.",
    author: "Dr. Dara P.",
    role: "Hospital Coordinator",
    avatar: "DP",
  },
];

const trustBadges = [
  { icon: <VerifiedIcon sx={{ fontSize: 18 }} />, label: "Verified Donors" },
  { icon: <AccessTimeIcon sx={{ fontSize: 18 }} />, label: "24/7 Support" },
  { icon: <SecurityIcon sx={{ fontSize: 18 }} />, label: "Secure & Private" },
  { icon: <LocalPharmacyIcon sx={{ fontSize: 18 }} />, label: "120+ Hospitals" },
];

function useCountUp(target, duration = 2000, start = false) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    if (!start) return;
    let startTime = null;
    const step = (timestamp) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);
      setCount(Math.floor(progress * target));
      if (progress < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [target, duration, start]);
  return count;
}

function StatCard({ stat, animate }) {
  const count = useCountUp(stat.value, 1800, animate);
  return (
    <Box textAlign="center" data-aos="zoom-in">
      <Box sx={{
        width: 80, height: 80, borderRadius: "50%", mx: "auto", mb: 2,
        display: "flex", alignItems: "center", justifyContent: "center",
        backgroundColor: `${stat.color}22`, color: stat.color,
      }}>
        {stat.icon}
      </Box>
      <Typography variant="h4" fontWeight={800} sx={{ color: stat.color }}>
        {animate ? count.toLocaleString() : "0"}{stat.suffix}
      </Typography>
      <Typography variant="body2" color="text.secondary" fontWeight={500}>
        {stat.label}
      </Typography>
    </Box>
  );
}

const Home = () => {
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";
  const [statsVisible, setStatsVisible] = useState(false);
  const statsRef = useRef(null);

  useEffect(() => { AOS.init({ duration: 900, once: true }); }, []);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setStatsVisible(true); },
      { threshold: 0.3 }
    );
    if (statsRef.current) observer.observe(statsRef.current);
    return () => observer.disconnect();
  }, []);

  return (
    <Box>

      {/* ── Hero — Photo Background ────────────────────────────────────────── */}
      <Box sx={{
        position: "relative",
        minHeight: { xs: "100vh", md: "95vh" },
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        backgroundImage: `url('${HERO_IMG}')`,
        backgroundSize: "cover",
        backgroundPosition: "center top",
        backgroundAttachment: { xs: "scroll", md: "fixed" },
        "&::before": {
          content: '""',
          position: "absolute",
          inset: 0,
          background: isDark
            ? "linear-gradient(135deg, rgba(10,0,0,0.92) 0%, rgba(80,0,0,0.82) 50%, rgba(0,0,0,0.88) 100%)"
            : "linear-gradient(135deg, rgba(100,0,0,0.88) 0%, rgba(183,28,28,0.80) 50%, rgba(40,0,0,0.85) 100%)",
          zIndex: 1,
        },
      }}>
        <Container maxWidth="lg" sx={{ position: "relative", zIndex: 2, pt: { xs: 14, md: 10 }, pb: { xs: 8, md: 8 } }}>
          <Box sx={{ display: "flex", flexDirection: { xs: "column", md: "row" }, alignItems: "center", gap: 6 }}>

            {/* Left: Text */}
            <Box flex={1} data-aos="fade-right">
              <Chip
                label="🏥 Cambodia's Blood Donation Platform"
                sx={{ backgroundColor: "rgba(255,255,255,0.15)", color: "white", fontWeight: 700, mb: 3, backdropFilter: "blur(4px)", fontSize: "0.82rem" }}
              />
              <Typography variant="h2" component="h1" fontWeight={800} color="white"
                sx={{ lineHeight: 1.12, mb: 2, fontSize: { xs: "2.4rem", md: "3.4rem" }, textShadow: "0 2px 20px rgba(0,0,0,0.5)" }}>
                Every Drop Counts.
              </Typography>
              <Typography variant="h2" component="p" fontWeight={800}
                sx={{ lineHeight: 1.12, mb: 3, fontSize: { xs: "2.4rem", md: "3.4rem" }, color: "#ffcdd2", textShadow: "0 2px 20px rgba(0,0,0,0.5)" }}>
                Be Someone's Hero.
              </Typography>
              <Typography variant="h6" sx={{ color: "rgba(255,255,255,0.88)", mb: 4, lineHeight: 1.75, maxWidth: 540, fontWeight: 400 }}>
                A centralized platform connecting blood donors with patients in need —
                streamlining donations, inventory, and hospital requests across Cambodia.
              </Typography>

              <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap", mb: 5 }}>
                <Button
                  variant="contained" size="large" component={Link} href="/donate"
                  sx={{
                    backgroundColor: "white", color: "#b71c1c", fontWeight: 800,
                    px: 4.5, py: 1.6, borderRadius: 3, fontSize: "1rem",
                    boxShadow: "0 8px 32px rgba(0,0,0,0.35)",
                    "&:hover": { backgroundColor: "#ffcdd2", transform: "translateY(-2px)", boxShadow: "0 12px 40px rgba(0,0,0,0.4)" },
                    transition: "all 0.25s ease",
                  }}>
                  BECOME A DONOR
                </Button>
                <Button
                  variant="outlined" size="large" component={Link} href="/requests"
                  sx={{
                    borderColor: "rgba(255,255,255,0.7)", color: "white", fontWeight: 700,
                    px: 4.5, py: 1.6, borderRadius: 3, fontSize: "1rem",
                    backdropFilter: "blur(4px)",
                    "&:hover": { backgroundColor: "rgba(255,255,255,0.15)", borderColor: "white", transform: "translateY(-2px)" },
                    transition: "all 0.25s ease",
                  }}>
                  NEED BLOOD?
                </Button>
              </Box>

              {/* Trust badges */}
              <Box sx={{ display: "flex", flexWrap: "wrap", gap: 2 }}>
                {trustBadges.map((b, i) => (
                  <Box key={i} sx={{ display: "flex", alignItems: "center", gap: 0.7, color: "rgba(255,255,255,0.75)", fontSize: "0.83rem" }}>
                    {b.icon}
                    <Typography variant="body2" sx={{ color: "rgba(255,255,255,0.75)", fontWeight: 600 }}>
                      {b.label}
                    </Typography>
                  </Box>
                ))}
              </Box>
            </Box>

            {/* Right: Stats card */}
            <Box data-aos="fade-left" sx={{
              flex: "0 0 auto", display: { xs: "none", md: "block" },
              backgroundColor: "rgba(255,255,255,0.10)",
              backdropFilter: "blur(16px)",
              border: "1px solid rgba(255,255,255,0.2)",
              borderRadius: 4, p: 3.5, minWidth: 260,
            }}>
              <Typography variant="subtitle2" fontWeight={800} color="rgba(255,255,255,0.7)" letterSpacing="0.1em" mb={2.5} sx={{ textTransform: "uppercase" }}>
                Live Impact
              </Typography>
              {[
                { label: "Donors Online", value: "1,243", color: "#ff8a80" },
                { label: "Requests Today", value: "38", color: "#ffcdd2" },
                { label: "Lives Saved", value: "45,000+", color: "#f48fb1" },
                { label: "Hospitals", value: "120+", color: "#ef9a9a" },
              ].map((item, i) => (
                <Box key={i}>
                  <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", py: 1.2 }}>
                    <Typography variant="body2" sx={{ color: "rgba(255,255,255,0.75)", fontWeight: 500 }}>{item.label}</Typography>
                    <Typography variant="body1" fontWeight={800} sx={{ color: item.color }}>{item.value}</Typography>
                  </Box>
                  {i < 3 && <Divider sx={{ borderColor: "rgba(255,255,255,0.1)" }} />}
                </Box>
              ))}
              <Button
                fullWidth component={Link} href="/appointments" variant="contained"
                sx={{ mt: 2.5, bgcolor: "#b71c1c", borderRadius: 3, fontWeight: 700, py: 1.2, "&:hover": { bgcolor: "#9a1515" } }}>
                Book Appointment
              </Button>
            </Box>
          </Box>
        </Container>

        {/* Scroll indicator */}
        <Box sx={{
          position: "absolute", bottom: 28, left: "50%", transform: "translateX(-50%)", zIndex: 2,
          display: "flex", flexDirection: "column", alignItems: "center", gap: 1,
        }}>
          <Typography variant="caption" sx={{ color: "rgba(255,255,255,0.5)", letterSpacing: "0.12em", textTransform: "uppercase", fontSize: "0.7rem" }}>
            Scroll Down
          </Typography>
          <Box sx={{
            width: 24, height: 38, borderRadius: 12, border: "2px solid rgba(255,255,255,0.35)",
            display: "flex", justifyContent: "center", pt: 1,
          }}>
            <Box sx={{
              width: 4, height: 8, borderRadius: 2, backgroundColor: "rgba(255,255,255,0.7)",
              animation: "scrollDot 1.8s ease infinite",
              "@keyframes scrollDot": {
                "0%": { opacity: 1, transform: "translateY(0)" },
                "100%": { opacity: 0, transform: "translateY(12px)" },
              },
            }} />
          </Box>
        </Box>
      </Box>

      {/* ── Statistics ─────────────────────────────────────────────────────── */}
      <Box ref={statsRef} sx={{
        backgroundColor: isDark ? "#1a1a1a" : "#fff", py: 8,
        borderBottom: `1px solid ${isDark ? "#333" : "#eee"}`,
        boxShadow: isDark ? "none" : "0 4px 24px rgba(0,0,0,0.06)",
      }}>
        <Container maxWidth="lg">
          <Grid container spacing={4} justifyContent="center">
            {statistics.map((stat, idx) => (
              <Grid item xs={6} sm={3} key={idx}>
                <StatCard stat={stat} animate={statsVisible} />
              </Grid>
            ))}
          </Grid>
        </Container>
      </Box>

      {/* ── Feature Cards ─────────────────────────────────────────────────── */}
      <Box sx={{ backgroundColor: isDark ? "#121212" : "#f9f9f9", py: 10 }}>
        <Container maxWidth="lg">
          <Box textAlign="center" mb={7} data-aos="fade-up">
            <Typography variant="overline" color="error" fontWeight={700} letterSpacing="0.15em">Our Services</Typography>
            <Typography variant="h4" fontWeight={700} color={isDark ? "white" : "text.primary"} gutterBottom mt={0.5}>
              What Can You Do?
            </Typography>
            <Typography variant="body1" color="text.secondary" maxWidth={520} mx="auto">
              Whether you want to donate, request, or find donors — we've got you covered.
            </Typography>
          </Box>
          <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "repeat(3, 1fr)" }, gap: 4 }}>
            {features.map((item, idx) => (
              <Card key={idx} data-aos="fade-up" data-aos-delay={idx * 100} sx={{
                textAlign: "center", p: 4, borderRadius: 4, boxShadow: 3, transition: "0.3s ease",
                backgroundColor: isDark ? item.darkBg : "#fff",
                "&:hover": { boxShadow: 10, transform: "translateY(-10px)" },
              }}>
                <Box sx={{
                  width: 90, height: 90, borderRadius: "50%", mx: "auto", mb: 3,
                  backgroundColor: isDark ? "rgba(255,255,255,0.07)" : item.bg,
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}>
                  {item.icon}
                </Box>
                <Typography variant="h6" fontWeight={700} gutterBottom>{item.title}</Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 3, lineHeight: 1.7 }}>{item.desc}</Typography>
                <Button variant="contained" color="error" size="small" component={Link} href={item.link} sx={{ borderRadius: 3, px: 3 }}>
                  {item.label}
                </Button>
              </Card>
            ))}
          </Box>
        </Container>
      </Box>

      {/* ── How It Works — Photo Background ───────────────────────────────── */}
      <Box sx={{
        position: "relative",
        py: 12,
        backgroundImage: `url('${HOW_IMG}')`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundAttachment: { xs: "scroll", md: "fixed" },
        "&::before": {
          content: '""',
          position: "absolute",
          inset: 0,
          background: "linear-gradient(135deg, rgba(10,10,10,0.92) 0%, rgba(60,0,0,0.88) 100%)",
        },
      }}>
        <Container maxWidth="lg" sx={{ position: "relative", zIndex: 1 }}>
          <Box textAlign="center" mb={8} data-aos="fade-up">
            <Typography variant="overline" sx={{ color: "#ffcdd2", fontWeight: 700, letterSpacing: "0.15em" }}>
              Simple Process
            </Typography>
            <Typography variant="h4" fontWeight={700} color="white" mt={0.5} gutterBottom>
              How It Works
            </Typography>
            <Typography variant="body1" sx={{ color: "rgba(255,255,255,0.7)", maxWidth: 500, mx: "auto" }}>
              Getting started as a donor is simple. Follow these three easy steps.
            </Typography>
          </Box>
          <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "repeat(3, 1fr)" }, gap: 4 }}>
            {howItWorks.map((step, idx) => (
              <Box key={idx} data-aos="fade-up" data-aos-delay={idx * 150} sx={{
                textAlign: "center",
                backgroundColor: "rgba(255,255,255,0.07)",
                backdropFilter: "blur(10px)",
                border: "1px solid rgba(255,255,255,0.12)",
                borderRadius: 4,
                p: 4,
                transition: "0.3s",
                "&:hover": { backgroundColor: "rgba(183,28,28,0.3)", transform: "translateY(-6px)" },
              }}>
                <Box sx={{ position: "relative", width: 90, height: 90, mx: "auto", mb: 3 }}>
                  <Box sx={{
                    width: 90, height: 90, borderRadius: "50%",
                    background: "linear-gradient(135deg, #b71c1c 0%, #d32f2f 100%)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    boxShadow: "0 8px 24px rgba(183,28,28,0.45)",
                  }}>
                    {step.icon}
                  </Box>
                  <Box sx={{
                    position: "absolute", top: -6, right: -6, width: 30, height: 30,
                    borderRadius: "50%", backgroundColor: "#fff", color: "#b71c1c",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: "0.7rem", fontWeight: 900, boxShadow: "0 2px 8px rgba(0,0,0,0.3)",
                  }}>
                    {step.step}
                  </Box>
                </Box>
                <Typography variant="h6" fontWeight={700} color="white" gutterBottom>{step.title}</Typography>
                <Typography variant="body2" sx={{ color: "rgba(255,255,255,0.72)", lineHeight: 1.75 }}>{step.desc}</Typography>
              </Box>
            ))}
          </Box>
        </Container>
      </Box>

      {/* ── Blood Type Compatibility ───────────────────────────────────────── */}
      <Box sx={{
        background: isDark
          ? "linear-gradient(135deg, #1a0000 0%, #2d0505 100%)"
          : "linear-gradient(135deg, #b71c1c 0%, #7f0000 100%)",
        py: 10, color: "white",
      }}>
        <Container maxWidth="lg">
          <Box textAlign="center" mb={7} data-aos="fade-up">
            <Typography variant="overline" sx={{ color: "#ffcdd2", fontWeight: 700, letterSpacing: "0.15em" }}>
              Compatibility Guide
            </Typography>
            <Typography variant="h4" fontWeight={700} gutterBottom mt={0.5}>Blood Type Compatibility</Typography>
            <Typography variant="body1" sx={{ opacity: 0.85 }}>
              Find out which blood types you can donate to and receive from.
            </Typography>
          </Box>
          <Box sx={{ display: "grid", gridTemplateColumns: { xs: "repeat(2, 1fr)", sm: "repeat(4, 1fr)" }, gap: 2 }}>
            {bloodTypes.map((bt, idx) => (
              <Box key={idx} data-aos="zoom-in" data-aos-delay={idx * 50} sx={{
                backgroundColor: "rgba(255,255,255,0.12)", backdropFilter: "blur(6px)",
                borderRadius: 3, p: 2.5, textAlign: "center",
                border: "1px solid rgba(255,255,255,0.2)", transition: "0.3s",
                "&:hover": { backgroundColor: "rgba(255,255,255,0.22)", transform: "translateY(-4px)" },
              }}>
                <Typography variant="h5" fontWeight={800} sx={{ color: "#ffcdd2", mb: 1 }}>{bt.type}</Typography>
                <Typography variant="caption" sx={{ display: "block", opacity: 0.75, mb: 0.4 }}>Can donate to:</Typography>
                <Typography variant="body2" fontWeight={600} sx={{ mb: 1 }}>{bt.patients}</Typography>
                <Typography variant="caption" sx={{ display: "block", opacity: 0.75, mb: 0.4 }}>Can receive from:</Typography>
                <Typography variant="body2" fontWeight={600}>{bt.donors}</Typography>
              </Box>
            ))}
          </Box>
        </Container>
      </Box>

      {/* ── Testimonials ──────────────────────────────────────────────────── */}
      <Box sx={{ backgroundColor: isDark ? "#121212" : "#f9f9f9", py: 10 }}>
        <Container maxWidth="lg">
          <Box textAlign="center" mb={7} data-aos="fade-up">
            <Typography variant="overline" color="error" fontWeight={700} letterSpacing="0.15em">Community</Typography>
            <Typography variant="h4" fontWeight={700} color={isDark ? "white" : "text.primary"} mt={0.5} gutterBottom>
              Stories That Inspire
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Real stories from our donor and patient community.
            </Typography>
          </Box>
          <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "repeat(3, 1fr)" }, gap: 4 }}>
            {testimonials.map((t, idx) => (
              <Card key={idx} data-aos="fade-up" data-aos-delay={idx * 120} sx={{
                p: 3, borderRadius: 4, boxShadow: 3, position: "relative", transition: "0.3s",
                "&:hover": { boxShadow: 7, transform: "translateY(-5px)" },
              }}>
                <FormatQuoteIcon sx={{ fontSize: 48, color: "#fdecea", position: "absolute", top: 12, left: 12 }} />
                <CardContent sx={{ pt: 4 }}>
                  <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.8, fontStyle: "italic", mb: 3 }}>
                    "{t.quote}"
                  </Typography>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                    <Box sx={{
                      width: 44, height: 44, borderRadius: "50%", backgroundColor: "#b71c1c",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      color: "white", fontWeight: 700, fontSize: "0.85rem", flexShrink: 0,
                    }}>
                      {t.avatar}
                    </Box>
                    <Box>
                      <Typography variant="body2" fontWeight={700}>{t.author}</Typography>
                      <Typography variant="caption" color="text.secondary">{t.role}</Typography>
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            ))}
          </Box>
        </Container>
      </Box>

      {/* ── CTA — Photo Background ────────────────────────────────────────── */}
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
          <CheckCircleOutlineIcon sx={{ fontSize: 60, mb: 2, color: "#ffcdd2" }} />
          <Typography variant="h3" fontWeight={800} color="white" gutterBottom sx={{ textShadow: "0 2px 20px rgba(0,0,0,0.5)" }}>
            Ready to Save a Life?
          </Typography>
          <Typography variant="h6" sx={{ color: "rgba(255,255,255,0.85)", mb: 6, lineHeight: 1.75, maxWidth: 560, mx: "auto", fontWeight: 400 }}>
            Join 15,000+ registered donors in Cambodia. Your single donation
            could be the difference between life and death for someone today.
          </Typography>
          <Box sx={{ display: "flex", justifyContent: "center", gap: 2.5, flexWrap: "wrap" }}>
            <Button variant="contained" size="large" component={Link} href="/donate" sx={{
              backgroundColor: "white", color: "#b71c1c", fontWeight: 800, px: 5, py: 1.7, borderRadius: 3, fontSize: "1rem",
              boxShadow: "0 8px 32px rgba(0,0,0,0.4)",
              "&:hover": { backgroundColor: "#ffcdd2", transform: "translateY(-3px)" },
              transition: "all 0.25s ease",
            }}>
              BECOME A DONOR
            </Button>
            <Button variant="outlined" size="large" component={Link} href="/appointments" sx={{
              borderColor: "rgba(255,255,255,0.7)", color: "white", fontWeight: 700, px: 5, py: 1.7, borderRadius: 3, fontSize: "1rem",
              backdropFilter: "blur(4px)",
              "&:hover": { backgroundColor: "rgba(255,255,255,0.15)", borderColor: "white", transform: "translateY(-3px)" },
              transition: "all 0.25s ease",
            }}>
              BOOK APPOINTMENT
            </Button>
          </Box>
        </Container>
      </Box>

    </Box>
  );
};

export default Home;
