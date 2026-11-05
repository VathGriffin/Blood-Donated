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
import { CONTACT } from '@/lib/contact';

const HERO_IMG =
  "https://images.unsplash.com/photo-1586773860418-d37222d8fce3?auto=format&fit=crop&w=1920&q=80";

const CONTACT_EMAIL = CONTACT.email;
const CONTACT_PHONE_DISPLAY = CONTACT.phoneDisplay;
const CONTACT_PHONE_HREF = CONTACT.phoneHref;
const CONTACT_ADDRESS = CONTACT.address;

const heroFeatures = [
  { icon: <ChatBubbleOutlineIcon />, title: "Quick Response", subtitle: "We usually reply within 24 hours" },
  { icon: <ShieldIcon />, title: "Trusted Support", subtitle: "Your privacy is our priority" },
  { icon: <FavoriteIcon />, title: "Stronger Together", subtitle: "Building a healthier Cambodia" },
];

const topInfoCards = [
  { icon: <EmailIcon />, title: "Email Us", value: CONTACT_EMAIL, caption: "We'll get back to you soon", href: `mailto:${CONTACT_EMAIL}` },
  { icon: <PhoneIcon />, title: "Call Us", value: CONTACT_PHONE_DISPLAY, caption: CONTACT.hours, href: CONTACT_PHONE_HREF },
  { icon: <LocationOnIcon />, title: "Visit Us", value: "Phnom Penh, Cambodia", caption: "Our main office" },
  { icon: <GroupsIcon />, title: "General Inquiries", value: "We're happy to help", caption: "Any questions or suggestions" },
];

const findUsDetails = [
  { icon: <LocationOnIcon sx={{ fontSize: 18 }} />, label: "Address", value: CONTACT_ADDRESS },
  { icon: <PhoneIcon sx={{ fontSize: 18 }} />, label: "Phone", value: CONTACT_PHONE_DISPLAY, href: CONTACT_PHONE_HREF },
  { icon: <EmailIcon sx={{ fontSize: 18 }} />, label: "Email", value: CONTACT_EMAIL, href: `mailto:${CONTACT_EMAIL}` },
  { icon: <AccessTimeIcon sx={{ fontSize: 18 }} />, label: "Working Hours", value: CONTACT.hours },
];

const subjectOptions = [
  "General Inquiry", "Donation Question", "Hospital Partnership", "Technical Support", "Feedback / Suggestion", "Other",
];

const cardSx = (isDark) => ({
  borderRadius: "16px",
  backgroundColor: isDark ? "#1C2E49" : "#fff",
  border: `1px solid ${isDark ? "#334155" : "#E2E8F0"}`,
  boxShadow: isDark ? "none" : "0 1px 2px rgba(16,24,40,0.04), 0 6px 20px rgba(16,24,40,0.05)",
});

