'use client';
import { useRouter } from 'next/navigation';
import React, { useState, useRef } from "react";
import {
  Container, Typography, TextField, Button, Paper, Box,
  FormControl, InputLabel, Select, MenuItem, Avatar,
  IconButton, Tooltip, useTheme, Chip,
} from "@mui/material";
import axios from "axios";
import API_BASE from "@/lib/config";
import AddAPhotoIcon from "@mui/icons-material/AddAPhoto";
import DeleteIcon from "@mui/icons-material/Delete";
import BloodtypeIcon from "@mui/icons-material/Bloodtype";
import LocalHospitalIcon from "@mui/icons-material/LocalHospital";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";
import PhoneIcon from "@mui/icons-material/Phone";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";

const HERO_IMG =
  "https://images.unsplash.com/photo-1504439468489-c8920d796a29?auto=format&fit=crop&w=1920&q=80";

const BLOOD_TYPES = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];

const URGENCY_LEVELS = [
  { value: "Low", label: "Low", color: "#2e7d32", bg: "#e8f5e9", desc: "Needed within a week" },
  { value: "Medium", label: "Medium", color: "#f57f17", bg: "#fff8e1", desc: "Needed within 48 hours" },
  { value: "High", label: "High", color: "#e65100", bg: "#fbe9e7", desc: "Needed within 24 hours" },
  { value: "Critical", label: "Critical", color: "#b71c1c", bg: "#ffebee", desc: "Needed immediately" },
];

