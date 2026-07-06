import React, { useState } from "react";
import {
  Container, Typography, Box, Paper, TextField,
  Button, useTheme, Avatar, Chip,
} from "@mui/material";
import { useNavigate, Link as RouterLink } from "react-router-dom";
import EmailIcon from "@mui/icons-material/Email";
import PhoneIcon from "@mui/icons-material/Phone";
import LocationOnIcon from "@mui/icons-material/LocationOn";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import SendIcon from "@mui/icons-material/Send";
import LockIcon from "@mui/icons-material/Lock";
import ChatIcon from "@mui/icons-material/Chat";
import LocalHospitalIcon from "@mui/icons-material/LocalHospital";
import FavoriteIcon from "@mui/icons-material/Favorite";
import axios from "axios";
import API_BASE from "../config";
import { useUserAuth } from "../context/UserAuthContext";

const HERO_IMG =
  "https://images.unsplash.com/photo-1586773860418-d37222d8fce3?auto=format&fit=crop&w=1920&q=80";
const CTA_IMG =
  "https://images.unsplash.com/photo-1579154204601-01588f351e67?auto=format&fit=crop&w=1920&q=80";

const contactInfo = [
  {
    icon: <EmailIcon sx={{ fontSize: 22, color: "#fff" }} />,
    label: "Email",
    value: "Vath.V211006@sis.hust.edu.vn",
    href: "mailto:Vath.V211006@sis.hust.edu.vn",
    color: "#b71c1c",
  },
  {
    icon: <PhoneIcon sx={{ fontSize: 22, color: "#fff" }} />,
    label: "Phone",
    value: "+855 12 345 678",
    href: "tel:+85512345678",
    color: "#ad1457",
  },
  {
    icon: <LocationOnIcon sx={{ fontSize: 22, color: "#fff" }} />,
    label: "Address",
    value: "Institute of Technology of Cambodia, Phnom Penh",
    color: "#6a1b9a",
  },
  {
    icon: <AccessTimeIcon sx={{ fontSize: 22, color: "#fff" }} />,
    label: "Office Hours",
    value: "Mon – Fri: 8:00 AM – 5:00 PM",
    color: "#1565c0",
  },
];

