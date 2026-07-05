import React, { useState } from "react";
import {
  Box, Container, Typography, TextField, Button, Paper,
  Stepper, Step, StepLabel, FormControl, InputLabel,
  Select, MenuItem, useTheme, Alert, Chip, Avatar,
} from "@mui/material";
import { useNavigate } from "react-router-dom";
import CalendarMonthIcon from "@mui/icons-material/CalendarMonth";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import LocationOnIcon from "@mui/icons-material/LocationOn";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import BloodtypeIcon from "@mui/icons-material/Bloodtype";
import axios from "axios";
import API_BASE from "../config";

const HERO_IMG =
  "https://images.unsplash.com/photo-1538108149393-fbbd81895907?auto=format&fit=crop&w=1920&q=80";

const bloodTypes = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];

const locations = [
  "Calmette Hospital, Phnom Penh",
  "Royal Phnom Penh Hospital",
  "Khmer Soviet Friendship Hospital",
  "National Blood Transfusion Center",
  "Angkor Hospital for Children, Siem Reap",
  "Battambang Provincial Hospital",
];

const steps = ["Personal Info", "Schedule", "Confirm"];

const defaultForm = {
  fullName: "", email: "", phone: "", bloodType: "",
  date: "", time: "", location: "", notes: "",
};

const preparationTips = [
  "Eat a healthy meal 2–3 hours before donating",
  "Drink at least 500ml of extra water",
  "Get a full night's sleep beforehand",
  "Avoid alcohol 24 hours before donation",
  "Bring a valid ID to your appointment",
];

