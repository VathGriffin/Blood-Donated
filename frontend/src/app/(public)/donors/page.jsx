'use client';
import Link from 'next/link';
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Container, Typography, Box, Avatar, Paper, InputBase, MenuItem, Select, Button, Dialog,
  DialogContent, IconButton, Skeleton, Switch, Alert, Pagination, Divider, Chip, Tooltip,
  ToggleButton, ToggleButtonGroup, useTheme, useMediaQuery,
} from "@mui/material";
import { alpha } from "@mui/material/styles";
import WaterDropIcon from "@mui/icons-material/WaterDrop";
import LocationOnOutlinedIcon from "@mui/icons-material/LocationOnOutlined";
import EventOutlinedIcon from "@mui/icons-material/EventOutlined";
import PeopleOutlineIcon from "@mui/icons-material/PeopleOutline";
import PeopleAltIcon from "@mui/icons-material/PeopleAlt";
import LocalHospitalOutlinedIcon from "@mui/icons-material/LocalHospitalOutlined";
import FavoriteBorderIcon from "@mui/icons-material/FavoriteBorder";
import VolunteerActivismOutlinedIcon from "@mui/icons-material/VolunteerActivismOutlined";
import SearchIcon from "@mui/icons-material/Search";
import SortIcon from "@mui/icons-material/Sort";
import CloseIcon from "@mui/icons-material/Close";
import LockOutlinedIcon from "@mui/icons-material/LockOutlined";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import SearchOffIcon from "@mui/icons-material/SearchOff";
import TuneIcon from "@mui/icons-material/Tune";
import GridViewIcon from "@mui/icons-material/GridView";
import ViewListIcon from "@mui/icons-material/ViewList";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import ScheduleIcon from "@mui/icons-material/Schedule";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import axios from "axios";
import API_BASE from "@/lib/config";
import { BLOOD_TYPES } from "@/lib/inventory";
import { GIVES_TO, RECEIVES_FROM } from "@/lib/blood-compat";
import { formatDistanceToNow } from "date-fns";

const ITEMS_PER_PAGE = 12;
const VIEW_KEY = "bloodlife:donor-view";

// Must match Backend/src/common/eligibility.js.
const ELIGIBILITY_INTERVAL_DAYS = 56;
const DAY_MS = 86400000;

const SORT_OPTIONS = [
  { value: "recent", label: "Recently registered" },
  { value: "name", label: "Name (A–Z)" },
  { value: "donations", label: "Most donations" },
  { value: "lastDonation", label: "Recently donated" },
];

const AVAILABILITY = [
  { value: "all", label: "Everyone" },
  { value: "available", label: "Available" },
  { value: "ready", label: "Ready now" },
];

const validDate = (date) => !!date && !Number.isNaN(new Date(date).getTime());
const relative = (date) => (validDate(date) ? formatDistanceToNow(new Date(date), { addSuffix: true }) : null);
const shortDate = (date) => new Date(date).toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" });

const initialsOf = (name = "") =>
  name.split(" ").filter(Boolean).map((n) => n[0]).join("").slice(0, 2).toUpperCase() || "?";

const photoSrc = (photo) => (photo ? (photo.startsWith("http") ? photo : `${API_BASE}${photo}`) : undefined);

