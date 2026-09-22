'use client';
import Link from 'next/link';
import { useState } from "react";
import {
  Container, Typography, Box, Paper, TextField, Button, useTheme, Chip,
  FormControl, InputLabel, Select, MenuItem, Alert,
} from "@mui/material";
import EmailIcon from "@mui/icons-material/Email";
import PhoneIcon from "@mui/icons-material/Phone";
import LocationOnIcon from "@mui/icons-material/LocationOn";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import SendIcon from "@mui/icons-material/Send";
import ChatIcon from "@mui/icons-material/Chat";
import ChatBubbleOutlineIcon from "@mui/icons-material/ChatBubbleOutline";
import ShieldIcon from "@mui/icons-material/Shield";
import FavoriteIcon from "@mui/icons-material/Favorite";
import GroupsIcon from "@mui/icons-material/Groups";
import RoomIcon from "@mui/icons-material/Room";
import AddIcon from "@mui/icons-material/Add";
import RemoveIcon from "@mui/icons-material/Remove";
import axios from "axios";
import API_BASE from "@/lib/config";
import { script } from '@/lib/fonts';

const HERO_IMG =
  "https://images.unsplash.com/photo-1586773860418-d37222d8fce3?auto=format&fit=crop&w=1920&q=80";

const CONTACT_EMAIL = "Vath.V211006@sis.hust.edu.vn";
const CONTACT_PHONE_DISPLAY = "+855 12 345 678";
const CONTACT_PHONE_HREF = "tel:+85512345678";
const CONTACT_ADDRESS = "Institute of Technology of Cambodia, Phnom Penh";

const heroFeatures = [
  { icon: <ChatBubbleOutlineIcon />, title: "Quick Response", subtitle: "We usually reply within 24 hours" },
  { icon: <ShieldIcon />, title: "Trusted Support", subtitle: "Your privacy is our priority" },
  { icon: <FavoriteIcon />, title: "Stronger Together", subtitle: "Building a healthier Cambodia" },
];

const topInfoCards = [
  { icon: <EmailIcon />, title: "Email Us", value: CONTACT_EMAIL, caption: "We'll get back to you soon", href: `mailto:${CONTACT_EMAIL}` },
  { icon: <PhoneIcon />, title: "Call Us", value: CONTACT_PHONE_DISPLAY, caption: "Mon – Fri, 8AM–5PM", href: CONTACT_PHONE_HREF },
  { icon: <LocationOnIcon />, title: "Visit Us", value: "Phnom Penh, Cambodia", caption: "Our main office" },
  { icon: <GroupsIcon />, title: "General Inquiries", value: "We're happy to help", caption: "Any questions or suggestions" },
];

const findUsDetails = [
  { icon: <LocationOnIcon sx={{ fontSize: 18 }} />, label: "Address", value: CONTACT_ADDRESS },
  { icon: <PhoneIcon sx={{ fontSize: 18 }} />, label: "Phone", value: CONTACT_PHONE_DISPLAY, href: CONTACT_PHONE_HREF },
  { icon: <EmailIcon sx={{ fontSize: 18 }} />, label: "Email", value: CONTACT_EMAIL, href: `mailto:${CONTACT_EMAIL}` },
  { icon: <AccessTimeIcon sx={{ fontSize: 18 }} />, label: "Working Hours", value: "Mon – Fri, 8AM–5PM" },
];

const subjectOptions = [
  "General Inquiry", "Donation Question", "Hospital Partnership", "Technical Support", "Feedback / Suggestion", "Other",
];

const cardSx = (isDark) => ({
  borderRadius: 4,
  backgroundColor: isDark ? "#1a1a1a" : "#fff",
  border: `1px solid ${isDark ? "#2a2a2a" : "#efefef"}`,
  boxShadow: isDark ? "none" : "0 4px 24px rgba(0,0,0,0.06)",
});

