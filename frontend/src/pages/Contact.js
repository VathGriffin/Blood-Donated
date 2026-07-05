import React, { useState } from "react";
import {
  Container,
  Typography,
  Box,
  Paper,
  TextField,
  Button,
  useTheme,
} from "@mui/material";
import { useNavigate } from "react-router-dom";
import EmailIcon from "@mui/icons-material/Email";
import PhoneIcon from "@mui/icons-material/Phone";
import LocationOnIcon from "@mui/icons-material/LocationOn";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import SendIcon from "@mui/icons-material/Send";

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
  const [form, setForm] = useState({ fullName: "", email: "", message: "" });
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch("http://localhost:3001/api/contacts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (res.ok) {
        navigate("/contact/thank-you");
      } else {
        const data = await res.json();
        alert("Submission failed: " + (data.message || "Unknown error"));
      }
    } catch (error) {
      console.error(error);
      alert("Server error. Please try again later.");
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
          Have a question, feedback, or want to partner with us? We'd love to
          hear from you.
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
                Whether you're a donor, patient, or hospital partner — our team
                is here to help.
              </Typography>
              <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
                {contactInfo.map((info, idx) => (
                  <Box key={idx} sx={{ display: "flex", alignItems: "flex-start", gap: 2 }}>
                    <Box
                      sx={{
                        width: 44,
                        height: 44,
                        borderRadius: 2,
                        backgroundColor: isDark ? "#2d1515" : "#fdecea",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        flexShrink: 0,
                      }}
                    >
                      {info.icon}
                    </Box>
                    <Box>
                      <Typography variant="caption" color="text.secondary" fontWeight={600} sx={{ textTransform: "uppercase", letterSpacing: "0.06em" }}>
                        {info.label}
                      </Typography>
                      {info.href ? (
                        <Typography
                          component="a"
                          href={info.href}
                          variant="body2"
                          display="block"
                          fontWeight={500}
                          sx={{ color: "text.primary", textDecoration: "none", "&:hover": { color: "error.main" } }}
                        >
                          {info.value}
                        </Typography>
                      ) : (
                        <Typography variant="body2" fontWeight={500}>
                          {info.value}
                        </Typography>
                      )}
                    </Box>
                  </Box>
                ))}
              </Box>
            </Paper>

            {/* Urgency note */}
            <Paper
              elevation={3}
              sx={{
                p: 3,
                borderRadius: 3,
                background: isDark
                  ? "linear-gradient(135deg, #1a0000 0%, #2d0505 100%)"
                  : "linear-gradient(135deg, #b71c1c 0%, #c62828 100%)",
                color: "white",
              }}
            >
              <Typography variant="subtitle1" fontWeight={700} gutterBottom>
                🚨 Emergency Blood Request?
              </Typography>
              <Typography variant="body2" sx={{ opacity: 0.9, lineHeight: 1.7, mb: 2 }}>
                For urgent blood needs, please use our blood request form for
                faster processing.
              </Typography>
              <Button
                variant="outlined"
                size="small"
                href="/request"
                sx={{ borderColor: "rgba(255,255,255,0.7)", color: "white", "&:hover": { borderColor: "white", backgroundColor: "rgba(255,255,255,0.1)" } }}
              >
                Request Blood →
              </Button>
            </Paper>
          </Box>

          {/* Contact Form */}
          <Paper elevation={4} sx={{ p: { xs: 3, md: 5 }, borderRadius: 4 }}>
            <Typography variant="h5" fontWeight={800} color="error.dark" gutterBottom>
              Send a Message
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 4 }}>
              Fill out the form below and we'll get back to you within 24 hours.
            </Typography>

            <Box component="form" onSubmit={handleSubmit} noValidate>
              <Box
                sx={{
                  display: "grid",
                  gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" },
                  gap: 2,
                }}
              >
                <TextField
                  fullWidth
                  label="Full Name"
                  name="fullName"
                  value={form.fullName}
                  onChange={handleChange}
                  required
                  sx={{ gridColumn: "1 / -1" }}
                />
                <TextField
                  fullWidth
                  label="Email Address"
                  name="email"
                  type="email"
                  value={form.email}
                  onChange={handleChange}
                  required
                  sx={{ gridColumn: "1 / -1" }}
                />
                <TextField
                  fullWidth
                  label="Your Message"
                  name="message"
                  multiline
                  rows={6}
                  value={form.message}
                  onChange={handleChange}
                  required
                  placeholder="Tell us how we can help you..."
                  sx={{ gridColumn: "1 / -1" }}
                />
              </Box>

              <Box mt={3}>
                <Button
                  type="submit"
                  variant="contained"
                  color="error"
                  size="large"
                  fullWidth
                  disabled={loading}
                  startIcon={<SendIcon />}
                  sx={{
                    py: 1.5,
                    fontWeight: 700,
                    fontSize: "1rem",
                    borderRadius: 3,
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
            </Box>
          </Paper>
        </Box>
      </Container>
    </Box>
  );
};

export default Contact;
