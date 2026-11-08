'use client';
import { useState, useRef, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  Box, Paper, Typography, InputBase, IconButton, Tooltip, Badge, ButtonBase, CircularProgress, useTheme, useMediaQuery,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import RemoveIcon from "@mui/icons-material/Remove";
import SendRoundedIcon from "@mui/icons-material/SendRounded";
import FavoriteBorderIcon from "@mui/icons-material/FavoriteBorder";
import HealthAndSafetyIcon from "@mui/icons-material/HealthAndSafety";
import CalendarMonthIcon from "@mui/icons-material/CalendarMonth";
import LocationOnIcon from "@mui/icons-material/LocationOn";
import WaterDropIcon from "@mui/icons-material/WaterDrop";
import AssignmentOutlinedIcon from "@mui/icons-material/AssignmentOutlined";
import MonitorHeartOutlinedIcon from "@mui/icons-material/MonitorHeartOutlined";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import DoneAllIcon from "@mui/icons-material/DoneAll";
import ScheduleIcon from "@mui/icons-material/Schedule";
import CloudOffIcon from "@mui/icons-material/CloudOff";
import ReplayIcon from "@mui/icons-material/Replay";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";
import DescriptionOutlinedIcon from "@mui/icons-material/DescriptionOutlined";
import RestartAltIcon from "@mui/icons-material/RestartAlt";
import ShieldOutlinedIcon from "@mui/icons-material/ShieldOutlined";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import { useUserAuth } from "@/store/UserAuthContext";
import { QUICK_ACTIONS } from "@/lib/chatbot-kb";
import { askAssistant } from "@/lib/chat-client";
import API_BASE from "@/lib/config";
import ChatMessage, { replyLinks } from "./ChatMessage";
import { CHAT_TEXT, LANGS } from "./chat-i18n";
import useChatLanguage from "./useChatLanguage";

// BloodLife palette (same values as lib/design-tokens.js).
const C = {
  red: "#C91D32", redDark: "#A91529", redBright: "#E63946", soft: "#FFF1F2", softBorder: "#F5C6CC",
  navy: "#102541", text: "#172B4D", muted: "#64748B", border: "#E2E8F0", subtle: "#F8FAFC", aiBubble: "#F1F5F9",
};
const RED_GRADIENT = `linear-gradient(135deg, ${C.redBright} 0%, ${C.red} 100%)`;

const ACTION_ICONS = {
  eligibility: HealthAndSafetyIcon, appointment: CalendarMonthIcon, hospital: LocationOnIcon,
  bloodTypes: WaterDropIcon, preparation: AssignmentOutlinedIcon, aftercare: MonitorHeartOutlinedIcon,
};

const HEALTH_TIMEOUT_MS = 6000;
const HEALTH_INTERVAL_MS = 30000;
// How close to the bottom (px) still counts as "reading the newest message".
const STICK_THRESHOLD = 80;

const formatTime = (t, lang) => new Date(t).toLocaleTimeString(lang === "km" ? "km-KH" : lang === "vi" ? "vi-VN" : "en-US", { hour: "numeric", minute: "2-digit" });

// Can the browser reach the BloodLife API right now? Uses the public /health route.
async function apiReachable() {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), HEALTH_TIMEOUT_MS);
  try {
    const res = await fetch(`${API_BASE}/health`, { signal: controller.signal, cache: "no-store" });
    return res.ok;
  } catch {
    return false;
  } finally {
    clearTimeout(timer);
  }
}

// The assistant's avatar: a friendly robot with a heart, drawn inline so it stays crisp at any size.
function BotAvatar({ size = 40, ring = false }) {
  return (
    <Box aria-hidden="true" sx={{
      width: size, height: size, flexShrink: 0, borderRadius: "50%", bgcolor: "#fff",
      display: "flex", alignItems: "center", justifyContent: "center",
      border: ring ? `2px solid ${C.red}` : `1px solid ${C.border}`,
      boxShadow: ring ? "0 0 0 4px #fff, 0 6px 16px rgba(201,29,50,0.18)" : "none",
    }}>
      <svg width={size * 0.7} height={size * 0.7} viewBox="0 0 64 64" fill="none">
        <line x1="32" y1="6" x2="32" y2="14" stroke={C.red} strokeWidth="3" strokeLinecap="round" />
        <circle cx="32" cy="6" r="4" fill={C.red} />
        <rect x="6" y="26" width="6" height="14" rx="3" fill={C.red} />
        <rect x="52" y="26" width="6" height="14" rx="3" fill={C.red} />
        <rect x="10" y="14" width="44" height="36" rx="14" fill="#fff" stroke={C.red} strokeWidth="3" />
        <rect x="16" y="20" width="32" height="20" rx="9" fill={C.navy} />
        <circle cx="25" cy="30" r="3.5" fill="#fff" />
        <circle cx="39" cy="30" r="3.5" fill="#fff" />
        <path d="M27 35.5 Q32 39 37 35.5" stroke="#fff" strokeWidth="2" strokeLinecap="round" fill="none" />
        <path d="M32 59 C25 54 22 51 22 47.5 C22 45 24 43.5 26 43.5 C28 43.5 29.5 44.5 32 47 C34.5 44.5 36 43.5 38 43.5 C40 43.5 42 45 42 47.5 C42 51 39 54 32 59 Z" fill={C.red} />
      </svg>
    </Box>
  );
}

