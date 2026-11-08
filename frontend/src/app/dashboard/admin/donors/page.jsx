'use client';
import { useI18n, useT } from '@/i18n/I18nProvider';
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Typography, Paper, Table, TableBody, TableCell, TableHead, TableRow, TablePagination,
  IconButton, Dialog, DialogTitle, DialogContent, TextField, DialogActions, Button,
  Box, Switch, Tooltip, FormControl, InputLabel, Select, MenuItem, InputAdornment, Avatar,
  Badge, Alert, CircularProgress, Skeleton, Snackbar, FormControlLabel,
  useMediaQuery, useTheme,
} from "@mui/material";
import {
  Delete, Edit, Bloodtype, PersonAdd, Search, CameraAlt, DeleteOutline, Close, Refresh,
  Visibility, People, CheckCircle, EventAvailable, VolunteerActivism, WaterDrop, Phone,
  Email, LocationOn, CalendarToday, FilterAltOff, WarningAmber, Download, History,
} from "@mui/icons-material";
import axios from "axios";
import API_BASE, { uploadUrl } from "@/lib/config";
import { apiErrorMessage } from "@/lib/api-error";
import { formatDate, localToday, telHref } from "@/lib/format";
import { eligibilityOf } from "@/lib/eligibility";
import { useAuth } from "@/store/AuthContext";
import { PageHeader, StatCard, StatusBadge, TableCard, EmptyState, ResponsiveGrid } from "@/components/ui";

const API = `${API_BASE}/api/donors`;

// BloodLife AI palette (same as the admin Requests page).
const C = { primary: "#C91D32", dark: "#A91529", surface: "#F8FAFC", ink: "#172B4D" };

const BLOOD_TYPES = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];
const MAX_PHOTO_SIZE = 10 * 1024 * 1024; // must match Backend/src/donor/donor.routes.js multer limit
const PHONE_RE = /^0\d{9,10}$/;          // must match Backend/src/donor/donor.model.js
const EMAIL_RE = /\S+@\S+\.\S+/;

// Labels: adm.donors.availability.<value> and adm.donors.sorts.<value>
const AVAILABILITY = ["all", "available", "ready", "unavailable"].map((value) => ({ value }));
const SORTS = ["recent", "name", "donations", "lastDonation"].map((value) => ({ value }));

const emptyDonor = {
  fullName: "", email: "", phone: "", bloodType: "", location: "",
  available: true, lastDonation: "", photo: null,
};

const isReady = (d) => d.available && eligibilityOf(d.lastDonation).eligible;
const daysUntil = (date) => Math.max(1, Math.ceil((date.getTime() - Date.now()) / 86400000));

const BloodChip = ({ type }) => (
  <Box component="span" sx={{
    display: "inline-flex", alignItems: "center", gap: 0.4, px: 1, height: 24, borderRadius: 1.5,
    bgcolor: "rgba(201,29,50,0.08)", color: C.primary, fontWeight: 800, fontSize: "0.78rem",
    border: "1px solid rgba(201,29,50,0.18)",
  }}>
    <WaterDrop sx={{ fontSize: 13 }} />{type || "—"}
  </Box>
);

// "Eligible" or "In 12 days", using the same 56-day rule as the backend.
const EligibilityBadge = ({ lastDonation, size = "small" }) => {
  const t = useT();
  const { eligible, nextDate } = eligibilityOf(lastDonation);
  return eligible
    ? <StatusBadge status="eligible" label={t('adm.donors.eligible')} tone="success" size={size} />
    : (
      <Tooltip title={t('adm.donors.eligibleAgain', { date: formatDate(nextDate) })} arrow>
        <span><StatusBadge status="waiting" label={t('adm.donors.inDays', { count: daysUntil(nextDate) })} tone="warning" size={size} /></span>
      </Tooltip>
    );
};

const DonorAvatar = ({ donor, size = 38 }) => (
  <Avatar src={uploadUrl(donor?.photo)} alt={donor?.fullName}
    sx={{ width: size, height: size, flexShrink: 0, fontSize: size * 0.4, fontWeight: 700, bgcolor: "rgba(201,29,50,0.1)", color: C.primary }}>
    {donor?.fullName?.charAt(0)?.toUpperCase()}
  </Avatar>
);

// Spreadsheet-safe CSV cell: quoted, and formula-looking text neutralised.
const csvCell = (v) => {
  const s = String(v ?? "");
  return `"${(/^[=+\-@]/.test(s) ? `'${s}` : s).replace(/"/g, '""')}"`;
};

