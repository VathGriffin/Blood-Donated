'use client';
import React, { useEffect, useRef, useState } from "react";
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
    Button,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    TextField,
    Box,
    Chip,
    Tabs,
    Tab,
    Avatar,
    Badge,
    Tooltip,
    useTheme,
    MenuItem,
    Select,
    FormControl,
    InputLabel,
} from "@mui/material";
import { Delete, Edit, Bloodtype, CameraAlt, DeleteOutline, Close, Visibility, LocalHospital, Phone, CalendarToday } from "@mui/icons-material";
import axios from "axios";
import API_BASE_URL from "@/lib/config";

const API_BASE = `${API_BASE_URL}/api/requests`;
const BASE_URL = API_BASE_URL;

const URGENCY_LEVELS = ["Low", "Medium", "High", "Critical"];
const BLOOD_TYPES = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];

const getUrgencyColor = (urgency) => {
    switch ((urgency || "").toLowerCase()) {
        case "high":
        case "critical":
            return "error";
        case "medium":
            return "warning";
        case "low":
            return "success";
        default:
            return "default";
    }
};

const urgencyOrder = { critical: 0, high: 1, medium: 2, low: 3 };

const emptyForm = {
    hospitalName: "",
    patientName: "",
    bloodType: "",
    urgency: "",
    reason: "",
    contact: "",
    photo: null,
};

