import React from "react";
import {
  Container,
  Typography,
  Box,
  Grid,
  Divider,
  Chip,
  Button,
  Paper,
  useTheme,
} from "@mui/material";
import BloodtypeIcon from "@mui/icons-material/Bloodtype";
import VolunteerActivismIcon from "@mui/icons-material/VolunteerActivism";
import LocalHospitalIcon from "@mui/icons-material/LocalHospital";
import LocalShippingIcon from "@mui/icons-material/LocalShipping";
import RocketLaunchIcon from "@mui/icons-material/RocketLaunch";
import SecurityIcon from "@mui/icons-material/Security";
import GroupsIcon from "@mui/icons-material/Groups";
import NotificationsActiveIcon from "@mui/icons-material/NotificationsActive";
import AOS from "aos";
import "aos/dist/aos.css";

const stats = [
  { icon: <BloodtypeIcon color="error" sx={{ fontSize: 36 }} />, label: "15,000+", desc: "Units of Blood Collected" },
  { icon: <VolunteerActivismIcon color="error" sx={{ fontSize: 36 }} />, label: "5,000+", desc: "Active Donors" },
  { icon: <LocalHospitalIcon color="error" sx={{ fontSize: 36 }} />, label: "50+", desc: "Partner Hospitals" },
  { icon: <LocalShippingIcon color="error" sx={{ fontSize: 36 }} />, label: "20+", desc: "Annual Blood Drives" },
];

const reasons = [
  { icon: <GroupsIcon sx={{ color: "#b71c1c", fontSize: 24 }} />, text: "Bridges hospitals, donors, and the community" },
  { icon: <BloodtypeIcon sx={{ color: "#b71c1c", fontSize: 24 }} />, text: "Enables data-driven blood inventory management" },
  { icon: <NotificationsActiveIcon sx={{ color: "#b71c1c", fontSize: 24 }} />, text: "Real-time stock updates and instant notifications" },
  { icon: <SecurityIcon sx={{ color: "#b71c1c", fontSize: 24 }} />, text: "Prioritizes user privacy and data security" },
  { icon: <VolunteerActivismIcon sx={{ color: "#b71c1c", fontSize: 24 }} />, text: "Cultivates voluntary blood donation nationwide" },
];

const timeline = [
  { year: "2024 Q1", event: "Project kick-off", desc: "Identified Cambodia's blood supply gap. Team assembled at ITC." },
  { year: "2024 Q2", event: "MVP Launched", desc: "Donor registration and inventory tracking live. First 200 donors registered." },
  { year: "2024 Q3", event: "Hospital Integrations", desc: "Partnered with 10 hospitals for real-time blood request processing." },
  { year: "2024 Q4", event: "Automated Alerts", desc: "Push notifications for critical shortages, reaching 1,000+ donors." },
  { year: "2025", event: "Scale Nationwide", desc: "Expanding to all provinces with mobile app support planned." },
];

const techs = ["React.js", "Node.js", "MongoDB", "Express", "GitHub Actions", "Docker"];

