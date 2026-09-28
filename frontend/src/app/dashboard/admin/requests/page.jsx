'use client';
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
    Typography, Paper, Table, TableBody, TableCell, TableHead, TableRow,
    IconButton, Button, Dialog, DialogActions, DialogContent, DialogTitle, TextField,
    Box, Tabs, Tab, Avatar, Badge, Tooltip, MenuItem, Select, FormControl,
    InputLabel, Alert, InputAdornment, Skeleton, CircularProgress, TablePagination, Autocomplete,
    useMediaQuery, useTheme,
} from "@mui/material";
import {
    Delete, Edit, Bloodtype, CameraAlt, DeleteOutline, Close, Visibility, LocalHospital,
    Phone, CalendarToday, CheckCircle, Cancel, HourglassEmpty, Search, Refresh,
    Assignment, WaterDrop, Notes, FilterAltOff, WarningAmber, Add,
} from "@mui/icons-material";
import axios from "axios";
import API_BASE_URL from "@/lib/config";
import { useAuth } from "@/store/AuthContext";
import { PageHeader, StatCard, StatusBadge, TableCard, EmptyState, ResponsiveGrid } from "@/components/ui";

const API_BASE = `${API_BASE_URL}/api/requests`;
const BASE_URL = API_BASE_URL;

// BloodLife AI palette for this page.
const C = { primary: "#B91C2C", dark: "#881D2A", surface: "#F8FAFC", ink: "#1E293B" };

const URGENCY_LEVELS = ["Low", "Medium", "High", "Critical"];
const BLOOD_TYPES = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];
const STATUSES = ["Pending", "Approved", "Rejected", "Fulfilled"];
const STATUS_TABS = ["All", "Pending", "Approved", "Rejected"];
const UNITS = Array.from({ length: 10 }, (_, i) => i + 1);
const urgencyOrder = { critical: 0, high: 1, medium: 2, low: 3 };
const MAX_PHOTO_SIZE = 10 * 1024 * 1024; // must match the multer limit in Backend/src/common/upload.js

const emptyForm = {
    hospitalName: "", patientName: "", bloodType: "",
    unitsNeeded: "", urgency: "", reason: "", contact: "", photo: null,
};
const noFilters = { bloodType: "", hospital: "", urgency: "", status: "" };

const reqStatus = (r) => r.status || "Pending";
const photoUrl = (r) => (r?.photo ? `${BASE_URL}${r.photo}` : undefined);
const formatDate = (d) => (d ? new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "—");
// The API answers with { error }, { message }, or express-validator's { errors: [{ msg }] }.
const apiError = (err, fallback) =>
    err.response?.data?.error || err.response?.data?.message || err.response?.data?.errors?.[0]?.msg || fallback;

// Badge colours for this page: green = approved / low, amber = pending / medium,
// orange = high, red = critical / rejected.
const STATUS_TONE  = { Pending: "warning", Approved: "success", Rejected: "error", Fulfilled: "info" };
const URGENCY_TONE = { Low: "success", Medium: "warning", High: "warning", Critical: "error" };
// The theme has no orange tone, so High gets its own colours on top of the amber one.
const highUrgencySx = (t) => {
    const dark = t.palette.mode === "dark";
    return { bgcolor: dark ? "rgba(234,88,12,0.18)" : "#FFEDD5", color: dark ? "#FDBA74" : "#C2410C", "&::before": { bgcolor: "#EA580C" } };
};

const RequestStatusBadge = ({ status, size }) => (
    <StatusBadge status={status} tone={STATUS_TONE[status] || "neutral"} size={size} />
);

const UrgencyBadge = ({ urgency, size }) => (
    <StatusBadge status={urgency || "Low"} label={urgency || "—"} tone={URGENCY_TONE[urgency] || "neutral"} size={size}
        sx={urgency === "High" ? highUrgencySx : urgency === "Critical" ? { fontWeight: 700 } : undefined} />
);

const BloodChip = ({ type }) => (
    <Box component="span" sx={{
        display: "inline-flex", alignItems: "center", gap: 0.4, px: 1, height: 24, borderRadius: 1.5,
        bgcolor: "rgba(185,28,44,0.08)", color: C.primary, fontWeight: 800, fontSize: "0.78rem",
        border: "1px solid rgba(185,28,44,0.18)",
    }}>
        <WaterDrop sx={{ fontSize: 13 }} />{type || "—"}
    </Box>
);

const PatientAvatar = ({ req, size = 38, onOpenPhoto }) => (
    <Avatar src={photoUrl(req)} alt={req.patientName}
        onClick={() => req.photo && onOpenPhoto?.({ url: photoUrl(req), name: req.patientName })}
        sx={{
            width: size, height: size, flexShrink: 0, fontSize: size * 0.4, fontWeight: 700,
            bgcolor: "rgba(185,28,44,0.1)", color: C.primary,
            cursor: req.photo ? "pointer" : "default",
        }}>
        {req.patientName?.charAt(0)?.toUpperCase()}
    </Avatar>
);

