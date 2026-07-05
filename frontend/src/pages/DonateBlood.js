import React, { useState, useRef } from "react";
import {
  Container, Box, Typography, TextField, Button, Paper,
  FormControl, InputLabel, Select, MenuItem, Switch,
  FormControlLabel, Chip, useTheme, Stepper, Step, StepLabel,
  Alert, Avatar, IconButton, Tooltip,
} from "@mui/material";
import { useNavigate } from "react-router-dom";
import API_BASE from "../config";
import VolunteerActivismIcon from "@mui/icons-material/VolunteerActivism";
import BloodtypeIcon from "@mui/icons-material/Bloodtype";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import AddAPhotoIcon from "@mui/icons-material/AddAPhoto";
import DeleteIcon from "@mui/icons-material/Delete";
import FavoriteIcon from "@mui/icons-material/Favorite";
import PeopleIcon from "@mui/icons-material/People";
import LocalHospitalIcon from "@mui/icons-material/LocalHospital";
import SecurityIcon from "@mui/icons-material/Security";

const HERO_IMG =
  "https://images.unsplash.com/photo-1615461066841-6116e61058f4?auto=format&fit=crop&w=1920&q=80";

const bloodTypeOptions = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];

const eligibilityChecks = [
  "I am between 18–60 years old",
  "I weigh at least 45 kg",
  "I have not donated blood in the past 3 months",
  "I do not have any active infections or illnesses",
];

const steps = ["Register Online", "Health Screening", "Donate & Save Lives"];

const heroStats = [
  { icon: <PeopleIcon sx={{ fontSize: 26 }} />, value: "2,400+", label: "Active Donors" },
  { icon: <FavoriteIcon sx={{ fontSize: 26 }} />, value: "45K+", label: "Lives Saved" },
  { icon: <LocalHospitalIcon sx={{ fontSize: 26 }} />, value: "50+", label: "Partner Hospitals" },
  { icon: <SecurityIcon sx={{ fontSize: 26 }} />, value: "100%", label: "Safe & Screened" },
];

