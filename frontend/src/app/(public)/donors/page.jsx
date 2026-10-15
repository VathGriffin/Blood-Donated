'use client';
import Link from 'next/link';
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Container, Typography, Box, Chip, Avatar, Paper, InputBase, MenuItem, Select, Button, Dialog,
  DialogContent, IconButton, Skeleton, Switch, FormControlLabel, Alert, Pagination, Divider,
  useTheme, useMediaQuery,
} from "@mui/material";
import { alpha } from "@mui/material/styles";
import WaterDropIcon from "@mui/icons-material/WaterDrop";
import LocationOnOutlinedIcon from "@mui/icons-material/LocationOnOutlined";
import EventOutlinedIcon from "@mui/icons-material/EventOutlined";
import PeopleOutlineIcon from "@mui/icons-material/PeopleOutline";
import LocalHospitalOutlinedIcon from "@mui/icons-material/LocalHospitalOutlined";
import FavoriteBorderIcon from "@mui/icons-material/FavoriteBorder";
import VolunteerActivismOutlinedIcon from "@mui/icons-material/VolunteerActivismOutlined";
import SearchIcon from "@mui/icons-material/Search";
import SortIcon from "@mui/icons-material/Sort";
import CloseIcon from "@mui/icons-material/Close";
import LockOutlinedIcon from "@mui/icons-material/LockOutlined";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import SearchOffIcon from "@mui/icons-material/SearchOff";
import FilterAltOffOutlinedIcon from "@mui/icons-material/FilterAltOffOutlined";
import axios from "axios";
import API_BASE from "@/lib/config";
import { BLOOD_TYPES as TYPES } from "@/lib/inventory";
import { formatDistanceToNow } from "date-fns";

const BLOOD_TYPES = ["All", ...TYPES];
const ITEMS_PER_PAGE = 9;

const SORT_OPTIONS = [
  { value: "recent", label: "Recently registered" },
  { value: "name", label: "Name (A–Z)" },
  { value: "donations", label: "Most donations" },
  { value: "lastDonation", label: "Recently donated" },
];

const validDate = (date) => !!date && !Number.isNaN(new Date(date).getTime());
const relative = (date) => (validDate(date) ? formatDistanceToNow(new Date(date), { addSuffix: true }) : null);

const initialsOf = (name = "") =>
  name.split(" ").filter(Boolean).map((n) => n[0]).join("").slice(0, 2).toUpperCase() || "?";

const photoSrc = (photo) => (photo ? (photo.startsWith("http") ? photo : `${API_BASE}${photo}`) : undefined);

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

// ── Small pieces ──────────────────────────────────────────────────────────────

function StatTile({ icon, value, label }) {
  return (
    <Paper variant="outlined" sx={{
      p: { xs: 1.5, sm: 2 }, borderRadius: (t) => `${t.custom.radius.card}px`, display: "flex", alignItems: "center", gap: 1.5,
      boxShadow: (t) => t.custom.shadow.xs,
    }}>
      <Box aria-hidden="true" sx={{
        width: 42, height: 42, borderRadius: "12px", flexShrink: 0, display: "grid", placeItems: "center",
        bgcolor: (t) => t.custom.tones.primary.bg, color: "primary.main", "& svg": { fontSize: 22 },
      }}>
        {icon}
      </Box>
      <Box sx={{ minWidth: 0 }}>
        <Typography sx={{ fontWeight: 800, fontSize: { xs: "1.15rem", sm: "1.35rem" }, lineHeight: 1.15, letterSpacing: "-0.02em" }}>
          {value}
        </Typography>
        <Typography variant="caption" color="text.secondary" sx={{ display: "block", lineHeight: 1.3 }}>{label}</Typography>
      </Box>
    </Paper>
  );
}

