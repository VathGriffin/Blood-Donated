'use client';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { useEffect, useState, useRef } from "react";
import {
  Container, Box, Typography, TextField, Button, Paper, FormControl, InputLabel, Select,
  MenuItem, Switch, FormControlLabel, useTheme, Alert, Avatar, IconButton, Tooltip,
} from "@mui/material";
import API_BASE from "@/lib/config";
import { script } from '@/lib/fonts';
import PersonAddAlt1Icon from "@mui/icons-material/PersonAddAlt1";
import BloodtypeIcon from "@mui/icons-material/Bloodtype";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import AddAPhotoIcon from "@mui/icons-material/AddAPhoto";
import DeleteIcon from "@mui/icons-material/Delete";
import FavoriteIcon from "@mui/icons-material/Favorite";
import PeopleIcon from "@mui/icons-material/People";
import ShieldIcon from "@mui/icons-material/Shield";
import HealthAndSafetyIcon from "@mui/icons-material/HealthAndSafety";
import LockIcon from "@mui/icons-material/Lock";
import FormatListNumberedIcon from "@mui/icons-material/FormatListNumbered";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";

// A donor's arm on the chair, giving blood — matches the reference design.
const HERO_IMG =
  "https://images.unsplash.com/photo-1536856136534-bb679c52a9aa?auto=format&fit=crop&w=1200&q=80";

const bloodTypeOptions = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];
const MAX_PHOTO_SIZE = 10 * 1024 * 1024; // must match Backend/src/donor/donor.routes.js multer limit

const heroFeatures = [
  { icon: <BloodtypeIcon />, title: "Safe & Secure", subtitle: "Your health is our priority" },
  { icon: <ShieldIcon />, title: "Quick Process", subtitle: "Usually takes 30-45 minutes" },
  { icon: <PeopleIcon />, title: "Real Impact", subtitle: "Help save up to 3 lives" },
];

const eligibilityChecks = [
  "I am between 18–60 years old",
  "I weigh at least 45 kg",
  "I have not donated blood in the past 3 months",
  "I do not have any active infections or illnesses",
];

const processSteps = [
  { title: "Register Online", subtitle: "Fill in your details" },
  { title: "Health Screening", subtitle: "A quick and simple check" },
  { title: "Donate Blood", subtitle: "The donation usually takes 30–45 minutes" },
  { title: "Save Lives", subtitle: "Your donation can help up to 3 people" },
];

const trustStrip = [
  {
    icon: <HealthAndSafetyIcon />,
    title: "Your Safety First",
    text: "All donations are processed by certified medical professionals in a safe and hygienic environment.",
  },
  {
    icon: <LockIcon />,
    title: "Confidential & Secure",
    text: "Your personal information is protected and kept confidential.",
  },
  {
    icon: <PeopleIcon />,
    title: "Make a Real Impact",
    text: "One donation can save up to 3 lives. Be the reason someone gets a second chance.",
  },
];

const cardSx = (isDark) => ({
  p: 3.5, borderRadius: 4,
  backgroundColor: isDark ? "#1a1a1a" : "#fff",
  border: `1px solid ${isDark ? "#2a2a2a" : "#efefef"}`,
  boxShadow: isDark ? "none" : "0 4px 24px rgba(0,0,0,0.06)",
});

const iconBoxSx = {
  width: 44, height: 44, borderRadius: 2.5, flexShrink: 0,
  background: "linear-gradient(135deg, #b71c1c 0%, #d32f2f 100%)",
  display: "flex", alignItems: "center", justifyContent: "center",
  boxShadow: "0 4px 12px rgba(183,28,28,0.35)",
  color: "white",
  "& svg": { fontSize: 22 },
};

