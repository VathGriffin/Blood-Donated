import React, { useEffect, useRef, useState } from "react";
import {
  Box, Typography, Paper, TextField, Button, Avatar,
  CircularProgress, useTheme, IconButton,
} from "@mui/material";
import SendIcon from "@mui/icons-material/Send";
import ChatIcon from "@mui/icons-material/Chat";
import LockIcon from "@mui/icons-material/Lock";
import { Link as RouterLink } from "react-router-dom";
import axios from "axios";
import { useUserAuth } from "../context/UserAuthContext";
import API_BASE from "../config";
import { formatDistanceToNow } from "date-fns";

const UserMessages = () => {
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";
  const { token, user, isAuth } = useUserAuth();
  const [messages, setMessages] = useState([]);
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const bottomRef = useRef(null);

  const headers = { Authorization: `Bearer ${token}` };

  const fetchMessages = async () => {
    try {
      const { data } = await axios.get(`${API_BASE}/api/messages/mine`, { headers });
      setMessages(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!isAuth) return;
    fetchMessages();
    const interval = setInterval(fetchMessages, 8000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuth]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async () => {
    if (!content.trim()) return;
    setSending(true);
    try {
      const { data } = await axios.post(`${API_BASE}/api/messages`, { content }, { headers });
      setMessages((prev) => [...prev, data]);
      setContent("");
    } catch (err) {
      console.error(err);
    } finally {
      setSending(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  if (!isAuth) {
    return (
      <Box
        sx={{
          minHeight: "70vh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          px: 2,
          textAlign: "center",
          backgroundColor: isDark ? "#121212" : "#f9f9f9",
        }}
      >
        <LockIcon sx={{ fontSize: 56, color: "#b71c1c", mb: 2 }} />
        <Typography variant="h5" fontWeight={700} gutterBottom>
          Please log in to message admin
        </Typography>
        <Typography variant="body2" color="text.secondary" mb={3}>
          You need an account to send messages.
        </Typography>
        <Box sx={{ display: "flex", gap: 2 }}>
          <Button variant="contained" color="error" component={RouterLink} to="/login" sx={{ borderRadius: 3 }}>
            Log In
          </Button>
          <Button variant="outlined" color="error" component={RouterLink} to="/signup" sx={{ borderRadius: 3 }}>
            Sign Up
          </Button>
        </Box>
      </Box>
    );
  }

  return (
    <Box sx={{ backgroundColor: isDark ? "#121212" : "#f9f9f9", minHeight: "100vh" }}>
      {/* Hero */}
      <Box
        sx={{
          background: isDark
            ? "linear-gradient(135deg, #1a0000 0%, #2d0505 100%)"
            : "linear-gradient(135deg, #b71c1c 0%, #7f0000 100%)",
          color: "white",
          pt: { xs: 7, md: 9 },
          pb: { xs: 5, md: 6 },
          textAlign: "center",
          px: 3,
        }}
      >
        <ChatIcon sx={{ fontSize: 48, mb: 1.5, opacity: 0.9 }} />
        <Typography variant="h4" fontWeight={800} gutterBottom>
          Message Admin
        </Typography>
        <Typography variant="body1" sx={{ opacity: 0.88 }}>
          Have a question? Chat directly with our team.
        </Typography>
      </Box>

      <Box sx={{ maxWidth: 700, mx: "auto", px: 2, py: 5 }}>
        <Paper
          elevation={4}
          sx={{ borderRadius: 4, overflow: "hidden", display: "flex", flexDirection: "column", height: 560 }}
        >
          {/* Chat header */}
          <Box
            sx={{
              px: 3,
              py: 2,
              borderBottom: `1px solid ${isDark ? "#2a2a2a" : "#f0f0f0"}`,
              display: "flex",
              alignItems: "center",
              gap: 1.5,
              backgroundColor: isDark ? "#1a1a1a" : "#fff",
            }}
          >
            <Avatar sx={{ bgcolor: "#b71c1c", width: 38, height: 38, fontSize: "0.85rem", fontWeight: 700 }}>
              AD
            </Avatar>
            <Box>
              <Typography fontWeight={700} fontSize="0.92rem">Blood Donated Support</Typography>
              <Typography variant="caption" color="text.secondary">Admin • Typically replies within a few hours</Typography>
            </Box>
          </Box>

          {/* Messages */}
          <Box
            sx={{
              flex: 1,
              overflowY: "auto",
              px: 3,
              py: 2,
              display: "flex",
              flexDirection: "column",
              gap: 1.5,
              backgroundColor: isDark ? "#121212" : "#f9f9f9",
            }}
          >
            {loading ? (
              <Box display="flex" justifyContent="center" alignItems="center" height="100%">
                <CircularProgress color="error" size={32} />
              </Box>
            ) : messages.length === 0 ? (
              <Box display="flex" flexDirection="column" alignItems="center" justifyContent="center" height="100%" gap={1}>
                <ChatIcon sx={{ fontSize: 44, color: "text.disabled" }} />
                <Typography color="text.secondary" fontSize="0.9rem">
                  No messages yet. Say hello!
                </Typography>
              </Box>
            ) : (
              messages.map((msg) => {
                const isUser = msg.sender === "user";
                return (
                  <Box
                    key={msg._id}
                    sx={{
                      display: "flex",
                      justifyContent: isUser ? "flex-end" : "flex-start",
                      alignItems: "flex-end",
                      gap: 1,
                    }}
                  >
                    {!isUser && (
                      <Avatar sx={{ bgcolor: "#b71c1c", width: 30, height: 30, fontSize: "0.7rem", fontWeight: 700, mb: 0.5 }}>
                        AD
                      </Avatar>
                    )}
                    <Box sx={{ maxWidth: "72%" }}>
                      <Box
                        sx={{
                          px: 2,
                          py: 1.2,
                          borderRadius: isUser ? "18px 18px 4px 18px" : "18px 18px 18px 4px",
                          backgroundColor: isUser
                            ? "#b71c1c"
                            : isDark ? "#1e1e1e" : "#fff",
                          color: isUser ? "#fff" : "text.primary",
                          boxShadow: 1,
                        }}
                      >
                        <Typography variant="body2" sx={{ lineHeight: 1.6, whiteSpace: "pre-wrap" }}>
                          {msg.content}
                        </Typography>
                      </Box>
                      <Typography variant="caption" color="text.disabled" sx={{ px: 1, display: "block", mt: 0.3, textAlign: isUser ? "right" : "left" }}>
                        {formatDistanceToNow(new Date(msg.createdAt), { addSuffix: true })}
                      </Typography>
                    </Box>
                    {isUser && (
                      <Avatar sx={{ bgcolor: "#424242", width: 30, height: 30, fontSize: "0.7rem", fontWeight: 700, mb: 0.5 }}>
                        {user?.fullName?.charAt(0)?.toUpperCase()}
                      </Avatar>
                    )}
                  </Box>
                );
              })
            )}
            <div ref={bottomRef} />
          </Box>

          {/* Input */}
          <Box
            sx={{
              px: 3,
              py: 2,
              borderTop: `1px solid ${isDark ? "#2a2a2a" : "#f0f0f0"}`,
              display: "flex",
              gap: 1.5,
              backgroundColor: isDark ? "#1a1a1a" : "#fff",
              alignItems: "flex-end",
            }}
          >
            <TextField
              fullWidth
              multiline
              maxRows={4}
              placeholder="Type a message… (Enter to send)"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              onKeyDown={handleKeyDown}
              variant="outlined"
              size="small"
              sx={{ "& .MuiOutlinedInput-root": { borderRadius: 3 } }}
            />
            <IconButton
              onClick={handleSend}
              disabled={sending || !content.trim()}
              sx={{
                bgcolor: "#b71c1c",
                color: "white",
                width: 44,
                height: 44,
                borderRadius: 2.5,
                flexShrink: 0,
                "&:hover": { bgcolor: "#9a1515" },
                "&.Mui-disabled": { bgcolor: isDark ? "#2a2a2a" : "#e0e0e0", color: "text.disabled" },
              }}
            >
              <SendIcon fontSize="small" />
            </IconButton>
          </Box>
        </Paper>
      </Box>
    </Box>
  );
};

export default UserMessages;
