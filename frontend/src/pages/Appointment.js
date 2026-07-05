import React, { useState } from "react";
import {
  Box,
  Container,
  Typography,
  TextField,
  Button,
  Paper,
  Stepper,
  Step,
  StepLabel,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  useTheme,
  Alert,
} from "@mui/material";
import { useNavigate } from "react-router-dom";
import CalendarMonthIcon from "@mui/icons-material/CalendarMonth";
import axios from "axios";
import API_BASE from "../config";

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
  fullName: "",
  email: "",
  phone: "",
  bloodType: "",
  date: "",
  time: "",
  location: "",
  notes: "",
};

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

  const handleBack = () => {
    setError("");
    setActiveStep((s) => s - 1);
  };

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

  const fieldSx = { mb: 2.5 };

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
        <CalendarMonthIcon sx={{ fontSize: 52, mb: 1.5, opacity: 0.9 }} />
        <Typography variant="h3" fontWeight={800} gutterBottom>
          Book an Appointment
        </Typography>
        <Typography variant="h6" sx={{ opacity: 0.88, maxWidth: 520, mx: "auto", lineHeight: 1.7 }}>
          Schedule your blood donation session at a hospital near you. Takes less than 2 minutes.
        </Typography>
      </Box>

      <Container maxWidth="sm" sx={{ py: 7 }}>
        {/* Stepper */}
        <Stepper activeStep={activeStep} alternativeLabel sx={{ mb: 5 }}>
          {steps.map((label) => (
            <Step key={label}>
              <StepLabel
                StepIconProps={{
                  sx: {
                    "&.Mui-active": { color: "#b71c1c" },
                    "&.Mui-completed": { color: "#b71c1c" },
                  },
                }}
              >
                <Typography variant="caption" fontWeight={600}>{label}</Typography>
              </StepLabel>
            </Step>
          ))}
        </Stepper>

        <Paper elevation={4} sx={{ p: { xs: 3, md: 5 }, borderRadius: 4 }}>
          {error && (
            <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>
              {error}
            </Alert>
          )}

          {/* Step 1: Personal Info */}
          {activeStep === 0 && (
            <Box>
              <Typography variant="h6" fontWeight={700} color="error.main" gutterBottom>
                Your Information
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                Tell us a bit about yourself so we can prepare for your visit.
              </Typography>
              <TextField
                fullWidth
                label="Full Name"
                name="fullName"
                value={form.fullName}
                onChange={handleChange}
                required
                sx={fieldSx}
              />
              <TextField
                fullWidth
                label="Email Address"
                name="email"
                type="email"
                value={form.email}
                onChange={handleChange}
                required
                sx={fieldSx}
              />
              <TextField
                fullWidth
                label="Phone Number"
                name="phone"
                value={form.phone}
                onChange={handleChange}
                required
                sx={fieldSx}
              />
              <FormControl fullWidth required sx={fieldSx}>
                <InputLabel>Blood Type</InputLabel>
                <Select name="bloodType" value={form.bloodType} label="Blood Type" onChange={handleChange}>
                  {bloodTypes.map((bt) => (
                    <MenuItem key={bt} value={bt}>{bt}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>
          )}

          {/* Step 2: Schedule */}
          {activeStep === 1 && (
            <Box>
              <Typography variant="h6" fontWeight={700} color="error.main" gutterBottom>
                Choose Your Schedule
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                Pick a date, time, and location that works best for you.
              </Typography>
              <TextField
                fullWidth
                label="Preferred Date"
                name="date"
                type="date"
                value={form.date}
                onChange={handleChange}
                required
                inputProps={{ min: today }}
                InputLabelProps={{ shrink: true }}
                sx={fieldSx}
              />
              <TextField
                fullWidth
                label="Preferred Time"
                name="time"
                type="time"
                value={form.time}
                onChange={handleChange}
                required
                InputLabelProps={{ shrink: true }}
                sx={fieldSx}
              />
              <FormControl fullWidth required sx={fieldSx}>
                <InputLabel>Donation Center / Hospital</InputLabel>
                <Select name="location" value={form.location} label="Donation Center / Hospital" onChange={handleChange}>
                  {locations.map((loc) => (
                    <MenuItem key={loc} value={loc}>{loc}</MenuItem>
                  ))}
                </Select>
              </FormControl>
              <TextField
                fullWidth
                label="Additional Notes (optional)"
                name="notes"
                multiline
                rows={3}
                value={form.notes}
                onChange={handleChange}
                placeholder="Any health conditions, special requests..."
                sx={fieldSx}
              />
            </Box>
          )}

          {/* Step 3: Confirm */}
          {activeStep === 2 && (
            <Box>
              <Typography variant="h6" fontWeight={700} color="error.main" gutterBottom>
                Confirm Your Appointment
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                Please review your details before submitting.
              </Typography>
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
                <Box
                  key={label}
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    py: 1.2,
                    borderBottom: `1px solid ${isDark ? "#222" : "#f0f0f0"}`,
                  }}
                >
                  <Typography variant="body2" color="text.secondary" fontWeight={600}>
                    {label}
                  </Typography>
                  <Typography variant="body2" fontWeight={500} textAlign="right" maxWidth="60%">
                    {value}
                  </Typography>
                </Box>
              ))}
            </Box>
          )}

          {/* Navigation buttons */}
          <Box sx={{ display: "flex", justifyContent: "space-between", mt: 4, gap: 2 }}>
            <Button
              onClick={handleBack}
              disabled={activeStep === 0}
              variant="outlined"
              color="error"
              sx={{ borderRadius: 2.5, px: 3, fontWeight: 600 }}
            >
              Back
            </Button>
            {activeStep < steps.length - 1 ? (
              <Button
                onClick={handleNext}
                variant="contained"
                color="error"
                sx={{ borderRadius: 2.5, px: 4, fontWeight: 700, boxShadow: "0 4px 14px rgba(183,28,28,0.35)" }}
              >
                Next
              </Button>
            ) : (
              <Button
                onClick={handleSubmit}
                variant="contained"
                color="error"
                disabled={loading}
                sx={{ borderRadius: 2.5, px: 4, fontWeight: 700, boxShadow: "0 4px 14px rgba(183,28,28,0.35)" }}
              >
                {loading ? "Booking..." : "Confirm Booking"}
              </Button>
            )}
          </Box>
        </Paper>
      </Container>
    </Box>
  );
};

export default Appointment;
