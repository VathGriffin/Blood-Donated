import React, { useState, useEffect, useRef } from "react";
import {
  Container,
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  Grid,
  Chip,
  useTheme,
} from "@mui/material";
import { Link as RouterLink } from "react-router-dom";
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
import AOS from "aos";
import "aos/dist/aos.css";

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
    link: "/request",
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
  {
    icon: <PeopleIcon sx={{ fontSize: 36 }} />,
    value: 15000,
    suffix: "+",
    label: "Registered Donors",
    color: "#e53935",
  },
  {
    icon: <BloodtypeIcon sx={{ fontSize: 36 }} />,
    value: 7500,
    suffix: "+",
    label: "Units Available",
    color: "#8e24aa",
  },
  {
    icon: <LocalPharmacyIcon sx={{ fontSize: 36 }} />,
    value: 120,
    suffix: "+",
    label: "Hospitals Supported",
    color: "#3949ab",
  },
  {
    icon: <FavoriteIcon sx={{ fontSize: 36 }} />,
    value: 45000,
    suffix: "+",
    label: "Lives Saved",
    color: "#d81b60",
  },
];

const howItWorks = [
  {
    step: "01",
    icon: <HowToRegIcon sx={{ fontSize: 40, color: "#b71c1c" }} />,
    title: "Register as a Donor",
    desc: "Fill out our quick registration form with your basic information and blood type. Takes less than 2 minutes.",
  },
  {
    step: "02",
    icon: <ScienceIcon sx={{ fontSize: 40, color: "#ad1457" }} />,
    title: "Health Screening",
    desc: "Our team conducts a brief health check to ensure you're fit to donate. Your safety is our top priority.",
  },
  {
    step: "03",
    icon: <FavoriteBorderIcon sx={{ fontSize: 40, color: "#d81b60" }} />,
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
    quote:
      "Donating blood is the most meaningful thing I've ever done. This platform made it so easy to register and connect with hospitals.",
    author: "Sopheak M.",
    role: "Regular Donor",
    avatar: "SM",
  },
  {
    quote:
      "My son needed an emergency transfusion. Within hours, Blood Donated connected us with a matching donor. They saved his life.",
    author: "Chanthou K.",
    role: "Parent",
    avatar: "CK",
  },
  {
    quote:
      "As a hospital coordinator, this system has cut our blood sourcing time in half. The inventory management is outstanding.",
    author: "Dr. Dara P.",
    role: "Hospital Coordinator",
    avatar: "DP",
  },
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
      <Box
        sx={{
          width: 80,
          height: 80,
          borderRadius: "50%",
          mx: "auto",
          mb: 2,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: `${stat.color}22`,
          color: stat.color,
        }}
      >
        {stat.icon}
      </Box>
      <Typography variant="h4" fontWeight={800} sx={{ color: stat.color }}>
        {animate ? count.toLocaleString() : "0"}
        {stat.suffix}
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

  useEffect(() => {
    AOS.init({ duration: 900, once: true });
  }, []);

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
      {/* Urgent Banner */}
      <Box
        sx={{
          background: "linear-gradient(90deg, #7f0000 0%, #b71c1c 50%, #7f0000 100%)",
          color: "white",
          textAlign: "center",
          py: 1,
          px: 2,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 1.5,
        }}
      >
        <Box
          sx={{
            width: 10,
            height: 10,
            borderRadius: "50%",
            backgroundColor: "#ffeb3b",
            animation: "pulse 1.5s infinite",
            "@keyframes pulse": {
              "0%": { opacity: 1, transform: "scale(1)" },
              "50%": { opacity: 0.5, transform: "scale(1.4)" },
              "100%": { opacity: 1, transform: "scale(1)" },
            },
          }}
        />
        <Typography variant="body2" fontWeight={600}>
          URGENT: O- and AB- blood types critically needed — Donate today and save a life
        </Typography>
        <Button
          component={RouterLink}
          to="/donate"
          size="small"
          sx={{
            color: "#ffeb3b",
            border: "1px solid #ffeb3b",
            px: 1.5,
            py: 0.2,
            fontSize: "0.75rem",
            minWidth: 0,
            "&:hover": { backgroundColor: "rgba(255,235,59,0.15)" },
          }}
        >
          Donate
        </Button>
      </Box>

      {/* Hero Section */}
      <Box
        sx={{
          background: isDark
            ? "linear-gradient(135deg, #1a0000 0%, #2d0505 50%, #1a0000 100%)"
            : "linear-gradient(135deg, #b71c1c 0%, #c62828 40%, #7f0000 100%)",
          color: "white",
          pt: { xs: 10, md: 14 },
          pb: { xs: 8, md: 12 },
          px: 3,
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Decorative circles */}
        <Box sx={{
          position: "absolute", top: -60, right: -60, width: 300, height: 300,
          borderRadius: "50%", backgroundColor: "rgba(255,255,255,0.05)",
        }} />
        <Box sx={{
          position: "absolute", bottom: -80, left: -80, width: 400, height: 400,
          borderRadius: "50%", backgroundColor: "rgba(255,255,255,0.04)",
        }} />

        <Container maxWidth="lg" sx={{ position: "relative", zIndex: 1 }}>
          <Box
            sx={{
              display: "flex",
              flexDirection: { xs: "column", md: "row" },
              alignItems: "center",
              gap: 6,
            }}
          >
            <Box flex={1} data-aos="fade-right">
              <Chip
                label="🩸 Saving Lives Since 2024"
                sx={{
                  backgroundColor: "rgba(255,255,255,0.15)",
                  color: "white",
                  fontWeight: 600,
                  mb: 3,
                  backdropFilter: "blur(4px)",
                }}
              />
              <Typography
                variant="h2"
                component="h1"
                fontWeight={800}
                sx={{ lineHeight: 1.15, mb: 3, fontSize: { xs: "2.2rem", md: "3.2rem" } }}
              >
                Every Drop Counts.
                <br />
                <Box component="span" sx={{ color: "#ffcdd2" }}>
                  Be Someone's Hero.
                </Box>
              </Typography>
              <Typography variant="h6" sx={{ opacity: 0.9, mb: 4, lineHeight: 1.7, maxWidth: 520 }}>
                A centralized platform connecting blood donors with patients in
                need — streamlining donations, inventory, and hospital requests
                across Cambodia.
              </Typography>
              <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap" }}>
                <Button
                  variant="contained"
                  size="large"
                  component={RouterLink}
                  to="/donate"
                  sx={{
                    backgroundColor: "white",
                    color: "#b71c1c",
                    fontWeight: 700,
                    px: 4,
                    py: 1.5,
                    borderRadius: 3,
                    "&:hover": { backgroundColor: "#ffcdd2" },
                  }}
                >
                  BECOME A DONOR
                </Button>
                <Button
                  variant="outlined"
                  size="large"
                  component={RouterLink}
                  to="/request"
                  sx={{
                    borderColor: "white",
                    color: "white",
                    fontWeight: 700,
                    px: 4,
                    py: 1.5,
                    borderRadius: 3,
                    "&:hover": { backgroundColor: "rgba(255,255,255,0.15)", borderColor: "white" },
                  }}
                >
                  NEED BLOOD?
                </Button>
              </Box>
            </Box>

            {/* Animated blood drop visual */}
            <Box
              data-aos="fade-left"
              sx={{
                flex: "0 0 auto",
                display: { xs: "none", md: "flex" },
                flexDirection: "column",
                alignItems: "center",
                gap: 2,
              }}
            >
              <Box
                sx={{
                  width: 200,
                  height: 200,
                  borderRadius: "50% 50% 50% 50% / 60% 60% 40% 40%",
                  background: "rgba(255,255,255,0.2)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  animation: "heartbeat 2s ease infinite",
                  "@keyframes heartbeat": {
                    "0%": { transform: "scale(1)" },
                    "14%": { transform: "scale(1.06)" },
                    "28%": { transform: "scale(1)" },
                    "42%": { transform: "scale(1.06)" },
                    "70%": { transform: "scale(1)" },
                  },
                  backdropFilter: "blur(8px)",
                  border: "2px solid rgba(255,255,255,0.3)",
                }}
              >
                <Typography sx={{ fontSize: 80 }}>🩸</Typography>
              </Box>
              <Box sx={{ display: "flex", gap: 1 }}>
                {["A+", "B+", "O+", "AB+"].map((t) => (
                  <Chip
                    key={t}
                    label={t}
                    size="small"
                    sx={{ backgroundColor: "rgba(255,255,255,0.2)", color: "white", fontWeight: 700 }}
                  />
                ))}
              </Box>
            </Box>
          </Box>
        </Container>
      </Box>

      {/* Statistics Section */}
      <Box
        ref={statsRef}
        sx={{
          backgroundColor: isDark ? "#1a1a1a" : "#fff",
          py: 8,
          borderBottom: `1px solid ${isDark ? "#333" : "#eee"}`,
        }}
      >
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

      {/* Feature Cards */}
      <Box sx={{ backgroundColor: isDark ? "#121212" : "#f9f9f9", py: 10 }}>
        <Container maxWidth="lg">
          <Box textAlign="center" mb={7} data-aos="fade-up">
            <Typography variant="h4" fontWeight={700} color="error.main" gutterBottom>
              What Can You Do?
            </Typography>
            <Typography variant="body1" color="text.secondary" maxWidth={520} mx="auto">
              Whether you want to donate, request, or find donors — we've got you covered.
            </Typography>
          </Box>
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: { xs: "1fr", md: "repeat(3, 1fr)" },
              gap: 4,
            }}
          >
            {features.map((item, idx) => (
              <Card
                key={idx}
                data-aos="fade-up"
                data-aos-delay={idx * 100}
                sx={{
                  textAlign: "center",
                  p: 4,
                  borderRadius: 4,
                  boxShadow: 3,
                  transition: "0.3s ease",
                  backgroundColor: isDark ? item.darkBg : "#fff",
                  "&:hover": {
                    boxShadow: 8,
                    transform: "translateY(-8px)",
                  },
                }}
              >
                <Box
                  sx={{
                    width: 90,
                    height: 90,
                    borderRadius: "50%",
                    mx: "auto",
                    mb: 3,
                    backgroundColor: isDark ? "rgba(255,255,255,0.07)" : item.bg,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  {item.icon}
                </Box>
                <Typography variant="h6" fontWeight={700} gutterBottom>
                  {item.title}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 3, lineHeight: 1.7 }}>
                  {item.desc}
                </Typography>
                <Button
                  variant="contained"
                  color="error"
                  size="small"
                  component={RouterLink}
                  to={item.link}
                  sx={{ borderRadius: 3, px: 3 }}
                >
                  {item.label}
                </Button>
              </Card>
            ))}
          </Box>
        </Container>
      </Box>

      {/* How It Works */}
      <Box sx={{ backgroundColor: isDark ? "#1a1a1a" : "#fff", py: 10 }}>
        <Container maxWidth="lg">
          <Box textAlign="center" mb={7} data-aos="fade-up">
            <Typography variant="h4" fontWeight={700} color="error.main" gutterBottom>
              How It Works
            </Typography>
            <Typography variant="body1" color="text.secondary" maxWidth={520} mx="auto">
              Getting started as a donor is simple. Follow these three easy steps.
            </Typography>
          </Box>
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: { xs: "1fr", md: "repeat(3, 1fr)" },
              gap: 4,
              position: "relative",
            }}
          >
            {howItWorks.map((step, idx) => (
              <Box
                key={idx}
                data-aos="fade-up"
                data-aos-delay={idx * 150}
                sx={{ textAlign: "center", position: "relative" }}
              >
                <Box
                  sx={{
                    position: "relative",
                    width: 90,
                    height: 90,
                    mx: "auto",
                    mb: 3,
                  }}
                >
                  <Box
                    sx={{
                      width: 90,
                      height: 90,
                      borderRadius: "50%",
                      backgroundColor: isDark ? "#2d1515" : "#fdecea",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    {step.icon}
                  </Box>
                  <Box
                    sx={{
                      position: "absolute",
                      top: -6,
                      right: -6,
                      width: 28,
                      height: 28,
                      borderRadius: "50%",
                      backgroundColor: "#b71c1c",
                      color: "white",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: "0.72rem",
                      fontWeight: 800,
                    }}
                  >
                    {step.step}
                  </Box>
                </Box>
                <Typography variant="h6" fontWeight={700} gutterBottom>
                  {step.title}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.7 }}>
                  {step.desc}
                </Typography>
              </Box>
            ))}
          </Box>
        </Container>
      </Box>

      {/* Blood Type Compatibility */}
      <Box
        sx={{
          background: isDark
            ? "linear-gradient(135deg, #1a0000 0%, #2d0505 100%)"
            : "linear-gradient(135deg, #b71c1c 0%, #7f0000 100%)",
          py: 10,
          color: "white",
        }}
      >
        <Container maxWidth="lg">
          <Box textAlign="center" mb={7} data-aos="fade-up">
            <Typography variant="h4" fontWeight={700} gutterBottom>
              Blood Type Compatibility
            </Typography>
            <Typography variant="body1" sx={{ opacity: 0.85 }}>
              Find out which blood types you can donate to and receive from.
            </Typography>
          </Box>
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: { xs: "repeat(2, 1fr)", sm: "repeat(4, 1fr)" },
              gap: 2,
            }}
          >
            {bloodTypes.map((bt, idx) => (
              <Box
                key={idx}
                data-aos="zoom-in"
                data-aos-delay={idx * 50}
                sx={{
                  backgroundColor: "rgba(255,255,255,0.12)",
                  backdropFilter: "blur(6px)",
                  borderRadius: 3,
                  p: 2.5,
                  textAlign: "center",
                  border: "1px solid rgba(255,255,255,0.2)",
                  transition: "0.3s",
                  "&:hover": {
                    backgroundColor: "rgba(255,255,255,0.2)",
                    transform: "translateY(-4px)",
                  },
                }}
              >
                <Typography variant="h5" fontWeight={800} sx={{ color: "#ffcdd2", mb: 1 }}>
                  {bt.type}
                </Typography>
                <Typography variant="caption" sx={{ display: "block", opacity: 0.8, mb: 0.5 }}>
                  Can donate to:
                </Typography>
                <Typography variant="body2" fontWeight={600} sx={{ mb: 1 }}>
                  {bt.patients}
                </Typography>
                <Typography variant="caption" sx={{ display: "block", opacity: 0.8, mb: 0.5 }}>
                  Can receive from:
                </Typography>
                <Typography variant="body2" fontWeight={600}>
                  {bt.donors}
                </Typography>
              </Box>
            ))}
          </Box>
        </Container>
      </Box>

      {/* Testimonials */}
      <Box sx={{ backgroundColor: isDark ? "#121212" : "#f9f9f9", py: 10 }}>
        <Container maxWidth="lg">
          <Box textAlign="center" mb={7} data-aos="fade-up">
            <Typography variant="h4" fontWeight={700} color="error.main" gutterBottom>
              Stories That Inspire
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Real stories from our donor and patient community.
            </Typography>
          </Box>
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: { xs: "1fr", md: "repeat(3, 1fr)" },
              gap: 4,
            }}
          >
            {testimonials.map((t, idx) => (
              <Card
                key={idx}
                data-aos="fade-up"
                data-aos-delay={idx * 120}
                sx={{
                  p: 3,
                  borderRadius: 4,
                  boxShadow: 3,
                  position: "relative",
                  transition: "0.3s",
                  "&:hover": { boxShadow: 7, transform: "translateY(-5px)" },
                }}
              >
                <FormatQuoteIcon
                  sx={{ fontSize: 48, color: "#fdecea", position: "absolute", top: 12, left: 12 }}
                />
                <CardContent sx={{ pt: 4 }}>
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{ lineHeight: 1.8, fontStyle: "italic", mb: 3 }}
                  >
                    "{t.quote}"
                  </Typography>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                    <Box
                      sx={{
                        width: 44,
                        height: 44,
                        borderRadius: "50%",
                        backgroundColor: "#b71c1c",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        color: "white",
                        fontWeight: 700,
                        fontSize: "0.85rem",
                        flexShrink: 0,
                      }}
                    >
                      {t.avatar}
                    </Box>
                    <Box>
                      <Typography variant="body2" fontWeight={700}>
                        {t.author}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {t.role}
                      </Typography>
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            ))}
          </Box>
        </Container>
      </Box>

      {/* CTA Banner */}
      <Box
        sx={{
          background: isDark
            ? "linear-gradient(135deg, #2d0505 0%, #1a0000 100%)"
            : "linear-gradient(135deg, #c62828 0%, #b71c1c 100%)",
          color: "white",
          py: 10,
          textAlign: "center",
        }}
        data-aos="fade-up"
      >
        <Container maxWidth="md">
          <CheckCircleOutlineIcon sx={{ fontSize: 56, mb: 2, opacity: 0.9 }} />
          <Typography variant="h4" fontWeight={700} gutterBottom>
            Ready to Save a Life?
          </Typography>
          <Typography variant="h6" sx={{ opacity: 0.88, mb: 5, lineHeight: 1.7 }}>
            Join 15,000+ registered donors in Cambodia. Your single donation
            could be the difference between life and death for someone today.
          </Typography>
          <Box sx={{ display: "flex", justifyContent: "center", gap: 2, flexWrap: "wrap" }}>
            <Button
              variant="contained"
              size="large"
              component={RouterLink}
              to="/donate"
              sx={{
                backgroundColor: "white",
                color: "#b71c1c",
                fontWeight: 700,
                px: 5,
                py: 1.5,
                borderRadius: 3,
                "&:hover": { backgroundColor: "#ffcdd2" },
              }}
            >
              BECOME A DONOR
            </Button>
            <Button
              variant="outlined"
              size="large"
              component={RouterLink}
              to="/about"
              sx={{
                borderColor: "rgba(255,255,255,0.7)",
                color: "white",
                fontWeight: 700,
                px: 5,
                py: 1.5,
                borderRadius: 3,
                "&:hover": { backgroundColor: "rgba(255,255,255,0.1)", borderColor: "white" },
              }}
            >
              LEARN MORE
            </Button>
          </Box>
        </Container>
      </Box>

    </Box>
  );
};

export default Home;
