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
  Dialog,
  DialogTitle,
  DialogContent,
  TextField,
  DialogActions,
  Button,
  Box,
  Switch,
  useTheme,
  Tooltip,
  Chip,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  InputAdornment,
  Avatar,
  Badge,
} from "@mui/material";
import {
  Delete,
  Edit,
  Bloodtype,
  PersonAdd,
  Search,
  CameraAlt,
  DeleteOutline,
} from "@mui/icons-material";
import axios from "axios";

const API = "http://localhost:3001/api/donors";
const BASE_URL = "http://localhost:3001";

const bloodTypes = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];

const ManageDonors = () => {
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";
  const [donors, setDonors] = useState([]);
  const [open, setOpen] = useState(false);
  const [selectedDonor, setSelectedDonor] = useState(null);
  const [search, setSearch] = useState("");
  const [photoPreview, setPhotoPreview] = useState(null);
  const [photoFile, setPhotoFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);

  const fetchDonors = async () => {
    try {
      const res = await axios.get(API);
      setDonors(res.data);
    } catch (err) {
      console.error("Fetch failed:", err);
    }
  };

  useEffect(() => {
    fetchDonors();
  }, []);

  const openDialog = (donor) => {
    setSelectedDonor(donor);
    setPhotoPreview(donor.photo ? `${BASE_URL}${donor.photo}` : null);
    setPhotoFile(null);
    setOpen(true);
  };

  const handleEditChange = (e) => {
    const { name, value } = e.target;
    setSelectedDonor((prev) => ({ ...prev, [name]: value }));
  };

  const handleAvailabilityChange = (e) => {
    setSelectedDonor((prev) => ({ ...prev, available: e.target.checked }));
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
    setSelectedDonor((prev) => ({ ...prev, photo: null }));
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleUpdate = async () => {
    if (!selectedDonor) return;

    const { fullName, email, phone, bloodType, location, lastDonation, available } = selectedDonor;

    if (!fullName || !email || !phone || !bloodType || !location) {
      alert("Please fill in all required fields.");
      return;
    }

    try {
      let savedDonor;

      if (selectedDonor._id && selectedDonor._id.trim() !== "") {
        const res = await axios.put(`${API}/${selectedDonor._id}`, {
          fullName, email, phone, bloodType, location, lastDonation, available,
        });
        savedDonor = res.data;

        // Remove photo if user cleared it
        if (selectedDonor.photo === null && !photoFile) {
          await axios.delete(`${API}/${savedDonor._id}/photo`).catch(() => {});
        }
      } else {
        const res = await axios.post(API, {
          fullName, email, phone, bloodType, location, lastDonation, available,
        });
        savedDonor = res.data;
      }

      // Upload new photo if selected
      if (photoFile && savedDonor._id) {
        setUploading(true);
        const formData = new FormData();
        formData.append("photo", photoFile);
        await axios.post(`${API}/${savedDonor._id}/photo`, formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        setUploading(false);
      }

      setOpen(false);
      setSelectedDonor(null);
      setPhotoFile(null);
      setPhotoPreview(null);
      fetchDonors();
    } catch (err) {
      setUploading(false);
      console.error("Save failed:", err.response || err);
      alert(err.response?.data?.message || "Failed to save donor.");
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm("Delete this donor?")) {
      try {
        await axios.delete(`${API}/${id}`);
        fetchDonors();
      } catch (err) {
        console.error("Delete failed:", err);
      }
    }
  };

  const filtered = donors.filter((d) => {
    const q = search.toLowerCase();
    return (
      d.fullName?.toLowerCase().includes(q) ||
      d.email?.toLowerCase().includes(q) ||
      d.bloodType?.toLowerCase().includes(q) ||
      d.location?.toLowerCase().includes(q)
    );
  });

  const cardBg = isDark ? "#1a1a1a" : "#fff";
  const cardBorder = isDark ? "#2a2a2a" : "#f0f0f0";

  return (
    <Box>
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={3}>
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
              Manage Donors
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {donors.length} registered donor{donors.length !== 1 ? "s" : ""}
            </Typography>
          </Box>
        </Box>
        <Button
          variant="contained"
          color="error"
          startIcon={<PersonAdd />}
          sx={{ borderRadius: 2, textTransform: "none", fontWeight: 700 }}
          onClick={() =>
            openDialog({
              fullName: "", email: "", phone: "", bloodType: "",
              location: "", available: true, lastDonation: "", photo: null,
            })
          }
        >
          Add New Donor
        </Button>
      </Box>

      {/* Search */}
      <TextField
        size="small"
        placeholder="Search by name, email, blood type, location…"
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
          <TableHead sx={{ bgcolor: isDark ? "#1e1e1e" : "#fbe9e7" }}>
            <TableRow>
              {["Donor", "Blood Type", "Phone", "Email", "Location", "Last Donation", "Available", "Actions"].map(
                (h) => (
                  <TableCell key={h} sx={{ fontWeight: 700, fontSize: "0.82rem", py: 1.5 }}>
                    {h}
                  </TableCell>
                )
              )}
            </TableRow>
          </TableHead>
          <TableBody>
            {filtered.length === 0 && (
              <TableRow>
                <TableCell colSpan={8} align="center" sx={{ py: 6 }}>
                  <Bloodtype sx={{ fontSize: 40, color: "text.disabled", mb: 1 }} />
                  <Typography color="text.secondary" fontSize="0.9rem">
                    No donors found.
                  </Typography>
                </TableCell>
              </TableRow>
            )}
            {filtered.map((donor) => (
              <TableRow
                key={donor._id}
                hover
                sx={{ "&:nth-of-type(odd)": { bgcolor: isDark ? "rgba(255,255,255,0.02)" : "#fafafa" } }}
              >
                {/* Donor column with photo */}
                <TableCell>
                  <Box display="flex" alignItems="center" gap={1.5}>
                    <Avatar
                      src={donor.photo ? `${BASE_URL}${donor.photo}` : undefined}
                      sx={{ width: 38, height: 38, bgcolor: "#b71c1c", fontSize: "0.9rem", fontWeight: 700 }}
                    >
                      {donor.fullName?.charAt(0)?.toUpperCase()}
                    </Avatar>
                    <Typography fontWeight={600} fontSize="0.86rem">
                      {donor.fullName}
                    </Typography>
                  </Box>
                </TableCell>
                <TableCell>
                  <Chip label={donor.bloodType} color="error" size="small" sx={{ fontWeight: 800 }} />
                </TableCell>
                <TableCell sx={{ fontSize: "0.84rem" }}>{donor.phone}</TableCell>
                <TableCell sx={{ fontSize: "0.84rem", color: "text.secondary" }}>{donor.email}</TableCell>
                <TableCell sx={{ fontSize: "0.84rem" }}>{donor.location}</TableCell>
                <TableCell sx={{ fontSize: "0.82rem" }}>
                  {donor.lastDonation ? new Date(donor.lastDonation).toLocaleDateString() : "—"}
                </TableCell>
                <TableCell>
                  <Chip
                    label={donor.available ? "Available" : "Unavailable"}
                    color={donor.available ? "success" : "default"}
                    size="small"
                    sx={{ fontSize: "0.75rem" }}
                  />
                </TableCell>
                <TableCell>
                  <Tooltip title="Edit">
                    <IconButton size="small" color="primary" onClick={() => openDialog(donor)}>
                      <Edit fontSize="small" />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Delete">
                    <IconButton size="small" color="error" onClick={() => handleDelete(donor._id)}>
                      <Delete fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Dialog: Add / Edit Donor */}
      <Dialog
        open={open}
        onClose={() => setOpen(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{ sx: { borderRadius: 3 } }}
      >
        <DialogTitle fontWeight={700}>
          {selectedDonor?._id ? "Update Donor" : "Add New Donor"}
        </DialogTitle>

        <DialogContent dividers>
          {selectedDonor && (
            <>
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
                    {!photoPreview && selectedDonor.fullName?.charAt(0)?.toUpperCase()}
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

              <TextField label="Full Name" name="fullName" value={selectedDonor.fullName} onChange={handleEditChange} fullWidth margin="dense" required />
              <TextField label="Email" name="email" value={selectedDonor.email} onChange={handleEditChange} fullWidth margin="dense" required />
              <TextField label="Phone" name="phone" value={selectedDonor.phone} onChange={handleEditChange} fullWidth margin="dense" required />
              <FormControl fullWidth margin="dense">
                <InputLabel>Blood Type</InputLabel>
                <Select name="bloodType" value={selectedDonor.bloodType} onChange={handleEditChange} label="Blood Type">
                  {bloodTypes.map((type) => (
                    <MenuItem key={type} value={type}>{type}</MenuItem>
                  ))}
                </Select>
              </FormControl>
              <TextField label="Location" name="location" value={selectedDonor.location} onChange={handleEditChange} fullWidth margin="dense" required />
              <TextField
                label="Last Donation"
                name="lastDonation"
                type="date"
                value={selectedDonor.lastDonation ? selectedDonor.lastDonation.slice(0, 10) : ""}
                onChange={handleEditChange}
                fullWidth
                margin="dense"
                InputLabelProps={{ shrink: true }}
              />
              <Box display="flex" alignItems="center" mt={2}>
                <Typography sx={{ mr: 1 }}>Available:</Typography>
                <Switch checked={!!selectedDonor.available} onChange={handleAvailabilityChange} color="success" />
              </Box>
            </>
          )}
        </DialogContent>

        <DialogActions sx={{ px: 3, pb: 2.5 }}>
          <Button onClick={() => setOpen(false)} color="inherit">
            Cancel
          </Button>
          <Button
            onClick={handleUpdate}
            variant="contained"
            color="error"
            disabled={uploading}
            sx={{ borderRadius: 2 }}
          >
            {uploading ? "Uploading…" : "Save"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ManageDonors;
