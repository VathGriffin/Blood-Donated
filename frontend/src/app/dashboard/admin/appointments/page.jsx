'use client';
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Alert, Avatar, Box, Button, ButtonBase, Dialog, DialogActions, DialogContent, DialogTitle,
  Divider, FormControl, IconButton, InputAdornment, InputLabel, ListItemIcon, ListItemText, Menu,
  MenuItem, Select, Skeleton, Snackbar, Table, TableBody, TableCell, TableHead,
  TablePagination, TableRow, TextField, Tooltip, Typography, useMediaQuery, useTheme,
} from "@mui/material";
import {
  Search, CalendarMonth, MoreVert, Visibility, DeleteOutline, Refresh, EventNote, HourglassTop,
  EventAvailable, HowToReg, EventBusy, CheckCircleOutline, Undo, Close, FilterAltOff,
  LocalHospital, AccessTime, Bloodtype, Email, Phone, Notes,
} from "@mui/icons-material";
import axios from "axios";
import { format, parseISO, isValid } from "date-fns";
import API_BASE from "@/lib/config";
import { useAuth } from "@/store/AuthContext";
import { PageHeader, StatusBadge, TableCard, EmptyState } from "@/components/ui";

const API = `${API_BASE}/api/appointments`;
const BLOOD_TYPES = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];

// The four statuses the Appointment model allows. "CheckedIn" is the end of the flow:
// checking in (PATCH /check-in, done by hospital staff) is what records the donation.
const STATUSES = [
  { value: "Pending",   label: "Pending",    tone: "warning", icon: HourglassTop },
  { value: "Confirmed", label: "Confirmed",  tone: "info",    icon: EventAvailable },
  { value: "CheckedIn", label: "Checked In", tone: "purple",  icon: HowToReg },
  { value: "Cancelled", label: "Cancelled",  tone: "error",   icon: EventBusy },
];
const STATUS = Object.fromEntries(STATUSES.map((s) => [s.value, s]));

// Status changes the API accepts from this page (PUT only allows these; see appointment.routes.js).
const STATUS_ACTIONS = [
  { value: "Confirmed", label: "Confirm appointment", icon: CheckCircleOutline },
  { value: "Pending",   label: "Mark as pending",     icon: Undo },
  { value: "Cancelled", label: "Cancel appointment",  icon: EventBusy },
];

const EMPTY_FILTERS = { status: "", bloodType: "", hospital: "", from: "", to: "" };

const apiError = (err, fallback) => err?.response?.data?.error || err?.response?.data?.message || fallback;

const formatDate = (d, pattern = "MMM d, yyyy") => {
  const parsed = d ? parseISO(d) : null;
  return parsed && isValid(parsed) ? format(parsed, pattern) : d || "—";
};

const initials = (name = "") =>
  name.trim().split(/\s+/).map((w) => w[0]).slice(0, 2).join("").toUpperCase() || "?";

function AppointmentStatus({ status, size }) {
  const s = STATUS[status];
  return <StatusBadge status={status} label={s?.label} tone={s?.tone} size={size} />;
}

function BloodChip({ type }) {
  return (
    <Box
      component="span"
      sx={(t) => ({
        display: "inline-flex", alignItems: "center", justifyContent: "center", minWidth: 40, height: 26, px: 1,
        borderRadius: "8px", fontWeight: 800, fontSize: "0.78rem",
        bgcolor: t.custom.tones.primary.bg, color: t.custom.tones.primary.fg,
        border: 1, borderColor: t.palette.mode === "dark" ? "transparent" : "#F3C1C7",
      })}
    >
      {type}
    </Box>
  );
}

function DonorCell({ appt }) {
  return (
    <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, minWidth: 0 }}>
      <Avatar sx={{ width: 38, height: 38, fontSize: "0.82rem", fontWeight: 700, bgcolor: "primary.main", flexShrink: 0 }}>
        {initials(appt.fullName)}
      </Avatar>
      <Box sx={{ minWidth: 0 }}>
        <Typography fontWeight={700} fontSize="0.875rem" noWrap>{appt.fullName}</Typography>
        <Typography fontSize="0.78rem" color="text.secondary" noWrap>{appt.email}</Typography>
      </Box>
    </Box>
  );
}

