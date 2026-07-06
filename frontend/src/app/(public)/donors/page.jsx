'use client';
import React, { useEffect, useState } from "react";
import {
  Container, Typography, Box, Chip, Avatar, Paper,
  TextField, MenuItem, InputAdornment, Button,
  Dialog, DialogTitle, DialogContent, DialogActions,
  useTheme, CircularProgress,
} from "@mui/material";
import BloodtypeIcon from "@mui/icons-material/Bloodtype";
import LocationOnIcon from "@mui/icons-material/LocationOn";
import CalendarTodayIcon from "@mui/icons-material/CalendarToday";
import PeopleIcon from "@mui/icons-material/People";
import SearchIcon from "@mui/icons-material/Search";
import axios from "axios";
import API_BASE from "@/lib/config";
import { formatDistanceToNow } from "date-fns";

const HERO_IMG =
  "https://images.unsplash.com/photo-1576091160550-2173dba999ef?auto=format&fit=crop&w=1920&q=80";

const BLOOD_TYPES = ["All", "A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];
const ITEMS_PER_PAGE = 6;

const formatDate = (date) => {
  if (!date || isNaN(new Date(date).getTime())) return "N/A";
  return formatDistanceToNow(new Date(date), { addSuffix: true });
};

const BLOOD_COLORS = {
  "A+": "#b71c1c", "A-": "#c62828", "B+": "#ad1457", "B-": "#880e4f",
  "AB+": "#6a1b9a", "AB-": "#4a148c", "O+": "#1565c0", "O-": "#0d47a1",
};

const DonorList = () => {
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";
  const [donors, setDonors] = useState([]);
  const [selectedType, setSelectedType] = useState("All");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [selectedDonor, setSelectedDonor] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios.get(`${API_BASE}/api/donors`)
      .then((res) => setDonors(res.data))
      .catch((err) => console.error("Failed to fetch donors:", err))
      .finally(() => setLoading(false));
  }, []);

  const filtered = donors.filter((d) => {
    const matchType = selectedType === "All" || d.bloodType === selectedType;
    const matchSearch = !search || d.fullName?.toLowerCase().includes(search.toLowerCase()) || d.location?.toLowerCase().includes(search.toLowerCase());
    return matchType && matchSearch;
  });

  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);
  const paginated = filtered.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);
  const availableCount = donors.filter((d) => d.available).length;

  const handleTypeChange = (val) => { setSelectedType(val); setPage(1); };
  const handleSearchChange = (e) => { setSearch(e.target.value); setPage(1); };

  return (
    <Box sx={{ backgroundColor: isDark ? "#121212" : "#f4f4f4" }}>

      {/* ── Hero ────────────────────────────────────────────────────────────── */}
      <Box sx={{
        position: "relative",
        minHeight: { xs: "68vh", md: "76vh" },
        display: "flex", flexDirection: "column",
        alignItems: "center", justifyContent: "center", textAlign: "center",
        backgroundImage: `url('${HERO_IMG}')`,
        backgroundSize: "cover", backgroundPosition: "center",
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
            icon={<PeopleIcon sx={{ color: "white !important", fontSize: "18px !important" }} />}
            label="Verified Donor Network"
            sx={{ backgroundColor: "rgba(255,255,255,0.15)", color: "white", fontWeight: 700, mb: 3, backdropFilter: "blur(4px)", fontSize: "0.82rem" }}
          />
          <Typography variant="h2" fontWeight={800} color="white"
            sx={{ lineHeight: 1.12, mb: 2, fontSize: { xs: "2.4rem", md: "3.6rem" }, textShadow: "0 2px 24px rgba(0,0,0,0.6)" }}>
            Find a Donor
          </Typography>
          <Typography variant="h5" sx={{ color: "#ffcdd2", fontWeight: 700, mb: 2.5, fontSize: { xs: "1.1rem", md: "1.4rem" } }}>
            Every donor here is a potential lifesaver.
          </Typography>
          <Typography variant="h6" sx={{
            color: "rgba(255,255,255,0.82)", maxWidth: 520, mx: "auto",
            lineHeight: 1.8, fontWeight: 400, fontSize: { xs: "1rem", md: "1.1rem" },
          }}>
            Browse our network of registered blood donors. Filter by blood type or
            search by name to find the right match quickly.
          </Typography>

          {/* Live stats */}
          <Box sx={{ display: "flex", justifyContent: "center", flexWrap: "wrap", gap: { xs: 2, md: 3 }, mt: 6 }}>
            {[
              { value: loading ? "…" : donors.length, label: "Registered Donors" },
              { value: loading ? "…" : availableCount, label: "Available Now" },
              { value: "8", label: "Blood Types" },
              { value: "50+", label: "Partner Hospitals" },
            ].map((s, i) => (
              <Box key={i} sx={{
                textAlign: "center", px: { xs: 2, md: 3 }, py: 1.5,
                backgroundColor: "rgba(255,255,255,0.10)",
                backdropFilter: "blur(8px)",
                border: "1px solid rgba(255,255,255,0.18)",
                borderRadius: 3, minWidth: 110,
              }}>
                <Typography variant="h6" fontWeight={800} color="white">{s.value}</Typography>
                <Typography variant="caption" sx={{ color: "rgba(255,255,255,0.75)", fontWeight: 600 }}>{s.label}</Typography>
              </Box>
            ))}
          </Box>
        </Box>
      </Box>

      {/* ── Filter Bar ──────────────────────────────────────────────────────── */}
      <Container maxWidth="lg" sx={{ py: 6 }}>
        <Paper elevation={0} sx={{
          p: 3, borderRadius: 4,
          backgroundColor: isDark ? "#1a1a1a" : "#fff",
          border: `1px solid ${isDark ? "#2a2a2a" : "#efefef"}`,
          boxShadow: isDark ? "none" : "0 4px 24px rgba(0,0,0,0.06)",
          display: "flex", flexWrap: "wrap", gap: 2, alignItems: "center",
        }}>
          <TextField
            placeholder="Search by name or location…"
            value={search}
            onChange={handleSearchChange}
            size="small"
            sx={{ flex: "1 1 240px", "& .MuiOutlinedInput-root": { borderRadius: 2.5 } }}
            InputProps={{
              startAdornment: <InputAdornment position="start"><SearchIcon sx={{ color: "text.disabled" }} /></InputAdornment>,
            }}
          />
          <TextField
            select label="Blood Type" value={selectedType}
            onChange={(e) => handleTypeChange(e.target.value)}
            size="small"
            sx={{ flex: "0 0 180px", "& .MuiOutlinedInput-root": { borderRadius: 2.5 } }}
            InputProps={{
              startAdornment: <InputAdornment position="start"><BloodtypeIcon color="error" sx={{ fontSize: 18 }} /></InputAdornment>,
            }}
          >
            {BLOOD_TYPES.map((t) => <MenuItem key={t} value={t}>{t}</MenuItem>)}
          </TextField>

          <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
            {BLOOD_TYPES.filter((t) => t !== "All").map((t) => (
              <Chip key={t} label={t} size="small" clickable
                onClick={() => handleTypeChange(t)}
                variant={selectedType === t ? "filled" : "outlined"}
                sx={{
                  fontWeight: 700, fontSize: "0.78rem",
                  ...(selectedType === t
                    ? { backgroundColor: BLOOD_COLORS[t] || "#b71c1c", color: "white", borderColor: "transparent" }
                    : { borderColor: isDark ? "#444" : "#ddd" }),
                }}
              />
            ))}
          </Box>

          {(selectedType !== "All" || search) && (
            <Button size="small" color="error" onClick={() => { handleTypeChange("All"); setSearch(""); }}>
              Clear
            </Button>
          )}

          <Typography variant="body2" color="text.secondary" sx={{ ml: "auto" }}>
            {filtered.length} donor{filtered.length !== 1 ? "s" : ""} found
          </Typography>
        </Paper>

        {/* ── Donor Cards ─────────────────────────────────────────────────── */}
        <Box sx={{ mt: 4 }}>
          {loading ? (
            <Box display="flex" justifyContent="center" py={10}>
              <CircularProgress color="error" size={48} />
            </Box>
          ) : paginated.length === 0 ? (
            <Paper elevation={0} sx={{
              py: 10, textAlign: "center", borderRadius: 4,
              backgroundColor: isDark ? "#1a1a1a" : "#fff",
              border: `1px solid ${isDark ? "#2a2a2a" : "#efefef"}`,
            }}>
              <BloodtypeIcon sx={{ fontSize: 56, color: "text.disabled", mb: 2 }} />
              <Typography variant="h6" color="text.secondary" fontWeight={600}>
                {selectedType !== "All" ? `No donors found for blood type ${selectedType}` : "No donors registered yet."}
              </Typography>
              <Typography variant="body2" color="text.disabled" mt={1}>
                Try a different filter or check back later.
              </Typography>
            </Paper>
          ) : (
            <Box sx={{
              display: "grid",
              gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr", md: "1fr 1fr 1fr" },
              gap: 3,
            }}>
              {paginated.map((donor, i) => {
                const btColor = BLOOD_COLORS[donor.bloodType] || "#b71c1c";
                const initials = donor.fullName?.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase();
                return (
                  <Paper key={i} elevation={0} sx={{
                    borderRadius: 4, overflow: "hidden",
                    backgroundColor: isDark ? "#1a1a1a" : "#fff",
                    border: `1px solid ${isDark ? "#2a2a2a" : "#efefef"}`,
                    boxShadow: isDark ? "none" : "0 2px 16px rgba(0,0,0,0.05)",
                    transition: "all 0.25s ease",
                    "&:hover": {
                      transform: "translateY(-5px)",
                      boxShadow: `0 12px 40px ${btColor}28`,
                      borderColor: `${btColor}55`,
                    },
                  }}>
                    {/* Color top strip */}
                    <Box sx={{ height: 5, background: `linear-gradient(90deg, ${btColor} 0%, ${btColor}88 100%)` }} />

                    <Box sx={{ p: 3 }}>
                      {/* Avatar + name */}
                      <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 2.5 }}>
                        <Box sx={{ position: "relative", flexShrink: 0 }}>
                          <Avatar
                            src={donor.photo ? `${API_BASE}${donor.photo}` : undefined}
                            sx={{
                              width: 56, height: 56, fontWeight: 800, fontSize: "1.1rem",
                              background: `linear-gradient(135deg, ${btColor} 0%, ${btColor}cc 100%)`,
                              boxShadow: `0 4px 12px ${btColor}44`,
                            }}
                          >
                            {initials}
                          </Avatar>
                          {/* Blood type badge */}
                          <Box sx={{
                            position: "absolute", bottom: -4, right: -4,
                            backgroundColor: btColor, color: "white",
                            borderRadius: 1, px: 0.6, py: 0.1,
                            fontSize: "0.6rem", fontWeight: 800,
                            border: "2px solid white",
                            lineHeight: 1.4,
                          }}>
                            {donor.bloodType}
                          </Box>
                        </Box>
                        <Box sx={{ minWidth: 0 }}>
                          <Typography variant="subtitle1" fontWeight={700} noWrap>{donor.fullName}</Typography>
                          <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, mt: 0.3 }}>
                            <LocationOnIcon sx={{ fontSize: 13, color: "text.disabled" }} />
                            <Typography variant="caption" color="text.secondary" noWrap>{donor.location || "Unknown"}</Typography>
                          </Box>
                        </Box>
                      </Box>

                      {/* Info row */}
                      <Box sx={{ display: "flex", flexDirection: "column", gap: 1, mb: 2.5 }}>
                        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                          <CalendarTodayIcon sx={{ fontSize: 14, color: "text.disabled" }} />
                          <Typography variant="caption" color="text.secondary">
                            Last donation: <strong>{formatDate(donor.lastDonation)}</strong>
                          </Typography>
                        </Box>
                        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                          <Box sx={{ width: 8, height: 8, borderRadius: "50%", backgroundColor: donor.available ? "#2e7d32" : "#9e9e9e", flexShrink: 0 }} />
                          <Typography variant="caption" fontWeight={600} sx={{ color: donor.available ? "#2e7d32" : "text.disabled" }}>
                            {donor.available ? "Available to donate" : "Currently unavailable"}
                          </Typography>
                        </Box>
                      </Box>

                      <Button fullWidth variant="outlined" size="small"
                        onClick={() => setSelectedDonor(donor)}
                        sx={{
                          borderRadius: 2.5, fontWeight: 700, borderColor: btColor, color: btColor,
                          "&:hover": { backgroundColor: btColor, color: "white", borderColor: btColor },
                          transition: "all 0.2s",
                        }}>
                        View Details
                      </Button>
                    </Box>
                  </Paper>
                );
              })}
            </Box>
          )}
        </Box>

        {/* ── Pagination ──────────────────────────────────────────────────── */}
        {totalPages > 1 && (
          <Box mt={6} display="flex" justifyContent="center" alignItems="center" gap={1} flexWrap="wrap">
            <Button onClick={() => setPage(1)} disabled={page === 1} variant="outlined" color="error" size="small" sx={{ borderRadius: 2, minWidth: 36 }}>«</Button>
            <Button onClick={() => setPage((p) => Math.max(p - 1, 1))} disabled={page === 1} variant="outlined" color="error" size="small" sx={{ borderRadius: 2, minWidth: 36 }}>‹</Button>
            {[...Array(totalPages)].map((_, i) => (
              <Button key={i + 1} onClick={() => setPage(i + 1)}
                variant={page === i + 1 ? "contained" : "outlined"} color="error" size="small"
                sx={{ borderRadius: 2, minWidth: 36, fontWeight: 700,
                  ...(page === i + 1 ? { background: "linear-gradient(135deg, #b71c1c 0%, #d32f2f 100%)" } : {}),
                }}>
                {i + 1}
              </Button>
            ))}
            <Button onClick={() => setPage((p) => Math.min(p + 1, totalPages))} disabled={page === totalPages} variant="outlined" color="error" size="small" sx={{ borderRadius: 2, minWidth: 36 }}>›</Button>
            <Button onClick={() => setPage(totalPages)} disabled={page === totalPages} variant="outlined" color="error" size="small" sx={{ borderRadius: 2, minWidth: 36 }}>»</Button>
          </Box>
        )}
      </Container>

      {/* ── Donor Detail Dialog ──────────────────────────────────────────────── */}
      {selectedDonor && (() => {
        const btColor = BLOOD_COLORS[selectedDonor.bloodType] || "#b71c1c";
        return (
          <Dialog open onClose={() => setSelectedDonor(null)} maxWidth="sm" fullWidth
            slotProps={{ paper: { sx: { borderRadius: 4, overflow: "hidden" } }}}>
            <Box sx={{ height: 6, background: `linear-gradient(90deg, ${btColor} 0%, ${btColor}88 100%)` }} />
            <DialogTitle sx={{ pt: 3 }}>
              <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                <Avatar
                  src={selectedDonor.photo ? `${API_BASE}${selectedDonor.photo}` : undefined}
                  sx={{
                    width: 64, height: 64, fontWeight: 800, fontSize: "1.4rem",
                    background: `linear-gradient(135deg, ${btColor} 0%, ${btColor}cc 100%)`,
                    boxShadow: `0 6px 20px ${btColor}44`,
                  }}>
                  {selectedDonor.fullName?.charAt(0)?.toUpperCase()}
                </Avatar>
                <Box>
                  <Typography variant="h6" fontWeight={800}>{selectedDonor.fullName}</Typography>
                  <Chip label={selectedDonor.bloodType} size="small"
                    sx={{ backgroundColor: btColor, color: "white", fontWeight: 800, mt: 0.5 }} />
                </Box>
              </Box>
            </DialogTitle>
            <DialogContent dividers>
              <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                {[
                  { label: "Phone", value: selectedDonor.phone || "Not provided" },
                  { label: "Email", value: selectedDonor.email || "Not provided" },
                  { label: "Location", value: selectedDonor.location },
                  { label: "Last Donation", value: formatDate(selectedDonor.lastDonation) },
                ].map((item) => (
                  <Box key={item.label} sx={{
                    display: "flex", justifyContent: "space-between", alignItems: "center",
                    p: 1.5, borderRadius: 2,
                    backgroundColor: isDark ? "#2a2a2a" : "#f8f8f8",
                  }}>
                    <Typography variant="body2" color="text.secondary" fontWeight={600}>{item.label}</Typography>
                    <Typography variant="body2" fontWeight={700}>{item.value}</Typography>
                  </Box>
                ))}
                <Box sx={{
                  display: "flex", justifyContent: "space-between", alignItems: "center",
                  p: 1.5, borderRadius: 2,
                  backgroundColor: isDark ? "#2a2a2a" : "#f8f8f8",
                }}>
                  <Typography variant="body2" color="text.secondary" fontWeight={600}>Availability</Typography>
                  <Chip
                    label={selectedDonor.available ? "Available" : "Unavailable"}
                    size="small"
                    sx={{
                      fontWeight: 700,
                      backgroundColor: selectedDonor.available ? "#e8f5e9" : "#f5f5f5",
                      color: selectedDonor.available ? "#2e7d32" : "#9e9e9e",
                    }}
                  />
                </Box>
              </Box>
            </DialogContent>
            <DialogActions sx={{ px: 3, py: 2 }}>
              <Button onClick={() => setSelectedDonor(null)} variant="outlined"
                sx={{ borderRadius: 2.5, fontWeight: 700, borderColor: btColor, color: btColor,
                  "&:hover": { backgroundColor: btColor, color: "white" } }}>
                Close
              </Button>
            </DialogActions>
          </Dialog>
        );
      })()}

    </Box>
  );
};

export default DonorList;
