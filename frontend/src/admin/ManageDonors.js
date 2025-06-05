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
} from "@mui/material";
import { Delete, Edit } from "@mui/icons-material";
import axios from "axios";

const API = "http://localhost:3001/api/donors";

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
    try {
      await axios.put(`${API}/${selectedDonor._id}`, selectedDonor);
      setOpen(false);
      fetchDonors();
    } catch (err) {
      console.error("Update failed:", err);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm("Delete this donor?")) {
      await axios.delete(`${API}/${id}`);
      fetchDonors();
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" fontWeight="bold" gutterBottom>
        🧸 Manage Donors
      </Typography>

      <TableContainer component={Paper}>
        <Table>
          <TableHead
            sx={{
              backgroundColor:
                theme.palette.mode === "dark" ? "#333" : "#fbe9e7",
            }}
          >
            <TableRow>
              <TableCell>Name</TableCell>
              <TableCell>Blood Type</TableCell>
              <TableCell>Phone</TableCell>
              <TableCell>Email</TableCell>
              <TableCell>Location</TableCell>
              <TableCell>Available</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {donors.map((donor) => (
              <TableRow key={donor._id}>
                <TableCell>{donor.fullName}</TableCell>
                <TableCell>{donor.bloodType}</TableCell>
                <TableCell>{donor.phone}</TableCell>
                <TableCell>{donor.email}</TableCell>
                <TableCell>{donor.location}</TableCell>
                <TableCell>{donor.available ? "✅" : "❌"}</TableCell>
                <TableCell align="right">
                  <IconButton
                    onClick={() => {
                      setSelectedDonor(donor);
                      setOpen(true);
                    }}
                    color="primary"
                  >
                    <Edit />
                  </IconButton>
                  <IconButton
                    onClick={() => handleDelete(donor._id)}
                    color="error"
                  >
                    <Delete />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Edit Dialog */}
      <Dialog
        open={open}
        onClose={() => setOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>✍️ Update Donor</DialogTitle>
        <DialogContent dividers>
          <TextField
            label="Full Name"
            name="fullName"
            value={selectedDonor?.fullName || ""}
            onChange={handleEditChange}
            fullWidth
            margin="dense"
          />
          <TextField
            label="Email"
            name="email"
            value={selectedDonor?.email || ""}
            onChange={handleEditChange}
            fullWidth
            margin="dense"
          />
          <TextField
            label="Phone"
            name="phone"
            value={selectedDonor?.phone || ""}
            onChange={handleEditChange}
            fullWidth
            margin="dense"
          />
          <TextField
            label="Blood Type"
            name="bloodType"
            value={selectedDonor?.bloodType || ""}
            onChange={handleEditChange}
            fullWidth
            margin="dense"
          />
          <TextField
            label="Location"
            name="location"
            value={selectedDonor?.location || ""}
            onChange={handleEditChange}
            fullWidth
            margin="dense"
          />
          <Box display="flex" alignItems="center" mt={2}>
            <Typography sx={{ mr: 1 }}>Available:</Typography>
            <Switch
              checked={selectedDonor?.available || false}
              onChange={handleAvailabilityChange}
              color="success"
            />
          </Box>
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