const iconBoxSx = {
  width: 48, height: 48, borderRadius: "50%", flexShrink: 0,
  background: "linear-gradient(135deg, #b71c1c 0%, #d32f2f 100%)",
  display: "flex", alignItems: "center", justifyContent: "center",
  boxShadow: "0 4px 12px rgba(183,28,28,0.35)",
  color: "white",
  "& svg": { fontSize: 22 },
};

const Contact = () => {
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";
  const [form, setForm] = useState({ fullName: "", email: "", subject: "", phone: "", message: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess(false);
    if (!form.fullName.trim() || !form.email.trim() || !form.subject || !form.message.trim()) {
      setError("Please fill in your name, email, subject, and message.");
      return;
    }
    setLoading(true);
    try {
      const composedMessage = [
        `Subject: ${form.subject}`,
        form.phone.trim() && `Phone: ${form.phone.trim()}`,
        "",
        form.message.trim(),
      ].filter((line) => line !== false).join("\n");

      await axios.post(`${API_BASE}/api/contacts`, {
        fullName: form.fullName.trim(),
        email: form.email.trim(),
        message: composedMessage,
      });
      setSuccess(true);
      setForm({ fullName: "", email: "", subject: "", phone: "", message: "" });
    } catch (err) {
      setError(err.response?.data?.error || "Failed to send your message. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ backgroundColor: isDark ? "#121212" : "#f4f4f4" }}>

      {/* ── Hero — Photo Background ────────────────────────────────────────── */}
      <Box sx={{
        position: "relative", overflow: "hidden",
        backgroundImage: `url('${HERO_IMG}')`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundAttachment: { xs: "scroll", md: "fixed" },
        "&::before": {
          content: '""',
          position: "absolute", inset: 0,
          background: isDark
            ? "linear-gradient(100deg, rgba(10,0,0,0.96) 0%, rgba(10,0,0,0.9) 52%, rgba(70,0,0,0.55) 68%, rgba(70,0,0,0.35) 100%)"
            : "linear-gradient(100deg, rgba(255,255,255,0.97) 0%, rgba(255,255,255,0.9) 52%, rgba(183,28,28,0.5) 68%, rgba(90,0,0,0.4) 100%)",
        },
      }}>
        <Container maxWidth="lg" sx={{ position: "relative", pt: { xs: 7, md: 9 }, pb: { xs: 11, md: 15 } }}>
          <Box sx={{ maxWidth: 640 }}>
            <Chip
              icon={<ChatIcon sx={{ color: "#b71c1c !important", fontSize: "18px !important" }} />}
              label="We're Here to Help"
              sx={{
                backgroundColor: isDark ? "rgba(183,28,28,0.18)" : "#fdeaea",
                color: "error.main", fontWeight: 700, mb: 3, fontSize: "0.82rem",
              }}
            />
            <Typography sx={{
              fontWeight: 800, lineHeight: 1.1, mb: 1.5,
              fontSize: { xs: "2.4rem", md: "3.2rem" },
              color: isDark ? "#fff" : "#161a23",
            }}>
              Contact <Box component="span" sx={{ color: "error.main" }}>Us</Box>
            </Typography>
            <Typography sx={{
              fontWeight: 700, mb: 2, fontSize: { xs: "1.15rem", md: "1.3rem" },
              color: isDark ? "#fff" : "#161a23",
            }}>
              Have a question or need help?
            </Typography>
            <Typography sx={{
              fontSize: "1.05rem", lineHeight: 1.7, mb: 5,
              color: isDark ? "rgba(255,255,255,0.75)" : "rgba(40,30,30,0.72)",
            }}>
              Whether you&apos;re a donor, patient, or hospital partner — our team is
              always ready to assist you.
            </Typography>

            <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "repeat(3, auto)" }, gap: { xs: 2.5, sm: 4 } }}>
              {heroFeatures.map((f) => (
                <Box key={f.title} sx={{ display: "flex", alignItems: "flex-start", gap: 1.5 }}>
                  <Box sx={{ color: "error.main", mt: 0.2, "& svg": { fontSize: 24 } }}>{f.icon}</Box>
                  <Box>
                    <Typography fontWeight={700} sx={{
                      fontSize: "0.95rem", lineHeight: 1.3, color: isDark ? "#fff" : "#161a23",
                    }}>
                      {f.title}
                    </Typography>
                    <Typography variant="caption" sx={{
                      lineHeight: 1.3, display: "block",
                      color: isDark ? "rgba(255,255,255,0.65)" : "rgba(40,30,30,0.65)",
                    }}>
                      {f.subtitle}
                    </Typography>
                  </Box>
                </Box>
              ))}
            </Box>
          </Box>

          <Typography className={script.className} sx={{
            position: "absolute", right: { xs: 24, md: 56 }, bottom: { xs: 24, md: 40 },
            fontSize: "2rem", lineHeight: 1.25, color: "#fff", textAlign: "right",
            textShadow: "0 2px 4px rgba(0,0,0,0.5), 0 6px 18px rgba(0,0,0,0.35)",
            display: { xs: "none", sm: "block" },
          }}>
            Together<br />We Save Lives ♡
          </Typography>
        </Container>
      </Box>

      {/* ── Quick info strip ──────────────────────────────────────────────── */}
      <Container maxWidth="lg" sx={{ mt: { xs: -3, md: -4 }, position: "relative", zIndex: 3 }}>
        <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr", md: "repeat(4, 1fr)" }, gap: 2.5 }}>
          {topInfoCards.map((card) => (
            <Paper key={card.title} elevation={0} sx={{ ...cardSx(isDark), p: 3, display: "flex", alignItems: "center", gap: 2 }}>
              <Box sx={{
                width: 48, height: 48, borderRadius: "50%", flexShrink: 0,
                backgroundColor: isDark ? "rgba(183,28,28,0.16)" : "#fdeaea",
                color: "error.main", display: "flex", alignItems: "center", justifyContent: "center",
                "& svg": { fontSize: 22 },
              }}>
                {card.icon}
              </Box>
              <Box sx={{ minWidth: 0 }}>
                <Typography fontWeight={700} sx={{ fontSize: "0.95rem" }}>{card.title}</Typography>
                {card.href ? (
                  <Typography component="a" href={card.href} variant="body2" fontWeight={600}
                    sx={{ color: "text.primary", textDecoration: "none", display: "block", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", "&:hover": { color: "error.main" } }}>
                    {card.value}
                  </Typography>
                ) : (
                  <Typography variant="body2" fontWeight={600} noWrap>{card.value}</Typography>
                )}
                <Typography variant="caption" color="text.secondary">{card.caption}</Typography>
              </Box>
            </Paper>
          ))}
        </Box>
      </Container>

      {/* ── Main Content: form + location ───────────────────────────────── */}
      <Container maxWidth="lg" sx={{ py: { xs: 6, md: 8 } }}>
        <Box sx={{
          display: "grid",
          gridTemplateColumns: { xs: "1fr", md: "1.4fr 1fr" },
          gap: 4, alignItems: "start",
        }}>

          {/* ── Left: Contact form ────────────────────────────────────────── */}
          <Paper elevation={0} sx={{ ...cardSx(isDark), p: { xs: 3.5, md: 5 } }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 1 }}>
              <Box sx={iconBoxSx}><SendIcon sx={{ fontSize: 20 }} /></Box>
              <Box>
                <Typography variant="overline" color="error" fontWeight={700} letterSpacing="0.12em" sx={{ lineHeight: 1 }}>
                  Send Us a Message
                </Typography>
                <Typography variant="h5" fontWeight={800} sx={{ lineHeight: 1.2 }}>
                  Contact Form
                </Typography>
              </Box>
            </Box>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3.5, mt: 1.5, lineHeight: 1.7 }}>
              Fill out the form below and we&apos;ll get back to you as soon as possible.
            </Typography>

            <Box component="form" onSubmit={handleSubmit} noValidate autoComplete="off">
              <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" }, gap: 2 }}>
                <TextField
                  fullWidth label="Full Name" name="fullName" value={form.fullName}
                  onChange={handleChange} required placeholder="Enter your full name"
                  sx={{ "& .MuiOutlinedInput-root": { borderRadius: 2.5 } }}
                />
                <TextField
                  fullWidth label="Email Address" name="email" type="email" value={form.email}
                  onChange={handleChange} required placeholder="Enter your email"
                  sx={{ "& .MuiOutlinedInput-root": { borderRadius: 2.5 } }}
                />
                <FormControl fullWidth required>
                  <InputLabel id="contact-subject-label">Subject</InputLabel>
                  <Select
                    labelId="contact-subject-label" name="subject" value={form.subject}
                    onChange={handleChange} label="Subject"
                    sx={{ borderRadius: 2.5 }}
                  >
                    {subjectOptions.map((s) => (
                      <MenuItem key={s} value={s}>{s}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
                <TextField
                  fullWidth label="Phone Number" name="phone" type="tel" value={form.phone}
                  onChange={handleChange} placeholder="Enter your phone number"
                  sx={{ "& .MuiOutlinedInput-root": { borderRadius: 2.5 } }}
                />
                <TextField
                  fullWidth label="Message" name="message" value={form.message}
                  onChange={handleChange} required multiline minRows={6}
                  placeholder="Type your message here..."
                  sx={{ gridColumn: "1 / -1", "& .MuiOutlinedInput-root": { borderRadius: 2.5 } }}
                />
              </Box>

              {error && (
                <Alert severity="error" sx={{ mt: 3, borderRadius: "10px" }} onClose={() => setError("")}>
                  {error}
                </Alert>
              )}
              {success && (
                <Alert severity="success" sx={{ mt: 3, borderRadius: "10px" }} onClose={() => setSuccess(false)}>
                  Your message has been sent — we&apos;ll get back to you soon.
                </Alert>
              )}

              <Box mt={3}>
                <Button
                  type="submit" variant="contained" color="error" size="large"
                  disabled={loading} startIcon={<SendIcon />}
                  sx={{
                    py: 1.6, px: 5, fontWeight: 700, fontSize: "1rem", borderRadius: 3,
                    background: "linear-gradient(135deg, #b71c1c 0%, #d32f2f 100%)",
                    boxShadow: "0 6px 20px rgba(183,28,28,0.4)",
                    "&:hover": { boxShadow: "0 8px 28px rgba(183,28,28,0.55)", transform: "translateY(-1px)" },
                    "&.Mui-disabled": { background: isDark ? "#2a2a2a" : "#e0e0e0" },
                    transition: "all 0.25s ease",
                  }}
                >
                  {loading ? "Sending…" : "Send Message"}
                </Button>
              </Box>
            </Box>
          </Paper>

          {/* ── Right: Find Us ───────────────────────────────────────────── */}
          <Paper elevation={0} sx={{ ...cardSx(isDark), p: { xs: 3.5, md: 4 } }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 1 }}>
              <Box sx={iconBoxSx}><RoomIcon sx={{ fontSize: 20 }} /></Box>
              <Box>
                <Typography variant="overline" color="error" fontWeight={700} letterSpacing="0.12em" sx={{ lineHeight: 1 }}>
                  Our Location
                </Typography>
                <Typography variant="h5" fontWeight={800} sx={{ lineHeight: 1.2 }}>
                  Find Us
                </Typography>
              </Box>
            </Box>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3, mt: 1.5, lineHeight: 1.7 }}>
              Visit our office or get in touch through the details below.
            </Typography>

            {/* Stylized map preview */}
            <Box
              component={Link} href="/map"
              sx={{
                position: "relative", display: "block", height: 200, borderRadius: 3, overflow: "hidden",
                mb: 3, textDecoration: "none",
                backgroundColor: isDark ? "#20291f" : "#e7efe3",
                backgroundImage: isDark
                  ? "linear-gradient(0deg, rgba(255,255,255,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.05) 1px, transparent 1px)"
                  : "linear-gradient(0deg, rgba(0,0,0,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(0,0,0,0.05) 1px, transparent 1px)",
                backgroundSize: "28px 28px",
                border: `1px solid ${isDark ? "#2a2a2a" : "#dbe6d6"}`,
              }}
            >
              {/* decorative "roads" */}
              <Box sx={{ position: "absolute", left: 0, right: 0, top: "38%", height: 10, backgroundColor: isDark ? "#333" : "#fff", boxShadow: "0 0 0 1px rgba(0,0,0,0.04)" }} />
              <Box sx={{ position: "absolute", top: 0, bottom: 0, left: "62%", width: 8, backgroundColor: isDark ? "#333" : "#fff", boxShadow: "0 0 0 1px rgba(0,0,0,0.04)" }} />

              {/* marker card */}
              <Box sx={{
                position: "absolute", top: 22, left: 22, zIndex: 2,
                display: "flex", alignItems: "center", gap: 1, px: 1.5, py: 1, borderRadius: 2.5,
                backgroundColor: isDark ? "#1a1a1a" : "#fff",
                boxShadow: "0 6px 18px rgba(0,0,0,0.18)",
              }}>
                <LocationOnIcon color="error" sx={{ fontSize: 22 }} />
                <Box>
                  <Typography sx={{ fontSize: "0.8rem", fontWeight: 700, lineHeight: 1.2 }}>Blood Donated</Typography>
                  <Typography variant="caption" color="text.secondary">Phnom Penh, Cambodia</Typography>
                </Box>
              </Box>

              <Typography sx={{
                position: "absolute", bottom: 18, left: 22, fontWeight: 800, fontSize: "1.15rem",
                color: isDark ? "rgba(255,255,255,0.5)" : "rgba(30,30,30,0.35)",
              }}>
                Phnom Penh
              </Typography>

              {/* zoom controls */}
              <Box sx={{ position: "absolute", right: 12, bottom: 12, display: "flex", flexDirection: "column", borderRadius: 1.5, overflow: "hidden", boxShadow: "0 4px 12px rgba(0,0,0,0.15)" }}>
                {[AddIcon, RemoveIcon].map((Icon, i) => (
                  <Box key={i} sx={{
                    width: 30, height: 30, display: "flex", alignItems: "center", justifyContent: "center",
                    backgroundColor: isDark ? "#1a1a1a" : "#fff",
                    borderBottom: i === 0 ? `1px solid ${isDark ? "#2a2a2a" : "#eee"}` : "none",
                  }}>
                    <Icon sx={{ fontSize: 16, color: "text.secondary" }} />
                  </Box>
                ))}
              </Box>
            </Box>

            <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", rowGap: 2.5, columnGap: 2 }}>
              {findUsDetails.map((d) => (
                <Box key={d.label} sx={{ display: "flex", alignItems: "flex-start", gap: 1.2 }}>
                  <Box sx={{ color: "error.main", mt: 0.2 }}>{d.icon}</Box>
                  <Box sx={{ minWidth: 0 }}>
                    <Typography variant="caption" color="text.disabled" fontWeight={700}
                      sx={{ textTransform: "uppercase", letterSpacing: "0.06em", display: "block" }}>
                      {d.label}
                    </Typography>
                    {d.href ? (
                      <Typography component="a" href={d.href} variant="body2" fontWeight={600}
                        sx={{ color: "text.primary", textDecoration: "none", "&:hover": { color: "error.main" } }}>
                        {d.value}
                      </Typography>
                    ) : (
                      <Typography variant="body2" fontWeight={600}>{d.value}</Typography>
                    )}
                  </Box>
                </Box>
              ))}
            </Box>
          </Paper>
        </Box>
      </Container>

    </Box>
  );
};

export default Contact;