const DonateBlood = () => {
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";
  const [bloodType, setBloodType] = useState("");
  const [formData, setFormData] = useState({
    fullName: "", email: "", phone: "", location: "", lastDonation: "", available: true,
  });
  const [loading, setLoading] = useState(false);
  const [eligibilityAck, setEligibilityAck] = useState(false);
  const [photoFile, setPhotoFile] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);
  const photoInputRef = useRef(null);
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({ ...prev, [name]: type === "checkbox" ? checked : value }));
  };

  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setPhotoFile(file);
    setPhotoPreview(URL.createObjectURL(file));
  };

  const handleRemovePhoto = () => {
    setPhotoFile(null);
    setPhotoPreview(null);
    if (photoInputRef.current) photoInputRef.current.value = "";
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!bloodType) { alert("Please select a blood type"); return; }
    if (!eligibilityAck) { alert("Please confirm that you meet the donation eligibility criteria."); return; }
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE}/api/donors/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...formData, bloodType }),
      });
      if (!response.ok) {
        const data = await response.json();
        alert("Registration failed: " + (data.message || "Unknown error"));
        return;
      }
      const savedDonor = await response.json();
      if (photoFile && savedDonor._id) {
        const photoPayload = new FormData();
        photoPayload.append("photo", photoFile);
        await fetch(`${API_BASE}/api/donors/${savedDonor._id}/photo`, {
          method: "POST", body: photoPayload,
        });
      }
      navigate("/donate/thank-you");
    } catch (error) {
      console.error("Error submitting form:", error);
      alert("Server error. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ backgroundColor: isDark ? "#121212" : "#f4f4f4" }}>

      {/* ── Hero — Photo Background ────────────────────────────────────────── */}
      <Box sx={{
        position: "relative",
        minHeight: { xs: "74vh", md: "82vh" },
        display: "flex", flexDirection: "column",
        alignItems: "center", justifyContent: "center",
        textAlign: "center",
        backgroundImage: `url('${HERO_IMG}')`,
        backgroundSize: "cover",
        backgroundPosition: "center 30%",
        backgroundAttachment: { xs: "scroll", md: "fixed" },
        "&::before": {
          content: '""',
          position: "absolute", inset: 0,
          background: isDark
            ? "linear-gradient(135deg, rgba(10,0,0,0.93) 0%, rgba(70,0,0,0.87) 100%)"
            : "linear-gradient(135deg, rgba(80,0,0,0.90) 0%, rgba(183,28,28,0.84) 100%)",
          zIndex: 1,
        },
      }}>
        <Box sx={{ position: "relative", zIndex: 2, px: 3, pt: { xs: 14, md: 8 }, pb: { xs: 6, md: 4 } }}>
          <Chip
            icon={<VolunteerActivismIcon sx={{ color: "white !important", fontSize: "18px !important" }} />}
            label="Save a Life Today"
            sx={{ backgroundColor: "rgba(255,255,255,0.15)", color: "white", fontWeight: 700, mb: 3, backdropFilter: "blur(4px)", fontSize: "0.82rem" }}
          />
          <Typography variant="h2" fontWeight={800} color="white"
            sx={{ lineHeight: 1.12, mb: 2, fontSize: { xs: "2.4rem", md: "3.6rem" }, textShadow: "0 2px 24px rgba(0,0,0,0.6)" }}>
            Donate Blood
          </Typography>
          <Typography variant="h5" sx={{ color: "#ffcdd2", fontWeight: 700, mb: 2.5, fontSize: { xs: "1.1rem", md: "1.4rem" } }}>
            Together, we can save lives — one drop at a time.
          </Typography>
          <Typography variant="h6" sx={{ color: "rgba(255,255,255,0.82)", maxWidth: 540, mx: "auto", lineHeight: 1.8, fontWeight: 400, fontSize: { xs: "1rem", md: "1.1rem" } }}>
            Register as a donor and join our life-saving community.
            Your blood could be the difference between life and death for someone in need.
          </Typography>

          {/* Stats row */}
          <Box sx={{
            display: "flex", justifyContent: "center", flexWrap: "wrap", gap: { xs: 2, md: 4 }, mt: 6,
          }}>
            {heroStats.map((stat, i) => (
              <Box key={i} sx={{
                textAlign: "center",
                px: { xs: 2, md: 3 }, py: 1.5,
                backgroundColor: "rgba(255,255,255,0.10)",
                backdropFilter: "blur(8px)",
                border: "1px solid rgba(255,255,255,0.18)",
                borderRadius: 3,
                minWidth: 110,
              }}>
                <Box sx={{ color: "#ffcdd2", mb: 0.5 }}>{stat.icon}</Box>
                <Typography variant="h6" fontWeight={800} color="white">{stat.value}</Typography>
                <Typography variant="caption" sx={{ color: "rgba(255,255,255,0.75)", fontWeight: 600 }}>
                  {stat.label}
                </Typography>
              </Box>
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

            {/* Blood type picker */}
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
                  <BloodtypeIcon sx={{ color: "white", fontSize: 20 }} />
                </Box>
                <Typography fontWeight={700} color="error.main">Blood Types</Typography>
              </Box>
              <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
                {bloodTypeOptions.map((bt) => (
                  <Chip
                    key={bt} label={bt}
                    onClick={() => setBloodType(bt)}
                    variant={bloodType === bt ? "filled" : "outlined"}
                    color={bloodType === bt ? "error" : "default"}
                    sx={{ fontWeight: 700, cursor: "pointer", fontSize: "0.9rem" }}
                  />
                ))}
              </Box>
              {bloodType && (
                <Alert severity="success" sx={{ mt: 2, borderRadius: 2 }}>
                  Selected: <strong>{bloodType}</strong>
                </Alert>
              )}
            </Paper>

            {/* Eligibility checklist */}
            <Paper elevation={0} sx={{
              p: 3.5, borderRadius: 4,
              backgroundColor: isDark ? "#1a1a1a" : "#fff",
              border: `1px solid ${isDark ? "#2a2a2a" : "#efefef"}`,
              boxShadow: isDark ? "none" : "0 4px 24px rgba(0,0,0,0.06)",
            }}>
              <Typography variant="overline" color="error" fontWeight={700} letterSpacing="0.12em">
                Requirements
              </Typography>
              <Typography fontWeight={700} mt={0.5} mb={2.5}>
                Eligibility Criteria
              </Typography>
              <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
                {eligibilityChecks.map((check, i) => (
                  <Box key={i} sx={{ display: "flex", alignItems: "flex-start", gap: 1.5 }}>
                    <CheckCircleIcon sx={{ color: "#4caf50", fontSize: 20, mt: 0.1, flexShrink: 0 }} />
                    <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.6 }}>{check}</Typography>
                  </Box>
                ))}
              </Box>
              <FormControlLabel
                control={
                  <Switch checked={eligibilityAck} onChange={(e) => setEligibilityAck(e.target.checked)} color="success" size="small" />
                }
                label={<Typography variant="body2" fontWeight={600}>I confirm I meet these criteria</Typography>}
                sx={{ mt: 2.5 }}
              />
            </Paper>

            {/* Process stepper */}
            <Paper elevation={0} sx={{
              p: 3.5, borderRadius: 4,
              backgroundColor: isDark ? "#1a1a1a" : "#fff",
              border: `1px solid ${isDark ? "#2a2a2a" : "#efefef"}`,
              boxShadow: isDark ? "none" : "0 4px 24px rgba(0,0,0,0.06)",
            }}>
              <Typography variant="overline" color="error" fontWeight={700} letterSpacing="0.12em">
                Process
              </Typography>
              <Typography fontWeight={700} mt={0.5} mb={2.5}>
                What Happens Next
              </Typography>
              <Stepper orientation="vertical">
                {steps.map((label) => (
                  <Step key={label} active>
                    <StepLabel StepIconProps={{ sx: { color: "#b71c1c !important" } }}>
                      <Typography variant="body2" fontWeight={600}>{label}</Typography>
                    </StepLabel>
                  </Step>
                ))}
              </Stepper>
            </Paper>
          </Box>

          {/* ── Right: Registration Form ───────────────────────────────────── */}
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
                <VolunteerActivismIcon />
              </Avatar>
              <Box>
                <Typography variant="overline" color="error" fontWeight={700} letterSpacing="0.12em" sx={{ lineHeight: 1 }}>
                  Registration
                </Typography>
                <Typography variant="h5" fontWeight={800} sx={{ lineHeight: 1.2 }}>
                  Donor Registration
                </Typography>
              </Box>
            </Box>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 4, mt: 1.5, lineHeight: 1.7 }}>
              Please provide accurate information. Our team will contact you for confirmation and testing.
            </Typography>

            <Box component="form" onSubmit={handleSubmit} noValidate autoComplete="off">
              {/* Photo upload */}
              <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", mb: 4, gap: 1 }}>
                <Box sx={{ position: "relative" }}>
                  <Avatar
                    src={photoPreview || undefined}
                    sx={{
                      width: 100, height: 100,
                      border: "3px dashed",
                      borderColor: photoPreview ? "error.main" : isDark ? "grey.700" : "grey.400",
                      bgcolor: isDark ? "grey.800" : "grey.100",
                    }}
                  >
                    {!photoPreview && <AddAPhotoIcon sx={{ fontSize: 36, color: "grey.500" }} />}
                  </Avatar>
                  <Tooltip title="Upload photo">
                    <IconButton
                      size="small"
                      onClick={() => photoInputRef.current?.click()}
                      sx={{
                        position: "absolute", bottom: 0, right: 0,
                        bgcolor: "error.main", color: "white",
                        "&:hover": { bgcolor: "error.dark" },
                        width: 30, height: 30,
                      }}
                    >
                      <AddAPhotoIcon sx={{ fontSize: 16 }} />
                    </IconButton>
                  </Tooltip>
                </Box>
                <input ref={photoInputRef} type="file" accept="image/*" hidden onChange={handlePhotoChange} />
                {photoPreview ? (
                  <Button size="small" startIcon={<DeleteIcon />} color="error" onClick={handleRemovePhoto} sx={{ mt: 0.5 }}>
                    Remove Photo
                  </Button>
                ) : (
                  <Typography variant="caption" color="text.secondary">Optional profile photo (max 5 MB)</Typography>
                )}
              </Box>

              {/* Fields */}
              <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" }, gap: 2 }}>
                <TextField
                  fullWidth label="Full Name" name="fullName" value={formData.fullName}
                  onChange={handleChange} required sx={{ gridColumn: "1 / -1", "& .MuiOutlinedInput-root": { borderRadius: 2.5 } }}
                />
                <TextField
                  fullWidth label="Email Address" name="email" value={formData.email}
                  onChange={handleChange} type="email" required sx={{ "& .MuiOutlinedInput-root": { borderRadius: 2.5 } }}
                />
                <TextField
                  fullWidth label="Phone Number" name="phone" value={formData.phone}
                  onChange={handleChange} type="tel" required sx={{ "& .MuiOutlinedInput-root": { borderRadius: 2.5 } }}
                />
                <FormControl fullWidth required sx={{ gridColumn: "1 / -1" }}>
                  <InputLabel id="blood-type-label">Blood Type</InputLabel>
                  <Select
                    labelId="blood-type-label" value={bloodType}
                    onChange={(e) => setBloodType(e.target.value)} label="Blood Type"
                    sx={{ borderRadius: 2.5 }}
                  >
                    {bloodTypeOptions.map((type) => (
                      <MenuItem key={type} value={type}>
                        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                          <Box sx={{
                            width: 28, height: 28, borderRadius: "50%",
                            backgroundColor: "#b71c1c", color: "white",
                            display: "flex", alignItems: "center", justifyContent: "center",
                            fontSize: "0.75rem", fontWeight: 700,
                          }}>
                            {type}
                          </Box>
                          Blood Type {type}
                        </Box>
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
                <TextField
                  fullWidth label="Location / City" name="location" value={formData.location}
                  onChange={handleChange} required
                  sx={{ gridColumn: "1 / -1", "& .MuiOutlinedInput-root": { borderRadius: 2.5 } }}
                />
                <TextField
                  fullWidth label="Last Donation Date" name="lastDonation" type="date"
                  value={formData.lastDonation} onChange={handleChange}
                  InputLabelProps={{ shrink: true }}
                  helperText="Leave blank if this is your first donation"
                  sx={{ "& .MuiOutlinedInput-root": { borderRadius: 2.5 } }}
                />
                <Box sx={{ display: "flex", alignItems: "center" }}>
                  <FormControlLabel
                    control={
                      <Switch checked={formData.available} onChange={handleChange} name="available" color="success" />
                    }
                    label={
                      <Box>
                        <Typography variant="body2" fontWeight={600}>Available to Donate</Typography>
                        <Typography variant="caption" color="text.secondary">Toggle if you're ready now</Typography>
                      </Box>
                    }
                  />
                </Box>
              </Box>

              {/* Submit */}
              <Box mt={4}>
                <Button
                  variant="contained" color="error" size="large" type="submit"
                  fullWidth disabled={loading}
                  sx={{
                    py: 1.6, fontWeight: 700, fontSize: "1rem", borderRadius: 3,
                    background: "linear-gradient(135deg, #b71c1c 0%, #d32f2f 100%)",
                    boxShadow: "0 6px 20px rgba(183,28,28,0.4)",
                    "&:hover": { boxShadow: "0 8px 28px rgba(183,28,28,0.55)", transform: "translateY(-1px)" },
                    "&.Mui-disabled": { background: isDark ? "#2a2a2a" : "#e0e0e0" },
                    transition: "all 0.25s ease",
                  }}
                >
                  {loading ? "Submitting…" : "🩸 Submit Registration"}
                </Button>
                <Typography variant="caption" color="text.disabled" display="block" textAlign="center" mt={1.5}>
                  By submitting, you agree to our donation guidelines and privacy policy.
                </Typography>
              </Box>
            </Box>
          </Paper>
        </Box>
      </Container>

    </Box>
  );
};

export default DonateBlood;
