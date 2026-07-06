'use client';
import React, { useState, useRef, useEffect } from "react";
import {
  Box, Paper, Typography, TextField, IconButton, Avatar,
  Fade, Chip, CircularProgress, useTheme, Tooltip,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import SendIcon from "@mui/icons-material/Send";
import SmartToyIcon from "@mui/icons-material/SmartToy";
import FavoriteIcon from "@mui/icons-material/Favorite";
import AutoAwesomeIcon from "@mui/icons-material/AutoAwesome";
import API_BASE from "@/lib/config";

// ── Fallback rule-based engine (used when API key is not configured) ──────────
const KB = [
  { tags: ["hello","hi","hey","good morning","good afternoon","howdy","greetings"], answer: "Hello! 👋 I'm BloodBot, your blood donation assistant. I can help you with eligibility, blood types, donor registration, appointments, and more. What would you like to know?" },
  { tags: ["thank","thanks","thank you","thx","appreciate"], answer: "You're welcome! 🩸 Is there anything else I can help you with?" },
  { tags: ["bye","goodbye","see you","later"], answer: "Goodbye! Remember — one donation can save up to 3 lives. See you soon! 🩸" },
  { tags: ["eligible","eligibility","qualify","can i donate","who can donate","requirements","criteria"], answer: "To be eligible to donate blood:\n\n• Age 18–60 years\n• Weight at least 45 kg\n• In good general health\n• No active infection or fever\n• No donation in the past 3 months\n• Not pregnant or breastfeeding\n• No history of HIV, hepatitis B/C\n\nOur staff will do a health screening before your donation." },
  { tags: ["blood type","blood group","a+","a-","b+","b-","ab+","ab-","o+","o-","compatible","compatibility"], answer: "There are 8 blood types: A+, A-, B+, B-, AB+, AB-, O+, O-\n\n• O- is the universal donor (anyone can receive it)\n• AB+ is the universal recipient (can receive any type)\n• O+ is the most common (~38%)\n• AB- is the rarest (~1%)" },
  { tags: ["universal donor","o negative","o-"], answer: "O- (O Negative) is the universal donor. People with O- blood can donate red blood cells to anyone regardless of blood type — making O- donations extremely valuable in emergencies." },
  { tags: ["how often","frequency","how many times","interval","3 month"], answer: "You can donate whole blood once every 3 months (12 weeks). This gives your body enough time to fully replenish the donated blood. Plasma can be donated more frequently — every 2 weeks." },
  { tags: ["register","sign up","become donor","how to donate","start"], answer: "To register as a donor:\n\n1. Click \"Donate Blood\" in the navigation\n2. Fill in your details (name, email, phone)\n3. Select your blood type\n4. Confirm eligibility criteria\n5. Submit your registration\n\nYou can also upload a profile photo!" },
  { tags: ["request blood","need blood","how to request","find blood"], answer: "To request blood:\n\n1. Click \"Request Blood\" in the navigation\n2. Enter patient details and hospital name\n3. Select the required blood type\n4. Choose urgency level (Normal / Urgent / Critical)\n5. Submit — our team responds based on urgency" },
  { tags: ["appointment","book","schedule"], answer: "To book a donation appointment:\n\n1. Click \"Book Appointment\"\n2. Enter your name and contact details\n3. Select preferred date, time, and hospital\n4. Confirm your booking\n\nWe have 6 partner hospitals across Cambodia!" },
  { tags: ["before donate","prepare","preparation","eat before","drink before"], answer: "How to prepare:\n\n• Eat a healthy meal 2–3 hours before\n• Drink at least 500ml extra water\n• Get a full night's sleep\n• Avoid alcohol 24 hours before\n• Bring a valid ID" },
  { tags: ["after donate","after donation","recovery","rest after"], answer: "After donation:\n\n• Rest 10–15 minutes at the center\n• Drink extra fluids for 24 hours\n• Eat the snack provided\n• Avoid heavy exercise for 24 hours\n• Keep the bandage on for 4+ hours\n\nYour body replenishes plasma within 24 hours!" },
  { tags: ["safe","side effect","danger","risk","hurt","pain"], answer: "Blood donation is very safe!\n\n• Small pinch from the needle\n• Most people feel completely fine\n• Mild dizziness is uncommon\n• Serious complications are extremely rare\n\nOur trained staff monitor you throughout." },
  { tags: ["benefit","why donate","reason","good for"], answer: "Why donate blood? 🩸\n\n• One donation saves up to 3 lives\n• Free mini health screening included\n• Reduces risk of heart disease\n• Burns ~650 calories\n• Sense of purpose and community impact" },
  { tags: ["how long","duration","process","how much time"], answer: "The full process takes about 30–45 minutes:\n\n1. Registration & check-in — 5 min\n2. Health screening — 10 min\n3. Actual donation — 8–10 min\n4. Rest & refreshments — 15 min\n\nReturn visits are faster (~20–30 min)." },
  { tags: ["hospital","where","location","center","phnom penh","cambodia","partner"], answer: "Our 6 partner hospitals:\n\n• Calmette Hospital, Phnom Penh\n• Royal Phnom Penh Hospital\n• Khmer Soviet Friendship Hospital\n• National Blood Transfusion Center\n• Angkor Hospital for Children, Siem Reap\n• Battambang Provincial Hospital" },
  { tags: ["urgent","emergency","critical","immediately","now","asap"], answer: "For an emergency blood request:\n\n🚨 Go to \"Request Blood\" and select \"Critical\" urgency — our team prioritizes these immediately.\n\nFor immediate help: call +855 12 345 678\n\nIf this is a life emergency, contact 119 (Cambodia emergency services) first." },
  { tags: ["contact","email","phone","support"], answer: "Contact us:\n\n📧 Vath.V211006@sis.hust.edu.vn\n📞 +855 12 345 678\n📍 ITC, Phnom Penh\n🕐 Mon–Fri, 8:00 AM – 5:00 PM\n\nOr send a direct message via the Contact page." },
  { tags: ["about","platform","itc","cambodia","team","project","student"], answer: "Blood Donated is a graduation project by 4th-year Data Science students at ITC (Institute of Technology of Cambodia).\n\nOur platform connects donors with patients and hospitals across Cambodia — making blood donation faster, easier, and life-saving." },
  { tags: ["pregnant","breastfeed","nursing","mother"], answer: "Pregnant and breastfeeding women should not donate. After giving birth, wait at least 6 months. After stopping breastfeeding, wait at least 3 months before donating." },
  { tags: ["medication","medicine","drug","taking","prescription"], answer: "It depends on the medication:\n\n✅ Usually OK: vitamins, birth control pills, thyroid/blood pressure medication\n❌ Usually not OK: blood thinners, antibiotics (wait 2 weeks after finishing)\n\nAlways disclose all medications during your health screening." },
  { tags: ["tattoo","piercing"], answer: "Wait at least 12 months after getting a tattoo or piercing before donating. This ensures there is no infection risk." },
];

const FALLBACK = "I'm not sure about that, but I'm here to help with blood donation topics! Ask me about eligibility, blood types, donor registration, appointments, or anything else related to blood donation. 🩸";

function ruleBasedResponse(input) {
  const lower = input.toLowerCase();
  for (const entry of KB) {
    if (entry.tags.some((tag) => lower.includes(tag))) return entry.answer;
  }
  return FALLBACK;
}

// ── Component ─────────────────────────────────────────────────────────────────
const GREETING = "Hi! I'm BloodBot 🩸 Your AI-powered blood donation assistant.\n\nI can help you with eligibility, blood types, donor registration, appointments, finding hospitals, and more. What would you like to know?";

const QUICK_PROMPTS = [
  "Am I eligible to donate?",
  "Blood type compatibility?",
  "How do I register as a donor?",
  "How to request blood urgently?",
];

export default function ChatBot() {
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([{ role: "assistant", content: GREETING }]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [poweredByClaude, setPoweredByClaude] = useState(null); // null=unknown, true=claude, false=fallback
  const bottomRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 150);
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

      // API key not configured — silently use rule-based
      if (!res.ok && data.configured === false) {
        setPoweredByClaude(false);
        const reply = ruleBasedResponse(content);
        setTimeout(() => {
          setMessages((prev) => [...prev, { role: "assistant", content: reply }]);
          setLoading(false);
        }, 500 + Math.random() * 400);
        return;
      }

      if (!res.ok) throw new Error(data.error || "Unknown error");

      setPoweredByClaude(true);
      setMessages((prev) => [...prev, { role: "assistant", content: data.content }]);
    } catch {
      // Network error or other failure — fall back silently
      setPoweredByClaude(false);
      const reply = ruleBasedResponse(content);
      setMessages((prev) => [...prev, { role: "assistant", content: reply }]);
    } finally {
      setLoading(false);
    }
  };

  const handleKey = (e) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); }
  };

  return (
    <>
      {/* ── Floating Button ─────────────────────────────────────────────── */}
      <Box onClick={() => setOpen((v) => !v)} sx={{
        position: "fixed", bottom: 28, right: 28, zIndex: 1300,
        width: 58, height: 58, borderRadius: "50%",
        background: "linear-gradient(135deg, #b71c1c 0%, #d32f2f 100%)",
        display: "flex", alignItems: "center", justifyContent: "center",
        cursor: "pointer",
        boxShadow: "0 6px 24px rgba(183,28,28,0.55)",
        transition: "transform 0.2s ease, box-shadow 0.2s ease",
        "&:hover": { transform: "scale(1.10)", boxShadow: "0 10px 32px rgba(183,28,28,0.7)" },
      }}>
        {open
          ? <CloseIcon sx={{ color: "white", fontSize: 26 }} />
          : <SmartToyIcon sx={{ color: "white", fontSize: 28 }} />}
      </Box>

      {/* ── Chat Panel ──────────────────────────────────────────────────── */}
      <Fade in={open}>
        <Paper elevation={0} sx={{
          position: "fixed", bottom: 100, right: 28, zIndex: 1299,
          width: { xs: "calc(100vw - 32px)", sm: 390 },
          maxWidth: 420, height: 540,
          borderRadius: 4,
          display: "flex", flexDirection: "column", overflow: "hidden",
          border: `1px solid ${isDark ? "#2a2a2a" : "#e0e0e0"}`,
          boxShadow: "0 16px 64px rgba(0,0,0,0.22)",
          backgroundColor: isDark ? "#1a1a1a" : "#fff",
        }}>

          {/* Header */}
          <Box sx={{
            px: 2.5, py: 1.8,
            background: "linear-gradient(135deg, #7f0000 0%, #b71c1c 100%)",
            display: "flex", alignItems: "center", gap: 1.5, flexShrink: 0,
          }}>
            <Avatar sx={{ width: 38, height: 38, background: "rgba(255,255,255,0.18)", border: "2px solid rgba(255,255,255,0.35)" }}>
              <FavoriteIcon sx={{ color: "white", fontSize: 20 }} />
            </Avatar>
            <Box sx={{ flex: 1 }}>
              <Box sx={{ display: "flex", alignItems: "center", gap: 0.8 }}>
                <Typography variant="subtitle1" fontWeight={800} color="white" sx={{ lineHeight: 1.2 }}>BloodBot</Typography>
                {poweredByClaude === true && (
                  <Tooltip title="Powered by Claude AI">
                    <AutoAwesomeIcon sx={{ fontSize: 14, color: "#ffcdd2" }} />
                  </Tooltip>
                )}
              </Box>
              <Typography variant="caption" sx={{ color: "rgba(255,255,255,0.72)", lineHeight: 1 }}>
                {poweredByClaude === true ? "Powered by Claude AI" : "Blood Donation Assistant"}
              </Typography>
            </Box>
            <IconButton size="small" onClick={() => setOpen(false)} sx={{ color: "rgba(255,255,255,0.8)", "&:hover": { color: "white" } }}>
              <CloseIcon fontSize="small" />
            </IconButton>
          </Box>

          {/* Messages */}
          <Box sx={{ flex: 1, overflowY: "auto", px: 2, py: 2, display: "flex", flexDirection: "column", gap: 1.5 }}>
            {messages.map((msg, i) => (
              <Box key={i} sx={{ display: "flex", justifyContent: msg.role === "user" ? "flex-end" : "flex-start" }}>
                {msg.role === "assistant" && (
                  <Avatar sx={{ width: 28, height: 28, mr: 1, flexShrink: 0, mt: 0.3, background: "linear-gradient(135deg, #b71c1c 0%, #d32f2f 100%)" }}>
                    <FavoriteIcon sx={{ fontSize: 14, color: "white" }} />
                  </Avatar>
                )}
                <Box sx={{
                  maxWidth: "80%", px: 2, py: 1.2,
                  borderRadius: msg.role === "user" ? "18px 18px 4px 18px" : "18px 18px 18px 4px",
                  backgroundColor: msg.role === "user" ? "#b71c1c" : isDark ? "#2a2a2a" : "#f5f5f5",
                  color: msg.role === "user" ? "white" : "text.primary",
                  boxShadow: msg.role === "user" ? "0 2px 8px rgba(183,28,28,0.3)" : "0 1px 4px rgba(0,0,0,0.08)",
                }}>
                  <Typography variant="body2" sx={{ lineHeight: 1.65, whiteSpace: "pre-wrap", wordBreak: "break-word" }}>
                    {msg.content}
                  </Typography>
                </Box>
              </Box>
            ))}

            {/* Typing indicator */}
            {loading && (
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <Avatar sx={{ width: 28, height: 28, background: "linear-gradient(135deg, #b71c1c 0%, #d32f2f 100%)" }}>
                  <FavoriteIcon sx={{ fontSize: 14, color: "white" }} />
                </Avatar>
                <Box sx={{ px: 2, py: 1.2, borderRadius: "18px 18px 18px 4px", backgroundColor: isDark ? "#2a2a2a" : "#f5f5f5", display: "flex", alignItems: "center", gap: 1 }}>
                  <CircularProgress size={13} sx={{ color: "#b71c1c" }} />
                  <Typography variant="caption" color="text.secondary">BloodBot is thinking…</Typography>
                </Box>
              </Box>
            )}
            <div ref={bottomRef} />
          </Box>

          {/* Quick prompts */}
          {messages.length === 1 && (
            <Box sx={{ px: 2, pb: 1.5, display: "flex", flexWrap: "wrap", gap: 0.8 }}>
              {QUICK_PROMPTS.map((p) => (
                <Chip key={p} label={p} size="small" clickable onClick={() => sendMessage(p)}
                  variant="outlined"
                  sx={{
                    fontSize: "0.73rem", fontWeight: 600,
                    borderColor: "#b71c1c", color: "#b71c1c",
                    "&:hover": { backgroundColor: "#b71c1c", color: "white" },
                    transition: "all 0.2s",
                  }}
                />
              ))}
            </Box>
          )}

          {/* Input */}
          <Box sx={{
            px: 1.5, py: 1.5, flexShrink: 0,
            borderTop: `1px solid ${isDark ? "#2a2a2a" : "#efefef"}`,
            display: "flex", alignItems: "flex-end", gap: 1,
          }}>
            <TextField
              inputRef={inputRef} fullWidth
              placeholder="Ask me anything about blood donation…"
              value={input} onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKey} multiline maxRows={4} size="small"
              disabled={loading}
              sx={{ "& .MuiOutlinedInput-root": { borderRadius: 3, fontSize: "0.875rem" } }}
            />
            <IconButton onClick={() => sendMessage()} disabled={!input.trim() || loading}
              sx={{
                width: 40, height: 40, flexShrink: 0, borderRadius: 2.5,
                background: input.trim() && !loading ? "linear-gradient(135deg, #b71c1c 0%, #d32f2f 100%)" : isDark ? "#2a2a2a" : "#e0e0e0",
                color: input.trim() && !loading ? "white" : "text.disabled",
                "&:hover": { background: input.trim() && !loading ? "linear-gradient(135deg, #7f0000 0%, #b71c1c 100%)" : undefined },
                transition: "all 0.2s",
              }}>
              <SendIcon sx={{ fontSize: 18 }} />
            </IconButton>
          </Box>
        </Paper>
      </Fade>
    </>
  );
}