// Same rule as the backend: eligible again 56 days after the last whole-blood donation.
const eligibilityOf = (lastDonation) => {
  if (!validDate(lastDonation)) return { eligible: true, nextDate: null };
  const next = new Date(new Date(lastDonation).getTime() + ELIGIBILITY_INTERVAL_DAYS * DAY_MS);
  return next.getTime() <= Date.now() ? { eligible: true, nextDate: null } : { eligible: false, nextDate: next };
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

// The city is the last comma-separated part of the location ("Toul Kork, Phnom Penh" -> "Phnom Penh"),
// ignoring a trailing country and letter case, so "phnom penh" and "Phnom Penh, Cambodia" match.
const titleCase = (s) => s.replace(/\b\w/g, (c) => c.toUpperCase());
const cityOf = (location = "") => {
  const parts = location.split(",").map((s) => s.trim().toLowerCase().replace(/\s+/g, " ")).filter(Boolean);
  if (parts.length > 1 && parts[parts.length - 1] === "cambodia") parts.pop();
  const city = (parts.pop() || "").replace(/\s+cambodia$/, "");
  return city ? titleCase(city) : "";
};

// ── Small pieces ──────────────────────────────────────────────────────────────

function HeroStat({ icon, value, label, isDark }) {
  return (
    <Box sx={{
      display: "flex", alignItems: "center", gap: 1.5, p: { xs: 1.5, sm: 1.75 }, borderRadius: "14px",
      bgcolor: isDark ? "rgba(255,255,255,0.04)" : "rgba(255,255,255,0.75)",
      border: "1px solid", borderColor: isDark ? "rgba(255,255,255,0.08)" : "rgba(185,28,44,0.12)",
      backdropFilter: "blur(6px)",
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
    </Box>
  );
}

function BloodBadge({ type, size = 44, solid = false }) {
  return (
    <Box aria-label={`Blood type ${type || "unknown"}`} role="img" sx={{
      minWidth: size, height: size, px: 0.75, borderRadius: "12px", flexShrink: 0,
      display: "flex", alignItems: "center", justifyContent: "center", gap: 0.25,
      bgcolor: solid ? "primary.main" : (t) => t.custom.tones.primary.bg,
      color: solid ? "primary.contrastText" : "primary.main",
      boxShadow: solid ? (t) => `0 6px 14px ${alpha(t.palette.primary.main, 0.28)}` : "none",
      fontWeight: 800, fontSize: size > 48 ? "1.1rem" : "0.95rem", letterSpacing: "-0.02em",
    }}>
      <WaterDropIcon aria-hidden="true" sx={{ fontSize: size > 48 ? 18 : 15 }} />
      {type || "—"}
    </Box>
  );
}

function Pill({ tone, icon, children }) {
  return (
    <Box component="span" sx={{
      display: "inline-flex", alignItems: "center", gap: 0.5, px: 1, py: 0.25, borderRadius: "999px",
      fontSize: "0.72rem", fontWeight: 700, whiteSpace: "nowrap",
      bgcolor: (t) => t.custom.tones[tone].bg, color: (t) => t.custom.tones[tone].fg,
      "& svg": { fontSize: 13 },
    }}>
      {icon || <Box component="span" aria-hidden="true" sx={{ width: 7, height: 7, borderRadius: "50%", bgcolor: (t) => t.custom.tones[tone].dot }} />}
      {children}
    </Box>
  );
}

function StatusPills({ donor }) {
  const { eligible, nextDate } = eligibilityOf(donor.lastDonation);
  return (
    <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.75 }}>
      <Pill tone={donor.available ? "success" : "neutral"}>{donor.available ? "Available" : "Not available"}</Pill>
      {eligible
        ? <Pill tone="info" icon={<CheckCircleOutlineIcon aria-hidden="true" />}>Eligible to donate</Pill>
        : <Pill tone="warning" icon={<ScheduleIcon aria-hidden="true" />}>Eligible {shortDate(nextDate)}</Pill>}
    </Box>
  );
}

function DonorAvatar({ donor, size = 52 }) {
  return (
    <Box sx={{ position: "relative", flexShrink: 0 }}>
      <Avatar src={photoSrc(donor.photo)} alt="" slotProps={{ img: { loading: "lazy" } }} sx={{
        width: size, height: size, fontWeight: 700, fontSize: size > 56 ? "1.3rem" : "1rem",
        bgcolor: (t) => t.custom.tones.neutral.bg, color: "text.primary",
      }}>
        {initialsOf(donor.fullName)}
      </Avatar>
      {donor.available && (
        <Box aria-hidden="true" sx={{
          position: "absolute", right: 1, bottom: 1, width: 13, height: 13, borderRadius: "50%",
          bgcolor: (t) => t.custom.tones.success.dot, border: "2px solid", borderColor: "background.paper",
        }} />
      )}
    </Box>
  );
}

const cardSx = {
  borderRadius: (t) => `${t.custom.radius.card}px`, boxShadow: (t) => t.custom.shadow.xs,
  transition: "box-shadow 0.2s ease, border-color 0.2s ease, transform 0.2s ease",
  "&:hover": { boxShadow: (t) => t.custom.shadow.md, borderColor: (t) => alpha(t.palette.primary.main, 0.35), transform: "translateY(-2px)" },
  "@media (prefers-reduced-motion: reduce)": { transition: "none", "&:hover": { transform: "none" } },
};

function DonorCard({ donor, onOpen }) {
  const name = donor.fullName || "Donor";
  return (
    <Paper component="article" variant="outlined" aria-labelledby={`donor-${donor._id}`}
      sx={{ ...cardSx, overflow: "hidden", display: "flex", flexDirection: "column" }}>
      <Box aria-hidden="true" sx={{ height: 4, bgcolor: donor.available ? "primary.main" : "divider" }} />
      <Box sx={{ p: 2.25, display: "flex", flexDirection: "column", gap: 1.75, flex: 1 }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
          <DonorAvatar donor={donor} />
          <Box sx={{ minWidth: 0, flex: 1 }}>
            <Typography id={`donor-${donor._id}`} component="h3" noWrap sx={{ fontWeight: 700, fontSize: "0.98rem" }}>
              {name}
            </Typography>
            <Typography variant="caption" color="text.secondary" noWrap sx={{ display: "flex", alignItems: "center", gap: 0.4 }}>
              <LocationOnOutlinedIcon aria-hidden="true" sx={{ fontSize: 14, flexShrink: 0 }} />
              {donor.location || "Location not given"}
            </Typography>
          </Box>
          <BloodBadge type={donor.bloodType} solid={donor.available} />
        </Box>

        <StatusPills donor={donor} />

        <Box sx={{
          display: "grid", gridTemplateColumns: "1fr 1fr", borderRadius: "10px", overflow: "hidden",
          border: "1px solid", borderColor: "divider",
        }}>
          {[
            { icon: <FavoriteBorderIcon />, label: "Donations", value: donor.donationCount || 0 },
            { icon: <EventOutlinedIcon />, label: "Last donation", value: relative(donor.lastDonation) || "None yet" },
          ].map((m, i) => (
            <Box key={m.label} sx={{ px: 1.5, py: 1.1, minWidth: 0, borderLeft: i ? "1px solid" : "none", borderColor: "divider", bgcolor: (t) => t.custom.surface.subtle }}>
              <Typography variant="caption" color="text.secondary" sx={{ display: "flex", alignItems: "center", gap: 0.5, lineHeight: 1.3, "& svg": { fontSize: 14 } }}>
                <Box component="span" aria-hidden="true" sx={{ display: "flex" }}>{m.icon}</Box>{m.label}
              </Typography>
              <Typography noWrap sx={{ fontWeight: 700, fontSize: "0.86rem", mt: 0.25 }}>{m.value}</Typography>
            </Box>
          ))}
        </Box>

        <Button variant="outlined" color="primary" onClick={() => onOpen(donor)} endIcon={<ArrowForwardIcon />}
          aria-label={`View details for ${name}`}
          sx={{ mt: "auto", borderWidth: 1.5, "&:hover": { borderWidth: 1.5 } }}>
          View details
        </Button>
      </Box>
    </Paper>
  );
}

function DonorRow({ donor, onOpen }) {
  const name = donor.fullName || "Donor";
  return (
    <Paper component="article" variant="outlined" aria-labelledby={`donor-row-${donor._id}`} sx={{
      ...cardSx, "&:hover": { ...cardSx["&:hover"], transform: "none" },
      p: 1.5, pl: 2, display: "grid", alignItems: "center", gap: 2,
      gridTemplateColumns: "minmax(0, 1.6fr) auto minmax(0, 1fr) 90px auto",
    }}>
      <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, minWidth: 0 }}>
        <DonorAvatar donor={donor} size={44} />
        <Box sx={{ minWidth: 0 }}>
          <Typography id={`donor-row-${donor._id}`} component="h3" noWrap sx={{ fontWeight: 700, fontSize: "0.95rem" }}>{name}</Typography>
          <Typography variant="caption" color="text.secondary" noWrap sx={{ display: "flex", alignItems: "center", gap: 0.4 }}>
            <LocationOnOutlinedIcon aria-hidden="true" sx={{ fontSize: 14, flexShrink: 0 }} />
            {donor.location || "Location not given"}
          </Typography>
        </Box>
      </Box>
      <BloodBadge type={donor.bloodType} size={40} solid={donor.available} />
      <StatusPills donor={donor} />
      <Box>
        <Typography sx={{ fontWeight: 800, fontSize: "1rem", lineHeight: 1.2 }}>{donor.donationCount || 0}</Typography>
        <Typography variant="caption" color="text.secondary">donations</Typography>
      </Box>
      <Button size="small" variant="outlined" onClick={() => onOpen(donor)} aria-label={`View details for ${name}`}
        sx={{ borderWidth: 1.5, "&:hover": { borderWidth: 1.5 } }}>
        Details
      </Button>
    </Paper>
  );
}

