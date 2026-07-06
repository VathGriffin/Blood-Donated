'use client';
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
    Box,
    Snackbar,
    Alert,
    useTheme,
    Avatar,
    Tooltip,
    InputAdornment,
    TextField,
    Chip,
    MenuItem,
    Select,
    FormControl,
} from "@mui/material";
import { Delete, Search, CalendarMonth } from "@mui/icons-material";
import axios from "axios";
import API_BASE from "@/lib/config";

const API = `${API_BASE}/api/appointments`;

const statusColors = {
    Pending: "warning",
    Confirmed: "success",
    Cancelled: "error",
};

const ManageAppointments = () => {
    const theme = useTheme();
    const isDark = theme.palette.mode === "dark";
    const [appointments, setAppointments] = useState([]);
    const [search, setSearch] = useState("");
    const [snackbar, setSnackbar] = useState({ open: false, message: "", severity: "success" });

    const fetchAppointments = async () => {
        try {
            const res = await axios.get(API);
            setAppointments(res.data);
        } catch (err) {
            console.error("Failed to fetch appointments:", err);
        }
    };

    useEffect(() => {
        fetchAppointments();
    }, []);

    const handleStatusChange = async (id, status) => {
        try {
            await axios.put(`${API}/${id}`, { status });
            setAppointments((prev) =>
                prev.map((a) => (a._id === id ? { ...a, status } : a))
            );
            setSnackbar({ open: true, message: `Status updated to ${status}`, severity: "success" });
        } catch (err) {
            setSnackbar({ open: true, message: "Update failed!", severity: "error" });
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Delete this appointment?")) return;
        try {
            await axios.delete(`${API}/${id}`);
            setAppointments((prev) => prev.filter((a) => a._id !== id));
            setSnackbar({ open: true, message: "Appointment deleted.", severity: "info" });
        } catch (err) {
            setSnackbar({ open: true, message: "Delete failed!", severity: "error" });
        }
    };

    const filtered = appointments.filter((a) => {
        const q = search.toLowerCase();
        return (
            a.fullName?.toLowerCase().includes(q) ||
            a.email?.toLowerCase().includes(q) ||
            a.bloodType?.toLowerCase().includes(q) ||
            a.location?.toLowerCase().includes(q) ||
            a.status?.toLowerCase().includes(q)
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
                        <CalendarMonth sx={{ fontSize: 26 }} />
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
                            Manage Appointments
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                            {appointments.length} appointment{appointments.length !== 1 ? "s" : ""} booked
                        </Typography>
                    </Box>
                </Box>
            </Box>

            {/* Search */}
            <TextField
                size="small"
                placeholder="Search by name, email, blood type, location…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                sx={{ mb: 2.5, width: { xs: "100%", sm: 420 } }}
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
                            {["Donor", "Blood Type", "Date & Time", "Location", "Status", "Actions"].map((h) => (
                                <TableCell key={h} sx={{ fontWeight: 700, fontSize: "0.82rem", py: 1.5 }}>
                                    {h}
                                </TableCell>
                            ))}
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {filtered.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={6} align="center" sx={{ py: 6 }}>
                                    <CalendarMonth sx={{ fontSize: 40, color: "text.disabled", mb: 1 }} />
                                    <Typography color="text.secondary" fontSize="0.9rem">
                                        No appointments found.
                                    </Typography>
                                </TableCell>
                            </TableRow>
                        ) : (
                            filtered.map((appt, idx) => (
                                <TableRow
                                    key={appt._id}
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
                                                {appt.fullName?.charAt(0)?.toUpperCase()}
                                            </Avatar>
                                            <Box>
                                                <Typography fontWeight={600} fontSize="0.86rem">
                                                    {appt.fullName}
                                                </Typography>
                                                <Typography fontSize="0.75rem" color="text.secondary">
                                                    {appt.email}
                                                </Typography>
                                            </Box>
                                        </Box>
                                    </TableCell>
                                    <TableCell>
                                        <Chip
                                            label={appt.bloodType}
                                            size="small"
                                            sx={{
                                                bgcolor: "#b71c1c",
                                                color: "white",
                                                fontWeight: 700,
                                                fontSize: "0.78rem",
                                            }}
                                        />
                                    </TableCell>
                                    <TableCell>
                                        <Typography fontSize="0.84rem" fontWeight={600}>
                                            {appt.date}
                                        </Typography>
                                        <Typography fontSize="0.76rem" color="text.secondary">
                                            {appt.time}
                                        </Typography>
                                    </TableCell>
                                    <TableCell sx={{ maxWidth: 200 }}>
                                        <Typography fontSize="0.82rem" color="text.secondary">
                                            {appt.location}
                                        </Typography>
                                    </TableCell>
                                    <TableCell>
                                        <FormControl size="small" sx={{ minWidth: 120 }}>
                                            <Select
                                                value={appt.status}
                                                onChange={(e) => handleStatusChange(appt._id, e.target.value)}
                                                renderValue={(val) => (
                                                    <Chip
                                                        label={val}
                                                        color={statusColors[val]}
                                                        size="small"
                                                        sx={{ fontWeight: 700, fontSize: "0.72rem" }}
                                                    />
                                                )}
                                                sx={{ borderRadius: 2, "& .MuiOutlinedInput-notchedOutline": { borderColor: "transparent" } }}
                                            >
                                                <MenuItem value="Pending">Pending</MenuItem>
                                                <MenuItem value="Confirmed">Confirmed</MenuItem>
                                                <MenuItem value="Cancelled">Cancelled</MenuItem>
                                            </Select>
                                        </FormControl>
                                    </TableCell>
                                    <TableCell>
                                        <Tooltip title="Delete">
                                            <IconButton
                                                size="small"
                                                color="error"
                                                onClick={() => handleDelete(appt._id)}
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

export default ManageAppointments;
