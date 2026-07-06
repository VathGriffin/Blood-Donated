'use client';
import Link from 'next/link';
import React, { useEffect } from "react";
import {
  Container, Typography, Box, Avatar,
  Chip, useTheme, Paper, Button,
} from "@mui/material";
import CodeIcon from "@mui/icons-material/Code";
import StorageIcon from "@mui/icons-material/Storage";
import BrushIcon from "@mui/icons-material/Brush";
import GroupsIcon from "@mui/icons-material/Groups";
import EmojiObjectsIcon from "@mui/icons-material/EmojiObjects";
import SpeedIcon from "@mui/icons-material/Speed";
import FavoriteIcon from "@mui/icons-material/Favorite";
import SchoolIcon from "@mui/icons-material/School";
import AOS from "aos";
import "aos/dist/aos.css";

const HERO_IMG =
  "https://images.unsplash.com/photo-1582750433449-648ed127bb54?auto=format&fit=crop&w=1920&q=80";
const MID_IMG =
  "https://images.unsplash.com/photo-1551601651-2a8555f1a136?auto=format&fit=crop&w=1920&q=80";
const CTA_IMG =
  "https://images.unsplash.com/photo-1579154204601-01588f351e67?auto=format&fit=crop&w=1920&q=80";

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
    icon: <StorageIcon />,
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