// Decorative heartbeat line along the bottom-right of the header.
function HeartbeatArt() {
  return (
    <Box aria-hidden="true" sx={{ position: "absolute", right: 14, bottom: 10, width: 180, height: 44, pointerEvents: "none", opacity: 0.85 }}>
      <svg width="180" height="44" viewBox="0 0 180 44" fill="none">
        <path d="M0 30 H86 L94 22 L102 38 L112 6 L122 40 L128 26 L134 30 H150" stroke={C.red} strokeOpacity="0.55" strokeWidth="1.6" strokeLinejoin="round" strokeLinecap="round" />
      </svg>
      <FavoriteBorderIcon sx={{ position: "absolute", right: 0, top: 4, fontSize: 30, color: C.red, opacity: 0.75 }} />
    </Box>
  );
}

function Timestamp({ time, lang, sx }) {
  if (!time) return null;
  return (
    <Typography component="time" dateTime={new Date(time).toISOString()} sx={{ fontSize: "0.72rem", color: "text.secondary", whiteSpace: "nowrap", ...sx }}>
      {formatTime(time, lang)}
    </Typography>
  );
}

// Tracks the visible area on phones, so the panel shrinks above the on-screen keyboard.
function useVisualViewport(active) {
  const [vv, setVv] = useState(null);
  useEffect(() => {
    if (!active || typeof window === "undefined" || !window.visualViewport) { setVv(null); return; }
    const v = window.visualViewport;
    const update = () => setVv({ height: v.height, top: v.offsetTop });
    update();
    v.addEventListener("resize", update);
    v.addEventListener("scroll", update);
    return () => { v.removeEventListener("resize", update); v.removeEventListener("scroll", update); };
  }, [active]);
  return vv;
}

