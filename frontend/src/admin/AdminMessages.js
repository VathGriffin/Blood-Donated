import React, { useEffect, useRef, useState } from "react";
import {
    Box, Typography, Paper, TextField, Avatar,
    IconButton, CircularProgress, List, ListItemButton,
    ListItemAvatar, ListItemText, Divider, Badge, useTheme,
} from "@mui/material";
import SendIcon from "@mui/icons-material/Send";
import ChatIcon from "@mui/icons-material/Chat";
import { useAuth } from "../context/AuthContext";
import axios from "axios";
import API_BASE from "../config";
import { formatDistanceToNow } from "date-fns";

const AdminMessages = () => {
    const theme = useTheme();
    const isDark = theme.palette.mode === "dark";
    const { token } = useAuth();
    const headers = { Authorization: `Bearer ${token}` };

    const [conversations, setConversations] = useState([]);
    const [selected, setSelected] = useState(null);
    const [messages, setMessages] = useState([]);
    const [reply, setReply] = useState("");
    const [sending, setSending] = useState(false);
    const [loadingConvos, setLoadingConvos] = useState(true);
    const [loadingMsgs, setLoadingMsgs] = useState(false);
    const bottomRef = useRef(null);

    const fetchConversations = async () => {
        try {
            const { data } = await axios.get(`${API_BASE}/api/messages/conversations`, { headers });
            setConversations(data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoadingConvos(false);
        }
    };

    const fetchMessages = async (userId) => {
        setLoadingMsgs(true);
        try {
            const { data } = await axios.get(`${API_BASE}/api/messages/conversation/${userId}`, { headers });
            setMessages(data);
            // Refresh conversations to clear unread count
            fetchConversations();
        } catch (err) {
            console.error(err);
        } finally {
            setLoadingMsgs(false);
        }
    };

    useEffect(() => {
        fetchConversations();
        const interval = setInterval(fetchConversations, 10000);
        return () => clearInterval(interval);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
        if (!selected) return;
        const interval = setInterval(() => fetchMessages(selected._id), 8000);
        return () => clearInterval(interval);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selected]);

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    const handleSelect = (convo) => {
        setSelected(convo);
        fetchMessages(convo._id);
    };

    const handleSend = async () => {
        if (!reply.trim() || !selected) return;
        setSending(true);
        try {
            const { data } = await axios.post(
                `${API_BASE}/api/messages/reply/${selected._id}`,
                { content: reply, userName: selected.userName, userEmail: selected.userEmail },
                { headers }
            );
            setMessages((prev) => [...prev, data]);
            setReply("");
            fetchConversations();
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

    const cardBg = isDark ? "#1a1a1a" : "#fff";
    const cardBorder = isDark ? "#2a2a2a" : "#f0f0f0";

    return (
        <Box>
            {/* Header */}
            <Box display="flex" alignItems="center" gap={1.5} mb={3}>
                <Avatar sx={{ bgcolor: "#b71c1c", width: 52, height: 52 }}>
                    <ChatIcon sx={{ fontSize: 26 }} />
                </Avatar>
                <Box>
                    <Typography
                        variant="h5" fontWeight={800}
                        sx={{
                            background: "linear-gradient(to right, #b71c1c, #d32f2f)",
                            WebkitBackgroundClip: "text",
                            WebkitTextFillColor: "transparent",
                            lineHeight: 1.2,
                        }}
                    >
                        User Messages
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                        {conversations.length} conversation{conversations.length !== 1 ? "s" : ""}
                    </Typography>
                </Box>
            </Box>

            <Paper
                elevation={0}
                sx={{
                    borderRadius: 3,
                    border: `1px solid ${cardBorder}`,
                    bgcolor: cardBg,
                    display: "flex",
                    height: 580,
                    overflow: "hidden",
                }}
            >
                {/* Conversation list */}
                <Box
                    sx={{
                        width: 280,
                        flexShrink: 0,
                        borderRight: `1px solid ${cardBorder}`,
                        overflowY: "auto",
                    }}
                >
                    <Box sx={{ px: 2, py: 1.5, borderBottom: `1px solid ${cardBorder}` }}>
                        <Typography variant="subtitle2" fontWeight={700} color="text.secondary">
                            CONVERSATIONS
                        </Typography>
                    </Box>

                    {loadingConvos ? (
                        <Box display="flex" justifyContent="center" pt={4}>
                            <CircularProgress color="error" size={28} />
                        </Box>
                    ) : conversations.length === 0 ? (
                        <Box textAlign="center" pt={6} px={2}>
                            <ChatIcon sx={{ fontSize: 36, color: "text.disabled", mb: 1 }} />
                            <Typography color="text.secondary" fontSize="0.85rem">
                                No messages yet.
                            </Typography>
                        </Box>
                    ) : (
                        <List disablePadding>
                            {conversations.map((convo, idx) => (
                                <React.Fragment key={convo._id}>
                                    <ListItemButton
                                        selected={selected?._id === convo._id}
                                        onClick={() => handleSelect(convo)}
                                        sx={{
                                            py: 1.5,
                                            px: 2,
                                            "&.Mui-selected": {
                                                bgcolor: isDark ? "rgba(183,28,28,0.18)" : "rgba(183,28,28,0.07)",
                                                borderRight: "3px solid #b71c1c",
                                            },
                                        }}
                                    >
                                        <ListItemAvatar>
                                            <Badge
                                                badgeContent={convo.unread}
                                                color="error"
                                                invisible={!convo.unread}
                                            >
                                                <Avatar sx={{ bgcolor: "#b71c1c", width: 38, height: 38, fontSize: "0.85rem", fontWeight: 700 }}>
                                                    {convo.userName?.charAt(0)?.toUpperCase()}
                                                </Avatar>
                                            </Badge>
                                        </ListItemAvatar>
                                        <ListItemText
                                            primary={
                                                <Typography fontWeight={convo.unread ? 700 : 500} fontSize="0.87rem" noWrap>
                                                    {convo.userName}
                                                </Typography>
                                            }
                                            secondary={
                                                <Typography
                                                    fontSize="0.75rem"
                                                    color="text.secondary"
                                                    noWrap
                                                    fontWeight={convo.unread ? 600 : 400}
                                                >
                                                    {convo.lastSender === "admin" ? "You: " : ""}{convo.lastMessage}
                                                </Typography>
                                            }
                                        />
                                    </ListItemButton>
                                    {idx < conversations.length - 1 && <Divider />}
                                </React.Fragment>
                            ))}
                        </List>
                    )}
                </Box>

                {/* Chat area */}
                <Box sx={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
                    {!selected ? (
                        <Box display="flex" flexDirection="column" alignItems="center" justifyContent="center" height="100%" gap={1}>
                            <ChatIcon sx={{ fontSize: 52, color: "text.disabled" }} />
                            <Typography color="text.secondary">Select a conversation to start replying</Typography>
                        </Box>
                    ) : (
                        <>
                            {/* Chat header */}
                            <Box sx={{ px: 3, py: 1.8, borderBottom: `1px solid ${cardBorder}`, display: "flex", alignItems: "center", gap: 1.5 }}>
                                <Avatar sx={{ bgcolor: "#b71c1c", width: 36, height: 36, fontSize: "0.82rem", fontWeight: 700 }}>
                                    {selected.userName?.charAt(0)?.toUpperCase()}
                                </Avatar>
                                <Box>
                                    <Typography fontWeight={700} fontSize="0.9rem">{selected.userName}</Typography>
                                    <Typography variant="caption" color="text.secondary">{selected.userEmail}</Typography>
                                </Box>
                            </Box>

                            {/* Messages */}
                            <Box sx={{ flex: 1, overflowY: "auto", px: 3, py: 2, display: "flex", flexDirection: "column", gap: 1.5 }}>
                                {loadingMsgs ? (
                                    <Box display="flex" justifyContent="center" alignItems="center" height="100%">
                                        <CircularProgress color="error" size={28} />
                                    </Box>
                                ) : (
                                    messages.map((msg) => {
                                        const isAdmin = msg.sender === "admin";
                                        return (
                                            <Box
                                                key={msg._id}
                                                sx={{ display: "flex", justifyContent: isAdmin ? "flex-end" : "flex-start", alignItems: "flex-end", gap: 1 }}
                                            >
                                                {!isAdmin && (
                                                    <Avatar sx={{ bgcolor: "#b71c1c", width: 28, height: 28, fontSize: "0.65rem", fontWeight: 700, mb: 0.5 }}>
                                                        {selected.userName?.charAt(0)?.toUpperCase()}
                                                    </Avatar>
                                                )}
                                                <Box sx={{ maxWidth: "70%" }}>
                                                    <Box
                                                        sx={{
                                                            px: 2, py: 1.2,
                                                            borderRadius: isAdmin ? "18px 18px 4px 18px" : "18px 18px 18px 4px",
                                                            backgroundColor: isAdmin
                                                                ? "#b71c1c"
                                                                : isDark ? "#2a2a2a" : "#f0f0f0",
                                                            color: isAdmin ? "#fff" : "text.primary",
                                                        }}
                                                    >
                                                        <Typography variant="body2" sx={{ lineHeight: 1.6, whiteSpace: "pre-wrap" }}>
                                                            {msg.content}
                                                        </Typography>
                                                    </Box>
                                                    <Typography variant="caption" color="text.disabled" sx={{ px: 1, display: "block", mt: 0.3, textAlign: isAdmin ? "right" : "left" }}>
                                                        {formatDistanceToNow(new Date(msg.createdAt), { addSuffix: true })}
                                                    </Typography>
                                                </Box>
                                                {isAdmin && (
                                                    <Avatar sx={{ bgcolor: "#424242", width: 28, height: 28, fontSize: "0.65rem", fontWeight: 700, mb: 0.5 }}>
                                                        AD
                                                    </Avatar>
                                                )}
                                            </Box>
                                        );
                                    })
                                )}
                                <div ref={bottomRef} />
                            </Box>

                            {/* Reply input */}
                            <Box sx={{ px: 3, py: 2, borderTop: `1px solid ${cardBorder}`, display: "flex", gap: 1.5, alignItems: "flex-end" }}>
                                <TextField
                                    fullWidth multiline maxRows={4}
                                    placeholder="Type a reply… (Enter to send)"
                                    value={reply}
                                    onChange={(e) => setReply(e.target.value)}
                                    onKeyDown={handleKeyDown}
                                    size="small"
                                    sx={{ "& .MuiOutlinedInput-root": { borderRadius: 3 } }}
                                />
                                <IconButton
                                    onClick={handleSend}
                                    disabled={sending || !reply.trim()}
                                    sx={{
                                        bgcolor: "#b71c1c", color: "white",
                                        width: 42, height: 42, borderRadius: 2.5, flexShrink: 0,
                                        "&:hover": { bgcolor: "#9a1515" },
                                        "&.Mui-disabled": { bgcolor: isDark ? "#2a2a2a" : "#e0e0e0", color: "text.disabled" },
                                    }}
                                >
                                    <SendIcon fontSize="small" />
                                </IconButton>
                            </Box>
                        </>
                    )}
                </Box>
            </Paper>
        </Box>
    );
};

export default AdminMessages;
