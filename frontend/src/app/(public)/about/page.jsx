'use client';
import Link from 'next/link';
import { useEffect, useState } from "react";
import {
  Container, Typography, Box, Chip, Avatar, Button, Paper, useTheme,
} from "@mui/material";
import axios from "axios";
import API_BASE from "@/lib/config";
import { script } from '@/lib/fonts';
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
import CodeIcon from "@mui/icons-material/Code";
import StorageIcon from "@mui/icons-material/Storage";
import ApiIcon from "@mui/icons-material/Api";
import BrushIcon from "@mui/icons-material/Brush";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";

const HERO_IMG =
  "https://images.unsplash.com/photo-1615461066841-6116e61058f4?auto=format&fit=crop&w=1200&q=80";
const PURPOSE_IMG =
  "https://images.unsplash.com/photo-1565687363630-7a81809a199c?auto=format&fit=crop&w=1200&q=80";

const heroFeatures = [
  { icon: <ShieldIcon />, title: "Trusted Platform", subtitle: "Safe, secure, and transparent" },
  { icon: <GroupsIcon />, title: "Connecting Communities", subtitle: "Donors, hospitals, and patients" },
  { icon: <FavoriteIcon />, title: "Saving Lives", subtitle: "A stronger, healthier Cambodia" },
];

const purposeCards = [
  {
    icon: <TrackChangesIcon />,
    title: "Our Mission",
    desc: "To make blood donation easier, safer, and more accessible for everyone in Cambodia using technology and community support.",
  },
  {
    icon: <VisibilityIcon />,
    title: "Our Vision",
    desc: "A Cambodia where no patient suffers due to a lack of blood, and where voluntary blood donation becomes a regular part of life.",
  },
  {
    icon: <TrendingUpIcon />,
    title: "Our Impact",
    desc: "Connecting people, supporting hospitals, and helping save lives across Cambodia through innovation and collaboration.",
  },
];

