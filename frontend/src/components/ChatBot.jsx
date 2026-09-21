'use client';
import { useState, useRef, useEffect } from "react";
import {
  Box, Paper, Typography, TextField, IconButton, useTheme, Chip,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import SendIcon from "@mui/icons-material/Send";
import SmartToyIcon from "@mui/icons-material/SmartToy";
import FavoriteIcon from "@mui/icons-material/Favorite";
import { useUserAuth } from "@/store/UserAuthContext";
import { detectLanguage, QUICK_PROMPTS } from "@/lib/chatbot-kb";
import { askAssistant } from "@/lib/chat-client";
import ChatMessage from "@/components/ChatMessage";

const UI_TEXT = {
  en: {
    placeholder: "Type a message...",
    title: "How can I help you?",
    sub: "Ask me anything about blood donation.",
  },
  km: {
    placeholder: "វាយបញ្ចូលសាររបស់អ្នក...",
    title: "តើខ្ញុំអាចជួយអ្វីបានខ្លះ?",
    sub: "សួរខ្ញុំអំពីការបរិច្ចាគឈាម។",
  },
  vi: {
    placeholder: "Nhập tin nhắn của bạn...",
    title: "Tôi có thể giúp gì cho bạn?",
    sub: "Hỏi tôi bất cứ điều gì về hiến máu.",
  },
};

const LANG_LABELS = { en: "EN", km: "ខ្មែរ", vi: "VN" };

export default function ChatBot() {
  const { token } = useUserAuth();
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [visible, setVisible] = useState(false);
  const [promptLang, setPromptLang] = useState("en");
  const bottomRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages, loading]);
  useEffect(() => {
    if (open) {
      setTimeout(() => setVisible(true), 10);
      setTimeout(() => inputRef.current?.focus(), 180);
    } else {
      setVisible(false);
    }
  }, [open]);

  const sendMessage = async (text) => {
    const content = (text || input).trim();
    if (!content || loading) return;

    const lang = detectLanguage(content);
    setPromptLang(lang);

    const userMsg = { role: "user", content };
    const history = [...messages, userMsg];
    setMessages(history);
    setInput("");
    setLoading(true);

    const reply = await askAssistant({ history, content, lang, token });
    setMessages(prev => [...prev, { role: "assistant", content: reply.content, offline: reply.offline }]);
    setLoading(false);
  };

  const border = isDark ? "#1f1f1f" : "#e5e5e5";
  const panelBg = isDark ? "#111111" : "#ffffff";
  const ui = UI_TEXT[promptLang];

  return (
    <>
      <style>{`
        @keyframes chatPanelIn {
          from { opacity: 0; transform: translateY(16px) scale(0.97); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes dotBounce {
          0%, 80%, 100% { transform: translateY(0); opacity: 0.4; }
          40% { transform: translateY(-5px); opacity: 1; }
        }
      `}</style>

      {/* FAB */}
      <Box
        component="button"
        type="button"
        onClick={() => setOpen(v => !v)}
        aria-label={open ? "Close chat assistant" : "Open chat assistant"}
        aria-expanded={open}
        sx={{
        position: "fixed", bottom: 28, right: 28, zIndex: 1300,
        width: 56, height: 56, borderRadius: "50%", border: 0, p: 0,
        background: "linear-gradient(135deg, #dc2626 0%, #991b1b 100%)",
        display: "flex", alignItems: "center", justifyContent: "center",
        cursor: "pointer",
        boxShadow: "0 4px 20px rgba(220,38,38,0.5), 0 2px 8px rgba(220,38,38,0.3)",
        transition: "all 0.22s ease",
        "&:hover": {
          transform: "scale(1.08)",
          boxShadow: "0 8px 32px rgba(220,38,38,0.6), 0 4px 12px rgba(220,38,38,0.4)",
        },
        "&:focus-visible": { outline: "3px solid #fff", outlineOffset: 2, boxShadow: "0 0 0 5px #b91c1c" },
      }}>
        {open
          ? <CloseIcon sx={{ color: "white", fontSize: 22 }} />
          : <SmartToyIcon sx={{ color: "white", fontSize: 24 }} />}
      </Box>

      {/* Panel */}
      {open && (
        <Paper elevation={0} sx={{
          position: "fixed", bottom: 96, right: 28, zIndex: 1299,
          width: { xs: "calc(100vw - 32px)", sm: 400 },
          maxWidth: 420, height: 560,
          borderRadius: "20px",
          display: "flex", flexDirection: "column", overflow: "hidden",
          border: `1px solid ${border}`,
          boxShadow: isDark
            ? "0 24px 80px rgba(0,0,0,0.7), 0 8px 32px rgba(0,0,0,0.5)"
            : "0 24px 80px rgba(0,0,0,0.15), 0 8px 32px rgba(0,0,0,0.08)",
          bgcolor: panelBg,
          animation: "chatPanelIn 0.28s cubic-bezier(0.34, 1.56, 0.64, 1) both",
          opacity: visible ? 1 : 0,
          transition: "opacity 0.2s ease",
        }}>

          {/* Header */}
          <Box sx={{
            px: 2.5, py: 2,
            borderBottom: `1px solid ${border}`,
            display: "flex", alignItems: "center", gap: 1.5, flexShrink: 0,
            background: isDark
              ? "linear-gradient(135deg, #1a0000 0%, #2d0505 100%)"
              : "linear-gradient(135deg, #dc2626 0%, #991b1b 100%)",
          }}>
            <Box sx={{
              width: 38, height: 38, borderRadius: "12px",
              background: "rgba(255,255,255,0.18)",
              border: "1px solid rgba(255,255,255,0.3)",
              display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
            }}>
              <SmartToyIcon sx={{ color: "white", fontSize: 20 }} />
            </Box>
            <Box flex={1}>
              <Box sx={{ display: "flex", alignItems: "center", gap: 0.8 }}>
                <Typography fontWeight={800} fontSize="0.92rem" sx={{ color: "white", letterSpacing: "-0.01em" }}>
                  AI Assistant
                </Typography>
                <Box sx={{
                  display: "flex", alignItems: "center", gap: 0.4,
                  px: 0.8, py: 0.2, borderRadius: "100px",
                  bgcolor: "rgba(255,255,255,0.18)",
                }}>
                  <Box sx={{
                    width: 5, height: 5, borderRadius: "50%", bgcolor: "#4ade80",
                    animation: "pulse 2s ease infinite",
                    "@keyframes pulse": { "0%,100%": { opacity: 1 }, "50%": { opacity: 0.4 } },
                  }} />
                  <Typography sx={{ fontSize: "0.65rem", color: "rgba(255,255,255,0.85)", fontWeight: 600 }}>Online</Typography>
                </Box>
              </Box>
              {/* Language selector */}
              <Box sx={{ display: "flex", gap: 0.5, mt: 0.4 }}>
                {["en", "km", "vi"].map(lang => (
                  <Box
                    key={lang}
                    onClick={() => setPromptLang(lang)}
                    sx={{
                      px: 0.8, py: 0.1, borderRadius: "6px", cursor: "pointer",
                      fontSize: "0.62rem", fontWeight: 700,
                      bgcolor: promptLang === lang ? "rgba(255,255,255,0.28)" : "rgba(255,255,255,0.1)",
                      color: promptLang === lang ? "white" : "rgba(255,255,255,0.55)",
                      border: `1px solid ${promptLang === lang ? "rgba(255,255,255,0.4)" : "transparent"}`,
                      transition: "all 0.15s",
                      "&:hover": { bgcolor: "rgba(255,255,255,0.22)", color: "white" },
                    }}
                  >
                    {LANG_LABELS[lang]}
                  </Box>
                ))}
              </Box>
            </Box>
            <IconButton size="small" onClick={() => setOpen(false)}
              sx={{ color: "rgba(255,255,255,0.7)", "&:hover": { color: "white", bgcolor: "rgba(255,255,255,0.1)" }, borderRadius: "8px" }}>
              <CloseIcon fontSize="small" />
            </IconButton>
          </Box>

          {/* Messages */}
          <Box sx={{
            flex: 1, overflowY: "auto", px: 2, py: 2,
            display: "flex", flexDirection: "column", gap: 1.5,
            "&::-webkit-scrollbar": { width: 4 },
            "&::-webkit-scrollbar-thumb": { bgcolor: isDark ? "#2a2a2a" : "#e0e0e0", borderRadius: 2 },
          }}>

            {/* Empty state */}
            {messages.length === 0 && (
              <Box sx={{ textAlign: "center", py: 2 }}>
                <Box sx={{
                  width: 68, height: 68, borderRadius: "18px", mx: "auto", mb: 2,
                  background: "linear-gradient(135deg, rgba(220,38,38,0.15) 0%, rgba(185,28,28,0.08) 100%)",
                  border: `1px solid ${isDark ? "rgba(220,38,38,0.25)" : "rgba(220,38,38,0.20)"}`,
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}>
                  <FavoriteIcon sx={{ fontSize: 32, color: "#dc2626" }} />
                </Box>
                <Typography fontWeight={700} fontSize="0.95rem" mb={0.5} sx={{ color: isDark ? "#f5f5f5" : "#111111" }}>
                  {ui.title}
                </Typography>
                <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 2.5 }}>
                  {ui.sub}
                </Typography>
                <Box sx={{ display: "flex", flexDirection: "column", gap: 0.8 }}>
                  {QUICK_PROMPTS[promptLang].map(p => (
                    <Chip
                      key={p} label={p} size="small" clickable onClick={() => sendMessage(p)}
                      variant="outlined"
                      sx={{
                        fontSize: "0.78rem", fontWeight: 500, height: 30,
                        borderColor: isDark ? "#2a2a2a" : "#e0e0e0",
                        color: isDark ? "#888888" : "#555555",
                        borderRadius: "8px",
                        "&:hover": {
                          borderColor: "#dc2626", color: "#dc2626",
                          bgcolor: "rgba(220,38,38,0.06)",
                        },
                        transition: "all 0.15s ease",
                      }}
                    />
                  ))}
                </Box>
              </Box>
            )}

            {messages.map((msg, i) => (
              <Box key={i} sx={{ display: "flex", justifyContent: msg.role === "user" ? "flex-end" : "flex-start", gap: 1 }}>
                {msg.role === "assistant" && (
                  <Box sx={{
                    width: 28, height: 28, borderRadius: "8px",
                    background: "linear-gradient(135deg, #dc2626 0%, #991b1b 100%)",
                    flexShrink: 0, mt: 0.2,
                    display: "flex", alignItems: "center", justifyContent: "center",
                  }}>
                    <SmartToyIcon sx={{ fontSize: 14, color: "white" }} />
                  </Box>
                )}
                <Box sx={{
                  maxWidth: "78%", px: 1.8, py: 1.2,
                  borderRadius: msg.role === "user" ? "16px 16px 4px 16px" : "16px 16px 16px 4px",
                  background: msg.role === "user"
                    ? "linear-gradient(135deg, #dc2626 0%, #b91c1c 100%)"
                    : isDark ? "#1a1a1a" : "#f5f5f5",
                  border: msg.role === "user" ? "none" : `1px solid ${isDark ? "#2a2a2a" : "#ebebeb"}`,
                  color: msg.role === "user" ? "white" : isDark ? "rgba(245,245,245,0.9)" : "#222222",
                  boxShadow: msg.role === "user" ? "0 2px 8px rgba(220,38,38,0.3)" : "none",
                }}>
                  {msg.role === "user" ? (
                    <Typography variant="body2" sx={{ fontSize: "0.83rem", lineHeight: 1.65, whiteSpace: "pre-wrap", wordBreak: "break-word" }}>
                      {msg.content}
                    </Typography>
                  ) : (
                    <ChatMessage text={msg.content} fontSize="0.83rem" lineHeight={1.65} />
                  )}
                </Box>
              </Box>
            ))}

            {/* Typing indicator */}
            {loading && (
              <Box sx={{ display: "flex", alignItems: "flex-end", gap: 1 }}>
                <Box sx={{
                  width: 28, height: 28, borderRadius: "8px",
                  background: "linear-gradient(135deg, #dc2626 0%, #991b1b 100%)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}>
                  <SmartToyIcon sx={{ fontSize: 14, color: "white" }} />
                </Box>
                <Box sx={{
                  px: 2, py: 1.3, borderRadius: "16px 16px 16px 4px",
                  bgcolor: isDark ? "#1a1a1a" : "#f5f5f5",
                  border: `1px solid ${isDark ? "#2a2a2a" : "#ebebeb"}`,
                  display: "flex", alignItems: "center", gap: 0.6,
                }}>
                  {[0, 1, 2].map(i => (
                    <Box key={i} sx={{
                      width: 7, height: 7, borderRadius: "50%",
                      bgcolor: "#dc2626", opacity: 0.7,
                      animation: `dotBounce 1.2s ease ${i * 0.2}s infinite`,
                    }} />
                  ))}
                </Box>
              </Box>
            )}

            <div ref={bottomRef} />
          </Box>

          {/* Input */}
          <Box sx={{
            px: 1.5, py: 1.5, flexShrink: 0,
            borderTop: `1px solid ${border}`,
            display: "flex", alignItems: "flex-end", gap: 1,
            bgcolor: isDark ? "#0f0f0f" : "#fafafa",
          }}>
            <TextField
              inputRef={inputRef} fullWidth size="small"
              placeholder={ui.placeholder}
              value={input} onChange={e => setInput(e.target.value)}
              onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
              multiline maxRows={4} disabled={loading}
              sx={{
                "& .MuiOutlinedInput-root": {
                  borderRadius: "12px", fontSize: "0.85rem",
                  bgcolor: isDark ? "#111111" : "#ffffff",
                  "& fieldset": { borderColor: isDark ? "#2a2a2a" : "#e5e5e5" },
                  "&:hover fieldset": { borderColor: "#dc2626" },
                  "&.Mui-focused fieldset": { borderColor: "#dc2626", borderWidth: "1.5px" },
                },
              }}
            />
            <IconButton onClick={() => sendMessage()} disabled={!input.trim() || loading}
              sx={{
                width: 38, height: 38, flexShrink: 0, borderRadius: "10px",
                background: input.trim() && !loading
                  ? "linear-gradient(135deg, #dc2626 0%, #991b1b 100%)"
                  : isDark ? "#1f1f1f" : "#ebebeb",
                color: input.trim() && !loading ? "white" : "text.disabled",
                "&:hover": {
                  background: input.trim() && !loading
                    ? "linear-gradient(135deg, #b91c1c 0%, #7f1d1d 100%)"
                    : undefined,
                },
                transition: "all 0.18s ease",
                boxShadow: input.trim() && !loading ? "0 2px 8px rgba(220,38,38,0.4)" : "none",
              }}>
              <SendIcon sx={{ fontSize: 17 }} />
            </IconButton>
          </Box>
        </Paper>
      )}
    </>
  );
}
