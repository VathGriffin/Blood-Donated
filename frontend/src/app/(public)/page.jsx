'use client';
import Link from 'next/link';
import React, { useState, useEffect, useRef } from "react";
import { Container, Box, Typography, Button, useTheme } from "@mui/material";
import FavoriteIcon from "@mui/icons-material/Favorite";
import LocalHospitalIcon from "@mui/icons-material/LocalHospital";
import GroupsIcon from "@mui/icons-material/Groups";
import PeopleIcon from "@mui/icons-material/People";
import BloodtypeIcon from "@mui/icons-material/Bloodtype";
import LocalPharmacyIcon from "@mui/icons-material/LocalPharmacy";
import HowToRegIcon from "@mui/icons-material/HowToReg";
import ScienceIcon from "@mui/icons-material/Science";
import FavoriteBorderIcon from "@mui/icons-material/FavoriteBorder";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import VerifiedIcon from "@mui/icons-material/Verified";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import ShieldIcon from "@mui/icons-material/Shield";
import FormatQuoteIcon from "@mui/icons-material/FormatQuote";

const stats = [
  { icon: <PeopleIcon />,        value: 15230, suffix: "+", label: "Registered Donors" },
  { icon: <BloodtypeIcon />,     value: 7540,  suffix: "+", label: "Units Collected" },
  { icon: <LocalPharmacyIcon />, value: 126,   suffix: "+", label: "Partner Hospitals" },
  { icon: <FavoriteIcon />,      value: 24300, suffix: "+", label: "Lives Saved" },
];

const actions = [
  {
    icon: <FavoriteIcon sx={{ fontSize: 26 }} />,
    title: "Donate Blood",
    desc: "Schedule an appointment at a nearby center and donate in under an hour.",
    link: "/donate",
    red: false,
  },
  {
    icon: <LocalHospitalIcon sx={{ fontSize: 26 }} />,
    title: "Request Blood",
    desc: "Submit an urgent request for a patient who needs blood now.",
    link: "/requests",
    red: true,
  },
  {
    icon: <GroupsIcon sx={{ fontSize: 26 }} />,
    title: "Volunteer",
    desc: "Join our network of volunteers and help run donation drives.",
    link: "/team",
    red: false,
  },
  {
    icon: <FavoriteBorderIcon sx={{ fontSize: 26 }} />,
    title: "Learn More",
    desc: "Explore eligibility, blood types, and the impact of your donation.",
    link: "/about",
    red: false,
  },
];

const steps = [
  {
    num: "01",
    icon: <HowToRegIcon sx={{ fontSize: 24, color: "#dc2626" }} />,
    title: "Register Online",
    desc: "Fill out a quick 2-minute form with your details and blood type.",
  },
  {
    num: "02",
    icon: <ScienceIcon sx={{ fontSize: 24, color: "#dc2626" }} />,
    title: "Health Screening",
    desc: "A brief check by our medical staff to confirm you're fit to donate.",
  },
  {
    num: "03",
    icon: <FavoriteIcon sx={{ fontSize: 24, color: "#dc2626" }} />,
    title: "Donate & Save",
    desc: "The donation takes just 8–10 minutes. One bag can save up to 3 lives.",
  },
];

const testimonials = [
  {
    quote: "I donated for the first time last year. The process was so smooth — I was in and out in 45 minutes. Knowing someone is alive because of me is incredible.",
    name: "Sophea Meas",
    role: "First-time Donor",
    initials: "SM",
    color: "#dc2626",
  },
  {
    quote: "My daughter needed O- blood after surgery. BloodLife connected us to a donor within 2 hours. I can never repay that kindness.",
    name: "Dara Keo",
    role: "Grateful Parent",
    initials: "DK",
    color: "#b91c1c",
  },
  {
    quote: "As a medical professional, I recommend BloodLife to all my patients' families. The platform is reliable, fast, and trustworthy.",
    name: "Dr. Chan Bopha",
    role: "Cardiologist, Calmette Hospital",
    initials: "CB",
    color: "#991b1b",
  },
];

const bloodTypes = [
  { type: "A+",  can: "A+, AB+",         pct: 36 },
  { type: "A-",  can: "A+, A-, AB+, AB-", pct: 6 },
  { type: "B+",  can: "B+, AB+",          pct: 8 },
  { type: "B-",  can: "B+, B-, AB+, AB-", pct: 2 },
  { type: "O+",  can: "A+, B+, O+, AB+",  pct: 38 },
  { type: "O-",  can: "All blood types",   pct: 7 },
  { type: "AB+", can: "AB+ only",          pct: 3 },
  { type: "AB-", can: "AB+, AB-",          pct: 1 },
];

