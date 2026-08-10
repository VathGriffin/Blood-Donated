'use client';
import Link from 'next/link';
import React, { useState, useEffect, useRef } from "react";
import { Container, Box, Typography, Button, useTheme, Avatar } from "@mui/material";
import API_BASE from "@/lib/config";
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


const FALLBACK_PROFILES = [
  { name: "Sophea Meas", role: "First-time Donor", initials: "SM", color: "#dc2626",
    photo: "https://i.pravatar.cc/200?img=47", bloodType: "A+", donations: 3, badge: "Active Donor",
    bio: "Sophea donated blood for the first time and inspired her entire workplace to join. She now volunteers at local donation drives every quarter." },
  { name: "Dara Keo", role: "Grateful Parent", initials: "DK", color: "#b91c1c",
    photo: "https://i.pravatar.cc/200?img=68", bloodType: "O-", donations: 5, badge: "Community Champion",
    bio: "After BloodLife connected his daughter with a life-saving donor, Dara became a passionate advocate and registered donor himself." },
  { name: "Dr. Chan Bopha", role: "Cardiologist, Calmette Hospital", initials: "CB", color: "#991b1b",
    photo: "https://i.pravatar.cc/200?img=32", bloodType: "B+", donations: 12, badge: "Medical Partner",
    bio: "Dr. Chan Bopha partners with BloodLife to coordinate blood drives for cardiac patients and educates the public on the importance of donation." },
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

const BG_PHOTOS = [
  "https://images.unsplash.com/photo-1576091160550-2173dba999ef?w=1920&h=900&fit=crop&q=80",
  "https://images.unsplash.com/photo-1631815589968-fdb09a223b1e?w=1920&h=900&fit=crop&q=80",
  "https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=1920&h=900&fit=crop&q=80",
];

const WHY_FEATURES = [
  { icon: <AccessTimeIcon />, title: "Instant Matching", desc: "Smart blood type matching connects donors with patients in under 60 seconds.", color: "#f59e0b", bg: "rgba(245,158,11,0.1)" },
  { icon: <VerifiedIcon />,   title: "Verified Donors",  desc: "Every donor passes medical screening. Each donation is tracked and certified.", color: "#10b981", bg: "rgba(16,185,129,0.1)" },
  { icon: <LocalHospitalIcon />, title: "126+ Hospitals", desc: "Nationwide partner hospitals across Cambodia accept BloodLife-coordinated donations.", color: "#3b82f6", bg: "rgba(59,130,246,0.1)" },
  { icon: <ShieldIcon />,     title: "100% Safe & Private", desc: "GDPR-compliant. Your data is encrypted and never sold or shared without consent.", color: "#8b5cf6", bg: "rgba(139,92,246,0.1)" },
];

const MARQUEE_PHOTOS = [
  { url: "https://images.unsplash.com/photo-1551190822-a9333d879b1f?w=360&h=220&fit=crop&q=70", label: "Healthcare" },
  { url: "https://images.unsplash.com/photo-1584820927498-cfe5211fd8bf?w=360&h=220&fit=crop&q=70", label: "Medical Care" },
  { url: "https://images.unsplash.com/photo-1582750433449-648ed127bb54?w=360&h=220&fit=crop&q=70", label: "Medical Team" },
  { url: "https://images.unsplash.com/photo-1576091160550-2173dba999ef?w=360&h=220&fit=crop&q=70", label: "Doctor" },
  { url: "https://images.unsplash.com/photo-1631815589968-fdb09a223b1e?w=360&h=220&fit=crop&q=70", label: "Blood Donation" },
  { url: "https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=360&h=220&fit=crop&q=70", label: "Surgery Team" },
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

function StatItem({ stat, active, light }) {
  const n = useCountUp(stat.value, 1800, active);
  return (
    <Box sx={{ textAlign: "center", flex: 1, px: 2 }}>
      <Typography sx={{ fontSize: { xs: light ? "1.8rem" : "2rem", md: light ? "2.1rem" : "2.4rem" }, fontWeight: 900, color: light ? "#f87171" : "#dc2626", letterSpacing: "-0.04em", lineHeight: 1 }}>
        {active ? n.toLocaleString() : "0"}{stat.suffix}
      </Typography>
      <Typography variant="caption" sx={{ color: light ? "rgba(255,255,255,0.62)" : "text.secondary", fontWeight: 500, mt: 0.5, display: "block", fontSize: "0.78rem" }}>
        {stat.label}
      </Typography>
    </Box>
  );
}


export default function Home() {
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";
  const statsRef = useRef(null);
  const [statsOn, setStatsOn] = useState(false);
  const [profiles, setProfiles] = useState(FALLBACK_PROFILES);
  const [bgIndex, setBgIndex]   = useState(0);

  useEffect(() => {
    const t = setInterval(() => setBgIndex(i => (i + 1) % BG_PHOTOS.length), 7000);
    return () => clearInterval(t);
  }, []);

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
  }, []);

  const bg     = isDark ? "#0a0a0a" : "#ffffff";
  const alt    = isDark ? "#0f0f0f" : "#f7f7f7";
  const border = isDark ? "#1e1e1e" : "#e8e8e8";
  const card   = isDark ? "#111111" : "#ffffff";

  return (
    <Box sx={{ backgroundColor: bg }}>
      <style>{`
        @keyframes fadeUp      { from { opacity:0; transform:translateY(22px); } to { opacity:1; transform:translateY(0); } }
        @keyframes floatBlob   { 0%,100%{transform:translate(0,0) scale(1);} 40%{transform:translate(18px,-16px) scale(1.04);} 70%{transform:translate(-12px,10px) scale(0.97);} }
        @keyframes pulse       { 0%,100%{opacity:1;} 50%{opacity:0.5;} }
        @keyframes kenBurns    { from{transform:scale(1) translate(0,0);} to{transform:scale(1.09) translate(-1%,-0.5%);} }
        @keyframes floatUp     { 0%,100%{transform:translateY(0px);} 50%{transform:translateY(-18px);} }
        @keyframes floatDown   { 0%,100%{transform:translateY(0px);} 50%{transform:translateY(18px);} }
        @keyframes marqueeLeft { from{transform:translateX(0)} to{transform:translateX(-50%)} }
        @keyframes marqueeRight{ from{transform:translateX(-50%)} to{transform:translateX(0)} }
      `}</style>

      {/* ── Hero ───────────────────────────────────────────────────────── */}
      <Box sx={{
        position: "relative", overflow: "hidden",
        minHeight: { xs: "100vh", md: "92vh" },
        display: "flex", flexDirection: "column", justifyContent: "center",
      }}>
        {/* Full-background photo slideshow with Ken Burns */}
        {BG_PHOTOS.map((url, i) => (
          <Box key={i} sx={{
            position: "absolute", inset: 0,
            backgroundImage: `url(${url})`,
            backgroundSize: "cover",
            backgroundPosition: "center",
            opacity: bgIndex === i ? 1 : 0,
            transition: "opacity 1.8s ease-in-out",
            animation: bgIndex === i ? "kenBurns 9s ease-in-out forwards" : "none",
          }} />
        ))}
        {/* Dark overlays for text readability */}
        <Box sx={{ position: "absolute", inset: 0, background: "linear-gradient(105deg, rgba(0,0,0,0.84) 0%, rgba(0,0,0,0.55) 50%, rgba(0,0,0,0.25) 100%)", zIndex: 1 }} />
        <Box sx={{ position: "absolute", inset: 0, background: "linear-gradient(to top, rgba(0,0,0,0.7) 0%, transparent 55%)", zIndex: 1 }} />
        {/* Red left accent line */}
        <Box sx={{ position: "absolute", left: 0, top: "16%", bottom: "16%", width: 4, zIndex: 3, borderRadius: "0 3px 3px 0", background: "linear-gradient(to bottom, transparent, #dc2626 30%, #dc2626 70%, transparent)" }} />

        <Container maxWidth="lg" sx={{ position: "relative", zIndex: 2, pt: { xs: 10, md: 8 }, pb: { xs: 18, md: 16 } }}>
          <Box sx={{ maxWidth: { xs: "100%", md: "62%" }, animation: "fadeUp 0.8s ease both" }}>
            {/* Badge */}
            <Box sx={{
              display: "inline-flex", alignItems: "center", gap: 0.8,
              px: 1.6, py: 0.55, borderRadius: "100px", mb: 3,
              bgcolor: "rgba(220,38,38,0.22)",
              border: "1px solid rgba(220,38,38,0.5)",
              backdropFilter: "blur(8px)",
            }}>
              <Box sx={{ width: 6, height: 6, borderRadius: "50%", bgcolor: "#f87171", animation: "pulse 1.4s ease infinite" }} />
              <Typography sx={{ fontSize: "0.72rem", fontWeight: 700, color: "#fca5a5", letterSpacing: "0.09em", textTransform: "uppercase" }}>
                Save a Life · Be a Hero
              </Typography>
            </Box>

              {/* Headline */}
              <Typography component="h1" sx={{
                fontSize: { xs: "3.2rem", sm: "4rem", md: "5rem" },
                fontWeight: 900, lineHeight: 1.02, letterSpacing: "-0.03em",
                color: "#ffffff", mb: 0, textShadow: "0 2px 28px rgba(0,0,0,0.55)",
              }}>
                Donate Blood,
              </Typography>
              <Typography component="h1" sx={{
                fontSize: { xs: "3.2rem", sm: "4rem", md: "5rem" },
                fontWeight: 900, lineHeight: 1.02, letterSpacing: "-0.03em",
                color: "#f87171", mb: 3, textShadow: "0 2px 28px rgba(0,0,0,0.55)",
              }}>
                Save Lives
              </Typography>

              <Typography sx={{
                color: "rgba(255,255,255,0.82)",
                fontSize: { xs: "1rem", md: "1.1rem" }, lineHeight: 1.85, maxWidth: 500, mb: 5,
                textShadow: "0 1px 12px rgba(0,0,0,0.5)",
              }}>
                Join thousands of volunteers across Cambodia helping patients in need.
                Every drop counts — your donation can be the difference between life and death.
              </Typography>

              {/* CTA */}
              <Box sx={{ display: "flex", gap: 1.5, flexWrap: "wrap", mb: 5 }}>
                <Button component={Link} href="/map" variant="contained" size="large"
                  endIcon={<ArrowForwardIcon />}
                  sx={{
                    bgcolor: "#dc2626", fontWeight: 700, px: 3.5, py: 1.65,
                    borderRadius: "10px", fontSize: "0.95rem",
                    boxShadow: "0 6px 28px rgba(220,38,38,0.6)",
                    "&:hover": { bgcolor: "#b91c1c", boxShadow: "0 12px 36px rgba(220,38,38,0.7)", transform: "translateY(-2px)" },
                    transition: "all 0.22s ease",
                  }}>
                  Find a Donation Center
                </Button>
                <Button component={Link} href="/appointments" variant="outlined" size="large"
                  sx={{
                    color: "rgba(255,255,255,0.92)",
                    borderColor: "rgba(255,255,255,0.38)",
                    bgcolor: "rgba(255,255,255,0.1)",
                    backdropFilter: "blur(8px)",
                    fontWeight: 600, px: 3.5, py: 1.65, borderRadius: "10px", fontSize: "0.95rem",
                    "&:hover": { borderColor: "#f87171", color: "#f87171", bgcolor: "rgba(220,38,38,0.15)" },
                    transition: "all 0.2s ease",
                  }}>
                  Book Appointment
                </Button>
              </Box>

              {/* Trust row */}
              <Box sx={{ display: "flex", alignItems: "center", gap: 3, flexWrap: "wrap" }}>
                {[
                  { icon: <VerifiedIcon sx={{ fontSize: 15, color: "#f87171" }} />, text: "Ministry Certified" },
                  { icon: <ShieldIcon sx={{ fontSize: 15, color: "#f87171" }} />, text: "100% Safe Process" },
                  { icon: <AccessTimeIcon sx={{ fontSize: 15, color: "#f87171" }} />, text: "Takes Under 1 Hour" },
                ].map((t, i) => (
                  <Box key={i} sx={{ display: "flex", alignItems: "center", gap: 0.6 }}>
                    {t.icon}
                    <Typography sx={{ fontSize: "0.78rem", fontWeight: 600, color: "rgba(255,255,255,0.62)" }}>
                      {t.text}
                    </Typography>
                  </Box>
                ))}
              </Box>
            </Box>

            {/* Slide indicator dots */}
            <Box sx={{ display: "flex", gap: 1, mt: 5 }}>
              {BG_PHOTOS.map((_, i) => (
                <Box key={i} onClick={() => setBgIndex(i)} sx={{
                  width: bgIndex === i ? 32 : 8, height: 8, borderRadius: "4px",
                  bgcolor: bgIndex === i ? "#dc2626" : "rgba(255,255,255,0.3)",
                  cursor: "pointer", transition: "all 0.35s ease",
                  boxShadow: bgIndex === i ? "0 0 12px rgba(220,38,38,0.65)" : "none",
                  "&:hover": { bgcolor: bgIndex === i ? "#dc2626" : "rgba(255,255,255,0.55)" },
                }} />
              ))}
            </Box>

        </Container>

        {/* Stats — frosted glass bar at bottom of hero */}
        <Box ref={statsRef} sx={{
          position: "absolute", bottom: 0, left: 0, right: 0, zIndex: 3,
          backdropFilter: "blur(24px) saturate(180%)",
          backgroundColor: "rgba(0,0,0,0.48)",
          borderTop: "1px solid rgba(255,255,255,0.1)",
          py: { xs: 2.5, md: 3.5 },
        }}>
          <Container maxWidth="lg">
            <Box sx={{ display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "space-evenly", gap: 2 }}>
              {stats.map((s, i) => (
                <React.Fragment key={i}>
                  <StatItem stat={s} active={statsOn} light />
                  {i < stats.length - 1 && (
                    <Box sx={{ width: "1px", height: 36, bgcolor: "rgba(255,255,255,0.12)", display: { xs: "none", md: "block" } }} />
                  )}
                </React.Fragment>
              ))}
            </Box>
          </Container>
        </Box>
      </Box>

      {/* ── Photo Marquee ──────────────────────────────────────────────── */}
      <Box sx={{ bgcolor: isDark ? "#050505" : "#fafafa", py: { xs: 6, md: 8 }, overflow: "hidden" }}>
        <Box textAlign="center" mb={5} px={2}>
          <Typography sx={{
            fontSize: { xs: "1.5rem", md: "2rem" }, fontWeight: 900,
            letterSpacing: "-0.025em", color: isDark ? "#f5f5f5" : "#111111", mb: 1,
          }}>
            Trusted by Hospitals &amp; Medical Professionals
          </Typography>
          <Typography color="text.secondary" fontSize="0.95rem">
            Partnering with healthcare teams across Cambodia to save lives every day.
          </Typography>
        </Box>

        {/* Row 1 — scroll left */}
        <Box sx={{ mb: 2.5, overflow: "hidden" }}>
          <Box sx={{
            display: "flex", gap: 2.5,
            animation: "marqueeLeft 38s linear infinite",
            width: "max-content",
            "&:hover": { animationPlayState: "paused" },
          }}>
            {[...MARQUEE_PHOTOS, ...MARQUEE_PHOTOS].map((p, i) => (
              <Box key={i} sx={{
                width: 280, height: 185, flexShrink: 0,
                borderRadius: "18px", overflow: "hidden",
                boxShadow: isDark ? "0 8px 24px rgba(0,0,0,0.4)" : "0 8px 24px rgba(0,0,0,0.1)",
                border: `2px solid ${isDark ? "#1a1a1a" : "#efefef"}`,
                background: isDark ? "#1a1a1a" : "#f0f0f0",
                position: "relative",
              }}>
                <img src={p.url} alt={p.label}
                  style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
                  onError={e => { e.currentTarget.style.opacity = "0"; }} />
                <Box sx={{
                  position: "absolute", bottom: 0, left: 0, right: 0,
                  background: "linear-gradient(to top, rgba(0,0,0,0.55) 0%, transparent 100%)",
                  p: 1.5,
                }}>
                  <Typography sx={{ fontSize: "0.72rem", fontWeight: 700, color: "rgba(255,255,255,0.9)", letterSpacing: "0.04em" }}>
                    {p.label}
                  </Typography>
                </Box>
              </Box>
            ))}
          </Box>
        </Box>

        {/* Row 2 — scroll right */}
        <Box sx={{ overflow: "hidden" }}>
          <Box sx={{
            display: "flex", gap: 2.5,
            animation: "marqueeRight 44s linear infinite",
            width: "max-content",
            "&:hover": { animationPlayState: "paused" },
          }}>
            {[...MARQUEE_PHOTOS.slice().reverse(), ...MARQUEE_PHOTOS.slice().reverse()].map((p, i) => (
              <Box key={i} sx={{
                width: 280, height: 185, flexShrink: 0,
                borderRadius: "18px", overflow: "hidden",
                boxShadow: isDark ? "0 8px 24px rgba(0,0,0,0.4)" : "0 8px 24px rgba(0,0,0,0.1)",
                border: `2px solid ${isDark ? "#1a1a1a" : "#efefef"}`,
                background: isDark ? "#1a1a1a" : "#f0f0f0",
                position: "relative",
              }}>
                <img src={p.url} alt={p.label}
                  style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
                  onError={e => { e.currentTarget.style.opacity = "0"; }} />
                <Box sx={{
                  position: "absolute", bottom: 0, left: 0, right: 0,
                  background: "linear-gradient(to top, rgba(0,0,0,0.55) 0%, transparent 100%)",
                  p: 1.5,
                }}>
                  <Typography sx={{ fontSize: "0.72rem", fontWeight: 700, color: "rgba(255,255,255,0.9)", letterSpacing: "0.04em" }}>
                    {p.label}
                  </Typography>
                </Box>
              </Box>
            ))}
          </Box>
        </Box>
      </Box>

      {/* ── Why BloodLife? ─────────────────────────────────────────────── */}
      <Box sx={{ position: "relative", overflow: "hidden", bgcolor: bg, py: { xs: 8, md: 10 } }}>
        <Box sx={{ position: "absolute", inset: 0, pointerEvents: "none", backgroundImage: "radial-gradient(rgba(220,38,38,0.04) 1px, transparent 1px)", backgroundSize: "30px 30px" }} />
        <Container maxWidth="lg" sx={{ position: "relative", zIndex: 1 }}>
          <Box textAlign="center" mb={7}>
            <Box sx={{ display: "inline-flex", alignItems: "center", gap: 0.8, px: 2, py: 0.6, borderRadius: "100px", mb: 2.5, bgcolor: isDark ? "rgba(220,38,38,0.1)" : "#fff1f2", border: `1px solid ${isDark ? "rgba(220,38,38,0.22)" : "#fecaca"}` }}>
              <Typography sx={{ fontSize: "0.72rem", fontWeight: 700, color: "#dc2626", letterSpacing: "0.1em", textTransform: "uppercase" }}>Why Choose Us</Typography>
            </Box>
            <Typography sx={{ fontSize: { xs: "1.8rem", md: "2.4rem" }, fontWeight: 900, letterSpacing: "-0.03em", color: isDark ? "#f5f5f5" : "#111", mb: 1 }}>
              Why BloodLife?
            </Typography>
            <Typography color="text.secondary" maxWidth={440} mx="auto">
              Built for Cambodia's healthcare needs — fast, verified, and trusted by hospitals nationwide.
            </Typography>
          </Box>

          <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr 1fr", md: "repeat(4, 1fr)" }, gap: { xs: 2, md: 2.5 } }}>
            {WHY_FEATURES.map((f, i) => (
              <Box key={i} sx={{
                position: "relative", overflow: "hidden",
                bgcolor: card, border: `1px solid ${border}`,
                borderRadius: "22px", p: { xs: 3, md: 3.5 },
                transition: "all 0.25s ease",
                animation: `fadeUp 0.5s ease ${i * 0.09}s both`,
                "&:hover": {
                  transform: "translateY(-7px)",
                  borderColor: f.color,
                  boxShadow: `0 20px 50px ${f.color}22`,
                },
              }}>
                <Box sx={{ position: "absolute", bottom: "-20%", right: "-15%", width: 120, height: 120, borderRadius: "50%", bgcolor: f.bg, filter: "blur(20px)", pointerEvents: "none" }} />
                <Box sx={{ width: 52, height: 52, borderRadius: "16px", mb: 2.5, bgcolor: f.bg, display: "flex", alignItems: "center", justifyContent: "center", border: `1px solid ${f.color}33` }}>
                  {React.cloneElement(f.icon, { sx: { fontSize: 26, color: f.color } })}
                </Box>
                <Typography fontWeight={800} fontSize="0.95rem" mb={1} sx={{ color: isDark ? "#f5f5f5" : "#111" }}>
                  {f.title}
                </Typography>
                <Typography variant="body2" color="text.secondary" lineHeight={1.7} fontSize="0.82rem">
                  {f.desc}
                </Typography>
              </Box>
            ))}
          </Box>
        </Container>
      </Box>

      {/* ── What do you need? ──────────────────────────────────────────── */}
      <Box sx={{ position: "relative", overflow: "hidden", bgcolor: alt, py: { xs: 8, md: 11 } }}>
        {/* Dot grid pattern */}
        <Box sx={{ position: "absolute", inset: 0, pointerEvents: "none", backgroundImage: "radial-gradient(rgba(220,38,38,0.07) 1px, transparent 1px)", backgroundSize: "26px 26px" }} />
        {/* Red glow blobs */}
        <Box sx={{ position: "absolute", right: "-5%", top: "-30%", width: 560, height: 560, borderRadius: "50%", background: "radial-gradient(circle, rgba(220,38,38,0.08) 0%, transparent 68%)", filter: "blur(60px)", pointerEvents: "none" }} />
        <Box sx={{ position: "absolute", left: "-5%", bottom: "-30%", width: 400, height: 400, borderRadius: "50%", background: "radial-gradient(circle, rgba(185,28,28,0.07) 0%, transparent 68%)", filter: "blur(60px)", pointerEvents: "none" }} />
        <Container maxWidth="lg" sx={{ position: "relative", zIndex: 1 }}>
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

          <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr 1fr", md: "repeat(4, 1fr)" }, gap: 2.5 }}>
            {actions.map((a, idx) => (
              <Link key={idx} href={a.link} style={{ textDecoration: "none" }}>
                <Box sx={{
                  position: "relative", overflow: "hidden", height: "100%", minHeight: 230,
                  bgcolor: a.red ? "#dc2626" : card,
                  border: `1px solid ${a.red ? "transparent" : border}`,
                  borderRadius: "22px", p: { xs: 3, md: 3.5 },
                  cursor: "pointer", transition: "all 0.25s ease",
                  animation: `fadeUp 0.5s ease ${idx * 0.09}s both`,
                  display: "flex", flexDirection: "column",
                  boxShadow: a.red ? "0 12px 40px rgba(220,38,38,0.35)" : "none",
                  "&:hover": {
                    transform: "translateY(-8px)",
                    boxShadow: a.red
                      ? "0 24px 60px rgba(220,38,38,0.5)"
                      : isDark ? "0 24px 60px rgba(220,38,38,0.14)" : "0 24px 60px rgba(0,0,0,0.12)",
                    "& .card-arrow": { transform: "translateX(5px)" },
                  },
                }}>
                  {/* Decorative circle */}
                  <Box sx={{
                    position: "absolute", top: "-25%", right: "-18%", width: 160, height: 160, borderRadius: "50%",
                    bgcolor: a.red ? "rgba(255,255,255,0.1)" : "rgba(220,38,38,0.06)", pointerEvents: "none",
                  }} />
                  {/* Icon */}
                  <Box sx={{
                    width: 62, height: 62, borderRadius: "18px", mb: 3, flexShrink: 0,
                    bgcolor: a.red ? "rgba(255,255,255,0.22)" : isDark ? "rgba(220,38,38,0.12)" : "#fff1f2",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    border: `1px solid ${a.red ? "rgba(255,255,255,0.25)" : isDark ? "rgba(220,38,38,0.2)" : "#fecaca"}`,
                    boxShadow: a.red ? "0 6px 20px rgba(0,0,0,0.15)" : "none",
                    color: a.red ? "#fff" : "#dc2626",
                  }}>
                    {React.cloneElement(a.icon, { sx: { fontSize: 28 } })}
                  </Box>
                  <Typography fontWeight={800} fontSize="1.05rem" mb={1}
                    sx={{ color: a.red ? "#ffffff" : isDark ? "#f5f5f5" : "#111111" }}>
                    {a.title}
                  </Typography>
                  <Typography variant="body2" sx={{
                    color: a.red ? "rgba(255,255,255,0.8)" : "text.secondary",
                    lineHeight: 1.75, mb: 3, flex: 1,
                  }}>
                    {a.desc}
                  </Typography>
                  <Box className="card-arrow" sx={{ display: "inline-flex", alignItems: "center", gap: 0.5, color: a.red ? "rgba(255,255,255,0.9)" : "#dc2626", transition: "transform 0.22s ease" }}>
                    <Typography sx={{ fontSize: "0.8rem", fontWeight: 700 }}>Get started</Typography>
                    <ArrowForwardIcon sx={{ fontSize: 15 }} />
                  </Box>
                </Box>
              </Link>
            ))}
          </Box>
        </Container>
      </Box>

      {/* ── How It Works ──────────────────────────────────────────────── */}
      <Box sx={{ position: "relative", overflow: "hidden", bgcolor: bg, py: { xs: 8, md: 12 } }}>
        {/* Faint hospital texture */}
        <Box sx={{ position: "absolute", inset: 0, backgroundImage: `url(https://images.unsplash.com/photo-1538108149393-fbbd81895907?w=1920&h=800&fit=crop&q=40)`, backgroundSize: "cover", backgroundPosition: "center", opacity: isDark ? 0.04 : 0.03, pointerEvents: "none" }} />
        <Box sx={{ position: "absolute", inset: 0, pointerEvents: "none", backgroundImage: "radial-gradient(rgba(220,38,38,0.045) 1px, transparent 1px)", backgroundSize: "32px 32px" }} />
        <Box sx={{ position: "absolute", right: "-8%", top: "10%", width: 500, height: 500, borderRadius: "50%", background: "radial-gradient(circle, rgba(220,38,38,0.07) 0%, transparent 68%)", filter: "blur(70px)", pointerEvents: "none" }} />
        <Box sx={{ position: "absolute", left: "-5%", bottom: "-10%", width: 380, height: 380, borderRadius: "50%", background: "radial-gradient(circle, rgba(185,28,28,0.06) 0%, transparent 68%)", filter: "blur(60px)", pointerEvents: "none" }} />
        <Container maxWidth="lg" sx={{ position: "relative", zIndex: 1 }}>
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

          <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "repeat(3, 1fr)" }, gap: { xs: 2, md: 3 }, position: "relative" }}>
            {/* Desktop arrow connectors */}
            {[0, 1].map((idx) => (
              <Box key={idx} sx={{
                display: { xs: "none", md: "flex" },
                position: "absolute",
                top: 52,
                left: idx === 0 ? "calc(33.33% - 18px)" : "calc(66.66% - 18px)",
                alignItems: "center", justifyContent: "center",
                zIndex: 2,
              }}>
                <Box sx={{
                  width: 36, height: 36, borderRadius: "50%",
                  bgcolor: isDark ? "#1a1a1a" : "#fff",
                  border: `2px solid ${isDark ? "#2a2a2a" : "#fecaca"}`,
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}>
                  <ArrowForwardIcon sx={{ fontSize: 16, color: "#dc2626" }} />
                </Box>
              </Box>
            ))}

            {steps.map((s, i) => (
              <Box key={i} sx={{
                position: "relative",
                background: i === 1
                  ? "linear-gradient(135deg, #dc2626 0%, #b91c1c 100%)"
                  : isDark ? "#111111" : "#ffffff",
                border: `1px solid ${i === 1 ? "transparent" : border}`,
                borderRadius: "24px",
                p: { xs: 3.5, md: 4.5 },
                animation: `fadeUp 0.6s ease ${i * 0.12}s both`,
                transition: "all 0.25s ease",
                boxShadow: i === 1
                  ? "0 20px 60px rgba(220,38,38,0.35)"
                  : "none",
                "&:hover": {
                  transform: "translateY(-8px)",
                  boxShadow: i === 1
                    ? "0 28px 70px rgba(220,38,38,0.45)"
                    : isDark
                      ? "0 20px 50px rgba(220,38,38,0.15)"
                      : "0 20px 50px rgba(220,38,38,0.12)",
                },
              }}>
                {/* Step number pill */}
                <Box sx={{
                  display: "inline-flex", alignItems: "center", justifyContent: "center",
                  px: 1.5, py: 0.4, borderRadius: "100px", mb: 3,
                  bgcolor: i === 1 ? "rgba(255,255,255,0.2)" : isDark ? "rgba(220,38,38,0.12)" : "#fff1f2",
                }}>
                  <Typography sx={{
                    fontSize: "0.7rem", fontWeight: 800, letterSpacing: "0.1em",
                    color: i === 1 ? "white" : "#dc2626",
                    textTransform: "uppercase",
                  }}>
                    Step {s.num}
                  </Typography>
                </Box>

                {/* Icon circle */}
                <Box sx={{
                  width: 64, height: 64, borderRadius: "20px", mb: 3,
                  bgcolor: i === 1 ? "rgba(255,255,255,0.18)" : isDark ? "rgba(220,38,38,0.1)" : "#fff1f2",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  border: `1.5px solid ${i === 1 ? "rgba(255,255,255,0.25)" : isDark ? "rgba(220,38,38,0.2)" : "#fecaca"}`,
                }}>
                  {React.cloneElement(s.icon, {
                    sx: { fontSize: 28, color: i === 1 ? "white" : "#dc2626" },
                  })}
                </Box>

                <Typography fontWeight={800} fontSize="1.1rem" mb={1.2} sx={{ color: i === 1 ? "white" : isDark ? "#f5f5f5" : "#111" }}>
                  {s.title}
                </Typography>
                <Typography variant="body2" lineHeight={1.8} sx={{ color: i === 1 ? "rgba(255,255,255,0.82)" : "text.secondary" }}>
                  {s.desc}
                </Typography>
              </Box>
            ))}
          </Box>
        </Container>
      </Box>

      {/* ── Blood Type Grid ────────────────────────────────────────────── */}
      <Box sx={{ position: "relative", overflow: "hidden", py: { xs: 8, md: 11 } }}>
        {/* Always-dark crimson background */}
        <Box sx={{ position: "absolute", inset: 0, background: "linear-gradient(135deg, #0f0404 0%, #1c0808 45%, #100808 100%)" }} />
        <Box sx={{ position: "absolute", top: 0, right: 0, width: "55%", height: "100%", background: "radial-gradient(ellipse at 100% 50%, rgba(220,38,38,0.13) 0%, transparent 65%)", pointerEvents: "none" }} />
        <Box sx={{ position: "absolute", bottom: 0, left: 0, width: "40%", height: "60%", background: "radial-gradient(ellipse at 0% 100%, rgba(185,28,28,0.1) 0%, transparent 65%)", pointerEvents: "none" }} />
        <Box sx={{ position: "absolute", inset: 0, pointerEvents: "none", backgroundImage: "radial-gradient(rgba(255,255,255,0.025) 1px, transparent 1px)", backgroundSize: "28px 28px" }} />
        <Container maxWidth="lg" sx={{ position: "relative", zIndex: 1 }}>
          <Box textAlign="center" mb={6}>
            <Typography sx={{
              fontSize: { xs: "1.7rem", md: "2.2rem" }, fontWeight: 900,
              letterSpacing: "-0.025em", color: "#f5f5f5", mb: 1,
            }}>
              Blood Type Compatibility
            </Typography>
            <Typography sx={{ color: "rgba(255,255,255,0.55)" }}>Know your type. Know who you can help.</Typography>
          </Box>
          <Box sx={{ display: "grid", gridTemplateColumns: { xs: "repeat(2, 1fr)", sm: "repeat(4, 1fr)", md: "repeat(8, 1fr)" }, gap: 1.5 }}>
            {bloodTypes.map((bt, i) => (
              <Box key={i} sx={{
                bgcolor: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)",
                borderRadius: "14px", p: 2, textAlign: "center",
                transition: "all 0.2s ease",
                backdropFilter: "blur(8px)",
                "&:hover": {
                  borderColor: "#dc2626",
                  bgcolor: "rgba(220,38,38,0.1)",
                  boxShadow: "0 8px 28px rgba(220,38,38,0.25)",
                  transform: "translateY(-4px)",
                },
              }}>
                <Typography sx={{ fontSize: "1.65rem", fontWeight: 900, color: "#f87171", letterSpacing: "-0.03em", lineHeight: 1 }}>
                  {bt.type}
                </Typography>
                <Typography sx={{ fontSize: "0.62rem", color: "rgba(255,255,255,0.4)", mt: 0.5, lineHeight: 1.4, fontWeight: 500 }}>
                  {bt.pct}% of people
                </Typography>
              </Box>
            ))}
          </Box>
          <Typography variant="caption" sx={{ color: "rgba(255,255,255,0.35)" }} display="block" textAlign="center" mt={3}>
            O- is the universal donor type — compatible with all blood types.
          </Typography>
        </Container>
      </Box>

      {/* ── Community Profiles ────────────────────────────────────────── */}
      <Box sx={{ position: "relative", overflow: "hidden", py: { xs: 8, md: 12 }, bgcolor: bg }}>
        {/* Blurred hospital photo background */}
        <Box sx={{ position: "absolute", inset: 0, backgroundImage: `url(https://images.unsplash.com/photo-1584820927498-cfe5211fd8bf?w=1920&h=900&fit=crop&q=50)`, backgroundSize: "cover", backgroundPosition: "center", opacity: isDark ? 0.05 : 0.04, pointerEvents: "none" }} />
        {/* Theme overlay */}
        <Box sx={{ position: "absolute", inset: 0, bgcolor: isDark ? "rgba(10,10,10,0.97)" : "rgba(255,255,255,0.95)", pointerEvents: "none" }} />
        {/* Dot grid */}
        <Box sx={{ position: "absolute", inset: 0, pointerEvents: "none", backgroundImage: "radial-gradient(rgba(220,38,38,0.055) 1px, transparent 1px)", backgroundSize: "24px 24px" }} />
        {/* Red glow accents */}
        <Box sx={{ position: "absolute", top: "0%", left: "-5%", width: 450, height: 450, borderRadius: "50%", background: "radial-gradient(circle, rgba(220,38,38,0.09) 0%, transparent 68%)", filter: "blur(70px)", pointerEvents: "none" }} />
        <Box sx={{ position: "absolute", bottom: "0%", right: "-5%", width: 380, height: 380, borderRadius: "50%", background: "radial-gradient(circle, rgba(185,28,28,0.08) 0%, transparent 68%)", filter: "blur(65px)", pointerEvents: "none" }} />
        <Container maxWidth="lg" sx={{ position: "relative", zIndex: 1 }}>
          <Box textAlign="center" mb={7}>
            <Box sx={{
              display: "inline-block", px: 2.2, py: 0.65, borderRadius: "100px", mb: 2.5,
              bgcolor: isDark ? "rgba(220,38,38,0.1)" : "#fff1f2",
              border: `1px solid ${isDark ? "rgba(220,38,38,0.22)" : "#fecaca"}`,
            }}>
              <Typography sx={{ fontSize: "0.72rem", fontWeight: 700, color: "#dc2626", letterSpacing: "0.1em", textTransform: "uppercase" }}>
                Our Community
              </Typography>
            </Box>
            <Typography sx={{
              fontSize: { xs: "1.7rem", md: "2.2rem" }, fontWeight: 900,
              letterSpacing: "-0.025em", color: isDark ? "#f5f5f5" : "#111111", mb: 1,
            }}>
              People Behind the Mission
            </Typography>
            <Typography color="text.secondary" maxWidth={420} mx="auto">
              Donors, families, and medical professionals united by one purpose.
            </Typography>
          </Box>

          <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "repeat(3, 1fr)" }, gap: 3 }}>
            {profiles.map((p, i) => (
              <Box key={i} sx={{
                bgcolor: card, border: `1px solid ${border}`, borderRadius: "24px",
                overflow: "hidden", textAlign: "center",
                transition: "all 0.25s ease",
                animation: `fadeUp 0.6s ease ${i * 0.12}s both`,
                "&:hover": {
                  borderColor: p.color,
                  boxShadow: `0 28px 65px ${p.color}28`,
                  transform: "translateY(-8px)",
                },
              }}>
                {/* Gradient color header */}
                <Box sx={{
                  height: 115, position: "relative", overflow: "hidden",
                  background: `linear-gradient(135deg, ${p.color} 0%, ${p.color}cc 100%)`,
                }}>
                  <Box sx={{ position: "absolute", inset: 0, backgroundImage: "radial-gradient(rgba(255,255,255,0.13) 1px, transparent 1px)", backgroundSize: "18px 18px" }} />
                  <Box sx={{ position: "absolute", top: "-20%", right: "-10%", width: 130, height: 130, borderRadius: "50%", bgcolor: "rgba(255,255,255,0.1)", pointerEvents: "none" }} />
                  <Box sx={{ position: "absolute", bottom: "-30%", left: "-5%", width: 100, height: 100, borderRadius: "50%", bgcolor: "rgba(0,0,0,0.12)", pointerEvents: "none" }} />
                </Box>

                {/* Avatar — sibling of header so it's not clipped by header's overflow:hidden */}
                <Box sx={{ display: "flex", justifyContent: "center", mt: "-46px", mb: 0, position: "relative", zIndex: 2 }}>
                  <Avatar
                    src={p.photo ? (p.photo.startsWith("http") ? p.photo : `${API_BASE}${p.photo}`) : undefined}
                    alt={p.name}
                    sx={{
                      width: 92, height: 92,
                      bgcolor: p.color, fontSize: "1.6rem", fontWeight: 900,
                      border: "4px solid", borderColor: isDark ? card : "#ffffff",
                      boxShadow: `0 10px 32px ${p.color}70`,
                    }}
                  >
                    {p.initials}
                  </Avatar>
                </Box>

                {/* Card content */}
                <Box sx={{ p: { xs: 3, md: 3.5 }, pt: { xs: 2, md: 2.5 } }}>
                  {/* Badge */}
                  <Box sx={{
                    display: "inline-block", px: 1.5, py: 0.4, borderRadius: "100px", mb: 1.5,
                    bgcolor: `${p.color}18`, border: `1px solid ${p.color}44`,
                  }}>
                    <Typography sx={{ fontSize: "0.68rem", fontWeight: 700, color: p.color, letterSpacing: "0.06em" }}>
                      {p.badge}
                    </Typography>
                  </Box>

                  <Typography fontWeight={900} fontSize="1.1rem" mb={0.3} sx={{ color: isDark ? "#f5f5f5" : "#111" }}>
                    {p.name}
                  </Typography>
                  <Typography variant="caption" color="text.disabled" display="block" mb={2.2}>
                    {p.role}
                  </Typography>

                  <Typography variant="body2" color="text.secondary" lineHeight={1.8} mb={3}>
                    {p.bio}
                  </Typography>

                  {/* Stats row */}
                  <Box sx={{ display: "flex", justifyContent: "center", gap: 0, pt: 2, borderTop: `1px solid ${border}` }}>
                    <Box sx={{ flex: 1, textAlign: "center", py: 1 }}>
                      <Typography sx={{ fontSize: "1.4rem", fontWeight: 900, color: p.color, lineHeight: 1 }}>{p.donations}</Typography>
                      <Typography variant="caption" color="text.disabled" display="block" mt={0.3}>Donations</Typography>
                    </Box>
                    <Box sx={{ width: "1px", bgcolor: border }} />
                    <Box sx={{ flex: 1, textAlign: "center", py: 1 }}>
                      <Typography sx={{ fontSize: "1.4rem", fontWeight: 900, color: p.color, lineHeight: 1 }}>{p.bloodType}</Typography>
                      <Typography variant="caption" color="text.disabled" display="block" mt={0.3}>Blood Type</Typography>
                    </Box>
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
        background: "linear-gradient(135deg, #7f1d1d 0%, #991b1b 30%, #dc2626 65%, #b91c1c 100%)",
      }}>
        {/* Photo texture */}
        <Box sx={{ position: "absolute", inset: 0, backgroundImage: `url(https://images.unsplash.com/photo-1576091160550-2173dba999ef?w=1920&h=600&fit=crop&q=40)`, backgroundSize: "cover", backgroundPosition: "center", opacity: 0.08, mixBlendMode: "luminosity" }} />
        <Box sx={{ position: "absolute", inset: 0, backgroundImage: "radial-gradient(rgba(255,255,255,0.05) 1px, transparent 1px)", backgroundSize: "26px 26px", pointerEvents: "none" }} />
        <Box sx={{ position: "absolute", top: "-30%", right: "-10%", width: 600, height: 600, borderRadius: "50%", bgcolor: "rgba(255,255,255,0.04)", pointerEvents: "none" }} />
        <Box sx={{ position: "absolute", bottom: "-25%", left: "-8%", width: 450, height: 450, borderRadius: "50%", bgcolor: "rgba(0,0,0,0.15)", pointerEvents: "none" }} />

        <Container maxWidth="md" sx={{ position: "relative", zIndex: 1 }}>
          <Box sx={{
            width: 72, height: 72, borderRadius: "22px", mx: "auto", mb: 3,
            bgcolor: "rgba(255,255,255,0.18)", display: "flex", alignItems: "center", justifyContent: "center",
            border: "1px solid rgba(255,255,255,0.25)",
            boxShadow: "0 8px 32px rgba(0,0,0,0.2)",
          }}>
            <FavoriteIcon sx={{ fontSize: 34, color: "white", animation: "pulse 2s ease infinite" }} />
          </Box>

          {/* Mini stat chips */}
          <Box sx={{ display: "flex", justifyContent: "center", gap: 1.5, mb: 4, flexWrap: "wrap" }}>
            {[["15,230+", "Donors"], ["24,300+", "Lives Saved"], ["126", "Hospitals"]].map(([val, lbl]) => (
              <Box key={lbl} sx={{ px: 2, py: 0.8, borderRadius: "100px", bgcolor: "rgba(255,255,255,0.15)", border: "1px solid rgba(255,255,255,0.22)", backdropFilter: "blur(8px)" }}>
                <Typography sx={{ fontSize: "0.8rem", fontWeight: 800, color: "white" }}>{val} <Box component="span" sx={{ fontWeight: 400, opacity: 0.75 }}>{lbl}</Box></Typography>
              </Box>
            ))}
          </Box>

          <Typography sx={{
            fontSize: { xs: "2.2rem", md: "3rem" }, fontWeight: 900, color: "white",
            letterSpacing: "-0.03em", lineHeight: 1.05, mb: 2,
            textShadow: "0 2px 20px rgba(0,0,0,0.3)",
          }}>
            Ready to Save a Life Today?
          </Typography>
          <Typography sx={{ color: "rgba(255,255,255,0.8)", mb: 5.5, fontSize: "1.08rem", maxWidth: 520, mx: "auto", lineHeight: 1.85 }}>
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