export default function ChatBot() {
  const { token } = useUserAuth();
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";
  const isPhone = useMediaQuery(theme.breakpoints.down("sm"));
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([]); // { role, content, time, offline?, suggestions? }
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [unread, setUnread] = useState(0);
  // The chat has its own language (EN / KH / VN buttons below), separate from the website
  // language: changing one never changes the other.
  const [lang, setLang] = useChatLanguage();
  const [welcomeTime, setWelcomeTime] = useState(null);
  const [browserOnline, setBrowserOnline] = useState(() => (typeof navigator === "undefined" ? true : navigator.onLine !== false));
  const [apiUp, setApiUp] = useState(null); // null = still checking
  const [hasNew, setHasNew] = useState(false);
  const logRef = useRef(null);
  const inputRef = useRef(null);
  const fabRef = useRef(null);
  const openRef = useRef(open);
  const stickRef = useRef(true);   // is the reader at the newest message?
  const sendingRef = useRef(false); // blocks a second send before React re-renders
  // Bumped whenever the conversation is cleared, so a reply still in flight for the old one is dropped.
  const conversationRef = useRef(0);
  const vv = useVisualViewport(open && isPhone);
  useEffect(() => { openRef.current = open; }, [open]);

  // Pages can open the assistant (e.g. a "Need Help?" panel): window.dispatchEvent(new CustomEvent("bloodlife:open-chat")).
  useEffect(() => {
    const openChat = () => setOpen(true);
    window.addEventListener("bloodlife:open-chat", openChat);
    return () => window.removeEventListener("bloodlife:open-chat", openChat);
  }, []);

  // Connection status: the browser's own online flag, plus a check that the API answers.
  useEffect(() => {
    const goOnline = () => { setBrowserOnline(true); setApiUp(null); apiReachable().then(setApiUp); };
    const goOffline = () => setBrowserOnline(false);
    window.addEventListener("online", goOnline);
    window.addEventListener("offline", goOffline);
    return () => { window.removeEventListener("online", goOnline); window.removeEventListener("offline", goOffline); };
  }, []);
  useEffect(() => {
    if (!open) return;
    let alive = true;
    const check = () => apiReachable().then((up) => { if (alive) setApiUp(up); });
    check();
    const id = setInterval(check, HEALTH_INTERVAL_MS);
    return () => { alive = false; clearInterval(id); };
  }, [open]);

  // On phones the panel covers the page, so the page behind shouldn't scroll.
  useEffect(() => {
    if (!open || !isPhone) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prev; };
  }, [open, isPhone]);

  const scrollToBottom = useCallback((smooth = true) => {
    const el = logRef.current;
    if (!el) return;
    if (typeof el.scrollTo === "function") el.scrollTo({ top: el.scrollHeight, behavior: smooth ? "smooth" : "auto" });
    else el.scrollTop = el.scrollHeight;
    stickRef.current = true;
    setHasNew(false);
  }, []);

  // Follow new messages only while the reader is at the bottom; otherwise offer a "New messages" pill.
  useEffect(() => {
    if (!open) return;
    if (stickRef.current) scrollToBottom();
    else if (messages[messages.length - 1]?.role === "assistant") setHasNew(true);
  }, [messages, loading, open, scrollToBottom]);

  const onLogScroll = () => {
    const el = logRef.current;
    if (!el) return;
    stickRef.current = el.scrollHeight - el.scrollTop - el.clientHeight < STICK_THRESHOLD;
    if (stickRef.current) setHasNew(false);
  };

  useEffect(() => {
    if (!open) return;
    setUnread(0);
    setWelcomeTime((t) => t ?? Date.now());
    stickRef.current = true;
    const t = setTimeout(() => { scrollToBottom(false); inputRef.current?.focus(); }, 150);
    return () => clearTimeout(t);
  }, [open, scrollToBottom]);

  // `earlier` is the conversation before `content`, the message being asked.
  const ask = useCallback(async (earlier, content) => {
    setLoading(true);
    const conversation = conversationRef.current;
    try {
      // Only role + content go to the API; time/offline are display-only.
      const reply = await askAssistant({
        history: earlier.map(({ role, content: c }) => ({ role, content: c })), content, lang, token,
      });
      if (conversation !== conversationRef.current) return; // chat was cleared meanwhile
      // With no AI key set up, the built-in guide is the normal mode, so only a real failure is
      // flagged offline (status, "Offline guide" tag, warning strip with Retry).
      const offline = reply.offline && !reply.unconfigured;
      setApiUp(offline ? false : true);
      setMessages((prev) => [...prev, {
        role: "assistant", content: reply.content, offline, suggestions: reply.suggestions || [], time: Date.now(),
      }]);
      if (!openRef.current) setUnread((n) => n + 1);
    } finally {
      if (conversation === conversationRef.current) {
        setLoading(false);
        sendingRef.current = false;
      }
    }
  }, [token, lang]);

  const sendMessage = (text) => {
    const content = (text ?? input).trim();
    if (!content || loading || sendingRef.current) return;
    sendingRef.current = true;
    stickRef.current = true; // your own message always scrolls into view
    setMessages([...messages, { role: "user", content, time: Date.now() }]);
    if (text === undefined) setInput("");
    ask(messages, content);
  };

  // Re-ask the last question after an offline answer, replacing that answer.
  const retryLast = () => {
    if (loading || sendingRef.current) return;
    const lastUser = [...messages].reverse().find((m) => m.role === "user");
    if (!lastUser) return;
    sendingRef.current = true;
    const history = messages[messages.length - 1]?.role === "assistant" ? messages.slice(0, -1) : messages;
    setMessages(history);
    ask(history.slice(0, -1), lastUser.content); // history ends with lastUser
  };

  const clearConversation = () => {
    conversationRef.current += 1;
    sendingRef.current = false;
    setMessages([]);
    setLoading(false);
    setHasNew(false);
    setWelcomeTime(Date.now());
  };
  const minimize = () => { setOpen(false); fabRef.current?.focus(); };
  const closeAndClear = () => { minimize(); clearConversation(); setInput(""); };

  const ui = CHAT_TEXT[lang] || CHAT_TEXT.en;
  const last = messages[messages.length - 1];
  const lastFailed = last?.role === "assistant" && last.offline;
  const status = !browserOnline || apiUp === false || lastFailed ? "offline" : apiUp === null ? "checking" : "online";
  const lastUserIndex = messages.map((m) => m.role).lastIndexOf("user");

  const border = isDark ? "#334155" : C.border;
  const panelBg = isDark ? "#17263D" : "#ffffff";
  const aiBubbleBg = isDark ? "#1C2E49" : C.aiBubble;
  const softBg = isDark ? "rgba(201,29,50,0.14)" : C.soft;
  const textColor = isDark ? "#F8FAFC" : C.text;
  const focusRing = { "&:focus-visible": { outline: `2px solid ${C.red}`, outlineOffset: 2 } };

  const STATUS_STYLE = {
    online:   { dot: "#22C55E", bg: isDark ? "rgba(34,197,94,0.16)" : "#DCFCE7", fg: isDark ? "#86EFAC" : "#166534" },
    checking: { dot: "#94A3B8", bg: isDark ? "rgba(148,163,184,0.16)" : "#F1F5F9", fg: isDark ? "#CBD5E1" : "#475569" },
    offline:  { dot: "#F59E0B", bg: isDark ? "rgba(245,158,11,0.16)" : "#FEF3C7", fg: isDark ? "#FCD34D" : "#92400E" },
  }[status];

  const headerBtn = {
    width: 38, height: 38, color: textColor, bgcolor: isDark ? "rgba(255,255,255,0.08)" : "#F1F5F9",
    "&:hover": { bgcolor: isDark ? "rgba(255,255,255,0.14)" : "#E2E8F0" },
    ...focusRing,
  };

  // Phones: a near-full-screen sheet with a small margin, kept above the on-screen keyboard.
  const phoneBox = vv
    ? { top: `calc(${vv.top}px + max(8px, env(safe-area-inset-top)))`, height: `calc(${vv.height}px - 16px - env(safe-area-inset-top) - env(safe-area-inset-bottom))` }
    : { top: "max(8px, env(safe-area-inset-top))", height: "calc(100dvh - 16px - env(safe-area-inset-top) - env(safe-area-inset-bottom))" };

  // Assistant row: avatar, bubble, and the time beside the bubble. A plain function, not a
  // component, so rows aren't remounted on every render.
  const assistantRow = ({ key, children, time, bg, footer }) => (
    <Box key={key} sx={{ display: "flex", alignItems: "flex-start", gap: 1.25 }}>
      <BotAvatar size={isPhone ? 34 : 40} />
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Box sx={{ display: "flex", alignItems: "flex-end", gap: 1 }}>
          <Box sx={{ px: 2, py: 1.5, borderRadius: "6px 18px 18px 18px", bgcolor: bg, color: "text.primary", maxWidth: "calc(100% - 58px)", minWidth: 0 }}>
            {children}
          </Box>
          <Timestamp time={time} lang={lang} sx={{ pb: 0.25 }} />
        </Box>
        {footer}
      </Box>
    </Box>
  );

  return (
    <>
      <style>{`
        @keyframes chatPanelIn { from { opacity: 0; transform: translateY(16px) scale(0.98); } to { opacity: 1; transform: none; } }
        @keyframes chatDot { 0%, 80%, 100% { transform: translateY(0); opacity: 0.35; } 40% { transform: translateY(-4px); opacity: 1; } }
        @media (prefers-reduced-motion: reduce) { .bl-chat-anim, .bl-chat-anim * { animation: none !important; } }
      `}</style>

      {/* Launcher — hidden on phones while the panel is open */}
      {!(open && isPhone) && (
        <Tooltip title={open ? ui.minimize : ui.title} placement="left">
          <Box
            ref={fabRef}
            component="button"
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-label={open ? ui.minimize : ui.openAssistant}
            aria-expanded={open}
            aria-controls="bloodlife-chat-panel"
            sx={{
              position: "fixed", bottom: { xs: 16, sm: 24 }, right: { xs: 16, sm: 24 }, zIndex: 1300,
              width: { xs: 50, sm: 54 }, height: { xs: 50, sm: 54 }, borderRadius: "50%", border: 0, p: 0, cursor: "pointer",
              background: RED_GRADIENT, display: "flex", alignItems: "center", justifyContent: "center",
              boxShadow: "0 6px 18px rgba(201,29,50,0.32)",
              transition: "transform .2s ease, box-shadow .2s ease",
              "&:hover": { transform: "translateY(-2px)", boxShadow: "0 10px 24px rgba(201,29,50,0.4)" },
              "&:focus-visible": { outline: "3px solid #fff", outlineOffset: 2, boxShadow: `0 0 0 6px ${C.red}` },
            }}>
            <Badge badgeContent={unread} color="success" overlap="circular"
              sx={{ "& .MuiBadge-badge": { top: -6, right: -6, fontWeight: 700 } }}>
              {open ? <CloseIcon sx={{ color: "#fff", fontSize: 24 }} /> : <BotAvatar size={40} />}
            </Badge>
          </Box>
        </Tooltip>
      )}

      {open && (
        <Paper
          id="bloodlife-chat-panel"
          role="dialog"
          aria-modal={isPhone ? "true" : "false"}
          aria-labelledby="bloodlife-chat-title"
          data-layout={isPhone ? "phone" : "floating"}
          elevation={0}
          className="bl-chat-anim"
          onKeyDown={(e) => { if (e.key === "Escape") { e.stopPropagation(); minimize(); } }}
          sx={{
            position: "fixed", zIndex: 1299,
            ...(isPhone
              ? { left: 8, right: 8, ...phoneBox, borderRadius: "22px" }
              : { bottom: 92, right: 24, width: 480, maxWidth: "calc(100vw - 48px)", height: "min(760px, calc(100dvh - 116px))", borderRadius: "26px" }),
            display: "flex", flexDirection: "column", overflow: "hidden",
            border: `1px solid ${border}`, bgcolor: panelBg,
            boxShadow: isDark ? "0 24px 64px rgba(0,0,0,0.7)" : "0 24px 64px rgba(16,24,40,0.18), 0 4px 16px rgba(16,24,40,0.06)",
            animation: "chatPanelIn .25s cubic-bezier(.2,.9,.3,1.2) both",
          }}>

          {/* Header */}
          <Box sx={{
            position: "relative", flexShrink: 0, px: { xs: 2, sm: 2.5 }, pt: { xs: 2, sm: 2.25 }, pb: 2, overflow: "hidden",
            background: isDark ? "linear-gradient(180deg, #17263D 0%, #1C2E49 100%)" : `linear-gradient(180deg, #FFFFFF 0%, #FFF7F8 100%)`,
            borderBottom: `1px solid ${isDark ? border : C.softBorder}`,
          }}>
            <HeartbeatArt />
            <Box sx={{ position: "relative", display: "flex", alignItems: "flex-start", gap: { xs: 1.5, sm: 2 } }}>
              <BotAvatar size={isPhone ? 56 : 68} ring />
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Typography id="bloodlife-chat-title" component="h2"
                  sx={{ color: textColor, fontWeight: 800, fontSize: { xs: "1.05rem", sm: "1.15rem" }, letterSpacing: "-0.01em", lineHeight: 1.25 }}>
                  {ui.title}
                </Typography>
                <Box role="status" data-status={status} sx={{
                  display: "inline-flex", alignItems: "center", gap: 0.6, px: 1, height: 22, mt: 0.5, borderRadius: 999,
                  bgcolor: STATUS_STYLE.bg, color: STATUS_STYLE.fg, fontSize: "0.74rem", fontWeight: 700,
                }}>
                  <Box sx={{ width: 7, height: 7, borderRadius: "50%", bgcolor: STATUS_STYLE.dot }} />
                  {ui[status]}
                </Box>
                <Typography sx={{ color: "text.secondary", fontSize: "0.84rem", mt: 0.5, lineHeight: 1.4 }}>
                  {ui.subtitle}
                </Typography>
                <Box role="group" aria-label={ui.language} sx={{ display: "flex", gap: 0.75, mt: 1.25 }}>
                  {LANGS.map((l) => {
                    const active = lang === l.code;
                    return (
                      <ButtonBase key={l.code} onClick={() => setLang(l.code)} aria-pressed={active} aria-label={l.name} title={l.name}
                        sx={{
                          minWidth: 48, height: 30, px: 1.5, borderRadius: 999, fontSize: "0.78rem", fontWeight: 800,
                          color: active ? "#fff" : C.red,
                          background: active ? RED_GRADIENT : softBg,
                          boxShadow: active ? "0 4px 10px rgba(201,29,50,0.28)" : "none",
                          transition: "background .15s, color .15s",
                          "&:hover": { background: active ? RED_GRADIENT : isDark ? "rgba(201,29,50,0.24)" : "#FFE4E8" },
                          ...focusRing,
                        }}>
                        {l.label}
                      </ButtonBase>
                    );
                  })}
                </Box>
              </Box>
              <Box sx={{ display: "flex", gap: 0.75, flexShrink: 0 }}>
                {messages.length > 0 && !isPhone && (
                  <Tooltip title={ui.newChat}>
                    <IconButton onClick={() => { clearConversation(); inputRef.current?.focus(); }} aria-label={ui.newChat} sx={headerBtn}>
                      <RestartAltIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                )}
                <Tooltip title={ui.minimize}>
                  <IconButton onClick={minimize} aria-label={ui.minimize} sx={headerBtn}>
                    <RemoveIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
                <Tooltip title={ui.close}>
                  <IconButton onClick={closeAndClear} aria-label={ui.close} sx={headerBtn}>
                    <CloseIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              </Box>
            </Box>
          </Box>

          {/* Conversation (the only part that scrolls) */}
          <Box sx={{ position: "relative", flex: 1, minHeight: 0, display: "flex" }}>
            <Box ref={logRef} role="log" aria-live="polite" aria-relevant="additions" tabIndex={0} aria-label={ui.conversation}
              onScroll={onLogScroll}
              sx={{
                flex: 1, minWidth: 0, overflowY: "auto", overflowX: "hidden", overscrollBehavior: "contain",
                px: { xs: 1.5, sm: 2.25 }, py: 2, display: "flex", flexDirection: "column", gap: 2,
                bgcolor: panelBg,
                "&:focus-visible": { outline: `2px solid ${C.red}`, outlineOffset: -2 },
                "&::-webkit-scrollbar": { width: 6 },
                "&::-webkit-scrollbar-thumb": { bgcolor: isDark ? "#334155" : "#CBD5E1", borderRadius: 3 },
              }}>

              {/* Welcome message (part of the widget, not an AI reply) */}
              <Box lang={lang}>
                {assistantRow({ time: welcomeTime, bg: softBg, children: (
                  <>
                    <Typography sx={{ fontWeight: 700, fontSize: "0.95rem" }}>{ui.hello}</Typography>
                    <Typography sx={{ fontWeight: 700, fontSize: "0.95rem" }}>{ui.intro}</Typography>
                    <Typography sx={{ fontSize: "0.9rem", lineHeight: 1.55, mt: 0.25 }}>{ui.introSub}</Typography>
                  </>
                ) })}
              </Box>

              {/* Privacy notice — states only what the backend actually does */}
              <Box lang={lang} sx={{
                alignSelf: "center", display: "flex", alignItems: "center", gap: 0.75, maxWidth: "100%",
                px: 1.5, py: 0.6, borderRadius: 999, bgcolor: isDark ? "#1C2E49" : C.subtle, border: `1px solid ${border}`,
              }}>
                <ShieldOutlinedIcon aria-hidden="true" sx={{ fontSize: 15, color: "text.secondary", flexShrink: 0 }} />
                <Typography sx={{ fontSize: "0.72rem", color: "text.secondary", lineHeight: 1.35 }}>
                  {ui.privacy}{" "}
                  <Box component={Link} href="/privacy" onClick={isPhone ? minimize : undefined}
                    sx={{ color: isDark ? "#F28B95" : C.red, fontWeight: 700, textDecoration: "none", "&:hover": { textDecoration: "underline" } }}>
                    {ui.privacyLink}
                  </Box>
                </Typography>
              </Box>

              {/* Quick actions — each sends a real question through the normal chat flow */}
              <Box component="nav" aria-label={ui.quickActions} lang={lang}
                sx={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: { xs: 1, sm: 1.25 } }}>
                {QUICK_ACTIONS.map((action) => {
                  const Icon = ACTION_ICONS[action.id];
                  return (
                    <ButtonBase key={action.id} onClick={() => sendMessage(action.prompt[lang] || action.prompt.en)}
                      disabled={loading} data-action={action.id}
                      sx={{
                        justifyContent: "flex-start", gap: { xs: 1, sm: 1.25 }, px: { xs: 1, sm: 1.25 }, py: 1.1, minHeight: 64,
                        borderRadius: "14px", textAlign: "left", bgcolor: panelBg, border: `1px solid ${border}`,
                        boxShadow: isDark ? "none" : "0 1px 2px rgba(16,24,40,0.04)",
                        transition: "border-color .15s, box-shadow .15s, transform .15s",
                        "&:hover": { borderColor: C.red, boxShadow: "0 6px 16px rgba(201,29,50,0.10)", transform: "translateY(-1px)" },
                        "&.Mui-disabled": { opacity: 0.55 },
                        ...focusRing,
                      }}>
                      <Box aria-hidden="true" sx={{
                        width: { xs: 34, sm: 40 }, height: { xs: 34, sm: 40 }, flexShrink: 0, borderRadius: "50%", bgcolor: softBg,
                        display: "flex", alignItems: "center", justifyContent: "center",
                      }}>
                        <Icon sx={{ fontSize: { xs: 18, sm: 21 }, color: C.red }} />
                      </Box>
                      <Typography sx={{ flex: 1, minWidth: 0, fontSize: { xs: "0.8rem", sm: "0.86rem" }, fontWeight: 700, lineHeight: 1.3, color: textColor, overflowWrap: "anywhere" }}>
                        {ui.actions[action.id]}
                      </Typography>
                      <ChevronRightIcon aria-hidden="true" sx={{ fontSize: 20, color: textColor, flexShrink: 0 }} />
                    </ButtonBase>
                  );
                })}
              </Box>

              {messages.map((msg, i) => {
                if (msg.role === "user") {
                  const pending = loading && i === lastUserIndex;
                  return (
                    <Box key={i} sx={{ display: "flex", justifyContent: "flex-end" }}>
                      <Box sx={{
                        maxWidth: "85%", px: 2, py: 1.25, borderRadius: "18px 18px 6px 18px",
                        background: RED_GRADIENT, color: "#fff", boxShadow: "0 4px 12px rgba(201,29,50,0.22)",
                      }}>
                        <Typography component="span" sx={{ fontSize: "0.92rem", lineHeight: 1.55, whiteSpace: "pre-wrap", wordBreak: "break-word" }}>
                          {msg.content}
                        </Typography>
                        <Box component="span" sx={{ display: "inline-flex", alignItems: "center", gap: 0.5, ml: 1.5, verticalAlign: "bottom", float: "right", mt: 0.6 }}>
                          <Timestamp time={msg.time} lang={lang} sx={{ color: "rgba(255,255,255,0.85)" }} />
                          {pending
                            ? <ScheduleIcon sx={{ fontSize: 14, color: "rgba(255,255,255,0.85)" }} titleAccess={ui.sending} />
                            : <DoneAllIcon sx={{ fontSize: 15, color: "rgba(255,255,255,0.9)" }} titleAccess={ui.sent} />}
                        </Box>
                      </Box>
                    </Box>
                  );
                }
                const links = replyLinks(msg.content).slice(0, 3);
                const suggestions = msg.suggestions || [];
                return assistantRow({ key: i, time: msg.time, bg: aiBubbleBg,
                  footer: (links.length > 0 || msg.offline || suggestions.length > 0) && (
                    <Box sx={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 1, mt: 1.25 }}>
                      {/* When the guide didn't understand, offer questions it can answer */}
                      {suggestions.length > 0 && (
                        <Box sx={{ width: "100%", display: "flex", flexDirection: "column", gap: 0.75 }}>
                          <Typography sx={{ fontSize: "0.75rem", fontWeight: 700, color: "text.secondary" }}>{ui.tryThese}</Typography>
                          {suggestions.map((sq) => (
                            <ButtonBase key={sq} onClick={() => sendMessage(sq)} disabled={loading}
                              sx={{
                                justifyContent: "space-between", gap: 1, px: 1.5, py: 1, borderRadius: "12px", textAlign: "left",
                                fontSize: "0.88rem", fontWeight: 600, color: "text.primary", bgcolor: panelBg, border: `1px solid ${border}`,
                                "&:hover": { borderColor: C.red, color: C.red },
                                "&.Mui-disabled": { opacity: 0.6 },
                                ...focusRing,
                              }}>
                              {sq}
                              <ChevronRightIcon aria-hidden="true" sx={{ fontSize: 18, flexShrink: 0 }} />
                            </ButtonBase>
                          ))}
                        </Box>
                      )}
                      {links.map((l, j) => (
                        <ButtonBase key={l.href + j} component={Link} href={l.href} onClick={isPhone ? minimize : undefined}
                          sx={{
                            gap: 1, px: 1.75, height: 40, borderRadius: "12px", fontSize: "0.86rem", fontWeight: 700,
                            ...(j === 0
                              ? { color: C.red, bgcolor: softBg, border: `1px solid ${isDark ? "rgba(201,29,50,0.4)" : C.softBorder}` }
                              : { color: "text.primary", bgcolor: panelBg, border: `1px solid ${border}` }),
                            "&:hover": { borderColor: C.red },
                            ...focusRing,
                          }}>
                          {j === 0 ? <OpenInNewIcon sx={{ fontSize: 18 }} /> : <DescriptionOutlinedIcon sx={{ fontSize: 18 }} />}
                          {l.label}
                        </ButtonBase>
                      ))}
                      {msg.offline && (
                        <Box component="span" sx={{ display: "inline-flex", alignItems: "center", gap: 0.5, px: 1, height: 24, borderRadius: 999,
                          bgcolor: isDark ? "rgba(245,158,11,0.15)" : "#FEF3C7", color: isDark ? "#FCD34D" : "#92400E", fontSize: "0.72rem", fontWeight: 700 }}>
                          <CloudOffIcon sx={{ fontSize: 13 }} aria-hidden="true" />{ui.guide}
                        </Box>
                      )}
                    </Box>
                  ),
                  children: <ChatMessage text={msg.content} fontSize="0.92rem" lineHeight={1.6} stepBadges /> });
              })}

              {loading && (
                <Box role="status" aria-label={ui.typing} sx={{ display: "flex", alignItems: "center", gap: 1.25 }}>
                  <BotAvatar size={isPhone ? 34 : 40} />
                  <Box sx={{ px: 2, py: 1.5, borderRadius: "6px 18px 18px 18px", bgcolor: aiBubbleBg, display: "flex", alignItems: "center", gap: 1.25 }}>
                    <Box sx={{ display: "flex", gap: 0.5 }}>
                      {[0, 1, 2].map((d) => (
                        <Box key={d} sx={{ width: 7, height: 7, borderRadius: "50%", bgcolor: C.redBright, animation: `chatDot 1.2s ease ${d * 0.18}s infinite` }} />
                      ))}
                    </Box>
                    <Typography sx={{ fontSize: "0.8rem", color: "text.secondary" }}>{ui.typing}</Typography>
                  </Box>
                </Box>
              )}
            </Box>

            {hasNew && (
              <ButtonBase onClick={() => scrollToBottom()} sx={{
                position: "absolute", bottom: 12, left: "50%", transform: "translateX(-50%)",
                display: "inline-flex", alignItems: "center", gap: 0.5, px: 1.5, height: 32, borderRadius: 999,
                fontSize: "0.78rem", fontWeight: 700, color: "#fff", background: RED_GRADIENT,
                boxShadow: "0 6px 16px rgba(201,29,50,0.3)", ...focusRing,
              }}>
                <KeyboardArrowDownIcon sx={{ fontSize: 18 }} />{ui.newMessages}
              </ButtonBase>
            )}
          </Box>

          {/* Error / offline banner */}
          {((lastFailed && !loading) || !browserOnline) && (
            <Box role="alert" sx={{
              px: { xs: 1.75, sm: 2.25 }, py: 1, flexShrink: 0, display: "flex", alignItems: "center", gap: 1,
              bgcolor: isDark ? "rgba(245,158,11,0.12)" : "#FFFBEB", borderTop: `1px solid ${isDark ? "rgba(245,158,11,0.25)" : "#FDE68A"}`,
            }}>
              <CloudOffIcon sx={{ fontSize: 18, color: "#B45309" }} aria-hidden="true" />
              <Typography sx={{ flex: 1, fontSize: "0.78rem", color: isDark ? "#FCD34D" : "#92400E", lineHeight: 1.4 }}>
                {browserOnline ? ui.offlineNote : ui.browserOffline}
              </Typography>
              {lastFailed && !loading && (
                <ButtonBase onClick={retryLast} sx={{
                  display: "inline-flex", alignItems: "center", gap: 0.5, px: 1.25, height: 30, borderRadius: 999, flexShrink: 0,
                  fontSize: "0.78rem", fontWeight: 700, color: "#92400E", bgcolor: isDark ? "#FCD34D" : "#FDE68A",
                  "&:focus-visible": { outline: "2px solid #B45309", outlineOffset: 1 },
                }}>
                  <ReplayIcon sx={{ fontSize: 15 }} />{ui.retry}
                </ButtonBase>
              )}
            </Box>
          )}

          {/* Composer — fixed at the bottom; only the conversation above scrolls */}
          <Box sx={{
            px: { xs: 1.5, sm: 2.25 }, pt: 1.5, pb: isPhone ? "max(10px, env(safe-area-inset-bottom))" : 1.25,
            flexShrink: 0, borderTop: `1px solid ${border}`, bgcolor: panelBg,
          }}>
            <Box component="form" onSubmit={(e) => { e.preventDefault(); sendMessage(); }} sx={{ display: "flex", alignItems: "flex-end", gap: 1.25 }}>
              <Box sx={{
                flex: 1, minWidth: 0, display: "flex", alignItems: "center", px: 2, py: 1, minHeight: 48, borderRadius: "24px",
                border: `1.5px solid ${border}`, bgcolor: isDark ? "#0B1220" : C.subtle, transition: "border-color .15s, box-shadow .15s",
                "&:focus-within": { borderColor: C.red, boxShadow: "0 0 0 3px rgba(201,29,50,0.12)", bgcolor: isDark ? "#0B1220" : "#fff" },
              }}>
                <InputBase
                  inputRef={inputRef}
                  fullWidth multiline maxRows={4}
                  placeholder={ui.placeholder}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) { e.preventDefault(); sendMessage(); } }}
                  inputProps={{ "aria-label": ui.placeholder, maxLength: 2000, lang, enterKeyHint: "send" }}
                  sx={{ fontSize: "16px", lineHeight: 1.5 }} // 16px stops iOS zooming into the field
                />
              </Box>
              <Tooltip title={ui.send}>
                <span>
                  <IconButton type="submit" aria-label={ui.send} aria-busy={loading} disabled={!input.trim() || loading}
                    sx={{
                      width: 48, height: 48, background: RED_GRADIENT, color: "#fff",
                      boxShadow: "0 6px 16px rgba(201,29,50,0.32)",
                      "&:hover": { background: `linear-gradient(135deg, ${C.red} 0%, ${C.redDark} 100%)` },
                      "&.Mui-disabled": { background: isDark ? "#334155" : C.softBorder, color: "#fff", boxShadow: "none" },
                      ...focusRing,
                    }}>
                    {loading ? <CircularProgress size={20} sx={{ color: "#fff" }} /> : <SendRoundedIcon sx={{ fontSize: 22, transform: "rotate(-30deg)", ml: "2px" }} />}
                  </IconButton>
                </span>
              </Tooltip>
            </Box>
            <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 0.5, mt: 1 }}>
              <InfoOutlinedIcon aria-hidden="true" sx={{ fontSize: 13, color: "text.secondary" }} />
              <Typography lang={lang} sx={{ fontSize: "0.68rem", color: "text.secondary", textAlign: "center", lineHeight: 1.4 }}>
                {ui.disclaimer}
              </Typography>
            </Box>
          </Box>
        </Paper>
      )}
    </>
  );
}