function useCountUp(target, duration = 2000, active = false) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    if (!active) return;
    let start = null;
    const tick = (ts) => {
      if (!start) start = ts;
      const p = Math.min((ts - start) / duration, 1);
      setCount(Math.floor(p * target));
      if (p < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }, [target, duration, active]);
  return count;
}

function StatItem({ stat, active }) {
  const n = useCountUp(stat.value, 1800, active);
  return (
    <Box sx={{ textAlign: "center", flex: 1, px: 2 }}>
      <Typography sx={{ fontSize: { xs: "2rem", md: "2.4rem" }, fontWeight: 900, color: "#dc2626", letterSpacing: "-0.04em", lineHeight: 1 }}>
        {active ? n.toLocaleString() : "0"}{stat.suffix}
      </Typography>
      <Typography variant="caption" sx={{ color: "text.secondary", fontWeight: 500, mt: 0.5, display: "block", fontSize: "0.78rem" }}>
        {stat.label}
      </Typography>
    </Box>
  );
}

const BloodBagSVG = () => (
  <svg viewBox="0 0 340 420" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ width: "100%", maxWidth: 320 }}>
    {/* Hanger hook */}
    <path d="M170 14 Q170 2 182 2 Q194 2 194 14 Q194 24 182 24 L170 24" stroke="#9ca3af" strokeWidth="3.5" strokeLinecap="round" fill="none"/>
    {/* Tube top */}
    <rect x="163" y="24" width="14" height="40" rx="7" fill="#d1d5db"/>
    <rect x="155" y="62" width="30" height="12" rx="6" fill="#9ca3af"/>

    {/* Bag body */}
    <rect x="55" y="74" width="210" height="230" rx="40" fill="#fff1f2" stroke="#fecaca" strokeWidth="2.5"/>

    {/* Blood fill (animated-feel gradient) */}
    <defs>
      <linearGradient id="bloodFill" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#fca5a5" stopOpacity="0.4"/>
        <stop offset="100%" stopColor="#ef4444" stopOpacity="0.55"/>
      </linearGradient>
      <clipPath id="bagClip">
        <rect x="55" y="74" width="210" height="230" rx="40"/>
      </clipPath>
    </defs>
    <rect x="55" y="200" width="210" height="104" fill="url(#bloodFill)" clipPath="url(#bagClip)"/>

    {/* Red Cross */}
    <rect x="148" y="120" width="26" height="80" rx="13" fill="#dc2626"/>
    <rect x="118" y="150" width="86" height="26" rx="13" fill="#dc2626"/>

    {/* Tube bottom */}
    <path d="M170 304 Q170 340 145 360 Q128 372 134 390" stroke="#d1d5db" strokeWidth="11" strokeLinecap="round" fill="none"/>
    <circle cx="132" cy="394" r="8" fill="#dc2626"/>

    {/* Floating hearts */}
    <text x="250" y="105" fontSize="24" fill="#dc2626" opacity="0.65">♥</text>
    <text x="46" y="136" fontSize="17" fill="#ef4444" opacity="0.45">♥</text>
    <text x="268" y="165" fontSize="13" fill="#dc2626" opacity="0.35">♥</text>
    <text x="38" y="240" fontSize="20" fill="#fca5a5" opacity="0.5">+</text>
    <text x="280" y="250" fontSize="26" fill="#fca5a5" opacity="0.45">+</text>
    <text x="58" y="300" fontSize="13" fill="#fca5a5" opacity="0.4">+</text>

    {/* Hand */}
    <rect x="110" y="302" width="100" height="30" rx="15" fill="#fce7f3" stroke="#fbcfe8" strokeWidth="1.5"/>
    <rect x="116" y="320" width="13" height="24" rx="6.5" fill="#fbcfe8"/>
    <rect x="133" y="322" width="13" height="26" rx="6.5" fill="#fbcfe8"/>
    <rect x="150" y="322" width="13" height="26" rx="6.5" fill="#fbcfe8"/>
    <rect x="167" y="320" width="13" height="24" rx="6.5" fill="#fbcfe8"/>
    <rect x="183" y="316" width="11" height="20" rx="5.5" fill="#fbcfe8"/>
  </svg>
);

