'use client';
import Link from 'next/link';
import Image from 'next/image';
import { useEffect, useState } from "react";
import {
  Container, Typography, Box, Button, Paper, useTheme,
} from "@mui/material";
import axios from "axios";
import API_BASE from "@/lib/config";
import { script } from '@/lib/fonts';
import CreatorProfile from './_components/CreatorProfile';
import { mergeSections, aboutImageUrl } from '@/lib/aboutContent';
import RichText from '@/components/ui/RichText';
import VolunteerActivismIcon from "@mui/icons-material/VolunteerActivism";
import GroupsIcon from "@mui/icons-material/Groups";
import PeopleIcon from "@mui/icons-material/People";
import ShieldIcon from "@mui/icons-material/Shield";
import FavoriteIcon from "@mui/icons-material/Favorite";
import MonitorHeartIcon from "@mui/icons-material/MonitorHeart";
import FormatQuoteIcon from "@mui/icons-material/FormatQuote";
import LocalHospitalIcon from "@mui/icons-material/LocalHospital";
import TaskAltIcon from "@mui/icons-material/TaskAlt";
import BloodtypeIcon from "@mui/icons-material/Bloodtype";
import TrackChangesIcon from "@mui/icons-material/TrackChanges";
import VisibilityIcon from "@mui/icons-material/Visibility";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";

// Icons for the editable lists, by position. The text comes from Settings → About Page.
const heroFeatureIcons = [<ShieldIcon key="s" />, <GroupsIcon key="g" />, <FavoriteIcon key="f" />];
const purposeIcons = [<TrackChangesIcon key="t" />, <VisibilityIcon key="v" />, <TrendingUpIcon key="u" />];

const cardSx = (isDark) => ({
  borderRadius: 4,
  backgroundColor: isDark ? "#1a1a1a" : "#fff",
  border: `1px solid ${isDark ? "#2a2a2a" : "#efefef"}`,
  boxShadow: isDark ? "none" : "0 4px 24px rgba(0,0,0,0.06)",
});