const RequestBlood = () => {
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";
  const [bloodType, setBloodType] = useState("");
  const [urgency, setUrgency] = useState("");
  const [photoFile, setPhotoFile] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const photoInputRef = useRef(null);
  const router = useRouter();

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
    if (!bloodType) { alert("Please select a blood type."); return; }
    if (!urgency) { alert("Please select an urgency level."); return; }

    const requestData = {
      hospitalName: e.target.hospitalName.value,
      patientName: e.target.patientName.value,
      bloodType,
      urgency,
      reason: e.target.reason.value,
      contact: e.target.contact.value,
    };

    let savedRequest;
    setLoading(true);
    try {
      const response = await axios.post(`${API_BASE}/api/requests`, requestData);
      savedRequest = response.data;
    } catch (error) {
      const msg = error.response?.data?.error || error.response?.data?.message || error.message || "Failed to submit blood request.";
      alert(msg);
      setLoading(false);
      return;
    }

    if (photoFile && savedRequest._id) {
      try {
        const photoPayload = new FormData();
        photoPayload.append("photo", photoFile);
        await axios.post(`${API_BASE}/api/requests/${savedRequest._id}/photo`, photoPayload);
      } catch (err) {
        console.error("Photo upload failed:", err);
      }
    }

    setLoading(false);
    router.push("/request/thank-you");
  };

  const selectedUrgency = URGENCY_LEVELS.find((u) => u.value === urgency);

  return (
    <Box sx={{ backgroundColor: isDark ? "#121212" : "#f4f4f4" }}>

      {/* ── Hero — Photo Background ────────────────────────────────────────── */}
      <Box sx={{
        position: "relative",
        minHeight: { xs: "70vh", md: "78vh" },
        display: "flex", flexDirection: "column",
        alignItems: "center", justifyContent: "center", textAlign: "center",
        backgroundImage: `url('${HERO_IMG}')`,
        backgroundSize: "cover", backgroundPosition: "center 20%",
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
            icon={<BloodtypeIcon sx={{ color: "white !important", fontSize: "18px !important" }} />}
            label="Blood Request Portal"
            sx={{ backgroundColor: "rgba(255,255,255,0.15)", color: "white", fontWeight: 700, mb: 3, backdropFilter: "blur(4px)", fontSize: "0.82rem" }}
          />
          <Typography variant="h2" fontWeight={800} color="white"
            sx={{ lineHeight: 1.12, mb: 2, fontSize: { xs: "2.4rem", md: "3.6rem" }, textShadow: "0 2px 24px rgba(0,0,0,0.6)" }}>
            Request Blood
          </Typography>
          <Typography variant="h5" sx={{ color: "#ffcdd2", fontWeight: 700, mb: 2.5, fontSize: { xs: "1.1rem", md: "1.4rem" } }}>
            Every second counts — we're here to help.
          </Typography>
          <Typography variant="h6" sx={{
            color: "rgba(255,255,255,0.82)", maxWidth: 540, mx: "auto",
            lineHeight: 1.8, fontWeight: 400, fontSize: { xs: "1rem", md: "1.1rem" },
          }}>
            Submit a blood request for a patient in need. Our team will match
            you with available donors as quickly as possible.
          </Typography>

          {/* Quick info chips */}
          <Box sx={{ display: "flex", gap: 2, justifyContent: "center", flexWrap: "wrap", mt: 5 }}>
            {[
              { icon: "🩸", label: "All Blood Types Available" },
              { icon: "⚡", label: "Critical Requests Prioritized" },
              { icon: "🏥", label: "50+ Partner Hospitals" },
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

            {/* Urgency guide */}
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
                  <WarningAmberIcon sx={{ color: "white", fontSize: 20 }} />
                </Box>
                <Typography fontWeight={700}>Urgency Levels</Typography>
              </Box>
              <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
                {URGENCY_LEVELS.map((u) => (
                  <Box key={u.value} sx={{
                    display: "flex", alignItems: "center", gap: 1.5,
                    p: 1.2, borderRadius: 2,
                    backgroundColor: isDark ? `${u.color}22` : u.bg,
                    border: `1px solid ${u.color}44`,
                  }}>
                    <Box sx={{ width: 10, height: 10, borderRadius: "50%", backgroundColor: u.color, flexShrink: 0 }} />
                    <Box>
                      <Typography variant="body2" fontWeight={700} sx={{ color: u.color, lineHeight: 1.2 }}>{u.label}</Typography>
                      <Typography variant="caption" color="text.secondary">{u.desc}</Typography>
                    </Box>
                  </Box>
                ))}
              </Box>
            </Paper>

            {/* Blood type chips */}
            <Paper elevation={0} sx={{
              p: 3.5, borderRadius: 4,
              backgroundColor: isDark ? "#1a1a1a" : "#fff",
              border: `1px solid ${isDark ? "#2a2a2a" : "#efefef"}`,
              boxShadow: isDark ? "none" : "0 4px 24px rgba(0,0,0,0.06)",
            }}>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 2 }}>
                <Box sx={{
                  width: 40, height: 40, borderRadius: 2,
                  background: "linear-gradient(135deg, #ad1457 0%, #c2185b 100%)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  boxShadow: "0 4px 12px rgba(173,20,87,0.4)",
                }}>
                  <BloodtypeIcon sx={{ color: "white", fontSize: 20 }} />
                </Box>
                <Typography fontWeight={700}>Blood Types We Support</Typography>
              </Box>
              <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
                {BLOOD_TYPES.map((bt) => (
                  <Chip key={bt} label={bt} size="small"
                    variant={bloodType === bt ? "filled" : "outlined"}
                    color={bloodType === bt ? "error" : "default"}
                    sx={{ fontWeight: 700, fontSize: "0.85rem" }}
                  />
                ))}
              </Box>
            </Paper>

            {/* Emergency contact */}
            <Paper elevation={0} sx={{
              p: 3.5, borderRadius: 4,
              background: "linear-gradient(135deg, #b71c1c 0%, #7f0000 100%)",
              color: "white",
              boxShadow: "0 8px 32px rgba(183,28,28,0.35)",
            }}>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 1.5 }}>
                <PhoneIcon sx={{ fontSize: 22 }} />
                <Typography variant="subtitle1" fontWeight={800}>Need Immediate Help?</Typography>
              </Box>
              <Typography variant="body2" sx={{ opacity: 0.9, lineHeight: 1.75, mb: 2 }}>
                For life-threatening emergencies, call us directly. We operate a 24/7 emergency blood coordination line.
              </Typography>
              <Typography variant="h6" fontWeight={800}>+855 12 345 678</Typography>
              <Typography variant="caption" sx={{ opacity: 0.75 }}>Available Mon–Fri, 8AM–5PM</Typography>
            </Paper>

            {/* Info note */}
            <Box sx={{
              display: "flex", gap: 1.5, alignItems: "flex-start",
              p: 2, borderRadius: 3,
              backgroundColor: isDark ? "#1e1e2e" : "#e3f2fd",
              border: `1px solid ${isDark ? "#2a2a4a" : "#90caf9"}`,
            }}>
              <InfoOutlinedIcon sx={{ color: "#1565c0", fontSize: 20, mt: 0.2, flexShrink: 0 }} />
              <Typography variant="caption" sx={{ color: isDark ? "#90caf9" : "#1565c0", lineHeight: 1.7 }}>
                After submission, our team will review your request and contact you within the response time for your selected urgency level.
              </Typography>
            </Box>
          </Box>

          {/* ── Right: Request Form ────────────────────────────────────────── */}
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
                <LocalHospitalIcon />
              </Avatar>
              <Box>
                <Typography variant="overline" color="error" fontWeight={700} letterSpacing="0.12em" sx={{ lineHeight: 1 }}>
                  Blood Request
                </Typography>
                <Typography variant="h5" fontWeight={800} sx={{ lineHeight: 1.2 }}>
                  Request Form
                </Typography>
              </Box>
            </Box>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 4, mt: 1.5, lineHeight: 1.7 }}>
              Please provide accurate patient information. Our team will contact you to coordinate the blood supply as quickly as possible.
            </Typography>

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
                  <IconButton size="small" onClick={() => photoInputRef.current?.click()}
                    sx={{
                      position: "absolute", bottom: 0, right: 0,
                      bgcolor: "error.main", color: "white",
                      "&:hover": { bgcolor: "error.dark" }, width: 30, height: 30,
                    }}>
                    <AddAPhotoIcon sx={{ fontSize: 16 }} />
                  </IconButton>
                </Tooltip>
              </Box>
              <input ref={photoInputRef} type="file" accept="image/*" hidden onChange={handlePhotoChange} />
              {photoPreview ? (
                <Button size="small" startIcon={<DeleteIcon />} color="error" onClick={handleRemovePhoto}>
                  Remove Photo
                </Button>
              ) : (
                <Typography variant="caption" color="text.secondary">
                  Optional patient / requester photo (max 5 MB)
                </Typography>
              )}
            </Box>

            {/* Fields */}
            <Box component="form" onSubmit={handleSubmit} noValidate>
              <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" }, gap: 2, mb: 2 }}>
                <TextField
                  fullWidth label="Hospital Name" name="hospitalName" required
                  sx={{ "& .MuiOutlinedInput-root": { borderRadius: 2.5 } }}
                />
                <TextField
                  fullWidth label="Patient Name" name="patientName" required
                  sx={{ "& .MuiOutlinedInput-root": { borderRadius: 2.5 } }}
                />
              </Box>

              <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" }, gap: 2, mb: 2 }}>
                <FormControl fullWidth required>
                  <InputLabel id="blood-type-label">Blood Type</InputLabel>
                  <Select
                    labelId="blood-type-label" value={bloodType}
                    onChange={(e) => setBloodType(e.target.value)} label="Blood Type"
                    sx={{ borderRadius: 2.5 }}
                  >
                    {BLOOD_TYPES.map((type) => (
                      <MenuItem key={type} value={type}>
                        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                          <Box sx={{
                            width: 28, height: 28, borderRadius: "50%",
                            backgroundColor: "#b71c1c", color: "white",
                            display: "flex", alignItems: "center", justifyContent: "center",
                            fontSize: "0.72rem", fontWeight: 700,
                          }}>
                            {type}
                          </Box>
                          Blood Type {type}
                        </Box>
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>

                <FormControl fullWidth required>
                  <InputLabel id="urgency-label">Urgency Level</InputLabel>
                  <Select
                    labelId="urgency-label" value={urgency}
                    onChange={(e) => setUrgency(e.target.value)} label="Urgency Level"
                    sx={{ borderRadius: 2.5 }}
                  >
                    {URGENCY_LEVELS.map((u) => (
                      <MenuItem key={u.value} value={u.value}>
                        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                          <Box sx={{ width: 10, height: 10, borderRadius: "50%", backgroundColor: u.color, flexShrink: 0 }} />
                          <Box>
                            <Typography variant="body2" fontWeight={700} sx={{ color: u.color }}>{u.label}</Typography>
                            <Typography variant="caption" color="text.secondary">{u.desc}</Typography>
                          </Box>
                        </Box>
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Box>

              {/* Urgency banner */}
              {selectedUrgency && (
                <Box sx={{
                  display: "flex", alignItems: "center", gap: 1.5,
                  p: 1.5, mb: 2, borderRadius: 2.5,
                  backgroundColor: isDark ? `${selectedUrgency.color}22` : selectedUrgency.bg,
                  border: `1px solid ${selectedUrgency.color}55`,
                }}>
                  <Box sx={{ width: 8, height: 8, borderRadius: "50%", backgroundColor: selectedUrgency.color, flexShrink: 0 }} />
                  <Typography variant="body2" fontWeight={600} sx={{ color: selectedUrgency.color }}>
                    {selectedUrgency.label} priority — {selectedUrgency.desc}
                  </Typography>
                </Box>
              )}

              <TextField
                fullWidth label="Reason for Request" name="reason" multiline rows={3} required
                sx={{ mb: 2, "& .MuiOutlinedInput-root": { borderRadius: 2.5 } }}
              />
              <TextField
                fullWidth label="Contact Number / Email" name="contact" required
                sx={{ mb: 3, "& .MuiOutlinedInput-root": { borderRadius: 2.5 } }}
              />

              <Button
                type="submit" variant="contained" color="error" size="large"
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
                {loading ? "Submitting…" : "🩸 Submit Blood Request"}
              </Button>
              <Typography variant="caption" color="text.disabled" display="block" textAlign="center" mt={1.5}>
                By submitting, you confirm the information provided is accurate and pertains to a genuine medical need.
              </Typography>
            </Box>
          </Paper>
        </Box>
      </Container>

    </Box>
  );
};

export default RequestBlood;
