'use client';
import { useState, useRef, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  Box, Paper, Typography, InputBase, IconButton, Tooltip, Badge, ButtonBase, useTheme, useMediaQuery,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import RemoveIcon from "@mui/icons-material/Remove";
import SendRoundedIcon from "@mui/icons-material/SendRounded";
import SmartToyIcon from "@mui/icons-material/SmartToy";
import FavoriteIcon from "@mui/icons-material/Favorite";
import PersonIcon from "@mui/icons-material/Person";
import WaterDropIcon from "@mui/icons-material/WaterDrop";
import CalendarMonthIcon from "@mui/icons-material/CalendarMonth";
import HealthAndSafetyIcon from "@mui/icons-material/HealthAndSafety";
import AutorenewIcon from "@mui/icons-material/Autorenew";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import DoneAllIcon from "@mui/icons-material/DoneAll";
import ScheduleIcon from "@mui/icons-material/Schedule";
import CloudOffIcon from "@mui/icons-material/CloudOff";
import ReplayIcon from "@mui/icons-material/Replay";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";
import DescriptionOutlinedIcon from "@mui/icons-material/DescriptionOutlined";
import RestartAltIcon from "@mui/icons-material/RestartAlt";
import { useUserAuth } from "@/store/UserAuthContext";
import { detectLanguage, QUICK_PROMPTS } from "@/lib/chatbot-kb";
import { askAssistant } from "@/lib/chat-client";
import ChatMessage, { replyLinks } from "./ChatMessage";

// BloodLife AI palette.
const C = {
  primary: "#B91C2C", dark: "#881D2A", bright: "#E11D2E", surface: "#F8FAFC",
  soft: "#FDECEE", aiBubble: "#F1F5F9", online: "#22C55E", offline: "#F59E0B",
};
const HEADER_BG = `linear-gradient(135deg, ${C.bright} 0%, ${C.primary} 55%, ${C.dark} 100%)`;

const UI_TEXT = {
  en: {
    subtitle: "Your smart companion for blood donation",
    today: "Today",
    hello: "Hello! 👋",
    intro: "I'm your BloodLife AI Assistant.",
    introSub: "Ask me anything about blood donation, eligibility, appointments, blood types, or how to get involved.",
    placeholder: "Type a message...",
    typing: "BloodLife AI is typing",
    online: "Online",
    offline: "Offline",
    offlineNote: "Can't reach the AI service — answers come from the built-in guide.",
    retry: "Retry",
    sent: "Sent",
    sending: "Sending",
    guide: "Offline guide",
    tryThese: "Try one of these:",
    newChat: "New conversation",
    minimize: "Minimize",
    close: "Close and clear chat",
    send: "Send message",
    language: "Language",
    disclaimer: "AI can make mistakes. For medical advice, please consult a doctor.",
  },
  km: {
    subtitle: "ដៃគូឆ្លាតវៃសម្រាប់ការបរិច្ចាគឈាម",
    today: "ថ្ងៃនេះ",
    hello: "សួស្ដី! 👋",
    intro: "ខ្ញុំជាជំនួយការ BloodLife AI របស់អ្នក។",
    introSub: "សួរខ្ញុំអំពីការបរិច្ចាគឈាម លក្ខខណ្ឌ ការណាត់ជួប ប្រភេទឈាម ឬរបៀបចូលរួម។",
    placeholder: "វាយបញ្ចូលសារ...",
    typing: "BloodLife AI កំពុងឆ្លើយ",
    online: "អនឡាញ",
    offline: "ក្រៅបណ្ដាញ",
    offlineNote: "មិនអាចភ្ជាប់សេវា AI បានទេ — ចម្លើយមកពីមគ្គុទ្ទេសក៍ដែលមានស្រាប់។",
    retry: "ព្យាយាមម្ដងទៀត",
    sent: "បានផ្ញើ",
    sending: "កំពុងផ្ញើ",
    guide: "មគ្គុទ្ទេសក៍ក្រៅបណ្ដាញ",
    tryThese: "សាកល្បងសួរសំណួរទាំងនេះ៖",
    newChat: "ការសន្ទនាថ្មី",
    minimize: "បង្រួម",
    close: "បិទ និងលុបការសន្ទនា",
    send: "ផ្ញើសារ",
    language: "ភាសា",
    disclaimer: "AI អាចមានកំហុស។ សម្រាប់ដំបូន្មានវេជ្ជសាស្ត្រ សូមពិគ្រោះជាមួយគ្រូពេទ្យ។",
  },
  vi: {
    subtitle: "Người bạn đồng hành thông minh cho hiến máu",
    today: "Hôm nay",
    hello: "Xin chào! 👋",
    intro: "Tôi là Trợ lý BloodLife AI của bạn.",
    introSub: "Hãy hỏi tôi về hiến máu, điều kiện hiến, lịch hẹn, nhóm máu hoặc cách tham gia.",
    placeholder: "Nhập tin nhắn...",
    typing: "BloodLife AI đang trả lời",
    online: "Trực tuyến",
    offline: "Ngoại tuyến",
    offlineNote: "Không kết nối được dịch vụ AI — câu trả lời lấy từ hướng dẫn có sẵn.",
    retry: "Thử lại",
    sent: "Đã gửi",
    sending: "Đang gửi",
    guide: "Hướng dẫn ngoại tuyến",
    tryThese: "Thử một trong các câu hỏi sau:",
    newChat: "Cuộc trò chuyện mới",
    minimize: "Thu nhỏ",
    close: "Đóng và xoá cuộc trò chuyện",
    send: "Gửi tin nhắn",
    language: "Ngôn ngữ",
    disclaimer: "AI có thể mắc lỗi. Hãy hỏi ý kiến bác sĩ để được tư vấn y tế.",
  },
};

const LANGS = [
  { code: "en", label: "EN", name: "English" },
  { code: "km", label: "KH", name: "ខ្មែរ" },
  { code: "vi", label: "VN", name: "Tiếng Việt" },
];

// One icon per quick question — QUICK_PROMPTS lists the same six questions in every language.
const PROMPT_ICONS = [PersonIcon, WaterDropIcon, CalendarMonthIcon, HealthAndSafetyIcon, AutorenewIcon, FavoriteIcon];

const formatTime = (t) => new Date(t).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });

// Robot with a heart — the assistant's avatar. `large` is the white disc used in the header.
function AssistantAvatar({ size = 40, large = false }) {
  return (
    <Box aria-hidden="true" sx={{
      position: "relative", width: size, height: size, flexShrink: 0, borderRadius: "50%",
      display: "flex", alignItems: "center", justifyContent: "center",
      bgcolor: large ? "#fff" : C.soft,
      boxShadow: large ? "0 6px 18px rgba(0,0,0,0.18)" : "none",
    }}>
      <SmartToyIcon sx={{ color: large ? "#1E293B" : C.primary, fontSize: size * 0.58 }} />
      <FavoriteIcon sx={{
        position: "absolute", bottom: size * 0.14, left: "50%", transform: "translateX(-50%)",
        fontSize: size * 0.2, color: C.bright, display: large ? "block" : "none",
      }} />
    </Box>
  );
}

// Decorative heartbeat line + heart in the header's lower-right corner.
function HeartbeatArt() {
  return (
    <Box aria-hidden="true" sx={{ position: "absolute", right: 0, bottom: 0, width: 190, height: 70, pointerEvents: "none", opacity: 0.9 }}>
      <svg width="190" height="70" viewBox="0 0 190 70" fill="none">
        <path d="M0 52 H70 L78 44 L86 58 L96 18 L106 64 L114 40 L120 52 H190" stroke="rgba(255,255,255,0.35)" strokeWidth="2" strokeLinejoin="round" />
      </svg>
      <FavoriteIcon sx={{ position: "absolute", right: 30, bottom: 16, fontSize: 36, color: "rgba(255,205,210,0.9)" }} />
    </Box>
  );
}

function Timestamp({ time, sx }) {
  if (!time) return null;
  return (
    <Typography component="time" dateTime={new Date(time).toISOString()} sx={{ fontSize: "0.72rem", color: "text.secondary", whiteSpace: "nowrap", ...sx }}>
      {formatTime(time)}
    </Typography>
  );
}

