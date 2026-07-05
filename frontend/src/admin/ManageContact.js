import React, { useEffect, useState } from "react";
import {
    Typography,
    Paper,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    IconButton,
    Dialog,
    DialogTitle,
    DialogContent,
    TextField,
    DialogActions,
    Button,
    Box,
    Snackbar,
    Alert,
    useTheme,
    Avatar,
    Tooltip,
    InputAdornment,
} from "@mui/material";
import { Delete, Edit, ContactMail, Search } from "@mui/icons-material";
import axios from "axios";

const API = "http://localhost:3001/api/contacts";

const ManageContact = () => {
    const theme = useTheme();
    const isDark = theme.palette.mode === "dark";
    const [contacts, setContacts] = useState([]);
    const [selected, setSelected] = useState(null);
    const [open, setOpen] = useState(false);
    const [search, setSearch] = useState("");
    const [snackbar, setSnackbar] = useState({ open: false, message: "", severity: "success" });

    const fetchContacts = async () => {
        try {
            const res = await axios.get(API);
            setContacts(res.data);
        } catch (error) {
            console.error("Failed to fetch contacts:", error);
        }
    };

    useEffect(() => {
        fetchContacts();
    }, []);

    const handleEditClick = (item) => {
        setSelected(item);
        setOpen(true);
    };

    const handleEditChange = (e) => {
        setSelected({ ...selected, [e.target.name]: e.target.value });
    };

    const handleUpdate = async () => {
        try {
            await axios.put(`${API}/${selected._id}`, selected);
            setOpen(false);
            fetchContacts();
            setSnackbar({ open: true, message: "Message updated successfully!", severity: "success" });
        } catch (err) {
            console.error("Update failed:", err);
            setSnackbar({ open: true, message: "Update failed!", severity: "error" });
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Are you sure you want to delete this message?")) return;
        try {
            await axios.delete(`${API}/${id}`);
            fetchContacts();
            setSnackbar({ open: true, message: "Message deleted.", severity: "info" });
        } catch (err) {
            console.error("Delete failed:", err);
            setSnackbar({ open: true, message: "Delete failed!", severity: "error" });
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
            {/* Header */}
            <Box display="flex" alignItems="flex-start" justifyContent="space-between" mb={3}>
                <Box display="flex" alignItems="center" gap={1.5}>
                    <Avatar sx={{ bgcolor: "#b71c1c", width: 52, height: 52 }}>
                        <ContactMail sx={{ fontSize: 26 }} />
                    </Avatar>
                    <Box>
                        <Typography
                            variant="h5"
                            fontWeight={800}
                            sx={{
                                background: "linear-gradient(to right, #b71c1c, #d32f2f)",
                                WebkitBackgroundClip: "text",
                                WebkitTextFillColor: "transparent",
                                lineHeight: 1.2,
                            }}
                        >
                            Manage Contact Messages
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                            {contacts.length} message{contacts.length !== 1 ? "s" : ""} received
                        </Typography>
                    </Box>
                </Box>
            </Box>

            {/* Search */}
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

            {/* Table */}
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
                                    <Typography color="text.secondary" fontSize="0.9rem">
                                        No messages found.
                                    </Typography>
                                </TableCell>
                            </TableRow>
                        ) : (
                            filtered.map((msg, idx) => (
                                <TableRow
                                    key={msg._id}
                                    hover
                                    sx={{
                                        "&:nth-of-type(odd)": {
                                            bgcolor: isDark ? "rgba(255,255,255,0.02)" : "#fafafa",
                                        },
                                    }}
                                >
                                    <TableCell>
                                        <Box display="flex" alignItems="center" gap={1.2}>
                                            <Avatar
                                                sx={{
                                                    bgcolor: "#b71c1c",
                                                    width: 34,
                                                    height: 34,
                                                    fontSize: "0.82rem",
                                                    fontWeight: 700,
                                                }}
                                            >
                                                {msg.fullName?.charAt(0)?.toUpperCase()}
                                            </Avatar>
                                            <Typography fontWeight={600} fontSize="0.86rem">
                                                {msg.fullName}
                                            </Typography>
                                        </Box>
                                    </TableCell>
                                    <TableCell sx={{ fontSize: "0.84rem", color: "text.secondary" }}>
                                        {msg.email}
                                    </TableCell>
                                    <TableCell sx={{ maxWidth: 260 }}>
                                        <Typography
                                            fontSize="0.83rem"
                                            sx={{
                                                overflow: "hidden",
                                                textOverflow: "ellipsis",
                                                display: "-webkit-box",
                                                WebkitLineClamp: 2,
                                                WebkitBoxOrient: "vertical",
                                            }}
                                        >
                                            {msg.message}
                                        </Typography>
                                    </TableCell>
                                    <TableCell>
                                        <Typography fontSize="0.8rem" color="text.secondary">
                                            {new Date(msg.createdAt).toLocaleDateString("en-US", {
                                                month: "short",
                                                day: "numeric",
                                                year: "numeric",
                                            })}
                                        </Typography>
                                    </TableCell>
                                    <TableCell>
                                        <Tooltip title="Edit">
                                            <IconButton
                                                size="small"
                                                color="primary"
                                                onClick={() => handleEditClick(msg)}
                                            >
                                                <Edit fontSize="small" />
                                            </IconButton>
                                        </Tooltip>
                                        <Tooltip title="Delete">
                                            <IconButton
                                                size="small"
                                                color="error"
                                                onClick={() => handleDelete(msg._id)}
                                            >
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

            {/* Edit Dialog */}
            <Dialog
                open={open}
                onClose={() => setOpen(false)}
                maxWidth="sm"
                fullWidth
                PaperProps={{ sx: { borderRadius: 3 } }}
            >
                <DialogTitle fontWeight={700}>Edit Contact Message</DialogTitle>
                <DialogContent dividers>
                    <TextField
                        margin="dense"
                        label="Full Name"
                        name="fullName"
                        value={selected?.fullName || ""}
                        onChange={handleEditChange}
                        fullWidth
                        variant="outlined"
                    />
                    <TextField
                        margin="dense"
                        label="Email"
                        name="email"
                        value={selected?.email || ""}
                        onChange={handleEditChange}
                        fullWidth
                        variant="outlined"
                    />
                    <TextField
                        margin="dense"
                        label="Message"
                        name="message"
                        value={selected?.message || ""}
                        onChange={handleEditChange}
                        fullWidth
                        multiline
                        rows={4}
                        variant="outlined"
                    />
                </DialogContent>
                <DialogActions sx={{ px: 3, pb: 2.5 }}>
                    <Button onClick={() => setOpen(false)} color="inherit">
                        Cancel
                    </Button>
                    <Button
                        onClick={handleUpdate}
                        variant="contained"
                        color="error"
                        sx={{ borderRadius: 2 }}
                    >
                        Save Changes
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Snackbar */}
            <Snackbar
                open={snackbar.open}
                autoHideDuration={4000}
                onClose={() => setSnackbar({ ...snackbar, open: false })}
                anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
            >
                <Alert
                    severity={snackbar.severity}
                    variant="filled"
                    onClose={() => setSnackbar({ ...snackbar, open: false })}
                    sx={{ borderRadius: 2 }}
                >
                    {snackbar.message}
                </Alert>
            </Snackbar>
        </Box>
    );
};

export default ManageContact;