const teamMembers = [
  {
    name: "Vith Vath",
    role: "Full Stack Developer",
    specialty: "Lead",
    bio: "Leads platform development with expertise in React and Node.js. Passionate about leveraging technology for social good.",
    image: "https://i.pravatar.cc/300?img=12",
    skills: ["React", "Node.js", "MongoDB"],
    color: "#b71c1c",
    initials: "VV",
    icon: <CodeIcon />,
  },
  {
    name: "Sopheak Sok",
    role: "System Architect",
    specialty: "Backend",
    bio: "Designs scalable system architecture and ensures data integrity across the blood inventory management system.",
    image: "https://i.pravatar.cc/300?img=3",
    skills: ["Express", "Docker", "AWS"],
    color: "#ad1457",
    initials: "SS",
    icon: <StorageIcon />,
  },
  {
    name: "Chanthou Hem",
    role: "Backend Developer",
    specialty: "API",
    bio: "Builds robust RESTful APIs and integrates third-party services to connect donors, hospitals, and staff seamlessly.",
    image: "https://i.pravatar.cc/300?img=5",
    skills: ["Node.js", "REST API", "MongoDB"],
    color: "#6a1b9a",
    initials: "CH",
    icon: <ApiIcon />,
  },
  {
    name: "Dara Khieu",
    role: "UI/UX Designer",
    specialty: "Design",
    bio: "Creates intuitive and accessible user experiences, ensuring every interaction feels effortless and welcoming.",
    image: "https://i.pravatar.cc/300?img=9",
    skills: ["Figma", "Material UI", "CSS"],
    color: "#1565c0",
    initials: "DK",
    icon: <BrushIcon />,
  },
];

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

  useEffect(() => {
    axios.get(`${API_BASE}/api/stats/public`)
      .then((res) => setStats(res.data))
      .catch((err) => console.error("Failed to fetch platform stats:", err));
  }, []);

  const statCards = [
    { icon: <PeopleIcon />, value: stats ? stats.donors : "…", label: "Registered Donors", caption: "People in our community" },
    { icon: <BloodtypeIcon />, value: stats ? stats.donations : "…", label: "Total Donations", caption: "Contributions to save lives" },
    { icon: <LocalHospitalIcon />, value: stats ? `${stats.hospitals}` : "…", label: "Partner Hospitals", caption: "Working across Cambodia" },
    { icon: <TaskAltIcon />, value: stats ? stats.fulfilledRequests : "…", label: "Blood Requests Fulfilled", caption: "Patients received help" },
  ];

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
                  People · Community · A Healthier Cambodia
                </Typography>
                <Box sx={{ width: 36, height: 3, borderRadius: 2, backgroundColor: "error.main", flexShrink: 0 }} />
              </Box>
              <Typography sx={{
                fontWeight: 800, lineHeight: 1.1, mb: 1.5,
                fontSize: { xs: "2.2rem", md: "2.9rem" },
                color: isDark ? "#fff" : "#161a23",
              }}>
                About
                <Box component="span" sx={{ display: "block", color: "error.main" }}>Blood Donated</Box>
              </Typography>
              <Typography sx={{
                fontWeight: 700, mb: 2, fontSize: { xs: "1.05rem", md: "1.2rem" },
                color: isDark ? "#fff" : "#161a23",
              }}>
                Revolutionizing Blood Donation Across Cambodia
              </Typography>
              <Typography color="text.secondary" sx={{ fontSize: "1.02rem", lineHeight: 1.75, mb: 3.5 }}>
                We are a community-driven platform connecting donors, hospitals, and
                patients — built by 4th-year Data Science students at the Institute of
                Technology of Cambodia, to make blood donation more accessible,
                transparent, and impactful.
              </Typography>

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
                {heroFeatures.map((f) => (
                  <Box key={f.title} sx={{ display: "flex", alignItems: "flex-start", gap: 1.5 }}>
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
              <Box sx={{ position: "relative" }}>
                <Box component="img" src={HERO_IMG} alt="A nurse caring for a blood donor"
                  sx={{
                    width: "100%", height: { xs: 320, md: 400 }, objectFit: "cover", display: "block",
                    borderRadius: 5, boxShadow: "0 20px 50px rgba(0,0,0,0.25)",
                  }}
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
        <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr 1fr", md: "repeat(4, 1fr)" }, gap: 2.5 }}>
          {statCards.map((s) => (
            <Paper key={s.label} elevation={0} sx={{ ...cardSx(isDark), p: 2.5, display: "flex", alignItems: "center", gap: 1.75 }}>
              <Box sx={{
                width: 48, height: 48, borderRadius: "50%", flexShrink: 0,
                backgroundColor: isDark ? "rgba(183,28,28,0.16)" : "#fdeaea",
                color: "error.main", display: "flex", alignItems: "center", justifyContent: "center",
                "& svg": { fontSize: 22 },
              }}>
                {s.icon}
              </Box>
              <Box sx={{ minWidth: 0 }}>
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
            <Box component="img" src={PURPOSE_IMG} alt="Angkor Wat, Cambodia"
              sx={{ width: "100%", height: { xs: 280, md: 340 }, objectFit: "cover", borderRadius: 4, display: "block", boxShadow: "0 16px 40px rgba(0,0,0,0.18)" }}
            />
            <Paper elevation={0} sx={{
              ...cardSx(isDark), position: "absolute", top: 20, right: -16,
              maxWidth: 200, p: 2.5, display: { xs: "none", sm: "block" },
            }}>
              <FormatQuoteIcon sx={{ fontSize: 26, color: "error.main", transform: "scaleX(-1)", display: "block", mb: 0.5 }} />
              <Typography fontWeight={800} sx={{ fontSize: "0.95rem", lineHeight: 1.35 }}>
                A stronger Cambodia is built by people who care.
              </Typography>
              <Box sx={{ width: 32, height: 3, borderRadius: 2, backgroundColor: "error.main", mt: 1.5 }} />
            </Paper>
          </Box>

          {/* Copy + mini cards */}
          <Box>
            <Typography variant="overline" color="error" fontWeight={700} letterSpacing="0.12em">
              Our Purpose
            </Typography>
            <Typography sx={{
              fontWeight: 800, mt: 0.5, mb: 2, lineHeight: 1.25,
              fontSize: { xs: "1.6rem", md: "1.9rem" },
              color: isDark ? "#fff" : "#161a23",
            }}>
              A Healthier Cambodia Through Blood Donation
            </Typography>
            <Typography color="text.secondary" sx={{ fontSize: "1rem", lineHeight: 1.75, mb: 3.5 }}>
              We believe that everyone has the power to save lives. Our platform
              bridges the gap between donors, hospitals, and patients to create a
              stronger, healthier Cambodia.
            </Typography>

            <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "repeat(3, 1fr)" }, gap: 2 }}>
              {purposeCards.map((c) => (
                <Paper key={c.title} elevation={0} sx={{ ...cardSx(isDark), p: 2.5 }}>
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

      {/* ── Team ──────────────────────────────────────────────────────────── */}
      <Box id="team-section" sx={{ backgroundColor: isDark ? "#0f0f0f" : "#fff", py: { xs: 8, md: 10 } }}>
        <Container maxWidth="lg">
          <Box textAlign="center" mb={6}>
            <Box sx={{ display: "inline-flex", alignItems: "center", gap: 1.5, mb: 1 }}>
              <Typography variant="overline" color="error" fontWeight={700} letterSpacing="0.12em">
                The People
              </Typography>
              <Box sx={{ width: 32, height: 3, borderRadius: 2, backgroundColor: "error.main" }} />
            </Box>
            <Typography sx={{
              fontWeight: 800, fontSize: { xs: "1.7rem", md: "2.1rem" },
              color: isDark ? "#fff" : "#161a23", mb: 1,
            }}>
              The Builders Behind It
            </Typography>
            <Typography color="text.secondary" sx={{ maxWidth: 560, mx: "auto", lineHeight: 1.7 }}>
              A passionate team of final-year Data Science students at the Institute of
              Technology of Cambodia, working together to create real impact in healthcare.
            </Typography>
          </Box>

          <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr", lg: "repeat(4, 1fr)" }, gap: 3 }}>
            {teamMembers.map((member) => (
              <Paper key={member.name} elevation={0} sx={{
                ...cardSx(isDark), overflow: "hidden", display: "flex", flexDirection: "column",
                transition: "all 0.25s ease",
                "&:hover": { transform: "translateY(-6px)", boxShadow: `0 16px 36px ${member.color}30` },
              }}>
                <Box sx={{ height: 5, background: `linear-gradient(90deg, ${member.color} 0%, ${member.color}88 100%)` }} />
                <Box sx={{ pt: 4, pb: 2.5, display: "flex", flexDirection: "column", alignItems: "center" }}>
                  <Box sx={{ position: "relative", mb: 1.5 }}>
                    <Avatar src={member.image} alt={member.name} sx={{
                      width: 84, height: 84, border: `3px solid ${member.color}`,
                      boxShadow: `0 0 0 4px ${member.color}22, 0 8px 20px rgba(0,0,0,0.15)`,
                      fontSize: "1.4rem", fontWeight: 800, bgcolor: member.color,
                    }}>
                      {member.initials}
                    </Avatar>
                    <Box sx={{
                      position: "absolute", bottom: -2, right: -4, width: 28, height: 28, borderRadius: "50%",
                      bgcolor: member.color, display: "flex", alignItems: "center", justifyContent: "center",
                      boxShadow: "0 2px 8px rgba(0,0,0,0.25)", "& svg": { fontSize: 14, color: "#fff" },
                    }}>
                      {member.icon}
                    </Box>
                  </Box>
                  <Chip label={member.specialty} size="small" sx={{ backgroundColor: member.color, color: "white", fontWeight: 700, fontSize: "0.7rem" }} />
                </Box>
                <Box sx={{ px: 3, pb: 3, textAlign: "center", flexGrow: 1 }}>
                  <Typography fontWeight={800} sx={{ fontSize: "1rem" }}>{member.name}</Typography>
                  <Typography fontWeight={600} sx={{ color: member.color, fontSize: "0.82rem", mb: 1.25 }}>{member.role}</Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.7, fontSize: "0.83rem", mb: 2 }}>{member.bio}</Typography>
                  <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.75, justifyContent: "center" }}>
                    {member.skills.map((skill) => (
                      <Chip key={skill} label={skill} size="small" sx={{
                        fontSize: "0.68rem", fontWeight: 600,
                        bgcolor: isDark ? `${member.color}22` : `${member.color}12`,
                        color: member.color, border: `1px solid ${member.color}40`,
                      }} />
                    ))}
                  </Box>
                </Box>
              </Paper>
            ))}
          </Box>
        </Container>
      </Box>

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
                Be Part of a Stronger, Healthier Cambodia
              </Typography>
              <Typography color="text.secondary" sx={{ mt: 0.5 }}>
                Whether you&apos;re a donor, hospital, or supporter — together we can save more lives.
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
            Join Us Today
          </Button>
        </Paper>
      </Container>

    </Box>
  );
};

export default About;
