'use client';
import Link from 'next/link';
import Image from 'next/image';
import { useState, useEffect, useRef } from "react";
import { useRouter } from 'next/navigation';
import { script } from '@/lib/fonts';
import { Container, Box, Typography, Button, useTheme, Paper, InputBase, Autocomplete } from "@mui/material";
import API_BASE from "@/lib/config";
import { PROVINCES } from "@/lib/places";
import HelpSection from "./_components/HelpSection";
import CommunitySection from "./_components/CommunitySection";
import BloodSupplySection from "./_components/BloodSupplySection";
import EligibilitySection from "./_components/EligibilitySection";
import FavoriteIcon from "@mui/icons-material/Favorite";
import GroupsIcon from "@mui/icons-material/Groups";
import PeopleIcon from "@mui/icons-material/People";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";

import VerifiedUserIcon from "@mui/icons-material/VerifiedUser";
import CalendarMonthIcon from "@mui/icons-material/CalendarMonth";
import DescriptionIcon from "@mui/icons-material/Description";
import WaterDropIcon from "@mui/icons-material/WaterDrop";
import DomainIcon from "@mui/icons-material/Domain";
import PlaceIcon from "@mui/icons-material/Place";
import StarIcon from "@mui/icons-material/Star";
import Diversity3Icon from "@mui/icons-material/Diversity3";
import Inventory2Icon from "@mui/icons-material/Inventory2";
import LocalHospitalOutlinedIcon from "@mui/icons-material/LocalHospitalOutlined";

// A real donation photo (donor's arm on the chair, squeezing a ball).
const HERO_PHOTO = "https://images.unsplash.com/photo-1536856136534-bb679c52a9aa?auto=format&fit=crop";

