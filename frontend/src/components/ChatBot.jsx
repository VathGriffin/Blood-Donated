'use client';
import React, { useState, useRef, useEffect } from "react";
import {
  Box, Paper, Typography, TextField, IconButton,
  CircularProgress, useTheme, Chip,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import SendIcon from "@mui/icons-material/Send";
import SmartToyIcon from "@mui/icons-material/SmartToy";
import FavoriteIcon from "@mui/icons-material/Favorite";
import API_BASE from "@/lib/config";

const KB = [
  { tags: ["hello","hi","hey","greetings"], answer: "Hello! I'm your blood donation assistant. How can I help you today?" },
  { tags: ["thank","thanks","thank you"], answer: "You're welcome! Is there anything else I can help you with?" },
  { tags: ["bye","goodbye"], answer: "Goodbye! Remember — one donation can save up to 3 lives." },
  { tags: ["eligible","eligibility","qualify","can i donate","requirements"], answer: "To donate blood you need to be:\n• Age 18–60\n• Weight at least 45 kg\n• In good health with no active infection\n• No donation in the past 3 months\n• Not pregnant or breastfeeding" },
  { tags: ["blood type","blood group","compatible","compatibility"], answer: "There are 8 blood types: A+, A−, B+, B−, AB+, AB−, O+, O−\n\n• O− is the universal donor\n• AB+ is the universal recipient\n• O+ is the most common (~38%)" },
  { tags: ["cold","sick","fever","flu"], answer: "If you have a mild cold without fever, you may be able to donate. However if you have a fever or sore throat, wait until you're fully recovered — at least 7 days symptom-free." },
  { tags: ["how often","frequency","how many times","interval"], answer: "You can donate whole blood once every 3 months (12 weeks). Plasma can be donated every 2 weeks." },
  { tags: ["register","sign up","become donor","how to donate"], answer: "To register:\n1. Click \"Donate Blood\" in the nav\n2. Fill in your details and blood type\n3. Confirm eligibility\n4. Submit your registration" },
  { tags: ["request blood","need blood","how to request"], answer: "To request blood:\n1. Click \"Request Blood\"\n2. Enter patient and hospital details\n3. Select blood type and urgency\n4. Submit — our team responds by urgency level" },
  { tags: ["appointment","book","schedule"], answer: "To book an appointment:\n1. Click \"Book Appointment\"\n2. Select a donation center\n3. Choose date and time\n4. Fill in your details and confirm" },
  { tags: ["prepare","preparation","before","eat before"], answer: "How to prepare:\n• Eat a healthy meal 2–3 hours before\n• Drink at least 500ml extra water\n• Get a full night's sleep\n• Avoid alcohol 24 hours before\n• Bring a valid ID" },
  { tags: ["after","recovery","rest after"], answer: "After donating:\n• Rest 10–15 minutes at the center\n• Drink extra fluids for 24 hours\n• Avoid heavy exercise for 24 hours\n• Keep the bandage on for 4+ hours" },
  { tags: ["safe","side effect","danger","risk","pain"], answer: "Blood donation is very safe! You may feel a small pinch. Mild dizziness is uncommon and serious complications are extremely rare." },
  { tags: ["how long","duration","process","time"], answer: "The full process takes 30–45 minutes:\n1. Registration — 5 min\n2. Health screening — 10 min\n3. Donation — 8–10 min\n4. Rest — 15 min" },
  { tags: ["hospital","location","center","where"], answer: "Partner hospitals:\n• Calmette Hospital, Phnom Penh\n• Royal Phnom Penh Hospital\n• Khmer Soviet Friendship Hospital\n• National Blood Transfusion Center\n• Angkor Hospital for Children\n• Battambang Provincial Hospital" },
  { tags: ["tattoo","piercing"], answer: "Wait at least 12 months after a tattoo or piercing before donating." },
  { tags: ["medication","medicine","drug"], answer: "It depends on the medication. Always disclose all medications during your health screening. Blood thinners and some antibiotics may require a waiting period." },
];

const FALLBACK = "I'm not sure about that. Ask me about eligibility, blood types, registration, appointments, or anything related to blood donation!";

const QUICK_PROMPTS = [
  "Am I eligible to donate?",
  "How long does donation take?",
  "Can I donate with a cold?",
  "How often can I donate?",
  "What to do after donating?",
];

function ruleBasedResponse(input) {
  const lower = input.toLowerCase();
  for (const entry of KB) {
    if (entry.tags.some(tag => lower.includes(tag))) return entry.answer;
  }
  return FALLBACK;
}

export default function ChatBot() {
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [visible, setVisible] = useState(false);
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

    const userMsg = { role: "user", content };
    const history = [...messages, userMsg];
    setMessages(history);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch(`${API_BASE}/api/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: history }),
      });
      const data = await res.json();
      if (!res.ok && data.configured === false) {
        const reply = ruleBasedResponse(content);
        setTimeout(() => { setMessages(prev => [...prev, { role: "assistant", content: reply }]); setLoading(false); }, 480);
        return;
      }
      if (!res.ok) throw new Error();
      setMessages(prev => [...prev, { role: "assistant", content: data.content }]);
    } catch {
      const reply = ruleBasedResponse(content);
      setMessages(prev => [...prev, { role: "assistant", content: reply }]);
    } finally {
      setLoading(false);
    }
  };

  const border = isDark ? "#1f1f1f" : "#e5e5e5";
  const panelBg = isDark ? "#111111" : "#ffffff";

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
      <Box onClick={() => setOpen(v => !v)} sx={{
        position: "fixed", bottom: 28, right: 28, zIndex: 1300,
        width: 56, height: 56, borderRadius: "50%",
        background: "linear-gradient(135deg, #dc2626 0%, #991b1b 100%)",
        display: "flex", alignItems: "center", justifyContent: "center",
        cursor: "pointer",
        boxShadow: "0 4px 20px rgba(220,38,38,0.5), 0 2px 8px rgba(220,38,38,0.3)",
        transition: "all 0.22s ease",
        "&:hover": {
          transform: "scale(1.08)",
          boxShadow: "0 8px 32px rgba(220,38,38,0.6), 0 4px 12px rgba(220,38,38,0.4)",
        },
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
                  <Box sx={{ width: 5, height: 5, borderRadius: "50%", bgcolor: "#4ade80",
                    animation: "pulse 2s ease infinite",
                    "@keyframes pulse": { "0%,100%": { opacity: 1 }, "50%": { opacity: 0.4 } },
                  }} />
                  <Typography sx={{ fontSize: "0.65rem", color: "rgba(255,255,255,0.85)", fontWeight: 600 }}>Online</Typography>
                </Box>
              </Box>
              <Typography variant="caption" sx={{ color: "rgba(255,255,255,0.65)" }}>BloodLife Assistant</Typography>
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
                  How can I help you?
                </Typography>
                <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 2.5 }}>
                  Ask me anything about blood donation.
                </Typography>
                <Box sx={{ display: "flex", flexDirection: "column", gap: 0.8 }}>
                  {QUICK_PROMPTS.map(p => (
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
                  bgcolor: msg.role === "user"
                    ? "linear-gradient(135deg, #dc2626 0%, #b91c1c 100%)"
                    : isDark ? "#1a1a1a" : "#f5f5f5",
                  background: msg.role === "user"
                    ? "linear-gradient(135deg, #dc2626 0%, #b91c1c 100%)"
                    : isDark ? "#1a1a1a" : "#f5f5f5",
                  border: msg.role === "user" ? "none" : `1px solid ${isDark ? "#2a2a2a" : "#ebebeb"}`,
                  color: msg.role === "user" ? "white" : isDark ? "rgba(245,245,245,0.9)" : "#222222",
                  boxShadow: msg.role === "user" ? "0 2px 8px rgba(220,38,38,0.3)" : "none",
                }}>
                  <Typography variant="body2" sx={{ fontSize: "0.83rem", lineHeight: 1.65, whiteSpace: "pre-wrap", wordBreak: "break-word" }}>
                    {msg.content}
                  </Typography>
                </Box>
              </Box>
            ))}

            {/* Typing indicator — 3 bouncing dots */}
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
              placeholder="Type a message..."
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