const Contact = () => {
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";
  const navigate = useNavigate();
  const { isAuth, user, token } = useUserAuth();
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!message.trim()) return;
    setLoading(true);
    try {
      await axios.post(
        `${API_BASE}/api/messages`,
        { content: message },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      navigate("/messages");
    } catch (err) {
      console.error(err);
      alert("Failed to send. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ backgroundColor: isDark ? "#121212" : "#f4f4f4" }}>

      {/* ── Hero — Photo Background ────────────────────────────────────────── */}
      <Box sx={{
        position: "relative",
        minHeight: { xs: "68vh", md: "76vh" },
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
        <Box sx={{ position: "relative", zIndex: 2, px: 3, pt: { xs: 14, md: 8 }, pb: { xs: 8, md: 6 } }}>
          <Chip
            icon={<ChatIcon sx={{ color: "white !important", fontSize: "18px !important" }} />}
            label="We're Here to Help"
            sx={{ backgroundColor: "rgba(255,255,255,0.15)", color: "white", fontWeight: 700, mb: 3, backdropFilter: "blur(4px)", fontSize: "0.82rem" }}
          />
          <Typography variant="h2" fontWeight={800} color="white"
            sx={{ lineHeight: 1.12, mb: 2, fontSize: { xs: "2.4rem", md: "3.6rem" }, textShadow: "0 2px 24px rgba(0,0,0,0.6)" }}>
            Contact Us
          </Typography>
          <Typography variant="h5" sx={{ color: "#ffcdd2", fontWeight: 700, mb: 2.5, fontSize: { xs: "1.1rem", md: "1.4rem" } }}>
            Have a question or need help?
          </Typography>
          <Typography variant="h6" sx={{
            color: "rgba(255,255,255,0.82)", maxWidth: 560, mx: "auto",
            lineHeight: 1.8, fontWeight: 400, fontSize: { xs: "1rem", md: "1.1rem" },
          }}>
            Whether you're a donor, patient, or hospital partner — our team is
            always ready to assist you.
          </Typography>

          {/* Quick info chips */}
          <Box sx={{ display: "flex", gap: 2, justifyContent: "center", flexWrap: "wrap", mt: 5 }}>
            {[
              { icon: "📧", label: "Email Support" },
              { icon: "📞", label: "Phone: +855 12 345 678" },
              { icon: "🕐", label: "Mon–Fri, 8AM–5PM" },
            ].map((item, i) => (
              <Chip
                key={i}
                label={`${item.icon} ${item.label}`}
                sx={{
                  backgroundColor: "rgba(255,255,255,0.13)",
                  color: "white",
                  fontWeight: 600,
                  backdropFilter: "blur(6px)",
                  border: "1px solid rgba(255,255,255,0.2)",
                  fontSize: "0.82rem",
                }}
              />
            ))}
          </Box>
        </Box>
      </Box>

      {/* ── Main Content ──────────────────────────────────────────────────── */}
      <Container maxWidth="lg" sx={{ py: 10 }}>
        <Box sx={{
          display: "grid",
          gridTemplateColumns: { xs: "1fr", md: "1fr 2fr" },
          gap: 4,
          alignItems: "start",
        }}>

          {/* ── Left: Contact Info ─────────────────────────────────────────── */}
          <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>

            {/* Info cards */}
            <Paper elevation={0} sx={{
              p: 4, borderRadius: 4,
              backgroundColor: isDark ? "#1a1a1a" : "#fff",
              border: `1px solid ${isDark ? "#2a2a2a" : "#efefef"}`,
              boxShadow: isDark ? "none" : "0 4px 24px rgba(0,0,0,0.06)",
            }}>
              <Typography variant="overline" color="error" fontWeight={700} letterSpacing="0.12em">
                Reach Us
              </Typography>
              <Typography variant="h6" fontWeight={700} mt={0.5} mb={0.5}>
                Get In Touch
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3.5, lineHeight: 1.7 }}>
                Whether you're a donor, patient, or hospital partner — our team is here to help.
              </Typography>

              <Box sx={{ display: "flex", flexDirection: "column", gap: 2.5 }}>
                {contactInfo.map((info, idx) => (
                  <Box key={idx} sx={{ display: "flex", alignItems: "flex-start", gap: 2 }}>
                    <Box sx={{
                      width: 44, height: 44, borderRadius: 2.5, flexShrink: 0,
                      background: `linear-gradient(135deg, ${info.color} 0%, ${info.color}cc 100%)`,
                      display: "flex", alignItems: "center", justifyContent: "center",
                      boxShadow: `0 4px 12px ${info.color}44`,
                    }}>
                      {info.icon}
                    </Box>
                    <Box>
                      <Typography variant="caption" color="text.disabled" fontWeight={700}
                        sx={{ textTransform: "uppercase", letterSpacing: "0.08em", display: "block" }}>
                        {info.label}
                      </Typography>
                      {info.href ? (
                        <Typography component="a" href={info.href} variant="body2" fontWeight={600}
                          sx={{ color: "text.primary", textDecoration: "none", "&:hover": { color: "error.main" }, transition: "color 0.2s" }}>
                          {info.value}
                        </Typography>
                      ) : (
                        <Typography variant="body2" fontWeight={600}>{info.value}</Typography>
                      )}
                    </Box>
                  </Box>
                ))}
              </Box>
            </Paper>

            {/* Emergency card */}
            <Paper elevation={0} sx={{
              p: 3.5, borderRadius: 4,
              background: "linear-gradient(135deg, #b71c1c 0%, #7f0000 100%)",
              color: "white",
              boxShadow: "0 8px 32px rgba(183,28,28,0.35)",
            }}>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 1.5 }}>
                <LocalHospitalIcon sx={{ fontSize: 26 }} />
                <Typography variant="subtitle1" fontWeight={800}>
                  Emergency Blood Request?
                </Typography>
              </Box>
              <Typography variant="body2" sx={{ opacity: 0.9, lineHeight: 1.75, mb: 2.5 }}>
                For urgent blood needs, use our dedicated request form for immediate processing by our team.
              </Typography>
              <Button
                component={RouterLink} to="/request"
                variant="outlined" size="small" fullWidth
                sx={{
                  borderColor: "rgba(255,255,255,0.7)", color: "white", fontWeight: 700,
                  borderRadius: 2.5, py: 1,
                  "&:hover": { borderColor: "white", backgroundColor: "rgba(255,255,255,0.15)" },
                }}>
                Request Blood Now →
              </Button>
            </Paper>
          </Box>

          {/* ── Right: Message Form or Login Prompt ───────────────────────── */}
          {isAuth ? (
            <Paper elevation={0} sx={{
              p: { xs: 3.5, md: 5 }, borderRadius: 4,
              backgroundColor: isDark ? "#1a1a1a" : "#fff",
              border: `1px solid ${isDark ? "#2a2a2a" : "#efefef"}`,
              boxShadow: isDark ? "none" : "0 4px 24px rgba(0,0,0,0.06)",
            }}>
              {/* Form header */}
              <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 1 }}>
                <Avatar sx={{
                  width: 48, height: 48,
                  background: "linear-gradient(135deg, #b71c1c 0%, #d32f2f 100%)",
                  boxShadow: "0 4px 14px rgba(183,28,28,0.4)",
                }}>
                  <ChatIcon />
                </Avatar>
                <Box>
                  <Typography variant="overline" color="error" fontWeight={700} letterSpacing="0.12em" sx={{ lineHeight: 1 }}>
                    Direct Message
                  </Typography>
                  <Typography variant="h5" fontWeight={800} sx={{ lineHeight: 1.2 }}>
                    Send a Message
                  </Typography>
                </Box>
              </Box>

              <Typography variant="body2" color="text.secondary" sx={{ mb: 4, mt: 1.5, lineHeight: 1.7 }}>
                Sending as <strong>{user?.fullName}</strong> — your message goes directly to our admin team.
                View your full conversation in{" "}
                <Typography component={RouterLink} to="/messages" variant="body2"
                  color="error.main" sx={{ textDecoration: "none", fontWeight: 700 }}>
                  My Messages
                </Typography>.
              </Typography>

              <Box component="form" onSubmit={handleSubmit} noValidate>
                <TextField
                  fullWidth
                  label="Your Message"
                  multiline
                  rows={7}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  required
                  placeholder="Tell us how we can help you..."
                  sx={{
                    mb: 3,
                    "& .MuiOutlinedInput-root": { borderRadius: 3 },
                  }}
                />
                <Button
                  type="submit"
                  variant="contained"
                  color="error"
                  size="large"
                  fullWidth
                  disabled={loading || !message.trim()}
                  startIcon={<SendIcon />}
                  sx={{
                    py: 1.6, fontWeight: 700, fontSize: "1rem", borderRadius: 3,
                    background: "linear-gradient(135deg, #b71c1c 0%, #d32f2f 100%)",
                    boxShadow: "0 6px 20px rgba(183,28,28,0.4)",
                    "&:hover": { boxShadow: "0 8px 28px rgba(183,28,28,0.55)", transform: "translateY(-1px)" },
                    "&.Mui-disabled": { background: isDark ? "#2a2a2a" : "#e0e0e0" },
                    transition: "all 0.25s ease",
                  }}
                >
                  {loading ? "Sending…" : "Send Message"}
                </Button>
                <Typography variant="caption" color="text.disabled" display="block" textAlign="center" mt={1.5}>
                  We respect your privacy and will never share your information.
                </Typography>
              </Box>
            </Paper>
          ) : (
            <Paper elevation={0} sx={{
              p: { xs: 4, md: 6 }, borderRadius: 4,
              backgroundColor: isDark ? "#1a1a1a" : "#fff",
              border: `1px solid ${isDark ? "#2a2a2a" : "#efefef"}`,
              boxShadow: isDark ? "none" : "0 4px 24px rgba(0,0,0,0.06)",
              display: "flex", flexDirection: "column",
              alignItems: "center", justifyContent: "center",
              textAlign: "center", minHeight: 380,
            }}>
              <Box sx={{
                width: 80, height: 80, borderRadius: "50%", mb: 3,
                background: "linear-gradient(135deg, #b71c1c 0%, #7f0000 100%)",
                display: "flex", alignItems: "center", justifyContent: "center",
                boxShadow: "0 8px 28px rgba(183,28,28,0.4)",
              }}>
                <LockIcon sx={{ fontSize: 38, color: "white" }} />
              </Box>
              <Typography variant="h5" fontWeight={800} gutterBottom>
                Log In to Send a Message
              </Typography>
              <Typography variant="body1" color="text.secondary" sx={{ mb: 4, maxWidth: 360, lineHeight: 1.75 }}>
                Create an account or log in to chat directly with our admin team.
                Your full conversation history is saved.
              </Typography>
              <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap", justifyContent: "center" }}>
                <Button
                  variant="contained" color="error"
                  component={RouterLink} to="/login"
                  size="large"
                  sx={{ borderRadius: 3, fontWeight: 700, px: 4, py: 1.4,
                    background: "linear-gradient(135deg, #b71c1c 0%, #d32f2f 100%)",
                    boxShadow: "0 6px 20px rgba(183,28,28,0.4)",
                    "&:hover": { transform: "translateY(-2px)" }, transition: "all 0.25s",
                  }}>
                  Log In
                </Button>
                <Button
                  variant="outlined" color="error"
                  component={RouterLink} to="/signup"
                  size="large"
                  sx={{ borderRadius: 3, fontWeight: 700, px: 4, py: 1.4,
                    "&:hover": { transform: "translateY(-2px)" }, transition: "all 0.25s",
                  }}>
                  Sign Up
                </Button>
              </Box>
            </Paper>
          )}
        </Box>
      </Container>

      {/* ── CTA — Photo Background ─────────────────────────────────────────── */}
      <Box sx={{
        position: "relative",
        py: 13,
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
      }}>
        <Container maxWidth="md" sx={{ position: "relative", zIndex: 1 }}>
          <FavoriteIcon sx={{ fontSize: 58, color: "#ffcdd2", mb: 2 }} />
          <Typography variant="h3" fontWeight={800} color="white" gutterBottom
            sx={{ textShadow: "0 2px 20px rgba(0,0,0,0.5)", fontSize: { xs: "2rem", md: "2.8rem" } }}>
            Ready to Save a Life?
          </Typography>
          <Typography variant="h6" sx={{
            color: "rgba(255,255,255,0.85)", mb: 6,
            lineHeight: 1.8, maxWidth: 520, mx: "auto", fontWeight: 400,
          }}>
            Every donation matters. Join thousands of donors across Cambodia and
            help ensure no life is lost due to a lack of blood.
          </Typography>
          <Box sx={{ display: "flex", justifyContent: "center", gap: 2.5, flexWrap: "wrap" }}>
            <Button component={RouterLink} to="/donate" variant="contained" size="large" sx={{
              backgroundColor: "white", color: "#b71c1c", fontWeight: 800, px: 5, py: 1.7, borderRadius: 3, fontSize: "1rem",
              boxShadow: "0 8px 32px rgba(0,0,0,0.4)",
              "&:hover": { backgroundColor: "#ffcdd2", transform: "translateY(-3px)" }, transition: "all 0.25s",
            }}>
              Become a Donor
            </Button>
            <Button component={RouterLink} to="/appointment" variant="outlined" size="large" sx={{
              borderColor: "rgba(255,255,255,0.7)", color: "white", fontWeight: 700, px: 5, py: 1.7, borderRadius: 3, fontSize: "1rem",
              backdropFilter: "blur(4px)",
              "&:hover": { backgroundColor: "rgba(255,255,255,0.15)", borderColor: "white", transform: "translateY(-3px)" }, transition: "all 0.25s",
            }}>
              Book Appointment
            </Button>
          </Box>
        </Container>
      </Box>

    </Box>
  );
};

export default Contact;
