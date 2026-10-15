'use client';
import { useRouter } from 'next/navigation';
import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import axios from "axios";
import {
  Container, Box, Typography, TextField, Button, Alert, CircularProgress, IconButton,
  MenuItem, Skeleton, useTheme,
} from "@mui/material";
import LocalHospitalIcon from "@mui/icons-material/LocalHospital";
import BloodtypeIcon from "@mui/icons-material/Bloodtype";
import WaterDropIcon from "@mui/icons-material/WaterDrop";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import BoltIcon from "@mui/icons-material/Bolt";
import VerifiedUserIcon from "@mui/icons-material/VerifiedUser";
import TrackChangesIcon from "@mui/icons-material/TrackChanges";
import PriorityHighIcon from "@mui/icons-material/PriorityHigh";
import PersonOutlineIcon from "@mui/icons-material/PersonOutline";
import DescriptionOutlinedIcon from "@mui/icons-material/DescriptionOutlined";
import FormatListNumberedIcon from "@mui/icons-material/FormatListNumbered";
import ListAltIcon from "@mui/icons-material/ListAlt";
import PlaceOutlinedIcon from "@mui/icons-material/PlaceOutlined";
import LockOutlinedIcon from "@mui/icons-material/LockOutlined";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import AddIcon from "@mui/icons-material/Add";
import RemoveIcon from "@mui/icons-material/Remove";
import API_BASE from "@/lib/config";
import { useUserAuth } from "@/store/UserAuthContext";
import Panel from "../appointments/_components/Panel";
import HospitalPhoto from "../appointments/_components/HospitalPhoto";
import { NeedHelp } from "../appointments/_components/SidePanels";
import {
  BLOOD_TYPES, C, FALLBACK_CENTERS, normalizeCenters, radioKeyDown,
} from "../appointments/_components/booking";

const MAX_UNITS = 10; // must match Backend/src/requests/blood-request.model.js

const HERO_POINTS = [
  { icon: <VerifiedUserIcon />, title: "Verified Hospitals", text: "Reviewed by medical staff" },
  { icon: <BoltIcon />, title: "Urgent First", text: "Critical cases handled immediately" },
  { icon: <TrackChangesIcon />, title: "Track Online", text: "Follow every status update" },
];

const URGENCY = [
  { value: "Critical", color: "#DC2626", eta: "Immediate response", hint: "Life-threatening, needed now" },
  { value: "High", color: "#EA580C", eta: "Within 24 hours", hint: "Surgery or treatment soon" },
  { value: "Medium", color: "#D97706", eta: "Within 48 hours", hint: "Planned procedure" },
  { value: "Low", color: "#16A34A", eta: "Within a week", hint: "Routine or stock top-up" },
];
const urgencyOf = (value) => URGENCY.find((u) => u.value === value);

const STATUS = {
  Pending: { color: "#D97706", bg: "rgba(217,119,6,0.12)" },
  Approved: { color: "#15803D", bg: "rgba(21,128,61,0.12)" },
  Fulfilled: { color: "#2563EB", bg: "rgba(37,99,235,0.12)" },
  Rejected: { color: "#DC2626", bg: "rgba(220,38,38,0.12)" },
  Cancelled: { color: "#64748B", bg: "rgba(100,116,139,0.14)" },
};

const PROCESS_STEPS = [
  { title: "Submit the Request", text: "Takes about 2 minutes" },
  { title: "Hospital Review", text: "Staff verify the medical need" },
  { title: "Matching Donors", text: "Stock is checked and donors alerted" },
  { title: "Blood Delivered", text: "You're notified at every step" },
];

// One tap fills in a common reason; the requester can still add details after it.
const QUICK_REASONS = ["Surgery", "Accident / trauma", "Childbirth", "Anemia", "Cancer treatment", "Thalassemia", "Dengue"];

// The form is kept in sessionStorage so nothing is lost while a visitor goes off to log in.
const DRAFT_KEY = "bloodlife:request-draft";
const EMPTY_FORM = { hospitalKey: "", patientName: "", bloodType: "", unitsNeeded: 1, urgency: "", reason: "", notes: "" };
// Only known fields with the right types are restored, so a stale or hand-edited draft can't break the form.
const readDraft = () => {
  let saved;
  try { saved = JSON.parse(sessionStorage.getItem(DRAFT_KEY) || "{}"); } catch { return EMPTY_FORM; }
  if (!saved || typeof saved !== "object") return EMPTY_FORM;
  const text = (key) => (typeof saved[key] === "string" ? saved[key] : "");
  const units = Number(saved.unitsNeeded);
  return {
    hospitalKey: text("hospitalKey"),
    patientName: text("patientName"),
    bloodType: BLOOD_TYPES.includes(saved.bloodType) ? saved.bloodType : "",
    unitsNeeded: Number.isInteger(units) && units >= 1 && units <= MAX_UNITS ? units : 1,
    urgency: urgencyOf(saved.urgency) ? saved.urgency : "",
    reason: text("reason"),
    notes: text("notes"),
  };
};
const writeDraft = (form) => { try { sessionStorage.setItem(DRAFT_KEY, JSON.stringify(form)); } catch { /* storage blocked */ } };
const clearDraft = () => { try { sessionStorage.removeItem(DRAFT_KEY); } catch { /* storage blocked */ } };