const Team = () => {
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";

  useEffect(() => { AOS.init({ duration: 900, once: true }); }, []);

  return (
    <Box sx={{ backgroundColor: isDark ? "#121212" : "#f9f9f9" }}>

      {/* ── Hero — Photo Background ────────────────────────────────────────── */}
      <Box sx={{
        position: "relative",
        minHeight: { xs: "72vh", md: "80vh" },
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
            ? "linear-gradient(135deg, rgba(10,0,0,0.93) 0%, rgba(70,0,0,0.87) 100%)"
            : "linear-gradient(135deg, rgba(90,0,0,0.90) 0%, rgba(183,28,28,0.83) 100%)",
          zIndex: 1,
        },
      }}>
        <Box sx={{ position: "relative", zIndex: 2, px: 3, pt: { xs: 14, md: 8 }, pb: { xs: 8, md: 6 } }} data-aos="fade-up">
          <Chip
            icon={<GroupsIcon sx={{ color: "white !important", fontSize: "18px !important" }} />}
            label="ITC Cambodia · Data Science"
            sx={{ backgroundColor: "rgba(255,255,255,0.15)", color: "white", fontWeight: 700, mb: 3, backdropFilter: "blur(4px)", fontSize: "0.82rem" }}
          />
          <Typography variant="h2" fontWeight={800} color="white"
            sx={{ lineHeight: 1.12, mb: 2, fontSize: { xs: "2.4rem", md: "3.6rem" }, textShadow: "0 2px 24px rgba(0,0,0,0.6)" }}>
            Meet Our Team
          </Typography>
          <Typography variant="h5" sx={{ color: "#ffcdd2", fontWeight: 700, mb: 2.5, fontSize: { xs: "1.1rem", md: "1.4rem" } }}>
            Passionate Students. Real Impact.
          </Typography>
          <Typography variant="h6" sx={{
            color: "rgba(255,255,255,0.82)", maxWidth: 580, mx: "auto",
            lineHeight: 1.8, fontWeight: 400, fontSize: { xs: "1rem", md: "1.1rem" },
          }}>
            4th-year Data Science students from the Institute of Technology of Cambodia —
            building a life-saving platform one line of code at a time.
          </Typography>

          {/* Quick stats */}
          <Box sx={{ display: "flex", gap: { xs: 3, md: 5 }, justifyContent: "center", mt: 6, flexWrap: "wrap" }}>
            {[
              { value: "4", label: "Team Members" },
              { value: "1+", label: "Year Building" },
              { value: "50+", label: "Hospitals" },
              { value: "45K+", label: "Lives Saved" },
            ].map((s, i) => (
              <Box key={i} textAlign="center" data-aos="zoom-in" data-aos-delay={i * 80}>
                <Typography variant="h4" fontWeight={800} color="white" sx={{ textShadow: "0 2px 12px rgba(0,0,0,0.4)" }}>
                  {s.value}
                </Typography>
                <Typography variant="caption" sx={{ color: "rgba(255,255,255,0.70)", fontWeight: 600, letterSpacing: "0.06em" }}>
                  {s.label}
                </Typography>
              </Box>
            ))}
          </Box>
        </Box>
      </Box>

      {/* ── Team Cards ────────────────────────────────────────────────────── */}
      <Box sx={{ backgroundColor: isDark ? "#121212" : "#f4f4f4", py: 12 }}>
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
                {/* Gradient top bar */}
                <Box sx={{
                  height: 5,
                  background: `linear-gradient(90deg, ${member.color} 0%, ${member.color}88 100%)`,
                }} />

                {/* Avatar area */}
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
                        width: 96,
                        height: 96,
                        border: `3px solid ${member.color}`,
                        boxShadow: `0 0 0 5px ${member.color}22, 0 8px 24px rgba(0,0,0,0.15)`,
                        fontSize: "1.6rem",
                        fontWeight: 800,
                        bgcolor: member.color,
                      }}
                    >
                      {member.initials}
                    </Avatar>
                    {/* Role icon badge */}
                    <Box sx={{
                      position: "absolute",
                      bottom: 0, right: -4,
                      width: 30, height: 30,
                      borderRadius: "50%",
                      bgcolor: member.color,
                      display: "flex", alignItems: "center", justifyContent: "center",
                      boxShadow: "0 2px 8px rgba(0,0,0,0.25)",
                      "& svg": { fontSize: "15px", color: "#fff" },
                    }}>
                      {member.icon}
                    </Box>
                  </Box>

                  <Chip
                    label={member.specialty}
                    size="small"
                    sx={{ backgroundColor: member.color, color: "white", fontWeight: 700, fontSize: "0.72rem" }}
                  />
                </Box>

                {/* Content */}
                <Box sx={{ px: 3, pb: 3.5, flexGrow: 1, textAlign: "center" }}>
                  <Typography variant="h6" fontWeight={800} gutterBottom sx={{ fontSize: "1rem" }}>
                    {member.name}
                  </Typography>
                  <Typography variant="body2" fontWeight={600} sx={{ color: member.color, mb: 1.5, fontSize: "0.82rem" }}>
                    {member.role}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.75, mb: 2.5, fontSize: "0.83rem" }}>
                    {member.bio}
                  </Typography>

                  {/* Skills */}
                  <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.8, justifyContent: "center" }}>
                    {member.skills.map((skill) => (
                      <Chip
                        key={skill}
                        label={skill}
                        size="small"
                        sx={{
                          fontSize: "0.7rem",
                          fontWeight: 600,
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
            <Typography variant="h4" fontWeight={700} color="white" mt={0.5}>
              How We Work
            </Typography>
            <Typography variant="body1" sx={{ color: "rgba(255,255,255,0.72)", maxWidth: 500, mx: "auto", mt: 1 }}>
              The principles that guide our team every day.
            </Typography>
          </Box>

          <Box sx={{
            display: "grid",
            gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" },
            gap: 3,
          }}>
            {principles.map((p, idx) => (
              <Box
                key={idx}
                data-aos="fade-up"
                data-aos-delay={idx * 100}
                sx={{
                  display: "flex",
                  gap: 2.5,
                  alignItems: "flex-start",
                  backgroundColor: "rgba(255,255,255,0.07)",
                  backdropFilter: "blur(10px)",
                  border: "1px solid rgba(255,255,255,0.12)",
                  borderRadius: 4,
                  p: 3.5,
                  transition: "0.3s",
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
                  <Typography variant="h6" fontWeight={700} color="white" gutterBottom sx={{ fontSize: "1rem" }}>
                    {p.title}
                  </Typography>
                  <Typography variant="body2" sx={{ color: "rgba(255,255,255,0.72)", lineHeight: 1.75 }}>
                    {p.desc}
                  </Typography>
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
              p: { xs: 4, md: 6 },
              borderRadius: 4,
              textAlign: "center",
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
                <Chip
                  key={tag}
                  label={tag}
                  variant="outlined"
                  color="error"
                  size="small"
                  sx={{ fontWeight: 700 }}
                />
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
            Want to Join Our Mission?
          </Typography>
          <Typography variant="h6" sx={{
            color: "rgba(255,255,255,0.85)", mb: 6, lineHeight: 1.8,
            maxWidth: 520, mx: "auto", fontWeight: 400,
          }}>
            We're passionate students building tech for social good. If you share
            our vision of saving lives through innovation, reach out to us.
          </Typography>
          <Box sx={{ display: "flex", justifyContent: "center", gap: 2.5, flexWrap: "wrap" }}>
            <Button component={Link} href="/contact" variant="contained" size="large" sx={{
              backgroundColor: "white", color: "#b71c1c", fontWeight: 800, px: 5, py: 1.7, borderRadius: 3, fontSize: "1rem",
              boxShadow: "0 8px 32px rgba(0,0,0,0.4)",
              "&:hover": { backgroundColor: "#ffcdd2", transform: "translateY(-3px)" }, transition: "all 0.25s",
            }}>
              Contact Us
            </Button>
            <Button component={Link} href="/donate" variant="outlined" size="large" sx={{
              borderColor: "rgba(255,255,255,0.7)", color: "white", fontWeight: 700, px: 5, py: 1.7, borderRadius: 3, fontSize: "1rem",
              backdropFilter: "blur(4px)",
              "&:hover": { backgroundColor: "rgba(255,255,255,0.15)", borderColor: "white", transform: "translateY(-3px)" }, transition: "all 0.25s",
            }}>
              Become a Donor
            </Button>
          </Box>
        </Container>
      </Box>

    </Box>
  );
};

export default Team;