const FALLBACK_PROFILES = [
  { name: "Sophea Meas", role: "Regular Blood Donor (Demo)", initials: "SM", color: "#dc2626",
    photo: "https://i.pravatar.cc/640?img=47", bloodType: "A+", donations: 3, badge: "Blood Donor", location: "Phnom Penh",
    quote: "I donate blood because it can give someone else a second chance at life.",
    bio: "A demo profile representing a typical blood donor on BloodLife AI. This donor regularly donates blood and supports local blood drives." },
  { name: "Dara Keo", role: "Volunteer & Blood Drive Support (Demo)", initials: "DK", color: "#dc2626",
    photo: "https://i.pravatar.cc/640?img=68", bloodType: "O-", donations: 5, badge: "Community Volunteer", location: "Kandal",
    quote: "I believe a stronger community can save more lives through awareness and action.",
    bio: "A demo profile representing a community volunteer who helps organize blood donation campaigns, raises awareness, and supports donors." },
  { name: "Chan Bopha", role: "Hospital Representative (Demo)", initials: "CB", color: "#dc2626",
    photo: "https://i.pravatar.cc/640?img=32", bloodType: "B+", donations: 2, badge: "Healthcare Partner", location: "Siem Reap",
    quote: "Our hospital relies on the support of donors and the community to save more lives.",
    bio: "A demo profile representing a partner hospital on BloodLife AI. Hospitals can request blood units, manage inventory, and connect with donors." },
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


const WHY = [
  { icon: <FavoriteIcon />,   title: "Save Lives",                 desc: "One donation can save up to 3 lives." },
  { icon: <Diversity3Icon />, title: "Build a Healthier Community", desc: "Help sustain a stable blood supply for those in need." },
  { icon: <WaterDropIcon />,  title: "It's Safe and Simple",       desc: "A quick, safe, and easy process." },
  { icon: <StarIcon />,       title: "Be a Role Model",            desc: "Inspire others to make a difference." },
];

const HOW = [
  { icon: <DescriptionIcon />,   title: "1. Register",         desc: "Create an account or walk in." },
  { icon: <CalendarMonthIcon />, title: "2. Book Appointment", desc: "Choose a convenient date and location." },
  { icon: <WaterDropIcon />,     title: "3. Donate Blood",     desc: "A safe and quick process — the donation itself takes about 10 minutes." },
  { icon: <FavoriteIcon />,      title: "4. Save Lives",       desc: "Your donation helps patients in need." },
];

const TRUST = [
  { icon: <GroupsIcon />,       title: "Safe & Secure",    desc: "Your safety is our priority" },
  { icon: <VerifiedUserIcon />, title: "Trusted Hospitals", desc: "Verified medical centers" },
  { icon: <FavoriteIcon />,     title: "Real Impact",      desc: "Help save up to 3 lives" },
];

// Animated number that counts up once `active` turns true.
function CountUp({ value, active }) {
  const n = useCountUp(value, 1600, active);
  return <>{(active ? n : 0).toLocaleString()}</>;
}

function SectionHeading({ title, subtitle, light }) {
  return (
    <Box sx={{ textAlign: "center", mb: { xs: 4, md: 5 } }}>
      <Typography component="h2" sx={{ fontSize: { xs: "1.6rem", md: "2rem" }, fontWeight: 800, letterSpacing: "-0.02em", color: light ? "#fff" : "text.primary" }}>
        {title}
      </Typography>
      {subtitle && (
        <Typography sx={{ mt: 0.75, color: light ? "rgba(255,255,255,0.8)" : "text.secondary", maxWidth: 640, mx: "auto" }}>{subtitle}</Typography>
      )}
    </Box>
  );
}

const PROVINCE_NAMES = PROVINCES.map((p) => p.name);

export default function Home() {
  const theme = useTheme();
  const router = useRouter();
  const isDark = theme.palette.mode === "dark";
  const statsRef = useRef(null);
  const [statsOn, setStatsOn] = useState(false);
  const [pub, setPub] = useState(null); // real, public totals from /api/stats/public
  const [profiles, setProfiles] = useState(FALLBACK_PROFILES);
  const [city, setCity] = useState("");

  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) setStatsOn(true); }, { threshold: 0.2 });
    if (statsRef.current) obs.observe(statsRef.current);
    return () => obs.disconnect();
  }, []);

  useEffect(() => {
    fetch(`${API_BASE}/api/homepage`)
      .then(r => r.json())
      .then(data => { if (Array.isArray(data) && data.length) setProfiles(data); })
      .catch(() => {});
    fetch(`${API_BASE}/api/stats/public`)
      .then(r => (r.ok ? r.json() : Promise.reject()))
      .then(setPub)
      .catch(() => {});
  }, []);

  const goToMap = (value) => {
    const q = value.trim();
    router.push(q ? `/map?city=${encodeURIComponent(q)}` : "/map");
  };
  const searchCenters = (e) => {
    e.preventDefault();
    goToMap(city);
  };

  const bg     = isDark ? "#0a0a0a" : "#ffffff";

  const statItems = [
    { icon: <PeopleIcon />,      value: pub?.donors,            label: "Registered Donors" },
    { icon: <WaterDropIcon />,   value: pub?.donations,         label: "Total Donations" },
    { icon: <DomainIcon />,      value: pub?.hospitals,         label: "Partner Hospitals" },
    { icon: <Inventory2Icon />,  value: pub?.units,             label: "Units in Stock" },
  ];
  const iconCircle = (size, solid) => ({
    width: size, height: size, borderRadius: "50%", flexShrink: 0,
    display: "flex", alignItems: "center", justifyContent: "center",
    bgcolor: solid ? "primary.main" : (t) => t.custom.tones.primary.bg,
    color: solid ? "primary.contrastText" : "primary.main",
  });

  return (
    <Box sx={{ backgroundColor: bg }}>

      {/* ── Hero ───────────────────────────────────────────────────────── */}
      <Box component="section" sx={{ position: "relative", overflow: "hidden", bgcolor: "background.paper" }}>
        {/* Photo: fades into the page on its left edge (top edge on phones). The mask sits on
            the wrapper and the image is flipped inside it, so the donor's hand and the ball
            land on the visible right side and the fade covers the far side of the frame. */}
        <Box
          aria-hidden
          sx={{
            position: { xs: "relative", md: "absolute" }, top: 0, right: 0, bottom: 0, overflow: "hidden",
            width: { xs: "100%", md: "64%" }, height: { xs: 260, md: "auto" },
            WebkitMaskImage: { xs: "linear-gradient(180deg, transparent 0%, #000 40%)", md: "linear-gradient(90deg, transparent 0%, transparent 22%, #000 60%)" },
            maskImage: { xs: "linear-gradient(180deg, transparent 0%, #000 40%)", md: "linear-gradient(90deg, transparent 0%, transparent 22%, #000 60%)" },
          }}
        >
          {/* Loaded first (it is the largest thing on screen) and sized to the visitor's screen. */}
          <Image
            src={HERO_PHOTO}
            alt=""
            fill
            priority
            sizes="(min-width: 900px) 64vw, 100vw"
            style={{ objectFit: "cover", objectPosition: "center 35%", transform: "scaleX(-1)" }}
          />
        </Box>
        {/* Handwritten tagline on the faded part of the photo */}
        <Box
          aria-hidden
          className={script.className}
          sx={{
            display: { xs: "none", md: "block" }, position: "absolute", top: 54, left: "56%", zIndex: 1,
            transform: "rotate(-8deg)", fontSize: "3.1rem", lineHeight: 1.05, fontWeight: 700,
            color: isDark ? "#f5f5f5" : "#1f2937", textShadow: isDark ? "0 2px 12px rgba(0,0,0,0.6)" : "0 1px 0 rgba(255,255,255,0.6)",
          }}
        >
          Be a Hero<br />Give Blood<br />Give Hope
          <FavoriteIcon sx={{ fontSize: 30, color: "primary.main", ml: 0.75, transform: "rotate(12deg)", verticalAlign: "top" }} />
        </Box>

        <Container maxWidth="lg" sx={{ position: "relative", zIndex: 2, pt: { xs: 4, md: 7 }, pb: { xs: 3, md: 8 } }}>
          <Box sx={{ maxWidth: { md: 640 } }}>
            {pub?.availableDonors > 0 ? (
              <Box component={Link} href="/donors" sx={{
                display: "inline-flex", alignItems: "center", gap: 1, mb: 2, px: 1.5, py: 0.6, borderRadius: "999px", textDecoration: "none",
                bgcolor: "background.paper", color: "text.primary", fontSize: "0.82rem", fontWeight: 600,
                border: "1px solid", borderColor: "divider", boxShadow: (t) => t.custom.shadow.sm,
                "&:hover": { borderColor: "primary.main" },
              }}>
                <Box component="span" aria-hidden="true" sx={{
                  width: 8, height: 8, borderRadius: "50%", bgcolor: (t) => t.custom.tones.success.dot,
                  boxShadow: (t) => `0 0 0 4px ${t.custom.tones.success.bg}`,
                }} />
                <Box component="span"><Box component="strong" sx={{ color: "primary.main" }}>{pub.availableDonors.toLocaleString()}</Box> donor{pub.availableDonors !== 1 ? "s" : ""} available to donate now</Box>
                <ArrowForwardIcon aria-hidden="true" sx={{ fontSize: 15, color: "text.secondary" }} />
              </Box>
            ) : (
              <Typography sx={{ fontSize: { xs: "0.78rem", md: "0.9rem" }, fontWeight: 600, letterSpacing: "0.04em", textTransform: "uppercase", color: "text.secondary", mb: 1.5 }}>
                A small act makes a big difference
              </Typography>
            )}
            <Typography component="h1" sx={{ fontSize: { xs: "2.6rem", sm: "3.4rem", md: "4.4rem" }, fontWeight: 800, lineHeight: 1.04, letterSpacing: "-0.035em", color: "text.primary" }}>
              Donate Blood
              <Box component="span" sx={{ display: "block", color: "primary.main" }}>Save Lives</Box>
            </Typography>
            <Typography sx={{ mt: 2.5, maxWidth: 520, fontSize: { xs: "1rem", md: "1.15rem" }, lineHeight: 1.65, color: "text.secondary" }}>
              Join our community of heroes. Your blood donation can give someone a second chance at life.
            </Typography>

            <Box sx={{ mt: 4, display: "flex", gap: 1.5, flexWrap: "wrap" }}>
              <Button component={Link} href="/map" variant="contained" size="large" startIcon={<FavoriteIcon />} endIcon={<ArrowForwardIcon />}
                sx={{ px: 3, py: 1.4, fontSize: "0.95rem", fontWeight: 700, width: { xs: "100%", sm: "auto" } }}>
                Find a Donation Center
              </Button>
              <Button component={Link} href="/appointments" variant="outlined" size="large" startIcon={<CalendarMonthIcon />}
                sx={{ px: 3, py: 1.4, fontSize: "0.95rem", fontWeight: 700, borderWidth: 1.5, bgcolor: "background.paper", "&:hover": { borderWidth: 1.5 }, width: { xs: "100%", sm: "auto" } }}>
                Book an Appointment
              </Button>
            </Box>
            <Typography sx={{ mt: 2, fontSize: "0.9rem", color: "text.secondary", display: "flex", alignItems: "center", gap: 0.75, flexWrap: "wrap" }}>
              <LocalHospitalOutlinedIcon aria-hidden="true" sx={{ fontSize: 18, color: "primary.main" }} />
              Need blood for a patient?
              <Box component={Link} href="/requests" sx={{ color: "primary.main", fontWeight: 700, textDecoration: "none", display: "inline-flex", alignItems: "center", gap: 0.25, "&:hover": { textDecoration: "underline" } }}>
                Request blood <ArrowForwardIcon aria-hidden="true" sx={{ fontSize: 16 }} />
              </Box>
            </Typography>

            <Box sx={{ mt: 4, display: "grid", gridTemplateColumns: { xs: "1fr", sm: "repeat(3, auto)" }, justifyContent: "start", columnGap: 4, rowGap: 1.75 }}>
              {TRUST.map((t) => (
                <Box key={t.title} sx={{ display: "flex", alignItems: "center", gap: 1.25 }}>
                  <Box sx={{ color: "primary.main", display: "flex", "& svg": { fontSize: 34 } }}>{t.icon}</Box>
                  <Box>
                    <Typography sx={{ fontSize: "0.85rem", fontWeight: 700, lineHeight: 1.3 }}>{t.title}</Typography>
                    <Typography sx={{ fontSize: "0.75rem", color: "text.secondary", lineHeight: 1.3 }}>{t.desc}</Typography>
                  </Box>
                </Box>
              ))}
            </Box>
          </Box>
        </Container>
      </Box>

      {/* ── Stats bar (real, public totals) — sits below the hero, not over its photo ── */}
      <Container maxWidth="lg" sx={{ position: "relative", zIndex: 3, mt: { xs: 5, md: 7 } }}>
        <Paper
          ref={statsRef}
          variant="outlined"
          sx={{
            borderRadius: "16px", overflow: "hidden", boxShadow: (t) => t.custom.shadow.md,
            display: "grid", gridTemplateColumns: { xs: "repeat(2, 1fr)", md: "repeat(4, 1fr)" },
          }}
        >
          {statItems.map((s, i) => (
            <Box
              key={s.label}
              sx={{
                display: "flex", alignItems: "center", justifyContent: "center", gap: 2, py: { xs: 2.5, md: 3.5 }, px: 2,
                borderStyle: "solid", borderWidth: 0, borderColor: "divider",
                borderLeftWidth: { xs: i % 2 === 1 ? 1 : 0, md: i > 0 ? 1 : 0 },
                borderTopWidth: { xs: i > 1 ? 1 : 0, md: 0 },
              }}
            >
              <Box sx={{ ...iconCircle(52), "& svg": { fontSize: 26 } }}>{s.icon}</Box>
              <Box>
                <Typography sx={{ fontSize: { xs: "1.5rem", md: "1.75rem" }, fontWeight: 800, lineHeight: 1.1, letterSpacing: "-0.02em", color: "primary.main" }}>
                  {s.value == null ? "—" : <CountUp value={s.value} active={statsOn} />}
                </Typography>
                <Typography sx={{ fontSize: "0.82rem", color: "text.secondary" }}>{s.label}</Typography>
              </Box>
            </Box>
          ))}
        </Paper>
      </Container>

      {/* ── Live blood supply + compatibility (#compatibility) ─────────── */}
      <Box sx={{ mt: { xs: 1, md: 2 } }}><BloodSupplySection /></Box>

      {/* ── Why Donate Blood? ──────────────────────────────────────────── */}
      <Box component="section" sx={{ py: { xs: 6, md: 9 } }}>
        <Container maxWidth="lg">
          <SectionHeading title="Why Donate Blood?" subtitle="Your donation helps patients in emergency situations, surgeries, cancer treatments and more." />
          <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "repeat(2, 1fr)", lg: "repeat(4, 1fr)" }, gap: 2.5 }}>
            {WHY.map((w) => (
              <Paper key={w.title} variant="outlined" sx={{ p: 2.5, borderRadius: "14px", display: "flex", alignItems: "center", gap: 2, boxShadow: (t) => t.custom.shadow.xs }}>
                <Box sx={{ ...iconCircle(56), "& svg": { fontSize: 28 } }}>{w.icon}</Box>
                <Box>
                  <Typography sx={{ fontWeight: 700, fontSize: "0.95rem", lineHeight: 1.3 }}>{w.title}</Typography>
                  <Typography sx={{ mt: 0.5, fontSize: "0.83rem", color: "text.secondary", lineHeight: 1.5 }}>{w.desc}</Typography>
                </Box>
              </Paper>
            ))}
          </Box>
        </Container>
      </Box>

      {/* ── How It Works ───────────────────────────────────────────────── */}
      <Box component="section" sx={{ py: { xs: 6, md: 8 }, bgcolor: (t) => t.custom.tones.primary.bg }}>
        <Container maxWidth="lg">
          <SectionHeading title="How It Works?" subtitle="Donating blood is easy. Here's how:" />
          <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "repeat(2, 1fr)", lg: "repeat(4, 1fr)" }, gap: { xs: 3, lg: 4 } }}>
            {HOW.map((h, i) => (
              <Box key={h.title} sx={{ display: "flex", alignItems: "center", gap: 2, position: "relative" }}>
                <Box sx={{ ...iconCircle(66, true), "& svg": { fontSize: 30 } }}>{h.icon}</Box>
                <Box>
                  <Typography sx={{ fontWeight: 700, fontSize: "0.98rem", lineHeight: 1.3 }}>{h.title}</Typography>
                  <Typography sx={{ mt: 0.5, fontSize: "0.83rem", color: "text.secondary", lineHeight: 1.5 }}>{h.desc}</Typography>
                </Box>
                {i < HOW.length - 1 && (
                  <ArrowForwardIcon sx={{ display: { xs: "none", lg: "block" }, position: "absolute", right: -30, top: "50%", mt: "-12px", color: "text.disabled" }} />
                )}
              </Box>
            ))}
          </Box>
          <Box sx={{ mt: { xs: 4, md: 5 }, display: "flex", justifyContent: "center", gap: 1.5, flexWrap: "wrap" }}>
            <Button component={Link} href="/appointments" variant="contained" size="large" startIcon={<CalendarMonthIcon />} sx={{ fontWeight: 700, px: 3 }}>
              Book an Appointment
            </Button>
            <Button component={Link} href="/donate" variant="outlined" size="large"
              sx={{ fontWeight: 700, px: 3, borderWidth: 1.5, bgcolor: "background.paper", "&:hover": { borderWidth: 1.5 } }}>
              Register as a Donor
            </Button>
          </Box>
        </Container>
      </Box>

      {/* ── Can I donate? ──────────────────────────────────────────────── */}
      <EligibilitySection />

      {/* ── Find a Donation Center Near You ────────────────────────────── */}
      <Box
        component="section"
        sx={{
          position: "relative", overflow: "hidden", color: "#fff", py: { xs: 5, md: 6 },
          background: (t) => t.custom.sidebar.bgGradient,
          "&::before": {
            content: '""', position: "absolute", inset: 0, opacity: 0.12, pointerEvents: "none",
            backgroundImage: "radial-gradient(circle at 12% 30%, #fff 0 2px, transparent 3px), radial-gradient(circle at 60% 70%, #fff 0 2px, transparent 3px), radial-gradient(circle at 90% 25%, #fff 0 2px, transparent 3px)",
            backgroundSize: "180px 180px",
          },
        }}
      >
        <Container maxWidth="lg" sx={{ position: "relative", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 4, flexDirection: { xs: "column", md: "row" } }}>
          <Box sx={{ textAlign: { xs: "center", md: "left" } }}>
            <Typography component="h2" sx={{ fontSize: { xs: "1.6rem", md: "2rem" }, fontWeight: 800, letterSpacing: "-0.02em" }}>
              Find a Donation Center Near You
            </Typography>
            <Typography sx={{ mt: 0.75, color: "rgba(255,255,255,0.82)" }}>Search for hospitals and blood donation centers in your area.</Typography>
          </Box>
          <Paper
            component="form"
            onSubmit={searchCenters}
            role="search"
            elevation={0}
            sx={{ display: "flex", alignItems: "center", width: "100%", maxWidth: 520, p: 0.75, pl: 2, borderRadius: "12px", bgcolor: "#fff" }}
          >
            <PlaceIcon sx={{ color: "primary.main", mr: 1 }} />
            <Autocomplete
              freeSolo
              options={PROVINCE_NAMES}
              inputValue={city}
              onInputChange={(_, value) => setCity(value)}
              onChange={(_, value, reason) => { if (reason === "selectOption" && value) goToMap(value); }}
              slotProps={{ popper: { sx: { minWidth: 240 } }, paper: { sx: { color: "#1f2937" } } }}
              sx={{ flex: 1 }}
              renderInput={(params) => (
                <InputBase
                  ref={params.InputProps.ref}
                  inputProps={{ ...params.inputProps, "aria-label": "City or province" }}
                  placeholder="Enter your city or province..."
                  sx={{ width: "100%", color: "#1f2937", fontSize: "0.95rem" }}
                />
              )}
            />
            <Button type="submit" variant="contained" sx={{ px: 3.5, py: 1.1, fontWeight: 700 }}>Search</Button>
          </Paper>
        </Container>
      </Box>

      {/* ── How Can We Help? ───────────────────────────────────────────── */}
      <HelpSection />

      {/* ── Community profiles ("People Behind the Mission") ─────────────── */}
      <CommunitySection profiles={profiles} />

    </Box>
  );
}
