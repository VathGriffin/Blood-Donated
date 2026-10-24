'use client';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { useEffect, useState, useRef } from "react";
import {
  Container, Box, Typography, TextField, Button, Switch, Checkbox, FormControlLabel,
  useTheme, Alert, Avatar, CircularProgress,
} from "@mui/material";
import API_BASE from "@/lib/config";
import BloodtypeIcon from "@mui/icons-material/Bloodtype";
import WaterDropIcon from "@mui/icons-material/WaterDrop";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import AddAPhotoIcon from "@mui/icons-material/AddAPhoto";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import FavoriteIcon from "@mui/icons-material/Favorite";
import PeopleIcon from "@mui/icons-material/People";
import VerifiedUserIcon from "@mui/icons-material/VerifiedUser";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import PersonOutlineIcon from "@mui/icons-material/PersonOutline";
import HistoryIcon from "@mui/icons-material/History";
import FactCheckOutlinedIcon from "@mui/icons-material/FactCheckOutlined";
import FormatListNumberedIcon from "@mui/icons-material/FormatListNumbered";
import PlaceOutlinedIcon from "@mui/icons-material/PlaceOutlined";
import BadgeOutlinedIcon from "@mui/icons-material/BadgeOutlined";
import LockOutlinedIcon from "@mui/icons-material/LockOutlined";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import Panel from "../appointments/_components/Panel";
import { NeedHelp } from "../appointments/_components/SidePanels";
import { BLOOD_TYPES, C } from "../appointments/_components/booking";

// A donor's arm on the chair, giving blood.
const HERO_IMG =
  "https://images.unsplash.com/photo-1536856136534-bb679c52a9aa?auto=format&fit=crop&w=900&q=80";

const MAX_PHOTO_SIZE = 10 * 1024 * 1024; // must match Backend/src/donor/donor.routes.js multer limit

const HERO_POINTS = [
  { icon: <VerifiedUserIcon />, title: "Safe & Secure", text: "Certified medical staff" },
  { icon: <AccessTimeIcon />, title: "Quick Process", text: "About 30–45 minutes" },
  { icon: <PeopleIcon />, title: "Real Impact", text: "Help save up to 3 lives" },
];

// Who can receive from each type — shown under the picker once a type is chosen.
const COMPAT = {
  "O-": "Universal donor — can give to every blood type.",
  "O+": "Can give to O+, A+, B+ and AB+ — the most common type.",
  "A-": "Can give to A-, A+, AB- and AB+.",
  "A+": "Can give to A+ and AB+.",
  "B-": "Can give to B-, B+, AB- and AB+.",
  "B+": "Can give to B+ and AB+.",
  "AB-": "Can give to AB- and AB+.",
  "AB+": "Universal plasma donor — red cells can go to AB+.",
};

const ELIGIBILITY = [
  "I am between 18 and 60 years old",
  "I weigh at least 45 kg",
  "I have not donated blood in the past 3 months",
  "I do not have any active infection or illness",
];

const PROCESS_STEPS = [
  { title: "Register Online", text: "Fill in this form — about 2 minutes" },
  { title: "We Contact You", text: "Our team confirms your details" },
  { title: "Health Screening", text: "A quick and simple check" },
  { title: "Donate & Save Lives", text: "Your gift can help up to 3 people" },
];

const fieldSx = { "& .MuiOutlinedInput-root": { borderRadius: "10px" } };