const Appointment = () => {
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";
  const navigate = useNavigate();
  const [activeStep, setActiveStep] = useState(0);
  const [form, setForm] = useState(defaultForm);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const today = new Date().toISOString().split("T")[0];

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setError("");
  };

  const validateStep = () => {
    if (activeStep === 0) {
      if (!form.fullName.trim()) return "Full name is required.";
      if (!form.email.trim() || !/\S+@\S+\.\S+/.test(form.email)) return "Valid email is required.";
      if (!form.phone.trim()) return "Phone number is required.";
      if (!form.bloodType) return "Please select your blood type.";
    }
    if (activeStep === 1) {
      if (!form.date) return "Please select a date.";
      if (!form.time) return "Please select a time.";
      if (!form.location) return "Please select a location.";
    }
    return "";
  };

  const handleNext = () => {
    const err = validateStep();
    if (err) { setError(err); return; }
    setActiveStep((s) => s + 1);
  };

  const handleBack = () => { setError(""); setActiveStep((s) => s - 1); };

  const handleSubmit = async () => {
    setLoading(true);
    setError("");
    try {
      await axios.post(`${API_BASE}/api/appointments`, form);
      navigate("/appointment/confirmed");
    } catch (err) {
      setError(err.response?.data?.error || "Submission failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const fieldSx = { mb: 2.5, "& .MuiOutlinedInput-root": { borderRadius: 2.5 } };

  return (
    <Box sx={{ backgroundColor: isDark ? "#121212" : "#f4f4f4" }}>

      {/* ── Hero ────────────────────────────────────────────────────────────── */}
      <Box sx={{
        position: "relative",
        minHeight: { xs: "70vh", md: "78vh" },
        display: "flex", flexDirection: "column",
        alignItems: "center", justifyContent: "center", textAlign: "center",
        backgroundImage: `url('${HERO_IMG}')`,
        backgroundSize: "cover", backgroundPosition: "center 30%",
        backgroundAttachment: { xs: "scroll", md: "fixed" },
        "&::before": {
          content: '""', position: "absolute", inset: 0,
          background: isDark
            ? "linear-gradient(135deg, rgba(10,0,0,0.93) 0%, rgba(70,0,0,0.87) 100%)"
            : "linear-gradient(135deg, rgba(80,0,0,0.90) 0%, rgba(183,28,28,0.84) 100%)",
          zIndex: 1,
        },
      }}>
        <Box sx={{ position: "relative", zIndex: 2, px: 3, pt: { xs: 14, md: 8 }, pb: { xs: 6, md: 4 } }}>
          <Chip
            icon={<CalendarMonthIcon sx={{ color: "white !important", fontSize: "18px !important" }} />}
            label="Book Your Session"
            sx={{ backgroundColor: "rgba(255,255,255,0.15)", color: "white", fontWeight: 700, mb: 3, backdropFilter: "blur(4px)", fontSize: "0.82rem" }}
          />
          <Typography variant="h2" fontWeight={800} color="white"
            sx={{ lineHeight: 1.12, mb: 2, fontSize: { xs: "2.4rem", md: "3.6rem" }, textShadow: "0 2px 24px rgba(0,0,0,0.6)" }}>
            Book an Appointment
          </Typography>
          <Typography variant="h5" sx={{ color: "#ffcdd2", fontWeight: 700, mb: 2.5, fontSize: { xs: "1.1rem", md: "1.4rem" } }}>
            Schedule your donation in under 2 minutes.
          </Typography>
          <Typography variant="h6" sx={{
            color: "rgba(255,255,255,0.82)", maxWidth: 520, mx: "auto",
            lineHeight: 1.8, fontWeight: 400, fontSize: { xs: "1rem", md: "1.1rem" },
          }}>
            Choose a hospital near you, pick a time that works, and our team
            will take care of the rest.
          </Typography>

          {/* Info chips */}
          <Box sx={{ display: "flex", gap: 2, justifyContent: "center", flexWrap: "wrap", mt: 5 }}>
            {[
              { icon: "🏥", label: "6 Partner Hospitals" },
              { icon: "⏱", label: "Takes ~30 Minutes" },
              { icon: "✅", label: "Free Health Screening" },
            ].map((item, i) => (
              <Chip key={i} label={`${item.icon} ${item.label}`}
                sx={{
                  backgroundColor: "rgba(255,255,255,0.13)", color: "white", fontWeight: 600,
                  backdropFilter: "blur(6px)", border: "1px solid rgba(255,255,255,0.2)", fontSize: "0.82rem",
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
          gap: 4, alignItems: "start",
        }}>

          {/* ── Left Sidebar ──────────────────────────────────────────────── */}
          <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>

            {/* Preparation tips */}
            <Paper elevation={0} sx={{
              p: 3.5, borderRadius: 4,
              backgroundColor: isDark ? "#1a1a1a" : "#fff",
              border: `1px solid ${isDark ? "#2a2a2a" : "#efefef"}`,
              boxShadow: isDark ? "none" : "0 4px 24px rgba(0,0,0,0.06)",
            }}>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 2.5 }}>
                <Box sx={{
                  width: 40, height: 40, borderRadius: 2,
                  background: "linear-gradient(135deg, #b71c1c 0%, #d32f2f 100%)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  boxShadow: "0 4px 12px rgba(183,28,28,0.4)",
                }}>
                  <CheckCircleIcon sx={{ color: "white", fontSize: 20 }} />
                </Box>
                <Typography fontWeight={700}>How to Prepare</Typography>
              </Box>
              <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
                {preparationTips.map((tip, i) => (
                  <Box key={i} sx={{ display: "flex", alignItems: "flex-start", gap: 1.5 }}>
                    <CheckCircleIcon sx={{ color: "#4caf50", fontSize: 18, mt: 0.2, flexShrink: 0 }} />
                    <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.6 }}>{tip}</Typography>
                  </Box>
                ))}
              </Box>
            </Paper>

            {/* Available locations */}
            <Paper elevation={0} sx={{
              p: 3.5, borderRadius: 4,
              backgroundColor: isDark ? "#1a1a1a" : "#fff",
              border: `1px solid ${isDark ? "#2a2a2a" : "#efefef"}`,
              boxShadow: isDark ? "none" : "0 4px 24px rgba(0,0,0,0.06)",
            }}>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 2.5 }}>
                <Box sx={{
                  width: 40, height: 40, borderRadius: 2,
                  background: "linear-gradient(135deg, #1565c0 0%, #1976d2 100%)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  boxShadow: "0 4px 12px rgba(21,101,192,0.4)",
                }}>
                  <LocationOnIcon sx={{ color: "white", fontSize: 20 }} />
                </Box>
                <Typography fontWeight={700}>Partner Hospitals</Typography>
              </Box>
              <Box sx={{ display: "flex", flexDirection: "column", gap: 1.2 }}>
                {locations.map((loc, i) => (
                  <Box key={i} sx={{ display: "flex", alignItems: "flex-start", gap: 1 }}>
                    <Box sx={{ width: 6, height: 6, borderRadius: "50%", backgroundColor: "#b71c1c", flexShrink: 0, mt: 0.7 }} />
                    <Typography variant="caption" color="text.secondary" sx={{ lineHeight: 1.6 }}>{loc}</Typography>
                  </Box>
                ))}
              </Box>
            </Paper>

            {/* Hours card */}
            <Paper elevation={0} sx={{
              p: 3.5, borderRadius: 4,
              background: "linear-gradient(135deg, #b71c1c 0%, #7f0000 100%)",
              color: "white",
              boxShadow: "0 8px 32px rgba(183,28,28,0.35)",
            }}>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 1.5 }}>
                <AccessTimeIcon sx={{ fontSize: 22 }} />
                <Typography variant="subtitle1" fontWeight={800}>Donation Hours</Typography>
              </Box>
              <Typography variant="body2" sx={{ opacity: 0.9, lineHeight: 1.8 }}>
                Monday – Friday<br />
                <strong>8:00 AM – 5:00 PM</strong>
              </Typography>
              <Typography variant="caption" sx={{ opacity: 0.7, display: "block", mt: 1.5 }}>
                Walk-ins welcome. Appointments get priority scheduling.
              </Typography>
            </Paper>
          </Box>

          {/* ── Right: Multi-step Form ─────────────────────────────────────── */}
          <Box>
            {/* Stepper */}
            <Stepper activeStep={activeStep} alternativeLabel sx={{ mb: 4 }}>
              {steps.map((label) => (
                <Step key={label}>
                  <StepLabel StepIconProps={{ sx: { "&.Mui-active": { color: "#b71c1c" }, "&.Mui-completed": { color: "#b71c1c" } } }}>
                    <Typography variant="caption" fontWeight={600}>{label}</Typography>
                  </StepLabel>
                </Step>
              ))}
            </Stepper>

            <Paper elevation={0} sx={{
              p: { xs: 3.5, md: 5 }, borderRadius: 4,
              backgroundColor: isDark ? "#1a1a1a" : "#fff",
              border: `1px solid ${isDark ? "#2a2a2a" : "#efefef"}`,
              boxShadow: isDark ? "none" : "0 4px 24px rgba(0,0,0,0.06)",
            }}>
              {/* Step header */}
              <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 1 }}>
                <Avatar sx={{
                  width: 48, height: 48,
                  background: "linear-gradient(135deg, #b71c1c 0%, #d32f2f 100%)",
                  boxShadow: "0 4px 14px rgba(183,28,28,0.4)",
                }}>
                  {activeStep === 0 ? <BloodtypeIcon /> : activeStep === 1 ? <CalendarMonthIcon /> : <CheckCircleIcon />}
                </Avatar>
                <Box>
                  <Typography variant="overline" color="error" fontWeight={700} letterSpacing="0.12em" sx={{ lineHeight: 1 }}>
                    Step {activeStep + 1} of {steps.length}
                  </Typography>
                  <Typography variant="h5" fontWeight={800} sx={{ lineHeight: 1.2 }}>
                    {activeStep === 0 ? "Your Information" : activeStep === 1 ? "Choose Your Schedule" : "Confirm Appointment"}
                  </Typography>
                </Box>
              </Box>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3.5, mt: 1, lineHeight: 1.7 }}>
                {activeStep === 0 && "Tell us a bit about yourself so we can prepare for your visit."}
                {activeStep === 1 && "Pick a date, time, and location that works best for you."}
                {activeStep === 2 && "Please review your details before confirming your booking."}
              </Typography>

              {error && <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>{error}</Alert>}

              {/* Step 1: Personal Info */}
              {activeStep === 0 && (
                <Box>
                  <TextField fullWidth label="Full Name" name="fullName" value={form.fullName} onChange={handleChange} required sx={fieldSx} />
                  <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" }, gap: 2.5, mb: 2.5 }}>
                    <TextField fullWidth label="Email Address" name="email" type="email" value={form.email} onChange={handleChange} required sx={{ "& .MuiOutlinedInput-root": { borderRadius: 2.5 } }} />
                    <TextField fullWidth label="Phone Number" name="phone" value={form.phone} onChange={handleChange} required sx={{ "& .MuiOutlinedInput-root": { borderRadius: 2.5 } }} />
                  </Box>
                  <FormControl fullWidth required sx={fieldSx}>
                    <InputLabel>Blood Type</InputLabel>
                    <Select name="bloodType" value={form.bloodType} label="Blood Type" onChange={handleChange} sx={{ borderRadius: 2.5 }}>
                      {bloodTypes.map((bt) => (
                        <MenuItem key={bt} value={bt}>
                          <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                            <Box sx={{ width: 26, height: 26, borderRadius: "50%", backgroundColor: "#b71c1c", color: "white", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.72rem", fontWeight: 700 }}>
                              {bt}
                            </Box>
                            Blood Type {bt}
                          </Box>
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Box>
              )}

              {/* Step 2: Schedule */}
              {activeStep === 1 && (
                <Box>
                  <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" }, gap: 2.5, mb: 2.5 }}>
                    <TextField fullWidth label="Preferred Date" name="date" type="date" value={form.date} onChange={handleChange} required inputProps={{ min: today }} InputLabelProps={{ shrink: true }} sx={{ "& .MuiOutlinedInput-root": { borderRadius: 2.5 } }} />
                    <TextField fullWidth label="Preferred Time" name="time" type="time" value={form.time} onChange={handleChange} required InputLabelProps={{ shrink: true }} sx={{ "& .MuiOutlinedInput-root": { borderRadius: 2.5 } }} />
                  </Box>
                  <FormControl fullWidth required sx={fieldSx}>
                    <InputLabel>Donation Center / Hospital</InputLabel>
                    <Select name="location" value={form.location} label="Donation Center / Hospital" onChange={handleChange} sx={{ borderRadius: 2.5 }}>
                      {locations.map((loc) => (
                        <MenuItem key={loc} value={loc}>
                          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                            <LocationOnIcon sx={{ fontSize: 16, color: "#b71c1c" }} />
                            {loc}
                          </Box>
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                  <TextField fullWidth label="Additional Notes (optional)" name="notes" multiline rows={3} value={form.notes} onChange={handleChange} placeholder="Any health conditions, special requests..." sx={fieldSx} />
                </Box>
              )}

              {/* Step 3: Confirm */}
              {activeStep === 2 && (
                <Box>
                  {[
                    { label: "Name", value: form.fullName },
                    { label: "Email", value: form.email },
                    { label: "Phone", value: form.phone },
                    { label: "Blood Type", value: form.bloodType },
                    { label: "Date", value: form.date },
                    { label: "Time", value: form.time },
                    { label: "Location", value: form.location },
                    ...(form.notes ? [{ label: "Notes", value: form.notes }] : []),
                  ].map(({ label, value }) => (
                    <Box key={label} sx={{
                      display: "flex", justifyContent: "space-between", alignItems: "flex-start",
                      py: 1.4, px: 1.5, mb: 1, borderRadius: 2,
                      backgroundColor: isDark ? "#2a2a2a" : "#f8f8f8",
                    }}>
                      <Typography variant="body2" color="text.secondary" fontWeight={600} sx={{ flexShrink: 0, mr: 2 }}>{label}</Typography>
                      <Typography variant="body2" fontWeight={700} textAlign="right">{value}</Typography>
                    </Box>
                  ))}
                </Box>
              )}

              {/* Navigation */}
              <Box sx={{ display: "flex", justifyContent: "space-between", mt: 4, gap: 2 }}>
                <Button onClick={handleBack} disabled={activeStep === 0} variant="outlined" color="error"
                  sx={{ borderRadius: 2.5, px: 3, fontWeight: 600 }}>
                  Back
                </Button>
                {activeStep < steps.length - 1 ? (
                  <Button onClick={handleNext} variant="contained" color="error"
                    sx={{
                      borderRadius: 2.5, px: 4, fontWeight: 700,
                      background: "linear-gradient(135deg, #b71c1c 0%, #d32f2f 100%)",
                      boxShadow: "0 6px 20px rgba(183,28,28,0.4)",
                      "&:hover": { boxShadow: "0 8px 28px rgba(183,28,28,0.55)", transform: "translateY(-1px)" },
                      transition: "all 0.25s",
                    }}>
                    Next →
                  </Button>
                ) : (
                  <Button onClick={handleSubmit} variant="contained" color="error" disabled={loading}
                    sx={{
                      borderRadius: 2.5, px: 4, fontWeight: 700,
                      background: "linear-gradient(135deg, #b71c1c 0%, #d32f2f 100%)",
                      boxShadow: "0 6px 20px rgba(183,28,28,0.4)",
                      "&:hover": { boxShadow: "0 8px 28px rgba(183,28,28,0.55)", transform: "translateY(-1px)" },
                      "&.Mui-disabled": { background: isDark ? "#2a2a2a" : "#e0e0e0" },
                      transition: "all 0.25s",
                    }}>
                    {loading ? "Booking…" : "🩸 Confirm Booking"}
                  </Button>
                )}
              </Box>
            </Paper>
          </Box>
        </Box>
      </Container>

    </Box>
  );
};

export default Appointment;
