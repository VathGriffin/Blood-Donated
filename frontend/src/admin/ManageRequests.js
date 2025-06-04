import React, { useEffect, useState } from "react";
import {
  Typography,
  Grid,
  Card,
  CardContent,
  CardActions,
  IconButton,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  TextField,
  Box,
  Chip,
  Stack,
  Divider,
} from "@mui/material";
import { Delete, Edit, Bloodtype } from "@mui/icons-material";
import axios from "axios";

const API_BASE = "http://localhost:3001/api/requests";

const getUrgencyColor = (urgency) => {
  switch (urgency.toLowerCase()) {
    case "high":
      return "error";
    case "medium":
      return "warning";
    case "low":
      return "success";
    case "critical":
      return "error";
    default:
      return "default";
  }
};

const ManageRequests = () => {
  const [requests, setRequests] = useState([]);
  const [formData, setFormData] = useState({
    hospitalName: "",
    patientName: "",
    bloodType: "",
    urgency: "",
    reason: "",
    contact: "",
  });
  const [editId, setEditId] = useState(null);
  const [open, setOpen] = useState(false);

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
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async () => {
    try {
      if (editId) {
        await axios.put(`${API_BASE}/${editId}`, formData);
      }
      fetchRequests();
      setFormData({
        hospitalName: "",
        patientName: "",
        bloodType: "",
        urgency: "",
        reason: "",
        contact: "",
      });
      setEditId(null);
      setOpen(false);
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (id) => {
    try {
      await axios.delete(`${API_BASE}/${id}`);
      fetchRequests();
    } catch (err) {
      console.error(err);
    }
  };

  const handleEdit = (req) => {
    setFormData(req);
    setEditId(req._id);
    setOpen(true);
  };

  return (
    <Box sx={{ p: 3 }}>
      {/* 🔧 Title with Bloodtype icon */}
      <Box sx={{ display: "flex", alignItems: "center", mb: 3 }}>
        <Bloodtype sx={{ color: "#b71c1c", fontSize: 40, mr: 1 }} />
        <Typography
          variant="h4"
          fontWeight="bold"
          sx={{
            background: "linear-gradient(to right, #b71c1c, #d32f2f)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
          }}
        >
          Manage Blood Requests
        </Typography>
      </Box>

      <Grid container spacing={3}>
        {requests.map((req) => (
          <Grid item xs={12} sm={6} md={4} key={req._id}>
            <Card elevation={4} sx={{ borderRadius: 3 }}>
              <CardContent>
                <Stack
                  direction="row"
                  justifyContent="space-between"
                  alignItems="center"
                  mb={1}
                >
                  <Typography variant="h6" color="error.main" fontWeight="bold">
                    {req.hospitalName}
                  </Typography>
                  <Chip label={req.bloodType} color="error" />
                </Stack>

                <Divider sx={{ mb: 1 }} />

                <Typography variant="body2">
                  <strong>Patient:</strong> {req.patientName}
                </Typography>
                <Typography variant="body2">
                  <strong>Reason:</strong> {req.reason}
                </Typography>
                <Typography variant="body2">
                  <strong>Contact:</strong> {req.contact}
                </Typography>

                <Stack direction="row" spacing={1} mt={1}>
                  <Chip
                    label={`Urgency: ${req.urgency}`}
                    color={getUrgencyColor(req.urgency)}
                    size="small"
                  />
                </Stack>
              </CardContent>

              <CardActions sx={{ justifyContent: "flex-end" }}>
                <IconButton color="primary" onClick={() => handleEdit(req)}>
                  <Edit />
                </IconButton>
                <IconButton color="error" onClick={() => handleDelete(req._id)}>
                  <Delete />
                </IconButton>
              </CardActions>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Edit Dialog */}
      <Dialog
        open={open}
        onClose={() => setOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Update Blood Request</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            margin="normal"
            label="Hospital Name"
            name="hospitalName"
            value={formData.hospitalName}
            onChange={handleChange}
          />
          <TextField
            fullWidth
            margin="normal"
            label="Patient Name"
            name="patientName"
            value={formData.patientName}
            onChange={handleChange}
          />
          <TextField
            fullWidth
            margin="normal"
            label="Blood Type"
            name="bloodType"
            value={formData.bloodType}
            onChange={handleChange}
            placeholder="A+, B-, O+, etc."
          />
          <TextField
            fullWidth
            margin="normal"
            label="Urgency"
            name="urgency"
            value={formData.urgency}
            onChange={handleChange}
            placeholder="Low, Medium, High, Critical"
          />
          <TextField
            fullWidth
            margin="normal"
            label="Reason"
            name="reason"
            value={formData.reason}
            onChange={handleChange}
          />
          <TextField
            fullWidth
            margin="normal"
            label="Contact"
            name="contact"
            value={formData.contact}
            onChange={handleChange}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)} color="inherit">
            Cancel
          </Button>
          <Button onClick={handleSubmit} variant="contained" color="primary">
            Update
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ManageRequests;
