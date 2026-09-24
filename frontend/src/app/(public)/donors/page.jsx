'use client';
import Link from 'next/link';
import Image from 'next/image';
import { useEffect, useMemo, useState } from "react";
import {
  Container, Typography, Box, Chip, Avatar, Paper, TextField, MenuItem, InputAdornment,
  Button, Dialog, DialogTitle, DialogContent, DialogActions, useTheme, CircularProgress,
} from "@mui/material";
import BloodtypeIcon from "@mui/icons-material/Bloodtype";
import WaterDropIcon from "@mui/icons-material/WaterDrop";
import LocationOnIcon from "@mui/icons-material/LocationOn";
import CalendarTodayIcon from "@mui/icons-material/CalendarToday";
import PeopleIcon from "@mui/icons-material/People";
import LocalHospitalIcon from "@mui/icons-material/LocalHospital";
import FavoriteIcon from "@mui/icons-material/Favorite";
import SearchIcon from "@mui/icons-material/Search";
import SortIcon from "@mui/icons-material/Sort";
import VisibilityIcon from "@mui/icons-material/Visibility";
import ForumIcon from "@mui/icons-material/Forum";
import axios from "axios";
import API_BASE from "@/lib/config";
import { formatDistanceToNow } from "date-fns";
import { script } from '@/lib/fonts';

const HERO_IMG =
  "https://images.unsplash.com/photo-1615461066841-6116e61058f4?auto=format&fit=crop&w=1200&q=80";