const iconBoxSx = {
  width: 48, height: 48, borderRadius: "50%", flexShrink: 0,
  background: "linear-gradient(135deg, #E63946 0%, #C91D32 100%)",
  display: "flex", alignItems: "center", justifyContent: "center",
  boxShadow: "0 4px 12px rgba(201,29,50,0.35)",
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
    <Box sx={{ backgroundColor: "background.default" }}>

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
            ? "linear-gradient(100deg, rgba(11,18,32,0.96) 0%, rgba(11,18,32,0.9) 52%, rgba(16,37,65,0.55) 68%, rgba(16,37,65,0.35) 100%)"
            : "linear-gradient(100deg, rgba(255,255,255,0.97) 0%, rgba(255,255,255,0.92) 52%, rgba(16,37,65,0.55) 70%, rgba(16,37,65,0.4) 100%)",
        },
      }}>
        <Container maxWidth="lg" sx={{ position: "relative", pt: { xs: 7, md: 9 }, pb: { xs: 11, md: 15 } }}>
          <Box sx={{ maxWidth: 640 }}>
            <Chip
              icon={<ChatIcon sx={{ color: "#A91529 !important", fontSize: "18px !important" }} />}
              label="We're Here to Help"
              sx={{
                backgroundColor: isDark ? "rgba(201,29,50,0.18)" : "#FFF1F2",
                color: "primary.main", fontWeight: 700, mb: 3, fontSize: "0.82rem",
              }}
            />
            <Typography sx={{
              fontWeight: 800, lineHeight: 1.1, mb: 1.5,
              fontSize: { xs: "2.4rem", md: "3.2rem" },
              color: isDark ? "#fff" : "#172B4D",
            }}>
              Contact <Box component="span" sx={{ color: "primary.main" }}>Us</Box>
            </Typography>
            <Typography sx={{
              fontWeight: 700, mb: 2, fontSize: { xs: "1.15rem", md: "1.3rem" },
              color: isDark ? "#fff" : "#172B4D",
            }}>
              Have a question or need help?
            </Typography>
            <Typography sx={{
              fontSize: "1.05rem", lineHeight: 1.7, mb: 5,
              color: isDark ? "rgba(255,255,255,0.75)" : "#64748B",
            }}>
              Whether you&apos;re a donor, patient, or hospital partner — our team is
              always ready to assist you.
            </Typography>

            <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "repeat(3, auto)" }, gap: { xs: 2.5, sm: 4 } }}>
              {heroFeatures.map((f) => (
                <Box key={f.title} sx={{ display: "flex", alignItems: "flex-start", gap: 1.5 }}>
                  <Box sx={{ color: "primary.main", mt: 0.2, "& svg": { fontSize: 24 } }}>{f.icon}</Box>
                  <Box>
                    <Typography fontWeight={700} sx={{
                      fontSize: "0.95rem", lineHeight: 1.3, color: isDark ? "#fff" : "#172B4D",
                    }}>
                      {f.title}
                    </Typography>
                    <Typography variant="caption" sx={{
                      lineHeight: 1.3, display: "block",
                      color: isDark ? "rgba(255,255,255,0.65)" : "#64748B",
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
        {/* minmax(0, 1fr): columns may shrink below their no-wrap text, so the strip never forces sideways scroll. */}
        <Box sx={{ display: "grid", gridTemplateColumns: { xs: "minmax(0, 1fr)", sm: "repeat(2, minmax(0, 1fr))", lg: "repeat(4, minmax(0, 1fr))" }, gap: 2.5 }}>
          {topInfoCards.map((card) => (
            <Paper key={card.title} elevation={0} sx={{ ...cardSx(isDark), p: 3, display: "flex", alignItems: "center", gap: 2, minWidth: 0 }}>
              <Box sx={{
                width: 48, height: 48, borderRadius: "50%", flexShrink: 0,
                backgroundColor: isDark ? "rgba(201,29,50,0.16)" : "#FFF1F2",
                color: "primary.main", display: "flex", alignItems: "center", justifyContent: "center",
                "& svg": { fontSize: 22 },
              }}>
                {card.icon}
              </Box>
              <Box sx={{ minWidth: 0 }}>
                <Typography fontWeight={700} sx={{ fontSize: "0.95rem" }}>{card.title}</Typography>
                {card.href ? (
                  <Typography component="a" href={card.href} variant="body2" fontWeight={600}
                    sx={{ color: "text.primary", textDecoration: "none", display: "block", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", "&:hover": { color: "primary.main" } }}>
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
                <Typography variant="overline" color="primary" fontWeight={700} letterSpacing="0.12em" sx={{ lineHeight: 1 }}>
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
              <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" }, gap: { xs: 2, sm: 2.5 } }}>
                <TextField
                  fullWidth label="Full Name" name="fullName" value={form.fullName}
                  onChange={handleChange} required placeholder="Enter your full name"
                  sx={{ "& .MuiOutlinedInput-root": { borderRadius: "10px" } }}
                />
                <TextField
                  fullWidth label="Email Address" name="email" type="email" value={form.email}
                  onChange={handleChange} required placeholder="Enter your email"
                  sx={{ "& .MuiOutlinedInput-root": { borderRadius: "10px" } }}
                />
                <FormControl fullWidth required>
                  <InputLabel id="contact-subject-label">Subject</InputLabel>
                  <Select
                    labelId="contact-subject-label" name="subject" value={form.subject}
                    onChange={handleChange} label="Subject"
                    sx={{ borderRadius: "10px" }}
                  >
                    {subjectOptions.map((s) => (
                      <MenuItem key={s} value={s}>{s}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
                <TextField
                  fullWidth label="Phone Number" name="phone" type="tel" value={form.phone}
                  onChange={handleChange} placeholder="Enter your phone number"
                  sx={{ "& .MuiOutlinedInput-root": { borderRadius: "10px" } }}
                />
                <TextField
                  fullWidth label="Message" name="message" value={form.message}
                  onChange={handleChange} required multiline minRows={6}
                  placeholder="Type your message here..."
                  sx={{ gridColumn: "1 / -1", "& .MuiOutlinedInput-root": { borderRadius: "10px" } }}
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
                  type="submit" variant="contained" color="primary" size="large"
                  disabled={loading} startIcon={<SendIcon />}
                  sx={{
                    py: 1.5, px: 5, fontWeight: 700, fontSize: "1rem", borderRadius: "10px",
                    width: { xs: "100%", sm: "auto" },
                    background: "linear-gradient(135deg, #E63946 0%, #C91D32 100%)",
                    boxShadow: "0 6px 16px rgba(201,29,50,0.3)",
                    "&:hover": { background: "linear-gradient(135deg, #C91D32 0%, #A91529 100%)", boxShadow: "0 8px 22px rgba(201,29,50,0.4)", transform: "translateY(-1px)" },
                    "&.Mui-disabled": { background: isDark ? "#334155" : "#E2E8F0" },
                    transition: "background 0.2s ease, box-shadow 0.2s ease, transform 0.2s ease",
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
                <Typography variant="overline" color="primary" fontWeight={700} letterSpacing="0.12em" sx={{ lineHeight: 1 }}>
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
                backgroundColor: isDark ? "#0F2038" : "#EEF2F7",
                backgroundImage: isDark
                  ? "linear-gradient(0deg, rgba(255,255,255,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.05) 1px, transparent 1px)"
                  : "linear-gradient(0deg, rgba(0,0,0,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(0,0,0,0.05) 1px, transparent 1px)",
                backgroundSize: "28px 28px",
                border: `1px solid ${isDark ? "#334155" : "#E2E8F0"}`,
                transition: "border-color 0.2s ease, box-shadow 0.2s ease",
                "&:hover": { borderColor: "primary.main", boxShadow: "0 0 0 3px rgba(201,29,50,0.08)" },
              }}
            >
              {/* decorative "roads" */}
              <Box sx={{ position: "absolute", left: 0, right: 0, top: "38%", height: 10, backgroundColor: isDark ? "#334155" : "#fff", boxShadow: "0 0 0 1px rgba(0,0,0,0.04)" }} />
              <Box sx={{ position: "absolute", top: 0, bottom: 0, left: "62%", width: 8, backgroundColor: isDark ? "#334155" : "#fff", boxShadow: "0 0 0 1px rgba(0,0,0,0.04)" }} />

              {/* marker card */}
              <Box sx={{
                position: "absolute", top: 22, left: 22, zIndex: 2,
                display: "flex", alignItems: "center", gap: 1, px: 1.5, py: 1, borderRadius: 2.5,
                backgroundColor: isDark ? "#1C2E49" : "#fff",
                boxShadow: "0 6px 18px rgba(16,24,40,0.16)",
              }}>
                <LocationOnIcon color="primary" sx={{ fontSize: 22 }} />
                <Box>
                  <Typography sx={{ fontSize: "0.8rem", fontWeight: 700, lineHeight: 1.2, color: "text.primary" }}>Blood Donated</Typography>
                  <Typography variant="caption" color="text.secondary">Phnom Penh, Cambodia</Typography>
                </Box>
              </Box>

              <Typography sx={{
                position: "absolute", bottom: 18, left: 22, fontWeight: 800, fontSize: "1.15rem",
                color: isDark ? "rgba(255,255,255,0.5)" : "rgba(16,37,65,0.35)",
              }}>
                Phnom Penh
              </Typography>

              {/* zoom controls */}
              <Box sx={{ position: "absolute", right: 12, bottom: 12, display: "flex", flexDirection: "column", borderRadius: 1.5, overflow: "hidden", boxShadow: "0 4px 12px rgba(0,0,0,0.15)" }}>
                {[AddIcon, RemoveIcon].map((Icon, i) => (
                  <Box key={i} sx={{
                    width: 30, height: 30, display: "flex", alignItems: "center", justifyContent: "center",
                    backgroundColor: isDark ? "#1C2E49" : "#fff",
                    borderBottom: i === 0 ? `1px solid ${isDark ? "#334155" : "#E2E8F0"}` : "none",
                  }}>
                    <Icon sx={{ fontSize: 16, color: "text.secondary" }} />
                  </Box>
                ))}
              </Box>
            </Box>

            <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" }, rowGap: 2.5, columnGap: 2, pt: 2.5, borderTop: "1px solid", borderColor: "divider" }}>
              {findUsDetails.map((d) => (
                <Box key={d.label} sx={{ display: "flex", alignItems: "flex-start", gap: 1.2, minWidth: 0, ...(d.label === "Address" && { gridColumn: "1 / -1" }) }}>
                  <Box sx={{ color: "primary.main", mt: 0.2 }}>{d.icon}</Box>
                  <Box sx={{ minWidth: 0 }}>
                    <Typography variant="caption" color="text.secondary" fontWeight={700}
                      sx={{ textTransform: "uppercase", letterSpacing: "0.06em", display: "block" }}>
                      {d.label}
                    </Typography>
                    {d.href ? (
                      <Typography component="a" href={d.href} variant="body2" fontWeight={600}
                        sx={{ color: "text.primary", textDecoration: "none", overflowWrap: "anywhere", "&:hover": { color: "primary.main" } }}>
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