const ManageRequests = () => {
    const theme = useTheme();
    const isDark = theme.palette.mode === "dark";
    const [requests, setRequests] = useState([]);
    const [formData, setFormData] = useState(emptyForm);
    const [editId, setEditId] = useState(null);
    const [open, setOpen] = useState(false);
    const [tab, setTab] = useState("All");
    const [photoPreview, setPhotoPreview] = useState(null);
    const [photoFile, setPhotoFile] = useState(null);
    const [uploading, setUploading] = useState(false);
    const fileInputRef = useRef(null);
    const [viewPhoto, setViewPhoto] = useState(null);
    const [viewProfile, setViewProfile] = useState(null);

    const fetchRequests = async () => {
        try {
            const res = await axios.get(API_BASE);
            setRequests(res.data);
        } catch (err) {
            console.error(err);
        }
    };

    useEffect(() => {
        fetchRequests();
    }, []);

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

    const handleSubmit = async () => {
        if (!editId) return;

        // Step 1: update text fields
        try {
            const { hospitalName, patientName, bloodType, urgency, reason, contact } = formData;
            await axios.put(`${API_BASE}/${editId}`, { hospitalName, patientName, bloodType, urgency, reason, contact });
        } catch (err) {
            console.error("PUT error:", err);
            const msg = err.response?.data?.error || err.response?.data?.message || err.message || "Failed to update request.";
            alert(msg);
            return;
        }

        // Step 2: upload photo if one was selected
        if (photoFile) {
            try {
                setUploading(true);
                const fd = new FormData();
                fd.append("photo", photoFile);
                await axios.post(`${API_BASE}/${editId}/photo`, fd);
            } catch (err) {
                console.error("Photo upload error:", err);
                alert("Request updated, but photo upload failed. Please try uploading the photo again.");
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
            await axios.delete(`${API_BASE}/${id}`);
            fetchRequests();
        } catch (err) {
            console.error(err);
        }
    };

    const handleEdit = (req) => {
        setFormData({
            hospitalName: req.hospitalName || "",
            patientName: req.patientName || "",
            bloodType: req.bloodType || "",
            urgency: req.urgency || "",
            reason: req.reason || "",
            contact: req.contact || "",
            photo: req.photo || null,
        });
        setEditId(req._id);
        setPhotoPreview(req.photo ? `${BASE_URL}${req.photo}` : null);
        setPhotoFile(null);
        setOpen(true);
    };

    const tabs = ["All", "Critical", "High", "Medium", "Low"];

    const filtered = requests
        .filter((r) => tab === "All" || (r.urgency || "").toLowerCase() === tab.toLowerCase())
        .sort((a, b) => (urgencyOrder[a.urgency?.toLowerCase()] ?? 4) - (urgencyOrder[b.urgency?.toLowerCase()] ?? 4));

    const countFor = (level) =>
        level === "All"
            ? requests.length
            : requests.filter((r) => (r.urgency || "").toLowerCase() === level.toLowerCase()).length;

    const cardBg = isDark ? "#1a1a1a" : "#fff";
    const cardBorder = isDark ? "#2a2a2a" : "#f0f0f0";
    const headBg = isDark ? "#1e1e1e" : "#fbe9e7";

    return (
        <Box>
            {/* Header */}
            <Box display="flex" alignItems="center" justifyContent="space-between" mb={3}>
                <Box display="flex" alignItems="center" gap={1.5}>
                    <Avatar sx={{ bgcolor: "#b71c1c", width: 52, height: 52 }}>
                        <Bloodtype sx={{ fontSize: 26 }} />
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
                            Manage Blood Requests
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                            {requests.length} total request{requests.length !== 1 ? "s" : ""}
                        </Typography>
                    </Box>
                </Box>
            </Box>

            {/* Tabs */}
            <Paper
                elevation={0}
                sx={{ mb: 3, borderRadius: 3, border: `1px solid ${cardBorder}`, bgcolor: cardBg }}
            >
                <Tabs
                    value={tab}
                    onChange={(_, v) => setTab(v)}
                    variant="scrollable"
                    scrollButtons="auto"
                    sx={{
                        px: 1,
                        "& .MuiTab-root": { textTransform: "none", fontWeight: 600, fontSize: "0.85rem" },
                        "& .Mui-selected": { color: "#b71c1c" },
                        "& .MuiTabs-indicator": { bgcolor: "#b71c1c" },
                    }}
                >
                    {tabs.map((t) => (
                        <Tab
                            key={t}
                            value={t}
                            label={
                                <Box display="flex" alignItems="center" gap={0.8}>
                                    {t}
                                    <Chip
                                        label={countFor(t)}
                                        size="small"
                                        color={t === "All" ? "default" : getUrgencyColor(t)}
                                        sx={{ height: 18, fontSize: "0.68rem", fontWeight: 700 }}
                                    />
                                </Box>
                            }
                        />
                    ))}
                </Tabs>
            </Paper>

            {/* Table */}
            <TableContainer
                component={Paper}
                elevation={0}
                sx={{ borderRadius: 3, border: `1px solid ${cardBorder}`, bgcolor: cardBg }}
            >
                <Table>
                    <TableHead sx={{ bgcolor: headBg }}>
                        <TableRow>
                            {["Patient", "Hospital", "Blood Type", "Urgency", "Reason", "Contact", "Photo", "Actions"].map(
                                (h) => (
                                    <TableCell key={h} sx={{ fontWeight: 700, fontSize: "0.82rem", py: 1.5 }}>
                                        {h}
                                    </TableCell>
                                )
                            )}
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {filtered.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={8} align="center" sx={{ py: 6 }}>
                                    <Bloodtype sx={{ fontSize: 40, color: "text.disabled", mb: 1 }} />
                                    <Typography color="text.secondary" fontSize="0.9rem">
                                        No {tab !== "All" ? tab.toLowerCase() : ""} requests found.
                                    </Typography>
                                </TableCell>
                            </TableRow>
                        ) : (
                            filtered.map((req) => (
                                <TableRow
                                    key={req._id}
                                    hover
                                    sx={{ "&:nth-of-type(odd)": { bgcolor: isDark ? "rgba(255,255,255,0.02)" : "#fafafa" } }}
                                >
                                    <TableCell>
                                        <Typography fontWeight={600} fontSize="0.86rem">
                                            {req.patientName}
                                        </Typography>
                                    </TableCell>
                                    <TableCell sx={{ fontWeight: 600, fontSize: "0.85rem" }}>
                                        {req.hospitalName}
                                    </TableCell>
                                    <TableCell>
                                        <Chip
                                            label={req.bloodType}
                                            color="error"
                                            size="small"
                                            sx={{ fontWeight: 800, fontSize: "0.75rem" }}
                                        />
                                    </TableCell>
                                    <TableCell>
                                        <Chip
                                            label={req.urgency || "—"}
                                            color={getUrgencyColor(req.urgency)}
                                            size="small"
                                            sx={{ fontWeight: 700, fontSize: "0.75rem" }}
                                        />
                                    </TableCell>
                                    <TableCell sx={{ fontSize: "0.82rem", maxWidth: 180 }}>
                                        <Typography noWrap fontSize="0.82rem" title={req.reason}>
                                            {req.reason}
                                        </Typography>
                                    </TableCell>
                                    <TableCell sx={{ fontSize: "0.82rem" }}>{req.contact}</TableCell>
                                    <TableCell>
                                        <Tooltip title={req.photo ? "View photo" : "No photo"}>
                                            <Avatar
                                                src={req.photo ? `${BASE_URL}${req.photo}` : undefined}
                                                onClick={() => req.photo && setViewPhoto({ url: `${BASE_URL}${req.photo}`, name: req.patientName })}
                                                sx={{
                                                    width: 38,
                                                    height: 38,
                                                    bgcolor: "#b71c1c",
                                                    fontSize: "0.85rem",
                                                    fontWeight: 700,
                                                    cursor: req.photo ? "pointer" : "default",
                                                    border: req.photo ? "2px solid #b71c1c" : "2px solid transparent",
                                                    transition: "transform 0.15s",
                                                    "&:hover": req.photo ? { transform: "scale(1.12)" } : {},
                                                }}
                                            >
                                                {req.patientName?.charAt(0)?.toUpperCase()}
                                            </Avatar>
                                        </Tooltip>
                                    </TableCell>
                                    <TableCell>
                                        <Tooltip title="View Profile">
                                            <IconButton
                                                size="small"
                                                color="inherit"
                                                onClick={() => setViewProfile(req)}
                                            >
                                                <Visibility fontSize="small" />
                                            </IconButton>
                                        </Tooltip>
                                        <Tooltip title="Edit">
                                            <IconButton
                                                size="small"
                                                color="primary"
                                                onClick={() => handleEdit(req)}
                                            >
                                                <Edit fontSize="small" />
                                            </IconButton>
                                        </Tooltip>
                                        <Tooltip title="Delete">
                                            <IconButton
                                                size="small"
                                                color="error"
                                                onClick={() => handleDelete(req._id)}
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

            {/* Photo Preview Dialog */}
            <Dialog
                open={!!viewPhoto}
                onClose={() => setViewPhoto(null)}
                maxWidth="sm"
                fullWidth
                slotProps={{ paper: { sx: { borderRadius: 3, overflow: "hidden" } }}}
            >
                <DialogTitle sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", pb: 1 }}>
                    <Typography fontWeight={700}>{viewPhoto?.name}</Typography>
                    <IconButton size="small" onClick={() => setViewPhoto(null)}>
                        <Close fontSize="small" />
                    </IconButton>
                </DialogTitle>
                <DialogContent sx={{ p: 0 }}>
                    <Box
                        component="img"
                        src={viewPhoto?.url}
                        alt={viewPhoto?.name}
                        sx={{ width: "100%", maxHeight: 480, objectFit: "contain", display: "block", bgcolor: isDark ? "#111" : "#f5f5f5" }}
                    />
                </DialogContent>
            </Dialog>

            {/* View Profile Dialog */}
            <Dialog
                open={!!viewProfile}
                onClose={() => setViewProfile(null)}
                maxWidth="xs"
                fullWidth
                slotProps={{ paper: { sx: { borderRadius: 4, overflow: "hidden" } }}}
            >
                {viewProfile && (
                    <>
                        {/* Header with gradient */}
                        <Box sx={{
                            background: "linear-gradient(135deg, #b71c1c 0%, #d32f2f 100%)",
                            pt: 4, pb: 6, px: 3,
                            display: "flex", flexDirection: "column", alignItems: "center", gap: 1.5,
                            position: "relative",
                        }}>
                            <IconButton
                                size="small"
                                onClick={() => setViewProfile(null)}
                                sx={{ position: "absolute", top: 10, right: 10, color: "rgba(255,255,255,0.8)" }}
                            >
                                <Close fontSize="small" />
                            </IconButton>
                            <Avatar
                                src={viewProfile.photo ? `${BASE_URL}${viewProfile.photo}` : undefined}
                                onClick={() => viewProfile.photo && setViewPhoto({ url: `${BASE_URL}${viewProfile.photo}`, name: viewProfile.patientName })}
                                sx={{
                                    width: 90, height: 90,
                                    bgcolor: "rgba(255,255,255,0.25)",
                                    fontSize: "2.2rem", fontWeight: 800,
                                    border: "3px solid rgba(255,255,255,0.6)",
                                    cursor: viewProfile.photo ? "pointer" : "default",
                                    "&:hover": viewProfile.photo ? { transform: "scale(1.05)" } : {},
                                    transition: "transform 0.15s",
                                }}
                            >
                                {viewProfile.patientName?.charAt(0)?.toUpperCase()}
                            </Avatar>
                            <Box textAlign="center">
                                <Typography fontWeight={800} fontSize="1.1rem" color="#fff">
                                    {viewProfile.patientName}
                                </Typography>
                                <Box display="flex" gap={0.8} justifyContent="center" mt={0.5}>
                                    <Chip label={viewProfile.bloodType} size="small" sx={{ bgcolor: "rgba(255,255,255,0.2)", color: "#fff", fontWeight: 800, fontSize: "0.75rem" }} />
                                    <Chip label={viewProfile.urgency} size="small" color={getUrgencyColor(viewProfile.urgency)} sx={{ fontWeight: 700, fontSize: "0.75rem" }} />
                                </Box>
                            </Box>
                        </Box>

                        {/* Info cards pulled up over gradient */}
                        <Box sx={{ px: 2.5, pb: 2.5, mt: -3 }}>
                            <Paper elevation={3} sx={{ borderRadius: 3, overflow: "hidden" }}>
                                {[
                                    { icon: <LocalHospital fontSize="small" color="error" />, label: "Hospital", value: viewProfile.hospitalName },
                                    { icon: <Phone fontSize="small" color="error" />, label: "Contact", value: viewProfile.contact },
                                    { icon: <Bloodtype fontSize="small" color="error" />, label: "Reason", value: viewProfile.reason },
                                    { icon: <CalendarToday fontSize="small" color="error" />, label: "Submitted", value: viewProfile.createdAt ? new Date(viewProfile.createdAt).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" }) : "—" },
                                ].map((row, i, arr) => (
                                    <Box key={row.label} sx={{
                                        display: "flex", alignItems: "flex-start", gap: 1.5,
                                        px: 2, py: 1.5,
                                        borderBottom: i < arr.length - 1 ? `1px solid ${isDark ? "#2a2a2a" : "#f0f0f0"}` : "none",
                                    }}>
                                        <Box mt={0.2}>{row.icon}</Box>
                                        <Box>
                                            <Typography fontSize="0.7rem" color="text.disabled" fontWeight={600} textTransform="uppercase" letterSpacing="0.05em">
                                                {row.label}
                                            </Typography>
                                            <Typography fontSize="0.88rem" fontWeight={600}>
                                                {row.value}
                                            </Typography>
                                        </Box>
                                    </Box>
                                ))}
                            </Paper>

                            {!viewProfile.photo && (
                                <Typography fontSize="0.78rem" color="text.disabled" textAlign="center" mt={1.5}>
                                    No photo uploaded for this request
                                </Typography>
                            )}
                            {viewProfile.photo && (
                                <Button
                                    fullWidth
                                    variant="outlined"
                                    color="error"
                                    size="small"
                                    startIcon={<Visibility fontSize="small" />}
                                    onClick={() => setViewPhoto({ url: `${BASE_URL}${viewProfile.photo}`, name: viewProfile.patientName })}
                                    sx={{ mt: 1.5, borderRadius: 2, textTransform: "none", fontWeight: 600 }}
                                >
                                    View Full Photo
                                </Button>
                            )}
                        </Box>
                    </>
                )}
            </Dialog>

            {/* Edit Dialog */}
            <Dialog open={open} onClose={() => setOpen(false)} maxWidth="sm" fullWidth slotProps={{ paper: { sx: { borderRadius: 3 } }}}>
                <DialogTitle fontWeight={700}>Update Blood Request</DialogTitle>
                <DialogContent dividers>
                    {/* Photo uploader */}
                    <Box display="flex" flexDirection="column" alignItems="center" mb={3} mt={1}>
                        <Badge
                            overlap="circular"
                            anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
                            badgeContent={
                                <Tooltip title="Change photo">
                                    <IconButton
                                        size="small"
                                        onClick={() => fileInputRef.current?.click()}
                                        sx={{
                                            bgcolor: "#b71c1c",
                                            color: "white",
                                            width: 32,
                                            height: 32,
                                            border: "2px solid white",
                                            "&:hover": { bgcolor: "#d32f2f" },
                                        }}
                                    >
                                        <CameraAlt sx={{ fontSize: 16 }} />
                                    </IconButton>
                                </Tooltip>
                            }
                        >
                            <Avatar
                                src={photoPreview || undefined}
                                sx={{
                                    width: 100,
                                    height: 100,
                                    bgcolor: "#b71c1c",
                                    fontSize: "2rem",
                                    fontWeight: 700,
                                    border: "3px solid #ffcdd2",
                                    cursor: "pointer",
                                }}
                                onClick={() => fileInputRef.current?.click()}
                            >
                                {!photoPreview && formData.patientName?.charAt(0)?.toUpperCase()}
                            </Avatar>
                        </Badge>

                        <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/*"
                            style={{ display: "none" }}
                            onChange={handlePhotoChange}
                        />

                        <Box display="flex" gap={1} mt={1.5}>
                            <Button
                                size="small"
                                variant="outlined"
                                color="error"
                                onClick={() => fileInputRef.current?.click()}
                                sx={{ borderRadius: 2, textTransform: "none", fontSize: "0.78rem" }}
                            >
                                {photoPreview ? "Change Photo" : "Upload Photo"}
                            </Button>
                            {photoPreview && (
                                <Button
                                    size="small"
                                    variant="outlined"
                                    color="inherit"
                                    startIcon={<DeleteOutline />}
                                    onClick={handleRemovePhoto}
                                    sx={{ borderRadius: 2, textTransform: "none", fontSize: "0.78rem" }}
                                >
                                    Remove
                                </Button>
                            )}
                        </Box>
                        <Typography variant="caption" color="text.disabled" mt={0.5}>
                            JPG, PNG, WebP — max 5 MB
                        </Typography>
                    </Box>

                    <TextField fullWidth margin="dense" label="Hospital Name" name="hospitalName" value={formData.hospitalName} onChange={handleChange} variant="outlined" />
                    <TextField fullWidth margin="dense" label="Patient Name" name="patientName" value={formData.patientName} onChange={handleChange} variant="outlined" />
                    <FormControl fullWidth margin="dense">
                        <InputLabel>Blood Type</InputLabel>
                        <Select name="bloodType" value={formData.bloodType} onChange={handleChange} label="Blood Type">
                            {BLOOD_TYPES.map((t) => (
                                <MenuItem key={t} value={t}>{t}</MenuItem>
                            ))}
                        </Select>
                    </FormControl>
                    <FormControl fullWidth margin="dense">
                        <InputLabel>Urgency</InputLabel>
                        <Select name="urgency" value={formData.urgency} onChange={handleChange} label="Urgency" variant="outlined">
                            {URGENCY_LEVELS.map((u) => (
                                <MenuItem key={u} value={u}>{u}</MenuItem>
                            ))}
                        </Select>
                    </FormControl>
                    <TextField fullWidth margin="dense" label="Reason" name="reason" value={formData.reason} onChange={handleChange} multiline rows={2} variant="outlined" />
                    <TextField fullWidth margin="dense" label="Contact" name="contact" value={formData.contact} onChange={handleChange} variant="outlined" />
                </DialogContent>
                <DialogActions sx={{ px: 3, pb: 2.5 }}>
                    <Button onClick={() => setOpen(false)} color="inherit">Cancel</Button>
                    <Button
                        onClick={handleSubmit}
                        variant="contained"
                        color="error"
                        disabled={uploading}
                        sx={{ borderRadius: 2 }}
                    >
                        {uploading ? "Uploading…" : "Update"}
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default ManageRequests;