const About = () => {
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";
  const [stats, setStats] = useState(null);
  // Admin-edited content; null until loaded, and the built-in text is shown meanwhile (or if it fails).
  const [about, setAbout] = useState(null);

  useEffect(() => {
    axios.get(`${API_BASE}/api/stats/public`)
      .then((res) => setStats(res.data))
      .catch((err) => console.error("Failed to fetch platform stats:", err));
    axios.get(`${API_BASE}/api/about`)
      .then((res) => setAbout(res.data))
      .catch(() => { /* keep the built-in content */ });
  }, []);

  const content = mergeSections(about?.sections);
  const { hero, purpose, cta } = content;
  const heroImg = aboutImageUrl(about?.heroImage, "heroImage");
  const purposeImg = aboutImageUrl(about?.purposeImage, "purposeImage");
  const heroFeatures = content.values.map((v, i) => ({ ...v, icon: heroFeatureIcons[i] }));
  const purposeCards = content.pillars.map((p, i) => ({ ...p, icon: purposeIcons[i] }));

  // Values are live counts; the labels and captions are editable.
  const statCards = [
    { icon: <PeopleIcon />, value: stats ? stats.donors : "…" },
    { icon: <BloodtypeIcon />, value: stats ? stats.donations : "…" },
    { icon: <LocalHospitalIcon />, value: stats ? `${stats.hospitals}` : "…" },
    { icon: <TaskAltIcon />, value: stats ? stats.fulfilledRequests : "…" },
  ].map((s, i) => ({ ...s, ...content.stats[i] }));

  return (
    <Box sx={{ backgroundColor: isDark ? "#121212" : "#f4f4f4" }}>

      {/* ── Hero — split layout: copy left, photo right ─────────────────────── */}
      <Box sx={{
        position: "relative", overflow: "hidden",
        background: isDark
          ? "linear-gradient(135deg, #161112 0%, #121212 100%)"
          : "linear-gradient(135deg, #fdf3f3 0%, #f9fafb 100%)",
      }}>
        <Box aria-hidden="true" sx={{
          position: "absolute", left: "-10%", top: "-25%", width: 480, height: 480, borderRadius: "50%",
          background: `radial-gradient(circle, ${isDark ? "rgba(183,28,28,0.10)" : "rgba(198,40,40,0.08)"} 0%, transparent 68%)`,
          pointerEvents: "none",
        }} />

        <Container maxWidth="lg" sx={{ position: "relative", py: { xs: 7, md: 9 } }}>
          <Box sx={{
            display: "grid",
            gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" },
            gap: { xs: 5, md: 7 },
            alignItems: "center",
          }}>
            {/* Left: copy */}
            <Box>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 2 }}>
                <Typography variant="overline" color="error" fontWeight={700} letterSpacing="0.12em">
                  {hero.eyebrow}
                </Typography>
                <Box sx={{ width: 36, height: 3, borderRadius: 2, backgroundColor: "error.main", flexShrink: 0 }} />
              </Box>
              <Typography sx={{
                fontWeight: 800, lineHeight: 1.1, mb: 1.5,
                fontSize: { xs: "2.2rem", md: "2.9rem" },
                color: isDark ? "#fff" : "#161a23",
              }}>
                {hero.title}
                <Box component="span" sx={{ display: "block", color: "error.main" }}>{hero.titleAccent}</Box>
              </Typography>
              <Typography sx={{
                fontWeight: 700, mb: 2, fontSize: { xs: "1.05rem", md: "1.2rem" },
                color: isDark ? "#fff" : "#161a23",
              }}>
                {hero.headline}
              </Typography>
              <RichText value={hero.intro} sx={{ mb: 3.5, color: "text.secondary", fontSize: "1.02rem", lineHeight: 1.75 }} />

              <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap", mb: 4 }}>
                <Button component={Link} href="/donate" variant="contained" color="error" size="large"
                  startIcon={<FavoriteIcon />} endIcon={<ArrowForwardIcon />}
                  sx={{
                    fontWeight: 700, px: 3.5, py: 1.3, borderRadius: 3,
                    background: "linear-gradient(135deg, #b71c1c 0%, #d32f2f 100%)",
                    boxShadow: "0 6px 20px rgba(183,28,28,0.4)",
                    "&:hover": { boxShadow: "0 8px 28px rgba(183,28,28,0.55)" },
                  }}>
                  Become a Donor
                </Button>
                <Button component={Link} href="#team-section" variant="outlined" color="error" size="large"
                  startIcon={<GroupsIcon />}
                  sx={{ fontWeight: 700, px: 3.5, py: 1.3, borderRadius: 3 }}>
                  Meet the Team
                </Button>
              </Box>

              <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "repeat(3, auto)" }, gap: { xs: 2.5, sm: 4 } }}>
                {heroFeatures.map((f, i) => (
                  <Box key={i} sx={{ display: "flex", alignItems: "flex-start", gap: 1.5 }}>
                    <Box sx={{ color: "error.main", mt: 0.2, "& svg": { fontSize: 22 } }}>{f.icon}</Box>
                    <Box>
                      <Typography fontWeight={700} sx={{ fontSize: "0.9rem", lineHeight: 1.3 }}>{f.title}</Typography>
                      <Typography variant="caption" color="text.secondary" sx={{ lineHeight: 1.3, display: "block" }}>
                        {f.subtitle}
                      </Typography>
                    </Box>
                  </Box>
                ))}
              </Box>
            </Box>

            {/* Right: photo */}
            <Box sx={{ justifySelf: { xs: "center", md: "end" }, width: "100%", maxWidth: 460 }}>
              <Box sx={{
                position: "relative", height: { xs: 320, md: 400 }, overflow: "hidden",
                borderRadius: 5, boxShadow: "0 20px 50px rgba(0,0,0,0.25)",
              }}>
                <Image src={heroImg} alt="A nurse caring for a blood donor" fill unoptimized={!!about?.heroImage}
                  sizes="(max-width: 900px) 100vw, 460px" style={{ objectFit: "cover" }} priority
                />

                {/* Top-left overlay */}
                <Box sx={{ position: "absolute", top: 20, left: 20, maxWidth: 150 }}>
                  <FavoriteIcon sx={{ color: "#fff", fontSize: 22, mb: 0.5, filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.5))" }} />
                  <Typography sx={{
                    color: "#fff", fontWeight: 800, fontSize: "1.05rem", lineHeight: 1.25,
                    textShadow: "0 2px 6px rgba(0,0,0,0.7)",
                  }}>
                    A Brighter Cambodia Through Your Blood
                  </Typography>
                </Box>

                {/* Top-right overlay */}
                <Box sx={{ position: "absolute", top: 20, right: 20, maxWidth: 140, textAlign: "right" }}>
                  <MonitorHeartIcon sx={{ color: "#fff", fontSize: 22, mb: 0.5, filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.5))" }} />
                  <Typography sx={{
                    color: "#fff", fontWeight: 700, fontSize: "0.92rem", lineHeight: 1.25,
                    textShadow: "0 2px 6px rgba(0,0,0,0.7)",
                  }}>
                    Donate Today, A Healthier Tomorrow
                  </Typography>
                </Box>

                {/* Handwritten accent */}
                <Typography className={script.className} sx={{
                  position: "absolute", bottom: 22, left: 20, maxWidth: 180,
                  color: "#fff", fontSize: "1.5rem", lineHeight: 1.2,
                  transform: "rotate(-3deg)", textShadow: "0 2px 6px rgba(0,0,0,0.7)",
                }}>
                  Real People<br />Real Impact<br />In Cambodia ♡
                </Typography>
              </Box>

              {/* Quote card, overlapping the photo's bottom-right */}
              <Paper elevation={0} sx={{
                ...cardSx(isDark), mt: -3.5, mr: { xs: 0, md: 2 }, ml: "auto", maxWidth: 260,
                position: "relative", p: 2.5, display: "flex", alignItems: "center", gap: 1.5,
              }}>
                <FormatQuoteIcon sx={{ fontSize: 30, color: "error.main", flexShrink: 0, transform: "scaleX(-1)" }} />
                <Typography fontWeight={800} sx={{ fontSize: "0.95rem", lineHeight: 1.3 }}>
                  Together<br />We Save Lives
                </Typography>
              </Paper>
            </Box>
          </Box>
        </Container>
      </Box>

      {/* ── Stats row ─────────────────────────────────────────────────────── */}
      <Container maxWidth="lg" sx={{ py: { xs: 5, md: 6 } }}>
        <Box sx={{ display: "grid", gridTemplateColumns: { xs: "repeat(2, minmax(0, 1fr))", md: "repeat(4, minmax(0, 1fr))" }, gap: { xs: 1.5, sm: 2.5 } }}>
          {statCards.map((s) => (
            <Paper key={s.label} elevation={0} sx={{ ...cardSx(isDark), p: { xs: 1.75, sm: 2.5 }, display: "flex", alignItems: "center", gap: { xs: 1.25, sm: 1.75 } }}>
              <Box sx={{
                width: { xs: 40, sm: 48 }, height: { xs: 40, sm: 48 }, borderRadius: "50%", flexShrink: 0,
                backgroundColor: isDark ? "rgba(183,28,28,0.16)" : "#fdeaea",
                color: "error.main", display: "flex", alignItems: "center", justifyContent: "center",
                "& svg": { fontSize: { xs: 19, sm: 22 } },
              }}>
                {s.icon}
              </Box>
              <Box sx={{ minWidth: 0, overflowWrap: "anywhere" }}>
                <Typography fontWeight={800} color="error.main" sx={{ fontSize: "1.4rem", lineHeight: 1.15 }}>{s.value}</Typography>
                <Typography fontWeight={700} sx={{ fontSize: "0.85rem", lineHeight: 1.25 }}>{s.label}</Typography>
                <Typography variant="caption" color="text.secondary" sx={{ display: "block" }}>{s.caption}</Typography>
              </Box>
            </Paper>
          ))}
        </Box>
      </Container>

      {/* ── Our Purpose ───────────────────────────────────────────────────── */}
      <Container maxWidth="lg" sx={{ pb: { xs: 8, md: 10 } }}>
        <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" }, gap: { xs: 5, md: 7 }, alignItems: "center" }}>
          {/* Photo + quote */}
          <Box sx={{ position: "relative" }}>
            <Box sx={{
              position: "relative", height: { xs: 280, md: 340 }, overflow: "hidden",
              borderRadius: 4, boxShadow: "0 16px 40px rgba(0,0,0,0.18)",
            }}>
              <Image src={purposeImg} alt={about?.purposeImage ? "" : "Angkor Wat, Cambodia"} fill unoptimized={!!about?.purposeImage}
                sizes="(max-width: 900px) 100vw, 600px" style={{ objectFit: "cover" }}
              />
            </Box>
            <Paper elevation={0} sx={{
              ...cardSx(isDark), position: "absolute", top: 20, right: -16,
              maxWidth: 200, p: 2.5, display: { xs: "none", sm: "block" },
            }}>
              <FormatQuoteIcon sx={{ fontSize: 26, color: "error.main", transform: "scaleX(-1)", display: "block", mb: 0.5 }} />
              <Typography fontWeight={800} sx={{ fontSize: "0.95rem", lineHeight: 1.35 }}>
                {purpose.quote}
              </Typography>
              <Box sx={{ width: 32, height: 3, borderRadius: 2, backgroundColor: "error.main", mt: 1.5 }} />
            </Paper>
          </Box>

          {/* Copy + mini cards */}
          <Box>
            <Typography variant="overline" color="error" fontWeight={700} letterSpacing="0.12em">
              {purpose.eyebrow}
            </Typography>
            <Typography sx={{
              fontWeight: 800, mt: 0.5, mb: 2, lineHeight: 1.25,
              fontSize: { xs: "1.6rem", md: "1.9rem" },
              color: isDark ? "#fff" : "#161a23",
            }}>
              {purpose.title}
            </Typography>
            <RichText value={purpose.text} sx={{ mb: 3.5, color: "text.secondary", fontSize: "1rem", lineHeight: 1.75, "& p + p": { mt: 1.5 } }} />

            <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "repeat(3, 1fr)" }, gap: 2 }}>
              {purposeCards.map((c, i) => (
                <Paper key={i} elevation={0} sx={{ ...cardSx(isDark), p: 2.5 }}>
                  <Box sx={{
                    width: 38, height: 38, borderRadius: 2, mb: 1.5,
                    backgroundColor: isDark ? "rgba(183,28,28,0.16)" : "#fdeaea",
                    color: "error.main", display: "flex", alignItems: "center", justifyContent: "center",
                    "& svg": { fontSize: 19 },
                  }}>
                    {c.icon}
                  </Box>
                  <Typography fontWeight={700} sx={{ fontSize: "0.9rem", mb: 0.75 }}>{c.title}</Typography>
                  <Typography variant="caption" color="text.secondary" sx={{ lineHeight: 1.6, display: "block" }}>{c.desc}</Typography>
                </Paper>
              ))}
            </Box>
          </Box>
        </Box>
      </Container>

      {/* ── Builder ───────────────────────────────────────────────────────── */}
      <CreatorProfile team={content.team} photo={aboutImageUrl(about?.creatorPhoto, "creatorPhoto")} />

      {/* ── CTA strip ─────────────────────────────────────────────────────── */}
      <Container maxWidth="lg" sx={{ py: { xs: 6, md: 8 } }}>
        <Paper elevation={0} sx={{
          borderRadius: 4, p: { xs: 3.5, md: 5 },
          backgroundColor: isDark ? "rgba(183,28,28,0.08)" : "#fdeaea",
          display: "flex", alignItems: "center", justifyContent: "space-between",
          flexWrap: "wrap", gap: 3,
        }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 3, flexWrap: "wrap" }}>
            <Box sx={{
              width: 64, height: 64, borderRadius: "50%", flexShrink: 0,
              background: "linear-gradient(135deg, #b71c1c 0%, #7f0000 100%)",
              display: "flex", alignItems: "center", justifyContent: "center",
              boxShadow: "0 8px 24px rgba(183,28,28,0.4)",
            }}>
              <VolunteerActivismIcon sx={{ color: "white", fontSize: 30 }} />
            </Box>
            <Box>
              <Typography fontWeight={800} sx={{ fontSize: { xs: "1.15rem", md: "1.3rem" } }}>
                {cta.title}
              </Typography>
              <Typography color="text.secondary" sx={{ mt: 0.5 }}>
                {cta.text}
              </Typography>
            </Box>
          </Box>
          <Button component={Link} href="/donate" variant="contained" color="error" size="large"
            startIcon={<FavoriteIcon />} endIcon={<ArrowForwardIcon />}
            sx={{
              fontWeight: 700, px: 4, py: 1.4, borderRadius: 3, flexShrink: 0,
              background: "linear-gradient(135deg, #b71c1c 0%, #d32f2f 100%)",
              boxShadow: "0 6px 20px rgba(183,28,28,0.4)",
              "&:hover": { boxShadow: "0 8px 28px rgba(183,28,28,0.55)" },
            }}>
            {cta.button}
          </Button>
        </Paper>
      </Container>

    </Box>
  );
};

export default About;
