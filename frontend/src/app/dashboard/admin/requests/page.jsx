'use client';
import React, { useEffect, useRef, useState } from "react";
import {
    Typography, Paper, Table, TableBody, TableCell, TableContainer,
    TableHead, TableRow, IconButton, Button, Dialog, DialogActions,
    DialogContent, DialogTitle, TextField, Box, Chip, Tabs, Tab,
    Avatar, Badge, Tooltip, useTheme, MenuItem, Select, FormControl,
    InputLabel, Alert,
} from "@mui/material";
import {
    Delete, Edit, Bloodtype, CameraAlt, DeleteOutline, Close,
    Visibility, LocalHospital, Phone, CalendarToday, CheckCircle,
    Cancel, HourglassEmpty,
} from "@mui/icons-material";
import axios from "axios";
import API_BASE_URL from "@/lib/config";
import { useAuth } from "@/store/AuthContext";

const API_BASE = `${API_BASE_URL}/api/requests`;
const BASE_URL = API_BASE_URL;

const URGENCY_LEVELS = ["Low", "Medium", "High", "Critical"];
const BLOOD_TYPES = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];

const getUrgencyColor = (urgency) => {
    switch ((urgency || "").toLowerCase()) {
        case "critical": return "error";
        case "high":     return "error";
        case "medium":   return "warning";
        case "low":      return "success";
        default:         return "default";
    }
};

const STATUS_META = {
    Pending:  { color: "#d97706", bg: "rgba(217,119,6,0.12)",  label: "Pending",  icon: <HourglassEmpty sx={{ fontSize: 13 }} /> },
    Approved: { color: "#16a34a", bg: "rgba(22,163,74,0.12)",  label: "Approved", icon: <CheckCircle   sx={{ fontSize: 13 }} /> },
    Rejected: { color: "#dc2626", bg: "rgba(220,38,38,0.12)",  label: "Rejected", icon: <Cancel        sx={{ fontSize: 13 }} /> },
};

const urgencyOrder = { critical: 0, high: 1, medium: 2, low: 3 };

const emptyForm = {
    hospitalName: "", patientName: "", bloodType: "",
    urgency: "", reason: "", contact: "", photo: null,
};

