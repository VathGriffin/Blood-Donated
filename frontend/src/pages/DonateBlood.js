import React, { useState, useRef } from "react";
import {
  Container,
  Box,
  Typography,
  TextField,
  Button,
  Paper,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Switch,
  FormControlLabel,
  Chip,
  useTheme,
  Stepper,
  Step,
  StepLabel,
  Alert,
  Avatar,
  IconButton,
  Tooltip,
} from "@mui/material";
import { useNavigate } from "react-router-dom";
import VolunteerActivismIcon from "@mui/icons-material/VolunteerActivism";
import BloodtypeIcon from "@mui/icons-material/Bloodtype";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import AddAPhotoIcon from "@mui/icons-material/AddAPhoto";
import DeleteIcon from "@mui/icons-material/Delete";

const bloodTypeOptions = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];

const eligibilityChecks = [
  "I am between 18–60 years old",
  "I weigh at least 45 kg",
  "I have not donated blood in the past 3 months",
  "I do not have any active infections or illnesses",
];

const DonateBlood = () => {
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";
  const [bloodType, setBloodType] = useState("");
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    phone: "",
    location: "",
    lastDonation: "",
    available: true,
  });
  const [loading, setLoading] = useState(false);
  const [eligibilityAck, setEligibilityAck] = useState(false);
  const [photoFile, setPhotoFile] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);
  const photoInputRef = useRef(null);
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
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
    if (!bloodType) {
      alert("Please select a blood type");
      return;
    }
    if (!eligibilityAck) {
      alert("Please confirm that you meet the donation eligibility criteria.");
      return;
    }
    try {
      setLoading(true);
      const response = await fetch("http://localhost:3001/api/donors/register", {
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
        await fetch(`http://localhost:3001/api/donors/${savedDonor._id}/photo`, {
          method: "POST",
          body: photoPayload,
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
    <Box sx={{ backgroundColor: isDark ? "#121212" : "#f9f9f9", minHeight: "100vh" }}>
      {/* Hero Banner */}
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
        <VolunteerActivismIcon sx={{ fontSize: 56, mb: 2, opacity: 0.9 }} />
        <Typography variant="h3" fontWeight={800} gutterBottom>
          Donate Blood
        </Typography>
        <Typography variant="h6" sx={{ opacity: 0.88, maxWidth: 520, mx: "auto", lineHeight: 1.7 }}>
          Together, we can save lives — one drop at a time. Register below and
          become part of our life-saving community.
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
          {/* Left sidebar: info cards */}
          <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
            {/* Blood type selector visual */}
            <Paper elevation={3} sx={{ p: 3, borderRadius: 3 }}>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2 }}>
                <BloodtypeIcon color="error" />
                <Typography fontWeight={700} color="error.main">
                  Blood Types
                </Typography>
              </Box>
              <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
                {bloodTypeOptions.map((bt) => (
                  <Chip
                    key={bt}
                    label={bt}
                    onClick={() => setBloodType(bt)}
                    variant={bloodType === bt ? "filled" : "outlined"}
                    color={bloodType === bt ? "error" : "default"}
                    sx={{ fontWeight: 700, cursor: "pointer", fontSize: "0.95rem" }}
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
            <Paper elevation={3} sx={{ p: 3, borderRadius: 3 }}>
              <Typography fontWeight={700} color="error.main" gutterBottom>
                Eligibility Criteria
              </Typography>
              <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5, mt: 1 }}>
                {eligibilityChecks.map((check, i) => (
                  <Box key={i} sx={{ display: "flex", alignItems: "flex-start", gap: 1 }}>
                    <CheckCircleIcon sx={{ color: "#4caf50", fontSize: 20, mt: 0.1, flexShrink: 0 }} />
                    <Typography variant="body2" color="text.secondary">
                      {check}
                    </Typography>
                  </Box>
                ))}
              </Box>
              <FormControlLabel
                control={
                  <Switch
                    checked={eligibilityAck}
                    onChange={(e) => setEligibilityAck(e.target.checked)}
                    color="success"
                    size="small"
                  />
                }
                label={
                  <Typography variant="body2" fontWeight={600}>
                    I confirm I meet these criteria
                  </Typography>
                }
                sx={{ mt: 2 }}
              />
            </Paper>

            {/* Process stepper */}
            <Paper elevation={3} sx={{ p: 3, borderRadius: 3 }}>
              <Typography fontWeight={700} color="error.main" gutterBottom>
                What Happens Next
              </Typography>
              <Stepper orientation="vertical" sx={{ mt: 1 }}>
                {["Register online", "Health screening", "Donate & save lives"].map((label, i) => (
                  <Step key={label} active>
                    <StepLabel
                      StepIconProps={{
                        sx: { color: "#b71c1c !important" },
                      }}
                    >
                      <Typography variant="body2" fontWeight={600}>
                        {label}
                      </Typography>
                    </StepLabel>
                  </Step>
                ))}
              </Stepper>
            </Paper>
          </Box>

          {/* Right: registration form */}
          <Paper elevation={4} sx={{ p: { xs: 3, md: 5 }, borderRadius: 4 }}>
            <Box textAlign="center" mb={4}>
              <Typography variant="h5" fontWeight={800} color="error.dark" gutterBottom>
                Donor Registration
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Please provide accurate information. Our team will contact you
                for confirmation and testing.
              </Typography>
            </Box>

            <Box component="form" onSubmit={handleSubmit} noValidate autoComplete="off">
              {/* Profile photo upload */}
              <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", mb: 4, gap: 1 }}>
                <Box sx={{ position: "relative" }}>
                  <Avatar
                    src={photoPreview || undefined}
                    sx={{
                      width: 100,
                      height: 100,
                      border: "3px dashed",
                      borderColor: photoPreview ? "error.main" : "grey.400",
                      bgcolor: isDark ? "grey.800" : "grey.100",
                      fontSize: 40,
                    }}
                  >
                    {!photoPreview && <AddAPhotoIcon sx={{ fontSize: 36, color: "grey.500" }} />}
                  </Avatar>
                  <Tooltip title="Upload photo">
                    <IconButton
                      size="small"
                      onClick={() => photoInputRef.current?.click()}
                      sx={{
                        position: "absolute",
                        bottom: 0,
                        right: 0,
                        bgcolor: "error.main",
                        color: "white",
                        "&:hover": { bgcolor: "error.dark" },
                        width: 30,
                        height: 30,
                      }}
                    >
                      <AddAPhotoIcon sx={{ fontSize: 16 }} />
                    </IconButton>
                  </Tooltip>
                </Box>
                <input
                  ref={photoInputRef}
                  type="file"
                  accept="image/*"
                  hidden
                  onChange={handlePhotoChange}
                />
                {photoPreview ? (
                  <Button
                    size="small"
                    startIcon={<DeleteIcon />}
                    color="error"
                    onClick={handleRemovePhoto}
                    sx={{ mt: 0.5 }}
                  >
                    Remove Photo
                  </Button>
                ) : (
                  <Typography variant="caption" color="text.secondary">
                    Optional profile photo (max 5 MB)
                  </Typography>
                )}
              </Box>

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
                  value={formData.fullName}
                  onChange={handleChange}
                  variant="outlined"
                  required
                  sx={{ gridColumn: "1 / -1" }}
                />
                <TextField
                  fullWidth
                  label="Email Address"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  variant="outlined"
                  type="email"
                  required
                />
                <TextField
                  fullWidth
                  label="Phone Number"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  variant="outlined"
                  type="tel"
                  required
                />

                <FormControl fullWidth required sx={{ gridColumn: "1 / -1" }}>
                  <InputLabel id="blood-type-label">Blood Type</InputLabel>
                  <Select
                    labelId="blood-type-label"
                    value={bloodType}
                    onChange={(e) => setBloodType(e.target.value)}
                    label="Blood Type"
                  >
                    {bloodTypeOptions.map((type) => (
                      <MenuItem key={type} value={type}>
                        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                          <Box
                            sx={{
                              width: 28,
                              height: 28,
                              borderRadius: "50%",
                              backgroundColor: "#b71c1c",
                              color: "white",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              fontSize: "0.75rem",
                              fontWeight: 700,
                            }}
                          >
                            {type}
                          </Box>
                          Blood Type {type}
                        </Box>
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>

                <TextField
                  fullWidth
                  label="Location / City"
                  name="location"
                  value={formData.location}
                  onChange={handleChange}
                  variant="outlined"
                  required
                  sx={{ gridColumn: "1 / -1" }}
                />

                <TextField
                  fullWidth
                  label="Last Donation Date"
                  name="lastDonation"
                  type="date"
                  value={formData.lastDonation}
                  onChange={handleChange}
                  variant="outlined"
                  InputLabelProps={{ shrink: true }}
                  helperText="Leave blank if this is your first donation"
                />

                <Box sx={{ display: "flex", alignItems: "center" }}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={formData.available}
                        onChange={handleChange}
                        name="available"
                        color="success"
                      />
                    }
                    label={
                      <Box>
                        <Typography variant="body2" fontWeight={600}>
                          Available to Donate
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          Toggle if you're ready now
                        </Typography>
                      </Box>
                    }
                  />
                </Box>
              </Box>

              <Box mt={4}>
                <Button
                  variant="contained"
                  color="error"
                  size="large"
                  type="submit"
                  fullWidth
                  disabled={loading}
                  sx={{
                    py: 1.5,
                    fontWeight: 700,
                    fontSize: "1rem",
                    borderRadius: 3,
                    boxShadow: "0 4px 15px rgba(183,28,28,0.35)",
                    "&:hover": { boxShadow: "0 6px 20px rgba(183,28,28,0.5)" },
                  }}
                >
                  {loading ? "Submitting..." : "🩸 Submit Registration"}
                </Button>
                <Typography variant="caption" color="text.secondary" display="block" textAlign="center" mt={1.5}>
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
