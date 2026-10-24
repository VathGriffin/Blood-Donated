'use client';
import { useCallback, useEffect, useId, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import {
  Box, Dialog, IconButton, InputBase, Tooltip, Typography, CircularProgress, Button, Chip,
  useMediaQuery, useTheme,
} from "@mui/material";
import {
  Search as SearchIcon, Close as CloseIcon, LocalHospital, Group, EventAvailable, Bloodtype,
  ErrorOutline, SearchOff, ArrowForward, Info, Lock, KeyboardReturn, SmartToy, Favorite, ContactMail,
  VolunteerActivism,
} from "@mui/icons-material";
import API_BASE from "@/lib/config";
import { getHospitals } from "@/lib/public-directory";
import { useUserAuth } from "@/store/UserAuthContext";

const BLOOD_TYPES = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];

// Real pages on this site. Matched on their keywords; nothing here is generated content.
const PAGES = [
  { id: "p-map", title: "Find a Hospital", sub: "Donation centers near you on the map", href: "/map", icon: "hospital",
    keys: ["hospital", "center", "centre", "map", "near", "nearby", "location", "clinic"] },
  { id: "p-donors", title: "Find Blood Donors", sub: "Browse registered donors by blood type", href: "/donors", icon: "donor",
    keys: ["donor", "donors", "blood type", "find donor"] },
  { id: "p-book", title: "Book an Appointment", sub: "Pick a center, date and time to donate", href: "/appointments", icon: "appointment",
    keys: ["appointment", "book", "booking", "schedule", "slot", "date"] },
  { id: "p-compat", title: "Blood Type Compatibility", sub: "Who can give to whom", href: "/#compatibility", icon: "blood",
    keys: ["compatibility", "compatible", "blood type", "blood group", "universal", "receive", "give"] },
  { id: "p-donate", title: "Donate Blood", sub: "How donating works and who can donate", href: "/donate", icon: "donate",
    keys: ["donate", "donation", "give blood", "eligibility", "eligible", "register donor"] },
  { id: "p-request", title: "Request Blood", sub: "Ask for blood for a patient", href: "/requests", icon: "donate",
    keys: ["request", "need blood", "patient", "emergency", "urgent"] },
  { id: "p-assistant", title: "AI Assistant", sub: "Ask questions about blood donation", href: "/assistant", icon: "assistant",
    keys: ["assistant", "ai", "chat", "question", "help", "faq"] },
  { id: "p-about", title: "About BloodLife", sub: "Our mission and how the platform works", href: "/about", icon: "info",
    keys: ["about", "mission", "who we are"] },
  { id: "p-contact", title: "Contact Us", sub: "Get in touch with the team", href: "/contact", icon: "contact",
    keys: ["contact", "email", "phone", "support"] },
  { id: "p-privacy", title: "Privacy Policy", sub: "How your data is handled", href: "/privacy", icon: "info",
    keys: ["privacy", "data", "policy"] },
  { id: "p-terms", title: "Terms of Service", sub: "Rules for using the platform", href: "/terms", icon: "info",
    keys: ["terms", "conditions", "service"] },
];

const POPULAR = ["p-map", "p-donors", "p-book", "p-compat"];

const ICONS = {
  hospital: LocalHospital, donor: Group, appointment: EventAvailable, blood: Bloodtype, info: Info,
  assistant: SmartToy, donate: VolunteerActivism, contact: ContactMail, lock: Lock, favorite: Favorite,
};

// "o+", "O positive", "ab neg" -> "O+", "AB-". Returns the type and the query with it removed.
const BLOOD_TYPE_RE = /(?:^|\s)(ab|a|b|o)\s*(\+|-|positive|pos|negative|neg)(?=\s|$)/i;
const parseQuery = (raw) => {
  const q = raw.trim().replace(/\s+/g, " ");
  const m = q.match(BLOOD_TYPE_RE);
  if (!m) return { bloodType: null, text: q.toLowerCase() };
  const sign = m[2] === "+" || /^pos/i.test(m[2]) ? "+" : "-";
  return { bloodType: `${m[1].toUpperCase()}${sign}`, text: q.replace(m[0], " ").trim().toLowerCase() };
};

