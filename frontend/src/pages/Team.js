import React from "react";
import {
  Container,
  Typography,
  Grid,
  Card,
  CardContent,
  Box,
  Avatar,
  Chip,
  useTheme,
} from "@mui/material";
import AOS from "aos";
import "aos/dist/aos.css";

const teamMembers = [
  {
    name: "Vith Vath",
    role: "Full Stack Developer",
    specialty: "Lead",
    bio: "Leads the development of the platform with expertise in React and Node.js. Passionate about leveraging technology for social good.",
    image: "https://i.pravatar.cc/300?img=12",
    skills: ["React", "Node.js", "MongoDB"],
    color: "#b71c1c",
    initials: "VV",
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
  },
  {
    name: "Dara Khieu",
    role: "UI/UX Designer",
    specialty: "Design",
    bio: "Creates intuitive and accessible user experiences, ensuring every interaction on the platform feels effortless and welcoming.",
    image: "https://i.pravatar.cc/300?img=9",
    skills: ["Figma", "Material UI", "CSS"],
    color: "#1565c0",
    initials: "DK",
  },
];

React.useEffect &&
  (() => {
    AOS.init({ duration: 900, once: true });
  })();

const Team = () => {
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";

  React.useEffect(() => {
    AOS.init({ duration: 900, once: true });
  }, []);

  return (
    <Box sx={{ backgroundColor: isDark ? "#121212" : "#f9f9f9", minHeight: "100vh" }}>
      {/* Hero Banner */}
      <Box
        sx={{
          background: isDark
            ? "linear-gradient(135deg, #1a0000 0%, #2d0505 100%)"
            : "linear-gradient(135deg, #b71c1c 0%, #7f0000 100%)",
          color: "white",
          py: { xs: 8, md: 10 },
          textAlign: "center",
          px: 3,
        }}
      >
        <Typography variant="h3" fontWeight={800} gutterBottom>
          Meet Our Team
        </Typography>
        <Typography
          variant="h6"
          sx={{ opacity: 0.88, maxWidth: 560, mx: "auto", lineHeight: 1.7 }}
        >
          Passionate Data Science students from ITC Cambodia, building a
          life-saving platform one line of code at a time.
        </Typography>
      </Box>

      <Container maxWidth="lg" sx={{ py: 10 }}>
        <Grid container spacing={4} justifyContent="center">
          {teamMembers.map((member, idx) => (
            <Grid item xs={12} sm={6} md={3} key={idx}>
              <Card
                data-aos="fade-up"
                data-aos-delay={idx * 100}
                sx={{
                  borderRadius: 4,
                  overflow: "hidden",
                  boxShadow: 4,
                  transition: "0.3s ease",
                  height: "100%",
                  display: "flex",
                  flexDirection: "column",
                  "&:hover": {
                    transform: "translateY(-10px)",
                    boxShadow: 10,
                  },
                }}
              >
                {/* Color accent top bar */}
                <Box sx={{ height: 6, backgroundColor: member.color }} />

                {/* Avatar section */}
                <Box
                  sx={{
                    pt: 4,
                    pb: 2,
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    background: isDark
                      ? `linear-gradient(180deg, ${member.color}22 0%, transparent 100%)`
                      : `linear-gradient(180deg, ${member.color}12 0%, transparent 100%)`,
                  }}
                >
                  <Avatar
                    src={member.image}
                    alt={member.name}
                    sx={{
                      width: 90,
                      height: 90,
                      border: `3px solid ${member.color}`,
                      boxShadow: `0 0 0 4px ${member.color}22`,
                      mb: 1.5,
                    }}
                  />
                  <Chip
                    label={member.specialty}
                    size="small"
                    sx={{
                      backgroundColor: member.color,
                      color: "white",
                      fontWeight: 700,
                      fontSize: "0.72rem",
                    }}
                  />
                </Box>

                <CardContent sx={{ flexGrow: 1, textAlign: "center", pt: 2 }}>
                  <Typography variant="h6" fontWeight={800} gutterBottom>
                    {member.name}
                  </Typography>
                  <Typography
                    variant="body2"
                    sx={{ color: member.color, fontWeight: 600, mb: 1.5 }}
                  >
                    {member.role}
                  </Typography>
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{ lineHeight: 1.7, mb: 2.5, fontSize: "0.85rem" }}
                  >
                    {member.bio}
                  </Typography>

                  {/* Skill chips */}
                  <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.8, justifyContent: "center" }}>
                    {member.skills.map((skill) => (
                      <Chip
                        key={skill}
                        label={skill}
                        size="small"
                        variant="outlined"
                        sx={{
                          fontSize: "0.72rem",
                          borderColor: isDark ? "rgba(255,255,255,0.2)" : "rgba(0,0,0,0.15)",
                          color: "text.secondary",
                        }}
                      />
                    ))}
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>

        {/* Join the mission */}
        <Box
          data-aos="fade-up"
          sx={{
            mt: 10,
            p: { xs: 4, md: 6 },
            borderRadius: 4,
            background: isDark
              ? "linear-gradient(135deg, #1a0000 0%, #2d0505 100%)"
              : "linear-gradient(135deg, #b71c1c 0%, #c62828 100%)",
            color: "white",
            textAlign: "center",
          }}
        >
          <Typography variant="h5" fontWeight={700} gutterBottom>
            Want to Join Our Mission?
          </Typography>
          <Typography variant="body1" sx={{ opacity: 0.88, mb: 3 }}>
            We're a team of passionate students building tech for social good. If
            you share our vision of saving lives through innovation, reach out to
            us.
          </Typography>
          <Chip
            label="📧 Vath.V211006@sis.hust.edu.vn"
            sx={{ backgroundColor: "rgba(255,255,255,0.2)", color: "white", fontWeight: 600 }}
          />
        </Box>
      </Container>
    </Box>
  );
};

export default Team;