const DonateBlood = () => {
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";
  const [bloodType, setBloodType] = useState("");
  const [formData, setFormData] = useState({
    fullName: "", email: "", phone: "", location: "", lastDonation: "", notes: "", available: true,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [eligibilityAck, setEligibilityAck] = useState(false);
  const [photoFile, setPhotoFile] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [photoError, setPhotoError] = useState("");
  const photoInputRef = useRef(null);
  const router = useRouter();

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({ ...prev, [name]: type === "checkbox" ? checked : value }));
  };

  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setPhotoError("Only image files are allowed.");
      e.target.value = "";
      return;
    }
    if (file.size > MAX_PHOTO_SIZE) {
      setPhotoError(`Image is too large — max ${MAX_PHOTO_SIZE / (1024 * 1024)} MB.`);
      e.target.value = "";
      return;
    }
    setPhotoError("");
    setPhotoFile(file);
    setPhotoPreview(URL.createObjectURL(file));
  };

  // Revoke the previous object URL whenever it's replaced or the component unmounts,
  // otherwise each selected photo leaks its blob until the tab is closed.
  useEffect(() => {
    return () => {
      if (photoPreview) URL.revokeObjectURL(photoPreview);
    };
  }, [photoPreview]);

  const handleRemovePhoto = () => {
    setPhotoFile(null);
    setPhotoPreview(null);
    setPhotoError("");
    if (photoInputRef.current) photoInputRef.current.value = "";
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (!bloodType) { setError("Please select a blood type."); return; }
    if (!eligibilityAck) { setError("Please confirm that you meet the donation eligibility criteria."); return; }
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE}/api/donors`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...formData, bloodType }),
      });
      if (!response.ok) {
        const data = await response.json();
        setError("Registration failed: " + (data.message || "Unknown error"));
        return;
      }
      const savedDonor = await response.json();
      if (photoFile && savedDonor._id) {
        const photoPayload = new FormData();
        photoPayload.append("photo", photoFile);
        await fetch(`${API_BASE}/api/donors/${savedDonor._id}/photo`, {
          method: "POST",
          headers: { Authorization: `Bearer ${savedDonor.photoUploadToken}` },
          body: photoPayload,
        });
      }
      router.push("/donate/thank-you");
    } catch {
      setError("Server error. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ backgroundColor: isDark ? "#121212" : "#f4f4f4" }}>

      {/* ── Hero — split layout: copy left, photo right ─────────────────────── */}
      <Box sx={{
        position: "relative", overflow: "hidden",
        background: isDark
          ? "linear-gradient(135deg, #161112 0%, #121212 100%)"
          : "linear-gradient(135deg, #fdf3f3 0%, #f9fafb 100%)",
      }}>
        <Box aria-hidden="true" sx={{
          position: "absolute", left: "-10%", top: "-20%", width: 480, height: 480, borderRadius: "50%",
          background: `radial-gradient(circle, ${isDark ? "rgba(183,28,28,0.10)" : "rgba(198,40,40,0.08)"} 0%, transparent 68%)`,
          pointerEvents: "none",
        }} />
        <Box aria-hidden="true" sx={{
          position: "absolute", left: "-8%", bottom: "-25%", width: 360, height: 360, borderRadius: "50%",
          background: `radial-gradient(circle, ${isDark ? "rgba(183,28,28,0.08)" : "rgba(198,40,40,0.06)"} 0%, transparent 70%)`,
          pointerEvents: "none",
        }} />

        <Container maxWidth="lg" sx={{ position: "relative", py: { xs: 6, md: 9 } }}>
          <Box sx={{
            display: "grid",
            gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" },
            gap: { xs: 5, md: 7 },
            alignItems: "center",
          }}>
            {/* Left: copy */}
            <Box>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 2 }}>
                <Typography variant="overline" color="error" fontWeight={700} letterSpacing="0.12em">
                  Your Donation Can Save Lives
                </Typography>
                <Box sx={{ width: 36, height: 3, borderRadius: 2, backgroundColor: "error.main" }} />
              </Box>
              <Typography sx={{
                fontWeight: 800, lineHeight: 1.08, mb: 2.5,
                fontSize: { xs: "2.4rem", md: "3.2rem" },
                color: isDark ? "#fff" : "#161a23",
              }}>
                Donate Blood
                <Box component="span" sx={{ display: "block", color: "error.main" }}>Save Lives</Box>
              </Typography>
              <Typography color="text.secondary" sx={{ fontSize: "1.05rem", lineHeight: 1.7, maxWidth: 480, mb: 5 }}>
                Join thousands of heroes in our community.
                A single donation can make a life-changing difference.
              </Typography>

              <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "repeat(3, auto)" }, gap: { xs: 2.5, sm: 4 } }}>
                {heroFeatures.map((f) => (
                  <Box key={f.title} sx={{ display: "flex", alignItems: "flex-start", gap: 1.5 }}>
                    <Box sx={{ color: "error.main", mt: 0.2, "& svg": { fontSize: 24 } }}>{f.icon}</Box>
                    <Box>
                      <Typography fontWeight={700} sx={{ fontSize: "0.95rem", lineHeight: 1.3 }}>{f.title}</Typography>
                      <Typography variant="caption" color="text.secondary" sx={{ lineHeight: 1.3, display: "block" }}>
                        {f.subtitle}
                      </Typography>
                    </Box>
                  </Box>
                ))}
              </Box>
            </Box>

            {/* Right: photo */}
            <Box sx={{ justifySelf: { xs: "center", md: "end" }, width: "100%", maxWidth: 480 }}>
              <Box sx={{ position: "relative" }}>
                <Box sx={{
                  position: "relative", borderRadius: 5, overflow: "hidden",
                  boxShadow: "0 20px 50px rgba(0,0,0,0.25)",
                  aspectRatio: "4 / 5",
                }}>
                  <Image src={HERO_IMG} alt="A donor giving blood" fill
                    sizes="(max-width: 900px) 100vw, 480px" style={{ objectFit: "cover" }} priority
                  />
                  <Typography className={script.className} sx={{
                    position: "absolute", top: "50%", left: "50%", zIndex: 2,
                    transform: "translate(-50%, -50%) rotate(-4deg)",
                    fontSize: "2.1rem", lineHeight: 1.25, color: "#fff", textAlign: "center",
                    textShadow: "0 2px 4px rgba(0,0,0,0.55), 0 6px 18px rgba(0,0,0,0.4)",
                    whiteSpace: "nowrap",
                  }}>
                    Be a Hero<br />Give Blood<br />Give Hope ♡
                  </Typography>
                </Box>

                <Box sx={{
                  position: "absolute", right: -18, bottom: -18, zIndex: 3,
                  width: 108, height: 108, borderRadius: "50%",
                  background: "linear-gradient(135deg, #b71c1c 0%, #d32f2f 100%)",
                  display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
                  color: "white", textAlign: "center", boxShadow: "0 10px 28px rgba(183,28,28,0.5)",
                  border: `4px solid ${isDark ? "#121212" : "#fdf3f3"}`,
                }}>
                  <FavoriteIcon sx={{ fontSize: 20, mb: 0.3 }} />
                  <Typography sx={{ fontSize: "0.72rem", fontWeight: 800, lineHeight: 1.2 }}>Give Blood</Typography>
                  <Typography sx={{ fontSize: "0.72rem", fontWeight: 800, lineHeight: 1.2 }}>Give Hope</Typography>
                </Box>
              </Box>
            </Box>
          </Box>
        </Container>
      </Box>

      {/* ── Main Content ──────────────────────────────────────────────────── */}
      <Container maxWidth="lg" sx={{ py: 8 }}>
        <Box sx={{
          display: "grid",
          gridTemplateColumns: { xs: "1fr", md: "1fr 2fr" },
          gap: 4, alignItems: "start",
        }}>

          {/* ── Left Sidebar ──────────────────────────────────────────────── */}
          <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>

            {/* Blood type picker */}
            <Paper elevation={0} sx={cardSx(isDark)}>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 2.5 }}>
                <Box sx={iconBoxSx}><BloodtypeIcon /></Box>
                <Box>
                  <Typography fontWeight={700}>Blood Types</Typography>
                  <Typography variant="caption" color="text.secondary">All blood types are needed</Typography>
                </Box>
              </Box>
              <Box sx={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 1 }}>
                {bloodTypeOptions.map((bt) => (
                  <Box
                    key={bt}
                    onClick={() => setBloodType(bt)}
                    sx={{
                      textAlign: "center", py: 1, borderRadius: 2.5, cursor: "pointer",
                      fontWeight: 700, fontSize: "0.9rem", userSelect: "none",
                      transition: "all 0.15s ease",
                      backgroundColor: bloodType === bt
                        ? "error.main"
                        : isDark ? "rgba(183,28,28,0.14)" : "#fdeaea",
                      color: bloodType === bt ? "#fff" : "error.main",
                    }}
                  >
                    {bt}
                  </Box>
                ))}
              </Box>
            </Paper>

            {/* Eligibility checklist */}
            <Paper elevation={0} sx={cardSx(isDark)}>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 2.5 }}>
                <Box sx={iconBoxSx}><ShieldIcon /></Box>
                <Box>
                  <Typography fontWeight={700}>Eligibility Criteria</Typography>
                  <Typography variant="caption" color="text.secondary">Make sure you meet the basic requirements</Typography>
                </Box>
              </Box>
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

            {/* Process steps */}
            <Paper elevation={0} sx={cardSx(isDark)}>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 3 }}>
                <Box sx={iconBoxSx}><FormatListNumberedIcon /></Box>
                <Box>
                  <Typography fontWeight={700}>What Happens Next?</Typography>
                  <Typography variant="caption" color="text.secondary">A simple process to save lives</Typography>
                </Box>
              </Box>
              <Box>
                {processSteps.map((step, i) => (
                  <Box key={step.title} sx={{ display: "flex", gap: 2 }}>
                    <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                      <Box sx={{
                        width: 28, height: 28, borderRadius: "50%", flexShrink: 0,
                        backgroundColor: "error.main", color: "#fff",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        fontWeight: 700, fontSize: "0.85rem",
                      }}>
                        {i + 1}
                      </Box>
                      {i < processSteps.length - 1 && (
                        <Box sx={{ width: 2, flexGrow: 1, minHeight: 28, backgroundColor: isDark ? "#2a2a2a" : "#efefef", my: 0.3 }} />
                      )}
                    </Box>
                    <Box sx={{ pb: i < processSteps.length - 1 ? 2.5 : 0 }}>
                      <Typography fontWeight={700} sx={{ fontSize: "0.92rem", lineHeight: 1.3 }}>{step.title}</Typography>
                      <Typography variant="caption" color="text.secondary">{step.subtitle}</Typography>
                    </Box>
                  </Box>
                ))}
              </Box>
            </Paper>
          </Box>

          {/* ── Right: Registration Form ───────────────────────────────────── */}
          <Paper elevation={0} sx={{ ...cardSx(isDark), p: { xs: 3.5, md: 5 } }}>
            {/* Form header */}
            <Box sx={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 2, flexWrap: "wrap" }}>
              <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                <Avatar sx={{
                  width: 48, height: 48,
                  background: "linear-gradient(135deg, #b71c1c 0%, #d32f2f 100%)",
                  boxShadow: "0 4px 14px rgba(183,28,28,0.4)",
                }}>
                  <PersonAddAlt1Icon />
                </Avatar>
                <Box>
                  <Typography variant="overline" color="error" fontWeight={700} letterSpacing="0.12em" sx={{ lineHeight: 1 }}>
                    Donor Registration
                  </Typography>
                  <Typography variant="h5" fontWeight={800} sx={{ lineHeight: 1.2 }}>
                    Complete Your Details
                  </Typography>
                </Box>
              </Box>

              <Box sx={{
                display: "flex", alignItems: "center", gap: 1.2, px: 2, py: 1, borderRadius: 3,
                backgroundColor: isDark ? "rgba(183,28,28,0.14)" : "#fdeaea",
              }}>
                <FavoriteIcon color="error" sx={{ fontSize: 22 }} />
                <Box>
                  <Typography sx={{ fontSize: "0.8rem", fontWeight: 700, lineHeight: 1.25 }}>Your Blood</Typography>
                  <Typography sx={{ fontSize: "0.8rem", fontWeight: 700, lineHeight: 1.25 }}>Their Tomorrow</Typography>
                </Box>
              </Box>
            </Box>

            <Typography variant="body2" color="text.secondary" sx={{ mb: 3.5, mt: 2, lineHeight: 1.7 }}>
              Please provide accurate information. Our team will contact you for confirmation and testing.
            </Typography>

            <Box component="form" onSubmit={handleSubmit} noValidate autoComplete="off">
              {/* Compact optional photo upload */}
              <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 3.5 }}>
                <Box sx={{ position: "relative", flexShrink: 0 }}>
                  <Avatar
                    src={photoPreview || undefined}
                    sx={{
                      width: 56, height: 56,
                      border: "2px dashed",
                      borderColor: photoPreview ? "error.main" : isDark ? "grey.700" : "grey.400",
                      bgcolor: isDark ? "grey.800" : "grey.100",
                    }}
                  >
                    {!photoPreview && <AddAPhotoIcon sx={{ fontSize: 22, color: "grey.500" }} />}
                  </Avatar>
                  <Tooltip title="Upload photo">
                    <IconButton
                      size="small"
                      onClick={() => photoInputRef.current?.click()}
                      sx={{
                        position: "absolute", bottom: -2, right: -2,
                        bgcolor: "error.main", color: "white",
                        "&:hover": { bgcolor: "error.dark" },
                        width: 22, height: 22,
                      }}
                    >
                      <AddAPhotoIcon sx={{ fontSize: 12 }} />
                    </IconButton>
                  </Tooltip>
                </Box>
                <input ref={photoInputRef} type="file" accept="image/*" hidden onChange={handlePhotoChange} />
                <Box>
                  <Typography variant="body2" fontWeight={600}>Profile photo (optional)</Typography>
                  {photoPreview ? (
                    <Button size="small" startIcon={<DeleteIcon />} color="error" onClick={handleRemovePhoto} sx={{ ml: -1 }}>
                      Remove
                    </Button>
                  ) : (
                    <Typography variant="caption" color="text.secondary">
                      Max {MAX_PHOTO_SIZE / (1024 * 1024)} MB
                    </Typography>
                  )}
                  {photoError && (
                    <Typography variant="caption" color="error" display="block">{photoError}</Typography>
                  )}
                </Box>
              </Box>

              {/* Fields */}
              <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" }, gap: 2 }}>
                <TextField
                  fullWidth label="Full Name" name="fullName" value={formData.fullName}
                  onChange={handleChange} required placeholder="Enter your full name"
                  sx={{ gridColumn: "1 / -1", "& .MuiOutlinedInput-root": { borderRadius: 2.5 } }}
                />
                <TextField
                  fullWidth label="Email Address" name="email" value={formData.email}
                  onChange={handleChange} type="email" required placeholder="Enter your email address"
                  sx={{ "& .MuiOutlinedInput-root": { borderRadius: 2.5 } }}
                />
                <TextField
                  fullWidth label="Phone Number" name="phone" value={formData.phone}
                  onChange={handleChange} type="tel" required placeholder="Enter your phone number"
                  sx={{ "& .MuiOutlinedInput-root": { borderRadius: 2.5 } }}
                />
                <FormControl fullWidth required>
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
                  onChange={handleChange} required placeholder="Enter your city or location"
                  sx={{ "& .MuiOutlinedInput-root": { borderRadius: 2.5 } }}
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
                        <Typography variant="caption" color="text.secondary">I am ready to donate when contacted</Typography>
                      </Box>
                    }
                  />
                </Box>
                <TextField
                  fullWidth label="Additional Notes (Optional)" name="notes" value={formData.notes}
                  onChange={handleChange} multiline minRows={3}
                  placeholder="Any additional information (medical conditions, preferred time, etc.)"
                  sx={{ gridColumn: "1 / -1", "& .MuiOutlinedInput-root": { borderRadius: 2.5 } }}
                />
              </Box>

              {/* Error alert */}
              {error && (
                <Alert severity="error" sx={{ mt: 3, borderRadius: "10px" }} onClose={() => setError("")}>
                  {error}
                </Alert>
              )}

              {/* Submit */}
              <Box mt={3}>
                <Button
                  variant="contained" color="error" size="large" type="submit"
                  fullWidth disabled={loading}
                  startIcon={!loading && <BloodtypeIcon />}
                  endIcon={!loading && <ArrowForwardIcon />}
                  sx={{
                    py: 1.6, fontWeight: 700, fontSize: "1rem", borderRadius: 3,
                    background: "linear-gradient(135deg, #b71c1c 0%, #d32f2f 100%)",
                    boxShadow: "0 6px 20px rgba(183,28,28,0.4)",
                    "&:hover": { boxShadow: "0 8px 28px rgba(183,28,28,0.55)", transform: "translateY(-1px)" },
                    "&.Mui-disabled": { background: isDark ? "#2a2a2a" : "#e0e0e0" },
                    transition: "all 0.25s ease",
                  }}
                >
                  {loading ? "Submitting…" : "Submit Registration"}
                </Button>
                <Typography variant="caption" color="text.disabled" display="block" textAlign="center" mt={1.5}>
                  By submitting, you agree to our donation guidelines and privacy policy.
                </Typography>
              </Box>
            </Box>
          </Paper>
        </Box>
      </Container>

      {/* ── Trust strip ───────────────────────────────────────────────────── */}
      <Box sx={{ backgroundColor: isDark ? "rgba(183,28,28,0.06)" : "#fdf1f1", py: { xs: 5, md: 6 } }}>
        <Container maxWidth="lg">
          <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "repeat(3, 1fr)" }, gap: 4 }}>
            {trustStrip.map((item) => (
              <Box key={item.title} sx={{ display: "flex", alignItems: "flex-start", gap: 2 }}>
                <Box sx={{
                  width: 48, height: 48, borderRadius: "50%", flexShrink: 0,
                  backgroundColor: isDark ? "rgba(183,28,28,0.16)" : "#fdeaea",
                  color: "error.main",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  "& svg": { fontSize: 22 },
                }}>
                  {item.icon}
                </Box>
                <Box>
                  <Typography fontWeight={700} sx={{ mb: 0.5 }}>{item.title}</Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.6 }}>{item.text}</Typography>
                </Box>
              </Box>
            ))}
          </Box>
        </Container>
      </Box>

    </Box>
  );
};

export default DonateBlood;