const About = () => {
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";

  React.useEffect(() => {
    AOS.init({ duration: 900, once: true });
  }, []);

  return (
    <Box sx={{ backgroundColor: isDark ? "#121212" : "#f9f9f9", minHeight: "100vh" }}>
      {/* Hero */}
      <Box
        sx={{
          background: isDark
            ? "linear-gradient(135deg, #1a0000 0%, #2d0505 100%)"
            : "linear-gradient(135deg, #b71c1c 0%, #7f0000 100%)",
          color: "white",
          pt: { xs: 8, md: 10 },
          pb: { xs: 7, md: 9 },
          textAlign: "center",
          px: 3,
        }}
      >
        <Typography variant="h3" fontWeight={800} gutterBottom>
          About Blood Donated
        </Typography>
        <Typography
          variant="h6"
          sx={{ opacity: 0.88, maxWidth: 580, mx: "auto", lineHeight: 1.7 }}
        >
          Revolutionizing blood donation and inventory management across
          Cambodia — built by students, powered by purpose.
        </Typography>
      </Box>

      {/* Stats Banner */}
      <Box
        sx={{
          backgroundColor: isDark ? "#1a1a1a" : "#fff",
          py: 7,
          borderBottom: `1px solid ${isDark ? "#2a2a2a" : "#eee"}`,
        }}
      >
        <Container maxWidth="lg">
          <Grid container spacing={4} justifyContent="center">
            {stats.map((item, idx) => (
              <Grid item xs={6} sm={3} key={idx} data-aos="zoom-in" data-aos-delay={idx * 80}>
                <Box textAlign="center">
                  <Box sx={{ mb: 1.5 }}>{item.icon}</Box>
                  <Typography variant="h4" fontWeight={800} color="error.main">
                    {item.label}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {item.desc}
                  </Typography>
                </Box>
              </Grid>
            ))}
          </Grid>
        </Container>
      </Box>

      <Container maxWidth="lg" sx={{ py: 8 }}>
        {/* Mission */}
        <Box
          data-aos="fade-up"
          sx={{
            display: "grid",
            gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" },
            gap: 5,
            mb: 8,
            alignItems: "center",
          }}
        >
          <Box>
            <Typography variant="h4" fontWeight={700} color="error.main" gutterBottom>
              Our Mission
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ lineHeight: 1.85, mb: 2 }}>
              <strong>Blood Donated</strong> is a full-stack web application
              built by 4th-year Data Science students at the Institute of
              Technology of Cambodia. We recognized a critical gap in Cambodia's
              blood supply chain and set out to fix it with technology.
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ lineHeight: 1.85 }}>
              With real-time inventory tracking, donor management, and automated
              shortage alerts, the platform connects hospitals, donors, and
              communities — ensuring no life is lost due to lack of blood.
            </Typography>
          </Box>
          <Paper
            elevation={4}
            sx={{
              p: 4,
              borderRadius: 4,
              background: isDark
                ? "linear-gradient(135deg, #2d1515 0%, #1a0d0d 100%)"
                : "linear-gradient(135deg, #fff5f5 0%, #fdecea 100%)",
              border: `1px solid ${isDark ? "#4a1515" : "#ffcdd2"}`,
            }}
          >
            <Typography variant="h6" fontWeight={700} color="error.main" gutterBottom>
              Why This Matters
            </Typography>
            <Box sx={{ display: "flex", flexDirection: "column", gap: 2, mt: 2 }}>
              {reasons.map((r, i) => (
                <Box key={i} sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                  <Box
                    sx={{
                      width: 40,
                      height: 40,
                      borderRadius: 2,
                      backgroundColor: isDark ? "rgba(183,28,28,0.2)" : "#fff",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                      boxShadow: 1,
                    }}
                  >
                    {r.icon}
                  </Box>
                  <Typography variant="body2" color="text.secondary">
                    {r.text}
                  </Typography>
                </Box>
              ))}
            </Box>
          </Paper>
        </Box>

        <Divider sx={{ mb: 8 }} />

        {/* Timeline */}
        <Box mb={8} data-aos="fade-up">
          <Typography variant="h4" fontWeight={700} color="error.main" gutterBottom>
            Our Journey
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 5 }}>
            From idea to impact — key milestones in our project's evolution.
          </Typography>
          <Box sx={{ position: "relative", pl: { xs: 2, md: 4 } }}>
            {/* vertical line */}
            <Box
              sx={{
                position: "absolute",
                left: { xs: 14, md: 22 },
                top: 8,
                bottom: 8,
                width: 2,
                backgroundColor: isDark ? "#4a1515" : "#ffcdd2",
              }}
            />
            <Box sx={{ display: "flex", flexDirection: "column", gap: 4 }}>
              {timeline.map((item, idx) => (
                <Box
                  key={idx}
                  data-aos="fade-right"
                  data-aos-delay={idx * 80}
                  sx={{ display: "flex", gap: 3, alignItems: "flex-start", position: "relative" }}
                >
                  {/* dot */}
                  <Box
                    sx={{
                      width: 16,
                      height: 16,
                      borderRadius: "50%",
                      backgroundColor: "#b71c1c",
                      flexShrink: 0,
                      mt: 0.7,
                      boxShadow: `0 0 0 4px ${isDark ? "#2d1515" : "#fdecea"}`,
                      zIndex: 1,
                    }}
                  />
                  <Box>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 0.5 }}>
                      <Chip
                        label={item.year}
                        size="small"
                        sx={{ backgroundColor: "#b71c1c", color: "white", fontWeight: 700, fontSize: "0.75rem" }}
                      />
                      <Typography variant="subtitle1" fontWeight={700}>
                        {item.event}
                      </Typography>
                    </Box>
                    <Typography variant="body2" color="text.secondary">
                      {item.desc}
                    </Typography>
                  </Box>
                </Box>
              ))}
            </Box>
          </Box>
        </Box>

        <Divider sx={{ mb: 8 }} />

        {/* DevOps */}
        <Box mb={8} data-aos="fade-up">
          <Typography variant="h4" fontWeight={700} color="error.main" gutterBottom>
            DevOps & CI/CD
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mb: 4, lineHeight: 1.8 }}>
            We implement modern deployment practices to ensure system reliability
            and rapid iteration.
          </Typography>
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: { xs: "1fr", sm: "repeat(3, 1fr)" },
              gap: 3,
            }}
          >
            {[
              { icon: "🚀", title: "GitHub Actions", desc: "Automated CI/CD pipeline for every push to main." },
              { icon: "🐳", title: "Docker", desc: "Containerized deployments for consistent environments." },
              { icon: "⚡", title: "Rapid Delivery", desc: "Scalable feature delivery for hospitals and users." },
            ].map((item, i) => (
              <Paper
                key={i}
                elevation={2}
                data-aos="zoom-in"
                data-aos-delay={i * 100}
                sx={{ p: 3, borderRadius: 3, textAlign: "center" }}
              >
                <Typography fontSize="2.5rem" mb={1}>{item.icon}</Typography>
                <Typography fontWeight={700} gutterBottom>{item.title}</Typography>
                <Typography variant="body2" color="text.secondary">{item.desc}</Typography>
              </Paper>
            ))}
          </Box>
        </Box>

        {/* Tech Stack */}
        <Box mb={8} data-aos="fade-up">
          <Typography variant="h4" fontWeight={700} color="error.main" gutterBottom>
            Technology Stack
          </Typography>
          <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1.5, mt: 2 }}>
            {techs.map((tech, i) => (
              <Chip
                key={i}
                label={tech}
                variant="outlined"
                color="error"
                sx={{ fontWeight: 700, px: 1.5, fontSize: "0.9rem" }}
              />
            ))}
          </Box>
        </Box>

        {/* CTA */}
        <Paper
          elevation={4}
          data-aos="fade-up"
          sx={{
            p: { xs: 4, md: 6 },
            borderRadius: 4,
            background: isDark
              ? "linear-gradient(135deg, #1a0000 0%, #2d0505 100%)"
              : "linear-gradient(135deg, #b71c1c 0%, #c62828 100%)",
            color: "white",
            textAlign: "center",
          }}
        >
          <RocketLaunchIcon sx={{ fontSize: 52, mb: 2, opacity: 0.9 }} />
          <Typography variant="h5" fontWeight={700} gutterBottom>
            Ready to Make a Difference?
          </Typography>
          <Typography variant="body1" sx={{ opacity: 0.88, mb: 4, maxWidth: 480, mx: "auto" }}>
            Join thousands of donors across Cambodia and help us build a future
            where no life is lost due to lack of blood.
          </Typography>
          <Box sx={{ display: "flex", justifyContent: "center", gap: 2, flexWrap: "wrap" }}>
            <Button
              variant="contained"
              size="large"
              href="/donate"
              sx={{
                backgroundColor: "white",
                color: "#b71c1c",
                fontWeight: 700,
                px: 4,
                borderRadius: 3,
                "&:hover": { backgroundColor: "#ffcdd2" },
              }}
            >
              Become a Donor
            </Button>
            <Button
              variant="outlined"
              size="large"
              href="/contact"
              sx={{
                borderColor: "rgba(255,255,255,0.7)",
                color: "white",
                fontWeight: 700,
                px: 4,
                borderRadius: 3,
                "&:hover": { borderColor: "white", backgroundColor: "rgba(255,255,255,0.1)" },
              }}
            >
              Contact Us
            </Button>
          </Box>
        </Paper>
      </Container>
    </Box>
  );
};

export default About;