const ManageRequests = () => {
    const theme = useTheme();
    const isDark = theme.palette.mode === "dark";
    const { token } = useAuth();
    const authHeader = () => ({ headers: { Authorization: `Bearer ${token}` } });

    const [requests, setRequests]     = useState([]);
    const [formData, setFormData]     = useState(emptyForm);
    const [editId, setEditId]         = useState(null);
    const [open, setOpen]             = useState(false);
    const [statusTab, setStatusTab]   = useState("All");
    const [photoPreview, setPhotoPreview] = useState(null);
    const [photoFile, setPhotoFile]   = useState(null);
    const [uploading, setUploading]   = useState(false);
    const fileInputRef                = useRef(null);
    const [viewPhoto, setViewPhoto]   = useState(null);
    const [viewProfile, setViewProfile] = useState(null);
    const [actionError, setActionError] = useState("");

    const fetchRequests = async () => {
        try {
            const res = await axios.get(API_BASE);
            setRequests(Array.isArray(res.data) ? res.data : []);
        } catch (err) {
            console.error(err);
        }
    };

    useEffect(() => { fetchRequests(); }, []);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    const handlePhotoChange = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        setPhotoFile(file);
        setPhotoPreview(URL.createObjectURL(file));
    };

    const handleRemovePhoto = () => {
        setPhotoFile(null);
        setPhotoPreview(null);
        setFormData((prev) => ({ ...prev, photo: null }));
        if (fileInputRef.current) fileInputRef.current.value = "";
    };

    const handleSetStatus = async (id, status) => {
        if (!token) return;
        setActionError("");
        try {
            const res = await axios.put(`${API_BASE}/${id}`, { status }, authHeader());
            setRequests(prev => prev.map(r => r._id === id ? res.data : r));
            if (viewProfile?._id === id) setViewProfile(res.data);
        } catch (err) {
            const msg = err.response?.data?.message || err.response?.data?.error || "Failed to update status.";
            setActionError(msg);
        }
    };

    const handleSubmit = async () => {
        if (!editId) return;
        try {
            const { hospitalName, patientName, bloodType, urgency, reason, contact } = formData;
            await axios.put(`${API_BASE}/${editId}`, { hospitalName, patientName, bloodType, urgency, reason, contact }, authHeader());
        } catch (err) {
            const msg = err.response?.data?.error || err.response?.data?.message || "Failed to update request.";
            alert(msg);
            return;
        }
        if (photoFile) {
            try {
                setUploading(true);
                const fd = new FormData();
                fd.append("photo", photoFile);
                await axios.post(`${API_BASE}/${editId}/photo`, fd);
            } catch {
                alert("Request updated, but photo upload failed.");
            } finally {
                setUploading(false);
            }
        }
        await fetchRequests();
        setFormData(emptyForm);
        setEditId(null);
        setPhotoFile(null);
        setPhotoPreview(null);
        setOpen(false);
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Delete this request?")) return;
        try {
            await axios.delete(`${API_BASE}/${id}`, authHeader());
            fetchRequests();
        } catch (err) {
            console.error(err);
        }
    };

    const handleEdit = (req) => {
        setFormData({
            hospitalName: req.hospitalName || "",
            patientName:  req.patientName  || "",
            bloodType:    req.bloodType    || "",
            urgency:      req.urgency      || "",
            reason:       req.reason       || "",
            contact:      req.contact      || "",
            photo:        req.photo        || null,
        });
        setEditId(req._id);
        setPhotoPreview(req.photo ? `${BASE_URL}${req.photo}` : null);
        setPhotoFile(null);
        setOpen(true);
    };

    const STATUS_TABS = ["All", "Pending", "Approved", "Rejected"];

    const reqStatus = (r) => r.status || "Pending";

    const filtered = requests
        .filter(r => statusTab === "All" || reqStatus(r) === statusTab)
        .sort((a, b) => (urgencyOrder[a.urgency?.toLowerCase()] ?? 4) - (urgencyOrder[b.urgency?.toLowerCase()] ?? 4));

    const countFor = (s) =>
        s === "All" ? requests.length : requests.filter(r => reqStatus(r) === s).length;

    const cardBg     = isDark ? "#1a1a1a" : "#fff";
    const cardBorder = isDark ? "#2a2a2a" : "#f0f0f0";
    const headBg     = isDark ? "#1e1e1e" : "#fbe9e7";

    const StatusChip = ({ status }) => {
        const m = STATUS_META[status] || STATUS_META.Pending;
        return (
            <Chip
                icon={m.icon}
                label={m.label}
                size="small"
                sx={{
                    fontWeight: 700, fontSize: "0.73rem",
                    bgcolor: m.bg, color: m.color,
                    "& .MuiChip-icon": { color: m.color },
                }}
            />
        );
    };

    return (
        <Box>
            {/* Header */}
            <Box display="flex" alignItems="center" justifyContent="space-between" mb={3}>
                <Box display="flex" alignItems="center" gap={1.5}>
                    <Avatar sx={{ bgcolor: "#b71c1c", width: 52, height: 52 }}>
                        <Bloodtype sx={{ fontSize: 26 }} />
                    </Avatar>
                    <Box>
                        <Typography variant="h5" fontWeight={800}
                            sx={{ background: "linear-gradient(to right, #b71c1c, #d32f2f)",
                                WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", lineHeight: 1.2 }}>
                            Manage Blood Requests
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                            {requests.length} total · {countFor("Pending")} pending review
                        </Typography>
                    </Box>
                </Box>

                {/* Quick stats */}
                <Box display="flex" gap={1.5}>
                    {["Pending", "Approved", "Rejected"].map(s => {
                        const m = STATUS_META[s];
                        return (
                            <Box key={s} sx={{ textAlign: "center", px: 2, py: 1,
                                borderRadius: 2, bgcolor: m.bg, border: `1px solid ${m.color}22` }}>
                                <Typography fontWeight={800} fontSize="1.3rem" sx={{ color: m.color }} lineHeight={1}>
                                    {countFor(s)}
                                </Typography>
                                <Typography fontSize="0.68rem" fontWeight={600} sx={{ color: m.color }} textTransform="uppercase">
                                    {s}
                                </Typography>
                            </Box>
                        );
                    })}
                </Box>
            </Box>

            {actionError && (
                <Alert severity="error" onClose={() => setActionError("")} sx={{ mb: 2, borderRadius: 2 }}>
                    {actionError}
                </Alert>
            )}

            {/* Status Tabs */}
            <Paper elevation={0} sx={{ mb: 3, borderRadius: 3, border: `1px solid ${cardBorder}`, bgcolor: cardBg }}>
                <Tabs value={statusTab} onChange={(_, v) => setStatusTab(v)} variant="scrollable" scrollButtons="auto"
                    sx={{
                        px: 1,
                        "& .MuiTab-root": { textTransform: "none", fontWeight: 600, fontSize: "0.85rem" },
                        "& .Mui-selected": { color: "#b71c1c" },
                        "& .MuiTabs-indicator": { bgcolor: "#b71c1c" },
                    }}>
                    {STATUS_TABS.map(t => {
                        const m = STATUS_META[t];
                        return (
                            <Tab key={t} value={t} label={
                                <Box display="flex" alignItems="center" gap={0.8}>
                                    {t}
                                    <Chip label={countFor(t)} size="small"
                                        sx={{
                                            height: 18, fontSize: "0.68rem", fontWeight: 700,
                                            bgcolor: m ? m.bg : undefined,
                                            color: m ? m.color : undefined,
                                        }} />
                                </Box>
                            } />
                        );
                    })}
                </Tabs>
            </Paper>

            {/* Table */}
            <TableContainer component={Paper} elevation={0}
                sx={{ borderRadius: 3, border: `1px solid ${cardBorder}`, bgcolor: cardBg }}>
                <Table>
                    <TableHead sx={{ bgcolor: headBg }}>
                        <TableRow>
                            {["Patient", "Hospital", "Blood", "Urgency", "Status", "Reason", "Actions"].map(h => (
                                <TableCell key={h} sx={{ fontWeight: 700, fontSize: "0.82rem", py: 1.5 }}>{h}</TableCell>
                            ))}
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {filtered.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={7} align="center" sx={{ py: 6 }}>
                                    <Bloodtype sx={{ fontSize: 40, color: "text.disabled", mb: 1 }} />
                                    <Typography color="text.secondary" fontSize="0.9rem">
                                        No {statusTab !== "All" ? statusTab.toLowerCase() : ""} requests found.
                                    </Typography>
                                </TableCell>
                            </TableRow>
                        ) : (
                            filtered.map(req => (
                                <TableRow key={req._id} hover
                                    sx={{ "&:nth-of-type(odd)": { bgcolor: isDark ? "rgba(255,255,255,0.02)" : "#fafafa" } }}>

                                    {/* Patient */}
                                    <TableCell>
                                        <Box display="flex" alignItems="center" gap={1.5}>
                                            <Tooltip title={req.photo ? "View photo" : ""}>
                                                <Avatar
                                                    src={req.photo ? `${BASE_URL}${req.photo}` : undefined}
                                                    onClick={() => req.photo && setViewPhoto({ url: `${BASE_URL}${req.photo}`, name: req.patientName })}
                                                    sx={{
                                                        width: 40, height: 40, bgcolor: "#b71c1c",
                                                        fontSize: "0.9rem", fontWeight: 700,
                                                        cursor: req.photo ? "pointer" : "default",
                                                        border: req.photo ? "2px solid #b71c1c" : "2px solid transparent",
                                                        flexShrink: 0,
                                                        transition: "transform 0.15s",
                                                        "&:hover": req.photo ? { transform: "scale(1.1)" } : {},
                                                    }}>
                                                    {req.patientName?.charAt(0)?.toUpperCase()}
                                                </Avatar>
                                            </Tooltip>
                                            <Box>
                                                <Typography fontWeight={700} fontSize="0.86rem" lineHeight={1.2}>
                                                    {req.patientName || "—"}
                                                </Typography>
                                                <Typography fontSize="0.71rem" color="text.secondary" mt={0.2}>
                                                    {req.createdAt ? new Date(req.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "—"}
                                                </Typography>
                                            </Box>
                                        </Box>
                                    </TableCell>

                                    <TableCell sx={{ fontWeight: 600, fontSize: "0.85rem", maxWidth: 140 }}>
                                        <Typography noWrap fontSize="0.85rem" fontWeight={600}>{req.hospitalName}</Typography>
                                    </TableCell>

                                    <TableCell>
                                        <Chip label={req.bloodType} color="error" size="small"
                                            sx={{ fontWeight: 800, fontSize: "0.75rem" }} />
                                    </TableCell>

                                    <TableCell>
                                        <Chip label={req.urgency || "—"} color={getUrgencyColor(req.urgency)}
                                            size="small" sx={{ fontWeight: 700, fontSize: "0.75rem" }} />
                                    </TableCell>

                                    <TableCell>
                                        <StatusChip status={reqStatus(req)} />
                                    </TableCell>

                                    <TableCell sx={{ maxWidth: 160 }}>
                                        <Typography noWrap fontSize="0.82rem" color="text.secondary" title={req.reason}>
                                            {req.reason || "—"}
                                        </Typography>
                                    </TableCell>

                                    {/* Actions */}
                                    <TableCell>
                                        <Box display="flex" alignItems="center" gap={0.5}>
                                            {/* Accept */}
                                            <Tooltip title="Approve">
                                                <span>
                                                    <IconButton size="small"
                                                        disabled={reqStatus(req) === "Approved"}
                                                        onClick={() => handleSetStatus(req._id, "Approved")}
                                                        sx={{
                                                            color: "#16a34a",
                                                            "&:hover": { bgcolor: "rgba(22,163,74,0.1)" },
                                                            "&.Mui-disabled": { color: isDark ? "#333" : "#ccc" },
                                                        }}>
                                                        <CheckCircle fontSize="small" />
                                                    </IconButton>
                                                </span>
                                            </Tooltip>

                                            {/* Reject */}
                                            <Tooltip title="Reject">
                                                <span>
                                                    <IconButton size="small"
                                                        disabled={reqStatus(req) === "Rejected"}
                                                        onClick={() => handleSetStatus(req._id, "Rejected")}
                                                        sx={{
                                                            color: "#dc2626",
                                                            "&:hover": { bgcolor: "rgba(220,38,38,0.1)" },
                                                            "&.Mui-disabled": { color: isDark ? "#333" : "#ccc" },
                                                        }}>
                                                        <Cancel fontSize="small" />
                                                    </IconButton>
                                                </span>
                                            </Tooltip>

                                            <Tooltip title="View">
                                                <IconButton size="small" color="inherit" onClick={() => setViewProfile(req)}>
                                                    <Visibility fontSize="small" />
                                                </IconButton>
                                            </Tooltip>

                                            <Tooltip title="Edit">
                                                <IconButton size="small" color="primary" onClick={() => handleEdit(req)}>
                                                    <Edit fontSize="small" />
                                                </IconButton>
                                            </Tooltip>

                                            <Tooltip title="Delete">
                                                <IconButton size="small" color="error" onClick={() => handleDelete(req._id)}>
                                                    <Delete fontSize="small" />
                                                </IconButton>
                                            </Tooltip>
                                        </Box>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </TableContainer>

            {/* Photo Preview Dialog */}
            <Dialog open={!!viewPhoto} onClose={() => setViewPhoto(null)} maxWidth="sm" fullWidth
                slotProps={{ paper: { sx: { borderRadius: 3, overflow: "hidden" } }}}>
                <DialogTitle sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", pb: 1 }}>
                    <Typography fontWeight={700}>{viewPhoto?.name}</Typography>
                    <IconButton size="small" onClick={() => setViewPhoto(null)}><Close fontSize="small" /></IconButton>
                </DialogTitle>
                <DialogContent sx={{ p: 0 }}>
                    <Box component="img" src={viewPhoto?.url} alt={viewPhoto?.name}
                        sx={{ width: "100%", maxHeight: 480, objectFit: "contain", display: "block", bgcolor: isDark ? "#111" : "#f5f5f5" }} />
                </DialogContent>
            </Dialog>

            {/* View Profile Dialog */}
            <Dialog open={!!viewProfile} onClose={() => setViewProfile(null)} maxWidth="xs" fullWidth
                slotProps={{ paper: { sx: { borderRadius: 4 } }}}>
                {viewProfile && (
                    <>
                        {/* Header */}
                        <Box sx={{
                            background: "linear-gradient(135deg, #b71c1c 0%, #d32f2f 100%)",
                            pt: 3.5, pb: 3, px: 3,
                            display: "flex", flexDirection: "column", alignItems: "center", gap: 1.2,
                            position: "relative",
                        }}>
                            <IconButton size="small" onClick={() => setViewProfile(null)}
                                sx={{ position: "absolute", top: 10, right: 10, color: "rgba(255,255,255,0.8)" }}>
                                <Close fontSize="small" />
                            </IconButton>
                            <Avatar
                                src={viewProfile.photo ? `${BASE_URL}${viewProfile.photo}` : undefined}
                                onClick={() => viewProfile.photo && setViewPhoto({ url: `${BASE_URL}${viewProfile.photo}`, name: viewProfile.patientName })}
                                sx={{
                                    width: 80, height: 80, bgcolor: "rgba(255,255,255,0.25)",
                                    fontSize: "2rem", fontWeight: 800,
                                    border: "3px solid rgba(255,255,255,0.5)",
                                    cursor: viewProfile.photo ? "pointer" : "default",
                                    "&:hover": viewProfile.photo ? { transform: "scale(1.05)" } : {},
                                    transition: "transform 0.15s",
                                }}>
                                {viewProfile.patientName?.charAt(0)?.toUpperCase()}
                            </Avatar>
                            <Box textAlign="center">
                                <Typography fontWeight={800} fontSize="1.05rem" color="#fff" lineHeight={1.2}>
                                    {viewProfile.patientName}
                                </Typography>
                                <Box display="flex" gap={0.7} justifyContent="center" mt={0.8} flexWrap="wrap">
                                    <Chip label={viewProfile.bloodType} size="small"
                                        sx={{ bgcolor: "rgba(255,255,255,0.2)", color: "#fff", fontWeight: 800, fontSize: "0.73rem" }} />
                                    <Chip label={viewProfile.urgency} size="small" color={getUrgencyColor(viewProfile.urgency)}
                                        sx={{ fontWeight: 700, fontSize: "0.73rem" }} />
                                    <Chip
                                        label={(STATUS_META[reqStatus(viewProfile)] || STATUS_META.Pending).label}
                                        size="small"
                                        sx={{
                                            bgcolor: (STATUS_META[reqStatus(viewProfile)] || STATUS_META.Pending).bg,
                                            color:   (STATUS_META[reqStatus(viewProfile)] || STATUS_META.Pending).color,
                                            fontWeight: 700, fontSize: "0.73rem",
                                        }} />
                                </Box>
                            </Box>
                        </Box>

                        {/* Scrollable content body */}
                        <DialogContent sx={{ p: 2.5, overflowY: "auto" }}>
                            {/* Info rows */}
                            <Box sx={{
                                border: `1px solid ${isDark ? "#2a2a2a" : "#f0f0f0"}`,
                                borderRadius: 2.5, overflow: "hidden", mb: 2,
                            }}>
                                {[
                                    { icon: <LocalHospital fontSize="small" sx={{ color: "#b71c1c" }} />, label: "Hospital",    value: viewProfile.hospitalName },
                                    { icon: <Bloodtype     fontSize="small" sx={{ color: "#b71c1c" }} />, label: "Blood Type",  value: viewProfile.bloodType },
                                    { icon: <Phone         fontSize="small" sx={{ color: "#b71c1c" }} />, label: "Contact",     value: viewProfile.contact },
                                    { icon: <Bloodtype     fontSize="small" sx={{ color: "#b71c1c" }} />, label: "Reason",      value: viewProfile.reason },
                                    { icon: <CalendarToday fontSize="small" sx={{ color: "#b71c1c" }} />, label: "Submitted",   value: viewProfile.createdAt ? new Date(viewProfile.createdAt).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" }) : "—" },
                                ].map((row, i, arr) => (
                                    <Box key={row.label} sx={{
                                        display: "flex", alignItems: "flex-start", gap: 1.5,
                                        px: 2, py: 1.4,
                                        bgcolor: isDark ? (i % 2 === 0 ? "#111" : "#0d0d0d") : (i % 2 === 0 ? "#fff" : "#fafafa"),
                                        borderBottom: i < arr.length - 1 ? `1px solid ${isDark ? "#1e1e1e" : "#f0f0f0"}` : "none",
                                    }}>
                                        <Box mt={0.3} flexShrink={0}>{row.icon}</Box>
                                        <Box flex={1} minWidth={0}>
                                            <Typography fontSize="0.68rem" color="text.disabled" fontWeight={700}
                                                textTransform="uppercase" letterSpacing="0.06em" mb={0.2}>
                                                {row.label}
                                            </Typography>
                                            <Typography fontSize="0.875rem" fontWeight={600} sx={{ wordBreak: "break-word" }}>
                                                {row.value || "—"}
                                            </Typography>
                                        </Box>
                                    </Box>
                                ))}
                            </Box>

                            {/* Accept / Reject */}
                            <Box display="flex" gap={1.5}>
                                <Button fullWidth variant="contained"
                                    disabled={reqStatus(viewProfile) === "Approved"}
                                    onClick={() => handleSetStatus(viewProfile._id, "Approved")}
                                    startIcon={<CheckCircle />}
                                    sx={{
                                        textTransform: "none", fontWeight: 700, borderRadius: 2,
                                        bgcolor: "#16a34a", "&:hover": { bgcolor: "#15803d" },
                                        "&.Mui-disabled": { bgcolor: isDark ? "#1a2a1a" : "#dcfce7", color: isDark ? "#333" : "#86efac" },
                                    }}>
                                    Approve
                                </Button>
                                <Button fullWidth variant="contained"
                                    disabled={reqStatus(viewProfile) === "Rejected"}
                                    onClick={() => handleSetStatus(viewProfile._id, "Rejected")}
                                    startIcon={<Cancel />}
                                    sx={{
                                        textTransform: "none", fontWeight: 700, borderRadius: 2,
                                        bgcolor: "#dc2626", "&:hover": { bgcolor: "#b91c1c" },
                                        "&.Mui-disabled": { bgcolor: isDark ? "#2a1a1a" : "#fee2e2", color: isDark ? "#333" : "#fca5a5" },
                                    }}>
                                    Reject
                                </Button>
                            </Box>

                            {viewProfile.photo && (
                                <Button fullWidth variant="outlined" color="error" size="small"
                                    startIcon={<Visibility fontSize="small" />}
                                    onClick={() => setViewPhoto({ url: `${BASE_URL}${viewProfile.photo}`, name: viewProfile.patientName })}
                                    sx={{ mt: 1.5, borderRadius: 2, textTransform: "none", fontWeight: 600 }}>
                                    View Full Photo
                                </Button>
                            )}
                        </DialogContent>
                    </>
                )}
            </Dialog>

            {/* Edit Dialog */}
            <Dialog open={open} onClose={() => setOpen(false)} maxWidth="sm" fullWidth
                slotProps={{ paper: { sx: { borderRadius: 3 } }}}>
                <DialogTitle fontWeight={700}>Update Blood Request</DialogTitle>
                <DialogContent dividers>
                    <Box display="flex" flexDirection="column" alignItems="center" mb={3} mt={1}>
                        <Badge overlap="circular" anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
                            badgeContent={
                                <Tooltip title="Change photo">
                                    <IconButton size="small" onClick={() => fileInputRef.current?.click()}
                                        sx={{ bgcolor: "#b71c1c", color: "white", width: 32, height: 32,
                                            border: "2px solid white", "&:hover": { bgcolor: "#d32f2f" } }}>
                                        <CameraAlt sx={{ fontSize: 16 }} />
                                    </IconButton>
                                </Tooltip>
                            }>
                            <Avatar src={photoPreview || undefined}
                                sx={{ width: 100, height: 100, bgcolor: "#b71c1c", fontSize: "2rem", fontWeight: 700,
                                    border: "3px solid #ffcdd2", cursor: "pointer" }}
                                onClick={() => fileInputRef.current?.click()}>
                                {!photoPreview && formData.patientName?.charAt(0)?.toUpperCase()}
                            </Avatar>
                        </Badge>
                        <input ref={fileInputRef} type="file" accept="image/*" style={{ display: "none" }} onChange={handlePhotoChange} />
                        <Box display="flex" gap={1} mt={1.5}>
                            <Button size="small" variant="outlined" color="error"
                                onClick={() => fileInputRef.current?.click()}
                                sx={{ borderRadius: 2, textTransform: "none", fontSize: "0.78rem" }}>
                                {photoPreview ? "Change Photo" : "Upload Photo"}
                            </Button>
                            {photoPreview && (
                                <Button size="small" variant="outlined" color="inherit"
                                    startIcon={<DeleteOutline />} onClick={handleRemovePhoto}
                                    sx={{ borderRadius: 2, textTransform: "none", fontSize: "0.78rem" }}>
                                    Remove
                                </Button>
                            )}
                        </Box>
                        <Typography variant="caption" color="text.disabled" mt={0.5}>JPG, PNG, WebP — max 5 MB</Typography>
                    </Box>

                    <TextField fullWidth margin="dense" label="Hospital Name" name="hospitalName" value={formData.hospitalName} onChange={handleChange} />
                    <TextField fullWidth margin="dense" label="Patient Name"  name="patientName"  value={formData.patientName}  onChange={handleChange} />
                    <FormControl fullWidth margin="dense">
                        <InputLabel>Blood Type</InputLabel>
                        <Select name="bloodType" value={formData.bloodType} onChange={handleChange} label="Blood Type">
                            {BLOOD_TYPES.map(t => <MenuItem key={t} value={t}>{t}</MenuItem>)}
                        </Select>
                    </FormControl>
                    <FormControl fullWidth margin="dense">
                        <InputLabel>Urgency</InputLabel>
                        <Select name="urgency" value={formData.urgency} onChange={handleChange} label="Urgency">
                            {URGENCY_LEVELS.map(u => <MenuItem key={u} value={u}>{u}</MenuItem>)}
                        </Select>
                    </FormControl>
                    <TextField fullWidth margin="dense" label="Reason"  name="reason"  value={formData.reason}  onChange={handleChange} multiline rows={2} />
                    <TextField fullWidth margin="dense" label="Contact" name="contact" value={formData.contact} onChange={handleChange} />
                </DialogContent>
                <DialogActions sx={{ px: 3, pb: 2.5 }}>
                    <Button onClick={() => setOpen(false)} color="inherit">Cancel</Button>
                    <Button onClick={handleSubmit} variant="contained" color="error" disabled={uploading} sx={{ borderRadius: 2 }}>
                        {uploading ? "Uploading…" : "Update"}
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default ManageRequests;