function BloodBadge({ type, size = 44 }) {
  return (
    <Box aria-label={`Blood type ${type}`} role="img" sx={{
      minWidth: size, height: size, px: 0.75, borderRadius: "12px", flexShrink: 0,
      display: "flex", alignItems: "center", justifyContent: "center", gap: 0.25,
      bgcolor: (t) => t.custom.tones.primary.bg, color: "primary.main",
      fontWeight: 800, fontSize: size > 48 ? "1.1rem" : "0.95rem", letterSpacing: "-0.02em",
    }}>
      <WaterDropIcon aria-hidden="true" sx={{ fontSize: size > 48 ? 18 : 15 }} />
      {type || "—"}
    </Box>
  );
}

function AvailabilityChip({ available }) {
  return (
    <Box component="span" sx={{
      display: "inline-flex", alignItems: "center", gap: 0.75, px: 1, py: 0.25, borderRadius: "999px",
      fontSize: "0.72rem", fontWeight: 700,
      bgcolor: (t) => t.custom.tones[available ? "success" : "neutral"].bg,
      color: (t) => t.custom.tones[available ? "success" : "neutral"].fg,
    }}>
      <Box component="span" aria-hidden="true" sx={{
        width: 7, height: 7, borderRadius: "50%",
        bgcolor: (t) => t.custom.tones[available ? "success" : "neutral"].dot,
      }} />
      {available ? "Available to donate" : "Not available now"}
    </Box>
  );
}

function Meta({ icon, label, value }) {
  return (
    <Box sx={{ minWidth: 0 }}>
      <Typography variant="caption" color="text.secondary" sx={{ display: "flex", alignItems: "center", gap: 0.5, lineHeight: 1.3 }}>
        <Box component="span" aria-hidden="true" sx={{ display: "flex", "& svg": { fontSize: 14 } }}>{icon}</Box>
        {label}
      </Typography>
      <Typography noWrap sx={{ fontWeight: 700, fontSize: "0.85rem", mt: 0.25 }}>{value}</Typography>
    </Box>
  );
}

function DonorCard({ donor, onOpen }) {
  return (
    <Paper component="article" variant="outlined" aria-labelledby={`donor-${donor._id}`} sx={{
      p: 2.25, borderRadius: (t) => `${t.custom.radius.card}px`, display: "flex", flexDirection: "column", gap: 1.75,
      boxShadow: (t) => t.custom.shadow.xs,
      transition: "box-shadow 0.2s ease, border-color 0.2s ease, transform 0.2s ease",
      "&:hover": { boxShadow: (t) => t.custom.shadow.md, borderColor: (t) => alpha(t.palette.primary.main, 0.35), transform: "translateY(-2px)" },
      "@media (prefers-reduced-motion: reduce)": { transition: "none", "&:hover": { transform: "none" } },
    }}>
      <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
        <Avatar src={photoSrc(donor.photo)} alt="" slotProps={{ img: { loading: "lazy" } }} sx={{
          width: 48, height: 48, fontWeight: 700, fontSize: "1rem",
          bgcolor: (t) => t.custom.tones.neutral.bg, color: "text.primary",
        }}>
          {initialsOf(donor.fullName)}
        </Avatar>
        <Box sx={{ minWidth: 0, flex: 1 }}>
          <Typography id={`donor-${donor._id}`} component="h3" noWrap sx={{ fontWeight: 700, fontSize: "0.98rem" }}>
            {donor.fullName || "Donor"}
          </Typography>
          <Typography variant="caption" color="text.secondary" noWrap sx={{ display: "flex", alignItems: "center", gap: 0.4 }}>
            <LocationOnOutlinedIcon aria-hidden="true" sx={{ fontSize: 14 }} />
            {donor.location || "Location not given"}
          </Typography>
        </Box>
        <BloodBadge type={donor.bloodType} />
      </Box>

      <Box><AvailabilityChip available={donor.available} /></Box>

      <Box sx={{
        display: "grid", gridTemplateColumns: "1fr 1fr", gap: 1.5, p: 1.5, borderRadius: "10px",
        bgcolor: (t) => t.custom.surface.subtle,
      }}>
        <Meta icon={<EventOutlinedIcon />} label="Last donation" value={relative(donor.lastDonation) || "None recorded"} />
        <Meta icon={<FavoriteBorderIcon />} label="Donations" value={donor.donationCount || 0} />
      </Box>

      <Button variant="outlined" color="primary" onClick={() => onOpen(donor)} endIcon={<ArrowForwardIcon />}
        aria-label={`View details for ${donor.fullName || "this donor"}`}
        sx={{ mt: "auto", borderWidth: 1.5, "&:hover": { borderWidth: 1.5 } }}>
        View details
      </Button>
    </Paper>
  );
}

