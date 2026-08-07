'use client';
import { useRouter } from 'next/navigation';
import React, { useState } from "react";
import {
  Box, Container, Typography, TextField, Button, Paper,
  FormControl, InputLabel, Select, MenuItem, useTheme, Alert,
} from "@mui/material";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import LocationOnIcon from "@mui/icons-material/LocationOn";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import axios from "axios";
import API_BASE from "@/lib/config";

const bloodTypes = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];

const locations = [
  "Calmette Hospital",
  "Royal Phnom Penh Hospital",
  "Khmer Soviet Friendship Hospital",
  "National Blood Transfusion Center",
  "Angkor Hospital for Children",
  "Battambang Provincial Hospital",
];

const TIME_SLOTS = {
  Morning: ["08:00 AM", "09:00 AM", "10:00 AM", "11:00 AM"],
  Afternoon: ["01:00 PM", "02:00 PM", "03:00 PM", "04:00 PM"],
};

const STEPS = [
  { label: "Select Center", icon: <LocationOnIcon sx={{ fontSize: 16 }} /> },
  { label: "Date & Time", icon: <AccessTimeIcon sx={{ fontSize: 16 }} /> },
  { label: "Your Info", icon: <CheckCircleIcon sx={{ fontSize: 16 }} /> },
];

const defaultForm = {
  fullName: "", email: "", phone: "", bloodType: "",
  date: "", time: "", location: "", notes: "",
};

function buildCalendar(year, month) {
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);
  return cells;
}

const DAY_NAMES = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];
const MONTH_NAMES = ["January","February","March","April","May","June","July","August","September","October","November","December"];

