'use client';
import { useRouter } from 'next/navigation';
import React, { useState, useEffect } from "react";
import {
  Container, Typography, TextField, Button, Paper, Box,
  FormControl, Select, MenuItem, useTheme, Alert, Tabs, Tab,
  Chip, Avatar, Grid, Skeleton, Divider,
} from "@mui/material";
import LocalHospitalIcon from "@mui/icons-material/LocalHospital";
import FavoriteIcon       from "@mui/icons-material/Favorite";
import BloodtypeIcon      from "@mui/icons-material/Bloodtype";
import AccessTimeIcon     from "@mui/icons-material/AccessTime";
import CheckCircleIcon    from "@mui/icons-material/CheckCircle";
import CancelIcon         from "@mui/icons-material/Cancel";
import HourglassEmptyIcon from "@mui/icons-material/HourglassEmpty";
import axios from "axios";
import API_BASE from "@/lib/config";
import { useUserAuth } from "@/store/UserAuthContext";

const BLOOD_TYPES    = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];
const UNITS          = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
const URGENCY_LEVELS = ["Low", "Medium", "High", "Critical"];

const URGENCY_STYLES = {
  Low:      { color: "#16a34a", bg: "#f0fdf4", border: "rgba(22,163,74,0.25)"  },
  Medium:   { color: "#d97706", bg: "#fffbeb", border: "rgba(217,119,6,0.25)"  },
  High:     { color: "#ea580c", bg: "#fff7ed", border: "rgba(234,88,12,0.25)"  },
  Critical: { color: "#dc2626", bg: "#fff0f0", border: "rgba(220,38,38,0.25)"  },
};

const STATUS_META = {
  Pending:  { color: "#d97706", darkBg: "rgba(217,119,6,0.14)",  lightBg: "#fffbeb", icon: <HourglassEmptyIcon sx={{ fontSize: 13 }} />, label: "Pending"  },
  Approved: { color: "#16a34a", darkBg: "rgba(22,163,74,0.14)",  lightBg: "#f0fdf4", icon: <CheckCircleIcon   sx={{ fontSize: 13 }} />, label: "Approved" },
  Rejected: { color: "#dc2626", darkBg: "rgba(220,38,38,0.14)",  lightBg: "#fff0f0", icon: <CancelIcon        sx={{ fontSize: 13 }} />, label: "Rejected" },
};

const URGENCY_ORDER = { Critical: 0, High: 1, Medium: 2, Low: 3 };