export default function Home() {
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";
  const statsRef = useRef(null);
  const [statsOn, setStatsOn] = useState(false);

  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) setStatsOn(true); }, { threshold: 0.2 });
    if (statsRef.current) obs.observe(statsRef.current);
    return () => obs.disconnect();
  }, []);

  const bg     = isDark ? "#0a0a0a" : "#ffffff";
  const alt    = isDark ? "#0f0f0f" : "#f7f7f7";
  const border = isDark ? "#1e1e1e" : "#e8e8e8";
  const card   = isDark ? "#111111" : "#ffffff";

  return (
    <Box sx={{ backgroundColor: bg }}>
      <style>{`
        @keyframes fadeUp   { from { opacity:0; transform:translateY(22px); } to { opacity:1; transform:translateY(0); } }
        @keyframes floatBlob{ 0%,100%{transform:translate(0,0) scale(1);} 40%{transform:translate(18px,-16px) scale(1.04);} 70%{transform:translate(-12px,10px) scale(0.97);} }
        @keyframes pulse    { 0%,100%{opacity:1;} 50%{opacity:0.5;} }
      `}</style>

      {/* ── Hero ───────────────────────────────────────────────────────── */}
      <Box sx={{ pt: { xs: 7, md: 9 }, pb: { xs: 10, md: 14 }, position: "relative", overflow: "hidden", bgcolor: bg }}>
        {/* Soft radial blobs */}
        <Box sx={{
          position: "absolute", right: { xs: "-20%", md: "2%" }, top: "5%",
          width: { xs: 360, md: 620 }, height: { xs: 360, md: 620 }, borderRadius: "50%", pointerEvents: "none", zIndex: 0,
          background: isDark
            ? "radial-gradient(circle, rgba(220,38,38,0.11) 0%, transparent 72%)"
            : "radial-gradient(circle, rgba(220,38,38,0.07) 0%, transparent 72%)",
          animation: "floatBlob 9s ease-in-out infinite",
        }} />
        <Box sx={{
          position: "absolute", left: { xs: "-15%", md: "-4%" }, bottom: "5%",
          width: { xs: 280, md: 480 }, height: { xs: 280, md: 480 }, borderRadius: "50%", pointerEvents: "none", zIndex: 0,
          background: isDark
            ? "radial-gradient(circle, rgba(185,28,28,0.09) 0%, transparent 68%)"
            : "radial-gradient(circle, rgba(220,38,38,0.05) 0%, transparent 68%)",
          animation: "floatBlob 12s ease-in-out infinite reverse",
        }} />

        <Container maxWidth="lg" sx={{ position: "relative", zIndex: 1 }}>
          <Box sx={{ display: "flex", flexDirection: { xs: "column", md: "row" }, alignItems: "center", gap: { xs: 7, md: 6 } }}>

            {/* Left text */}
            <Box flex={1} sx={{ animation: "fadeUp 0.7s ease both" }}>
              {/* Badge */}
              <Box sx={{
                display: "inline-flex", alignItems: "center", gap: 0.8,
                px: 1.6, py: 0.55, borderRadius: "100px", mb: 3,
                bgcolor: isDark ? "rgba(220,38,38,0.12)" : "#fff1f2",
                border: `1px solid ${isDark ? "rgba(220,38,38,0.25)" : "#fecaca"}`,
              }}>
                <Box sx={{ width: 6, height: 6, borderRadius: "50%", bgcolor: "#dc2626", animation: "pulse 1.4s ease infinite" }} />
                <Typography sx={{ fontSize: "0.72rem", fontWeight: 700, color: "#dc2626", letterSpacing: "0.09em", textTransform: "uppercase" }}>
                  Save a Life · Be a Hero
                </Typography>
              </Box>

              {/* Headline */}
              <Typography component="h1" sx={{
                fontSize: { xs: "3rem", sm: "3.6rem", md: "4.2rem" },
                fontWeight: 900, lineHeight: 1.05, letterSpacing: "-0.03em",
                color: isDark ? "#f5f5f5" : "#111111", mb: 0,
              }}>
                Donate Blood,
              </Typography>
              <Typography component="h1" sx={{
                fontSize: { xs: "3rem", sm: "3.6rem", md: "4.2rem" },
                fontWeight: 900, lineHeight: 1.05, letterSpacing: "-0.03em",
                color: "#dc2626", mb: 3,
              }}>
                Save Lives
              </Typography>

              <Typography sx={{
                color: isDark ? "#777777" : "#555555",
                fontSize: { xs: "1rem", md: "1.08rem" }, lineHeight: 1.8, maxWidth: 480, mb: 4.5,
              }}>
                Join thousands of volunteers across Cambodia helping patients in need.
                Every drop counts — your donation can be the difference between life and death.
              </Typography>

              {/* CTA */}
              <Box sx={{ display: "flex", gap: 1.5, flexWrap: "wrap", mb: 5 }}>
                <Button component={Link} href="/map" variant="contained" size="large"
                  endIcon={<ArrowForwardIcon />}
                  sx={{
                    bgcolor: "#dc2626", fontWeight: 700, px: 3.5, py: 1.55,
                    borderRadius: "10px", fontSize: "0.95rem",
                    boxShadow: "0 6px 22px rgba(220,38,38,0.38)",
                    "&:hover": { bgcolor: "#b91c1c", boxShadow: "0 10px 32px rgba(220,38,38,0.5)", transform: "translateY(-2px)" },
                    transition: "all 0.22s ease",
                  }}>
                  Find a Donation Center
                </Button>
                <Button component={Link} href="/appointments" variant="outlined" size="large"
                  sx={{
                    color: isDark ? "rgba(245,245,245,0.82)" : "#333333",
                    borderColor: isDark ? "#2a2a2a" : "#e0e0e0",
                    fontWeight: 600, px: 3.5, py: 1.55, borderRadius: "10px", fontSize: "0.95rem",
                    "&:hover": { borderColor: "#dc2626", color: "#dc2626", bgcolor: "rgba(220,38,38,0.04)" },
                    transition: "all 0.2s ease",
                  }}>
                  Book Appointment
                </Button>
              </Box>

              {/* Trust row */}
              <Box sx={{ display: "flex", alignItems: "center", gap: 3, flexWrap: "wrap" }}>
                {[
                  { icon: <VerifiedIcon sx={{ fontSize: 15, color: "#dc2626" }} />, text: "Ministry Certified" },
                  { icon: <ShieldIcon sx={{ fontSize: 15, color: "#dc2626" }} />, text: "100% Safe Process" },
                  { icon: <AccessTimeIcon sx={{ fontSize: 15, color: "#dc2626" }} />, text: "Takes Under 1 Hour" },
                ].map((t, i) => (
                  <Box key={i} sx={{ display: "flex", alignItems: "center", gap: 0.6 }}>
                    {t.icon}
                    <Typography sx={{ fontSize: "0.78rem", fontWeight: 600, color: isDark ? "#666" : "#888" }}>
                      {t.text}
                    </Typography>
                  </Box>
                ))}
              </Box>
            </Box>

            {/* Right illustration */}
            <Box sx={{
              flex: "0 0 auto",
              width: { xs: "60%", sm: "48%", md: 300 },
              animation: "fadeUp 0.9s ease 0.18s both",
              display: "flex", justifyContent: "center",
            }}>
              <BloodBagSVG />
            </Box>
          </Box>

          {/* ── Stats ── */}
          <Box ref={statsRef} sx={{
            mt: { xs: 8, md: 11 },
            pt: 5, borderTop: `1px solid ${border}`,
            display: "flex", flexWrap: "wrap",
            alignItems: "center", justifyContent: "space-between", gap: 3,
          }}>
            {stats.map((s, i) => (
              <React.Fragment key={i}>
                <StatItem stat={s} active={statsOn} />
                {i < stats.length - 1 && (
                  <Box sx={{ width: "1px", height: 40, bgcolor: border, display: { xs: "none", md: "block" } }} />
                )}
              </React.Fragment>
            ))}
          </Box>
        </Container>
      </Box>

      {/* ── What do you need? ──────────────────────────────────────────── */}
      <Box sx={{ bgcolor: alt, py: { xs: 8, md: 11 } }}>
        <Container maxWidth="lg">
          <Box textAlign="center" mb={6}>
            <Typography sx={{
              fontSize: { xs: "1.7rem", md: "2.2rem" }, fontWeight: 900,
              letterSpacing: "-0.025em", color: isDark ? "#f5f5f5" : "#111111", mb: 1,
            }}>
              How Can We Help?
            </Typography>
            <Typography color="text.secondary" sx={{ fontSize: "1rem", maxWidth: 400, mx: "auto" }}>
              Choose what you need and we'll guide you through every step.
            </Typography>
          </Box>

          <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr 1fr", md: "repeat(4, 1fr)" }, gap: 2 }}>
            {actions.map((a, idx) => (
              <Link key={idx} href={a.link} style={{ textDecoration: "none" }}>
                <Box sx={{
                  height: "100%",
                  bgcolor: a.red ? "#dc2626" : card,
                  border: `1px solid ${a.red ? "#dc2626" : border}`,
                  borderRadius: "18px", p: { xs: 2.5, md: 3.2 },
                  cursor: "pointer", transition: "all 0.22s ease",
                  animation: `fadeUp 0.5s ease ${idx * 0.08}s both`,
                  "&:hover": {
                    transform: "translateY(-6px)",
                    boxShadow: a.red
                      ? "0 20px 50px rgba(220,38,38,0.42)"
                      : isDark
                        ? "0 20px 50px rgba(0,0,0,0.5)"
                        : "0 20px 50px rgba(0,0,0,0.1)",
                  },
                }}>
                  <Box sx={{
                    width: 50, height: 50, borderRadius: "14px", mb: 2.5,
                    bgcolor: a.red ? "rgba(255,255,255,0.2)" : isDark ? "rgba(220,38,38,0.12)" : "#fff1f2",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    color: a.red ? "#ffffff" : "#dc2626",
                  }}>
                    {a.icon}
                  </Box>
                  <Typography fontWeight={800} fontSize="0.95rem" mb={0.8}
                    sx={{ color: a.red ? "#ffffff" : isDark ? "#f5f5f5" : "#111111" }}>
                    {a.title}
                  </Typography>
                  <Typography variant="caption" sx={{
                    color: a.red ? "rgba(255,255,255,0.78)" : "text.secondary",
                    lineHeight: 1.65, display: "block",
                  }}>
                    {a.desc}
                  </Typography>
                </Box>
              </Link>
            ))}
          </Box>
        </Container>
      </Box>

      {/* ── How It Works ──────────────────────────────────────────────── */}
      <Box sx={{ bgcolor: bg, py: { xs: 8, md: 12 } }}>
        <Container maxWidth="lg">
          <Box textAlign="center" mb={7}>
            <Box sx={{
              display: "inline-block", px: 2.2, py: 0.65, borderRadius: "100px", mb: 2.5,
              bgcolor: isDark ? "rgba(220,38,38,0.1)" : "#fff1f2",
              border: `1px solid ${isDark ? "rgba(220,38,38,0.22)" : "#fecaca"}`,
            }}>
              <Typography sx={{ fontSize: "0.72rem", fontWeight: 700, color: "#dc2626", letterSpacing: "0.1em", textTransform: "uppercase" }}>
                Simple 3-Step Process
              </Typography>
            </Box>
            <Typography sx={{
              fontSize: { xs: "1.7rem", md: "2.2rem" }, fontWeight: 900,
              letterSpacing: "-0.025em", color: isDark ? "#f5f5f5" : "#111111",
            }}>
              How It Works
            </Typography>
            <Typography color="text.secondary" mt={1} maxWidth={400} mx="auto">
              From signup to saving a life — it takes less than an hour.
            </Typography>
          </Box>

          <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "repeat(3, 1fr)" }, gap: 3, position: "relative" }}>
            {/* Desktop connector */}
            <Box sx={{
              display: { xs: "none", md: "block" }, position: "absolute",
              top: 42, left: "calc(33.33% + 8px)", right: "calc(33.33% + 8px)", height: "2px",
              background: `repeating-linear-gradient(90deg, ${isDark ? "#2a2a2a" : "#e5e5e5"} 0, ${isDark ? "#2a2a2a" : "#e5e5e5"} 7px, transparent 7px, transparent 15px)`,
            }} />

            {steps.map((s, i) => (
              <Box key={i} sx={{
                bgcolor: card, border: `1px solid ${border}`,
                borderRadius: "18px", p: { xs: 3.5, md: 4 },
                animation: `fadeUp 0.6s ease ${i * 0.12}s both`,
                transition: "all 0.22s ease",
                "&:hover": {
                  borderColor: "#dc2626",
                  boxShadow: isDark ? "0 16px 40px rgba(220,38,38,0.12)" : "0 16px 40px rgba(220,38,38,0.09)",
                  transform: "translateY(-5px)",
                },
              }}>
                <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 3 }}>
                  <Box sx={{
                    width: 52, height: 52, borderRadius: "14px",
                    bgcolor: isDark ? "rgba(220,38,38,0.12)" : "#fff1f2",
                    display: "flex", alignItems: "center", justifyContent: "center",
                  }}>
                    {s.icon}
                  </Box>
                  <Typography sx={{ fontSize: "2.2rem", fontWeight: 900, color: isDark ? "#242424" : "#ebebeb", letterSpacing: "-0.05em", lineHeight: 1 }}>
                    {s.num}
                  </Typography>
                </Box>
                <Typography fontWeight={800} fontSize="1rem" mb={1} sx={{ color: isDark ? "#f5f5f5" : "#111" }}>
                  {s.title}
                </Typography>
                <Typography variant="body2" color="text.secondary" lineHeight={1.75}>
                  {s.desc}
                </Typography>
              </Box>
            ))}
          </Box>
        </Container>
      </Box>

      {/* ── Blood Type Grid ────────────────────────────────────────────── */}
      <Box sx={{ bgcolor: alt, py: { xs: 8, md: 11 } }}>
        <Container maxWidth="lg">
          <Box textAlign="center" mb={6}>
            <Typography sx={{
              fontSize: { xs: "1.7rem", md: "2.2rem" }, fontWeight: 900,
              letterSpacing: "-0.025em", color: isDark ? "#f5f5f5" : "#111111", mb: 1,
            }}>
              Blood Type Compatibility
            </Typography>
            <Typography color="text.secondary">Know your type. Know who you can help.</Typography>
          </Box>
          <Box sx={{ display: "grid", gridTemplateColumns: { xs: "repeat(2, 1fr)", sm: "repeat(4, 1fr)", md: "repeat(8, 1fr)" }, gap: 1.5 }}>
            {bloodTypes.map((bt, i) => (
              <Box key={i} sx={{
                bgcolor: card, border: `1px solid ${border}`,
                borderRadius: "14px", p: 2, textAlign: "center",
                transition: "all 0.2s ease",
                "&:hover": {
                  borderColor: "#dc2626",
                  boxShadow: "0 8px 24px rgba(220,38,38,0.14)",
                  transform: "translateY(-3px)",
                },
              }}>
                <Typography sx={{ fontSize: "1.65rem", fontWeight: 900, color: "#dc2626", letterSpacing: "-0.03em", lineHeight: 1 }}>
                  {bt.type}
                </Typography>
                <Typography sx={{ fontSize: "0.62rem", color: "text.disabled", mt: 0.5, lineHeight: 1.4, fontWeight: 500 }}>
                  {bt.pct}% of people
                </Typography>
              </Box>
            ))}
          </Box>
          <Typography variant="caption" color="text.disabled" display="block" textAlign="center" mt={3}>
            O- is the universal donor type — compatible with all blood types.
          </Typography>
        </Container>
      </Box>

      {/* ── Testimonials ──────────────────────────────────────────────── */}
      <Box sx={{ bgcolor: bg, py: { xs: 8, md: 12 } }}>
        <Container maxWidth="lg">
          <Box textAlign="center" mb={6}>
            <Typography sx={{
              fontSize: { xs: "1.7rem", md: "2.2rem" }, fontWeight: 900,
              letterSpacing: "-0.025em", color: isDark ? "#f5f5f5" : "#111111", mb: 1,
            }}>
              Real Stories, Real Impact
            </Typography>
            <Typography color="text.secondary">From donors and families who experienced the difference.</Typography>
          </Box>
          <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "repeat(3, 1fr)" }, gap: 2.5 }}>
            {testimonials.map((t, i) => (
              <Box key={i} sx={{
                bgcolor: card, border: `1px solid ${border}`, borderRadius: "18px",
                p: { xs: 3, md: 3.5 }, transition: "all 0.22s ease",
                animation: `fadeUp 0.6s ease ${i * 0.1}s both`,
                "&:hover": {
                  borderColor: "#dc2626",
                  boxShadow: isDark ? "0 16px 40px rgba(220,38,38,0.1)" : "0 16px 40px rgba(0,0,0,0.08)",
                  transform: "translateY(-4px)",
                },
              }}>
                <FormatQuoteIcon sx={{ fontSize: 32, color: "#dc2626", opacity: 0.4, mb: 1 }} />
                <Typography variant="body2" lineHeight={1.8} color="text.secondary" mb={3}>
                  "{t.quote}"
                </Typography>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                  <Box sx={{
                    width: 40, height: 40, borderRadius: "50%", bgcolor: t.color,
                    display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                  }}>
                    <Typography sx={{ fontSize: "0.75rem", fontWeight: 800, color: "white" }}>{t.initials}</Typography>
                  </Box>
                  <Box>
                    <Typography fontWeight={700} fontSize="0.85rem" sx={{ color: isDark ? "#f5f5f5" : "#111" }}>
                      {t.name}
                    </Typography>
                    <Typography variant="caption" color="text.disabled">{t.role}</Typography>
                  </Box>
                </Box>
              </Box>
            ))}
          </Box>
        </Container>
      </Box>

      {/* ── CTA Banner ────────────────────────────────────────────────── */}
      <Box sx={{
        py: { xs: 10, md: 14 }, textAlign: "center", position: "relative", overflow: "hidden",
        background: isDark
          ? "linear-gradient(135deg, #1c0202 0%, #2d0606 55%, #0f0f0f 100%)"
          : "linear-gradient(135deg, #dc2626 0%, #b91c1c 55%, #7f1d1d 100%)",
      }}>
        <Box sx={{ position: "absolute", inset: 0, backgroundImage: "radial-gradient(rgba(255,255,255,0.04) 1px, transparent 1px)", backgroundSize: "28px 28px", pointerEvents: "none" }} />
        <Box sx={{ position: "absolute", top: "-25%", right: "-8%", width: 500, height: 500, borderRadius: "50%", bgcolor: "rgba(255,255,255,0.035)", pointerEvents: "none" }} />
        <Box sx={{ position: "absolute", bottom: "-20%", left: "-5%",  width: 380, height: 380, borderRadius: "50%", bgcolor: "rgba(255,255,255,0.025)", pointerEvents: "none" }} />

        <Container maxWidth="md" sx={{ position: "relative", zIndex: 1 }}>
          <Box sx={{
            width: 64, height: 64, borderRadius: "18px", mx: "auto", mb: 3,
            bgcolor: "rgba(255,255,255,0.15)", display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <FavoriteIcon sx={{ fontSize: 32, color: "white" }} />
          </Box>
          <Typography sx={{
            fontSize: { xs: "2rem", md: "2.8rem" }, fontWeight: 900, color: "white",
            letterSpacing: "-0.03em", lineHeight: 1.1, mb: 2,
          }}>
            Ready to Save a Life Today?
          </Typography>
          <Typography sx={{ color: "rgba(255,255,255,0.76)", mb: 5, fontSize: "1.05rem", maxWidth: 500, mx: "auto", lineHeight: 1.8 }}>
            Join 15,230+ registered donors across Cambodia. Your 8 minutes of donation could give someone a lifetime.
          </Typography>
          <Box sx={{ display: "flex", justifyContent: "center", gap: 2, flexWrap: "wrap" }}>
            <Button component={Link} href="/donate" variant="contained" size="large"
              sx={{
                bgcolor: "white", color: "#b91c1c", fontWeight: 800, px: 4.5, py: 1.6,
                borderRadius: "10px", fontSize: "0.95rem",
                boxShadow: "0 8px 32px rgba(0,0,0,0.28)",
                "&:hover": { bgcolor: "#fff1f2", transform: "translateY(-2px)", boxShadow: "0 14px 40px rgba(0,0,0,0.3)" },
                transition: "all 0.22s ease",
              }}>
              Become a Donor
            </Button>
            <Button component={Link} href="/requests" variant="outlined" size="large"
              sx={{
                borderColor: "rgba(255,255,255,0.48)", color: "white", fontWeight: 700,
                px: 4.5, py: 1.6, borderRadius: "10px", fontSize: "0.95rem",
                "&:hover": { bgcolor: "rgba(255,255,255,0.1)", borderColor: "white", transform: "translateY(-2px)" },
                transition: "all 0.22s ease",
              }}>
              Request Blood
            </Button>
          </Box>
        </Container>
      </Box>

    </Box>
  );
}