const ManageDonors = () => {
  const { t, rich } = useI18n();
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const isPhone = useMediaQuery(theme.breakpoints.down("sm"));
  const ink = isDark ? "text.primary" : C.ink;
  const { token } = useAuth();
  const authHeader = useCallback(() => ({ headers: { Authorization: `Bearer ${token}` } }), [token]);

  const [donors, setDonors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [actionError, setActionError] = useState("");
  const [toast, setToast] = useState("");

  // Filters
  const [search, setSearch] = useState("");
  const [bloodFilter, setBloodFilter] = useState("");
  const [availability, setAvailability] = useState("all");
  const [sort, setSort] = useState("recent");
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  // Dialogs
  const [open, setOpen] = useState(false);
  const [selectedDonor, setSelectedDonor] = useState(null);
  const [formErrors, setFormErrors] = useState({});
  const [formError, setFormError] = useState("");
  const [viewDonor, setViewDonor] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [togglingId, setTogglingId] = useState(null);

  // Photo
  const [photoPreview, setPhotoPreview] = useState(null);
  const [photoFile, setPhotoFile] = useState(null);
  const [photoError, setPhotoError] = useState("");
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const fileInputRef = useRef(null);

  // ?q=… (e.g. from the Messages page's "View Donor Profile") pre-fills the search.
  useEffect(() => {
    const q = new URLSearchParams(window.location.search).get("q")?.trim();
    if (q) setSearch(q);
  }, []);

  const fetchDonors = useCallback(async () => {
    setLoading(true);
    try {
      const res = await axios.get(API, authHeader());
      setDonors(Array.isArray(res.data) ? res.data : []);
      setLoadError("");
    } catch (err) {
      setLoadError(err);
    } finally {
      setLoading(false);
    }
  }, [authHeader]);

  useEffect(() => { fetchDonors(); }, [fetchDonors]);

  // Free the preview's object URL when it is replaced or the dialog closes.
  useEffect(() => () => { if (photoPreview?.startsWith("blob:")) URL.revokeObjectURL(photoPreview); }, [photoPreview]);

  // ── Derived data ──
  const stats = useMemo(() => ({
    total: donors.length,
    available: donors.filter((d) => d.available).length,
    ready: donors.filter(isReady).length,
    donations: donors.reduce((sum, d) => sum + (d.donationCount || 0), 0),
  }), [donors]);

  const bloodCounts = useMemo(() => {
    const counts = Object.fromEntries(BLOOD_TYPES.map((t) => [t, 0]));
    donors.forEach((d) => { if (d.bloodType in counts) counts[d.bloodType] += 1; });
    return counts;
  }, [donors]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    const list = donors.filter((d) =>
      (!q || [d.fullName, d.email, d.phone, d.bloodType, d.location].some((v) => v?.toLowerCase().includes(q))) &&
      (!bloodFilter || d.bloodType === bloodFilter) &&
      (availability === "all" ||
        (availability === "available" && d.available) ||
        (availability === "unavailable" && !d.available) ||
        (availability === "ready" && isReady(d)))
    );
    const time = (v) => (v ? new Date(v).getTime() || 0 : 0);
    const sorters = {
      recent: (a, b) => time(b.createdAt) - time(a.createdAt),
      name: (a, b) => (a.fullName || "").localeCompare(b.fullName || ""),
      donations: (a, b) => (b.donationCount || 0) - (a.donationCount || 0),
      lastDonation: (a, b) => time(b.lastDonation) - time(a.lastDonation),
    };
    return list.sort(sorters[sort]);
  }, [donors, search, bloodFilter, availability, sort]);

  const filtersActive = Boolean(search.trim() || bloodFilter || availability !== "all");
  const clearFilters = () => { setSearch(""); setBloodFilter(""); setAvailability("all"); };

  // Back to page 1 whenever the result set changes shape.
  useEffect(() => { setPage(0); }, [search, bloodFilter, availability, sort]);
  const lastPage = Math.max(0, Math.ceil(filtered.length / rowsPerPage) - 1);
  const currentPage = Math.min(page, lastPage);
  const pageRows = filtered.slice(currentPage * rowsPerPage, (currentPage + 1) * rowsPerPage);

  // ── Add / edit ──
  const openDialog = (donor) => {
    setViewDonor(null);
    setSelectedDonor({ ...emptyDonor, ...donor });
    setPhotoPreview(uploadUrl(donor.photo) || null);
    setPhotoFile(null);
    setPhotoError("");
    setFormErrors({});
    setFormError("");
    setOpen(true);
  };
  const closeDialog = () => { if (!saving) setOpen(false); };

  const handleEditChange = (e) => {
    const { name, value } = e.target;
    setSelectedDonor((prev) => ({ ...prev, [name]: value }));
    if (formErrors[name]) setFormErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setPhotoError(t('adm.donors.photoType'));
    } else if (file.size > MAX_PHOTO_SIZE) {
      setPhotoError(t('adm.donors.photoSize', { max: MAX_PHOTO_SIZE / (1024 * 1024) }));
    } else {
      setPhotoError("");
      setPhotoFile(file);
      setPhotoPreview(URL.createObjectURL(file));
      return;
    }
    e.target.value = "";
  };

  const handleRemovePhoto = () => {
    setPhotoFile(null);
    setPhotoPreview(null);
    setPhotoError("");
    setSelectedDonor((prev) => ({ ...prev, photo: null }));
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const validate = (d) => {
    const errs = {};
    if (!d.fullName?.trim()) errs.fullName = t('adm.donors.errors.fullName');
    if (!d.email?.trim()) errs.email = t('adm.donors.errors.email');
    else if (!EMAIL_RE.test(d.email)) errs.email = t('adm.donors.errors.emailInvalid');
    if (!d.phone?.trim()) errs.phone = t('adm.donors.errors.phone');
    else if (!PHONE_RE.test(d.phone.trim())) errs.phone = t('adm.donors.errors.phoneInvalid');
    if (!d.bloodType) errs.bloodType = t('adm.donors.errors.bloodType');
    if (!d.location?.trim()) errs.location = t('adm.donors.errors.location');
    if (d.lastDonation && String(d.lastDonation).slice(0, 10) > localToday()) errs.lastDonation = t('adm.donors.errors.future');
    return errs;
  };

  const handleSave = async () => {
    if (!selectedDonor) return;
    const errs = validate(selectedDonor);
    setFormErrors(errs);
    if (Object.keys(errs).length) return;

    const { fullName, email, phone, bloodType, location, lastDonation, available } = selectedDonor;
    const body = {
      fullName: fullName.trim(), email: email.trim(), phone: phone.trim(), bloodType,
      location: location.trim(), lastDonation: lastDonation || null, available,
    };
    const isEdit = Boolean(selectedDonor._id);
    setSaving(true);
    setFormError("");
    try {
      const res = isEdit
        ? await axios.put(`${API}/${selectedDonor._id}`, body, authHeader())
        : await axios.post(API, body);
      const saved = res.data;

      if (isEdit && selectedDonor.photo === null && !photoFile) {
        await axios.delete(`${API}/${saved._id}/photo`, authHeader()).catch(() => {});
      }
      if (photoFile && saved._id) {
        setUploading(true);
        const formData = new FormData();
        formData.append("photo", photoFile);
        await axios.post(`${API}/${saved._id}/photo`, formData, authHeader());
      }

      setOpen(false);
      setToast(isEdit ? t('adm.donors.toast.updated', { name: body.fullName }) : t('adm.donors.toast.added', { name: body.fullName }));
      fetchDonors();
    } catch (err) {
      setFormError(err.response?.status === 401
        ? t('adm.donors.sessionExpired')
        : apiErrorMessage(err, t('adm.donors.saveFailed')));
    } finally {
      setUploading(false);
      setSaving(false);
    }
  };

  // ── Quick availability switch ──
  const toggleAvailable = async (donor) => {
    const next = !donor.available;
    setTogglingId(donor._id);
    setDonors((prev) => prev.map((d) => (d._id === donor._id ? { ...d, available: next } : d)));
    try {
      await axios.put(`${API}/${donor._id}`, { available: next }, authHeader());
      setToast(t(next ? 'adm.donors.toast.markedAvailable' : 'adm.donors.toast.markedUnavailable', { name: donor.fullName }));
    } catch (err) {
      setDonors((prev) => prev.map((d) => (d._id === donor._id ? { ...d, available: !next } : d)));
      setActionError(apiErrorMessage(err, t('adm.donors.availFailed')));
    } finally {
      setTogglingId(null);
    }
  };

  // ── Delete ──
  const handleDelete = async () => {
    if (!confirmDelete) return;
    setDeleting(true);
    try {
      await axios.delete(`${API}/${confirmDelete._id}`, authHeader());
      setDonors((prev) => prev.filter((d) => d._id !== confirmDelete._id));
      setToast(t('adm.donors.toast.deleted', { name: confirmDelete.fullName }));
      setConfirmDelete(null);
      setViewDonor(null);
      setActionError("");
    } catch (err) {
      setActionError(apiErrorMessage(err, t('adm.donors.deleteFailed')));
      setConfirmDelete(null);
    } finally {
      setDeleting(false);
    }
  };

  // ── Export what's currently listed ──
  const exportCsv = () => {
    const header = ['name', 'email', 'phone', 'bloodType', 'location', 'available', 'donations', 'lastDonation', 'registered'].map((k) => t(`adm.donors.csv.${k}`));
    const rows = filtered.map((d) => [
      d.fullName, d.email, d.phone, d.bloodType, d.location, d.available ? t('adm.donors.csv.yes') : t('adm.donors.csv.no'),
      d.donationCount || 0, d.lastDonation ? d.lastDonation.slice(0, 10) : "", d.createdAt ? d.createdAt.slice(0, 10) : "",
    ]);
    const csv = [header, ...rows].map((r) => r.map(csvCell).join(",")).join("\r\n");
    const url = URL.createObjectURL(new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8" }));
    const a = Object.assign(document.createElement("a"), { href: url, download: `donors-${localToday()}.csv` });
    a.click();
    URL.revokeObjectURL(url);
  };

  // ── Pieces ──
  const renderActions = (donor) => {
    const iconSx = (color) => ({
      color, borderRadius: 2, "&:hover": { bgcolor: `${color}14` },
      "&:focus-visible": { outline: `2px solid ${color}`, outlineOffset: 1 },
    });
    const action = (title, icon, color, onClick) => (
      <Tooltip title={title} arrow>
        <IconButton size="small" aria-label={`${title}: ${donor.fullName}`} onClick={onClick} sx={iconSx(color)}>{icon}</IconButton>
      </Tooltip>
    );
    return (
      <Box role="group" aria-label={t('adm.donors.actionsFor', { name: donor.fullName })} display="flex" justifyContent="flex-end" gap={0.25}>
        {action("View details", <Visibility fontSize="small" />, "#475569", () => setViewDonor(donor))}
        {action(t('adm.donors.editDonor'), <Edit fontSize="small" />, "#2563eb", () => openDialog(donor))}
        {action(t('adm.donors.deleteDonor'), <Delete fontSize="small" />, C.primary, () => setConfirmDelete(donor))}
      </Box>
    );
  };

  const availabilitySwitch = (donor) => (
    <Tooltip title={donor.available ? t('adm.donors.toggleOff') : t('adm.donors.toggleOn')} arrow>
      <Switch size="small" color="success" checked={!!donor.available} disabled={togglingId === donor._id}
        onChange={() => toggleAvailable(donor)}
        sx={{ "& .MuiSwitch-switchBase:not(.Mui-checked) .MuiSwitch-thumb": { bgcolor: "#94A3B8" }, "& .MuiSwitch-switchBase:not(.Mui-checked) + .MuiSwitch-track": { bgcolor: "#CBD5E1", opacity: 1 } }}
        slotProps={{ input: { "aria-label": t(donor.available ? 'adm.donors.isAvailable' : 'adm.donors.isUnavailable', { name: donor.fullName }) } }} />
    </Tooltip>
  );

  const bloodChips = (
    <Box display="flex" gap={0.75} flexWrap="wrap" role="group" aria-label={t('adm.donors.filterByBloodType')}>
      {["", ...BLOOD_TYPES].map((t) => {
        const active = bloodFilter === t;
        return (
          <Box key={t || "all"} component="button" type="button" onClick={() => setBloodFilter(t)} aria-pressed={active}
            sx={{
              display: "inline-flex", alignItems: "center", gap: 0.6, px: 1.25, height: 30, borderRadius: 999,
              border: 1, cursor: "pointer", font: "inherit", fontSize: "0.8rem", fontWeight: 700,
              borderColor: active ? C.primary : "divider",
              bgcolor: active ? C.primary : "background.paper",
              color: active ? "#fff" : "text.primary",
              transition: "all .15s ease",
              "&:hover": { borderColor: C.primary },
              "&:focus-visible": { outline: `2px solid ${C.primary}`, outlineOffset: 2 },
            }}>
            {t || "All types"}
            <Box component="span" sx={{ fontSize: "0.7rem", fontWeight: 700, opacity: active ? 0.85 : 0.55 }}>
              {loading ? "·" : t ? bloodCounts[t] : donors.length}
            </Box>
          </Box>
        );
      })}
    </Box>
  );

  const toolbar = (
    <Box display="flex" flexDirection="column" gap={1.5}>
      <Box display="grid" gap={1.5} gridTemplateColumns={{ xs: "1fr", sm: "1fr 1fr", lg: "minmax(240px, 2fr) repeat(2, minmax(160px, 1fr)) auto" }}>
        <TextField size="small" placeholder={t('adm.donors.searchNameEmailPhone')} value={search}
          onChange={(e) => setSearch(e.target.value)} sx={{ gridColumn: { sm: "1 / -1", lg: "auto" } }}
          slotProps={{ input: {
            startAdornment: <InputAdornment position="start"><Search fontSize="small" /></InputAdornment>,
            endAdornment: search && (
              <InputAdornment position="end">
                <IconButton size="small" aria-label={t('adm.donors.clearSearch')} onClick={() => setSearch("")}><Close fontSize="small" /></IconButton>
              </InputAdornment>
            ),
          } }} />
        <FormControl size="small" fullWidth>
          <InputLabel>{t('adm.donors.availabilityLabel')}</InputLabel>
          <Select label={t('adm.donors.availabilityLabel')} value={availability} onChange={(e) => setAvailability(e.target.value)}>
            {AVAILABILITY.map((o) => <MenuItem key={o.value} value={o.value}>{t(`adm.donors.availability.${o.value}`)}</MenuItem>)}
          </Select>
        </FormControl>
        <FormControl size="small" fullWidth>
          <InputLabel>{t('adm.donors.sortBy')}</InputLabel>
          <Select label={t('adm.donors.sortBy')} value={sort} onChange={(e) => setSort(e.target.value)}>
            {SORTS.map((o) => <MenuItem key={o.value} value={o.value}>{t(`adm.donors.sorts.${o.value}`)}</MenuItem>)}
          </Select>
        </FormControl>
        <Button variant="text" color="inherit" startIcon={<FilterAltOff />} onClick={clearFilters} disabled={!filtersActive}
          sx={{ color: "text.secondary", whiteSpace: "nowrap", justifySelf: { xs: "start", lg: "auto" } }}>
          {t('adm.donors.clear')}
        </Button>
      </Box>
      {bloodChips}
    </Box>
  );

  const emptyState = (
    <EmptyState
      icon={filtersActive ? <FilterAltOff /> : <Bloodtype />}
      title={filtersActive ? t('adm.donors.noMatch') : t('adm.donors.noneYet')}
      description={filtersActive ? t('adm.donors.tryDifferent') : t('adm.donors.emptyText')}
      action={filtersActive
        ? <Button size="small" variant="outlined" onClick={clearFilters}>{t('adm.donors.clearFilters')}</Button>
        : <Button size="small" variant="contained" startIcon={<PersonAdd />} onClick={() => openDialog(emptyDonor)}>{t('adm.donors.addDonor')}</Button>}
    />
  );

  const errorState = (
    <EmptyState icon={<WarningAmber />} title={t('adm.donors.couldnTLoadDonors')} description={apiErrorMessage(loadError, t('adm.donors.loadFailed'))}
      action={<Button size="small" variant="contained" startIcon={<Refresh />} onClick={fetchDonors}>{t('adm.donors.tryAgain')}</Button>} />
  );

  const skeletonRows = Array.from({ length: 5 });
  const headers = ["donor", "bloodType", "contact", "donations", "lastDonation", "available", "actions"];

  return (
    <Box sx={{ color: ink }}>
      <PageHeader
        eyebrow={`BloodLife AI · ${t('adm.donors.admin')}`}
        title={t('adm.donors.manageDonors')}
        subtitle={t('adm.donors.keepDonorDetailsUp')}
        actions={
          <>
            <Button variant="outlined" startIcon={loading ? <CircularProgress size={16} /> : <Refresh />} onClick={fetchDonors} disabled={loading}>
              {t('adm.donors.refresh')}
            </Button>
            <Button variant="outlined" startIcon={<Download />} onClick={exportCsv} disabled={loading || filtered.length === 0}>
              {t('adm.donors.exportCsv')}
            </Button>
            <Button variant="contained" startIcon={<PersonAdd />} onClick={() => openDialog(emptyDonor)}>
              {t('adm.donors.addDonor2')}
            </Button>
          </>
        }
      />

      <ResponsiveGrid min={150} gap={{ xs: 1.5, md: 2.5 }} sx={{ mb: 3 }}>
        <StatCard label={t('adm.donors.donors')} value={stats.total} icon={<People />} tone="primary" loading={loading} hint={isPhone ? undefined : t('adm.donors.hints.registered')} />
        <StatCard label={t('adm.donors.available')} value={stats.available} icon={<CheckCircle />} tone="success" loading={loading} hint={isPhone ? undefined : t('adm.donors.hints.willing')} />
        <StatCard label={t('adm.donors.ready')} value={stats.ready} icon={<EventAvailable />} tone="info" loading={loading} hint={isPhone ? undefined : t('adm.donors.hints.today')} />
        <StatCard label={t('adm.donors.donations')} value={stats.donations} icon={<VolunteerActivism />} tone="warning" loading={loading} hint={isPhone ? undefined : t('adm.donors.hints.recorded')} />
      </ResponsiveGrid>

      {actionError && (
        <Alert severity="error" onClose={() => setActionError("")} sx={{ mb: 2 }}>{actionError}</Alert>
      )}

      <TableCard minWidth={isMobile ? 0 : 860} toolbar={toolbar} sx={{ "& .MuiTableCell-head": { bgcolor: isDark ? undefined : C.surface } }}>
        {loadError ? errorState : isMobile ? (
          /* Phone / tablet: one card per donor */
          <Box sx={{ p: 2, display: "flex", flexDirection: "column", gap: 1.5 }}>
            {loading ? skeletonRows.map((_, i) => <Skeleton key={i} variant="rounded" height={128} />)
              : filtered.length === 0 ? emptyState : pageRows.map((donor) => (
                <Paper key={donor._id} variant="outlined" sx={{ p: 2, borderRadius: 3 }}>
                  <Box display="flex" alignItems="center" gap={1.5}>
                    <DonorAvatar donor={donor} size={44} />
                    <Box flex={1} minWidth={0}>
                      <Typography fontWeight={700} noWrap>{donor.fullName}</Typography>
                      <Typography variant="body2" color="text.secondary" noWrap display="flex" alignItems="center" gap={0.5}>
                        <LocationOn sx={{ fontSize: 15 }} />{donor.location || "—"}
                      </Typography>
                    </Box>
                    {availabilitySwitch(donor)}
                  </Box>
                  <Box display="flex" flexWrap="wrap" alignItems="center" gap={1} mt={1.5}>
                    <BloodChip type={donor.bloodType} />
                    <EligibilityBadge lastDonation={donor.lastDonation} />
                    <Typography variant="caption" color="text.secondary" ml="auto">
                      {donor.donationCount || 0} donation{donor.donationCount === 1 ? "" : "s"}
                    </Typography>
                  </Box>
                  <Box display="flex" alignItems="center" justifyContent="space-between" mt={1} pt={1} borderTop={1} borderColor="divider">
                    {donor.phone
                      ? <Button size="small" href={telHref(donor.phone)} startIcon={<Phone fontSize="small" />} sx={{ color: "text.secondary" }}>{donor.phone}</Button>
                      : <span />}
                    {renderActions(donor)}
                  </Box>
                </Paper>
              ))}
          </Box>
        ) : (
          <Table size="small">
            <TableHead>
              <TableRow>
                {headers.map((h) => (
                  <TableCell key={h} align={h === "donations" || h === "available" ? "center" : h === "actions" ? "right" : "left"}
                    sx={{ py: 1.5, whiteSpace: "nowrap" }}>{t(`adm.donors.cols.${h}`)}</TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? skeletonRows.map((_, i) => (
                <TableRow key={i}><TableCell colSpan={headers.length} sx={{ py: 1.5 }}><Skeleton variant="rounded" height={36} /></TableCell></TableRow>
              )) : filtered.length === 0 ? (
                <TableRow><TableCell colSpan={headers.length} sx={{ border: 0 }}>{emptyState}</TableCell></TableRow>
              ) : pageRows.map((donor) => (
                <TableRow key={donor._id} hover>
                  <TableCell sx={{ py: 1.25 }}>
                    <Box display="flex" alignItems="center" gap={1.25} sx={{ cursor: "pointer" }} onClick={() => setViewDonor(donor)}>
                      <DonorAvatar donor={donor} />
                      <Box minWidth={0}>
                        <Typography fontWeight={700} fontSize="0.86rem" noWrap maxWidth={190}>{donor.fullName}</Typography>
                        <Typography fontSize="0.74rem" color="text.secondary" noWrap maxWidth={190} title={donor.email}>{donor.email}</Typography>
                      </Box>
                    </Box>
                  </TableCell>
                  <TableCell><BloodChip type={donor.bloodType} /></TableCell>
                  <TableCell sx={{ maxWidth: 170 }}>
                    <Typography fontSize="0.84rem" noWrap>
                      {donor.phone ? <Box component="a" href={telHref(donor.phone)} sx={{ color: "inherit", textDecoration: "none", "&:hover": { color: C.primary } }}>{donor.phone}</Box> : "—"}
                    </Typography>
                    <Typography fontSize="0.76rem" color="text.secondary" noWrap title={donor.location} display="flex" alignItems="center" gap={0.4}>
                      <LocationOn sx={{ fontSize: 13 }} />{donor.location || "—"}
                    </Typography>
                  </TableCell>
                  <TableCell align="center" sx={{ fontWeight: 700 }}>{donor.donationCount || 0}</TableCell>
                  <TableCell sx={{ whiteSpace: "nowrap" }}>
                    <Typography fontSize="0.8rem" color="text.secondary" mb={0.4}>{formatDate(donor.lastDonation, t('adm.donors.never'))}</Typography>
                    <EligibilityBadge lastDonation={donor.lastDonation} />
                  </TableCell>
                  <TableCell align="center">{availabilitySwitch(donor)}</TableCell>
                  <TableCell align="right" sx={{ width: 1, whiteSpace: "nowrap" }}>{renderActions(donor)}</TableCell>
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
            onRowsPerPageChange={(e) => { setRowsPerPage(parseInt(e.target.value, 10)); setPage(0); }}
            rowsPerPageOptions={[10, 25, 50]}
            labelRowsPerPage={t(isPhone ? 'ui.pagination.rows' : 'ui.pagination.rowsPerPage')}
            sx={{ borderTop: 1, borderColor: "divider", "& .MuiTablePagination-toolbar": { px: { xs: 1, md: 2 } } }}
          />
        )}
      </TableCard>

      {/* Donor details */}
      <Dialog open={!!viewDonor} onClose={() => setViewDonor(null)} maxWidth="xs" fullWidth fullScreen={isPhone}>
        {viewDonor && (() => {
          const history = [...(viewDonor.donationHistory || [])].sort((a, b) => new Date(b.date) - new Date(a.date));
          return (
            <>
              <Box sx={{
                background: `linear-gradient(135deg, ${C.primary} 0%, ${C.dark} 100%)`, pt: 3.5, pb: 3, px: 3, position: "relative",
                display: "flex", flexDirection: "column", alignItems: "center", gap: 1.2,
              }}>
                <IconButton size="small" aria-label={t('adm.donors.close')} onClick={() => setViewDonor(null)}
                  sx={{ position: "absolute", top: 10, right: 10, color: "rgba(255,255,255,0.85)" }}>
                  <Close fontSize="small" />
                </IconButton>
                <Avatar src={uploadUrl(viewDonor.photo)} alt={viewDonor.fullName}
                  sx={{ width: 84, height: 84, bgcolor: "rgba(255,255,255,0.2)", fontSize: "2rem", fontWeight: 800, border: "3px solid rgba(255,255,255,0.5)" }}>
                  {viewDonor.fullName?.charAt(0)?.toUpperCase()}
                </Avatar>
                <Typography fontWeight={800} fontSize="1.1rem" color="#fff" textAlign="center">{viewDonor.fullName}</Typography>
                <Box display="flex" gap={0.75} justifyContent="center" flexWrap="wrap">
                  <Box component="span" sx={{ px: 1.25, height: 24, borderRadius: 999, display: "inline-flex", alignItems: "center", bgcolor: "rgba(255,255,255,0.2)", color: "#fff", fontWeight: 800, fontSize: "0.75rem" }}>
                    {viewDonor.bloodType}
                  </Box>
                  <StatusBadge status="availability" label={viewDonor.available ? t('adm.donors.availability.available') : t('adm.donors.availability.unavailable')} tone={viewDonor.available ? "success" : "neutral"} size="small" />
                  <EligibilityBadge lastDonation={viewDonor.lastDonation} />
                </Box>
              </Box>
              <DialogContent sx={{ p: 2.5 }}>
                <Box sx={{ border: 1, borderColor: "divider", borderRadius: 2.5, overflow: "hidden", mb: 2 }}>
                  {[
                    { icon: <Email />, label: t('adm.donors.rows.email'), value: viewDonor.email, href: viewDonor.email && `mailto:${viewDonor.email}` },
                    { icon: <Phone />, label: t('adm.donors.rows.phone'), value: viewDonor.phone, href: telHref(viewDonor.phone) },
                    { icon: <LocationOn />, label: t('adm.donors.rows.location'), value: viewDonor.location },
                    { icon: <VolunteerActivism />, label: t('adm.donors.rows.donations'), value: String(viewDonor.donationCount || 0) },
                    { icon: <CalendarToday />, label: t('adm.donors.rows.lastDonation'), value: formatDate(viewDonor.lastDonation, t('adm.donors.never')) },
                    { icon: <CalendarToday />, label: t('adm.donors.rows.registered'), value: formatDate(viewDonor.createdAt) },
                  ].map((row, i, arr) => (
                    <Box key={row.label} sx={{
                      display: "flex", alignItems: "flex-start", gap: 1.5, px: 2, py: 1.3,
                      bgcolor: i % 2 ? (isDark ? "#0B1220" : C.surface) : "background.paper",
                      borderBottom: i < arr.length - 1 ? 1 : 0, borderColor: "divider",
                    }}>
                      <Box mt={0.3} flexShrink={0} sx={{ color: C.primary, display: "flex", "& svg": { fontSize: 18 } }}>{row.icon}</Box>
                      <Box flex={1} minWidth={0}>
                        <Typography fontSize="0.68rem" color="text.secondary" fontWeight={700} textTransform="uppercase" letterSpacing="0.06em" mb={0.2}>{row.label}</Typography>
                        <Typography fontSize="0.875rem" fontWeight={600} sx={{ wordBreak: "break-word", color: "inherit", textDecoration: "none" }}
                          {...(row.href ? { component: "a", href: row.href } : {})}>
                          {row.value || "—"}
                        </Typography>
                      </Box>
                    </Box>
                  ))}
                </Box>

                <Typography fontSize="0.78rem" fontWeight={700} color="text.secondary" textTransform="uppercase" letterSpacing="0.06em" display="flex" alignItems="center" gap={0.75} mb={1}>
                  <History sx={{ fontSize: 16 }} /> {t('adm.donors.donationHistory')}
                </Typography>
                {history.length === 0 ? (
                  <Typography variant="body2" color="text.secondary" mb={2}>{t('adm.donors.noDonationsRecordedYet')}</Typography>
                ) : (
                  <Box sx={{ mb: 2, maxHeight: 200, overflowY: "auto", border: 1, borderColor: "divider", borderRadius: 2.5 }}>
                    {history.map((h, i) => (
                      <Box key={h._id || i} sx={{ display: "flex", justifyContent: "space-between", gap: 1, px: 2, py: 1, borderBottom: i < history.length - 1 ? 1 : 0, borderColor: "divider" }}>
                        <Box minWidth={0}>
                          <Typography fontSize="0.84rem" fontWeight={600}>{formatDate(h.date)}</Typography>
                          {(h.location || h.notes) && (
                            <Typography fontSize="0.74rem" color="text.secondary" noWrap>{[h.location, h.notes].filter(Boolean).join(" · ")}</Typography>
                          )}
                        </Box>
                        <Typography fontSize="0.8rem" fontWeight={700} color={C.primary} flexShrink={0}>{h.units || 1} unit{(h.units || 1) === 1 ? "" : "s"}</Typography>
                      </Box>
                    ))}
                  </Box>
                )}

                <Box display="flex" gap={1.5}>
                  <Button fullWidth variant="outlined" startIcon={<Edit />} onClick={() => openDialog(viewDonor)}>{t('adm.donors.edit')}</Button>
                  <Button fullWidth variant="outlined" color="error" startIcon={<Delete />} onClick={() => setConfirmDelete(viewDonor)}>{t('adm.donors.delete')}</Button>
                </Box>
              </DialogContent>
            </>
          );
        })()}
      </Dialog>

      {/* Delete confirmation */}
      <Dialog open={!!confirmDelete} onClose={() => !deleting && setConfirmDelete(null)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ display: "flex", alignItems: "center", gap: 1.5, fontWeight: 800 }}>
          <Box sx={{ width: 40, height: 40, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", bgcolor: "rgba(201,29,50,0.1)", color: C.primary }}>
            <Delete />
          </Box>
          {t('adm.donors.deleteThisDonor')}
        </DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary">
            {rich('adm.donors.deleteText', { name: <b>{confirmDelete?.fullName}</b> }, { type: confirmDelete?.bloodType })}
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5 }}>
          <Button color="inherit" onClick={() => setConfirmDelete(null)} disabled={deleting}>{t('adm.donors.cancel')}</Button>
          <Button variant="contained" color="error" onClick={handleDelete} disabled={deleting}
            startIcon={deleting ? <CircularProgress size={16} color="inherit" /> : <Delete />}>
            {t('adm.donors.delete')}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Add / edit */}
      <Dialog open={open} onClose={closeDialog} maxWidth="sm" fullWidth fullScreen={isPhone}>
        <DialogTitle fontWeight={800}>
          {selectedDonor?._id ? t('adm.donors.editTitle') : t('adm.donors.addTitle')}
          <Typography variant="body2" color="text.secondary" mt={0.5}>{t('adm.donors.fieldsMarkedAreRequired')}</Typography>
        </DialogTitle>
        <DialogContent dividers>
          {selectedDonor && (
            <>
              <Box display="flex" flexDirection="column" alignItems="center" mb={2.5} mt={1}>
                <Badge overlap="circular" anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
                  badgeContent={
                    <Tooltip title={t('adm.donors.changePhoto')}>
                      <IconButton size="small" aria-label={t('adm.donors.changePhoto')} onClick={() => fileInputRef.current?.click()}
                        sx={{ bgcolor: C.primary, color: "white", width: 32, height: 32, border: "2px solid white", "&:hover": { bgcolor: C.dark } }}>
                        <CameraAlt sx={{ fontSize: 16 }} />
                      </IconButton>
                    </Tooltip>
                  }>
                  <Avatar src={photoPreview || undefined} alt=""
                    sx={{ width: 96, height: 96, bgcolor: "rgba(201,29,50,0.1)", color: C.primary, fontSize: "2rem", fontWeight: 700, cursor: "pointer" }}
                    onClick={() => fileInputRef.current?.click()}>
                    {!photoPreview && selectedDonor.fullName?.charAt(0)?.toUpperCase()}
                  </Avatar>
                </Badge>
                <input ref={fileInputRef} type="file" accept="image/*" style={{ display: "none" }} onChange={handlePhotoChange} />
                <Box display="flex" gap={1} mt={1.5}>
                  <Button size="small" variant="outlined" onClick={() => fileInputRef.current?.click()}>
                    {photoPreview ? t('adm.donors.changePhoto') : t('adm.donors.uploadPhoto')}
                  </Button>
                  {photoPreview && (
                    <Button size="small" variant="outlined" color="inherit" startIcon={<DeleteOutline />} onClick={handleRemovePhoto}>{t('adm.donors.remove')}</Button>
                  )}
                </Box>
                <Typography variant="caption" color={photoError ? "error" : "text.secondary"} mt={0.5}>
                  {photoError || t('adm.donors.photoHint', { max: MAX_PHOTO_SIZE / (1024 * 1024) })}
                </Typography>
              </Box>

              <Box display="grid" gridTemplateColumns={{ xs: "1fr", sm: "1fr 1fr" }} gap={2}>
                <TextField label={t('adm.donors.fullName')} name="fullName" value={selectedDonor.fullName} onChange={handleEditChange} required
                  error={!!formErrors.fullName} helperText={formErrors.fullName} sx={{ gridColumn: "1 / -1" }} />
                <TextField label={t('adm.donors.email')} name="email" type="email" value={selectedDonor.email} onChange={handleEditChange} required
                  error={!!formErrors.email} helperText={formErrors.email} />
                <TextField label={t('adm.donors.phone')} name="phone" type="tel" value={selectedDonor.phone} onChange={handleEditChange} required
                  error={!!formErrors.phone} helperText={formErrors.phone || "e.g. 0123456789"} />
                <FormControl fullWidth required error={!!formErrors.bloodType}>
                  <InputLabel>{t('adm.donors.bloodType')}</InputLabel>
                  <Select name="bloodType" value={selectedDonor.bloodType} onChange={handleEditChange} label={t('adm.donors.bloodType')}>
                    {BLOOD_TYPES.map((t) => <MenuItem key={t} value={t}>{t}</MenuItem>)}
                  </Select>
                  {formErrors.bloodType && <Typography variant="caption" color="error" sx={{ mx: 1.75, mt: 0.5 }}>{formErrors.bloodType}</Typography>}
                </FormControl>
                <TextField label={t('adm.donors.location')} name="location" value={selectedDonor.location} onChange={handleEditChange} required
                  error={!!formErrors.location} helperText={formErrors.location} />
                <TextField label={t('adm.donors.lastDonation')} name="lastDonation" type="date"
                  value={selectedDonor.lastDonation ? String(selectedDonor.lastDonation).slice(0, 10) : ""}
                  onChange={handleEditChange} error={!!formErrors.lastDonation} helperText={formErrors.lastDonation || t('adm.donors.neverHint')}
                  slotProps={{ inputLabel: { shrink: true }, htmlInput: { max: localToday() } }} />
                <FormControlLabel sx={{ alignSelf: "center", ml: 0 }}
                  control={<Switch checked={!!selectedDonor.available} color="success"
                    onChange={(e) => setSelectedDonor((prev) => ({ ...prev, available: e.target.checked }))} />}
                  label={selectedDonor.available ? t('adm.donors.availableToDonate') : t('adm.donors.notAvailable')} />
              </Box>
              {formError && <Alert severity="error" sx={{ mt: 2 }}>{formError}</Alert>}
            </>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button onClick={closeDialog} color="inherit" disabled={saving}>{t('adm.donors.cancel')}</Button>
          <Button onClick={handleSave} variant="contained" disabled={saving}
            startIcon={saving ? <CircularProgress size={16} color="inherit" /> : null}>
            {uploading ? t('adm.donors.uploading') : saving ? t('adm.donors.saving') : selectedDonor?._id ? t('adm.donors.saveChanges') : t('adm.donors.addDonor')}
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar open={!!toast} autoHideDuration={3000} onClose={() => setToast("")} message={toast}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }} />
    </Box>
  );
};

export default ManageDonors;
