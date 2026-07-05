import React, { useState } from "react";
import {
  Container, Typography, Box, Paper, TextField,
  Button, useTheme, Avatar,
} from "@mui/material";
import { useNavigate, Link as RouterLink } from "react-router-dom";
import EmailIcon from "@mui/icons-material/Email";
import PhoneIcon from "@mui/icons-material/Phone";
import LocationOnIcon from "@mui/icons-material/LocationOn";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import SendIcon from "@mui/icons-material/Send";
import LockIcon from "@mui/icons-material/Lock";
import ChatIcon from "@mui/icons-material/Chat";
import axios from "axios";
import API_BASE from "../config";
import { useUserAuth } from "../context/UserAuthContext";

const contactInfo = [
  {
    icon: <EmailIcon sx={{ color: "#b71c1c", fontSize: 24 }} />,
    label: "Email",
    value: "Vath.V211006@sis.hust.edu.vn",
    href: "mailto:Vath.V211006@sis.hust.edu.vn",
  },
  {
    icon: <PhoneIcon sx={{ color: "#b71c1c", fontSize: 24 }} />,
    label: "Phone",
    value: "+855 12 345 678",
    href: "tel:+85512345678",
  },
  {
    icon: <LocationOnIcon sx={{ color: "#b71c1c", fontSize: 24 }} />,
    label: "Address",
    value: "Institute of Technology of Cambodia, Phnom Penh",
  },
  {
    icon: <AccessTimeIcon sx={{ color: "#b71c1c", fontSize: 24 }} />,
    label: "Hours",
    value: "Mon–Fri: 8:00 AM – 5:00 PM",
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
    <Box sx={{ backgroundColor: isDark ? "#121212" : "#f9f9f9", minHeight: "100vh" }}>
      {/* Hero */}
      <Box
        sx={{
          background: isDark
            ? "linear-gradient(135deg, #1a0000 0%, #2d0505 100%)"
            : "linear-gradient(135deg, #b71c1c 0%, #7f0000 100%)",
          color: "white",
          pt: { xs: 7, md: 9 },
          pb: { xs: 6, md: 8 },
          textAlign: "center",
          px: 3,
        }}
      >
        <SendIcon sx={{ fontSize: 52, mb: 2, opacity: 0.9 }} />
        <Typography variant="h3" fontWeight={800} gutterBottom>
          Contact Us
        </Typography>
        <Typography variant="h6" sx={{ opacity: 0.88, maxWidth: 500, mx: "auto", lineHeight: 1.7 }}>
          Have a question, feedback, or want to partner with us? We'd love to hear from you.
        </Typography>
      </Box>

      <Container maxWidth="lg" sx={{ py: 8 }}>
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: { xs: "1fr", md: "1fr 2fr" },
            gap: 4,
            alignItems: "start",
          }}
        >
          {/* Contact Info Sidebar */}
          <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
            <Paper elevation={3} sx={{ p: 4, borderRadius: 3 }}>
              <Typography variant="h6" fontWeight={700} color="error.main" gutterBottom>
                Get In Touch
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3, lineHeight: 1.7 }}>
                Whether you're a donor, patient, or hospital partner — our team is here to help.
              </Typography>
              <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
                {contactInfo.map((info, idx) => (
                  <Box key={idx} sx={{ display: "flex", alignItems: "flex-start", gap: 2 }}>
                    <Box
                      sx={{
                        width: 44, height: 44, borderRadius: 2,
                        backgroundColor: isDark ? "#2d1515" : "#fdecea",
                        display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                      }}
                    >
                      {info.icon}
                    </Box>
                    <Box>
                      <Typography variant="caption" color="text.secondary" fontWeight={600} sx={{ textTransform: "uppercase", letterSpacing: "0.06em" }}>
                        {info.label}
                      </Typography>
                      {info.href ? (
                        <Typography component="a" href={info.href} variant="body2" display="block" fontWeight={500}
                          sx={{ color: "text.primary", textDecoration: "none", "&:hover": { color: "error.main" } }}>
                          {info.value}
                        </Typography>
                      ) : (
                        <Typography variant="body2" fontWeight={500}>{info.value}</Typography>
                      )}
                    </Box>
                  </Box>
                ))}
              </Box>
            </Paper>

            {/* Urgency note */}
            <Paper elevation={3} sx={{
              p: 3, borderRadius: 3,
              background: isDark
                ? "linear-gradient(135deg, #1a0000 0%, #2d0505 100%)"
                : "linear-gradient(135deg, #b71c1c 0%, #c62828 100%)",
              color: "white",
            }}>
              <Typography variant="subtitle1" fontWeight={700} gutterBottom>
                🚨 Emergency Blood Request?
              </Typography>
              <Typography variant="body2" sx={{ opacity: 0.9, lineHeight: 1.7, mb: 2 }}>
                For urgent blood needs, please use our blood request form for faster processing.
              </Typography>
              <Button variant="outlined" size="small" href="/request"
                sx={{ borderColor: "rgba(255,255,255,0.7)", color: "white", "&:hover": { borderColor: "white", backgroundColor: "rgba(255,255,255,0.1)" } }}>
                Request Blood →
              </Button>
            </Paper>
          </Box>

          {/* Message form or login prompt */}
          {isAuth ? (
            <Paper elevation={4} sx={{ p: { xs: 3, md: 5 }, borderRadius: 4 }}>
              <Box display="flex" alignItems="center" gap={1.5} mb={1}>
                <Avatar sx={{ bgcolor: "#b71c1c", width: 40, height: 40 }}>
                  <ChatIcon />
                </Avatar>
                <Box>
                  <Typography variant="h5" fontWeight={800} color="error.dark">
                    Send a Message
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Sending as {user?.fullName}
                  </Typography>
                </Box>
              </Box>

              <Typography variant="body2" color="text.secondary" sx={{ mb: 4, mt: 1 }}>
                Your message goes directly to our admin team. You can view the full conversation in{" "}
                <Typography component={RouterLink} to="/messages" variant="body2" color="error.main" sx={{ textDecoration: "none", fontWeight: 600 }}>
                  My Messages
                </Typography>.
              </Typography>

              <Box component="form" onSubmit={handleSubmit} noValidate>
                <TextField
                  fullWidth
                  label="Your Message"
                  multiline
                  rows={6}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  required
                  placeholder="Tell us how we can help you..."
                  sx={{ mb: 3 }}
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
                    py: 1.5, fontWeight: 700, fontSize: "1rem", borderRadius: 3,
                    boxShadow: "0 4px 15px rgba(183,28,28,0.35)",
                    "&:hover": { boxShadow: "0 6px 20px rgba(183,28,28,0.5)" },
                  }}
                >
                  {loading ? "Sending..." : "Send Message"}
                </Button>
                <Typography variant="caption" color="text.secondary" display="block" textAlign="center" mt={1.5}>
                  We respect your privacy and will never share your information.
                </Typography>
              </Box>
            </Paper>
          ) : (
            <Paper elevation={4} sx={{ p: { xs: 3, md: 5 }, borderRadius: 4, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", textAlign: "center", minHeight: 340 }}>
              <LockIcon sx={{ fontSize: 56, color: "#b71c1c", mb: 2 }} />
              <Typography variant="h5" fontWeight={700} gutterBottom>
                Log in to Send a Message
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 4, maxWidth: 340 }}>
                Create an account or log in to chat directly with our admin team. Your conversation history is saved.
              </Typography>
              <Box sx={{ display: "flex", gap: 2 }}>
                <Button variant="contained" color="error" component={RouterLink} to="/login" sx={{ borderRadius: 3, fontWeight: 700, px: 3 }}>
                  Log In
                </Button>
                <Button variant="outlined" color="error" component={RouterLink} to="/signup" sx={{ borderRadius: 3, fontWeight: 600, px: 3 }}>
                  Sign Up
                </Button>
              </Box>
            </Paper>
          )}
        </Box>
      </Container>
    </Box>
  );
};

export default Contact;