const DonateBlood = () => {
  const isDark = useTheme().palette.mode === "dark";
  const border = isDark ? "#262626" : C.border;
  const softTile = isDark ? "rgba(185,28,44,0.16)" : C.soft;

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
    setError("");
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

  const validate = () => {
    if (!bloodType) return "Please select your blood type.";
    if (!formData.fullName.trim()) return "Full name is required.";
    if (!/\S+@\S+\.\S+/.test(formData.email.trim())) return "A valid email address is required.";
    if (!formData.phone.trim()) return "Phone number is required.";
    if (!formData.location.trim()) return "Location / city is required.";
    if (!eligibilityAck) return "Please confirm that you meet the donation eligibility criteria.";
    return "";
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const problem = validate();
    if (problem) { setError(problem); return; }
    setError("");
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

  // Progress through the required sections (history is optional), shown above the submit button.
  const required = [
    !!bloodType,
    !!(formData.fullName.trim() && formData.email.trim() && formData.phone.trim() && formData.location.trim()),
    eligibilityAck,
  ];
  const done = required.filter(Boolean).length;

  const cardSx = {
    bgcolor: "background.paper", borderRadius: "16px", p: { xs: 2, sm: 2.5 },
    border: `1px solid ${border}`,
    boxShadow: isDark ? "none" : "0 1px 2px rgba(15,23,42,0.04), 0 8px 24px rgba(15,23,42,0.04)",
  };
  const stepBadge = (n) => (
    <Box component="span" sx={{
      ml: 1, px: 1, py: 0.25, borderRadius: "999px", fontSize: "0.72rem", fontWeight: 700,
      color: C.primary, bgcolor: softTile, verticalAlign: "middle",
    }}>Step {n}</Box>
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

        <Container maxWidth={false} sx={{
          maxWidth: 1440, position: "relative", pt: { xs: 4, md: 5 }, pb: { xs: 6, md: 7 },
          display: "flex", alignItems: "center", gap: 6,
        }}>
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Box sx={{
              display: "inline-flex", alignItems: "center", gap: 0.75, px: 1.5, py: 0.5, mb: 2, borderRadius: "999px",
              bgcolor: isDark ? "rgba(185,28,44,0.18)" : "#fff", color: C.primary, fontWeight: 700, fontSize: "0.8rem",
              boxShadow: isDark ? "none" : "0 2px 10px rgba(185,28,44,0.10)",
            }}>
              <FavoriteIcon sx={{ fontSize: 16 }} aria-hidden="true" /> Donor Registration
            </Box>
            <Typography component="h1" sx={{
              fontWeight: 800, fontSize: { xs: "2rem", sm: "2.5rem", md: "3rem" }, letterSpacing: "-0.03em", lineHeight: 1.08,
            }}>
              Become a Blood Donor,<br />
              <Box component="span" sx={{ color: C.primary }}>Save Lives</Box>
            </Typography>
            <Typography sx={{ color: "text.secondary", mt: 1.5, fontSize: { xs: "1rem", md: "1.1rem" }, maxWidth: 560, lineHeight: 1.65 }}>
              Join our community of donors. Register once and hospitals near you can reach you when your blood type is needed.
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
          </Box>

          {/* Photo (decorative) */}
          <Box aria-hidden="true" sx={{ display: { xs: "none", md: "block" }, position: "relative", flexShrink: 0, width: { md: 340, lg: 420 } }}>
            <Box sx={{
              position: "relative", borderRadius: "24px", overflow: "hidden", aspectRatio: "4 / 3",
              boxShadow: "0 20px 50px rgba(136,29,42,0.25)",
            }}>
              <Image src={HERO_IMG} alt="" fill sizes="420px" style={{ objectFit: "cover" }} priority />
              <Box sx={{ position: "absolute", inset: 0, background: "linear-gradient(180deg, transparent 50%, rgba(0,0,0,0.45) 100%)" }} />
            </Box>
            <Box sx={{
              position: "absolute", left: -28, bottom: 24, display: "flex", alignItems: "center", gap: 1.25,
              px: 2, py: 1.25, borderRadius: "14px", bgcolor: "background.paper",
              boxShadow: "0 10px 30px rgba(15,23,42,0.15)",
            }}>
              <Box sx={{ width: 40, height: 40, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", bgcolor: C.primary, color: "#fff" }}>
                <WaterDropIcon sx={{ fontSize: 22 }} />
              </Box>
              <Box>
                <Typography sx={{ fontWeight: 800, fontSize: "1.1rem", lineHeight: 1.1 }}>1 donation</Typography>
                <Typography sx={{ color: "text.secondary", fontSize: "0.8rem" }}>can save up to 3 lives</Typography>
              </Box>
            </Box>
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

            {/* 1. Blood type */}
            <Panel icon={<BloodtypeIcon />} title={<>Your Blood Type{stepBadge(1)}</>} subtitle="All blood types are needed — pick yours">
              <Box role="radiogroup" aria-label="Blood type" sx={{
                display: "grid", gridTemplateColumns: { xs: "repeat(4, 1fr)", md: "repeat(8, 1fr)" }, gap: 1.25,
              }}>
                {BLOOD_TYPES.map((bt) => {
                  const selected = bloodType === bt;
                  return (
                    <Box key={bt} component="button" type="button" role="radio" aria-checked={selected}
                      onClick={() => { setBloodType(bt); setError(""); }}
                      sx={{
                        position: "relative", py: { xs: 1.5, sm: 2 }, borderRadius: "12px", cursor: "pointer",
                        font: "inherit", fontWeight: 800, fontSize: { xs: "1.05rem", sm: "1.2rem" },
                        display: "flex", flexDirection: "column", alignItems: "center", gap: 0.5,
                        border: `1.5px solid ${selected ? C.primary : border}`,
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
              <Typography aria-live="polite" sx={{ mt: 1.75, fontSize: "0.86rem", color: bloodType ? "text.primary" : "text.secondary", display: "flex", alignItems: "center", gap: 0.75 }}>
                {bloodType
                  ? <><CheckCircleIcon sx={{ fontSize: 18, color: C.ok }} aria-hidden="true" /><span><b>{bloodType}:</b> {COMPAT[bloodType]}</span></>
                  : "Not sure? Your blood type is confirmed during the health screening — pick your best guess."}
              </Typography>
            </Panel>

            {/* 2. Personal details */}
            <Panel icon={<PersonOutlineIcon />} title={<>Your Details{stepBadge(2)}</>} subtitle="So our team can contact you to confirm">
              <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 2.5, p: 1.5, borderRadius: "12px", border: `1px dashed ${isDark ? "#333" : "#CBD5E1"}` }}>
                <Avatar src={photoPreview || undefined} sx={{ width: 56, height: 56, bgcolor: softTile, color: C.primary }}>
                  <AddAPhotoIcon sx={{ fontSize: 24 }} />
                </Avatar>
                <input ref={photoInputRef} type="file" accept="image/*" hidden onChange={handlePhotoChange} />
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Typography sx={{ fontWeight: 600, fontSize: "0.92rem" }}>Profile photo <Box component="span" sx={{ color: "text.secondary", fontWeight: 400 }}>(optional)</Box></Typography>
                  <Typography sx={{ color: photoError ? "error.main" : "text.secondary", fontSize: "0.8rem" }}>
                    {photoError || `JPG or PNG, up to ${MAX_PHOTO_SIZE / (1024 * 1024)} MB`}
                  </Typography>
                </Box>
                {photoPreview ? (
                  <Button size="small" color="error" startIcon={<DeleteOutlineIcon />} onClick={handleRemovePhoto} sx={{ textTransform: "none", fontWeight: 600 }}>
                    Remove
                  </Button>
                ) : (
                  <Button size="small" variant="outlined" onClick={() => photoInputRef.current?.click()}
                    sx={{ textTransform: "none", fontWeight: 600, color: C.primary, borderColor: border, borderRadius: "8px", "&:hover": { borderColor: C.primary, bgcolor: C.softer } }}>
                    Upload
                  </Button>
                )}
              </Box>

              <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" }, gap: 2 }}>
                <TextField fullWidth label="Full Name" name="fullName" value={formData.fullName}
                  onChange={handleChange} required placeholder="e.g. Sok Dara" autoComplete="name"
                  sx={{ ...fieldSx, gridColumn: "1 / -1" }} />
                <TextField fullWidth label="Email Address" name="email" value={formData.email}
                  onChange={handleChange} type="email" required placeholder="you@example.com" autoComplete="email" sx={fieldSx} />
                <TextField fullWidth label="Phone Number" name="phone" value={formData.phone}
                  onChange={handleChange} type="tel" required placeholder="012 345 678" autoComplete="tel" sx={fieldSx} />
                <TextField fullWidth label="Location / City" name="location" value={formData.location}
                  onChange={handleChange} required placeholder="e.g. Phnom Penh"
                  sx={{ ...fieldSx, gridColumn: "1 / -1" }} />
              </Box>
            </Panel>

            {/* 3. Donation history */}
            <Panel icon={<HistoryIcon />} title={<>Donation History{stepBadge(3)}</>} subtitle="Optional — helps us know when you can donate next">
              <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" }, gap: 2 }}>
                <TextField fullWidth label="Last Donation Date" name="lastDonation" type="date"
                  value={formData.lastDonation} onChange={handleChange}
                  InputLabelProps={{ shrink: true }}
                  inputProps={{ max: new Date().toISOString().slice(0, 10) }}
                  helperText="Leave blank if this is your first donation" sx={fieldSx} />
                <Box sx={{
                  display: "flex", alignItems: "center", justifyContent: "space-between", gap: 1.5,
                  px: 2, py: 1, borderRadius: "10px", alignSelf: "start", minHeight: 56,
                  border: `1px solid ${formData.available ? (isDark ? "rgba(21,128,61,0.4)" : "#BBF7D0") : border}`,
                  bgcolor: formData.available ? (isDark ? "rgba(21,128,61,0.12)" : "#F0FDF4") : "transparent",
                }}>
                  <Box>
                    <Typography sx={{ fontWeight: 600, fontSize: "0.92rem" }}>Available to donate</Typography>
                    <Typography sx={{ color: "text.secondary", fontSize: "0.8rem" }}>I&apos;m ready when contacted</Typography>
                  </Box>
                  <Switch checked={formData.available} onChange={handleChange} name="available" color="success"
                    inputProps={{ "aria-label": "Available to donate" }} />
                </Box>
                <TextField fullWidth label="Additional Notes (Optional)" name="notes" value={formData.notes}
                  onChange={handleChange} multiline minRows={3}
                  placeholder="Medical conditions, preferred contact time, etc."
                  sx={{ ...fieldSx, gridColumn: "1 / -1" }} />
              </Box>
            </Panel>

            {/* 4. Eligibility + submit */}
            <Panel icon={<FactCheckOutlinedIcon />} title={<>Eligibility{stepBadge(4)}</>} subtitle="Please confirm you meet the basic requirements">
              <Box component="ul" sx={{
                listStyle: "none", m: 0, p: 0, display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" }, gap: 1.25,
              }}>
                {ELIGIBILITY.map((text) => (
                  <Box component="li" key={text} sx={{ display: "flex", alignItems: "flex-start", gap: 1, fontSize: "0.9rem", lineHeight: 1.45 }}>
                    <CheckCircleIcon aria-hidden="true" sx={{ color: C.primary, fontSize: 19, flexShrink: 0, mt: "1px" }} />{text}
                  </Box>
                ))}
              </Box>

              <FormControlLabel
                control={<Checkbox checked={eligibilityAck} onChange={(e) => { setEligibilityAck(e.target.checked); setError(""); }}
                  sx={{ color: C.primary, "&.Mui-checked": { color: C.primary } }} />}
                label={<Typography sx={{ fontWeight: 600, fontSize: "0.92rem" }}>I confirm I meet all of these criteria</Typography>}
                sx={{
                  mt: 2, mx: 0, width: "100%", pr: 2, py: 0.5, borderRadius: "10px",
                  border: `1px solid ${eligibilityAck ? C.primary : border}`,
                  bgcolor: eligibilityAck ? (isDark ? "rgba(185,28,44,0.12)" : C.softer) : "transparent",
                  transition: "all 0.15s ease",
                }}
              />

              {error && (
                <Alert severity="error" sx={{ mt: 2.5, borderRadius: "10px" }} onClose={() => setError("")}>
                  {error}
                </Alert>
              )}

              <Box sx={{ mt: 2.5, pt: 2.5, borderTop: `1px solid ${border}`, display: "flex", flexDirection: { xs: "column", sm: "row" }, alignItems: { sm: "center" }, gap: 2 }}>
                <Box sx={{ flex: 1 }}>
                  <Typography sx={{ fontWeight: 700, fontSize: "0.9rem" }}>{done} of {required.length} required steps complete</Typography>
                  <Box sx={{ mt: 0.75, height: 6, borderRadius: 3, bgcolor: isDark ? "#262626" : "#F1F5F9", overflow: "hidden", maxWidth: 260 }}>
                    <Box sx={{ height: "100%", width: `${(done / required.length) * 100}%`, bgcolor: C.primary, transition: "width 0.3s ease" }} />
                  </Box>
                </Box>
                <Button variant="contained" size="large" type="submit" disabled={loading}
                  endIcon={loading ? <CircularProgress size={18} color="inherit" /> : <ArrowForwardIcon />}
                  sx={{
                    px: 4, py: 1.4, fontWeight: 700, fontSize: "1rem", borderRadius: "12px", textTransform: "none",
                    bgcolor: C.primary, boxShadow: `0 8px 20px ${C.ring}`,
                    "&:hover": { bgcolor: C.dark, boxShadow: `0 10px 26px ${C.ring}` },
                  }}>
                  {loading ? "Submitting…" : "Register as Donor"}
                </Button>
              </Box>
              <Typography sx={{ mt: 1.5, color: "text.secondary", fontSize: "0.78rem", display: "flex", alignItems: "center", gap: 0.5, justifyContent: { sm: "flex-end" } }}>
                <LockOutlinedIcon sx={{ fontSize: 14 }} aria-hidden="true" />
                Your information is kept confidential and only shared with hospitals.
              </Typography>
            </Panel>
          </Box>

          {/* ── Sidebar ──────────────────────────────────────────────────── */}
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2.5, position: { lg: "sticky" }, top: { lg: 88 } }}>

            {/* Live donor card preview */}
            <Box component="section" aria-labelledby="donor-card-title" sx={{
              position: "relative", overflow: "hidden", borderRadius: "16px", p: 2.5, color: "#fff",
              background: `linear-gradient(135deg, ${C.primary} 0%, ${C.dark} 100%)`,
              boxShadow: `0 14px 34px ${C.ring}`,
            }}>
              <WaterDropIcon aria-hidden="true" sx={{ position: "absolute", right: -30, top: -20, fontSize: 180, opacity: 0.1 }} />
              <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2, position: "relative" }}>
                <BadgeOutlinedIcon sx={{ fontSize: 20 }} aria-hidden="true" />
                <Typography component="h2" id="donor-card-title" sx={{ fontWeight: 700, fontSize: "0.85rem", letterSpacing: "0.08em", textTransform: "uppercase", opacity: 0.9 }}>
                  Your Donor Card
                </Typography>
              </Box>
              <Box sx={{ display: "flex", alignItems: "center", gap: 2, position: "relative" }}>
                <Avatar src={photoPreview || undefined} sx={{ width: 60, height: 60, bgcolor: "rgba(255,255,255,0.18)", border: "2px solid rgba(255,255,255,0.5)", fontWeight: 700 }}>
                  {formData.fullName.trim() ? formData.fullName.trim()[0].toUpperCase() : <PersonOutlineIcon />}
                </Avatar>
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Typography sx={{ fontWeight: 800, fontSize: "1.15rem", lineHeight: 1.25, overflowWrap: "anywhere", opacity: formData.fullName.trim() ? 1 : 0.6 }}>
                    {formData.fullName.trim() || "Your Name"}
                  </Typography>
                  <Typography sx={{ fontSize: "0.84rem", opacity: 0.85, display: "flex", alignItems: "center", gap: 0.4 }}>
                    <PlaceOutlinedIcon sx={{ fontSize: 15 }} aria-hidden="true" />{formData.location.trim() || "Your city"}
                  </Typography>
                </Box>
                <Box sx={{
                  width: 64, height: 64, borderRadius: "14px", flexShrink: 0, bgcolor: "#fff", color: C.primary,
                  display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 900, fontSize: bloodType.length > 2 ? "1.35rem" : "1.6rem",
                }}>
                  {bloodType || "?"}
                </Box>
              </Box>
              <Box sx={{ mt: 2, pt: 1.5, borderTop: "1px solid rgba(255,255,255,0.2)", display: "flex", alignItems: "center", gap: 1, position: "relative", fontSize: "0.84rem" }}>
                <Box component="span" sx={{ width: 8, height: 8, borderRadius: "50%", bgcolor: formData.available ? "#4ADE80" : "rgba(255,255,255,0.5)" }} />
                {formData.available ? "Available to donate" : "Not available right now"}
              </Box>
            </Box>

            {/* What happens next */}
            <Box component="section" aria-labelledby="next-steps-title" sx={cardSx}>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1.25, mb: 2 }}>
                <Box aria-hidden="true" sx={{ width: 36, height: 36, borderRadius: "10px", display: "flex", alignItems: "center", justifyContent: "center", color: C.primary, bgcolor: softTile, "& svg": { fontSize: 20 } }}>
                  <FormatListNumberedIcon />
                </Box>
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
};

export default DonateBlood;