// Summary tile that doubles as a quick status filter. A real <button> with aria-pressed,
// so it works from the keyboard and screen readers announce the selected filter.
function SummaryCard({ label, value, icon: Icon, tone, active, loading, onClick }) {
  return (
    <ButtonBase
      onClick={onClick}
      aria-pressed={active}
      aria-label={`${label}: ${loading ? "loading" : value}. ${active ? "Showing only these; press to clear." : "Press to filter."}`}
      sx={(t) => ({
        display: "flex", alignItems: "center", justifyContent: "space-between", gap: 2,
        p: { xs: 2, md: 2.5 }, textAlign: "left", width: "100%",
        bgcolor: "background.paper", borderRadius: "14px", border: 1.5,
        borderColor: active ? t.custom.tones[tone].dot : "divider",
        boxShadow: active ? t.custom.shadow.md : t.custom.shadow.sm,
        transition: "border-color .15s ease, box-shadow .15s ease, transform .15s ease",
        "&:hover": { borderColor: t.custom.tones[tone].dot, transform: "translateY(-1px)", boxShadow: t.custom.shadow.md },
      })}
    >
      <Box sx={{ minWidth: 0 }}>
        <Typography variant="body2" color="text.secondary" fontWeight={600} noWrap>{label}</Typography>
        {loading ? (
          <Skeleton variant="text" width={56} height={40} />
        ) : (
          <Typography sx={{ fontSize: "1.75rem", fontWeight: 800, lineHeight: 1.2, letterSpacing: "-0.02em", mt: 0.25 }}>
            {value}
          </Typography>
        )}
      </Box>
      <Box
        sx={(t) => ({
          width: 46, height: 46, borderRadius: "12px", flexShrink: 0, display: "flex", alignItems: "center",
          justifyContent: "center", bgcolor: t.custom.tones[tone].bg, color: t.custom.tones[tone].fg,
        })}
      >
        <Icon />
      </Box>
    </ButtonBase>
  );
}

function DetailRow({ icon: Icon, label, children }) {
  return (
    <Box sx={{ display: "flex", gap: 1.5, alignItems: "flex-start" }}>
      <Box sx={(t) => ({
        width: 34, height: 34, borderRadius: "10px", flexShrink: 0, display: "flex", alignItems: "center",
        justifyContent: "center", bgcolor: t.custom.tones.neutral.bg, color: t.custom.tones.neutral.fg,
      })}>
        <Icon sx={{ fontSize: 18 }} />
      </Box>
      <Box sx={{ minWidth: 0 }}>
        <Typography variant="caption" color="text.secondary" fontWeight={600}>{label}</Typography>
        <Box sx={{ fontSize: "0.875rem", fontWeight: 600, wordBreak: "break-word" }}>{children}</Box>
      </Box>
    </Box>
  );
}