const BLOOD_TYPES = ["All", "A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];
const ITEMS_PER_PAGE = 6;

const SORT_OPTIONS = [
  { value: "recent", label: "Recently Registered" },
  { value: "name", label: "Name (A–Z)" },
  { value: "donations", label: "Most Donations" },
  { value: "lastDonation", label: "Recently Donated" },
];

const formatDate = (date) => {
  if (!date || isNaN(new Date(date).getTime())) return "N/A";
  return formatDistanceToNow(new Date(date), { addSuffix: true });
};

const BLOOD_COLORS = {
  "A+": "#b71c1c", "A-": "#c62828", "B+": "#ad1457", "B-": "#880e4f",
  "AB+": "#6a1b9a", "AB-": "#4a148c", "O+": "#1565c0", "O-": "#0d47a1",
};

const sortDonors = (list, sortBy) => {
  const sorted = [...list];
  switch (sortBy) {
    case "name":
      return sorted.sort((a, b) => (a.fullName || "").localeCompare(b.fullName || ""));
    case "donations":
      return sorted.sort((a, b) => (b.donationCount || 0) - (a.donationCount || 0));
    case "lastDonation":
      return sorted.sort((a, b) => new Date(b.lastDonation || 0) - new Date(a.lastDonation || 0));
    case "recent":
    default:
      return sorted.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
  }
};

const DonorList = () => {
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";
  const [donors, setDonors] = useState([]);
  const [selectedType, setSelectedType] = useState("All");
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState("recent");
  const [page, setPage] = useState(1);
  const [selectedDonor, setSelectedDonor] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios.get(`${API_BASE}/api/donors`)
      .then((res) => setDonors(Array.isArray(res.data) ? res.data : []))
      .catch((err) => console.error("Failed to fetch donors:", err))
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return sortDonors(
      donors.filter((d) => {
        const matchType = selectedType === "All" || d.bloodType === selectedType;
        const matchSearch = !q || d.fullName?.toLowerCase().includes(q) || d.location?.toLowerCase().includes(q);
        return matchType && matchSearch;
      }),
      sortBy
    );
  }, [donors, selectedType, search, sortBy]);

  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);
  const paginated = useMemo(
    () => filtered.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE),
    [filtered, page]
  );
  const availableCount = useMemo(() => donors.filter((d) => d.available).length, [donors]);

  const handleTypeChange = (val) => { setSelectedType(val); setPage(1); };
  const handleSearchChange = (e) => { setSearch(e.target.value); setPage(1); };

  const heroStats = [
    { icon: <PeopleIcon />, value: loading ? "…" : donors.length, label: "Registered Donors", color: "#b71c1c" },
    { icon: <BloodtypeIcon />, value: loading ? "…" : availableCount, label: "Available Now", color: "#ad1457" },
    { icon: <WaterDropIcon />, value: "8", label: "Blood Types", color: "#6a1b9a" },
    { icon: <LocalHospitalIcon />, value: "50+", label: "Partner Hospitals", color: "#1565c0" },
  ];

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
          position: "absolute", left: "-10%", top: "-25%", width: 480, height: 480, borderRadius: "50%",
          background: `radial-gradient(circle, ${isDark ? "rgba(183,28,28,0.10)" : "rgba(198,40,40,0.08)"} 0%, transparent 68%)`,
          pointerEvents: "none",
        }} />
        <Box aria-hidden="true" sx={{
          position: "absolute", left: "-8%", bottom: "-30%", width: 380, height: 380, borderRadius: "50%",
          background: `radial-gradient(circle, ${isDark ? "rgba(183,28,28,0.08)" : "rgba(198,40,40,0.06)"} 0%, transparent 70%)`,
          pointerEvents: "none",
        }} />

        <Container maxWidth="lg" sx={{ position: "relative", py: { xs: 7, md: 9 } }}>
          <Box sx={{
            display: "grid",
            gridTemplateColumns: { xs: "1fr", md: "1.1fr 0.9fr" },
            gap: { xs: 5, md: 7 },
            alignItems: "center",
          }}>
            {/* Left: copy */}
            <Box>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 2 }}>
                <Typography variant="overline" color="error" fontWeight={700} letterSpacing="0.12em">
                  Verified Donor Network
                </Typography>
                <Box sx={{ width: 36, height: 3, borderRadius: 2, backgroundColor: "error.main" }} />
              </Box>
              <Typography sx={{
                fontWeight: 800, lineHeight: 1.1, mb: 1.5,
                fontSize: { xs: "2.4rem", md: "3rem" },
                color: isDark ? "#fff" : "#161a23",
              }}>
                Find a <Box component="span" sx={{ color: "error.main" }}>Donor</Box>
              </Typography>
              <Typography sx={{
                fontWeight: 700, mb: 2, fontSize: { xs: "1.1rem", md: "1.25rem" },
                color: isDark ? "#fff" : "#161a23",
              }}>
                Every donor here is a potential lifesaver.
              </Typography>
              <Typography color="text.secondary" sx={{ fontSize: "1.02rem", lineHeight: 1.7, maxWidth: 460, mb: 4 }}>
                Browse our network of registered blood donors. Filter by blood type
                or search by name to find the right match quickly.
              </Typography>

              <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr 1fr", sm: "repeat(4, 1fr)" }, gap: 1.5 }}>
                {heroStats.map((s) => (
                  <Paper key={s.label} elevation={0} sx={{
                    p: 1.75, borderRadius: 3, display: "flex", alignItems: "center", gap: 1.25,
                    backgroundColor: isDark ? "#1a1a1a" : "#fff",
                    border: `1px solid ${isDark ? "#2a2a2a" : "#efefef"}`,
                  }}>
                    <Box sx={{
                      width: 38, height: 38, borderRadius: 2, flexShrink: 0,
                      backgroundColor: isDark ? `${s.color}33` : `${s.color}18`,
                      color: s.color,
                      display: "flex", alignItems: "center", justifyContent: "center",
                      "& svg": { fontSize: 19 },
                    }}>
                      {s.icon}
                    </Box>
                    <Box sx={{ minWidth: 0 }}>
                      <Typography fontWeight={800} sx={{ fontSize: "1.15rem", lineHeight: 1.15 }}>{s.value}</Typography>
                      <Typography variant="caption" color="text.secondary" sx={{ fontSize: "0.68rem", lineHeight: 1.2, display: "block" }} noWrap>
                        {s.label}
                      </Typography>
                    </Box>
                  </Paper>
                ))}
              </Box>
            </Box>

            {/* Right: photo */}
            <Box sx={{ justifySelf: { xs: "center", md: "end" }, width: "100%", maxWidth: 440 }}>
              <Typography className={script.className} sx={{
                fontSize: "1.7rem", lineHeight: 1.25, color: "error.main",
                transform: "rotate(-4deg)", textAlign: "right", pr: 1, mb: 1,
              }}>
                Small Donors<br />Big Impact ♥
              </Typography>

              <Box sx={{ position: "relative" }}>
                <Box sx={{
                  position: "relative", borderRadius: 5, overflow: "hidden",
                  boxShadow: "0 20px 50px rgba(0,0,0,0.25)",
                  aspectRatio: "4 / 5",
                }}>
                  <Image src={HERO_IMG} alt="Hands holding a heart, representing blood donation" fill
                    sizes="(max-width: 900px) 100vw, 440px" style={{ objectFit: "cover" }} priority
                  />
                  <Box sx={{
                    position: "absolute", top: "50%", left: "50%", zIndex: 2,
                    transform: "translate(-50%, -50%)",
                    display: "flex", flexDirection: "column", alignItems: "center",
                    width: 168, height: 168, borderRadius: "50%",
                    background: "linear-gradient(135deg, #b71c1c 0%, #7f0000 100%)",
                    boxShadow: "0 16px 40px rgba(0,0,0,0.4)",
                    border: `5px solid ${isDark ? "#121212" : "#fdf3f3"}`,
                    justifyContent: "center", textAlign: "center", color: "white",
                  }}>
                    <WaterDropIcon sx={{ fontSize: 34, mb: 0.5 }} />
                    <Typography sx={{ fontWeight: 800, fontSize: "0.95rem", lineHeight: 1.25 }}>Donate Blood</Typography>
                    <Typography sx={{ fontWeight: 800, fontSize: "0.95rem", lineHeight: 1.25 }}>Save Lives</Typography>
                  </Box>
                </Box>
              </Box>
            </Box>
          </Box>
        </Container>
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
            placeholder="Search by name, city, or location…"
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
            sx={{ flex: "0 0 160px", "& .MuiOutlinedInput-root": { borderRadius: 2.5 } }}
            InputProps={{
              startAdornment: <InputAdornment position="start"><BloodtypeIcon color="error" sx={{ fontSize: 18 }} /></InputAdornment>,
            }}
          >
            {BLOOD_TYPES.map((t) => <MenuItem key={t} value={t}>{t}</MenuItem>)}
          </TextField>

          <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
            {BLOOD_TYPES.map((t) => (
              <Chip key={t} label={t} size="small" clickable
                onClick={() => handleTypeChange(t)}
                variant={selectedType === t ? "filled" : "outlined"}
                sx={{
                  fontWeight: 700, fontSize: "0.78rem",
                  ...(selectedType === t
                    ? { backgroundColor: t === "All" ? "error.main" : (BLOOD_COLORS[t] || "#b71c1c"), color: "white", borderColor: "transparent" }
                    : { borderColor: isDark ? "#444" : "#ddd" }),
                }}
              />
            ))}
          </Box>

          <TextField
            select label="Sort by" value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            size="small"
            sx={{ flex: "0 0 190px", ml: "auto", "& .MuiOutlinedInput-root": { borderRadius: 2.5 } }}
            InputProps={{
              startAdornment: <InputAdornment position="start"><SortIcon sx={{ fontSize: 18, color: "text.disabled" }} /></InputAdornment>,
            }}
          >
            {SORT_OPTIONS.map((o) => <MenuItem key={o.value} value={o.value}>{o.label}</MenuItem>)}
          </TextField>
        </Paper>

        {/* ── Result count + legend ──────────────────────────────────────── */}
        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 1.5, mt: 4, mb: 2 }}>
          <Typography variant="h6" fontWeight={800} color="error.main">
            {filtered.length} Donor{filtered.length !== 1 ? "s" : ""} Found
          </Typography>
          <Box sx={{ display: "flex", gap: 2.5 }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 0.7 }}>
              <Box sx={{ width: 8, height: 8, borderRadius: "50%", backgroundColor: isDark ? "#66bb6a" : "#2e7d32" }} />
              <Typography variant="caption" color="text.secondary">Available to donate</Typography>
            </Box>
            <Box sx={{ display: "flex", alignItems: "center", gap: 0.7 }}>
              <Box sx={{ width: 8, height: 8, borderRadius: "50%", backgroundColor: "#9e9e9e" }} />
              <Typography variant="caption" color="text.secondary">Not available</Typography>
            </Box>
          </Box>
        </Box>

        {/* ── Donor Cards ─────────────────────────────────────────────────── */}
        <Box>
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
                  <Paper key={donor._id || i} elevation={0} sx={{
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
                      <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 2 }}>
                        <Box sx={{ position: "relative", flexShrink: 0 }}>
                          <Avatar
                            src={donor.photo ? `${API_BASE}${donor.photo}` : undefined}
                            slotProps={{ img: { loading: "lazy" } }}
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
                            border: `2px solid ${isDark ? "#1a1a1a" : "white"}`,
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
                          <Box sx={{ display: "flex", alignItems: "center", gap: 0.6, mt: 0.5 }}>
                            <Box sx={{ width: 7, height: 7, borderRadius: "50%", backgroundColor: donor.available ? (isDark ? "#66bb6a" : "#2e7d32") : "#9e9e9e", flexShrink: 0 }} />
                            <Typography variant="caption" fontWeight={600} sx={{ color: donor.available ? (isDark ? "#66bb6a" : "#2e7d32") : "text.disabled" }}>
                              {donor.available ? "Available to donate" : "Currently unavailable"}
                            </Typography>
                          </Box>
                        </Box>
                      </Box>

                      {/* Info row */}
                      <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 1.25, mb: 2.5 }}>
                        <Box sx={{ display: "flex", alignItems: "center", gap: 1, p: 1, borderRadius: 2, backgroundColor: isDark ? "rgba(183,28,28,0.1)" : "#fdeaea" }}>
                          <CalendarTodayIcon sx={{ fontSize: 15, color: "error.main", flexShrink: 0 }} />
                          <Box sx={{ minWidth: 0 }}>
                            <Typography variant="caption" color="text.secondary" sx={{ display: "block", fontSize: "0.65rem" }}>Last donation</Typography>
                            <Typography variant="caption" fontWeight={700} noWrap sx={{ display: "block" }}>{formatDate(donor.lastDonation)}</Typography>
                          </Box>
                        </Box>
                        <Box sx={{ display: "flex", alignItems: "center", gap: 1, p: 1, borderRadius: 2, backgroundColor: isDark ? "rgba(183,28,28,0.1)" : "#fdeaea" }}>
                          <FavoriteIcon sx={{ fontSize: 15, color: "error.main", flexShrink: 0 }} />
                          <Box sx={{ minWidth: 0 }}>
                            <Typography variant="caption" color="text.secondary" sx={{ display: "block", fontSize: "0.65rem" }}>Total donations</Typography>
                            <Typography variant="caption" fontWeight={700} noWrap sx={{ display: "block" }}>{donor.donationCount || 0}</Typography>
                          </Box>
                        </Box>
                      </Box>

                      <Box sx={{ display: "flex", gap: 1.25 }}>
                        <Button fullWidth variant="outlined" size="small" startIcon={<VisibilityIcon sx={{ fontSize: 16 }} />}
                          onClick={() => setSelectedDonor(donor)}
                          sx={{
                            borderRadius: 2.5, fontWeight: 700, borderColor: btColor, color: btColor,
                            "&:hover": { backgroundColor: btColor, color: "white", borderColor: btColor },
                            transition: "all 0.2s",
                          }}>
                          View Details
                        </Button>
                        <Button fullWidth variant="contained" size="small" component={Link} href="/contact"
                          startIcon={<ForumIcon sx={{ fontSize: 16 }} />}
                          sx={{
                            borderRadius: 2.5, fontWeight: 700,
                            background: `linear-gradient(135deg, ${btColor} 0%, ${btColor}cc 100%)`,
                            boxShadow: `0 4px 12px ${btColor}44`,
                            "&:hover": { background: btColor },
                          }}>
                          Contact
                        </Button>
                      </Box>
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
                  { label: "Phone", value: "Private — hospitals can request this donor via the platform", muted: true },
                  { label: "Email", value: "Private — hospitals can request this donor via the platform", muted: true },
                  { label: "Location", value: selectedDonor.location },
                  { label: "Last Donation", value: formatDate(selectedDonor.lastDonation) },
                  { label: "Total Donations", value: selectedDonor.donationCount || 0 },
                ].map((item) => (
                  <Box key={item.label} sx={{
                    display: "flex", justifyContent: "space-between", alignItems: "center", gap: 2,
                    p: 1.5, borderRadius: 2,
                    backgroundColor: isDark ? "#2a2a2a" : "#f8f8f8",
                  }}>
                    <Typography variant="body2" color="text.secondary" fontWeight={600} flexShrink={0}>{item.label}</Typography>
                    <Typography
                      variant="body2"
                      fontWeight={item.muted ? 500 : 700}
                      fontStyle={item.muted ? "italic" : "normal"}
                      color={item.muted ? "text.disabled" : "text.primary"}
                      sx={{ textAlign: "right", flex: 1, minWidth: 0 }}
                    >
                      {item.value}
                    </Typography>
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
                      backgroundColor: selectedDonor.available
                        ? (isDark ? "rgba(102,187,106,0.15)" : "#e8f5e9")
                        : (isDark ? "#2a2a2a" : "#f5f5f5"),
                      color: selectedDonor.available
                        ? (isDark ? "#66bb6a" : "#2e7d32")
                        : "#9e9e9e",
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
              <Button component={Link} href="/contact" variant="contained"
                startIcon={<ForumIcon sx={{ fontSize: 16 }} />}
                sx={{ borderRadius: 2.5, fontWeight: 700,
                  background: `linear-gradient(135deg, ${btColor} 0%, ${btColor}cc 100%)`,
                  "&:hover": { background: btColor } }}>
                Contact
              </Button>
            </DialogActions>
          </Dialog>
        );
      })()}

    </Box>
  );
};

export default DonorList;