const ManageRequests = () => {
    const theme = useTheme();
    const isDark = theme.palette.mode === "dark";
    const isMobile = useMediaQuery(theme.breakpoints.down("md"));
    const isPhone = useMediaQuery(theme.breakpoints.down("sm"));
    const ink = isDark ? "text.primary" : C.ink;
    const { token } = useAuth();
    const authHeader = useCallback(() => ({ headers: { Authorization: `Bearer ${token}` } }), [token]);

    const [requests, setRequests]     = useState([]);
    const [loading, setLoading]       = useState(true);
    const [loadError, setLoadError]   = useState("");
    const [formData, setFormData]     = useState(emptyForm);
    const [editId, setEditId]         = useState(null);
    const [open, setOpen]             = useState(false);
    const [formError, setFormError]   = useState("");
    const [statusTab, setStatusTab]   = useState("All");
    const [search, setSearch]         = useState("");
    const [filters, setFilters]       = useState(noFilters);
    const [photoPreview, setPhotoPreview] = useState(null);
    const [photoFile, setPhotoFile]   = useState(null);
    const [uploading, setUploading]   = useState(false);
    const fileInputRef                = useRef(null);
    const [viewPhoto, setViewPhoto]   = useState(null);
    const [viewProfile, setViewProfile] = useState(null);
    const [actionError, setActionError] = useState("");
    const [busyId, setBusyId]         = useState(null);
    const [confirmDelete, setConfirmDelete] = useState(null);
    const [deleting, setDeleting]     = useState(false);
    const [page, setPage]             = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(10);

    const fetchRequests = useCallback(async () => {
        if (!token) return;
        setLoading(true);
        setLoadError("");
        try {
            const res = await axios.get(API_BASE, authHeader());
            setRequests(Array.isArray(res.data) ? res.data : []);
        } catch (err) {
            setLoadError(apiError(err, "Couldn't load blood requests. Check that the server is running."));
        } finally {
            setLoading(false);
        }
    }, [authHeader, token]);

    useEffect(() => { fetchRequests(); }, [fetchRequests]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    const handlePhotoChange = (e) => {
        const file = e.target.files[0];
        e.target.value = ""; // so picking the same file again still fires onChange
        if (!file) return;
        if (file.size > MAX_PHOTO_SIZE) { setFormError("Image is too large — max 10 MB."); return; }
        setFormError("");
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
        setBusyId(id);
        try {
            const res = await axios.put(`${API_BASE}/${id}`, { status }, authHeader());
            setRequests(prev => prev.map(r => r._id === id ? res.data : r));
            if (viewProfile?._id === id) setViewProfile(res.data);
        } catch (err) {
            setActionError(apiError(err, "Failed to update status."));
        } finally {
            setBusyId(null);
        }
    };

    // One dialog for both: editId set = edit (PUT), null = new request (POST, the same route the public form uses).
    const handleSubmit = async () => {
        const { hospitalName, patientName, bloodType, unitsNeeded, urgency, reason, contact } = formData;
        if (!hospitalName.trim() || !patientName.trim() || !reason.trim() || !bloodType || !unitsNeeded || !urgency) {
            setFormError("Please fill in patient, hospital, blood type, units, urgency and reason.");
            return;
        }
        setFormError("");
        setUploading(true);
        const body = {
            hospitalName: hospitalName.trim(), patientName: patientName.trim(), bloodType,
            unitsNeeded, urgency, reason: reason.trim(), contact: contact.trim(),
        };
        // "Remove" on an existing photo clears it; a newly picked file is uploaded below instead.
        const photoRemoved = editId && !formData.photo && !photoFile
            && requests.find(r => r._id === editId)?.photo;
        if (photoRemoved) body.photo = null;
        let id = editId;
        try {
            if (editId) {
                await axios.put(`${API_BASE}/${editId}`, body, authHeader());
            } else {
                const res = await axios.post(API_BASE, body, authHeader());
                id = res.data._id;
            }
        } catch (err) {
            setFormError(apiError(err, editId ? "Failed to update request." : "Failed to create request."));
            setUploading(false);
            return;
        }
        if (photoFile) {
            try {
                const fd = new FormData();
                fd.append("photo", photoFile);
                await axios.post(`${API_BASE}/${id}/photo`, fd, authHeader());
            } catch {
                setActionError(`Request ${editId ? "updated" : "created"}, but the photo upload failed.`);
            }
        }
        setUploading(false);
        await fetchRequests();
        setFormData(emptyForm);
        setEditId(null);
        setPhotoFile(null);
        setPhotoPreview(null);
        setOpen(false);
    };

    const handleDelete = async () => {
        if (!confirmDelete) return;
        setDeleting(true);
        setActionError("");
        try {
            await axios.delete(`${API_BASE}/${confirmDelete._id}`, authHeader());
            setRequests(prev => prev.filter(r => r._id !== confirmDelete._id));
            if (viewProfile?._id === confirmDelete._id) setViewProfile(null);
            setConfirmDelete(null);
        } catch (err) {
            setActionError(apiError(err, "Failed to delete request."));
            setConfirmDelete(null);
        } finally {
            setDeleting(false);
        }
    };

    const handleCreate = () => {
        setFormData({ ...emptyForm, unitsNeeded: 1, urgency: "Medium" });
        setEditId(null);
        setPhotoPreview(null);
        setPhotoFile(null);
        setFormError("");
        setOpen(true);
    };

    const handleEdit = (req) => {
        setFormData({
            hospitalName: req.hospitalName || "",
            patientName:  req.patientName  || "",
            bloodType:    req.bloodType    || "",
            unitsNeeded:  req.unitsNeeded  || "",
            urgency:      req.urgency      || "",
            reason:       req.reason       || "",
            contact:      req.contact      || "",
            photo:        req.photo        || null,
        });
        setEditId(req._id);
        setPhotoPreview(photoUrl(req) || null);
        setPhotoFile(null);
        setFormError("");
        setViewProfile(null);
        setOpen(true);
    };

    // Hospital filter options come from the requests themselves — no extra API call.
    const hospitalOptions = useMemo(
        () => [...new Set(requests.map(r => r.hospitalName).filter(Boolean))].sort((a, b) => a.localeCompare(b)),
        [requests],
    );

    const countFor = (s) => (s === "All" ? requests.length : requests.filter(r => reqStatus(r) === s).length);

    const filtered = useMemo(() => {
        const q = search.trim().toLowerCase();
        return requests
            .filter(r => statusTab === "All" || reqStatus(r) === statusTab)
            .filter(r => !filters.status || reqStatus(r) === filters.status)
            .filter(r => !filters.bloodType || r.bloodType === filters.bloodType)
            .filter(r => !filters.hospital || r.hospitalName === filters.hospital)
            .filter(r => !filters.urgency || r.urgency === filters.urgency)
            .filter(r => !q || [r.patientName, r.hospitalName, r.reason, r.contact, r.bloodType]
                .some(v => v && String(v).toLowerCase().includes(q)))
            .sort((a, b) =>
                ((urgencyOrder[a.urgency?.toLowerCase()] ?? 4) - (urgencyOrder[b.urgency?.toLowerCase()] ?? 4))
                || (new Date(b.createdAt) - new Date(a.createdAt)));
    }, [requests, statusTab, filters, search]);

    // Back to the first page whenever the tab, search or filters change the result set.
    useEffect(() => { setPage(0); }, [statusTab, filters, search]);
    // A delete can empty the last page; show the new last page instead of an empty one.
    const lastPage = Math.max(0, Math.ceil(filtered.length / rowsPerPage) - 1);
    const currentPage = Math.min(page, lastPage);
    const pageRows = filtered.slice(currentPage * rowsPerPage, (currentPage + 1) * rowsPerPage);

    const filtersActive = !!search.trim() || Object.values(filters).some(Boolean);
    const clearFilters = () => { setSearch(""); setFilters(noFilters); };
    const setFilter = (key) => (e) => setFilters(f => ({ ...f, [key]: e.target.value }));

    // ── Row actions (shared by the table and the mobile cards) ─────────────────
    // Approve / Reject only apply to a request still awaiting review.
    const renderActions = (req) => {
        const pending = reqStatus(req) === "Pending";
        const busy = busyId === req._id;
        const who = req.patientName || "this patient";
        const iconSx = (color) => ({
            color, borderRadius: 2, "&:hover": { bgcolor: `${color}14` },
            "&.Mui-disabled": { color: "action.disabled" },
            "&:focus-visible": { outline: `2px solid ${color}`, outlineOffset: 1 },
        });
        const action = (title, label, icon, color, onClick) => (
            <Tooltip title={title} arrow>
                <span>
                    <IconButton size="small" aria-label={label} disabled={busy} onClick={onClick} sx={iconSx(color)}>
                        {icon}
                    </IconButton>
                </span>
            </Tooltip>
        );
        return (
            <Box role="group" aria-label={`Actions for ${who}`} display="flex" alignItems="center" justifyContent="flex-end" gap={0.25} flexShrink={0}>
                {pending && (
                    <>
                        {busy ? (
                            <Box sx={{ width: 68, display: "flex", justifyContent: "center" }}><CircularProgress size={18} aria-label="Updating status" /></Box>
                        ) : (
                            <>
                                {action("Approve request", `Approve request for ${who}`, <CheckCircle fontSize="small" />, "#16a34a", () => handleSetStatus(req._id, "Approved"))}
                                {action("Reject request", `Reject request for ${who}`, <Cancel fontSize="small" />, "#dc2626", () => handleSetStatus(req._id, "Rejected"))}
                            </>
                        )}
                        <Box aria-hidden="true" sx={{ width: "1px", height: 20, bgcolor: "divider", mx: 0.5 }} />
                    </>
                )}
                {action("View details", `View request for ${who}`, <Visibility fontSize="small" />, "#475569", () => setViewProfile(req))}
                {action("Edit request", `Edit request for ${who}`, <Edit fontSize="small" />, "#2563eb", () => handleEdit(req))}
                {action("Delete request", `Delete request for ${who}`, <Delete fontSize="small" />, C.primary, () => setConfirmDelete(req))}
            </Box>
        );
    };

    const emptyState = (
        <EmptyState
            icon={filtersActive ? <FilterAltOff /> : <Bloodtype />}
            title={filtersActive ? "No requests match your filters" : `No ${statusTab !== "All" ? statusTab.toLowerCase() + " " : ""}requests yet`}
            description={filtersActive ? "Try a different search term or clear the filters." : "New blood requests submitted by patients and hospitals will appear here."}
            action={filtersActive
                ? <Button size="small" variant="outlined" onClick={clearFilters}>Clear filters</Button>
                : <Button size="small" variant="contained" startIcon={<Add />} onClick={handleCreate}>New Request</Button>}
        />
    );

    const errorState = (
        <EmptyState
            icon={<WarningAmber />}
            title="Couldn't load requests"
            description={loadError}
            action={<Button size="small" variant="contained" startIcon={<Refresh />} onClick={fetchRequests}>Try again</Button>}
        />
    );

    const statusTabs = (
        <Tabs value={statusTab} onChange={(_, v) => setStatusTab(v)} variant="scrollable" scrollButtons="auto"
            sx={{
                minHeight: 40,
                "& .MuiTab-root": { minHeight: 40, textTransform: "none", fontWeight: 600, fontSize: "0.88rem", px: 1.5 },
                "& .Mui-selected": { color: `${C.primary} !important` },
                "& .MuiTabs-indicator": { bgcolor: C.primary, height: 3, borderRadius: 3 },
            }}>
            {STATUS_TABS.map(t => (
                <Tab key={t} value={t} label={
                    <Box display="flex" alignItems="center" gap={0.8}>
                        {t}
                        <Box component="span" sx={{
                            px: 0.9, minWidth: 22, height: 20, borderRadius: 10, fontSize: "0.7rem", fontWeight: 700,
                            display: "inline-flex", alignItems: "center", justifyContent: "center",
                            bgcolor: statusTab === t ? C.primary : "action.hover",
                            color: statusTab === t ? "#fff" : "text.secondary",
                        }}>
                            {loading ? "·" : countFor(t)}
                        </Box>
                    </Box>
                } />
            ))}
        </Tabs>
    );

    const filterBar = (
        <Box display="grid" gap={1.5}
            gridTemplateColumns={{ xs: "1fr", sm: "1fr 1fr", lg: "minmax(220px, 2fr) repeat(4, minmax(120px, 1fr)) auto" }}>
            <TextField size="small" placeholder="Search patient, hospital, reason…" value={search}
                onChange={e => setSearch(e.target.value)}
                sx={{ gridColumn: { sm: "1 / -1", lg: "auto" } }}
                slotProps={{ input: {
                    startAdornment: <InputAdornment position="start"><Search fontSize="small" /></InputAdornment>,
                    endAdornment: search && (
                        <InputAdornment position="end">
                            <IconButton size="small" aria-label="Clear search" onClick={() => setSearch("")}><Close fontSize="small" /></IconButton>
                        </InputAdornment>
                    ),
                } }} />
            {[
                { key: "bloodType", label: "Blood Type", options: BLOOD_TYPES },
                { key: "hospital",  label: "Hospital",   options: hospitalOptions },
                { key: "urgency",   label: "Urgency",    options: URGENCY_LEVELS },
                { key: "status",    label: "Status",     options: STATUSES },
            ].map(f => (
                <FormControl key={f.key} size="small" fullWidth>
                    <InputLabel>{f.label}</InputLabel>
                    <Select label={f.label} value={filters[f.key]} onChange={setFilter(f.key)}>
                        <MenuItem value="">All</MenuItem>
                        {f.options.map(o => <MenuItem key={o} value={o}>{o}</MenuItem>)}
                    </Select>
                </FormControl>
            ))}
            <Button variant="text" color="inherit" startIcon={<FilterAltOff />} onClick={clearFilters} disabled={!filtersActive}
                sx={{ color: "text.secondary", whiteSpace: "nowrap", justifySelf: { xs: "start", lg: "auto" } }}>
                Clear
            </Button>
        </Box>
    );

    const toolbar = (
        <Box display="flex" flexDirection="column" gap={1.5}>
            <Box display="flex" alignItems="center" justifyContent="space-between" gap={2} flexWrap="wrap"
                sx={{ mx: { xs: -2, md: -3 }, mt: -1.5, px: { xs: 1, md: 2 }, borderBottom: 1, borderColor: "divider" }}>
                {statusTabs}
            </Box>
            {filterBar}
        </Box>
    );

    const skeletonRows = Array.from({ length: 5 });

    return (
        <Box sx={{ color: ink }}>
            <PageHeader
                eyebrow="BloodLife AI · Admin"
                title="Blood Requests"
                subtitle="Review, approve and manage blood requests from patients and partner hospitals."
                actions={
                    <>
                        <Button variant="outlined" startIcon={loading ? <CircularProgress size={16} /> : <Refresh />}
                            onClick={fetchRequests} disabled={loading}>
                            Refresh
                        </Button>
                        <Button variant="contained" startIcon={<Add />} onClick={handleCreate}>
                            New Request
                        </Button>
                    </>
                }
            />

            {/* Summary cards */}
            <ResponsiveGrid min={150} gap={{ xs: 1.5, md: 2.5 }} sx={{ mb: 3 }}>
                <StatCard label="Total Requests" value={requests.length} icon={<Assignment />} tone="primary" loading={loading} hint="All time" />
                <StatCard label="Pending" value={countFor("Pending")} icon={<HourglassEmpty />} tone="warning" loading={loading} hint="Awaiting review" />
                <StatCard label="Approved" value={countFor("Approved")} icon={<CheckCircle />} tone="success" loading={loading} hint="Ready to fulfil" />
                <StatCard label="Rejected" value={countFor("Rejected")} icon={<Cancel />} tone="error" loading={loading} hint="Declined requests" />
            </ResponsiveGrid>

            {actionError && (
                <Alert severity="error" onClose={() => setActionError("")} sx={{ mb: 2 }}>
                    {actionError}
                </Alert>
            )}

            <TableCard minWidth={isMobile ? 0 : 1040} toolbar={toolbar} sx={{ "& .MuiTableCell-head": { bgcolor: isDark ? undefined : C.surface } }}
            >
                {loadError ? errorState : isMobile ? (
                    /* Mobile / tablet: one card per request */
                    <Box sx={{ p: 2, display: "flex", flexDirection: "column", gap: 1.5 }}>
                        {loading ? skeletonRows.map((_, i) => (
                            <Skeleton key={i} variant="rounded" height={132} />
                        )) : filtered.length === 0 ? emptyState : pageRows.map(req => (
                            <Paper key={req._id} variant="outlined" sx={{ p: 2, borderRadius: 3 }}>
                                <Box display="flex" alignItems="flex-start" gap={1.5}>
                                    <PatientAvatar req={req} size={42} onOpenPhoto={setViewPhoto} />
                                    <Box flex={1} minWidth={0}>
                                        <Box display="flex" alignItems="center" justifyContent="space-between" gap={1}>
                                            <Typography fontWeight={700} noWrap>{req.patientName || "—"}</Typography>
                                            <RequestStatusBadge status={reqStatus(req)} size="small" />
                                        </Box>
                                        <Typography variant="body2" color="text.secondary" noWrap display="flex" alignItems="center" gap={0.5}>
                                            <LocalHospital sx={{ fontSize: 15 }} />{req.hospitalName || "—"}
                                        </Typography>
                                    </Box>
                                </Box>
                                <Box display="flex" flexWrap="wrap" alignItems="center" gap={1} mt={1.5}>
                                    <BloodChip type={req.bloodType} />
                                    <Typography variant="body2" fontWeight={600}>{req.unitsNeeded ?? "—"} unit{req.unitsNeeded === 1 ? "" : "s"}</Typography>
                                    <UrgencyBadge urgency={req.urgency} size="small" />
                                    <Typography variant="caption" color="text.secondary" ml="auto">{formatDate(req.createdAt)}</Typography>
                                </Box>
                                {req.reason && (
                                    <Typography variant="body2" color="text.secondary" mt={1} sx={{
                                        display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden",
                                    }}>
                                        {req.reason}
                                    </Typography>
                                )}
                                <Box display="flex" justifyContent="flex-end" mt={1} pt={1} borderTop={1} borderColor="divider">
                                    {renderActions(req)}
                                </Box>
                            </Paper>
                        ))}
                    </Box>
                ) : (
                    <Table size="small">
                        <TableHead>
                            <TableRow>
                                {["Patient", "Hospital", "Blood Type", "Units", "Urgency", "Status", "Date", "Reason", "Actions"].map(h => (
                                    <TableCell key={h} align={h === "Units" ? "center" : h === "Actions" ? "right" : "left"} sx={{ py: 1.5, whiteSpace: "nowrap" }}>{h}</TableCell>
                                ))}
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {loading ? skeletonRows.map((_, i) => (
                                <TableRow key={i}>
                                    <TableCell colSpan={9} sx={{ py: 1.5 }}><Skeleton variant="rounded" height={36} /></TableCell>
                                </TableRow>
                            )) : filtered.length === 0 ? (
                                <TableRow><TableCell colSpan={9} sx={{ border: 0 }}>{emptyState}</TableCell></TableRow>
                            ) : pageRows.map(req => (
                                <TableRow key={req._id} hover sx={req.urgency === "Critical" && reqStatus(req) === "Pending"
                                    ? { boxShadow: `inset 3px 0 0 ${C.primary}` } : undefined}>
                                    <TableCell sx={{ py: 1.25 }}>
                                        <Box display="flex" alignItems="center" gap={1.25}>
                                            <PatientAvatar req={req} onOpenPhoto={setViewPhoto} />
                                            <Box minWidth={0}>
                                                <Typography fontWeight={700} fontSize="0.86rem" noWrap maxWidth={160}>{req.patientName || "—"}</Typography>
                                                {req.contact && (
                                                    <Typography fontSize="0.72rem" color="text.secondary" noWrap maxWidth={160}>{req.contact}</Typography>
                                                )}
                                            </Box>
                                        </Box>
                                    </TableCell>
                                    <TableCell sx={{ maxWidth: 170 }}>
                                        <Typography noWrap fontSize="0.85rem" fontWeight={600} title={req.hospitalName}>{req.hospitalName || "—"}</Typography>
                                    </TableCell>
                                    <TableCell><BloodChip type={req.bloodType} /></TableCell>
                                    <TableCell align="center" sx={{ fontWeight: 700 }}>{req.unitsNeeded ?? "—"}</TableCell>
                                    <TableCell><UrgencyBadge urgency={req.urgency} size="small" /></TableCell>
                                    <TableCell><RequestStatusBadge status={reqStatus(req)} size="small" /></TableCell>
                                    <TableCell sx={{ whiteSpace: "nowrap", color: "text.secondary", fontSize: "0.82rem" }}>{formatDate(req.createdAt)}</TableCell>
                                    <TableCell sx={{ maxWidth: 200 }}>
                                        <Typography noWrap fontSize="0.82rem" color="text.secondary" title={req.reason}>{req.reason || "—"}</Typography>
                                    </TableCell>
                                    <TableCell align="right" sx={{ width: 1, whiteSpace: "nowrap" }}>{renderActions(req)}</TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                )}
                {!loadError && !loading && filtered.length > 0 && (
                    <TablePagination
                        component="div"
                        count={filtered.length}
                        page={currentPage}
                        onPageChange={(_, p) => setPage(p)}
                        rowsPerPage={rowsPerPage}
                        onRowsPerPageChange={e => { setRowsPerPage(parseInt(e.target.value, 10)); setPage(0); }}
                        rowsPerPageOptions={[10, 25, 50]}
                        labelRowsPerPage={isPhone ? "Rows" : "Rows per page"}
                        sx={{ borderTop: 1, borderColor: "divider", "& .MuiTablePagination-toolbar": { px: { xs: 1, md: 2 } } }}
                    />
                )}
            </TableCard>

            {/* Photo preview */}
            <Dialog open={!!viewPhoto} onClose={() => setViewPhoto(null)} maxWidth="sm" fullWidth>
                <DialogTitle sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", pb: 1 }}>
                    <Typography fontWeight={700} component="span">{viewPhoto?.name}</Typography>
                    <IconButton size="small" aria-label="Close" onClick={() => setViewPhoto(null)}><Close fontSize="small" /></IconButton>
                </DialogTitle>
                <DialogContent sx={{ p: 0 }}>
                    <Box component="img" src={viewPhoto?.url} alt={viewPhoto?.name}
                        sx={{ width: "100%", maxHeight: 480, objectFit: "contain", display: "block", bgcolor: isDark ? "#111" : C.surface }} />
                </DialogContent>
            </Dialog>

            {/* View details */}
            <Dialog open={!!viewProfile} onClose={() => setViewProfile(null)} maxWidth="xs" fullWidth fullScreen={isPhone}>
                {viewProfile && (
                    <>
                        <Box sx={{
                            background: `linear-gradient(135deg, ${C.primary} 0%, ${C.dark} 100%)`,
                            pt: 3.5, pb: 3, px: 3, position: "relative",
                            display: "flex", flexDirection: "column", alignItems: "center", gap: 1.2,
                        }}>
                            <IconButton size="small" aria-label="Close" onClick={() => setViewProfile(null)}
                                sx={{ position: "absolute", top: 10, right: 10, color: "rgba(255,255,255,0.85)" }}>
                                <Close fontSize="small" />
                            </IconButton>
                            <Avatar src={photoUrl(viewProfile)}
                                onClick={() => viewProfile.photo && setViewPhoto({ url: photoUrl(viewProfile), name: viewProfile.patientName })}
                                sx={{
                                    width: 80, height: 80, bgcolor: "rgba(255,255,255,0.2)", fontSize: "2rem", fontWeight: 800,
                                    border: "3px solid rgba(255,255,255,0.5)", cursor: viewProfile.photo ? "pointer" : "default",
                                }}>
                                {viewProfile.patientName?.charAt(0)?.toUpperCase()}
                            </Avatar>
                            <Typography fontWeight={800} fontSize="1.1rem" color="#fff" textAlign="center">{viewProfile.patientName}</Typography>
                            <Box display="flex" gap={0.75} justifyContent="center" flexWrap="wrap">
                                <Box component="span" sx={{ px: 1.25, height: 24, borderRadius: 999, display: "inline-flex", alignItems: "center",
                                    bgcolor: "rgba(255,255,255,0.2)", color: "#fff", fontWeight: 800, fontSize: "0.75rem" }}>
                                    {viewProfile.bloodType}
                                </Box>
                                <UrgencyBadge urgency={viewProfile.urgency} size="small" />
                                <RequestStatusBadge status={reqStatus(viewProfile)} size="small" />
                            </Box>
                        </Box>

                        <DialogContent sx={{ p: 2.5 }}>
                            <Box sx={{ border: 1, borderColor: "divider", borderRadius: 2.5, overflow: "hidden", mb: 2 }}>
                                {[
                                    { icon: <LocalHospital />, label: "Hospital",     value: viewProfile.hospitalName },
                                    { icon: <Bloodtype />,     label: "Units Needed", value: viewProfile.unitsNeeded },
                                    { icon: <Phone />,         label: "Contact",      value: viewProfile.contact },
                                    { icon: <Notes />,         label: "Reason",       value: viewProfile.reason },
                                    { icon: <CalendarToday />, label: "Submitted",    value: formatDate(viewProfile.createdAt) },
                                ].map((row, i, arr) => (
                                    <Box key={row.label} sx={{
                                        display: "flex", alignItems: "flex-start", gap: 1.5, px: 2, py: 1.4,
                                        bgcolor: i % 2 ? (isDark ? "#0d0d0d" : C.surface) : "background.paper",
                                        borderBottom: i < arr.length - 1 ? 1 : 0, borderColor: "divider",
                                    }}>
                                        <Box mt={0.3} flexShrink={0} sx={{ color: C.primary, display: "flex", "& svg": { fontSize: 18 } }}>{row.icon}</Box>
                                        <Box flex={1} minWidth={0}>
                                            <Typography fontSize="0.68rem" color="text.secondary" fontWeight={700}
                                                textTransform="uppercase" letterSpacing="0.06em" mb={0.2}>{row.label}</Typography>
                                            <Typography fontSize="0.875rem" fontWeight={600} sx={{ wordBreak: "break-word" }}>{row.value || "—"}</Typography>
                                        </Box>
                                    </Box>
                                ))}
                            </Box>

                            {reqStatus(viewProfile) === "Pending" && (
                                <Box display="flex" gap={1.5} mb={1.5}>
                                    <Button fullWidth variant="contained" color="success" startIcon={<CheckCircle />}
                                        disabled={busyId === viewProfile._id}
                                        onClick={() => handleSetStatus(viewProfile._id, "Approved")}>
                                        Approve
                                    </Button>
                                    <Button fullWidth variant="contained" color="error" startIcon={<Cancel />}
                                        disabled={busyId === viewProfile._id}
                                        onClick={() => handleSetStatus(viewProfile._id, "Rejected")}>
                                        Reject
                                    </Button>
                                </Box>
                            )}
                            <Box display="flex" gap={1.5}>
                                <Button fullWidth variant="outlined" startIcon={<Edit />} onClick={() => handleEdit(viewProfile)}>Edit</Button>
                                <Button fullWidth variant="outlined" color="error" startIcon={<Delete />} onClick={() => setConfirmDelete(viewProfile)}>Delete</Button>
                            </Box>
                            {viewProfile.photo && (
                                <Button fullWidth size="small" startIcon={<Visibility fontSize="small" />} sx={{ mt: 1.5 }}
                                    onClick={() => setViewPhoto({ url: photoUrl(viewProfile), name: viewProfile.patientName })}>
                                    View full photo
                                </Button>
                            )}
                        </DialogContent>
                    </>
                )}
            </Dialog>

            {/* Delete confirmation */}
            <Dialog open={!!confirmDelete} onClose={() => !deleting && setConfirmDelete(null)} maxWidth="xs" fullWidth>
                <DialogTitle sx={{ display: "flex", alignItems: "center", gap: 1.5, fontWeight: 800 }}>
                    <Box sx={{ width: 40, height: 40, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center",
                        bgcolor: "rgba(185,28,44,0.1)", color: C.primary }}>
                        <Delete />
                    </Box>
                    Delete this request?
                </DialogTitle>
                <DialogContent>
                    <Typography variant="body2" color="text.secondary">
                        The request for <b>{confirmDelete?.patientName}</b> ({confirmDelete?.bloodType}, {confirmDelete?.unitsNeeded} unit
                        {confirmDelete?.unitsNeeded === 1 ? "" : "s"}) at {confirmDelete?.hospitalName} will be permanently removed. This can&apos;t be undone.
                    </Typography>
                </DialogContent>
                <DialogActions sx={{ px: 3, pb: 2.5 }}>
                    <Button color="inherit" onClick={() => setConfirmDelete(null)} disabled={deleting}>Cancel</Button>
                    <Button variant="contained" color="error" onClick={handleDelete} disabled={deleting}
                        startIcon={deleting ? <CircularProgress size={16} color="inherit" /> : <Delete />}>
                        Delete
                    </Button>
                </DialogActions>
            </Dialog>

            {/* New / Edit dialog */}
            <Dialog open={open} onClose={() => !uploading && setOpen(false)} maxWidth="sm" fullWidth fullScreen={isPhone}>
                <DialogTitle fontWeight={800}>
                    {editId ? "Edit Blood Request" : "New Blood Request"}
                    {!editId && (
                        <Typography variant="body2" color="text.secondary" mt={0.5}>
                            The request starts as Pending. Fields marked * are required.
                        </Typography>
                    )}
                </DialogTitle>
                <DialogContent dividers>
                    <Box display="flex" flexDirection="column" alignItems="center" mb={2.5} mt={1}>
                        <Badge overlap="circular" anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
                            badgeContent={
                                <Tooltip title="Change photo">
                                    <IconButton size="small" aria-label="Change photo" onClick={() => fileInputRef.current?.click()}
                                        sx={{ bgcolor: C.primary, color: "white", width: 32, height: 32,
                                            border: "2px solid white", "&:hover": { bgcolor: C.dark } }}>
                                        <CameraAlt sx={{ fontSize: 16 }} />
                                    </IconButton>
                                </Tooltip>
                            }>
                            <Avatar src={photoPreview || undefined}
                                sx={{ width: 96, height: 96, bgcolor: "rgba(185,28,44,0.1)", color: C.primary, fontSize: "2rem", fontWeight: 700, cursor: "pointer" }}
                                onClick={() => fileInputRef.current?.click()}>
                                {!photoPreview && formData.patientName?.charAt(0)?.toUpperCase()}
                            </Avatar>
                        </Badge>
                        <input ref={fileInputRef} type="file" accept="image/*" style={{ display: "none" }} onChange={handlePhotoChange} />
                        <Box display="flex" gap={1} mt={1.5}>
                            <Button size="small" variant="outlined" onClick={() => fileInputRef.current?.click()}>
                                {photoPreview ? "Change Photo" : "Upload Photo"}
                            </Button>
                            {photoPreview && (
                                <Button size="small" variant="outlined" color="inherit" startIcon={<DeleteOutline />} onClick={handleRemovePhoto}>
                                    Remove
                                </Button>
                            )}
                        </Box>
                        <Typography variant="caption" color="text.secondary" mt={0.5}>JPG, PNG, WebP — max 10 MB</Typography>
                    </Box>

                    <Box display="grid" gridTemplateColumns={{ xs: "1fr", sm: "1fr 1fr" }} gap={2}>
                        <TextField fullWidth label="Patient Name" name="patientName" value={formData.patientName} onChange={handleChange} required />
                        {/* Suggests hospitals already used in requests; any name can still be typed */}
                        <Autocomplete freeSolo options={hospitalOptions} value={formData.hospitalName}
                            onInputChange={(_, v) => setFormData(prev => ({ ...prev, hospitalName: v }))}
                            renderInput={(params) => <TextField {...params} label="Hospital Name" required />} />
                        <FormControl fullWidth required>
                            <InputLabel>Blood Type</InputLabel>
                            <Select name="bloodType" value={formData.bloodType} onChange={handleChange} label="Blood Type">
                                {BLOOD_TYPES.map(t => <MenuItem key={t} value={t}>{t}</MenuItem>)}
                            </Select>
                        </FormControl>
                        <FormControl fullWidth required>
                            <InputLabel>Units Needed</InputLabel>
                            <Select name="unitsNeeded" value={formData.unitsNeeded} onChange={handleChange} label="Units Needed">
                                {UNITS.map(u => <MenuItem key={u} value={u}>{u}</MenuItem>)}
                            </Select>
                        </FormControl>
                        <FormControl fullWidth required>
                            <InputLabel>Urgency</InputLabel>
                            <Select name="urgency" value={formData.urgency} onChange={handleChange} label="Urgency">
                                {URGENCY_LEVELS.map(u => <MenuItem key={u} value={u}>{u}</MenuItem>)}
                            </Select>
                        </FormControl>
                        <TextField fullWidth label="Contact" name="contact" value={formData.contact} onChange={handleChange} />
                        <TextField fullWidth label="Reason" name="reason" value={formData.reason} onChange={handleChange} multiline rows={3} required
                            sx={{ gridColumn: "1 / -1" }} />
                    </Box>
                    {formError && <Alert severity="error" sx={{ mt: 2 }}>{formError}</Alert>}
                </DialogContent>
                <DialogActions sx={{ px: 3, py: 2 }}>
                    <Button onClick={() => setOpen(false)} color="inherit" disabled={uploading}>Cancel</Button>
                    <Button onClick={handleSubmit} variant="contained" disabled={uploading}
                        startIcon={uploading ? <CircularProgress size={16} color="inherit" /> : null}>
                        {uploading ? "Saving…" : editId ? "Save Changes" : "Create Request"}
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default ManageRequests;