export default function RequestBlood() {
  const theme  = useTheme();
  const isDark = theme.palette.mode === "dark";
  const router = useRouter();
  const { user: loggedInUser } = useUserAuth();

  const [pageTab, setPageTab] = useState(0);

  // ── Submit form state ──
  const [form, setForm] = useState({
    hospitalName: "", patientName: "", bloodType: "",
    unitsNeeded: "", urgency: "", reason: "", notes: "",
  });
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState("");

  // ── Active requests state ──
  const [requests,    setRequests]    = useState([]);
  const [reqLoading,  setReqLoading]  = useState(false);
  const [filterType,  setFilterType]  = useState("All");
  const [filterStatus, setFilterStatus] = useState("All");

  const fetchRequests = async () => {
    setReqLoading(true);
    try {
      const res = await axios.get(`${API_BASE}/api/requests`);
      setRequests(Array.isArray(res.data) ? res.data : []);
    } catch {
      setRequests([]);
    } finally {
      setReqLoading(false);
    }
  };

  useEffect(() => {
    if (pageTab === 1) fetchRequests();
  }, [pageTab]);

  const handleChange = (field) => (e) => {
    setForm(f => ({ ...f, [field]: e.target.value }));
    setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.hospitalName.trim()) { setError("Hospital name is required."); return; }
    if (!form.patientName.trim())  { setError("Patient name is required.");  return; }
    if (!form.bloodType)           { setError("Please select a blood type."); return; }
    if (!form.unitsNeeded)         { setError("Please select units needed."); return; }
    if (!form.urgency)             { setError("Please select an urgency level."); return; }
    if (!form.reason.trim())       { setError("Reason for request is required."); return; }

    setLoading(true);
    setError("");
    try {
      await axios.post(`${API_BASE}/api/requests`, {
        hospitalName: form.hospitalName,
        patientName:  form.patientName,
        bloodType:    form.bloodType,
        unitsNeeded:  form.unitsNeeded,
        urgency:      form.urgency,
        reason:       form.reason,
        contact:      form.notes,
        userEmail:    loggedInUser?.email || "",
      });
      router.push("/requests/thank-you");
    } catch (err) {
      setError(err.response?.data?.error || err.response?.data?.message || "Submission failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const bg      = isDark ? "#0a0a0a" : "#f8f8f8";
  const cardBg  = isDark ? "#111111" : "#ffffff";
  const border  = isDark ? "#1f1f1f" : "#e5e5e5";
  const fieldSx = { mb: 2.5, "& .MuiOutlinedInput-root": { borderRadius: "10px" } };
  const selectedUrgency = form.urgency ? URGENCY_STYLES[form.urgency] : null;

  // ── Filter active requests ──
  const filteredRequests = requests
    .filter(r => filterType   === "All" || r.bloodType === filterType)
    .filter(r => filterStatus === "All" || r.status    === filterStatus)
    .sort((a, b) => (URGENCY_ORDER[a.urgency] ?? 4) - (URGENCY_ORDER[b.urgency] ?? 4));

  return (
    <Box sx={{ backgroundColor: bg, minHeight: "100vh", pt: { xs: 10, md: 12 }, pb: 10 }}>
      <Container maxWidth="md">

        {/* Page header */}
        <Box textAlign="center" mb={4}>
          <Box sx={{
            width: 60, height: 60, borderRadius: "16px", mx: "auto", mb: 2.5,
            background: "linear-gradient(135deg, #dc2626 0%, #991b1b 100%)",
            display: "flex", alignItems: "center", justifyContent: "center",
            boxShadow: "0 8px 24px rgba(220,38,38,0.4)",
          }}>
            <LocalHospitalIcon sx={{ color: "white", fontSize: 28 }} />
          </Box>
          <Typography sx={{
            fontSize: { xs: "1.8rem", md: "2.2rem" }, fontWeight: 800,
            letterSpacing: "-0.025em", color: isDark ? "#f5f5f5" : "#111111",
          }}>
            Blood Requests
          </Typography>
          <Typography color="text.secondary" mt={1} lineHeight={1.7} maxWidth={420} mx="auto">
            Submit a new blood request or view active requests waiting for donors.
          </Typography>
        </Box>

        {/* Tabs */}
        <Paper elevation={0} sx={{ borderRadius: 3, border: `1px solid ${border}`, bgcolor: cardBg, mb: 3 }}>
          <Tabs value={pageTab} onChange={(_, v) => setPageTab(v)}
            sx={{
              px: 1,
              "& .MuiTab-root": { textTransform: "none", fontWeight: 600, fontSize: "0.9rem" },
              "& .Mui-selected": { color: "#dc2626" },
              "& .MuiTabs-indicator": { bgcolor: "#dc2626" },
            }}>
            <Tab label="Submit a Request" />
            <Tab label={
              <Box display="flex" alignItems="center" gap={0.8}>
                Active Requests
                {requests.length > 0 && (
                  <Chip label={requests.filter(r => r.status !== "Rejected").length} size="small"
                    sx={{ height: 18, fontSize: "0.68rem", fontWeight: 700,
                      bgcolor: "rgba(220,38,38,0.12)", color: "#dc2626" }} />
                )}
              </Box>
            } />
          </Tabs>
        </Paper>

        {/* ── TAB 0: Submit Form ── */}
        {pageTab === 0 && (
          <Box maxWidth={560} mx="auto">
            <Paper elevation={0} sx={{ borderRadius: "20px", border: `1px solid ${border}`, bgcolor: cardBg, p: { xs: 3, md: 4.5 } }}>
              {error && <Alert severity="error" sx={{ mb: 3, borderRadius: "10px" }}>{error}</Alert>}

              <Box component="form" onSubmit={handleSubmit} noValidate>
                <Typography variant="caption" fontWeight={700} color="text.secondary" mb={0.8} display="block"
                  sx={{ textTransform: "uppercase", letterSpacing: "0.06em", fontSize: "0.68rem" }}>
                  Hospital
                </Typography>
                <FormControl fullWidth sx={fieldSx}>
                  <Select value={form.hospitalName} onChange={handleChange("hospitalName")}
                    displayEmpty sx={{ borderRadius: "10px" }}>
                    <MenuItem value="" disabled><Box component="em" sx={{ color: "text.secondary" }}>Select hospital…</Box></MenuItem>
                    {["Calmette Hospital","Royal Phnom Penh Hospital","National Blood Transfusion Center",
                      "Khmer Soviet Friendship Hospital","Angkor Hospital for Children","Battambang Provincial Hospital"]
                      .map(h => <MenuItem key={h} value={h}>{h}</MenuItem>)}
                  </Select>
                </FormControl>

                <Typography variant="caption" fontWeight={700} color="text.secondary" mb={0.8} display="block"
                  sx={{ textTransform: "uppercase", letterSpacing: "0.06em", fontSize: "0.68rem" }}>
                  Patient Name
                </Typography>
                <TextField fullWidth placeholder="Enter patient full name" value={form.patientName}
                  onChange={handleChange("patientName")} sx={fieldSx} />

                <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 2, mb: 2.5 }}>
                  {[
                    { key: "bloodType",   label: "Blood Type", placeholder: "Type", options: BLOOD_TYPES.map(bt => ({ v: bt, label: bt, color: "#dc2626" })) },
                    { key: "unitsNeeded", label: "Units",      placeholder: "Qty",  options: UNITS.map(u => ({ v: u, label: u })) },
                    { key: "urgency",     label: "Urgency",    placeholder: "Level",options: URGENCY_LEVELS.map(u => ({ v: u, label: u, color: URGENCY_STYLES[u].color })) },
                  ].map(({ key, label, placeholder, options }) => (
                    <Box key={key}>
                      <Typography variant="caption" fontWeight={700} color="text.secondary" mb={0.8} display="block"
                        sx={{ textTransform: "uppercase", letterSpacing: "0.06em", fontSize: "0.68rem" }}>
                        {label}
                      </Typography>
                      <FormControl fullWidth>
                        <Select value={form[key]} onChange={handleChange(key)} displayEmpty sx={{ borderRadius: "10px" }}>
                          <MenuItem value="" disabled>
                            <Box component="em" sx={{ color: "text.secondary", fontSize: "0.85rem" }}>{placeholder}</Box>
                          </MenuItem>
                          {options.map(o => (
                            <MenuItem key={o.v} value={o.v}>
                              <Typography fontWeight={700} sx={{ color: o.color }}>{o.label}</Typography>
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    </Box>
                  ))}
                </Box>

                {selectedUrgency && (
                  <Box sx={{
                    display: "flex", alignItems: "center", gap: 1.2,
                    px: 1.8, py: 1, borderRadius: "10px", mb: 2.5,
                    bgcolor: isDark ? `${selectedUrgency.color}12` : selectedUrgency.bg,
                    border: `1px solid ${selectedUrgency.border}`,
                  }}>
                    <Box sx={{ width: 7, height: 7, borderRadius: "50%", bgcolor: selectedUrgency.color, flexShrink: 0 }} />
                    <Typography variant="caption" fontWeight={700} sx={{ color: selectedUrgency.color }}>
                      {form.urgency} priority selected
                      {form.urgency === "Critical" && " — our team will respond immediately"}
                      {form.urgency === "High"     && " — response within 24 hours"}
                      {form.urgency === "Medium"   && " — response within 48 hours"}
                      {form.urgency === "Low"      && " — response within a week"}
                    </Typography>
                  </Box>
                )}

                <Typography variant="caption" fontWeight={700} color="text.secondary" mb={0.8} display="block"
                  sx={{ textTransform: "uppercase", letterSpacing: "0.06em", fontSize: "0.68rem" }}>
                  Reason for Request
                </Typography>
                <TextField fullWidth multiline rows={3}
                  placeholder="Describe the patient's condition and why blood is needed…"
                  value={form.reason} onChange={handleChange("reason")} sx={fieldSx} />

                <Typography variant="caption" fontWeight={700} color="text.secondary" mb={0.8} display="block"
                  sx={{ textTransform: "uppercase", letterSpacing: "0.06em", fontSize: "0.68rem" }}>
                  Contact / Notes <Box component="span" sx={{ fontWeight: 400, textTransform: "none" }}>(Optional)</Box>
                </Typography>
                <TextField fullWidth multiline rows={2}
                  placeholder="Contact number, special instructions…"
                  value={form.notes} onChange={handleChange("notes")} sx={fieldSx} />

                <Button type="submit" variant="contained" fullWidth disabled={loading}
                  sx={{
                    mt: 0.5, py: 1.6, borderRadius: "100px", fontWeight: 700, fontSize: "0.95rem",
                    background: "linear-gradient(135deg, #dc2626 0%, #991b1b 100%)",
                    boxShadow: "0 4px 20px rgba(220,38,38,0.4)",
                    "&:hover": {
                      background: "linear-gradient(135deg, #b91c1c 0%, #7f1d1d 100%)",
                      boxShadow: "0 8px 30px rgba(220,38,38,0.5)",
                      transform: "translateY(-1px)",
                    },
                    "&.Mui-disabled": { background: isDark ? "#1f1f1f" : "#e5e5e5" },
                    transition: "all 0.22s ease",
                    display: "flex", gap: 1, alignItems: "center",
                  }}>
                  <FavoriteIcon sx={{ fontSize: 18 }} />
                  {loading ? "Submitting…" : "Submit Request"}
                </Button>

                <Typography variant="caption" color="text.disabled" display="block" textAlign="center" mt={2} lineHeight={1.6}>
                  By submitting, you confirm the information is accurate and pertains to a genuine medical need.
                </Typography>
              </Box>
            </Paper>
          </Box>
        )}

        {/* ── TAB 1: Active Requests Board ── */}
        {pageTab === 1 && (
          <Box>
            {/* Filters */}
            <Box display="flex" gap={1.5} mb={3} flexWrap="wrap" alignItems="center">
              <Typography fontWeight={600} fontSize="0.85rem" color="text.secondary" mr={0.5}>Filter:</Typography>
              <FormControl size="small" sx={{ minWidth: 120 }}>
                <Select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
                  displayEmpty sx={{ borderRadius: 2, fontSize: "0.85rem" }}>
                  <MenuItem value="All">All Status</MenuItem>
                  <MenuItem value="Pending">Pending</MenuItem>
                  <MenuItem value="Approved">Approved</MenuItem>
                  <MenuItem value="Rejected">Rejected</MenuItem>
                </Select>
              </FormControl>
              <FormControl size="small" sx={{ minWidth: 120 }}>
                <Select value={filterType} onChange={e => setFilterType(e.target.value)}
                  displayEmpty sx={{ borderRadius: 2, fontSize: "0.85rem" }}>
                  <MenuItem value="All">All Blood Types</MenuItem>
                  {BLOOD_TYPES.map(bt => <MenuItem key={bt} value={bt}>{bt}</MenuItem>)}
                </Select>
              </FormControl>
              <Button size="small" variant="outlined" color="error"
                onClick={fetchRequests} disabled={reqLoading}
                sx={{ textTransform: "none", borderRadius: 2, fontWeight: 600 }}>
                Refresh
              </Button>
              <Typography variant="caption" color="text.secondary" ml="auto">
                {filteredRequests.length} request{filteredRequests.length !== 1 ? "s" : ""}
              </Typography>
            </Box>

            {reqLoading ? (
              <Grid container spacing={2}>
                {[...Array(6)].map((_, i) => (
                  <Grid item xs={12} sm={6} md={4} key={i}>
                    <Skeleton variant="rounded" height={200} sx={{ borderRadius: 3 }} />
                  </Grid>
                ))}
              </Grid>
            ) : filteredRequests.length === 0 ? (
              <Box textAlign="center" py={10}>
                <BloodtypeIcon sx={{ fontSize: 56, color: "text.disabled", mb: 2 }} />
                <Typography fontWeight={700} color="text.secondary">No requests found</Typography>
                <Typography variant="caption" color="text.disabled">Try adjusting the filters above</Typography>
              </Box>
            ) : (
              <Grid container spacing={2}>
                {filteredRequests.map(req => {
                  const urgStyle = URGENCY_STYLES[req.urgency] || URGENCY_STYLES.Low;
                  const stMeta   = STATUS_META[req.status]   || STATUS_META.Pending;
                  return (
                    <Grid item xs={12} sm={6} md={4} key={req._id}>
                      <Paper elevation={0} sx={{
                        borderRadius: 3, border: `1px solid ${isDark ? "#1f1f1f" : "#e5e5e5"}`,
                        bgcolor: cardBg, overflow: "hidden",
                        transition: "transform 0.18s, box-shadow 0.18s",
                        "&:hover": { transform: "translateY(-2px)", boxShadow: isDark ? "0 8px 32px rgba(0,0,0,0.4)" : "0 8px 32px rgba(0,0,0,0.1)" },
                      }}>
                        {/* Top urgency bar */}
                        <Box sx={{ height: 4, bgcolor: urgStyle.color }} />

                        <Box sx={{ p: 2.5 }}>
                          {/* Header */}
                          <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={2}>
                            <Box display="flex" alignItems="center" gap={1.5}>
                              <Avatar sx={{ bgcolor: "#b71c1c", width: 42, height: 42, fontSize: "1rem", fontWeight: 800 }}>
                                {req.patientName?.charAt(0)?.toUpperCase()}
                              </Avatar>
                              <Box>
                                <Typography fontWeight={700} fontSize="0.88rem" lineHeight={1.2}>
                                  {req.patientName}
                                </Typography>
                                <Typography fontSize="0.72rem" color="text.secondary">
                                  {req.hospitalName}
                                </Typography>
                              </Box>
                            </Box>
                            <Chip
                              label={req.bloodType}
                              size="small"
                              sx={{
                                bgcolor: isDark ? "rgba(220,38,38,0.15)" : "#fff0f0",
                                color: "#dc2626", fontWeight: 800, fontSize: "0.8rem",
                              }} />
                          </Box>

                          <Divider sx={{ borderColor: isDark ? "#1f1f1f" : "#f0f0f0", mb: 2 }} />

                          {/* Details */}
                          <Box display="flex" flexDirection="column" gap={0.8} mb={2}>
                            <Box display="flex" justifyContent="space-between" alignItems="center">
                              <Typography fontSize="0.75rem" color="text.secondary" fontWeight={500}>Urgency</Typography>
                              <Chip label={req.urgency} size="small"
                                sx={{ fontSize: "0.7rem", fontWeight: 700,
                                  bgcolor: isDark ? `${urgStyle.color}18` : urgStyle.bg,
                                  color: urgStyle.color }} />
                            </Box>
                            <Box display="flex" justifyContent="space-between" alignItems="center">
                              <Typography fontSize="0.75rem" color="text.secondary" fontWeight={500}>Units needed</Typography>
                              <Typography fontSize="0.82rem" fontWeight={700}>{req.unitsNeeded || 1} unit{req.unitsNeeded !== 1 ? "s" : ""}</Typography>
                            </Box>
                            <Box display="flex" justifyContent="space-between" alignItems="center">
                              <Typography fontSize="0.75rem" color="text.secondary" fontWeight={500}>Status</Typography>
                              <Chip
                                icon={stMeta.icon}
                                label={stMeta.label}
                                size="small"
                                sx={{
                                  fontSize: "0.7rem", fontWeight: 700,
                                  bgcolor: isDark ? stMeta.darkBg : stMeta.lightBg,
                                  color: stMeta.color,
                                  "& .MuiChip-icon": { color: stMeta.color },
                                }} />
                            </Box>
                          </Box>

                          {req.reason && (
                            <Typography fontSize="0.78rem" color="text.secondary" lineHeight={1.5}
                              sx={{ display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                              {req.reason}
                            </Typography>
                          )}

                          <Box display="flex" alignItems="center" gap={0.6} mt={1.5}>
                            <AccessTimeIcon sx={{ fontSize: 13, color: "text.disabled" }} />
                            <Typography fontSize="0.7rem" color="text.disabled">
                              {req.createdAt ? new Date(req.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "—"}
                            </Typography>
                          </Box>
                        </Box>
                      </Paper>
                    </Grid>
                  );
                })}
              </Grid>
            )}
          </Box>
        )}
      </Container>
    </Box>
  );
}