const ManageAppointments = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const { token } = useAuth();
  const authHeader = useCallback(() => ({ headers: { Authorization: `Bearer ${token}` } }), [token]);

  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);
  const [search, setSearch] = useState("");
  const [filters, setFilters] = useState(EMPTY_FILTERS);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [menu, setMenu] = useState({ anchor: null, appt: null });
  const [viewing, setViewing] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const [busy, setBusy] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: "", severity: "success" });

  const notify = (message, severity = "success") => setSnackbar({ open: true, message, severity });

  const fetchAppointments = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const res = await axios.get(API, authHeader());
      setAppointments(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      setLoadError(apiError(err, "Could not load appointments."));
    } finally {
      setLoading(false);
    }
  }, [authHeader]);

  useEffect(() => {
    fetchAppointments();
  }, [fetchAppointments]);

  // Any change to what's shown starts again from the first page.
  useEffect(() => { setPage(0); }, [search, filters, rowsPerPage]);

  const counts = useMemo(() => {
    const c = { total: appointments.length };
    STATUSES.forEach((s) => { c[s.value] = 0; });
    appointments.forEach((a) => { if (a.status in c) c[a.status] += 1; });
    return c;
  }, [appointments]);

  // Hospital options come from the appointments themselves, so every option matches something.
  const hospitals = useMemo(
    () => [...new Set(appointments.map((a) => a.location).filter(Boolean))].sort((a, b) => a.localeCompare(b)),
    [appointments]
  );

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return appointments.filter((a) => {
      if (q && ![a.fullName, a.email, a.bloodType, a.location].some((v) => v?.toLowerCase().includes(q))) return false;
      if (filters.status && a.status !== filters.status) return false;
      if (filters.bloodType && a.bloodType !== filters.bloodType) return false;
      if (filters.hospital && a.location !== filters.hospital) return false;
      // Dates are stored as YYYY-MM-DD, which compares correctly as plain strings.
      if (filters.from && a.date < filters.from) return false;
      if (filters.to && a.date > filters.to) return false;
      return true;
    });
  }, [appointments, search, filters]);

  // Clamped so that deleting the last row of the final page falls back a page instead of
  // showing an empty table.
  const currentPage = Math.min(page, Math.max(0, Math.ceil(filtered.length / rowsPerPage) - 1));
  const pageRows = filtered.slice(currentPage * rowsPerPage, (currentPage + 1) * rowsPerPage);
  const filtersActive = Boolean(search.trim()) || Object.values(filters).some(Boolean);
  const setFilter = (key) => (e) => setFilters((f) => ({ ...f, [key]: e.target.value }));
  const clearFilters = () => { setSearch(""); setFilters(EMPTY_FILTERS); };
  const toggleStatus = (status) => setFilters((f) => ({ ...f, status: f.status === status ? "" : status }));

  const openMenu = (e, appt) => setMenu({ anchor: e.currentTarget, appt });
  const closeMenu = () => setMenu((m) => ({ ...m, anchor: null }));

  const changeStatus = async (appt, status) => {
    closeMenu();
    try {
      const res = await axios.put(`${API}/${appt._id}`, { status }, authHeader());
      setAppointments((prev) => prev.map((a) => (a._id === appt._id ? { ...a, ...res.data } : a)));
      setViewing((v) => (v?._id === appt._id ? { ...v, ...res.data } : v));
      notify(`${appt.fullName}'s appointment is now ${STATUS[status].label.toLowerCase()}.`);
    } catch (err) {
      notify(apiError(err, "Could not update the status."), "error");
    }
  };

  const confirmDelete = async () => {
    if (!deleting) return;
    setBusy(true);
    try {
      await axios.delete(`${API}/${deleting._id}`, authHeader());
      setAppointments((prev) => prev.filter((a) => a._id !== deleting._id));
      if (viewing?._id === deleting._id) setViewing(null);
      notify("Appointment deleted.");
      setDeleting(null);
    } catch (err) {
      notify(apiError(err, "Could not delete the appointment."), "error");
    } finally {
      setBusy(false);
    }
  };

  // A render helper, not a component: a component defined in here would remount on every
  // render and leave the open menu anchored to a detached button.
  const actionButton = (appt) => (
    <Tooltip title="Actions">
      <IconButton
        size="small"
        aria-label={`Actions for ${appt.fullName}`}
        aria-haspopup="menu"
        aria-expanded={menu.anchor && menu.appt?._id === appt._id ? "true" : undefined}
        onClick={(e) => openMenu(e, appt)}
      >
        <MoreVert fontSize="small" />
      </IconButton>
    </Tooltip>
  );

  const selectSx = { minWidth: { xs: "100%", sm: 150 }, flex: { xs: "1 1 100%", sm: "0 0 auto" } };

  const toolbar = (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
      <TextField
        size="small"
        placeholder="Search donor name, email, blood type or hospital…"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        sx={{ width: { xs: "100%", md: 440 } }}
        slotProps={{
          htmlInput: { "aria-label": "Search appointments" },
          input: {
            startAdornment: (
              <InputAdornment position="start"><Search sx={{ color: "text.disabled", fontSize: 20 }} /></InputAdornment>
            ),
            endAdornment: search ? (
              <InputAdornment position="end">
                <IconButton size="small" aria-label="Clear search" onClick={() => setSearch("")}><Close fontSize="small" /></IconButton>
              </InputAdornment>
            ) : null,
          },
        }}
      />
      <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1.5, alignItems: "center" }}>
        <FormControl size="small" sx={selectSx}>
          <InputLabel id="f-status">Status</InputLabel>
          <Select labelId="f-status" label="Status" value={filters.status} onChange={setFilter("status")}>
            <MenuItem value="">All statuses</MenuItem>
            {STATUSES.map((s) => <MenuItem key={s.value} value={s.value}>{s.label}</MenuItem>)}
          </Select>
        </FormControl>
        <FormControl size="small" sx={selectSx}>
          <InputLabel id="f-blood">Blood type</InputLabel>
          <Select labelId="f-blood" label="Blood type" value={filters.bloodType} onChange={setFilter("bloodType")}>
            <MenuItem value="">All types</MenuItem>
            {BLOOD_TYPES.map((b) => <MenuItem key={b} value={b}>{b}</MenuItem>)}
          </Select>
        </FormControl>
        <FormControl size="small" sx={{ ...selectSx, minWidth: { xs: "100%", sm: 200 }, maxWidth: { sm: 260 } }}>
          <InputLabel id="f-hospital">Hospital</InputLabel>
          <Select labelId="f-hospital" label="Hospital" value={filters.hospital} onChange={setFilter("hospital")}>
            <MenuItem value="">All hospitals</MenuItem>
            {hospitals.map((h) => <MenuItem key={h} value={h}>{h}</MenuItem>)}
          </Select>
        </FormControl>
        <TextField
          size="small" type="date" label="From" value={filters.from} onChange={setFilter("from")}
          sx={{ flex: { xs: "1 1 40%", sm: "0 0 160px" } }}
          slotProps={{ inputLabel: { shrink: true }, htmlInput: { max: filters.to || undefined } }}
        />
        <TextField
          size="small" type="date" label="To" value={filters.to} onChange={setFilter("to")}
          sx={{ flex: { xs: "1 1 40%", sm: "0 0 160px" } }}
          slotProps={{ inputLabel: { shrink: true }, htmlInput: { min: filters.from || undefined } }}
        />
        {filtersActive && (
          <Button size="small" color="inherit" startIcon={<FilterAltOff fontSize="small" />} onClick={clearFilters}
            sx={{ color: "text.secondary" }}>
            Clear filters
          </Button>
        )}
      </Box>
    </Box>
  );

  const emptyState = (
    <EmptyState
      icon={<CalendarMonth />}
      title={appointments.length === 0 ? "No appointments yet" : "No appointments match"}
      description={
        appointments.length === 0
          ? "Appointments booked by donors will appear here."
          : "Try a different search term or clear the filters."
      }
      action={appointments.length > 0 && <Button variant="outlined" size="small" onClick={clearFilters}>Clear filters</Button>}
    />
  );

  const errorState = (
    <Box sx={{ p: 3 }}>
      <Alert severity="error" action={<Button color="inherit" size="small" onClick={fetchAppointments}>Retry</Button>}>
        {loadError}
      </Alert>
    </Box>
  );

  const desktopTable = (
    <Table aria-label="Appointments">
      <TableHead>
        <TableRow>
          <TableCell>Donor</TableCell>
          <TableCell>Blood type</TableCell>
          <TableCell>Date &amp; time</TableCell>
          <TableCell>Hospital</TableCell>
          <TableCell>Status</TableCell>
          <TableCell align="right">Actions</TableCell>
        </TableRow>
      </TableHead>
      <TableBody>
        {loading ? (
          Array.from({ length: 6 }).map((_, i) => (
            <TableRow key={i}>
              <TableCell>
                <Box sx={{ display: "flex", gap: 1.5, alignItems: "center" }}>
                  <Skeleton variant="circular" width={38} height={38} />
                  <Box><Skeleton width={130} /><Skeleton width={170} height={16} /></Box>
                </Box>
              </TableCell>
              <TableCell><Skeleton variant="rounded" width={40} height={26} /></TableCell>
              <TableCell><Skeleton width={90} /><Skeleton width={60} height={16} /></TableCell>
              <TableCell><Skeleton width={150} /></TableCell>
              <TableCell><Skeleton variant="rounded" width={88} height={26} sx={{ borderRadius: 99 }} /></TableCell>
              <TableCell align="right"><Skeleton variant="circular" width={28} height={28} sx={{ ml: "auto" }} /></TableCell>
            </TableRow>
          ))
        ) : pageRows.length === 0 ? (
          <TableRow><TableCell colSpan={6} sx={{ borderBottom: 0 }}>{emptyState}</TableCell></TableRow>
        ) : (
          pageRows.map((appt) => (
            <TableRow key={appt._id} hover>
              <TableCell sx={{ maxWidth: 280 }}><DonorCell appt={appt} /></TableCell>
              <TableCell><BloodChip type={appt.bloodType} /></TableCell>
              <TableCell>
                <Typography fontSize="0.86rem" fontWeight={600} noWrap>{formatDate(appt.date)}</Typography>
                <Typography fontSize="0.78rem" color="text.secondary" noWrap>{appt.time}</Typography>
              </TableCell>
              <TableCell sx={{ maxWidth: 240 }}>
                <Typography fontSize="0.84rem" noWrap title={appt.location}>{appt.location}</Typography>
              </TableCell>
              <TableCell><AppointmentStatus status={appt.status} /></TableCell>
              <TableCell align="right">{actionButton(appt)}</TableCell>
            </TableRow>
          ))
        )}
      </TableBody>
    </Table>
  );

  const mobileList = (
    <Box component="ul" aria-label="Appointments" sx={{ listStyle: "none", m: 0, p: 0 }}>
      {loading
        ? Array.from({ length: 4 }).map((_, i) => (
            <Box component="li" key={i} sx={{ p: 2, borderBottom: 1, borderColor: "divider" }}>
              <Box sx={{ display: "flex", gap: 1.5, alignItems: "center" }}>
                <Skeleton variant="circular" width={38} height={38} />
                <Box sx={{ flex: 1 }}><Skeleton width="60%" /><Skeleton width="80%" height={16} /></Box>
              </Box>
              <Skeleton width="70%" sx={{ mt: 1.5 }} />
            </Box>
          ))
        : pageRows.length === 0
          ? <li>{emptyState}</li>
          : pageRows.map((appt) => (
              <Box component="li" key={appt._id} sx={{ p: 2, borderBottom: 1, borderColor: "divider" }}>
                <Box sx={{ display: "flex", alignItems: "flex-start", gap: 1 }}>
                  <Box sx={{ flex: 1, minWidth: 0 }}><DonorCell appt={appt} /></Box>
                  {actionButton(appt)}
                </Box>
                <Box sx={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 1, mt: 1.5 }}>
                  <BloodChip type={appt.bloodType} />
                  <AppointmentStatus status={appt.status} size="small" />
                </Box>
                <Box sx={{ display: "flex", flexDirection: "column", gap: 0.5, mt: 1.25, color: "text.secondary", fontSize: "0.8rem" }}>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 0.75 }}>
                    <AccessTime sx={{ fontSize: 16 }} />{formatDate(appt.date)} · {appt.time}
                  </Box>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 0.75, minWidth: 0 }}>
                    <LocalHospital sx={{ fontSize: 16, flexShrink: 0 }} />
                    <Box component="span" sx={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{appt.location}</Box>
                  </Box>
                </Box>
              </Box>
            ))}
    </Box>
  );

  const menuAppt = menu.appt;

  return (
    <Box>
      <PageHeader
        title="Manage Appointments"
        subtitle="Review donor bookings, confirm or cancel appointments, and track check-ins across every hospital."
        actions={
          <Button variant="outlined" startIcon={<Refresh />} onClick={fetchAppointments} disabled={loading}>
            Refresh
          </Button>
        }
        sx={{ mb: 3 }}
      />

      {/* Summary — each card filters the table by that status */}
      <Box
        sx={{
          display: "grid", gap: { xs: 1.5, md: 2 }, mb: 3,
          gridTemplateColumns: { xs: "repeat(2, minmax(0, 1fr))", sm: "repeat(3, minmax(0, 1fr))", lg: "repeat(5, minmax(0, 1fr))" },
        }}
      >
        <SummaryCard label="Total" value={counts.total} icon={EventNote} tone="primary" loading={loading}
          active={!filters.status} onClick={() => setFilters((f) => ({ ...f, status: "" }))} />
        {STATUSES.map((s) => (
          <SummaryCard key={s.value} label={s.label} value={counts[s.value]} icon={s.icon} tone={s.tone} loading={loading}
            active={filters.status === s.value} onClick={() => toggleStatus(s.value)} />
        ))}
      </Box>

      <TableCard
        title="All appointments"
        subtitle={
          loading ? "Loading…"
            : filtersActive ? `${filtered.length} of ${appointments.length} appointments match`
            : `${appointments.length} appointment${appointments.length !== 1 ? "s" : ""}, newest bookings first`
        }
        toolbar={toolbar}
        minWidth={820}
      >
        {loadError ? errorState : isMobile ? mobileList : desktopTable}
        {!loading && !loadError && filtered.length > 0 && (
          <TablePagination
            component="div"
            count={filtered.length}
            page={currentPage}
            onPageChange={(_, p) => setPage(p)}
            rowsPerPage={rowsPerPage}
            onRowsPerPageChange={(e) => setRowsPerPage(parseInt(e.target.value, 10))}
            rowsPerPageOptions={[10, 25, 50]}
            labelRowsPerPage={isMobile ? "Rows" : "Rows per page"}
            sx={{ borderTop: 1, borderColor: "divider", "& .MuiTablePagination-toolbar": { px: { xs: 1, sm: 2 } } }}
          />
        )}
      </TableCard>

      {/* Row actions */}
      <Menu
        anchorEl={menu.anchor}
        open={Boolean(menu.anchor)}
        onClose={closeMenu}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
        transformOrigin={{ vertical: "top", horizontal: "right" }}
        slotProps={{ paper: { sx: { minWidth: 220 } } }}
      >
        <MenuItem onClick={() => { closeMenu(); setViewing(menuAppt); }}>
          <ListItemIcon><Visibility fontSize="small" /></ListItemIcon>
          <ListItemText>View details</ListItemText>
        </MenuItem>
        {menuAppt && menuAppt.status !== "CheckedIn" && <Divider />}
        {menuAppt && menuAppt.status !== "CheckedIn" &&
          STATUS_ACTIONS.filter((a) => a.value !== menuAppt.status).map((a) => (
            <MenuItem key={a.value} onClick={() => changeStatus(menuAppt, a.value)}>
              <ListItemIcon><a.icon fontSize="small" /></ListItemIcon>
              <ListItemText>{a.label}</ListItemText>
            </MenuItem>
          ))}
        <Divider />
        <MenuItem onClick={() => { closeMenu(); setDeleting(menuAppt); }} sx={{ color: "error.main" }}>
          <ListItemIcon sx={{ color: "inherit" }}><DeleteOutline fontSize="small" /></ListItemIcon>
          <ListItemText>Delete</ListItemText>
        </MenuItem>
      </Menu>

      {/* Details */}
      <Dialog open={Boolean(viewing)} onClose={() => setViewing(null)} fullWidth maxWidth="sm" fullScreen={isMobile}
        aria-labelledby="appt-details-title">
        {viewing && (
          <>
            <DialogTitle id="appt-details-title" sx={{ display: "flex", alignItems: "center", gap: 1.5, pr: 7 }}>
              <Avatar sx={{ width: 44, height: 44, bgcolor: "primary.main", fontWeight: 700 }}>{initials(viewing.fullName)}</Avatar>
              <Box sx={{ minWidth: 0 }}>
                <Typography variant="h6" component="span" display="block" noWrap>{viewing.fullName}</Typography>
                <Typography variant="caption" color="text.secondary">
                  Booked {viewing.createdAt ? format(new Date(viewing.createdAt), "MMM d, yyyy 'at' h:mm a") : "—"}
                </Typography>
              </Box>
              <IconButton aria-label="Close" onClick={() => setViewing(null)} sx={{ position: "absolute", right: 12, top: 12 }}>
                <Close />
              </IconButton>
            </DialogTitle>
            <DialogContent dividers>
              <Box sx={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 1, mb: 2.5 }}>
                <AppointmentStatus status={viewing.status} />
                <BloodChip type={viewing.bloodType} />
              </Box>
              <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" }, gap: 2.25 }}>
                <DetailRow icon={Email} label="Email">{viewing.email}</DetailRow>
                <DetailRow icon={Phone} label="Phone">{viewing.phone || "—"}</DetailRow>
                <DetailRow icon={CalendarMonth} label="Date">{formatDate(viewing.date, "EEEE, MMM d, yyyy")}</DetailRow>
                <DetailRow icon={AccessTime} label="Time">{viewing.time}</DetailRow>
                <DetailRow icon={LocalHospital} label="Hospital">{viewing.location}</DetailRow>
                <DetailRow icon={Bloodtype} label="Blood type">{viewing.bloodType}</DetailRow>
                {viewing.status === "CheckedIn" && viewing.checkedInAt && (
                  <DetailRow icon={HowToReg} label="Checked in">
                    {format(new Date(viewing.checkedInAt), "MMM d, yyyy 'at' h:mm a")}
                  </DetailRow>
                )}
              </Box>
              {viewing.notes && (
                <Box sx={{ mt: 2.25 }}>
                  <DetailRow icon={Notes} label="Donor notes">
                    <Box component="span" sx={{ fontWeight: 500, whiteSpace: "pre-wrap" }}>{viewing.notes}</Box>
                  </DetailRow>
                </Box>
              )}
            </DialogContent>
            <DialogActions sx={{ px: 3, py: 2, flexWrap: "wrap", gap: 1 }}>
              <Button color="error" startIcon={<DeleteOutline />} onClick={() => setDeleting(viewing)} sx={{ mr: "auto" }}>
                Delete
              </Button>
              {viewing.status !== "CheckedIn" && viewing.status !== "Confirmed" && (
                <Button variant="contained" onClick={() => changeStatus(viewing, "Confirmed")}>Confirm</Button>
              )}
              <Button variant="outlined" onClick={() => setViewing(null)}>Close</Button>
            </DialogActions>
          </>
        )}
      </Dialog>

      {/* Delete confirmation */}
      <Dialog open={Boolean(deleting)} onClose={() => !busy && setDeleting(null)} maxWidth="xs" fullWidth
        aria-labelledby="appt-delete-title" aria-describedby="appt-delete-desc">
        <DialogTitle id="appt-delete-title">Delete this appointment?</DialogTitle>
        <DialogContent>
          <Typography id="appt-delete-desc" variant="body2" color="text.secondary">
            {deleting && (
              <>
                <strong>{deleting.fullName}</strong>&apos;s appointment on {formatDate(deleting.date)} at {deleting.time} will be
                permanently removed. This cannot be undone.
              </>
            )}
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5 }}>
          <Button variant="outlined" onClick={() => setDeleting(null)} disabled={busy} autoFocus>Keep it</Button>
          <Button variant="contained" color="error" onClick={confirmDelete} disabled={busy}>
            {busy ? "Deleting…" : "Delete"}
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={(_, reason) => reason !== "clickaway" && setSnackbar((s) => ({ ...s, open: false }))}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert severity={snackbar.severity} variant="filled" onClose={() => setSnackbar((s) => ({ ...s, open: false }))}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default ManageAppointments;