const includes = (value, text) => !!value && String(value).toLowerCase().includes(text);
const escapeRe = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
// A page keyword matches when the query starts it ("hosp" -> "hospital") or contains it as a word.
const keywordMatch = (key, q) =>
  (q.length >= 2 && key.startsWith(q)) || new RegExp(`(^|\\s)${escapeRe(key)}(\\s|$)`).test(q);

// Public directory data is fetched once per page load and shared by every open of the panel.
const cache = { donors: null };

const fetchPublic = async (key, path, signal) => {
  if (cache[key]) return cache[key];
  const res = await axios.get(`${API_BASE}${path}`, { signal });
  cache[key] = Array.isArray(res.data) ? res.data : [];
  return cache[key];
};

const formatDate = (value) => {
  const d = new Date(`${value}T00:00:00`);
  return Number.isNaN(d.getTime()) ? value : d.toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" });
};

// `variant="field"` renders a wide search box (dashboard top bar) instead of the icon button.
const SiteSearch = ({ size = 34, variant = "icon", placeholder = "Search hospital, donor, or any information..." }) => {
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";
  const fullScreen = useMediaQuery(theme.breakpoints.down("sm"));
  const router = useRouter();
  const { isAuth, token } = useUserAuth();
  const listId = useId();

  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [debounced, setDebounced] = useState("");
  const [active, setActive] = useState(0);
  // Each source: { status: 'idle' | 'loading' | 'ready' | 'error', data }
  const [hospitals, setHospitals] = useState({ status: "idle", data: [] });
  const [donors, setDonors] = useState({ status: "idle", data: [] });
  const [appointments, setAppointments] = useState({ status: "idle", data: [] });
  const [attempt, setAttempt] = useState(0);
  const inputRef = useRef(null);
  const listRef = useRef(null);

  // ⌘K / Ctrl+K opens the panel from anywhere on the public site.
  useEffect(() => {
    const onKey = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen(true);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    const t = setTimeout(() => setDebounced(query), 200);
    return () => clearTimeout(t);
  }, [query]);

  // Load the public directories the first time the panel opens (and on retry).
  useEffect(() => {
    if (!open) return;
    const ctrl = new AbortController();
    const load = (key, path, set) => {
      if (cache[key]) { set({ status: "ready", data: cache[key] }); return; }
      set((s) => ({ ...s, status: "loading" }));
      fetchPublic(key, path, ctrl.signal)
        .then((data) => set({ status: "ready", data }))
        .catch((err) => { if (!axios.isCancel(err)) set({ status: "error", data: [] }); });
    };
    load("donors", "/api/donors", setDonors);
    // Hospitals come from the shared directory cache (also used by the donor profile).
    let alive = true;
    setHospitals((h) => (h.status === "ready" ? h : { ...h, status: "loading" }));
    getHospitals()
      .then((data) => { if (alive) setHospitals({ status: "ready", data }); })
      .catch(() => { if (alive) setHospitals({ status: "error", data: [] }); });
    return () => { alive = false; ctrl.abort(); };
  }, [open, attempt]);

  // A donor's own appointments. The API scopes this to the signed-in account's email.
  useEffect(() => {
    if (!open || !isAuth || !token) { setAppointments({ status: "idle", data: [] }); return; }
    const ctrl = new AbortController();
    setAppointments((s) => ({ ...s, status: "loading" }));
    axios.get(`${API_BASE}/api/appointments`, { headers: { Authorization: `Bearer ${token}` }, signal: ctrl.signal })
      .then((res) => setAppointments({ status: "ready", data: Array.isArray(res.data) ? res.data : [] }))
      .catch((err) => { if (!axios.isCancel(err)) setAppointments({ status: "error", data: [] }); });
    return () => ctrl.abort();
  }, [open, isAuth, token, attempt]);

  const trimmed = debounced.trim();

  const groups = useMemo(() => {
    if (!trimmed) {
      return [{ label: "Popular searches", items: POPULAR.map((id) => {
        const p = PAGES.find((x) => x.id === id);
        return { ...p, key: p.id };
      }) }];
    }
    const { bloodType, text } = parseQuery(trimmed);
    const lower = trimmed.toLowerCase();
    const out = [];

    // Hospitals: name, city or address.
    if (text.length >= 2) {
      const items = hospitals.data
        .filter((h) => includes(h.name, text) || includes(h.city, text) || includes(h.address, text))
        .slice(0, 5)
        .map((h) => ({
          key: `h-${h._id}`, icon: "hospital", title: h.name,
          sub: [h.address, h.city].filter(Boolean).join(", ") || "Registered donation center",
          meta: "Book here",
          href: `/appointments?hospital=${encodeURIComponent(h._id)}`,
        }));
      out.push({ label: "Hospitals", source: hospitals.status, items });
    }

    // Donors: shown only as counts per blood type and location, never as individuals.
    if (bloodType || text.length >= 2) {
      const matched = donors.data.filter((d) =>
        (!bloodType || d.bloodType === bloodType) && (!text || includes(d.location, text)));
      const byGroup = new Map();
      for (const d of matched) {
        if (!d.bloodType) continue;
        const loc = (d.location || "").trim();
        const k = `${d.bloodType}|${loc.toLowerCase()}`;
        const g = byGroup.get(k) || { type: d.bloodType, loc, total: 0, available: 0 };
        g.total += 1;
        if (d.available) g.available += 1;
        byGroup.set(k, g);
      }
      const items = [...byGroup.values()]
        .sort((a, b) => b.available - a.available || b.total - a.total)
        .slice(0, 5)
        .map((g) => {
          const params = new URLSearchParams({ type: g.type });
          if (g.loc) params.set("q", g.loc);
          return {
            key: `d-${g.type}-${g.loc}`, icon: "donor",
            title: `${g.type} donors${g.loc ? ` in ${g.loc}` : ""}`,
            sub: `${g.total} registered · ${g.available} available now`,
            badge: g.type,
            href: `/donors?${params}`,
          };
        });
      out.push({ label: "Donors", source: donors.status, items });
    }

    // The signed-in donor's own appointments.
    const wantsAppointments = /appoint|book|my\b|schedule/.test(lower);
    if (isAuth && text.length >= 2) {
      const items = appointments.data
        .filter((a) => includes(a.location, text) || includes(a.status, text) || includes(a.date, text) || wantsAppointments)
        .slice(0, 4)
        .map((a) => ({
          key: `a-${a._id}`, icon: "appointment",
          title: `${a.location || "Donation appointment"}`,
          sub: `${formatDate(a.date)} · ${a.time}`,
          meta: a.status || "Pending",
          href: "/my-appointments",
        }));
      out.push({ label: "My appointments", source: appointments.status, items });
    } else if (!isAuth && wantsAppointments) {
      out.push({ label: "My appointments", items: [{
        key: "login-appointments", icon: "lock", title: "Log in to see your appointments",
        sub: "Your bookings are private to your account", href: "/login",
      }] });
    }

    // Site pages and donation information.
    const pages = PAGES
      .filter((p) => includes(p.title, lower) || p.keys.some((k) => keywordMatch(k, lower))
        || (bloodType && p.keys.includes("blood type")))
      .slice(0, 5)
      .map((p) => ({ ...p, key: p.id }));
    out.push({ label: "Pages & information", items: pages });

    return out.filter((g) => g.items.length || g.source === "loading" || g.source === "error");
  }, [trimmed, hospitals, donors, appointments, isAuth]);

  const flat = useMemo(() => groups.flatMap((g) => g.items), [groups]);
  const pending = query !== debounced;
  const anyLoading = groups.some((g) => g.source === "loading");
  const anyError = groups.some((g) => g.source === "error");

  useEffect(() => { setActive(0); }, [debounced]);

  // Keep the highlighted option in view while arrowing through the list.
  useEffect(() => {
    listRef.current?.querySelector(`[data-index="${active}"]`)?.scrollIntoView({ block: "nearest" });
  }, [active]);

  const close = useCallback(() => {
    setOpen(false);
    setQuery("");
    setDebounced("");
  }, []);

  const go = (item) => {
    if (!item) return;
    close();
    router.push(item.href);
  };

  const onKeyDown = (e) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((i) => (flat.length ? (i + 1) % flat.length : 0));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((i) => (flat.length ? (i - 1 + flat.length) % flat.length : 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      // Results for the text just typed may not be computed yet; run the search now.
      if (pending) { setDebounced(query); return; }
      go(flat[active]);
    }
  };

  const border = isDark ? "rgba(255,255,255,0.08)" : "rgba(15,23,42,0.08)";
  const muted = isDark ? "rgba(245,245,245,0.6)" : "#64748B";
  let index = -1;

  return (
    <>
      {variant === "field" ? (
        <Box component="button" type="button" onClick={() => setOpen(true)} aria-haspopup="dialog" aria-label="Open search"
          sx={{
            display: "flex", alignItems: "center", gap: 1.25, width: "100%", maxWidth: 520, height: 46, px: 2,
            border: "1px solid", borderColor: "divider", borderRadius: "12px", bgcolor: "background.paper",
            color: "text.secondary", font: "inherit", fontSize: "0.92rem", textAlign: "left", cursor: "text",
            transition: "border-color .15s, box-shadow .15s",
            "&:hover": { borderColor: isDark ? "rgba(255,255,255,0.2)" : "#CBD5E1" },
            "&:focus-visible": { outline: "none", borderColor: "primary.main", boxShadow: `0 0 0 3px ${theme.palette.mode === "dark" ? "rgba(214,64,79,0.25)" : "rgba(185,28,44,0.14)"}` },
          }}>
          <SearchIcon aria-hidden="true" sx={{ fontSize: 22 }} />
          <Box component="span" sx={{ flex: 1, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{placeholder}</Box>
          <Box component="kbd" sx={{ display: { xs: "none", lg: "inline-block" }, fontFamily: "inherit", fontSize: "0.7rem", fontWeight: 600, px: 0.75, py: 0.2, border: "1px solid", borderColor: "divider", borderRadius: "6px" }}>
            Ctrl K
          </Box>
        </Box>
      ) : (
      <Tooltip title="Search (Ctrl+K)">
        <IconButton onClick={() => setOpen(true)} aria-label="Open search" aria-haspopup="dialog"
          sx={{
            color: isDark ? "rgba(245,245,245,0.7)" : "#555555",
            borderRadius: "8px", width: size, height: size,
            "&:hover": { bgcolor: isDark ? "rgba(255,255,255,0.08)" : "rgba(220,38,38,0.06)", color: "primary.main" },
          }}>
          <SearchIcon sx={{ fontSize: 20 }} />
        </IconButton>
      </Tooltip>
      )}

      <Dialog open={open} onClose={close} fullScreen={fullScreen} fullWidth maxWidth="sm"
        aria-labelledby={`${listId}-title`}
        sx={{ "& .MuiDialog-container": { alignItems: { xs: "stretch", sm: "flex-start" } } }}
        slotProps={{
          backdrop: { sx: { backdropFilter: "blur(4px)", bgcolor: "rgba(15,23,42,0.35)" } },
          paper: { sx: {
            mt: { sm: "10vh" }, borderRadius: { xs: 0, sm: "18px" }, overflow: "hidden",
            bgcolor: isDark ? "#111111" : "#ffffff", backgroundImage: "none",
            border: { sm: `1px solid ${border}` },
            boxShadow: "0 24px 64px rgba(15,23,42,0.22)",
            display: "flex", flexDirection: "column", maxHeight: { sm: "75vh" },
          } },
        }}>
        <Typography id={`${listId}-title`} sx={{ position: "absolute", width: 1, height: 1, overflow: "hidden", clip: "rect(0 0 0 0)" }}>
          Search BloodLife
        </Typography>

        {/* Input */}
        <Box role="search" sx={{ display: "flex", alignItems: "center", gap: 1.25, px: 2.25, py: 1.5, borderBottom: `1px solid ${border}` }}>
          <SearchIcon sx={{ color: "primary.main", fontSize: 24 }} aria-hidden="true" />
          <InputBase
            inputRef={inputRef} autoFocus fullWidth value={query}
            onChange={(e) => setQuery(e.target.value)} onKeyDown={onKeyDown}
            placeholder="Search hospitals, donors, appointments..."
            inputProps={{
              "aria-label": "Search hospitals, donors, appointments",
              role: "combobox", "aria-expanded": true, "aria-controls": listId, "aria-autocomplete": "list",
              "aria-activedescendant": flat[active] ? `${listId}-${active}` : undefined,
              enterKeyHint: "search", autoComplete: "off", spellCheck: false,
            }}
            sx={{ fontSize: "1rem", color: "text.primary", "& input::placeholder": { color: muted, opacity: 1 } }}
          />
          {(pending || anyLoading) && trimmed && <CircularProgress size={18} thickness={5} aria-label="Searching" />}
          {query && (
            <IconButton size="small" aria-label="Clear search" onClick={() => { setQuery(""); inputRef.current?.focus(); }}>
              <CloseIcon fontSize="small" />
            </IconButton>
          )}
          <Box component="button" type="button" onClick={close}
            sx={{
              display: { xs: "none", sm: "inline-flex" }, border: `1px solid ${border}`, borderRadius: "6px",
              bgcolor: "transparent", color: muted, font: "inherit", fontSize: "0.7rem", fontWeight: 600,
              px: 0.75, py: 0.25, cursor: "pointer",
              "&:focus-visible": { outline: "2px solid", outlineColor: "primary.main" },
            }}>
            Esc
          </Box>
          <IconButton onClick={close} aria-label="Close search" sx={{ display: { xs: "inline-flex", sm: "none" } }}>
            <CloseIcon />
          </IconButton>
        </Box>

        {/* Results */}
        <Box ref={listRef} id={listId} role="listbox" aria-label="Search results"
          sx={{ flex: 1, overflowY: "auto", px: 1.25, py: 1 }}>
          {anyError && (
            <Box role="alert" sx={{
              display: "flex", alignItems: "center", gap: 1.25, mx: 1, my: 1, p: 1.25, borderRadius: "12px",
              bgcolor: isDark ? "rgba(220,38,38,0.12)" : "#FEF2F2", color: isDark ? "#FCA5A5" : "#B91C1C",
            }}>
              <ErrorOutline fontSize="small" />
              <Typography sx={{ flex: 1, fontSize: "0.85rem" }}>Some results couldn&apos;t be loaded.</Typography>
              <Button size="small" color="error" onClick={() => setAttempt((n) => n + 1)}>
                Retry
              </Button>
            </Box>
          )}

          {groups.map((g) => (
            <Box key={g.label} role="group" aria-label={g.label} sx={{ mb: 0.5 }}>
              <Typography sx={{ px: 1.25, pt: 1.25, pb: 0.75, fontSize: "0.7rem", fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase", color: muted }}>
                {g.label}
              </Typography>
              {g.source === "loading" && !g.items.length && (
                <Box sx={{ display: "flex", alignItems: "center", gap: 1.25, px: 1.25, py: 1.25, color: muted }}>
                  <CircularProgress size={16} thickness={5} color="inherit" />
                  <Typography sx={{ fontSize: "0.85rem" }}>Loading {g.label.toLowerCase()}…</Typography>
                </Box>
              )}
              {g.items.map((item) => {
                index += 1;
                const i = index;
                const selected = i === active;
                const Icon = ICONS[item.icon] || Info;
                return (
                  <Box key={item.key} id={`${listId}-${i}`} data-index={i} role="option" aria-selected={selected}
                    onClick={() => go(item)} onMouseMove={() => { if (!selected) setActive(i); }}
                    sx={{
                      display: "flex", alignItems: "center", gap: 1.5, px: 1.25, py: 1.1, borderRadius: "12px",
                      cursor: "pointer", transition: "background-color 0.12s ease",
                      bgcolor: selected ? (isDark ? "rgba(220,38,38,0.14)" : "#FEF2F2") : "transparent",
                    }}>
                    <Box sx={{
                      width: 38, height: 38, borderRadius: "10px", flexShrink: 0, display: "grid", placeItems: "center",
                      bgcolor: selected ? "primary.main" : isDark ? "rgba(220,38,38,0.14)" : "#FEE2E2",
                      color: selected ? "#fff" : "primary.main", transition: "all 0.12s ease",
                    }}>
                      <Icon sx={{ fontSize: 20 }} />
                    </Box>
                    <Box sx={{ minWidth: 0, flex: 1 }}>
                      <Typography noWrap sx={{ fontWeight: 600, fontSize: "0.9rem", color: "text.primary" }}>{item.title}</Typography>
                      <Typography noWrap sx={{ fontSize: "0.78rem", color: muted }}>{item.sub}</Typography>
                    </Box>
                    {item.meta && (
                      <Chip label={item.meta} size="small" sx={{
                        display: { xs: "none", sm: "inline-flex" }, height: 22, fontSize: "0.7rem", fontWeight: 600,
                        bgcolor: isDark ? "rgba(255,255,255,0.06)" : "#F1F5F9", color: muted,
                      }} />
                    )}
                    {selected
                      ? <KeyboardReturn sx={{ fontSize: 18, color: "primary.main", display: { xs: "none", sm: "block" } }} />
                      : <ArrowForward sx={{ fontSize: 16, color: muted, opacity: 0.6 }} />}
                  </Box>
                );
              })}
            </Box>
          ))}

          {trimmed && !pending && !anyLoading && !flat.length && !anyError && (
            <Box role="status" sx={{ textAlign: "center", px: 3, py: 5 }}>
              <Box sx={{ width: 52, height: 52, mx: "auto", mb: 1.5, borderRadius: "50%", display: "grid", placeItems: "center",
                bgcolor: isDark ? "rgba(220,38,38,0.14)" : "#FEE2E2", color: "primary.main" }}>
                <SearchOff />
              </Box>
              <Typography sx={{ fontWeight: 700, fontSize: "0.95rem" }}>No results for “{trimmed}”</Typography>
              <Typography sx={{ mt: 0.5, fontSize: "0.83rem", color: muted }}>
                Try a hospital name, a city, or a blood type such as O+ or AB-.
              </Typography>
            </Box>
          )}
        </Box>

        {/* Footer hints */}
        <Box sx={{
          display: { xs: "none", sm: "flex" }, alignItems: "center", gap: 2, px: 2.25, py: 1.1,
          borderTop: `1px solid ${border}`, bgcolor: isDark ? "#0c0c0c" : "#FAFAFA", color: muted, fontSize: "0.72rem",
        }}>
          <span><b>↑↓</b> to navigate</span>
          <span><b>Enter</b> to open</span>
          <span><b>Esc</b> to close</span>
          <Box sx={{ flex: 1 }} />
          {BLOOD_TYPES.includes(parseQuery(trimmed).bloodType) && (
            <Typography sx={{ fontSize: "0.72rem", color: "primary.main", fontWeight: 600 }}>
              Blood type {parseQuery(trimmed).bloodType}
            </Typography>
          )}
        </Box>
      </Dialog>
    </>
  );
};

export default SiteSearch;
