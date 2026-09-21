'use client';
import Link from 'next/link';
import React, { useEffect } from "react";
import {
  Container, Typography, Box, Grid, Chip, Avatar,
  Button, Paper, useTheme,
} from "@mui/material";
import BloodtypeIcon from "@mui/icons-material/Bloodtype";
import VolunteerActivismIcon from "@mui/icons-material/VolunteerActivism";
import LocalHospitalIcon from "@mui/icons-material/LocalHospital";
import LocalShippingIcon from "@mui/icons-material/LocalShipping";
import SecurityIcon from "@mui/icons-material/Security";
import GroupsIcon from "@mui/icons-material/Groups";
import NotificationsActiveIcon from "@mui/icons-material/NotificationsActive";
import FavoriteIcon from "@mui/icons-material/Favorite";
import PersonAddAlt1Icon from "@mui/icons-material/PersonAddAlt1";
import FactCheckIcon from "@mui/icons-material/FactCheck";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import CodeIcon from "@mui/icons-material/Code";
import StorageIcon from "@mui/icons-material/Storage";
import ApiIcon from "@mui/icons-material/Api";
import BrushIcon from "@mui/icons-material/Brush";
import EmojiObjectsIcon from "@mui/icons-material/EmojiObjects";
import SpeedIcon from "@mui/icons-material/Speed";
import SchoolIcon from "@mui/icons-material/School";
import HospitalInsights from "./HospitalInsights";
import AOS from "aos";
import "aos/dist/aos.css";

const HERO_IMG =
  "https://images.unsplash.com/photo-1516549655169-df83a0774514?auto=format&fit=crop&w=1920&q=80";
const MISSION_IMG =
  "https://images.unsplash.com/photo-1576091160550-2173dba999ef?auto=format&fit=crop&w=1920&q=80";
const MID_IMG =
  "https://images.unsplash.com/photo-1551601651-2a8555f1a136?auto=format&fit=crop&w=1920&q=80";
const CTA_IMG =
  "https://images.unsplash.com/photo-1579154204601-01588f351e67?auto=format&fit=crop&w=1920&q=80";

const stats = [
  { icon: <BloodtypeIcon sx={{ fontSize: 30 }} />, label: "15,000+", desc: "Units of Blood Tracked" },
  { icon: <VolunteerActivismIcon sx={{ fontSize: 30 }} />, label: "5,000+", desc: "Registered Donors" },
  { icon: <LocalHospitalIcon sx={{ fontSize: 30 }} />, label: "50+", desc: "Partner Hospitals" },
  { icon: <LocalShippingIcon sx={{ fontSize: 30 }} />, label: "20+", desc: "Annual Blood Drives" },
];

const howItWorks = [
  {
    icon: <PersonAddAlt1Icon sx={{ fontSize: 26, color: "#fff" }} />,
    title: "1. Register",
    desc: "Donors sign up in minutes, sharing blood type, location, and availability.",
  },
  {
    icon: <NotificationsActiveIcon sx={{ fontSize: 26, color: "#fff" }} />,
    title: "2. Get Matched",
    desc: "When a hospital reports a shortage, matching donors nearby get an instant alert.",
  },
  {
    icon: <FactCheckIcon sx={{ fontSize: 26, color: "#fff" }} />,
    title: "3. Donate & Track",
    desc: "Book an appointment, donate, and see the inventory update in real time.",
  },
  {
    icon: <FavoriteIcon sx={{ fontSize: 26, color: "#fff" }} />,
    title: "4. Save a Life",
    desc: "Your donation reaches a patient in need, tracked from vein to vein.",
  },
];

const reasons = [
  { icon: <GroupsIcon sx={{ color: "#b71c1c", fontSize: 22 }} />, text: "Bridges hospitals, donors, and the community" },
  { icon: <BloodtypeIcon sx={{ color: "#b71c1c", fontSize: 22 }} />, text: "Enables data-driven blood inventory management" },
  { icon: <NotificationsActiveIcon sx={{ color: "#b71c1c", fontSize: 22 }} />, text: "Real-time stock updates and instant notifications" },
  { icon: <SecurityIcon sx={{ color: "#b71c1c", fontSize: 22 }} />, text: "Prioritizes user privacy and data security" },
  { icon: <VolunteerActivismIcon sx={{ color: "#b71c1c", fontSize: 22 }} />, text: "Cultivates voluntary blood donation nationwide" },
];

