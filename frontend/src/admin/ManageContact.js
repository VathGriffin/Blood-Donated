import React, { useEffect, useRef, useState } from "react";
import {
    Typography, Paper, Table, TableBody, TableCell,
    TableContainer, TableHead, TableRow, IconButton,
    Dialog, DialogTitle, DialogContent, TextField,
    DialogActions, Button, Box, Snackbar, Alert,
    useTheme, Avatar, Tooltip, InputAdornment,
    Tabs, Tab, Badge, List, ListItemButton,
    ListItemAvatar, ListItemText, Divider,
    CircularProgress,
} from "@mui/material";
import {
    Delete, Edit, ContactMail, Search,
    Chat, Send as SendIcon,
} from "@mui/icons-material";
import axios from "axios";
import { useAuth } from "../context/AuthContext";
import API_BASE from "../config";
import { formatDistanceToNow } from "date-fns";

const CONTACTS_API = `${API_BASE}/api/contacts`;

const TabPanel = ({ children, value, index }) =>
    value === index ? <Box>{children}</Box> : null;

// ─── Contact Forms tab ───────────────────────────────────────────────────────
const ContactForms = () => {
    const theme = useTheme();
    const isDark = theme.palette.mode === "dark";
    const [contacts, setContacts] = useState([]);
    const [selected, setSelected] = useState(null);
    const [open, setOpen] = useState(false);
    const [search, setSearch] = useState("");
    const [snackbar, setSnackbar] = useState({ open: false, message: "", severity: "success" });

    const fetchContacts = async () => {
        try {
            const res = await axios.get(CONTACTS_API);
            setContacts(res.data);
        } catch (err) {
            console.error(err);
        }
    };

    useEffect(() => { fetchContacts(); }, []);

    const handleUpdate = async () => {
        try {
            await axios.put(`${CONTACTS_API}/${selected._id}`, selected);
            setOpen(false);
            fetchContacts();
            setSnackbar({ open: true, message: "Message updated.", severity: "success" });
        } catch {
            setSnackbar({ open: true, message: "Update failed.", severity: "error" });
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Delete this message?")) return;
        try {
            await axios.delete(`${CONTACTS_API}/${id}`);
            fetchContacts();
            setSnackbar({ open: true, message: "Message deleted.", severity: "info" });
        } catch {
            setSnackbar({ open: true, message: "Delete failed.", severity: "error" });
        }
    };

    const filtered = contacts.filter((c) => {
        const q = search.toLowerCase();
        return (
            c.fullName?.toLowerCase().includes(q) ||
            c.email?.toLowerCase().includes(q) ||
            c.message?.toLowerCase().includes(q)
        );
    });

    const cardBg = isDark ? "#1a1a1a" : "#fff";
    const cardBorder = isDark ? "#2a2a2a" : "#f0f0f0";
    const headBg = isDark ? "#1e1e1e" : "#fbe9e7";

    return (
        <Box>
            <Typography variant="body2" color="text.secondary" mb={2}>
                {contacts.length} message{contacts.length !== 1 ? "s" : ""} received from the contact form
            </Typography>

            <TextField
                size="small"
                placeholder="Search by name, email, or message…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                sx={{ mb: 2.5, width: { xs: "100%", sm: 380 } }}
                InputProps={{
                    startAdornment: (
                        <InputAdornment position="start">
                            <Search sx={{ color: "text.disabled", fontSize: 20 }} />
                        </InputAdornment>
                    ),
                    sx: { borderRadius: 2 },
                }}
            />

            <TableContainer
                component={Paper}
                elevation={0}
                sx={{ borderRadius: 3, border: `1px solid ${cardBorder}`, bgcolor: cardBg }}
            >
                <Table>
                    <TableHead sx={{ bgcolor: headBg }}>
                        <TableRow>
                            {["Sender", "Email", "Message", "Received", "Actions"].map((h) => (
                                <TableCell key={h} sx={{ fontWeight: 700, fontSize: "0.82rem", py: 1.5 }}>
                                    {h}
                                </TableCell>
                            ))}
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {filtered.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={5} align="center" sx={{ py: 6 }}>
                                    <ContactMail sx={{ fontSize: 40, color: "text.disabled", mb: 1 }} />
                                    <Typography color="text.secondary" fontSize="0.9rem">No messages found.</Typography>
                                </TableCell>
                            </TableRow>
                        ) : (
                            filtered.map((msg) => (
                                <TableRow
                                    key={msg._id}
                                    hover
                                    sx={{ "&:nth-of-type(odd)": { bgcolor: isDark ? "rgba(255,255,255,0.02)" : "#fafafa" } }}
                                >
                                    <TableCell>
                                        <Box display="flex" alignItems="center" gap={1.2}>
                                            <Avatar sx={{ bgcolor: "#b71c1c", width: 34, height: 34, fontSize: "0.82rem", fontWeight: 700 }}>
                                                {msg.fullName?.charAt(0)?.toUpperCase()}
                                            </Avatar>
                                            <Typography fontWeight={600} fontSize="0.86rem">{msg.fullName}</Typography>
                                        </Box>
                                    </TableCell>
                                    <TableCell sx={{ fontSize: "0.84rem", color: "text.secondary" }}>{msg.email}</TableCell>
                                    <TableCell sx={{ maxWidth: 260 }}>
                                        <Typography
                                            fontSize="0.83rem"
                                            sx={{ overflow: "hidden", textOverflow: "ellipsis", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" }}
                                        >
                                            {msg.message}
                                        </Typography>
                                    </TableCell>
                                    <TableCell>
                                        <Typography fontSize="0.8rem" color="text.secondary">
                                            {new Date(msg.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                                        </Typography>
                                    </TableCell>
                                    <TableCell>
                                        <Tooltip title="Edit">
                                            <IconButton size="small" color="primary" onClick={() => { setSelected(msg); setOpen(true); }}>
                                                <Edit fontSize="small" />
                                            </IconButton>
                                        </Tooltip>
                                        <Tooltip title="Delete">
                                            <IconButton size="small" color="error" onClick={() => handleDelete(msg._id)}>
                                                <Delete fontSize="small" />
                                            </IconButton>
                                        </Tooltip>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </TableContainer>

            <Dialog open={open} onClose={() => setOpen(false)} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
                <DialogTitle fontWeight={700}>Edit Contact Message</DialogTitle>
                <DialogContent dividers>
                    <TextField margin="dense" label="Full Name" value={selected?.fullName || ""} onChange={(e) => setSelected({ ...selected, fullName: e.target.value })} fullWidth variant="outlined" />
                    <TextField margin="dense" label="Email" value={selected?.email || ""} onChange={(e) => setSelected({ ...selected, email: e.target.value })} fullWidth variant="outlined" />
                    <TextField margin="dense" label="Message" value={selected?.message || ""} onChange={(e) => setSelected({ ...selected, message: e.target.value })} fullWidth multiline rows={4} variant="outlined" />
                </DialogContent>
                <DialogActions sx={{ px: 3, pb: 2.5 }}>
                    <Button onClick={() => setOpen(false)} color="inherit">Cancel</Button>
                    <Button onClick={handleUpdate} variant="contained" color="error" sx={{ borderRadius: 2 }}>Save Changes</Button>
                </DialogActions>
            </Dialog>

            <Snackbar open={snackbar.open} autoHideDuration={4000} onClose={() => setSnackbar({ ...snackbar, open: false })} anchorOrigin={{ vertical: "bottom", horizontal: "center" }}>
                <Alert severity={snackbar.severity} variant="filled" onClose={() => setSnackbar({ ...snackbar, open: false })} sx={{ borderRadius: 2 }}>
                    {snackbar.message}
                </Alert>
            </Snackbar>
        </Box>
    );
};

// ─── User Chats tab ──────────────────────────────────────────────────────────
const UserChats = () => {
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
        if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); }
    };

    const cardBorder = isDark ? "#2a2a2a" : "#f0f0f0";
    const cardBg = isDark ? "#1a1a1a" : "#fff";
    const totalUnread = conversations.reduce((sum, c) => sum + (c.unread || 0), 0);

    return (
        <Box>
            <Typography variant="body2" color="text.secondary" mb={2}>
                {conversations.length} conversation{conversations.length !== 1 ? "s" : ""}
                {totalUnread > 0 && ` • ${totalUnread} unread`}
            </Typography>

            <Paper
                elevation={0}
                sx={{ borderRadius: 3, border: `1px solid ${cardBorder}`, bgcolor: cardBg, display: "flex", height: 540, overflow: "hidden" }}
            >
                {/* Conversation list */}
                <Box sx={{ width: 280, flexShrink: 0, borderRight: `1px solid ${cardBorder}`, overflowY: "auto" }}>
                    <Box sx={{ px: 2, py: 1.5, borderBottom: `1px solid ${cardBorder}` }}>
                        <Typography variant="subtitle2" fontWeight={700} color="text.secondary">CONVERSATIONS</Typography>
                    </Box>

                    {loadingConvos ? (
                        <Box display="flex" justifyContent="center" pt={4}><CircularProgress color="error" size={28} /></Box>
                    ) : conversations.length === 0 ? (
                        <Box textAlign="center" pt={6} px={2}>
                            <Chat sx={{ fontSize: 36, color: "text.disabled", mb: 1 }} />
                            <Typography color="text.secondary" fontSize="0.85rem">No messages yet.</Typography>
                        </Box>
                    ) : (
                        <List disablePadding>
                            {conversations.map((convo, idx) => (
                                <React.Fragment key={convo._id}>
                                    <ListItemButton
                                        selected={selected?._id === convo._id}
                                        onClick={() => handleSelect(convo)}
                                        sx={{
                                            py: 1.5, px: 2,
                                            "&.Mui-selected": {
                                                bgcolor: isDark ? "rgba(183,28,28,0.18)" : "rgba(183,28,28,0.07)",
                                                borderRight: "3px solid #b71c1c",
                                            },
                                        }}
                                    >
                                        <ListItemAvatar>
                                            <Badge badgeContent={convo.unread} color="error" invisible={!convo.unread}>
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
                                                <Typography fontSize="0.75rem" color="text.secondary" noWrap fontWeight={convo.unread ? 600 : 400}>
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
                            <Chat sx={{ fontSize: 52, color: "text.disabled" }} />
                            <Typography color="text.secondary">Select a conversation to start replying</Typography>
                        </Box>
                    ) : (
                        <>
                            <Box sx={{ px: 3, py: 1.8, borderBottom: `1px solid ${cardBorder}`, display: "flex", alignItems: "center", gap: 1.5 }}>
                                <Avatar sx={{ bgcolor: "#b71c1c", width: 36, height: 36, fontSize: "0.82rem", fontWeight: 700 }}>
                                    {selected.userName?.charAt(0)?.toUpperCase()}
                                </Avatar>
                                <Box>
                                    <Typography fontWeight={700} fontSize="0.9rem">{selected.userName}</Typography>
                                    <Typography variant="caption" color="text.secondary">{selected.userEmail}</Typography>
                                </Box>
                            </Box>

                            <Box sx={{ flex: 1, overflowY: "auto", px: 3, py: 2, display: "flex", flexDirection: "column", gap: 1.5 }}>
                                {loadingMsgs ? (
                                    <Box display="flex" justifyContent="center" alignItems="center" height="100%">
                                        <CircularProgress color="error" size={28} />
                                    </Box>
                                ) : (
                                    messages.map((msg) => {
                                        const isAdmin = msg.sender === "admin";
                                        return (
                                            <Box key={msg._id} sx={{ display: "flex", justifyContent: isAdmin ? "flex-end" : "flex-start", alignItems: "flex-end", gap: 1 }}>
                                                {!isAdmin && (
                                                    <Avatar sx={{ bgcolor: "#b71c1c", width: 28, height: 28, fontSize: "0.65rem", fontWeight: 700, mb: 0.5 }}>
                                                        {selected.userName?.charAt(0)?.toUpperCase()}
                                                    </Avatar>
                                                )}
                                                <Box sx={{ maxWidth: "70%" }}>
                                                    <Box sx={{
                                                        px: 2, py: 1.2,
                                                        borderRadius: isAdmin ? "18px 18px 4px 18px" : "18px 18px 18px 4px",
                                                        backgroundColor: isAdmin ? "#b71c1c" : isDark ? "#2a2a2a" : "#f0f0f0",
                                                        color: isAdmin ? "#fff" : "text.primary",
                                                    }}>
                                                        <Typography variant="body2" sx={{ lineHeight: 1.6, whiteSpace: "pre-wrap" }}>{msg.content}</Typography>
                                                    </Box>
                                                    <Typography variant="caption" color="text.disabled" sx={{ px: 1, display: "block", mt: 0.3, textAlign: isAdmin ? "right" : "left" }}>
                                                        {formatDistanceToNow(new Date(msg.createdAt), { addSuffix: true })}
                                                    </Typography>
                                                </Box>
                                                {isAdmin && (
                                                    <Avatar sx={{ bgcolor: "#424242", width: 28, height: 28, fontSize: "0.65rem", fontWeight: 700, mb: 0.5 }}>AD</Avatar>
                                                )}
                                            </Box>
                                        );
                                    })
                                )}
                                <div ref={bottomRef} />
                            </Box>

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
                                        bgcolor: "#b71c1c", color: "white", width: 42, height: 42, borderRadius: 2.5, flexShrink: 0,
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

// ─── Combined page ───────────────────────────────────────────────────────────
const ManageContact = () => {
    const [tab, setTab] = useState(0);

    return (
        <Box>
            {/* Header */}
            <Box display="flex" alignItems="center" gap={1.5} mb={3}>
                <Avatar sx={{ bgcolor: "#b71c1c", width: 52, height: 52 }}>
                    <ContactMail sx={{ fontSize: 26 }} />
                </Avatar>
                <Box>
                    <Typography
                        variant="h5" fontWeight={800}
                        sx={{ background: "linear-gradient(to right, #b71c1c, #d32f2f)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", lineHeight: 1.2 }}
                    >
                        Messages
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                        Contact form submissions and user chat messages
                    </Typography>
                </Box>
            </Box>

            {/* Tabs */}
            <Tabs
                value={tab}
                onChange={(_, v) => setTab(v)}
                sx={{
                    mb: 3,
                    "& .MuiTab-root": { textTransform: "none", fontWeight: 600, fontSize: "0.9rem" },
                    "& .Mui-selected": { color: "#b71c1c" },
                    "& .MuiTabs-indicator": { backgroundColor: "#b71c1c" },
                }}
            >
                <Tab icon={<ContactMail sx={{ fontSize: 18 }} />} iconPosition="start" label="Contact Forms" />
                <Tab icon={<Chat sx={{ fontSize: 18 }} />} iconPosition="start" label="User Chats" />
            </Tabs>

            <TabPanel value={tab} index={0}>
                <ContactForms />
            </TabPanel>
            <TabPanel value={tab} index={1}>
                <UserChats />
            </TabPanel>
        </Box>
    );
};

export default ManageContact;