function CardSkeleton() {
  return (
    <Paper variant="outlined" sx={{ p: 2.25, borderRadius: (t) => `${t.custom.radius.card}px`, display: "flex", flexDirection: "column", gap: 1.75 }}>
      <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
        <Skeleton variant="circular" width={48} height={48} />
        <Box sx={{ flex: 1 }}><Skeleton width="70%" /><Skeleton width="45%" /></Box>
        <Skeleton variant="rounded" width={44} height={44} />
      </Box>
      <Skeleton variant="rounded" width={130} height={22} sx={{ borderRadius: "999px" }} />
      <Skeleton variant="rounded" height={58} />
      <Skeleton variant="rounded" height={36} />
    </Paper>
  );
}

function DonorDialog({ donor, onClose }) {
  const fullScreen = useMediaQuery((t) => t.breakpoints.down("sm"));
  const rows = [
    { label: "Location", value: donor.location || "Not given" },
    { label: "Last donation", value: validDate(donor.lastDonation)
      ? `${new Date(donor.lastDonation).toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" })} (${relative(donor.lastDonation)})`
      : "None recorded" },
    { label: "Recorded donations", value: donor.donationCount || 0 },
    { label: "Registered", value: relative(donor.createdAt) || "—" },
  ];
  return (
    <Dialog open onClose={onClose} fullScreen={fullScreen} maxWidth="xs" fullWidth aria-labelledby="donor-dialog-title"
      slotProps={{ paper: { sx: { borderRadius: { xs: 0, sm: (t) => `${t.custom.radius.dialog}px` } } } }}>
      <Box sx={{ position: "relative", px: 3, pt: 3, pb: 2.5, bgcolor: (t) => t.custom.tones.primary.bg }}>
        <IconButton onClick={onClose} aria-label="Close" size="small" sx={{ position: "absolute", top: 10, right: 10 }}>
          <CloseIcon fontSize="small" />
        </IconButton>
        <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
          <Avatar src={photoSrc(donor.photo)} alt="" sx={{
            width: 64, height: 64, fontWeight: 700, fontSize: "1.3rem",
            bgcolor: "background.paper", color: "text.primary", border: "3px solid", borderColor: "background.paper",
          }}>
            {initialsOf(donor.fullName)}
          </Avatar>
          <Box sx={{ minWidth: 0 }}>
            <Typography id="donor-dialog-title" component="h2" sx={{ fontWeight: 800, fontSize: "1.15rem", lineHeight: 1.25 }}>
              {donor.fullName || "Donor"}
            </Typography>
            <Box sx={{ mt: 0.75 }}><AvailabilityChip available={donor.available} /></Box>
          </Box>
          <Box sx={{ ml: "auto", mr: 3 }}><BloodBadge type={donor.bloodType} size={56} /></Box>
        </Box>
      </Box>
      <DialogContent sx={{ px: 3, py: 2 }}>
        {rows.map((r, i) => (
          <Box key={r.label}>
            {i > 0 && <Divider />}
            <Box sx={{ display: "flex", justifyContent: "space-between", gap: 2, py: 1.25 }}>
              <Typography variant="body2" color="text.secondary">{r.label}</Typography>
              <Typography variant="body2" sx={{ fontWeight: 600, textAlign: "right" }}>{r.value}</Typography>
            </Box>
          </Box>
        ))}
        <Box sx={{
          mt: 1.5, p: 1.5, borderRadius: "10px", display: "flex", gap: 1.25, alignItems: "flex-start",
          bgcolor: (t) => t.custom.surface.subtle,
        }}>
          <LockOutlinedIcon aria-hidden="true" sx={{ fontSize: 18, color: "text.secondary", mt: "2px" }} />
          <Typography variant="body2" color="text.secondary">
            Phone numbers and email addresses are private and are not shown here. If a patient needs blood,
            submit a blood request and the hospitals on BloodLife will handle it.
          </Typography>
        </Box>
        <Box sx={{ display: "flex", gap: 1.25, mt: 2.5, flexDirection: { xs: "column", sm: "row" } }}>
          <Button onClick={onClose} variant="outlined" color="inherit" fullWidth sx={{ borderColor: "divider" }}>Close</Button>
          <Button component={Link} href="/requests" variant="contained" fullWidth endIcon={<ArrowForwardIcon />}>
            Request blood
          </Button>
        </Box>
      </DialogContent>
    </Dialog>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

const DonorList = () => {
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";
  const compact = useMediaQuery(theme.breakpoints.down("sm"));
  const [donors, setDonors] = useState([]);
  const [pub, setPub] = useState(null); // real totals from /api/stats/public
  const [selectedType, setSelectedType] = useState("All");
  const [search, setSearch] = useState("");
  const [availableOnly, setAvailableOnly] = useState(false);
  const [sortBy, setSortBy] = useState("recent");
  const [page, setPage] = useState(1);
  const [selectedDonor, setSelectedDonor] = useState(null);
  const [status, setStatus] = useState("loading"); // 'loading' | 'ready' | 'error'
  const [attempt, setAttempt] = useState(0);
  const resultsRef = useRef(null);

  // ?type=O%2B&q=Phnom+Penh (used by the navbar search) pre-sets the filters.
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const type = params.get("type");
    const q = params.get("q")?.trim();
    if (type && BLOOD_TYPES.includes(type)) setSelectedType(type);
    if (q) setSearch(q);
  }, []);

  useEffect(() => {
    const ctrl = new AbortController();
    setStatus("loading");
    axios.get(`${API_BASE}/api/donors`, { signal: ctrl.signal })
      .then((res) => { setDonors(Array.isArray(res.data) ? res.data : []); setStatus("ready"); })
      .catch((err) => { if (!axios.isCancel(err)) setStatus("error"); });
    return () => ctrl.abort();
  }, [attempt]);

  useEffect(() => {
    const ctrl = new AbortController();
    axios.get(`${API_BASE}/api/stats/public`, { signal: ctrl.signal })
      .then((res) => setPub(res.data))
      .catch(() => { /* the hospital and donation tiles show "—" */ });
    return () => ctrl.abort();
  }, []);

  // Search + availability, before the blood-type filter, so each type chip can show its count.
  const base = useMemo(() => {
    const q = search.trim().toLowerCase();
    return donors.filter((d) =>
      (!availableOnly || d.available) &&
      (!q || d.fullName?.toLowerCase().includes(q) || d.location?.toLowerCase().includes(q)));
  }, [donors, search, availableOnly]);

  const typeCounts = useMemo(() => {
    const counts = { All: base.length };
    for (const d of base) counts[d.bloodType] = (counts[d.bloodType] || 0) + 1;
    return counts;
  }, [base]);

  const filtered = useMemo(
    () => sortDonors(base.filter((d) => selectedType === "All" || d.bloodType === selectedType), sortBy),
    [base, selectedType, sortBy]
  );

  const totalPages = Math.max(1, Math.ceil(filtered.length / ITEMS_PER_PAGE));
  const currentPage = Math.min(page, totalPages);
  const paginated = filtered.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);
  const availableCount = useMemo(() => donors.filter((d) => d.available).length, [donors]);

  const filtersActive = selectedType !== "All" || search.trim() !== "" || availableOnly;
  const clearFilters = () => { setSelectedType("All"); setSearch(""); setAvailableOnly(false); setPage(1); };

  const changePage = useCallback((_, value) => {
    setPage(value);
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    resultsRef.current?.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" });
  }, []);

  const loading = status === "loading";
  const fmt = (n) => (n == null ? "—" : Number(n).toLocaleString());
  const stats = [
    { icon: <PeopleOutlineIcon />, value: loading ? "…" : fmt(status === "ready" ? donors.length : null), label: "Registered donors" },
    { icon: <VolunteerActivismOutlinedIcon />, value: loading ? "…" : fmt(status === "ready" ? availableCount : null), label: "Available now" },
    { icon: <FavoriteBorderIcon />, value: fmt(pub?.donations), label: "Recorded donations" },
    { icon: <LocalHospitalOutlinedIcon />, value: fmt(pub?.hospitals), label: "Partner hospitals" },
  ];

  const from = filtered.length ? (currentPage - 1) * ITEMS_PER_PAGE + 1 : 0;
  const to = Math.min(currentPage * ITEMS_PER_PAGE, filtered.length);

  return (
    <Box sx={{ bgcolor: "background.default", pb: { xs: 6, md: 9 } }}>

      {/* ── Hero ─────────────────────────────────────────────────────────── */}
      <Box component="section" aria-labelledby="donors-title" sx={{
        position: "relative", overflow: "hidden",
        background: isDark
          ? `linear-gradient(180deg, ${alpha(theme.palette.primary.main, 0.12)} 0%, transparent 100%)`
          : `linear-gradient(180deg, ${theme.custom.tones.primary.bg} 0%, ${theme.palette.background.default} 100%)`,
      }}>
        <WaterDropIcon aria-hidden="true" sx={{
          position: "absolute", right: { xs: -60, md: 40 }, top: { xs: -30, md: -10 }, fontSize: { xs: 220, md: 300 },
          color: "primary.main", opacity: isDark ? 0.06 : 0.05, transform: "rotate(12deg)", pointerEvents: "none",
        }} />
        <Container maxWidth="lg" sx={{ position: "relative", pt: { xs: 5, md: 7 }, pb: { xs: 4, md: 5 } }}>
          <Box sx={{ display: "flex", flexDirection: { xs: "column", md: "row" }, alignItems: { md: "flex-end" }, justifyContent: "space-between", gap: 3 }}>
            <Box sx={{ maxWidth: 620 }}>
              <Typography variant="overline" color="primary" sx={{ display: "block", mb: 1 }}>Donor directory</Typography>
              <Typography id="donors-title" component="h1" sx={{ fontWeight: 800, fontSize: { xs: "2.1rem", md: "2.75rem" }, lineHeight: 1.1, letterSpacing: "-0.03em" }}>
                Find a blood <Box component="span" sx={{ color: "primary.main" }}>donor</Box>
              </Typography>
              <Typography color="text.secondary" sx={{ mt: 1.5, fontSize: { xs: "0.98rem", md: "1.05rem" }, lineHeight: 1.65 }}>
                Browse the donors registered on BloodLife by blood type and city. Contact details stay
                private. If a patient needs blood, send a request and hospitals take it from there.
              </Typography>
            </Box>
            <Box sx={{ display: "flex", gap: 1.25, flexWrap: "wrap" }}>
              <Button component={Link} href="/requests" variant="contained" size="large" endIcon={<ArrowForwardIcon />}>
                Request blood
              </Button>
              <Button component={Link} href="/donate" variant="outlined" size="large"
                sx={{ borderWidth: 1.5, bgcolor: "background.paper", "&:hover": { borderWidth: 1.5 } }}>
                Become a donor
              </Button>
            </Box>
          </Box>

          <Box sx={{ mt: { xs: 3.5, md: 4.5 }, display: "grid", gridTemplateColumns: { xs: "1fr 1fr", md: "repeat(4, 1fr)" }, gap: { xs: 1.25, sm: 2 } }}>
            {stats.map((s) => <StatTile key={s.label} {...s} />)}
          </Box>
        </Container>
      </Box>

      <Container maxWidth="lg">
        {/* ── Filters ──────────────────────────────────────────────────────── */}
        <Paper component="section" aria-label="Filter donors" variant="outlined" sx={{
          p: { xs: 1.75, sm: 2.25 }, borderRadius: (t) => `${t.custom.radius.card}px`, boxShadow: (t) => t.custom.shadow.sm,
        }}>
          <Box sx={{ display: "flex", gap: 1.5, flexWrap: "wrap", alignItems: "center" }}>
            <Box role="search" sx={{
              flex: "1 1 260px", display: "flex", alignItems: "center", gap: 1, px: 1.5, height: 42,
              borderRadius: (t) => `${t.custom.radius.md}px`, border: "1px solid", borderColor: "divider",
              bgcolor: (t) => t.custom.surface.subtle,
              "&:focus-within": { borderColor: "primary.main", boxShadow: (t) => `0 0 0 3px ${alpha(t.palette.primary.main, 0.14)}` },
            }}>
              <SearchIcon aria-hidden="true" sx={{ color: "text.secondary", fontSize: 20 }} />
              <InputBase value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                placeholder="Search by name or city…" fullWidth
                inputProps={{ "aria-label": "Search donors by name or city", type: "search" }}
                sx={{ fontSize: "0.92rem" }} />
              {search && (
                <IconButton size="small" aria-label="Clear search" onClick={() => { setSearch(""); setPage(1); }}>
                  <CloseIcon fontSize="small" />
                </IconButton>
              )}
            </Box>

            <FormControlLabel
              control={<Switch checked={availableOnly} onChange={(e) => { setAvailableOnly(e.target.checked); setPage(1); }} color="success" />}
              label={<Typography variant="body2" sx={{ fontWeight: 600 }}>Available only</Typography>}
              sx={{ mr: 0, ml: 0.25 }}
            />

            <Select size="small" value={sortBy} onChange={(e) => setSortBy(e.target.value)}
              inputProps={{ "aria-label": "Sort donors" }}
              startAdornment={<SortIcon aria-hidden="true" sx={{ fontSize: 18, color: "text.secondary", mr: 1 }} />}
              sx={{ flex: { xs: "1 1 100%", sm: "0 0 210px" }, ml: { sm: "auto" }, height: 42, bgcolor: "background.paper" }}>
              {SORT_OPTIONS.map((o) => <MenuItem key={o.value} value={o.value}>{o.label}</MenuItem>)}
            </Select>
          </Box>

          <Box role="radiogroup" aria-label="Blood type" sx={{
            display: "flex", gap: 1, mt: 1.75, overflowX: "auto", pb: 0.5, mx: -0.25, px: 0.25,
            scrollbarWidth: "thin",
          }}>
            {BLOOD_TYPES.map((t) => {
              const selected = selectedType === t;
              const count = typeCounts[t] || 0;
              return (
                <Chip key={t} role="radio" aria-checked={selected} clickable
                  onClick={() => { setSelectedType(t); setPage(1); }}
                  label={<>{t === "All" ? "All types" : t}<Box component="span" sx={{ ml: 0.75, opacity: 0.7, fontWeight: 600 }}>{status === "ready" ? count : ""}</Box></>}
                  color={selected ? "primary" : "default"} variant={selected ? "filled" : "outlined"}
                  sx={{
                    flexShrink: 0, fontWeight: 700, height: 34, px: 0.5,
                    ...(!selected && { bgcolor: "background.paper", borderColor: "divider" }),
                  }}
                />
              );
            })}
          </Box>
        </Paper>

        {/* ── Results ──────────────────────────────────────────────────────── */}
        <Box ref={resultsRef} sx={{ scrollMarginTop: { xs: 80, md: 90 } }}>
          <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 1, mt: 3.5, mb: 2 }}>
            <Typography aria-live="polite" sx={{ fontWeight: 700 }}>
              {loading ? "Loading donors…"
                : status === "error" ? "Donors couldn't be loaded"
                : filtered.length ? <>Showing {from}–{to} of {filtered.length} donor{filtered.length !== 1 ? "s" : ""}</>
                : "No donors found"}
            </Typography>
            {filtersActive && status === "ready" && (
              <Button size="small" color="inherit" startIcon={<FilterAltOffOutlinedIcon />} onClick={clearFilters}
                sx={{ color: "text.secondary" }}>
                Clear filters
              </Button>
            )}
          </Box>

          {status === "error" ? (
            <Alert severity="error" variant="outlined" sx={{ borderRadius: "12px", alignItems: "center", bgcolor: "background.paper" }}
              action={<Button color="error" size="small" onClick={() => setAttempt((n) => n + 1)}>Try again</Button>}>
              We couldn&apos;t reach the server to load donors. Check your connection and try again.
            </Alert>
          ) : loading ? (
            <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr", md: "repeat(3, 1fr)" }, gap: 2.5 }}>
              {Array.from({ length: 6 }, (_, i) => <CardSkeleton key={i} />)}
            </Box>
          ) : paginated.length === 0 ? (
            <Paper variant="outlined" sx={{ py: { xs: 6, md: 8 }, px: 3, textAlign: "center", borderRadius: (t) => `${t.custom.radius.card}px` }}>
              <Box aria-hidden="true" sx={{
                width: 60, height: 60, mx: "auto", mb: 2, borderRadius: "50%", display: "grid", placeItems: "center",
                bgcolor: (t) => t.custom.tones.primary.bg, color: "primary.main",
              }}>
                <SearchOffIcon />
              </Box>
              <Typography sx={{ fontWeight: 700, fontSize: "1.05rem" }}>
                {donors.length === 0 ? "No donors have registered yet" : "No donors match these filters"}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 0.75, maxWidth: 420, mx: "auto" }}>
                {donors.length === 0
                  ? "Be the first: registering takes about two minutes."
                  : "Try another blood type or city, or turn off “Available only”."}
              </Typography>
              <Box sx={{ mt: 2.5, display: "flex", gap: 1.25, justifyContent: "center", flexWrap: "wrap" }}>
                {filtersActive && <Button variant="outlined" onClick={clearFilters}>Clear filters</Button>}
                <Button component={Link} href={donors.length === 0 ? "/donate" : "/requests"} variant="contained">
                  {donors.length === 0 ? "Become a donor" : "Request blood"}
                </Button>
              </Box>
            </Paper>
          ) : (
            <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr", md: "repeat(3, 1fr)" }, gap: 2.5 }}>
              {paginated.map((donor) => <DonorCard key={donor._id} donor={donor} onOpen={setSelectedDonor} />)}
            </Box>
          )}

          {status === "ready" && totalPages > 1 && (
            <Box sx={{ mt: 5, display: "flex", justifyContent: "center" }}>
              <Pagination count={totalPages} page={currentPage} onChange={changePage} color="primary" shape="rounded"
                siblingCount={1} boundaryCount={1} showFirstButton showLastButton
                size={compact ? "small" : "medium"} />
            </Box>
          )}
        </Box>
      </Container>

      {selectedDonor && <DonorDialog donor={selectedDonor} onClose={() => setSelectedDonor(null)} />}
    </Box>
  );
};

export default DonorList;