function CardSkeleton() {
  return (
    <Paper variant="outlined" sx={{ p: 2.25, borderRadius: (t) => `${t.custom.radius.card}px`, display: "flex", flexDirection: "column", gap: 1.75 }}>
      <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
        <Skeleton variant="circular" width={52} height={52} />
        <Box sx={{ flex: 1 }}><Skeleton width="70%" /><Skeleton width="45%" /></Box>
        <Skeleton variant="rounded" width={44} height={44} />
      </Box>
      <Skeleton variant="rounded" width={180} height={22} sx={{ borderRadius: "999px" }} />
      <Skeleton variant="rounded" height={56} />
      <Skeleton variant="rounded" height={36} />
    </Paper>
  );
}

function DonorDialog({ donor, onClose }) {
  const fullScreen = useMediaQuery((t) => t.breakpoints.down("sm"));
  const { eligible, nextDate } = eligibilityOf(donor.lastDonation);
  const rows = [
    { label: "Location", value: donor.location || "Not given" },
    { label: "Last donation", value: validDate(donor.lastDonation)
      ? `${shortDate(donor.lastDonation)} (${relative(donor.lastDonation)})`
      : "None recorded" },
    { label: "Can donate", value: eligible ? "Now" : `From ${shortDate(nextDate)}` },
    { label: "Recorded donations", value: donor.donationCount || 0 },
    { label: "Registered", value: relative(donor.createdAt) || "—" },
  ];
  const givesTo = GIVES_TO[donor.bloodType] || [];
  return (
    <Dialog open onClose={onClose} fullScreen={fullScreen} maxWidth="xs" fullWidth aria-labelledby="donor-dialog-title"
      slotProps={{ paper: { sx: { borderRadius: { xs: 0, sm: (t) => `${t.custom.radius.dialog}px` } } } }}>
      <Box sx={{ position: "relative", px: 3, pt: 3, pb: 2.5, bgcolor: (t) => t.custom.tones.primary.bg }}>
        <IconButton onClick={onClose} aria-label="Close" size="small" sx={{ position: "absolute", top: 10, right: 10 }}>
          <CloseIcon fontSize="small" />
        </IconButton>
        <Box sx={{ display: "flex", alignItems: "center", gap: 2, pr: 3 }}>
          <Avatar src={photoSrc(donor.photo)} alt="" sx={{
            width: 64, height: 64, fontWeight: 700, fontSize: "1.3rem",
            bgcolor: "background.paper", color: "text.primary", border: "3px solid", borderColor: "background.paper",
          }}>
            {initialsOf(donor.fullName)}
          </Avatar>
          <Box sx={{ minWidth: 0, flex: 1 }}>
            <Typography id="donor-dialog-title" component="h2" sx={{ fontWeight: 800, fontSize: "1.15rem", lineHeight: 1.25 }}>
              {donor.fullName || "Donor"}
            </Typography>
            <Box sx={{ mt: 0.75 }}><StatusPills donor={donor} /></Box>
          </Box>
          <BloodBadge type={donor.bloodType} size={56} solid />
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

        {givesTo.length > 0 && (
          <Box sx={{ mt: 1.5 }}>
            <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700, display: "block", mb: 0.75 }}>
              {donor.bloodType} red cells can go to patients with
            </Typography>
            <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.75 }}>
              {BLOOD_TYPES.map((t) => {
                const ok = givesTo.includes(t);
                return (
                  <Box key={t} component="span" aria-hidden={!ok} sx={{
                    px: 1, py: 0.25, borderRadius: "8px", fontSize: "0.78rem", fontWeight: 700,
                    bgcolor: ok ? (th) => th.custom.tones.primary.bg : "transparent",
                    color: ok ? "primary.main" : "text.disabled",
                    border: "1px solid", borderColor: ok ? "transparent" : "divider",
                    textDecoration: ok ? "none" : "line-through",
                  }}>
                    {t}
                  </Box>
                );
              })}
            </Box>
          </Box>
        )}

        <Box sx={{
          mt: 2, p: 1.5, borderRadius: "10px", display: "flex", gap: 1.25, alignItems: "flex-start",
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

function FilterLabel({ children, id }) {
  return (
    <Typography id={id} variant="overline" color="text.secondary" sx={{ display: "block", mb: 1, lineHeight: 1.4 }}>
      {children}
    </Typography>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

const DonorList = () => {
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";
  const compact = useMediaQuery(theme.breakpoints.down("sm"));
  const wide = useMediaQuery(theme.breakpoints.up("md"));
  const [donors, setDonors] = useState([]);
  const [pub, setPub] = useState(null); // real totals from /api/stats/public
  const [selectedType, setSelectedType] = useState("All");
  const [compatible, setCompatible] = useState(false);
  const [search, setSearch] = useState("");
  const [city, setCity] = useState("");
  const [availability, setAvailability] = useState("all");
  const [sortBy, setSortBy] = useState("recent");
  const [view, setView] = useState("grid");
  const [page, setPage] = useState(1);
  const [selectedDonor, setSelectedDonor] = useState(null);
  const [status, setStatus] = useState("loading"); // 'loading' | 'ready' | 'error'
  const [attempt, setAttempt] = useState(0);
  const resultsRef = useRef(null);
  const paramsRead = useRef(false);

  // ?type=O%2B&q=Phnom+Penh (used by the navbar search) pre-sets the filters.
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const type = params.get("type");
    const q = params.get("q")?.trim();
    if (type && BLOOD_TYPES.includes(type)) setSelectedType(type);
    if (q) setSearch(q);
    try { if (localStorage.getItem(VIEW_KEY) === "list") setView("list"); } catch { /* storage blocked */ }
    paramsRead.current = true;
  }, []);

  // Keep the address bar in step with the main filters, so a filtered list can be shared.
  useEffect(() => {
    if (!paramsRead.current) return;
    const params = new URLSearchParams(window.location.search);
    if (selectedType !== "All") params.set("type", selectedType); else params.delete("type");
    if (search.trim()) params.set("q", search.trim()); else params.delete("q");
    const qs = params.toString();
    window.history.replaceState(window.history.state, "", `${window.location.pathname}${qs ? `?${qs}` : ""}`);
  }, [selectedType, search]);

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

  const changeView = (_, v) => {
    if (!v) return;
    setView(v);
    try { localStorage.setItem(VIEW_KEY, v); } catch { /* storage blocked */ }
  };

  // The cities donors list most often, as one-tap filters.
  const topCities = useMemo(() => {
    const counts = new Map();
    for (const d of donors) {
      const c = cityOf(d.location);
      if (c) counts.set(c, (counts.get(c) || 0) + 1);
    }
    return [...counts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 6).map(([name, count]) => ({ name, count }));
  }, [donors]);

  // Everything except the blood-type filter, so each type button can show its count.
  const base = useMemo(() => {
    const q = search.trim().toLowerCase();
    return donors.filter((d) =>
      (availability === "all" || (d.available && (availability === "available" || eligibilityOf(d.lastDonation).eligible))) &&
      (!city || cityOf(d.location) === city) &&
      (!q || d.fullName?.toLowerCase().includes(q) || d.location?.toLowerCase().includes(q)));
  }, [donors, search, availability, city]);

  const typeCounts = useMemo(() => {
    const counts = { All: base.length };
    for (const d of base) counts[d.bloodType] = (counts[d.bloodType] || 0) + 1;
    return counts;
  }, [base]);

  const filtered = useMemo(() => {
    const matchTypes = selectedType === "All" ? null : compatible ? RECEIVES_FROM[selectedType] : [selectedType];
    return sortDonors(base.filter((d) => !matchTypes || matchTypes.includes(d.bloodType)), sortBy);
  }, [base, selectedType, compatible, sortBy]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / ITEMS_PER_PAGE));
  const currentPage = Math.min(page, totalPages);
  const paginated = filtered.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);
  const availableCount = useMemo(() => donors.filter((d) => d.available).length, [donors]);

  const pickType = (t) => { setSelectedType(t); if (t === "All") setCompatible(false); setPage(1); };
  const chips = [
    selectedType !== "All" && { key: "type", label: compatible ? `Can give to ${selectedType}` : `Type ${selectedType}`, clear: () => pickType("All") },
    search.trim() && { key: "q", label: `“${search.trim()}”`, clear: () => { setSearch(""); setPage(1); } },
    city && { key: "city", label: city, clear: () => { setCity(""); setPage(1); } },
    availability !== "all" && { key: "avail", label: AVAILABILITY.find((a) => a.value === availability).label, clear: () => { setAvailability("all"); setPage(1); } },
  ].filter(Boolean);
  const filtersActive = chips.length > 0;
  const clearFilters = () => {
    setSelectedType("All"); setCompatible(false); setSearch(""); setCity(""); setAvailability("all"); setPage(1);
  };

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
  const showList = view === "list" && wide;
  const pageBg = isDark ? "#0f0f0f" : "#F8FAFC";

  const typeButton = (t, label = t) => {
    const selected = selectedType === t;
    const count = status === "ready" ? typeCounts[t] || 0 : null;
    return (
      <Box key={t} component="button" type="button" role="radio" aria-checked={selected}
        onClick={() => pickType(t)}
        sx={{
          all: "unset", boxSizing: "border-box", cursor: "pointer", textAlign: "center",
          py: 1, px: 0.5, borderRadius: "10px", border: "1.5px solid",
          borderColor: selected ? "primary.main" : "divider",
          bgcolor: selected ? "primary.main" : "background.paper",
          color: selected ? "primary.contrastText" : "text.primary",
          transition: "background-color .15s, border-color .15s",
          "&:hover": { borderColor: "primary.main" },
          "&:focus-visible": { outline: "none", boxShadow: (th) => `0 0 0 3px ${alpha(th.palette.primary.main, 0.3)}` },
        }}>
        <Typography component="span" sx={{ display: "block", fontWeight: 800, fontSize: "0.95rem", lineHeight: 1.2 }}>{label}</Typography>
        <Typography component="span" sx={{ display: "block", fontSize: "0.7rem", fontWeight: 600, opacity: selected ? 0.85 : 0.6, minHeight: "1em" }}>
          {count == null ? "" : count}
        </Typography>
      </Box>
    );
  };

  const filterPanel = (
    <Paper component="section" aria-label="Filter donors" variant="outlined" sx={{
      p: { xs: 2, sm: 2.25 }, borderRadius: (t) => `${t.custom.radius.card}px`, boxShadow: (t) => t.custom.shadow.sm,
      position: { lg: "sticky" }, top: { lg: 88 },
    }}>
      <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2 }}>
        <TuneIcon aria-hidden="true" sx={{ color: "primary.main", fontSize: 20 }} />
        <Typography component="h2" sx={{ fontWeight: 700, fontSize: "1rem", flex: 1 }}>Filters</Typography>
        {filtersActive && (
          <Button size="small" onClick={clearFilters} sx={{ minWidth: 0, px: 1, fontWeight: 700 }}>Reset</Button>
        )}
      </Box>

      <Box role="search" sx={{
        display: "flex", alignItems: "center", gap: 1, px: 1.5, height: 42,
        borderRadius: (t) => `${t.custom.radius.md}px`, border: "1px solid", borderColor: "divider",
        bgcolor: (t) => t.custom.surface.subtle,
        "&:focus-within": { borderColor: "primary.main", boxShadow: (t) => `0 0 0 3px ${alpha(t.palette.primary.main, 0.14)}` },
      }}>
        <SearchIcon aria-hidden="true" sx={{ color: "text.secondary", fontSize: 20 }} />
        <InputBase value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          placeholder="Name or city…" fullWidth
          inputProps={{ "aria-label": "Search donors by name or city", type: "search" }}
          sx={{ fontSize: "0.92rem" }} />
        {search && (
          <IconButton size="small" aria-label="Clear search" onClick={() => { setSearch(""); setPage(1); }}>
            <CloseIcon fontSize="small" />
          </IconButton>
        )}
      </Box>

      <Box sx={{ mt: 2.5 }}>
        <FilterLabel id="type-label">Blood type</FilterLabel>
        <Box role="radiogroup" aria-labelledby="type-label" sx={{ display: "grid", gap: 0.75, gridTemplateColumns: "repeat(4, 1fr)" }}>
          <Box sx={{ gridColumn: "1 / -1", display: "grid" }}>{typeButton("All", "All types")}</Box>
          {BLOOD_TYPES.map((t) => typeButton(t))}
        </Box>
        {selectedType !== "All" && (
          <Box component="label" sx={{
            mt: 1.25, display: "flex", alignItems: "center", gap: 1, p: 1, pl: 1.25, borderRadius: "10px", cursor: "pointer",
            bgcolor: (t) => t.custom.tones.primary.bg,
          }}>
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Typography sx={{ fontWeight: 700, fontSize: "0.82rem", lineHeight: 1.3 }}>Include compatible donors</Typography>
              <Typography sx={{ fontSize: "0.74rem", color: "text.secondary", lineHeight: 1.35 }}>
                {selectedType} patients can receive from {RECEIVES_FROM[selectedType].join(", ")}
              </Typography>
            </Box>
            <Switch size="small" checked={compatible} onChange={(e) => { setCompatible(e.target.checked); setPage(1); }}
              inputProps={{ "aria-label": `Include donors compatible with ${selectedType}` }} />
          </Box>
        )}
      </Box>

      <Box sx={{ mt: 2.5 }}>
        <FilterLabel id="avail-label">Availability</FilterLabel>
        <ToggleButtonGroup exclusive fullWidth size="small" value={availability} aria-labelledby="avail-label"
          onChange={(_, v) => { if (v) { setAvailability(v); setPage(1); } }}
          sx={{ "& .MuiToggleButton-root": { textTransform: "none", fontWeight: 700, fontSize: "0.8rem", py: 0.75 },
            "& .Mui-selected": { color: "primary.main", bgcolor: (t) => `${t.custom.tones.primary.bg} !important` } }}>
          {AVAILABILITY.map((a) => <ToggleButton key={a.value} value={a.value}>{a.label}</ToggleButton>)}
        </ToggleButtonGroup>
        <Typography sx={{ mt: 0.75, fontSize: "0.74rem", color: "text.secondary", display: "flex", gap: 0.5 }}>
          <InfoOutlinedIcon aria-hidden="true" sx={{ fontSize: 14, mt: "1px" }} />
          “Ready now” means available and at least {ELIGIBILITY_INTERVAL_DAYS} days since their last donation.
        </Typography>
      </Box>

      {topCities.length > 1 && (
        <Box sx={{ mt: 2.5 }}>
          <FilterLabel>Popular cities</FilterLabel>
          <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.75 }}>
            {topCities.map((c) => {
              const selected = city === c.name;
              return (
                <Chip key={c.name} clickable size="small" aria-pressed={selected}
                  icon={<LocationOnOutlinedIcon aria-hidden="true" />}
                  label={`${c.name} · ${c.count}`}
                  color={selected ? "primary" : "default"} variant={selected ? "filled" : "outlined"}
                  onClick={() => { setCity(selected ? "" : c.name); setPage(1); }}
                  sx={{ fontWeight: 600, ...(!selected && { borderColor: "divider" }) }} />
              );
            })}
          </Box>
        </Box>
      )}
    </Paper>
  );

  return (
    <Box sx={{ bgcolor: pageBg, pb: { xs: 6, md: 9 } }}>

      {/* ── Hero ─────────────────────────────────────────────────────────── */}
      <Box component="section" aria-labelledby="donors-title" sx={{
        position: "relative", overflow: "hidden",
        background: isDark
          ? "linear-gradient(100deg, #1a1212 0%, #221416 60%, #2a1518 100%)"
          : "linear-gradient(100deg, #FFF5F6 0%, #FDEBEE 55%, #FADADF 100%)",
      }}>
        <Box aria-hidden="true" component="svg" viewBox="0 0 1440 60" preserveAspectRatio="none"
          sx={{ position: "absolute", left: 0, right: 0, bottom: -1, width: "100%", height: 36, display: "block" }}>
          <path d="M0 40 C 360 0, 720 70, 1080 30 S 1440 20, 1440 20 V60 H0Z" fill={pageBg} />
        </Box>
        <PeopleAltIcon aria-hidden="true" sx={{
          position: "absolute", right: { md: 40, lg: 120 }, top: "38%", transform: "translateY(-50%) rotate(-8deg)",
          fontSize: 260, color: "primary.main", opacity: isDark ? 0.1 : 0.07, display: { xs: "none", md: "block" },
        }} />

        <Container maxWidth={false} sx={{ maxWidth: 1440, position: "relative", pt: { xs: 4, md: 5 }, pb: { xs: 6, md: 7 } }}>
          <Box sx={{
            display: "inline-flex", alignItems: "center", gap: 0.75, px: 1.5, py: 0.5, mb: 2, borderRadius: "999px",
            bgcolor: isDark ? "rgba(185,28,44,0.18)" : "#fff", color: "primary.main", fontWeight: 700, fontSize: "0.8rem",
            boxShadow: isDark ? "none" : "0 2px 10px rgba(185,28,44,0.10)",
          }}>
            <PeopleAltIcon sx={{ fontSize: 16 }} aria-hidden="true" /> Donor Directory
          </Box>
          <Box sx={{ display: "flex", flexDirection: { xs: "column", md: "row" }, alignItems: { md: "flex-end" }, justifyContent: "space-between", gap: 3 }}>
            <Box sx={{ maxWidth: 620 }}>
              <Typography id="donors-title" component="h1" sx={{
                fontWeight: 800, fontSize: { xs: "2rem", sm: "2.5rem", md: "3rem" }, letterSpacing: "-0.03em", lineHeight: 1.08,
              }}>
                Find a Blood <Box component="span" sx={{ color: "primary.main" }}>Donor</Box>
              </Typography>
              <Typography color="text.secondary" sx={{ mt: 1.5, fontSize: { xs: "1rem", md: "1.1rem" }, lineHeight: 1.65 }}>
                Browse donors registered on BloodLife by blood type and city. Contact details stay
                private. If a patient needs blood, send a request and hospitals take it from there.
              </Typography>
            </Box>
            <Box sx={{ display: "flex", gap: 1.25, flexWrap: "wrap", position: "relative" }}>
              <Button component={Link} href="/requests" variant="contained" size="large" endIcon={<ArrowForwardIcon />}>
                Request blood
              </Button>
              <Button component={Link} href="/donate" variant="outlined" size="large"
                sx={{ borderWidth: 1.5, bgcolor: "background.paper", "&:hover": { borderWidth: 1.5 } }}>
                Become a donor
              </Button>
            </Box>
          </Box>

          <Box sx={{ mt: { xs: 3.5, md: 4 }, display: "grid", gridTemplateColumns: { xs: "1fr 1fr", md: "repeat(4, 1fr)" }, gap: { xs: 1.25, sm: 2 } }}>
            {stats.map((s) => <HeroStat key={s.label} {...s} isDark={isDark} />)}
          </Box>
        </Container>
      </Box>

      {/* ── Filters + results ────────────────────────────────────────────── */}
      <Container maxWidth={false} sx={{ maxWidth: 1440, mt: { xs: 1, md: 2 } }}>
        <Box sx={{
          display: "grid", gridTemplateColumns: { xs: "1fr", lg: "300px minmax(0, 1fr)" },
          gap: { xs: 2.5, md: 3 }, alignItems: "start",
        }}>
          {filterPanel}

          <Box ref={resultsRef} sx={{ scrollMarginTop: { xs: 80, md: 90 }, minWidth: 0 }}>
            <Box sx={{ display: "flex", alignItems: "center", flexWrap: "wrap", gap: 1.25, mb: filtersActive ? 1.25 : 2 }}>
              <Typography aria-live="polite" sx={{ fontWeight: 700, flex: "1 1 auto" }}>
                {loading ? "Loading donors…"
                  : status === "error" ? "Donors couldn't be loaded"
                  : filtered.length ? <>Showing {from}–{to} of {filtered.length} donor{filtered.length !== 1 ? "s" : ""}</>
                  : "No donors found"}
              </Typography>
              <Select size="small" value={sortBy} onChange={(e) => setSortBy(e.target.value)}
                inputProps={{ "aria-label": "Sort donors" }}
                startAdornment={<SortIcon aria-hidden="true" sx={{ fontSize: 18, color: "text.secondary", mr: 1 }} />}
                sx={{ flex: { xs: "1 1 auto", sm: "0 0 220px" }, height: 40, bgcolor: "background.paper" }}>
                {SORT_OPTIONS.map((o) => <MenuItem key={o.value} value={o.value}>{o.label}</MenuItem>)}
              </Select>
              {wide && (
                <ToggleButtonGroup exclusive size="small" value={view} onChange={changeView} aria-label="Layout"
                  sx={{ bgcolor: "background.paper", "& .MuiToggleButton-root": { px: 1.25, height: 40 } }}>
                  <Tooltip title="Cards"><ToggleButton value="grid" aria-label="Show as cards"><GridViewIcon fontSize="small" /></ToggleButton></Tooltip>
                  <Tooltip title="List"><ToggleButton value="list" aria-label="Show as list"><ViewListIcon fontSize="small" /></ToggleButton></Tooltip>
                </ToggleButtonGroup>
              )}
            </Box>

            {filtersActive && (
              <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.75, mb: 2, alignItems: "center" }}>
                {chips.map((c) => (
                  <Chip key={c.key} size="small" label={c.label} onDelete={c.clear}
                    deleteIcon={<CloseIcon aria-label={`Remove filter ${c.label}`} />}
                    sx={{ fontWeight: 600, bgcolor: (t) => t.custom.tones.primary.bg, color: "primary.main",
                      "& .MuiChip-deleteIcon": { color: "primary.main", fontSize: 16 } }} />
                ))}
                <Button size="small" color="inherit" onClick={clearFilters} sx={{ color: "text.secondary", fontWeight: 600 }}>
                  Clear all
                </Button>
              </Box>
            )}

            {status === "error" ? (
              <Alert severity="error" variant="outlined" sx={{ borderRadius: "12px", alignItems: "center", bgcolor: "background.paper" }}
                action={<Button color="error" size="small" onClick={() => setAttempt((n) => n + 1)}>Try again</Button>}>
                We couldn&apos;t reach the server to load donors. Check your connection and try again.
              </Alert>
            ) : loading ? (
              <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr", xl: "repeat(3, 1fr)" }, gap: 2.5 }}>
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
                <Typography variant="body2" color="text.secondary" sx={{ mt: 0.75, maxWidth: 440, mx: "auto" }}>
                  {donors.length === 0
                    ? "Be the first: registering takes about two minutes."
                    : selectedType !== "All" && !compatible
                      ? `Try turning on “Include compatible donors” to see everyone who can give to ${selectedType} patients.`
                      : "Try another blood type or city, or widen the availability filter."}
                </Typography>
                <Box sx={{ mt: 2.5, display: "flex", gap: 1.25, justifyContent: "center", flexWrap: "wrap" }}>
                  {selectedType !== "All" && !compatible && donors.length > 0 && (
                    <Button variant="outlined" onClick={() => { setCompatible(true); setPage(1); }}>Include compatible</Button>
                  )}
                  {filtersActive && <Button variant="outlined" color="inherit" sx={{ borderColor: "divider" }} onClick={clearFilters}>Clear filters</Button>}
                  <Button component={Link} href={donors.length === 0 ? "/donate" : "/requests"} variant="contained">
                    {donors.length === 0 ? "Become a donor" : "Request blood"}
                  </Button>
                </Box>
              </Paper>
            ) : showList ? (
              <Box sx={{ display: "flex", flexDirection: "column", gap: 1.25 }}>
                {paginated.map((donor) => <DonorRow key={donor._id} donor={donor} onOpen={setSelectedDonor} />)}
              </Box>
            ) : (
              <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr", xl: "repeat(3, 1fr)" }, gap: 2.5 }}>
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
        </Box>
      </Container>

      {selectedDonor && <DonorDialog donor={selectedDonor} onClose={() => setSelectedDonor(null)} />}
    </Box>
  );
};

export default DonorList;