const values = [
  { icon: "❤️", title: "Save Lives", desc: "Every feature we build is measured by one metric — lives saved." },
  { icon: "🔒", title: "Privacy First", desc: "Donor data is encrypted and never shared without consent." },
  { icon: "🌏", title: "Nationwide Access", desc: "Designed to scale from Phnom Penh to every province in Cambodia." },
  { icon: "🤝", title: "Community", desc: "A platform built on trust between donors, patients, and hospitals." },
  { icon: "⚡", title: "Real-time", desc: "Live inventory and instant shortage alerts keep hospitals ready." },
  { icon: "🎓", title: "Open Science", desc: "Built by Data Science students at ITC using industry best practices." },
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

const techStack = [
  { group: "Frontend", tools: ["Next.js", "React", "Material UI"] },
  { group: "Backend", tools: ["Node.js", "Express", "REST API"] },
  { group: "Database", tools: ["MongoDB", "Mongoose"] },
  { group: "Tooling", tools: ["Vercel", "Git", "npm"] },
];

const principles = [
  {
    icon: <EmojiObjectsIcon sx={{ fontSize: 36, color: "#fff" }} />,
    title: "Purpose-Driven",
    desc: "Every line of code we write is motivated by one goal — making blood donation faster, safer, and more accessible across Cambodia.",
  },
  {
    icon: <GroupsIcon sx={{ fontSize: 36, color: "#fff" }} />,
    title: "Built as a Team",
    desc: "We pair complementary skills across frontend, backend, and design to ship a cohesive product that works for everyone.",
  },
  {
    icon: <SpeedIcon sx={{ fontSize: 36, color: "#fff" }} />,
    title: "Move Fast",
    desc: "Agile sprints, CI/CD pipelines, and real-time feedback loops keep the platform improving week over week.",
  },
  {
    icon: <SchoolIcon sx={{ fontSize: 36, color: "#fff" }} />,
    title: "Student-Led",
    desc: "4th-year Data Science students at ITC Cambodia — applying classroom knowledge to solve a national health challenge.",
  },
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
            About BloodLife
          </Typography>
          <Typography variant="h5" sx={{ color: "#ffcdd2", fontWeight: 700, mb: 2, fontSize: { xs: "1.2rem", md: "1.5rem" } }}>
            Revolutionizing Blood Donation Across Cambodia
          </Typography>
          <Typography variant="h6" sx={{
            color: "rgba(255,255,255,0.82)", maxWidth: 620, mx: "auto", lineHeight: 1.8,
            fontWeight: 400, fontSize: { xs: "0.95rem", md: "1.1rem" },
          }}>
            A platform connecting donors, hospitals, and patients — built by 4th-year Data
            Science students at the Institute of Technology of Cambodia.
          </Typography>

          <Box sx={{ display: "flex", gap: 2, justifyContent: "center", flexWrap: "wrap", mt: 5 }}>
            <Button component={Link} href="/donate" variant="contained" size="large" sx={{
              backgroundColor: "white", color: "#b71c1c", fontWeight: 800, px: 4.5, py: 1.5, borderRadius: 3,
              boxShadow: "0 8px 32px rgba(0,0,0,0.35)",
              "&:hover": { backgroundColor: "#ffcdd2", transform: "translateY(-2px)" }, transition: "all 0.25s",
            }}>
              Become a Donor
            </Button>
            <Button component={Link} href="#team-section" variant="outlined" size="large" sx={{
              borderColor: "rgba(255,255,255,0.7)", color: "white", fontWeight: 700, px: 4.5, py: 1.5, borderRadius: 3,
              backdropFilter: "blur(4px)",
              "&:hover": { backgroundColor: "rgba(255,255,255,0.15)", borderColor: "white", transform: "translateY(-2px)" }, transition: "all 0.25s",
            }}>
              Meet the Team
            </Button>
          </Box>
        </Box>

        <Box sx={{
          position: "absolute", bottom: 24, left: "50%", transform: "translateX(-50%)",
          zIndex: 2, display: { xs: "none", sm: "flex" }, flexDirection: "column",
          alignItems: "center", color: "rgba(255,255,255,0.7)",
          animation: "aboutBounce 2s ease-in-out infinite",
          "@keyframes aboutBounce": {
            "0%, 100%": { transform: "translateX(-50%) translateY(0)" },
            "50%": { transform: "translateX(-50%) translateY(8px)" },
          },
        }}>
          <KeyboardArrowDownIcon fontSize="large" />
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
              <Grid size={{ xs: 6, sm: 3 }} key={idx} data-aos="zoom-in" data-aos-delay={idx * 80}>
                <Box textAlign="center">
                  <Box sx={{
                    width: 64, height: 64, borderRadius: "50%", mx: "auto", mb: 1.5,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    backgroundColor: isDark ? "rgba(211,47,47,0.15)" : "#fdecea",
                    color: "#b71c1c",
                  }}>
                    {item.icon}
                  </Box>
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
                <strong style={{ color: "#ffcdd2" }}>BloodLife</strong> is a full-stack web application built to solve a
                real problem — Cambodia&apos;s blood supply gap. We connect donors, hospitals,
                and patients in a single platform that&apos;s fast, transparent, and life-saving.
              </Typography>
              <Typography variant="body1" sx={{ color: "rgba(255,255,255,0.75)", lineHeight: 1.9, fontSize: "1.05rem" }}>
                With real-time inventory tracking, donor management, and automated shortage
                alerts, no life should be lost due to a lack of blood.
              </Typography>

              <Box sx={{ display: "flex", gap: 3, mt: 4, flexWrap: "wrap" }}>
                {stats.map((item, i) => (
                  <Box key={i} textAlign="center">
                    <Typography variant="h4" fontWeight={800} color="#ffcdd2">{item.label}</Typography>
                    <Typography variant="caption" sx={{ color: "rgba(255,255,255,0.65)", fontWeight: 600 }}>{item.desc}</Typography>
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

      {/* ── How It Works ──────────────────────────────────────────────────── */}
      <Box sx={{ backgroundColor: isDark ? "#1a1a1a" : "#fff", py: 12 }}>
        <Container maxWidth="lg">
          <Box textAlign="center" mb={7} data-aos="fade-up">
            <Typography variant="overline" color="error" fontWeight={700} letterSpacing="0.15em">The Process</Typography>
            <Typography variant="h4" fontWeight={700} color={isDark ? "white" : "text.primary"} mt={0.5}>
              How BloodLife Works
            </Typography>
            <Typography variant="body1" color="text.secondary" mt={1} maxWidth={560} mx="auto">
              From sign-up to saving a life — four simple steps.
            </Typography>
          </Box>
          <Box sx={{
            position: "relative",
            display: "grid",
            gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr", md: "repeat(4, 1fr)" },
            gap: 4,
          }}>
            {/* Connector line for md+ */}
            <Box sx={{
              display: { xs: "none", md: "block" },
              position: "absolute", top: 28, left: "12.5%", right: "12.5%", height: 2,
              backgroundColor: isDark ? "#3a1515" : "#ffcdd2", zIndex: 0,
            }} />
            {howItWorks.map((step, idx) => (
              <Box key={idx} data-aos="fade-up" data-aos-delay={idx * 100} sx={{ position: "relative", textAlign: "center", zIndex: 1 }}>
                <Box sx={{
                  width: 56, height: 56, borderRadius: "50%", mx: "auto", mb: 2.5,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  background: "linear-gradient(135deg, #b71c1c 0%, #d32f2f 100%)",
                  boxShadow: `0 0 0 6px ${isDark ? "#1a1a1a" : "#fff"}, 0 6px 18px rgba(183,28,28,0.35)`,
                }}>
                  {step.icon}
                </Box>
                <Typography variant="subtitle1" fontWeight={700} gutterBottom>{step.title}</Typography>
                <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.7, px: { xs: 1, md: 0 } }}>
                  {step.desc}
                </Typography>
              </Box>
            ))}
          </Box>
        </Container>
      </Box>

      {/* ── Hospital Insights (live, anonymous figures) ───────────────────── */}
      <HospitalInsights />

      {/* ── Team Cards ────────────────────────────────────────────────────── */}
      <Box id="team-section" sx={{ backgroundColor: isDark ? "#121212" : "#f4f4f4", py: 12 }}>
        <Container maxWidth="lg">
          <Box textAlign="center" mb={8} data-aos="fade-up">
            <Typography variant="overline" color="error" fontWeight={700} letterSpacing="0.15em">The People</Typography>
            <Typography variant="h4" fontWeight={700} color={isDark ? "white" : "text.primary"} mt={0.5}>
              The Builders Behind It
            </Typography>
          </Box>

          <Box sx={{
            display: "grid",
            gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr", lg: "repeat(4, 1fr)" },
            gap: 3,
          }}>
            {teamMembers.map((member, idx) => (
              <Box
                key={idx}
                data-aos="fade-up"
                data-aos-delay={idx * 100}
                sx={{
                  borderRadius: 4,
                  overflow: "hidden",
                  backgroundColor: isDark ? "#1a1a1a" : "#fff",
                  border: `1px solid ${isDark ? "#2a2a2a" : "#efefef"}`,
                  boxShadow: isDark ? "none" : "0 4px 24px rgba(0,0,0,0.07)",
                  transition: "all 0.3s ease",
                  display: "flex",
                  flexDirection: "column",
                  "&:hover": {
                    transform: "translateY(-10px)",
                    boxShadow: `0 20px 48px ${member.color}33`,
                    border: `1px solid ${member.color}55`,
                  },
                }}
              >
                <Box sx={{ height: 5, background: `linear-gradient(90deg, ${member.color} 0%, ${member.color}88 100%)` }} />

                <Box sx={{
                  pt: 5, pb: 3,
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  background: isDark
                    ? `linear-gradient(180deg, ${member.color}20 0%, transparent 100%)`
                    : `linear-gradient(180deg, ${member.color}10 0%, transparent 100%)`,
                }}>
                  <Box sx={{ position: "relative", mb: 2 }}>
                    <Avatar
                      src={member.image}
                      alt={member.name}
                      sx={{
                        width: 96, height: 96,
                        border: `3px solid ${member.color}`,
                        boxShadow: `0 0 0 5px ${member.color}22, 0 8px 24px rgba(0,0,0,0.15)`,
                        fontSize: "1.6rem", fontWeight: 800, bgcolor: member.color,
                      }}
                    >
                      {member.initials}
                    </Avatar>
                    <Box sx={{
                      position: "absolute", bottom: 0, right: -4,
                      width: 30, height: 30, borderRadius: "50%",
                      bgcolor: member.color,
                      display: "flex", alignItems: "center", justifyContent: "center",
                      boxShadow: "0 2px 8px rgba(0,0,0,0.25)",
                      "& svg": { fontSize: "15px", color: "#fff" },
                    }}>
                      {member.icon}
                    </Box>
                  </Box>

                  <Chip label={member.specialty} size="small" sx={{ backgroundColor: member.color, color: "white", fontWeight: 700, fontSize: "0.72rem" }} />
                </Box>

                <Box sx={{ px: 3, pb: 3.5, flexGrow: 1, textAlign: "center" }}>
                  <Typography variant="h6" fontWeight={800} gutterBottom sx={{ fontSize: "1rem" }}>{member.name}</Typography>
                  <Typography variant="body2" fontWeight={600} sx={{ color: member.color, mb: 1.5, fontSize: "0.82rem" }}>{member.role}</Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.75, mb: 2.5, fontSize: "0.83rem" }}>{member.bio}</Typography>

                  <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.8, justifyContent: "center" }}>
                    {member.skills.map((skill) => (
                      <Chip
                        key={skill}
                        label={skill}
                        size="small"
                        sx={{
                          fontSize: "0.7rem", fontWeight: 600,
                          bgcolor: isDark ? `${member.color}22` : `${member.color}12`,
                          color: member.color,
                          border: `1px solid ${member.color}40`,
                        }}
                      />
                    ))}
                  </Box>
                </Box>
              </Box>
            ))}
          </Box>
        </Container>
      </Box>

      {/* ── Tech Stack ────────────────────────────────────────────────────── */}
      <Box sx={{ backgroundColor: isDark ? "#1a1a1a" : "#fff", py: 10 }}>
        <Container maxWidth="lg">
          <Box textAlign="center" mb={6} data-aos="fade-up">
            <Typography variant="overline" color="error" fontWeight={700} letterSpacing="0.15em">What We Build With</Typography>
            <Typography variant="h4" fontWeight={700} color={isDark ? "white" : "text.primary"} mt={0.5}>
              Our Tech Stack
            </Typography>
          </Box>
          <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr 1fr", md: "repeat(4, 1fr)" }, gap: 3 }}>
            {techStack.map((group, idx) => (
              <Box key={group.group} data-aos="fade-up" data-aos-delay={idx * 80} sx={{ textAlign: "center" }}>
                <Typography variant="subtitle2" fontWeight={700} color="text.secondary" sx={{ mb: 1.5, letterSpacing: "0.06em" }}>
                  {group.group.toUpperCase()}
                </Typography>
                <Box sx={{ display: "flex", flexDirection: "column", gap: 1, alignItems: "center" }}>
                  {group.tools.map((tool) => (
                    <Chip
                      key={tool}
                      label={tool}
                      size="small"
                      sx={{
                        fontWeight: 600,
                        bgcolor: isDark ? "rgba(211,47,47,0.15)" : "#fdecea",
                        color: "#b71c1c",
                        border: `1px solid ${isDark ? "rgba(211,47,47,0.3)" : "#ffcdd2"}`,
                      }}
                    />
                  ))}
                </Box>
              </Box>
            ))}
          </Box>
        </Container>
      </Box>

      {/* ── How We Work — Photo Background ────────────────────────────────── */}
      <Box sx={{
        position: "relative",
        py: 13,
        backgroundImage: `url('${MID_IMG}')`,
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
          <Box textAlign="center" mb={8} data-aos="fade-up">
            <Typography variant="overline" sx={{ color: "#ffcdd2", fontWeight: 700, letterSpacing: "0.15em" }}>
              Our Approach
            </Typography>
            <Typography variant="h4" fontWeight={700} color="white" mt={0.5}>How We Work</Typography>
            <Typography variant="body1" sx={{ color: "rgba(255,255,255,0.72)", maxWidth: 500, mx: "auto", mt: 1 }}>
              The principles that guide our team every day.
            </Typography>
          </Box>

          <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" }, gap: 3 }}>
            {principles.map((p, idx) => (
              <Box
                key={idx}
                data-aos="fade-up"
                data-aos-delay={idx * 100}
                sx={{
                  display: "flex", gap: 2.5, alignItems: "flex-start",
                  backgroundColor: "rgba(255,255,255,0.07)",
                  backdropFilter: "blur(10px)",
                  border: "1px solid rgba(255,255,255,0.12)",
                  borderRadius: 4, p: 3.5, transition: "0.3s",
                  "&:hover": { backgroundColor: "rgba(183,28,28,0.28)", transform: "translateY(-4px)" },
                }}
              >
                <Box sx={{
                  width: 60, height: 60, borderRadius: 3, flexShrink: 0,
                  background: "linear-gradient(135deg, #b71c1c 0%, #d32f2f 100%)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  boxShadow: "0 6px 20px rgba(183,28,28,0.4)",
                }}>
                  {p.icon}
                </Box>
                <Box>
                  <Typography variant="h6" fontWeight={700} color="white" gutterBottom sx={{ fontSize: "1rem" }}>{p.title}</Typography>
                  <Typography variant="body2" sx={{ color: "rgba(255,255,255,0.72)", lineHeight: 1.75 }}>{p.desc}</Typography>
                </Box>
              </Box>
            ))}
          </Box>
        </Container>
      </Box>

      {/* ── Advisor / Institution Strip ────────────────────────────────────── */}
      <Box sx={{ backgroundColor: isDark ? "#1a1a1a" : "#fff", py: 10 }}>
        <Container maxWidth="md">
          <Paper
            elevation={0}
            data-aos="fade-up"
            sx={{
              p: { xs: 4, md: 6 }, borderRadius: 4, textAlign: "center",
              background: isDark
                ? "linear-gradient(135deg, #1f1f1f 0%, #2a1a1a 100%)"
                : "linear-gradient(135deg, #fff5f5 0%, #fdecea 100%)",
              border: `1px solid ${isDark ? "#3a2020" : "#ffcdd2"}`,
            }}
          >
            <SchoolIcon sx={{ fontSize: 52, color: "#b71c1c", mb: 2 }} />
            <Typography variant="h5" fontWeight={800} color="error.main" gutterBottom>
              Institute of Technology of Cambodia
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ lineHeight: 1.85, maxWidth: 540, mx: "auto", mb: 3 }}>
              This project is a final-year capstone for the Department of Data Science.
              Supervised by faculty, built by students — combining academic rigor with
              real-world healthcare impact.
            </Typography>
            <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1.5, justifyContent: "center" }}>
              {["Data Science", "Final Year Project", "ITC Cambodia", "2024–2025"].map((tag) => (
                <Chip key={tag} label={tag} variant="outlined" color="error" size="small" sx={{ fontWeight: 700 }} />
              ))}
            </Box>
          </Paper>
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