const LOGIN_HREF = `/login?next=${encodeURIComponent("/requests")}`;
const REGISTER_HREF = `/register?next=${encodeURIComponent("/requests")}`;

const fieldSx = { "& .MuiOutlinedInput-root": { borderRadius: "10px" } };
const shortDate = (d) => new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric" });

export default function RequestBlood() {
  const isDark = useTheme().palette.mode === "dark";
  const border = isDark ? "#262626" : C.border;
  const softTile = isDark ? "rgba(185,28,44,0.16)" : C.soft;
  const router = useRouter();
  const { token, isAuth: hasSession, ready } = useUserAuth();

  // The session is read from storage on the client, so login-dependent UI waits until it has been.
  const [mounted, setMounted] = useState(false);
  const authKnown = mounted && ready;
  const loggedIn = authKnown && hasSession;

  const [form, setForm] = useState(EMPTY_FORM);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  // Field-level errors only appear after a submit attempt, not while someone is still filling in.
  const [showErrors, setShowErrors] = useState(false);

  // Restore a saved draft (e.g. coming back from the login page), then keep it saved.
  useEffect(() => { setForm(readDraft()); setMounted(true); }, []);
  useEffect(() => { if (mounted) writeDraft(form); }, [form, mounted]);
  const bloodRefs = useRef([]);
  const urgencyRefs = useRef([]);

  // Hospitals registered on the platform; the classic list if there are none or the call fails.
  const [centers, setCenters] = useState(null);
  useEffect(() => {
    const ctrl = new AbortController();
    axios.get(`${API_BASE}/api/hospitals`, { signal: ctrl.signal })
      .then(({ data }) => setCenters(Array.isArray(data) && data.length ? normalizeCenters(data) : FALLBACK_CENTERS))
      .catch((err) => { if (!axios.isCancel(err)) setCenters(FALLBACK_CENTERS); });
    return () => ctrl.abort();
  }, []);
  const center = centers?.find((c) => c.key === form.hospitalKey) || null;
  // A saved draft can point at a hospital that's no longer listed — drop it rather than keep a blank pick.
  useEffect(() => {
    if (centers && form.hospitalKey && !center) setForm((f) => ({ ...f, hospitalKey: "" }));
  }, [centers, center, form.hospitalKey]);

  // The API only returns the signed-in donor's own requests, so this is a "your requests" preview.
  const [myRequests, setMyRequests] = useState(null);
  useEffect(() => {
    if (!loggedIn || !token) return;
    const ctrl = new AbortController();
    axios.get(`${API_BASE}/api/requests`, { headers: { Authorization: `Bearer ${token}` }, signal: ctrl.signal })
      .then(({ data }) => setMyRequests(Array.isArray(data) ? data : []))
      .catch((err) => { if (!axios.isCancel(err)) setMyRequests([]); });
    return () => ctrl.abort();
  }, [loggedIn, token]);

  const set = (field, value) => { setForm((f) => ({ ...f, [field]: value })); setError(""); };
  const handleChange = (field) => (e) => set(field, e.target.value);

  const addReason = (label) => {
    const current = form.reason.trim();
    if (current.toLowerCase().includes(label.toLowerCase())) return;
    set("reason", current ? `${current}, ${label}` : label);
  };

  // In page order, so the first one listed is the one the page scrolls to.
  const fieldErrors = {
    bloodType: !form.bloodType && "Choose the patient's blood type.",
    urgency: !form.urgency && "Choose how soon the blood is needed.",
    hospital: !center && "Choose the hospital.",
    patientName: !form.patientName.trim() && "Enter the patient's name.",
    reason: !form.reason.trim() && "Tell the hospital why blood is needed.",
  };
  const errorFor = (key) => (showErrors ? fieldErrors[key] || "" : "");

  const handleSubmit = async (e) => {
    e.preventDefault();
    const firstMissing = Object.keys(fieldErrors).find((k) => fieldErrors[k]);
    if (firstMissing) {
      setShowErrors(true);
      setError("");
      const el = document.getElementById(`field-${firstMissing}`);
      el?.scrollIntoView({ behavior: "smooth", block: "center" });
      const target = ["textarea", "input:not([aria-hidden=true])", "[role=combobox]", "button"]
        .map((sel) => el?.querySelector(sel)).find(Boolean);
      target?.focus({ preventScroll: true });
      return;
    }
    // Pressing Enter in a field still submits the form when logged out; send them to log in
    // (the draft is saved) rather than filing an anonymous request they could never track.
    if (!loggedIn) { router.push(LOGIN_HREF); return; }
    setLoading(true);
    setError("");
    try {
      // The backend files the request under the email in the login token, so the token must be
      // sent for the request to show up on the requester's profile.
      await axios.post(`${API_BASE}/api/requests`, {
        hospitalName: center.name,
        patientName: form.patientName,
        bloodType: form.bloodType,
        unitsNeeded: form.unitsNeeded,
        urgency: form.urgency,
        reason: form.reason,
        contact: form.notes,
      }, token ? { headers: { Authorization: `Bearer ${token}` } } : undefined);
      clearDraft();
      router.push("/requests/thank-you");
    } catch (err) {
      setError(err.response?.data?.errors?.[0]?.msg || err.response?.data?.error || err.response?.data?.message || "Submission failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const required = [!!form.bloodType, !!form.urgency, !!(center && form.patientName.trim()), !!form.reason.trim()];
  const done = required.filter(Boolean).length;
  const urgency = urgencyOf(form.urgency);

  const cardSx = {
    bgcolor: "background.paper", borderRadius: "16px", p: { xs: 2, sm: 2.5 },
    border: `1px solid ${border}`,
    boxShadow: isDark ? "none" : "0 1px 2px rgba(15,23,42,0.04), 0 8px 24px rgba(15,23,42,0.04)",
  };
  const iconTile = {
    width: 36, height: 36, borderRadius: "10px", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center",
    color: C.primary, bgcolor: softTile, "& svg": { fontSize: 20 },
  };
  const stepBadge = (n) => (
    <Box component="span" sx={{
      ml: 1, px: 1, py: 0.25, borderRadius: "999px", fontSize: "0.72rem", fontWeight: 700,
      color: C.primary, bgcolor: softTile, verticalAlign: "middle",
    }}>Step {n}</Box>
  );
  const tabStop = (selected, i, value) => (selected || (!value && i === 0) ? 0 : -1);
  const groupError = (key) => errorFor(key) && (
    <Typography role="alert" sx={{ mt: 1.25, color: "error.main", fontSize: "0.84rem", fontWeight: 600 }}>{errorFor(key)}</Typography>
  );

  return (
    <Box sx={{ bgcolor: isDark ? "#0f0f0f" : C.bg, pb: { xs: 6, md: 8 } }}>

      {/* ── Hero ─────────────────────────────────────────────────────────── */}
      <Box sx={{
        position: "relative", overflow: "hidden",
        background: isDark
          ? "linear-gradient(100deg, #1a1212 0%, #221416 60%, #2a1518 100%)"
          : "linear-gradient(100deg, #FFF5F6 0%, #FDEBEE 55%, #FADADF 100%)",
      }}>
        <Box aria-hidden="true" component="svg" viewBox="0 0 1440 60" preserveAspectRatio="none"
          sx={{ position: "absolute", left: 0, right: 0, bottom: -1, width: "100%", height: 36, display: "block" }}>
          <path d="M0 40 C 360 0, 720 70, 1080 30 S 1440 20, 1440 20 V60 H0Z" fill={isDark ? "#0f0f0f" : C.bg} />
        </Box>
        <BloodtypeIcon aria-hidden="true" sx={{
          position: "absolute", right: { md: 40, lg: 120 }, top: "50%", transform: "translateY(-55%) rotate(-12deg)",
          fontSize: 260, color: C.primary, opacity: isDark ? 0.12 : 0.08, display: { xs: "none", md: "block" },
        }} />

        <Container maxWidth={false} sx={{ maxWidth: 1440, position: "relative", pt: { xs: 4, md: 5 }, pb: { xs: 6, md: 7 } }}>
          <Box sx={{
            display: "inline-flex", alignItems: "center", gap: 0.75, px: 1.5, py: 0.5, mb: 2, borderRadius: "999px",
            bgcolor: isDark ? "rgba(185,28,44,0.18)" : "#fff", color: C.primary, fontWeight: 700, fontSize: "0.8rem",
            boxShadow: isDark ? "none" : "0 2px 10px rgba(185,28,44,0.10)",
          }}>
            <LocalHospitalIcon sx={{ fontSize: 16 }} aria-hidden="true" /> Blood Request
          </Box>
          <Typography component="h1" sx={{
            fontWeight: 800, fontSize: { xs: "2rem", sm: "2.5rem", md: "3rem" }, letterSpacing: "-0.03em", lineHeight: 1.08,
          }}>
            Need Blood?<br />
            <Box component="span" sx={{ color: C.primary }}>We&apos;ll Help You Find It</Box>
          </Typography>
          <Typography sx={{ color: "text.secondary", mt: 1.5, fontSize: { xs: "1rem", md: "1.1rem" }, maxWidth: 580, lineHeight: 1.65 }}>
            Tell us what the patient needs. Hospitals review every request, check their stock and reach out to matching donors.
          </Typography>

          <Box component="ul" sx={{ listStyle: "none", p: 0, m: 0, mt: 3, display: "flex", flexWrap: "wrap", gap: { xs: 1.5, sm: 2, md: 0 } }}>
            {HERO_POINTS.map(({ icon, title, text }, i) => (
              <Box component="li" key={title} sx={{
                display: "flex", alignItems: "center", gap: 1.25, pr: { md: 4 }, mr: { md: 4 },
                borderRight: { md: i < HERO_POINTS.length - 1 ? `1px solid ${isDark ? "rgba(255,255,255,0.08)" : "rgba(185,28,44,0.14)"}` : "none" },
              }}>
                <Box aria-hidden="true" sx={{
                  width: 42, height: 42, borderRadius: "50%", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center",
                  bgcolor: isDark ? "rgba(185,28,44,0.18)" : "#FBE3E6", color: C.primary, "& svg": { fontSize: 22 },
                }}>
                  {icon}
                </Box>
                <Box>
                  <Typography sx={{ fontWeight: 700, fontSize: "0.9rem", lineHeight: 1.25 }}>{title}</Typography>
                  <Typography sx={{ color: "text.secondary", fontSize: "0.8rem" }}>{text}</Typography>
                </Box>
              </Box>
            ))}
          </Box>
        </Container>
      </Box>

      {/* ── Form + sidebar ───────────────────────────────────────────────── */}
      <Container maxWidth={false} sx={{ maxWidth: 1440, mt: { xs: 1, md: 2 } }}>
        <Box sx={{
          display: "grid", gridTemplateColumns: { xs: "1fr", lg: "minmax(0, 1fr) 380px" },
          gap: { xs: 2.5, md: 3 }, alignItems: "start",
        }}>

          <Box component="form" onSubmit={handleSubmit} noValidate autoComplete="off"
            sx={{ display: "flex", flexDirection: "column", gap: 2.5 }}>

            {authKnown && !hasSession && (
              <Alert severity="info" icon={<LockOutlinedIcon />}
                sx={{ borderRadius: "14px", alignItems: "center", "& .MuiAlert-message": { flex: 1 } }}
                action={(
                  <Box sx={{ display: "flex", gap: 1 }}>
                    <Button component={Link} href={LOGIN_HREF} size="small" variant="contained"
                      sx={{ textTransform: "none", fontWeight: 700, borderRadius: "8px", bgcolor: C.primary, boxShadow: "none", "&:hover": { bgcolor: C.dark } }}>
                      Log in
                    </Button>
                    <Button component={Link} href={REGISTER_HREF} size="small"
                      sx={{ textTransform: "none", fontWeight: 700, borderRadius: "8px", color: C.primary, display: { xs: "none", sm: "inline-flex" } }}>
                      Register
                    </Button>
                  </Box>
                )}>
                <Typography sx={{ fontWeight: 700, fontSize: "0.9rem" }}>You&apos;ll need to log in to send a request</Typography>
                <Typography sx={{ fontSize: "0.84rem" }}>You can fill in the form first — your answers are kept while you log in.</Typography>
              </Alert>
            )}

            {/* 1. Blood type + units */}
            <Panel icon={<BloodtypeIcon />} title={<>Blood Needed{stepBadge(1)}</>} subtitle="The patient's blood type and how many units">
              <Box id="field-bloodType" role="radiogroup" aria-label="Blood type needed" aria-invalid={!!errorFor("bloodType")} sx={{
                display: "grid", gridTemplateColumns: { xs: "repeat(4, 1fr)", md: "repeat(8, 1fr)" }, gap: 1.25,
              }}>
                {BLOOD_TYPES.map((bt, i) => {
                  const selected = form.bloodType === bt;
                  return (
                    <Box key={bt} component="button" type="button" role="radio" aria-checked={selected}
                      ref={(el) => { bloodRefs.current[i] = el; }}
                      tabIndex={tabStop(selected, i, form.bloodType)}
                      onClick={() => set("bloodType", bt)}
                      onKeyDown={(e) => radioKeyDown(e, i, BLOOD_TYPES.map((_, j) => ({ el: bloodRefs.current[j] })), (n) => set("bloodType", BLOOD_TYPES[n]), 4)}
                      sx={{
                        py: { xs: 1.5, sm: 2 }, borderRadius: "12px", cursor: "pointer",
                        font: "inherit", fontWeight: 800, fontSize: { xs: "1.05rem", sm: "1.2rem" },
                        display: "flex", flexDirection: "column", alignItems: "center", gap: 0.5,
                        border: `1.5px solid ${selected ? C.primary : errorFor("bloodType") ? "#EF4444" : border}`,
                        bgcolor: selected ? C.primary : "background.paper",
                        color: selected ? "#fff" : "text.primary",
                        boxShadow: selected ? `0 6px 18px ${C.ring}` : "none",
                        transition: "all 0.15s ease",
                        "&:hover": { borderColor: C.primary, bgcolor: selected ? C.primary : softTile },
                        "&:focus-visible": { outline: `3px solid ${C.ring}`, outlineOffset: 2 },
                      }}>
                      <WaterDropIcon aria-hidden="true" sx={{ fontSize: 20, color: selected ? "#fff" : C.primary }} />
                      {bt}
                    </Box>
                  );
                })}
              </Box>
              {groupError("bloodType")}

              <Box sx={{
                mt: 2.5, pt: 2.5, borderTop: `1px solid ${border}`,
                display: "flex", alignItems: "center", justifyContent: "space-between", gap: 2, flexWrap: "wrap",
              }}>
                <Box>
                  <Typography id="units-label" sx={{ fontWeight: 700, fontSize: "0.95rem" }}>Units needed</Typography>
                  <Typography sx={{ color: "text.secondary", fontSize: "0.82rem" }}>One unit is about 450 ml — up to {MAX_UNITS} per request</Typography>
                </Box>
                <Box role="group" aria-labelledby="units-label" sx={{
                  display: "flex", alignItems: "center", gap: 0.5, p: 0.5, borderRadius: "12px", border: `1px solid ${border}`,
                }}>
                  <IconButton aria-label="Fewer units" size="small" disabled={form.unitsNeeded <= 1}
                    onClick={() => set("unitsNeeded", form.unitsNeeded - 1)}
                    sx={{ borderRadius: "8px", color: C.primary, bgcolor: softTile, "&:hover": { bgcolor: softTile } }}>
                    <RemoveIcon fontSize="small" />
                  </IconButton>
                  <Typography aria-live="polite" sx={{ minWidth: 72, textAlign: "center", fontWeight: 800, fontSize: "1.1rem" }}>
                    {form.unitsNeeded} <Box component="span" sx={{ fontWeight: 500, fontSize: "0.82rem", color: "text.secondary" }}>unit{form.unitsNeeded !== 1 ? "s" : ""}</Box>
                  </Typography>
                  <IconButton aria-label="More units" size="small" disabled={form.unitsNeeded >= MAX_UNITS}
                    onClick={() => set("unitsNeeded", form.unitsNeeded + 1)}
                    sx={{ borderRadius: "8px", color: C.primary, bgcolor: softTile, "&:hover": { bgcolor: softTile } }}>
                    <AddIcon fontSize="small" />
                  </IconButton>
                </Box>
              </Box>
            </Panel>

            {/* 2. Urgency */}
            <Panel icon={<PriorityHighIcon />} title={<>Urgency{stepBadge(2)}</>} subtitle="How soon is the blood needed?">
              <Box id="field-urgency" role="radiogroup" aria-label="Urgency level" aria-invalid={!!errorFor("urgency")} sx={{
                display: "grid", gridTemplateColumns: { xs: "1fr 1fr", md: "repeat(4, 1fr)" }, gap: 1.25,
              }}>
                {URGENCY.map((u, i) => {
                  const selected = form.urgency === u.value;
                  return (
                    <Box key={u.value} component="button" type="button" role="radio" aria-checked={selected}
                      ref={(el) => { urgencyRefs.current[i] = el; }}
                      tabIndex={tabStop(selected, i, form.urgency)}
                      onClick={() => set("urgency", u.value)}
                      onKeyDown={(e) => radioKeyDown(e, i, URGENCY.map((_, j) => ({ el: urgencyRefs.current[j] })), (n) => set("urgency", URGENCY[n].value), 2)}
                      sx={{
                        textAlign: "left", p: 1.75, borderRadius: "12px", cursor: "pointer", font: "inherit", color: "text.primary",
                        border: `1.5px solid ${selected ? u.color : errorFor("urgency") ? "#EF4444" : border}`,
                        bgcolor: selected ? `${u.color}${isDark ? "22" : "10"}` : "background.paper",
                        boxShadow: selected ? `0 6px 18px ${u.color}33` : "none",
                        transition: "all 0.15s ease",
                        "&:hover": { borderColor: u.color },
                        "&:focus-visible": { outline: `3px solid ${u.color}55`, outlineOffset: 2 },
                      }}>
                      <Box sx={{ display: "flex", alignItems: "center", gap: 0.75, mb: 0.5 }}>
                        <Box component="span" aria-hidden="true" sx={{
                          width: 10, height: 10, borderRadius: "50%", bgcolor: u.color, flexShrink: 0,
                          boxShadow: u.value === "Critical" ? `0 0 0 4px ${u.color}26` : "none",
                        }} />
                        <Typography component="span" sx={{ fontWeight: 800, fontSize: "0.98rem", color: selected ? u.color : "text.primary" }}>{u.value}</Typography>
                        {selected && <CheckCircleIcon aria-hidden="true" sx={{ ml: "auto", fontSize: 18, color: u.color }} />}
                      </Box>
                      <Typography component="span" sx={{ display: "block", fontWeight: 600, fontSize: "0.8rem" }}>{u.eta}</Typography>
                      <Typography component="span" sx={{ display: "block", color: "text.secondary", fontSize: "0.76rem", lineHeight: 1.4 }}>{u.hint}</Typography>
                    </Box>
                  );
                })}
              </Box>
              {groupError("urgency")}
            </Panel>

            {/* 3. Hospital + patient */}
            <Panel icon={<PersonOutlineIcon />} title={<>Hospital &amp; Patient{stepBadge(3)}</>} subtitle="Where the patient is being treated">
              <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" }, gap: 2 }}>
                <Box id="field-hospital">
                <TextField select fullWidth label="Hospital" required value={centers ? form.hospitalKey : ""}
                  onChange={handleChange("hospitalKey")} disabled={!centers}
                  SelectProps={{ renderValue: (key) => centers?.find((c) => c.key === key)?.name || "" }}
                  error={!!errorFor("hospital")}
                  helperText={!centers ? "Loading hospitals…" : errorFor("hospital") || " "} sx={fieldSx}>
                  {(centers || []).map((c) => (
                    <MenuItem key={c.key} value={c.key}>
                      <Box sx={{ minWidth: 0 }}>
                        <Typography sx={{ fontWeight: 600, fontSize: "0.92rem" }}>{c.name}</Typography>
                        {c.city && <Typography sx={{ color: "text.secondary", fontSize: "0.78rem" }}>{c.city}</Typography>}
                      </Box>
                    </MenuItem>
                  ))}
                </TextField>
                </Box>
                <Box id="field-patientName">
                  <TextField fullWidth label="Patient Full Name" required value={form.patientName}
                    onChange={handleChange("patientName")} placeholder="e.g. Sok Dara" autoComplete="off"
                    inputProps={{ maxLength: 100 }} error={!!errorFor("patientName")}
                    helperText={errorFor("patientName") || " "} sx={fieldSx} />
                </Box>
              </Box>

              {center && (
                <Box sx={{ display: "flex", alignItems: "center", gap: 1.75, p: 1.25, borderRadius: "12px", border: `1px solid ${border}`, bgcolor: isDark ? "#151515" : C.softer }}>
                  <Box sx={{ width: 112, flexShrink: 0 }}>
                    <HospitalPhoto src={center.image} name={center.name} height={68} radius={8} />
                  </Box>
                  <Box sx={{ minWidth: 0 }}>
                    <Typography sx={{ fontWeight: 700, fontSize: "0.95rem", lineHeight: 1.3 }}>{center.name}</Typography>
                    {(center.address || center.city) && (
                      <Typography sx={{ color: "text.secondary", fontSize: "0.82rem", display: "flex", alignItems: "center", gap: 0.4, mt: 0.25 }}>
                        <PlaceOutlinedIcon sx={{ fontSize: 15 }} aria-hidden="true" />
                        {[center.address, center.city].filter(Boolean).join(", ")}
                      </Typography>
                    )}
                    {center.phone && <Typography sx={{ color: "text.secondary", fontSize: "0.82rem", mt: 0.25 }}>{center.phone}</Typography>}
                  </Box>
                </Box>
              )}
            </Panel>

            {/* 4. Details + submit */}
            <Panel icon={<DescriptionOutlinedIcon />} title={<>Request Details{stepBadge(4)}</>} subtitle="Helps the hospital prioritise and contact you">
              <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                <Box id="field-reason">
                  <Typography sx={{ fontSize: "0.84rem", color: "text.secondary", mb: 1 }}>Common reasons — tap to add:</Typography>
                  <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1, mb: 1.75 }}>
                    {QUICK_REASONS.map((label) => {
                      const added = form.reason.toLowerCase().includes(label.toLowerCase());
                      return (
                        <Box key={label} component="button" type="button" onClick={() => addReason(label)} aria-pressed={added}
                          sx={{
                            px: 1.5, py: 0.6, borderRadius: "999px", font: "inherit", fontSize: "0.84rem", fontWeight: 600, cursor: added ? "default" : "pointer",
                            display: "inline-flex", alignItems: "center", gap: 0.5,
                            border: `1px solid ${added ? C.primary : border}`,
                            bgcolor: added ? softTile : "background.paper", color: added ? C.primary : "text.primary",
                            "&:hover": { borderColor: C.primary },
                            "&:focus-visible": { outline: `3px solid ${C.ring}`, outlineOffset: 2 },
                          }}>
                          {added ? <CheckCircleIcon aria-hidden="true" sx={{ fontSize: 15 }} /> : <AddIcon aria-hidden="true" sx={{ fontSize: 15 }} />}
                          {label}
                        </Box>
                      );
                    })}
                  </Box>
                  <TextField fullWidth label="Reason for Request" required multiline minRows={3}
                    placeholder="Describe the patient's condition and why blood is needed…"
                    value={form.reason} onChange={handleChange("reason")}
                    error={!!errorFor("reason")} helperText={errorFor("reason") || undefined} sx={fieldSx} />
                </Box>
                <TextField fullWidth label="Contact / Notes (Optional)" multiline minRows={2}
                  placeholder="Contact number, ward, special instructions…"
                  value={form.notes} onChange={handleChange("notes")} sx={fieldSx} />
              </Box>

              {showErrors && Object.values(fieldErrors).some(Boolean) && (
                <Alert severity="warning" sx={{ mt: 2.5, borderRadius: "10px" }}>
                  A few things are still missing — they&apos;re marked in red above.
                </Alert>
              )}
              {error && (
                <Alert severity="error" sx={{ mt: 2.5, borderRadius: "10px" }} onClose={() => setError("")}>
                  {error}
                </Alert>
              )}

              <Box sx={{ mt: 2.5, pt: 2.5, borderTop: `1px solid ${border}`, display: "flex", flexDirection: { xs: "column", sm: "row" }, alignItems: { sm: "center" }, gap: 2 }}>
                <Box sx={{ flex: 1 }}>
                  <Typography sx={{ fontWeight: 700, fontSize: "0.9rem" }}>{done} of {required.length} steps complete</Typography>
                  <Box sx={{ mt: 0.75, height: 6, borderRadius: 3, bgcolor: isDark ? "#262626" : "#F1F5F9", overflow: "hidden", maxWidth: 260 }}>
                    <Box sx={{ height: "100%", width: `${(done / required.length) * 100}%`, bgcolor: C.primary, transition: "width 0.3s ease" }} />
                  </Box>
                </Box>
                {authKnown && !hasSession ? (
                  <Button component={Link} href={LOGIN_HREF} variant="contained" size="large" startIcon={<LockOutlinedIcon />}
                    sx={{
                      px: 4, py: 1.4, fontWeight: 700, fontSize: "1rem", borderRadius: "12px", textTransform: "none",
                      bgcolor: C.primary, boxShadow: `0 8px 20px ${C.ring}`,
                      "&:hover": { bgcolor: C.dark, boxShadow: `0 10px 26px ${C.ring}` },
                    }}>
                    Log in to Submit
                  </Button>
                ) : (
                  <Button variant="contained" size="large" type="submit" disabled={loading}
                    endIcon={loading ? <CircularProgress size={18} color="inherit" /> : <ArrowForwardIcon />}
                    sx={{
                      px: 4, py: 1.4, fontWeight: 700, fontSize: "1rem", borderRadius: "12px", textTransform: "none",
                      bgcolor: urgency?.value === "Critical" ? "#DC2626" : C.primary, boxShadow: `0 8px 20px ${C.ring}`,
                      "&:hover": { bgcolor: C.dark, boxShadow: `0 10px 26px ${C.ring}` },
                    }}>
                    {loading ? "Submitting…" : urgency?.value === "Critical" ? "Send Critical Request" : "Submit Request"}
                  </Button>
                )}
              </Box>
              <Typography sx={{ mt: 1.5, color: "text.secondary", fontSize: "0.78rem", display: "flex", alignItems: "center", gap: 0.5, justifyContent: { sm: "flex-end" } }}>
                <LockOutlinedIcon sx={{ fontSize: 14 }} aria-hidden="true" />
                {authKnown && !hasSession
                  ? "Your answers are saved — log in and you'll come right back here."
                  : "By submitting, you confirm this is a genuine medical need."}
              </Typography>
            </Panel>
          </Box>

          {/* ── Sidebar ──────────────────────────────────────────────────── */}
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2.5, position: { lg: "sticky" }, top: { lg: 88 } }}>

            {/* Live request summary */}
            <Box component="section" aria-labelledby="summary-title" sx={{
              display: { xs: "none", lg: "block" }, position: "relative", overflow: "hidden", borderRadius: "16px", p: 2.5, color: "#fff",
              background: `linear-gradient(135deg, ${C.primary} 0%, ${C.dark} 100%)`,
              boxShadow: `0 14px 34px ${C.ring}`,
            }}>
              <WaterDropIcon aria-hidden="true" sx={{ position: "absolute", right: -30, top: -20, fontSize: 180, opacity: 0.1 }} />
              <Typography component="h2" id="summary-title" sx={{ position: "relative", fontWeight: 700, fontSize: "0.85rem", letterSpacing: "0.08em", textTransform: "uppercase", opacity: 0.9, mb: 2 }}>
                Request Summary
              </Typography>
              <Box aria-live="polite" sx={{ display: "flex", alignItems: "center", gap: 2, position: "relative" }}>
                <Box sx={{
                  width: 72, height: 72, borderRadius: "16px", flexShrink: 0, bgcolor: "#fff", color: C.primary,
                  display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", lineHeight: 1,
                }}>
                  <Typography sx={{ fontWeight: 900, fontSize: form.bloodType.length > 2 ? "1.45rem" : "1.75rem", lineHeight: 1 }}>{form.bloodType || "?"}</Typography>
                  <Typography sx={{ fontSize: "0.7rem", fontWeight: 700, mt: 0.5, opacity: 0.8 }}>× {form.unitsNeeded}</Typography>
                </Box>
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Typography sx={{ fontWeight: 800, fontSize: "1.1rem", lineHeight: 1.25, overflowWrap: "anywhere", opacity: form.patientName.trim() ? 1 : 0.6 }}>
                    {form.patientName.trim() || "Patient name"}
                  </Typography>
                  <Typography sx={{ fontSize: "0.84rem", opacity: center ? 0.9 : 0.6, display: "flex", alignItems: "center", gap: 0.4 }}>
                    <LocalHospitalIcon sx={{ fontSize: 15 }} aria-hidden="true" />{center?.name || "No hospital selected"}
                  </Typography>
                </Box>
              </Box>
              <Box sx={{ mt: 2, pt: 1.5, borderTop: "1px solid rgba(255,255,255,0.2)", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 1, position: "relative", fontSize: "0.84rem" }}>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  <Box component="span" sx={{ width: 8, height: 8, borderRadius: "50%", bgcolor: urgency ? "#fff" : "rgba(255,255,255,0.5)" }} />
                  {urgency ? `${urgency.value} urgency` : "Urgency not set"}
                </Box>
                {urgency && <Box component="span" sx={{ opacity: 0.85 }}>{urgency.eta}</Box>}
              </Box>
            </Box>

            {/* Your requests */}
            <Box component="section" aria-labelledby="my-requests-title" sx={cardSx}>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1.25, mb: 1.5 }}>
                <Box aria-hidden="true" sx={iconTile}><ListAltIcon /></Box>
                <Typography component="h2" id="my-requests-title" sx={{ flex: 1, fontWeight: 800, fontSize: "1.1rem" }}>Your Requests</Typography>
                {loggedIn && myRequests?.length > 0 && (
                  <Box component={Link} href="/my-requests" sx={{ color: C.primary, fontWeight: 600, fontSize: "0.84rem", textDecoration: "none", "&:hover": { textDecoration: "underline" } }}>
                    View all
                  </Box>
                )}
              </Box>

              {!authKnown ? (
                <Skeleton variant="rounded" height={56} sx={{ borderRadius: "10px" }} />
              ) : !hasSession ? (
                <Box>
                  <Typography sx={{ color: "text.secondary", fontSize: "0.86rem", mb: 1.5 }}>
                    Log in to submit requests and follow their status as hospitals respond.
                  </Typography>
                  <Button component={Link} href={LOGIN_HREF} fullWidth variant="outlined"
                    sx={{ textTransform: "none", fontWeight: 700, borderRadius: "10px", color: C.primary, borderColor: border, "&:hover": { borderColor: C.primary, bgcolor: C.softer } }}>
                    Log in
                  </Button>
                </Box>
              ) : myRequests === null ? (
                <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
                  {[0, 1].map((i) => <Skeleton key={i} variant="rounded" height={52} sx={{ borderRadius: "10px" }} />)}
                </Box>
              ) : myRequests.length === 0 ? (
                <Typography sx={{ color: "text.secondary", fontSize: "0.86rem" }}>
                  You haven&apos;t submitted any requests yet. Once you do, they&apos;ll appear here.
                </Typography>
              ) : (
                <Box component="ul" sx={{ listStyle: "none", m: 0, p: 0, display: "flex", flexDirection: "column", gap: 1 }}>
                  {myRequests.slice(0, 3).map((r) => {
                    const st = STATUS[r.status] || STATUS.Pending;
                    return (
                      <Box component="li" key={r._id} sx={{ display: "flex", alignItems: "center", gap: 1.25, p: 1, borderRadius: "10px", border: `1px solid ${border}` }}>
                        <Box sx={{ width: 38, height: 38, borderRadius: "10px", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: "0.85rem", color: C.primary, bgcolor: softTile }}>
                          {r.bloodType}
                        </Box>
                        <Box sx={{ flex: 1, minWidth: 0 }}>
                          <Typography noWrap sx={{ fontWeight: 700, fontSize: "0.86rem" }}>{r.patientName}</Typography>
                          <Typography noWrap sx={{ color: "text.secondary", fontSize: "0.76rem" }}>
                            {r.unitsNeeded || 1} unit{(r.unitsNeeded || 1) !== 1 ? "s" : ""}{r.createdAt ? ` · ${shortDate(r.createdAt)}` : ""}
                          </Typography>
                        </Box>
                        <Box component="span" sx={{ px: 1, py: 0.25, borderRadius: "999px", fontSize: "0.72rem", fontWeight: 700, color: st.color, bgcolor: st.bg }}>
                          {r.status || "Pending"}
                        </Box>
                      </Box>
                    );
                  })}
                </Box>
              )}
            </Box>

            {/* What happens next */}
            <Box component="section" aria-labelledby="next-steps-title" sx={cardSx}>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1.25, mb: 2 }}>
                <Box aria-hidden="true" sx={iconTile}><FormatListNumberedIcon /></Box>
                <Typography component="h2" id="next-steps-title" sx={{ fontWeight: 800, fontSize: "1.1rem" }}>What Happens Next?</Typography>
              </Box>
              <Box component="ol" sx={{ listStyle: "none", m: 0, p: 0 }}>
                {PROCESS_STEPS.map((step, i) => (
                  <Box component="li" key={step.title} sx={{ display: "flex", gap: 1.75 }}>
                    <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                      <Box sx={{
                        width: 28, height: 28, borderRadius: "50%", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center",
                        fontWeight: 700, fontSize: "0.82rem",
                        bgcolor: i === 0 ? C.primary : softTile, color: i === 0 ? "#fff" : C.primary,
                      }}>{i + 1}</Box>
                      {i < PROCESS_STEPS.length - 1 && <Box sx={{ width: 2, flexGrow: 1, minHeight: 18, bgcolor: border, my: 0.5 }} />}
                    </Box>
                    <Box sx={{ pb: i < PROCESS_STEPS.length - 1 ? 2 : 0 }}>
                      <Typography sx={{ fontWeight: 700, fontSize: "0.92rem", lineHeight: 1.3 }}>{step.title}</Typography>
                      <Typography sx={{ color: "text.secondary", fontSize: "0.82rem" }}>{step.text}</Typography>
                    </Box>
                  </Box>
                ))}
              </Box>
            </Box>

            <NeedHelp />
          </Box>
        </Box>
      </Container>
    </Box>
  );
}