const Appointment = () => {
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [form, setForm] = useState(defaultForm);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const now = new Date();
  const [calYear, setCalYear] = useState(now.getFullYear());
  const [calMonth, setCalMonth] = useState(now.getMonth());

  const today = now.getDate();
  const todayYear = now.getFullYear();
  const todayMonth = now.getMonth();

  const selectedDate = form.date ? new Date(form.date) : null;
  const selectedDay = selectedDate
    ? (selectedDate.getMonth() === calMonth && selectedDate.getFullYear() === calYear ? selectedDate.getDate() : null)
    : null;

  const cells = buildCalendar(calYear, calMonth);

  const isPast = (day) => {
    if (calYear < todayYear) return true;
    if (calYear === todayYear && calMonth < todayMonth) return true;
    if (calYear === todayYear && calMonth === todayMonth && day < today) return true;
    return false;
  };

  const handleDayClick = (day) => {
    if (!day || isPast(day)) return;
    const d = new Date(calYear, calMonth, day);
    const iso = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
    setForm(f => ({ ...f, date: iso }));
    setError("");
  };

  const validate = () => {
    if (step === 0 && !form.location) return "Please select a donation center.";
    if (step === 1) {
      if (!form.date) return "Please select a date.";
      if (!form.time) return "Please select a time slot.";
    }
    if (step === 2) {
      if (!form.fullName.trim()) return "Full name is required.";
      if (!form.email.trim() || !/\S+@\S+\.\S+/.test(form.email)) return "Valid email is required.";
      if (!form.phone.trim()) return "Phone number is required.";
      if (!form.bloodType) return "Please select your blood type.";
    }
    return "";
  };

  const handleNext = () => {
    const err = validate();
    if (err) { setError(err); return; }
    setError("");
    setStep(s => s + 1);
  };

  const handleBack = () => { setError(""); setStep(s => s - 1); };

  const handleSubmit = async () => {
    const err = validate();
    if (err) { setError(err); return; }
    setLoading(true);
    setError("");
    try {
      await axios.post(`${API_BASE}/api/appointments`, form);
      router.push("/appointments/confirmed");
    } catch (err) {
      setError(err.response?.data?.error || "Submission failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const bg = isDark ? "#0a0a0a" : "#f8f8f8";
  const cardBg = isDark ? "#111111" : "#ffffff";
  const border = isDark ? "#1f1f1f" : "#e5e5e5";

  return (
    <Box sx={{ backgroundColor: bg, minHeight: "100vh", pt: { xs: 10, md: 12 }, pb: 10 }}>
      <Container maxWidth="md">

        {/* Page header */}
        <Box textAlign="center" mb={5}>
          <Typography sx={{
            fontSize: { xs: "1.8rem", md: "2.4rem" }, fontWeight: 800,
            letterSpacing: "-0.025em", color: isDark ? "#f5f5f5" : "#111111",
          }}>
            Book an Appointment
          </Typography>
          <Typography color="text.secondary" mt={1} fontSize="1rem">
            Schedule your blood donation in three simple steps.
          </Typography>
        </Box>

        {/* Step indicator */}
        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", mb: 5 }}>
          {STEPS.map((s, i) => {
            const done = i < step;
            const active = i === step;
            return (
              <React.Fragment key={s.label}>
                <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 0.8 }}>
                  <Box sx={{
                    width: 38, height: 38, borderRadius: "50%",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    bgcolor: done ? "#dc2626" : active ? "#dc2626" : isDark ? "#1f1f1f" : "#ebebeb",
                    color: done || active ? "white" : isDark ? "#555555" : "#aaaaaa",
                    boxShadow: active ? "0 4px 16px rgba(220,38,38,0.4)" : "none",
                    transition: "all 0.22s ease",
                  }}>
                    {done ? <CheckCircleIcon sx={{ fontSize: 18 }} /> : s.icon}
                  </Box>
                  <Typography variant="caption" fontWeight={active ? 700 : 500}
                    sx={{ color: active ? "#dc2626" : "text.secondary", fontSize: "0.7rem", whiteSpace: "nowrap" }}>
                    {s.label}
                  </Typography>
                </Box>
                {i < STEPS.length - 1 && (
                  <Box sx={{
                    height: 2, width: { xs: 50, sm: 90 }, mx: 1.5, mb: 2.8, flexShrink: 0,
                    bgcolor: i < step ? "#dc2626" : isDark ? "#1f1f1f" : "#e5e5e5",
                    borderRadius: "100px", transition: "all 0.22s ease",
                  }} />
                )}
              </React.Fragment>
            );
          })}
        </Box>

        <Paper elevation={0} sx={{ borderRadius: "20px", border: `1px solid ${border}`, bgcolor: cardBg, p: { xs: 3, md: 4.5 } }}>
          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3.5 }}>
            <Typography fontWeight={800} fontSize="1.15rem" letterSpacing="-0.02em" sx={{ color: isDark ? "#f5f5f5" : "#111111" }}>
              {STEPS[step].label}
            </Typography>
            <Box sx={{
              px: 1.5, py: 0.4, borderRadius: "100px",
              bgcolor: isDark ? "rgba(220,38,38,0.10)" : "#fff0f0",
              border: `1px solid ${isDark ? "rgba(220,38,38,0.2)" : "rgba(220,38,38,0.15)"}`,
            }}>
              <Typography variant="caption" fontWeight={700} sx={{ color: "#dc2626", fontSize: "0.72rem" }}>
                Step {step + 1} / {STEPS.length}
              </Typography>
            </Box>
          </Box>

          {error && <Alert severity="error" sx={{ mb: 3, borderRadius: "10px" }}>{error}</Alert>}

          {/* Step 0: Select Center */}
          {step === 0 && (
            <Box>
              <Typography variant="body2" color="text.secondary" mb={2.5} lineHeight={1.7}>
                Choose a donation center that is most convenient for you.
              </Typography>
              <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
                {locations.map((loc) => {
                  const selected = form.location === loc;
                  return (
                    <Box key={loc} onClick={() => { setForm(f => ({ ...f, location: loc })); setError(""); }}
                      sx={{
                        p: 2, borderRadius: "12px", cursor: "pointer",
                        display: "flex", alignItems: "center", gap: 1.5,
                        border: `1.5px solid ${selected ? "#dc2626" : border}`,
                        bgcolor: selected ? (isDark ? "rgba(220,38,38,0.10)" : "#fff0f0") : "transparent",
                        transition: "all 0.18s ease",
                        "&:hover": { borderColor: "#dc2626", bgcolor: isDark ? "rgba(220,38,38,0.07)" : "rgba(220,38,38,0.04)" },
                      }}>
                      <Box sx={{
                        width: 36, height: 36, borderRadius: "10px", flexShrink: 0,
                        bgcolor: selected ? "#dc2626" : isDark ? "#1a1a1a" : "#f5f5f5",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        boxShadow: selected ? "0 2px 8px rgba(220,38,38,0.35)" : "none",
                        transition: "all 0.18s ease",
                      }}>
                        <LocationOnIcon sx={{ fontSize: 18, color: selected ? "white" : "#aaaaaa" }} />
                      </Box>
                      <Typography variant="body2" fontWeight={selected ? 700 : 500}
                        sx={{ color: selected ? "#dc2626" : isDark ? "#f5f5f5" : "#333333", flex: 1 }}>
                        {loc}
                      </Typography>
                      {selected && <CheckCircleIcon sx={{ color: "#dc2626", fontSize: 18, flexShrink: 0 }} />}
                    </Box>
                  );
                })}
              </Box>
            </Box>
          )}

          {/* Step 1: Date & Time */}
          {step === 1 && (
            <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" }, gap: 4 }}>
              {/* Calendar */}
              <Box>
                <Typography variant="subtitle2" fontWeight={700} mb={1.5} sx={{ color: isDark ? "#f5f5f5" : "#111111" }}>
                  Select Date
                </Typography>
                <Box sx={{ border: `1px solid ${border}`, borderRadius: "14px", p: 2, bgcolor: isDark ? "#0f0f0f" : "#fafafa" }}>
                  <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
                    <Button size="small" onClick={() => {
                      if (calMonth === 0) { setCalMonth(11); setCalYear(y => y - 1); }
                      else setCalMonth(m => m - 1);
                    }} sx={{ minWidth: 28, color: "text.secondary", p: 0.5, borderRadius: "8px" }}>‹</Button>
                    <Typography variant="subtitle2" fontWeight={700} sx={{ color: isDark ? "#f5f5f5" : "#111111" }}>
                      {MONTH_NAMES[calMonth]} {calYear}
                    </Typography>
                    <Button size="small" onClick={() => {
                      if (calMonth === 11) { setCalMonth(0); setCalYear(y => y + 1); }
                      else setCalMonth(m => m + 1);
                    }} sx={{ minWidth: 28, color: "text.secondary", p: 0.5, borderRadius: "8px" }}>›</Button>
                  </Box>
                  <Box sx={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", mb: 0.5 }}>
                    {DAY_NAMES.map(d => (
                      <Typography key={d} variant="caption" textAlign="center" fontWeight={600}
                        sx={{ color: "text.secondary", fontSize: "0.65rem", py: 0.5 }}>{d}</Typography>
                    ))}
                  </Box>
                  <Box sx={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 0.3 }}>
                    {cells.map((day, i) => {
                      const past = day && isPast(day);
                      const sel = day && selectedDay === day;
                      return (
                        <Box key={i} onClick={() => handleDayClick(day)}
                          sx={{
                            height: 32, display: "flex", alignItems: "center", justifyContent: "center",
                            borderRadius: "8px", fontSize: "0.78rem", fontWeight: sel ? 700 : 400,
                            cursor: day && !past ? "pointer" : "default",
                            bgcolor: sel ? "#dc2626" : "transparent",
                            color: !day ? "transparent" : past ? "#cccccc" : sel ? "white" : isDark ? "rgba(245,245,245,0.8)" : "#333333",
                            "&:hover": day && !past && !sel ? { bgcolor: "rgba(220,38,38,0.10)" } : {},
                            transition: "all 0.14s ease",
                            boxShadow: sel ? "0 2px 8px rgba(220,38,38,0.4)" : "none",
                          }}>
                          {day || ""}
                        </Box>
                      );
                    })}
                  </Box>
                </Box>
              </Box>

              {/* Time slots */}
              <Box>
                <Typography variant="subtitle2" fontWeight={700} mb={1.5} sx={{ color: isDark ? "#f5f5f5" : "#111111" }}>
                  Select Time
                </Typography>
                {Object.entries(TIME_SLOTS).map(([period, slots]) => (
                  <Box key={period} mb={2.5}>
                    <Typography variant="caption" fontWeight={700} color="text.secondary" mb={1.2} display="block"
                      sx={{ textTransform: "uppercase", letterSpacing: "0.06em", fontSize: "0.65rem" }}>
                      {period}
                    </Typography>
                    <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 1 }}>
                      {slots.map(slot => {
                        const sel = form.time === slot;
                        return (
                          <Box key={slot} onClick={() => { setForm(f => ({ ...f, time: slot })); setError(""); }}
                            sx={{
                              py: 1, px: 1.5, borderRadius: "10px", textAlign: "center", cursor: "pointer",
                              fontSize: "0.8rem", fontWeight: sel ? 700 : 500,
                              border: `1.5px solid ${sel ? "#dc2626" : border}`,
                              bgcolor: sel ? "#dc2626" : "transparent",
                              color: sel ? "white" : isDark ? "rgba(245,245,245,0.8)" : "#333333",
                              boxShadow: sel ? "0 2px 8px rgba(220,38,38,0.35)" : "none",
                              "&:hover": !sel ? { borderColor: "#dc2626", bgcolor: "rgba(220,38,38,0.06)" } : {},
                              transition: "all 0.16s ease",
                            }}>
                            {slot}
                          </Box>
                        );
                      })}
                    </Box>
                  </Box>
                ))}
              </Box>
            </Box>
          )}

          {/* Step 2: Personal info */}
          {step === 2 && (
            <Box>
              <TextField fullWidth label="Full Name" value={form.fullName}
                onChange={e => { setForm(f => ({ ...f, fullName: e.target.value })); setError(""); }}
                required sx={{ mb: 2, "& .MuiOutlinedInput-root": { borderRadius: "10px" } }} />
              <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" }, gap: 2, mb: 2 }}>
                <TextField fullWidth label="Email" type="email" value={form.email}
                  onChange={e => { setForm(f => ({ ...f, email: e.target.value })); setError(""); }}
                  required sx={{ "& .MuiOutlinedInput-root": { borderRadius: "10px" } }} />
                <TextField fullWidth label="Phone" value={form.phone}
                  onChange={e => { setForm(f => ({ ...f, phone: e.target.value })); setError(""); }}
                  required sx={{ "& .MuiOutlinedInput-root": { borderRadius: "10px" } }} />
              </Box>
              <FormControl fullWidth required sx={{ mb: 2 }}>
                <InputLabel>Blood Type</InputLabel>
                <Select value={form.bloodType} label="Blood Type"
                  onChange={e => setForm(f => ({ ...f, bloodType: e.target.value }))}
                  sx={{ borderRadius: "10px" }}>
                  {bloodTypes.map(bt => <MenuItem key={bt} value={bt}>{bt}</MenuItem>)}
                </Select>
              </FormControl>
              <TextField fullWidth label="Additional Notes (optional)" multiline rows={3} value={form.notes}
                onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                sx={{ mb: 3, "& .MuiOutlinedInput-root": { borderRadius: "10px" } }} />

              {/* Booking summary */}
              <Box sx={{
                p: 2.5, borderRadius: "12px",
                bgcolor: isDark ? "#0f0f0f" : "#f8f8f8",
                border: `1px solid ${border}`,
              }}>
                <Typography variant="caption" fontWeight={700} color="text.secondary" mb={1.5} display="block"
                  sx={{ textTransform: "uppercase", letterSpacing: "0.08em", fontSize: "0.65rem" }}>
                  Booking Summary
                </Typography>
                {[
                  ["Center", form.location],
                  ["Date", form.date],
                  ["Time", form.time],
                ].map(([label, val]) => (
                  <Box key={label} sx={{ display: "flex", justifyContent: "space-between", py: 0.7 }}>
                    <Typography variant="caption" color="text.secondary">{label}</Typography>
                    <Typography variant="caption" fontWeight={700} sx={{ color: isDark ? "#f5f5f5" : "#111111" }}>{val}</Typography>
                  </Box>
                ))}
              </Box>
            </Box>
          )}

          {/* Nav buttons */}
          <Box sx={{ display: "flex", justifyContent: "space-between", mt: 4, gap: 2 }}>
            <Button onClick={handleBack} disabled={step === 0} variant="outlined"
              sx={{
                borderRadius: "100px", px: 3.5, textTransform: "none", fontWeight: 600,
                borderColor: border, color: "text.secondary",
                "&:hover": { borderColor: "#dc2626", color: "#dc2626" },
              }}>
              Previous
            </Button>
            {step < STEPS.length - 1 ? (
              <Button onClick={handleNext} variant="contained"
                sx={{
                  bgcolor: "#dc2626", borderRadius: "100px", px: 4, textTransform: "none", fontWeight: 700,
                  boxShadow: "0 4px 16px rgba(220,38,38,0.4)",
                  "&:hover": { bgcolor: "#b91c1c", boxShadow: "0 6px 24px rgba(220,38,38,0.5)", transform: "translateY(-1px)" },
                  transition: "all 0.2s ease",
                }}>
                Next
              </Button>
            ) : (
              <Button onClick={handleSubmit} variant="contained" disabled={loading}
                sx={{
                  bgcolor: "#dc2626", borderRadius: "100px", px: 4, textTransform: "none", fontWeight: 700,
                  boxShadow: "0 4px 16px rgba(220,38,38,0.4)",
                  "&:hover": { bgcolor: "#b91c1c", boxShadow: "0 6px 24px rgba(220,38,38,0.5)", transform: "translateY(-1px)" },
                  transition: "all 0.2s ease",
                }}>
                {loading ? "Booking…" : "Confirm Booking"}
              </Button>
            )}
          </Box>
        </Paper>
      </Container>
    </Box>
  );
};

export default Appointment;
