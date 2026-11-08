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
import { useI18n } from "@/i18n/I18nProvider";
import { translate } from "@/i18n/translate";

const BLOOD_TYPES = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];

// Real pages on this site. Matched on their keywords and their title in the current language;
// titles and descriptions are in i18n/messages/search.js (search.pages.<page>).
const PAGES = [
  { id: "p-map", page: "map", href: "/map", icon: "hospital",
    keys: ["hospital", "center", "centre", "map", "near", "nearby", "location", "clinic"] },
  { id: "p-donors", page: "donors", href: "/donors", icon: "donor",
    keys: ["donor", "donors", "blood type", "find donor"] },
  { id: "p-book", page: "book", href: "/appointments", icon: "appointment",
    keys: ["appointment", "book", "booking", "schedule", "slot", "date"] },
  { id: "p-compat", page: "compat", href: "/#compatibility", icon: "blood",
    keys: ["compatibility", "compatible", "blood type", "blood group", "universal", "receive", "give"] },
  { id: "p-donate", page: "donate", href: "/donate", icon: "donate",
    keys: ["donate", "donation", "give blood", "eligibility", "eligible", "register donor"] },
  { id: "p-request", page: "request", href: "/requests", icon: "donate",
    keys: ["request", "need blood", "patient", "emergency", "urgent"] },
  { id: "p-assistant", page: "assistant", href: "/assistant", icon: "assistant",
    keys: ["assistant", "ai", "chat", "question", "help", "faq"] },
  { id: "p-about", page: "about", href: "/about", icon: "info",
    keys: ["about", "mission", "who we are"] },
  { id: "p-contact", page: "contact", href: "/contact", icon: "contact",
    keys: ["contact", "email", "phone", "support"] },
  { id: "p-privacy", page: "privacy", href: "/privacy", icon: "info",
    keys: ["privacy", "data", "policy"] },
  { id: "p-terms", page: "terms", href: "/terms", icon: "info",
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

const formatDate = (value, intl) => {
  const d = new Date(`${value}T00:00:00`);
  return Number.isNaN(d.getTime()) ? value : d.toLocaleDateString(intl, { day: "numeric", month: "short", year: "numeric" });
};

// `variant="field"` renders a wide search box (dashboard top bar) instead of the icon button.
const SiteSearch = ({ size = 34, variant = "icon", placeholder }) => {
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";
  const fullScreen = useMediaQuery(theme.breakpoints.down("sm"));
  const router = useRouter();
  const { isAuth, token } = useUserAuth();
  const listId = useId();
  const { t, lang, intl } = useI18n();
  // A page result in the current language.
  const pageItem = useCallback((p) => ({ ...p, key: p.id, title: t(`search.pages.${p.page}.title`), sub: t(`search.pages.${p.page}.sub`) }), [t]);

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
      return [{ label: t("search.groups.popular"), items: POPULAR.map((id) => pageItem(PAGES.find((x) => x.id === id))) }];
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
          sub: [h.address, h.city].filter(Boolean).join(", ") || t("search.hospitalFallback"),
          meta: t("search.bookHere"),
          href: `/appointments?hospital=${encodeURIComponent(h._id)}`,
        }));
      out.push({ label: t("search.groups.hospitals"), source: hospitals.status, items });
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
            title: g.loc ? t("search.donorGroupIn", { type: g.type, place: g.loc }) : t("search.donorGroup", { type: g.type }),
            sub: t("search.donorCounts", { total: g.total, available: g.available }),
            badge: g.type,
            href: `/donors?${params}`,
          };
        });
      out.push({ label: t("search.groups.donors"), source: donors.status, items });
    }

    // The signed-in donor's own appointments.
    const wantsAppointments = /appoint|book|my\b|schedule/.test(lower);
    if (isAuth && text.length >= 2) {
      const items = appointments.data
        .filter((a) => includes(a.location, text) || includes(a.status, text) || includes(a.date, text) || wantsAppointments)
        .slice(0, 4)
        .map((a) => ({
          key: `a-${a._id}`, icon: "appointment",
          title: a.location || t("search.appointmentFallback"),
          sub: `${formatDate(a.date, intl)} · ${a.time}`,
          meta: a.status || "Pending",
          href: "/my-appointments",
        }));
      out.push({ label: t("search.groups.appointments"), source: appointments.status, items });
    } else if (!isAuth && wantsAppointments) {
      out.push({ label: t("search.groups.appointments"), items: [{
        key: "login-appointments", icon: "lock", title: t("search.loginAppointments"),
        sub: t("search.loginAppointmentsSub"), href: "/login",
      }] });
    }

    // Site pages and donation information.
    // A page matches its English or its translated title, or one of its English keywords.
    const pages = PAGES
      .filter((p) => includes(translate("en", `search.pages.${p.page}.title`), lower)
        || includes(t(`search.pages.${p.page}.title`), lower)
        || p.keys.some((k) => keywordMatch(k, lower))
        || (bloodType && p.keys.includes("blood type")))
      .slice(0, 5)
      .map(pageItem);
    out.push({ label: t("search.groups.pages"), items: pages });

    return out.filter((g) => g.items.length || g.source === "loading" || g.source === "error");
  }, [trimmed, hospitals, donors, appointments, isAuth, t, intl, pageItem]);

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
        <Box component="button" type="button" onClick={() => setOpen(true)} aria-haspopup="dialog" aria-label={t("search.open")}
          sx={{
            display: "flex", alignItems: "center", gap: 1.25, width: "100%", maxWidth: 520, height: 46, px: 2,
            border: "1px solid", borderColor: "divider", borderRadius: "12px", bgcolor: "background.paper",
            color: "text.secondary", font: "inherit", fontSize: "0.92rem", textAlign: "left", cursor: "text",
            transition: "border-color .15s, box-shadow .15s",
            "&:hover": { borderColor: isDark ? "rgba(255,255,255,0.2)" : "#CBD5E1" },
            "&:focus-visible": { outline: "none", borderColor: "primary.main", boxShadow: `0 0 0 3px ${theme.palette.mode === "dark" ? "rgba(214,64,79,0.25)" : "rgba(201,29,50,0.14)"}` },
          }}>
          <SearchIcon aria-hidden="true" sx={{ fontSize: 22 }} />
          <Box component="span" sx={{ flex: 1, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{placeholder || t("search.placeholder")}</Box>
          <Box component="kbd" sx={{ display: { xs: "none", lg: "inline-block" }, fontFamily: "inherit", fontSize: "0.7rem", fontWeight: 600, px: 0.75, py: 0.2, border: "1px solid", borderColor: "divider", borderRadius: "6px" }}>
            Ctrl K
          </Box>
        </Box>
      ) : (
      <Tooltip title={t("search.tooltip")}>
        <IconButton onClick={() => setOpen(true)} aria-label={t("search.open")} aria-haspopup="dialog"
          sx={{
            color: isDark ? "#94A3B8" : "#64748B",
            borderRadius: "8px", width: size, height: size,
            "&:hover": { bgcolor: isDark ? "rgba(255,255,255,0.08)" : "rgba(201,29,50,0.06)", color: "primary.main" },
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
            bgcolor: isDark ? "#17263D" : "#ffffff", backgroundImage: "none",
            border: { sm: `1px solid ${border}` },
            boxShadow: "0 24px 64px rgba(15,23,42,0.22)",
            display: "flex", flexDirection: "column", maxHeight: { sm: "75vh" },
          } },
        }}>
        <Typography id={`${listId}-title`} sx={{ position: "absolute", width: 1, height: 1, overflow: "hidden", clip: "rect(0 0 0 0)" }}>
          {t("search.title")}
        </Typography>

        {/* Input */}
        <Box role="search" sx={{ display: "flex", alignItems: "center", gap: 1.25, px: 2.25, py: 1.5, borderBottom: `1px solid ${border}` }}>
          <SearchIcon sx={{ color: "primary.main", fontSize: 24 }} aria-hidden="true" />
          <InputBase
            inputRef={inputRef} autoFocus fullWidth value={query}
            onChange={(e) => setQuery(e.target.value)} onKeyDown={onKeyDown}
            placeholder={t("search.inputPlaceholder")}
            inputProps={{
              "aria-label": t("search.inputPlaceholder"), lang,
              role: "combobox", "aria-expanded": true, "aria-controls": listId, "aria-autocomplete": "list",
              "aria-activedescendant": flat[active] ? `${listId}-${active}` : undefined,
              enterKeyHint: "search", autoComplete: "off", spellCheck: false,
            }}
            sx={{ fontSize: "1rem", color: "text.primary", "& input::placeholder": { color: muted, opacity: 1 } }}
          />
          {(pending || anyLoading) && trimmed && <CircularProgress size={18} thickness={5} aria-label={t("search.searching")} />}
          {query && (
            <IconButton size="small" aria-label={t("search.clear")} onClick={() => { setQuery(""); inputRef.current?.focus(); }}>
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
          <IconButton onClick={close} aria-label={t("search.close")} sx={{ display: { xs: "inline-flex", sm: "none" } }}>
            <CloseIcon />
          </IconButton>
        </Box>

        {/* Results */}
        <Box ref={listRef} id={listId} role="listbox" aria-label={t("search.results")}
          sx={{ flex: 1, overflowY: "auto", px: 1.25, py: 1 }}>
          {anyError && (
            <Box role="alert" sx={{
              display: "flex", alignItems: "center", gap: 1.25, mx: 1, my: 1, p: 1.25, borderRadius: "12px",
              bgcolor: isDark ? "rgba(201,29,50,0.12)" : "#FFF1F2", color: isDark ? "#FCA5A5" : "#A91529",
            }}>
              <ErrorOutline fontSize="small" />
              <Typography sx={{ flex: 1, fontSize: "0.85rem" }}>{t("search.loadError")}</Typography>
              <Button size="small" color="error" onClick={() => setAttempt((n) => n + 1)}>
                {t("common.retry")}
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
                  <Typography sx={{ fontSize: "0.85rem" }}>{t("search.loadingGroup", { group: g.label.toLocaleLowerCase(intl) })}</Typography>
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
                      bgcolor: selected ? (isDark ? "rgba(201,29,50,0.14)" : "#FFF1F2") : "transparent",
                    }}>
                    <Box sx={{
                      width: 38, height: 38, borderRadius: "10px", flexShrink: 0, display: "grid", placeItems: "center",
                      bgcolor: selected ? "primary.main" : isDark ? "rgba(201,29,50,0.14)" : "#FEE2E2",
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
                bgcolor: isDark ? "rgba(201,29,50,0.14)" : "#FEE2E2", color: "primary.main" }}>
                <SearchOff />
              </Box>
              <Typography sx={{ fontWeight: 700, fontSize: "0.95rem" }}>{t("search.noResults", { query: trimmed })}</Typography>
              <Typography sx={{ mt: 0.5, fontSize: "0.83rem", color: muted }}>
                {t("search.noResultsHint")}
              </Typography>
            </Box>
          )}
        </Box>

        {/* Footer hints */}
        <Box sx={{
          display: { xs: "none", sm: "flex" }, alignItems: "center", gap: 2, px: 2.25, py: 1.1,
          borderTop: `1px solid ${border}`, bgcolor: isDark ? "#0B1220" : "#F8FAFC", color: muted, fontSize: "0.72rem",
        }}>
          <span><b>↑↓</b> {t("search.hintNavigate")}</span>
          <span><b>Enter</b> {t("search.hintOpen")}</span>
          <span><b>Esc</b> {t("search.hintClose")}</span>
          <Box sx={{ flex: 1 }} />
          {BLOOD_TYPES.includes(parseQuery(trimmed).bloodType) && (
            <Typography sx={{ fontSize: "0.72rem", color: "primary.main", fontWeight: 600 }}>
              {t("search.bloodType", { type: parseQuery(trimmed).bloodType })}
            </Typography>
          )}
        </Box>
      </Dialog>
    </>
  );
};

export default SiteSearch;