export default function ChatBot() {
  const { token } = useUserAuth();
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";
  const isPhone = useMediaQuery(theme.breakpoints.down("sm"));
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([]); // { role, content, time, offline? }
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [unread, setUnread] = useState(0);
  const [promptLang, setPromptLang] = useState("en");
  const [welcomeTime, setWelcomeTime] = useState(null);
  const logRef = useRef(null);
  const inputRef = useRef(null);
  const fabRef = useRef(null);
  const openRef = useRef(open);
  // Bumped whenever the conversation is cleared, so a reply still in flight for the old one is dropped.
  const conversationRef = useRef(0);
  useEffect(() => { openRef.current = open; }, [open]);

  // Pages can open the assistant (e.g. a "Need Help?" panel): window.dispatchEvent(new CustomEvent("bloodlife:open-chat")).
  useEffect(() => {
    const openChat = () => setOpen(true);
    window.addEventListener("bloodlife:open-chat", openChat);
    return () => window.removeEventListener("bloodlife:open-chat", openChat);
  }, []);

  // Keep the newest message in view by scrolling the log itself, so the page behind never jumps.
  useEffect(() => {
    const el = logRef.current;
    if (el) el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
  }, [messages, loading, open]);

  useEffect(() => {
    if (!open) return;
    setUnread(0);
    setWelcomeTime(t => t ?? Date.now());
    const t = setTimeout(() => inputRef.current?.focus(), 150);
    return () => clearTimeout(t);
  }, [open]);

  const ask = useCallback(async (history, content) => {
    const lang = detectLanguage(content);
    setPromptLang(lang);
    setLoading(true);
    const conversation = conversationRef.current;
    // Only role + content go to the API; time/offline are display-only.
    const reply = await askAssistant({
      history: history.map(({ role, content: c }) => ({ role, content: c })), content, lang, token,
    });
    if (conversation !== conversationRef.current) return; // chat was cleared meanwhile
    // With no AI key set up, the built-in guide is the normal mode, so only a real failure is
    // flagged offline (amber status, "Offline guide" tag, warning strip with Retry).
    const offline = reply.offline && !reply.unconfigured;
    // The guide may recognise accent-free Vietnamese typed as "English" — follow its answer language.
    if (reply.lang && reply.lang !== lang) setPromptLang(reply.lang);
    setMessages(prev => [...prev, {
      role: "assistant", content: reply.content, offline, suggestions: reply.suggestions || [], time: Date.now(),
    }]);
    setLoading(false);
    if (!openRef.current) setUnread(n => n + 1);
  }, [token]);

  const sendMessage = (text) => {
    const content = (text ?? input).trim();
    if (!content || loading) return;
    const history = [...messages, { role: "user", content, time: Date.now() }];
    setMessages(history);
    setInput("");
    ask(history, content);
  };

  // Re-ask the last question after an offline answer, replacing that answer.
  const retryLast = () => {
    if (loading) return;
    const lastUser = [...messages].reverse().find(m => m.role === "user");
    if (!lastUser) return;
    const history = messages[messages.length - 1]?.role === "assistant" ? messages.slice(0, -1) : messages;
    setMessages(history);
    ask(history, lastUser.content);
  };

  const clearConversation = () => {
    conversationRef.current += 1;
    setMessages([]);
    setLoading(false);
    setWelcomeTime(Date.now());
  };
  const minimize = () => { setOpen(false); fabRef.current?.focus(); };
  const closeAndClear = () => { minimize(); clearConversation(); setInput(""); };

  const ui = UI_TEXT[promptLang];
  const last = messages[messages.length - 1];
  const isOffline = last?.role === "assistant" && last.offline;
  const lastUserIndex = messages.map(m => m.role).lastIndexOf("user");

  const border = isDark ? "#262626" : "#E2E8F0";
  const panelBg = isDark ? "#111111" : "#ffffff";
  const aiBubbleBg = isDark ? "#1c1c1c" : C.aiBubble;
  const softBg = isDark ? "rgba(185,28,44,0.14)" : C.soft;
  const focusRing = { "&:focus-visible": { outline: `2px solid ${C.primary}`, outlineOffset: 2 } };

  const roundHeaderBtn = {
    width: 40, height: 40, color: "#fff", bgcolor: "rgba(255,255,255,0.16)",
    "&:hover": { bgcolor: "rgba(255,255,255,0.28)" },
    "&:focus-visible": { outline: "2px solid #fff", outlineOffset: 2 },
  };

  // Assistant row: avatar, bubble, and the time beside the bubble. A plain function, not a
  // component, so rows aren't remounted on every render.
  const assistantRow = ({ key, children, time, bg, footer }) => (
    <Box key={key} sx={{ display: "flex", alignItems: "flex-start", gap: 1.5 }}>
      <AssistantAvatar size={isPhone ? 38 : 46} />
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Box sx={{ display: "flex", alignItems: "flex-end", gap: 1 }}>
          <Box sx={{ px: 2, py: 1.5, borderRadius: "18px", bgcolor: bg, color: "text.primary", maxWidth: "calc(100% - 64px)", minWidth: 0 }}>
            {children}
          </Box>
          <Timestamp time={time} sx={{ pb: 0.25 }} />
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

      {/* Launcher — hidden on phones while the full-screen panel is open */}
      {!(open && isPhone) && (
        <Tooltip title={open ? ui.minimize : "BloodLife AI Assistant"} placement="left">
          <Box
            ref={fabRef}
            component="button"
            type="button"
            onClick={() => setOpen(v => !v)}
            aria-label={open ? "Minimize BloodLife AI Assistant" : "Open BloodLife AI Assistant"}
            aria-expanded={open}
            aria-controls="bloodlife-chat-panel"
            sx={{
              position: "fixed", bottom: { xs: 16, sm: 24 }, right: { xs: 16, sm: 24 }, zIndex: 1300,
              width: { xs: 46, sm: 50 }, height: { xs: 46, sm: 50 }, borderRadius: "50%", border: 0, p: 0, cursor: "pointer",
              background: HEADER_BG, display: "flex", alignItems: "center", justifyContent: "center",
              boxShadow: "0 4px 14px rgba(185,28,44,0.28)",
              transition: "transform .2s ease, box-shadow .2s ease",
              "&:hover": { transform: "translateY(-2px)", boxShadow: "0 8px 20px rgba(185,28,44,0.36)" },
              "&:focus-visible": { outline: "3px solid #fff", outlineOffset: 2, boxShadow: `0 0 0 6px ${C.primary}` },
            }}>
            <Badge badgeContent={unread} color="success" overlap="circular"
              sx={{ "& .MuiBadge-badge": { top: -6, right: -6, fontWeight: 700 } }}>
              {open ? <CloseIcon sx={{ color: "#fff", fontSize: 22 }} /> : <SmartToyIcon sx={{ color: "#fff", fontSize: 24 }} />}
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
          elevation={0}
          className="bl-chat-anim"
          onKeyDown={(e) => { if (e.key === "Escape") { e.stopPropagation(); minimize(); } }}
          sx={{
            position: "fixed", zIndex: 1299,
            ...(isPhone
              ? { inset: 0, width: "100%", height: "100dvh", borderRadius: 0 }
              : { bottom: 88, right: 24, width: 440, height: "min(720px, calc(100vh - 128px))", borderRadius: "28px" }),
            display: "flex", flexDirection: "column", overflow: "hidden",
            border: isPhone ? 0 : `1px solid ${border}`, bgcolor: panelBg,
            boxShadow: isDark ? "0 24px 64px rgba(0,0,0,0.7)" : "0 24px 64px rgba(15,23,42,0.18), 0 4px 16px rgba(15,23,42,0.06)",
            animation: "chatPanelIn .25s cubic-bezier(.2,.9,.3,1.2) both",
          }}>

          {/* Header */}
          <Box sx={{ position: "relative", flexShrink: 0, px: 2.25, pt: 2.25, pb: 2, background: HEADER_BG, overflow: "hidden" }}>
            <HeartbeatArt />
            <Box sx={{ position: "relative", display: "flex", alignItems: "flex-start", gap: 1.75 }}>
              <AssistantAvatar size={isPhone ? 60 : 72} large />
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1, flexWrap: "wrap" }}>
                  <Typography id="bloodlife-chat-title" component="h2"
                    sx={{ color: "#fff", fontWeight: 800, fontSize: { xs: "1.05rem", sm: "1.15rem" }, letterSpacing: "-0.01em", lineHeight: 1.25 }}>
                    BloodLife AI Assistant
                  </Typography>
                  <Box role="status" sx={{
                    display: "inline-flex", alignItems: "center", gap: 0.6, px: 1.1, height: 24, borderRadius: 999,
                    bgcolor: "rgba(255,255,255,0.2)", color: "#fff", fontSize: "0.75rem", fontWeight: 700,
                  }}>
                    <Box sx={{ width: 8, height: 8, borderRadius: "50%", bgcolor: isOffline ? C.offline : C.online }} />
                    {isOffline ? ui.offline : ui.online}
                  </Box>
                </Box>
                <Typography sx={{ color: "rgba(255,255,255,0.88)", fontSize: "0.85rem", mt: 0.4, lineHeight: 1.35 }}>
                  {ui.subtitle}
                </Typography>
                <Box role="group" aria-label={ui.language} sx={{ display: "flex", gap: 1, mt: 1.25 }}>
                  {LANGS.map(l => {
                    const active = promptLang === l.code;
                    return (
                      <Tooltip key={l.code} title={l.name}>
                        <ButtonBase onClick={() => setPromptLang(l.code)} aria-pressed={active} aria-label={l.name}
                          sx={{
                            minWidth: 52, height: 30, px: 1.5, borderRadius: 999, fontSize: "0.8rem", fontWeight: 800,
                            color: active ? C.primary : "rgba(255,255,255,0.9)",
                            bgcolor: active ? "#fff" : "rgba(255,255,255,0.14)",
                            transition: "background .15s, color .15s",
                            "&:hover": { bgcolor: active ? "#fff" : "rgba(255,255,255,0.26)" },
                            "&:focus-visible": { outline: "2px solid #fff", outlineOffset: 2 },
                          }}>
                          {l.label}
                        </ButtonBase>
                      </Tooltip>
                    );
                  })}
                </Box>
              </Box>
              <Box sx={{ display: "flex", gap: 1, flexShrink: 0 }}>
                {messages.length > 0 && !isPhone && (
                  <Tooltip title={ui.newChat}>
                    <IconButton onClick={() => { clearConversation(); inputRef.current?.focus(); }} aria-label={ui.newChat} sx={roundHeaderBtn}>
                      <RestartAltIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                )}
                <Tooltip title={ui.minimize}>
                  <IconButton onClick={minimize} aria-label={ui.minimize} sx={roundHeaderBtn}>
                    <RemoveIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
                <Tooltip title={ui.close}>
                  <IconButton onClick={closeAndClear} aria-label={ui.close} sx={roundHeaderBtn}>
                    <CloseIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              </Box>
            </Box>
          </Box>

          {/* Conversation (the only part that scrolls) */}
          <Box ref={logRef} role="log" aria-live="polite" aria-relevant="additions" tabIndex={0} aria-label="Conversation"
            sx={{
              flex: 1, minHeight: 0, overflowY: "auto", overscrollBehavior: "contain",
              px: { xs: 1.75, sm: 2.25 }, py: 2, display: "flex", flexDirection: "column", gap: 2,
              bgcolor: panelBg,
              "&:focus-visible": { outline: `2px solid ${C.primary}`, outlineOffset: -2 },
              "&::-webkit-scrollbar": { width: 6 },
              "&::-webkit-scrollbar-thumb": { bgcolor: isDark ? "#2a2a2a" : "#CBD5E1", borderRadius: 3 },
            }}>

            <Box sx={{ alignSelf: "center", px: 1.5, py: 0.4, borderRadius: 999, bgcolor: isDark ? "#1c1c1c" : C.surface, border: `1px solid ${border}` }}>
              <Typography sx={{ fontSize: "0.78rem", fontWeight: 600, color: "text.secondary" }}>{ui.today}</Typography>
            </Box>

            {/* Welcome message (part of the widget, not an AI reply) */}
            <Box lang={promptLang}>
              {assistantRow({ time: welcomeTime, bg: softBg, children: (
                <>
                  <Typography sx={{ fontWeight: 700, fontSize: "0.95rem" }}>{ui.hello}</Typography>
                  <Typography sx={{ fontWeight: 700, fontSize: "0.95rem" }}>{ui.intro}</Typography>
                  <Typography sx={{ fontSize: "0.9rem", lineHeight: 1.55, mt: 0.25 }}>{ui.introSub}</Typography>
                </>
              ) })}
            </Box>

            {/* Quick questions */}
            <Box lang={promptLang} sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 1.25 }}>
              {QUICK_PROMPTS[promptLang].map((p, i) => {
                const Icon = PROMPT_ICONS[i] || FavoriteIcon;
                return (
                  <ButtonBase key={p} onClick={() => sendMessage(p)} disabled={loading}
                    sx={{
                      justifyContent: "flex-start", gap: 1.25, px: 1.25, py: 1.1, borderRadius: "16px", textAlign: "left",
                      bgcolor: panelBg, border: `1px solid ${border}`,
                      boxShadow: isDark ? "none" : "0 1px 2px rgba(15,23,42,0.04)",
                      transition: "border-color .15s, box-shadow .15s",
                      "&:hover": { borderColor: C.primary, boxShadow: "0 4px 12px rgba(185,28,44,0.10)" },
                      "&.Mui-disabled": { opacity: 0.6 },
                      ...focusRing,
                    }}>
                    <Box aria-hidden="true" sx={{ width: 40, height: 40, flexShrink: 0, borderRadius: "50%", bgcolor: softBg, display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <Icon sx={{ fontSize: 20, color: C.bright }} />
                    </Box>
                    <Typography sx={{ flex: 1, fontSize: { xs: "0.8rem", sm: "0.86rem" }, fontWeight: 600, lineHeight: 1.35, color: "text.primary" }}>{p}</Typography>
                    <ChevronRightIcon aria-hidden="true" sx={{ fontSize: 20, color: "text.primary", flexShrink: 0 }} />
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
                      bgcolor: C.bright, color: "#fff", boxShadow: "0 4px 12px rgba(225,29,46,0.25)",
                    }}>
                      <Typography component="span" sx={{ fontSize: "0.92rem", lineHeight: 1.55, whiteSpace: "pre-wrap", wordBreak: "break-word" }}>
                        {msg.content}
                      </Typography>
                      <Box component="span" sx={{ display: "inline-flex", alignItems: "center", gap: 0.5, ml: 1.5, verticalAlign: "bottom", float: "right", mt: 0.6 }}>
                        <Timestamp time={msg.time} sx={{ color: "rgba(255,255,255,0.8)" }} />
                        {pending
                          ? <ScheduleIcon sx={{ fontSize: 14, color: "rgba(255,255,255,0.8)" }} titleAccess={ui.sending} />
                          : <DoneAllIcon sx={{ fontSize: 15, color: "rgba(255,255,255,0.85)" }} titleAccess={ui.sent} />}
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
                          {suggestions.map(sq => (
                            <ButtonBase key={sq} onClick={() => sendMessage(sq)} disabled={loading}
                              sx={{
                                justifyContent: "space-between", gap: 1, px: 1.5, py: 1, borderRadius: "12px", textAlign: "left",
                                fontSize: "0.88rem", fontWeight: 600, color: "text.primary", bgcolor: panelBg, border: `1px solid ${border}`,
                                "&:hover": { borderColor: C.primary, color: C.primary },
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
                            gap: 1, px: 2, height: 42, borderRadius: "12px", fontSize: "0.9rem", fontWeight: 700,
                            ...(j === 0
                              ? { color: C.bright, bgcolor: softBg, border: `1px solid ${isDark ? "rgba(225,29,46,0.4)" : "#F8C9CE"}` }
                              : { color: "text.primary", bgcolor: panelBg, border: `1px solid ${border}` }),
                            "&:hover": { borderColor: C.primary },
                            ...focusRing,
                          }}>
                          {j === 0 ? <OpenInNewIcon sx={{ fontSize: 19 }} /> : <DescriptionOutlinedIcon sx={{ fontSize: 19 }} />}
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
              <Box role="status" aria-label={ui.typing} sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                <AssistantAvatar size={isPhone ? 38 : 46} />
                <Box sx={{ px: 2, py: 1.5, borderRadius: "18px", bgcolor: aiBubbleBg, display: "flex", alignItems: "center", gap: 1.25 }}>
                  <Box sx={{ display: "flex", gap: 0.5 }}>
                    {[0, 1, 2].map(i => (
                      <Box key={i} sx={{ width: 7, height: 7, borderRadius: "50%", bgcolor: C.bright, animation: `chatDot 1.2s ease ${i * 0.18}s infinite` }} />
                    ))}
                  </Box>
                  <Typography sx={{ fontSize: "0.8rem", color: "text.secondary" }}>{ui.typing}</Typography>
                </Box>
              </Box>
            )}
          </Box>

          {/* Offline / error banner */}
          {isOffline && !loading && (
            <Box role="alert" sx={{
              px: 2.25, py: 1, flexShrink: 0, display: "flex", alignItems: "center", gap: 1,
              bgcolor: isDark ? "rgba(245,158,11,0.12)" : "#FFFBEB", borderTop: `1px solid ${isDark ? "rgba(245,158,11,0.25)" : "#FDE68A"}`,
            }}>
              <CloudOffIcon sx={{ fontSize: 18, color: "#B45309" }} aria-hidden="true" />
              <Typography sx={{ flex: 1, fontSize: "0.78rem", color: isDark ? "#FCD34D" : "#92400E", lineHeight: 1.4 }}>{ui.offlineNote}</Typography>
              <ButtonBase onClick={retryLast} sx={{
                display: "inline-flex", alignItems: "center", gap: 0.5, px: 1.25, height: 30, borderRadius: 999, flexShrink: 0,
                fontSize: "0.78rem", fontWeight: 700, color: "#92400E", bgcolor: isDark ? "#FCD34D" : "#FDE68A",
                "&:focus-visible": { outline: "2px solid #B45309", outlineOffset: 1 },
              }}>
                <ReplayIcon sx={{ fontSize: 15 }} />{ui.retry}
              </ButtonBase>
            </Box>
          )}

          {/* Composer — fixed at the bottom; only the conversation above scrolls */}
          <Box sx={{
            px: { xs: 1.75, sm: 2.25 }, pt: 1.5, pb: isPhone ? "max(12px, env(safe-area-inset-bottom))" : 1.25,
            flexShrink: 0, borderTop: `1px solid ${border}`, bgcolor: isDark ? "#0d0d0d" : C.surface,
          }}>
            <Box component="form" onSubmit={(e) => { e.preventDefault(); sendMessage(); }} sx={{ display: "flex", alignItems: "flex-end", gap: 1.25 }}>
              <Box sx={{
                flex: 1, minWidth: 0, display: "flex", alignItems: "center", px: 2, py: 0.9, borderRadius: "16px",
                border: `1.5px solid ${border}`, bgcolor: panelBg, transition: "border-color .15s, box-shadow .15s",
                "&:focus-within": { borderColor: C.primary, boxShadow: "0 0 0 3px rgba(185,28,44,0.12)" },
              }}>
                <InputBase
                  inputRef={inputRef}
                  fullWidth multiline maxRows={4}
                  placeholder={ui.placeholder}
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) { e.preventDefault(); sendMessage(); } }}
                  inputProps={{ "aria-label": ui.placeholder, maxLength: 2000 }}
                  sx={{ fontSize: "0.95rem", lineHeight: 1.5 }}
                />
              </Box>
              <Tooltip title={ui.send}>
                <span>
                  <IconButton type="submit" aria-label={ui.send} disabled={!input.trim() || loading}
                    sx={{
                      width: 52, height: 52, borderRadius: "16px", bgcolor: C.bright, color: "#fff",
                      boxShadow: "0 6px 16px rgba(225,29,46,0.35)",
                      "&:hover": { bgcolor: C.primary },
                      "&.Mui-disabled": { bgcolor: isDark ? "#3a1a1d" : "#F5B5BC", color: "#fff", boxShadow: "none" },
                      ...focusRing,
                    }}>
                    <SendRoundedIcon sx={{ fontSize: 24 }} />
                  </IconButton>
                </span>
              </Tooltip>
            </Box>
            <Typography sx={{ fontSize: "0.68rem", color: "text.secondary", textAlign: "center", mt: 0.9, lineHeight: 1.4 }}>
              {ui.disclaimer}
            </Typography>
          </Box>
        </Paper>
      )}
    </>
  );
}
