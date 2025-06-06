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
  Switch,
  useTheme,
  Tooltip,
  Chip,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from "@mui/material";
import { Delete, Edit, Bloodtype, PersonAdd } from "@mui/icons-material";
import axios from "axios";

const API = "http://localhost:3001/api/donors";

const bloodTypes = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];

const ManageDonors = () => {
  const theme = useTheme();
  const [donors, setDonors] = useState([]);
  const [open, setOpen] = useState(false);
  const [selectedDonor, setSelectedDonor] = useState(null);

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

  const handleEditChange = (e) => {
    const { name, value } = e.target;
    setSelectedDonor((prev) => ({ ...prev, [name]: value }));
  };

  const handleAvailabilityChange = (e) => {
    setSelectedDonor((prev) => ({ ...prev, available: e.target.checked }));
  };

  const handleUpdate = async () => {
    if (!selectedDonor) return;

    const {
      fullName,
      email,
      phone,
      bloodType,
      location,
      lastDonation,
      available,
    } = selectedDonor;

    if (!fullName || !email || !phone || !bloodType || !location) {
      alert("Please fill in all fields.");
      return;
    }

    try {
      if (selectedDonor._id && selectedDonor._id.trim() !== "") {
        await axios.put(`${API}/${selectedDonor._id}`, {
          fullName,
          email,
          phone,
          bloodType,
          location,
          lastDonation,
          available,
        });
      } else {
        await axios.post(API, {
          fullName,
          email,
          phone,
          bloodType,
          location,
          lastDonation,
          available,
        });
      }

      setOpen(false);
      setSelectedDonor(null);
      fetchDonors();
    } catch (err) {
      console.error("Save failed:", err.response || err);
      alert(
        err.response?.data?.message ||
          "Failed to save donor. Check the console for details."
      );
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

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box
        display="flex"
        justifyContent="space-between"
        alignItems="center"
        mb={2}
      >
        <Box display="flex" alignItems="center" gap={1}>
          <Bloodtype sx={{ fontSize: 38, mb: -0.7 }} color="error" />
          <Typography variant="h4" fontWeight="bold">
            Manage Donors
          </Typography>
        </Box>
        <Button
          variant="contained"
          color="primary"
          startIcon={<PersonAdd />}
          onClick={() => {
            setSelectedDonor({
              fullName: "",
              email: "",
              phone: "",
              bloodType: "",
              location: "",
              available: true,
              lastDonation: "",
            });
            setOpen(true);
          }}
        >
          Add New Donor
        </Button>
      </Box>

      {/* Table */}
      <TableContainer component={Paper} elevation={3} sx={{ borderRadius: 3 }}>
        <Table>
          <TableHead
            sx={{
              backgroundColor:
                theme.palette.mode === "dark" ? "#333" : "#fbe9e7",
            }}
          >
            <TableRow>
              <TableCell>
                <strong>Name</strong>
              </TableCell>
              <TableCell>
                <strong>Blood Type</strong>
              </TableCell>
              <TableCell>
                <strong>Phone</strong>
              </TableCell>
              <TableCell>
                <strong>Email</strong>
              </TableCell>
              <TableCell>
                <strong>Location</strong>
              </TableCell>
              <TableCell>
                <strong>Last Donation</strong>
              </TableCell>
              <TableCell>
                <strong>Available</strong>
              </TableCell>
              <TableCell align="center">
                <strong>Actions</strong>
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {donors.map((donor) => (
              <TableRow
                key={donor._id}
                hover
                sx={{ "&:nth-of-type(odd)": { bgcolor: "background.default" } }}
              >
                <TableCell>{donor.fullName}</TableCell>
                <TableCell>{donor.bloodType}</TableCell>
                <TableCell>{donor.phone}</TableCell>
                <TableCell>{donor.email}</TableCell>
                <TableCell>{donor.location}</TableCell>
                <TableCell>
                  {donor.lastDonation
                    ? new Date(donor.lastDonation).toLocaleDateString()
                    : "—"}
                </TableCell>
                <TableCell>
                  <Chip
                    label={donor.available ? "✔ Available" : "✘ Unavailable"}
                    color={donor.available ? "success" : "default"}
                    size="small"
                  />
                </TableCell>
                <TableCell align="center">
                  <Tooltip title="Edit">
                    <IconButton
                      onClick={() => {
                        setSelectedDonor(donor);
                        setOpen(true);
                      }}
                      color="primary"
                    >
                      <Edit />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Delete">
                    <IconButton
                      onClick={() => handleDelete(donor._id)}
                      color="error"
                    >
                      <Delete />
                    </IconButton>
                  </Tooltip>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Dialog: Add/Edit Donor */}
      <Dialog
        open={open}
        onClose={() => setOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          {selectedDonor?._id ? "✍️ Update Donor" : "➕ Add New Donor"}
        </DialogTitle>
        <DialogContent dividers>
          {selectedDonor && (
            <>
              <TextField
                label="Full Name"
                name="fullName"
                value={selectedDonor.fullName}
                onChange={handleEditChange}
                fullWidth
                margin="dense"
              />
              <TextField
                label="Email"
                name="email"
                value={selectedDonor.email}
                onChange={handleEditChange}
                fullWidth
                margin="dense"
              />
              <TextField
                label="Phone"
                name="phone"
                value={selectedDonor.phone}
                onChange={handleEditChange}
                fullWidth
                margin="dense"
              />
              <FormControl fullWidth margin="dense">
                <InputLabel>Blood Type</InputLabel>
                <Select
                  name="bloodType"
                  value={selectedDonor.bloodType}
                  onChange={handleEditChange}
                  label="Blood Type"
                >
                  {bloodTypes.map((type) => (
                    <MenuItem key={type} value={type}>
                      {type}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              <TextField
                label="Location"
                name="location"
                value={selectedDonor.location}
                onChange={handleEditChange}
                fullWidth
                margin="dense"
              />
              <TextField
                label="Last Donation (YYYY-MM-DD)"
                name="lastDonation"
                type="date"
                value={selectedDonor.lastDonation || ""}
                onChange={handleEditChange}
                fullWidth
                margin="dense"
                InputLabelProps={{ shrink: true }}
              />
              <Box display="flex" alignItems="center" mt={2}>
                <Typography sx={{ mr: 1 }}>Available:</Typography>
                <Switch
                  checked={selectedDonor.available}
                  onChange={handleAvailabilityChange}
                  color="success"
                />
              </Box>
            </>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)}>Cancel</Button>
          <Button onClick={handleUpdate} variant="contained" color="primary">
            Save
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ManageDonors;
