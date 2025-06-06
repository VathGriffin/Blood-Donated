import React, { useState } from "react";
import {
  Container,
  Box,
  Typography,
  TextField,
  Button,
  Paper,
  Divider,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Switch,
  FormControlLabel,
} from "@mui/material";
import { useNavigate } from "react-router-dom";

const DonateBlood = () => {
  const [bloodType, setBloodType] = useState("");
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    phone: "",
    location: "",
    lastDonation: "",
    available: true,
  });
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleBloodTypeChange = (event) => {
    setBloodType(event.target.value);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!bloodType) {
      alert("Please select a blood type");
      return;
    }

    try {
      setLoading(true);

      const response = await fetch(
        "http://localhost:3001/api/donors/register",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            ...formData,
            bloodType,
          }),
        }
      );

      if (response.ok) {
        navigate("/donate/thank-you");
      } else {
        const data = await response.json();
        alert("Registration failed: " + (data.message || "Unknown error"));
      }
    } catch (error) {
      console.error("Error submitting form:", error);
      alert("Server error. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container maxWidth="sm" sx={{ mt: 10, mb: 10 }}>
      <Box textAlign="center" mb={6}>
        <Typography
          variant="h3"
          fontWeight="bold"
          color="error.main"
          gutterBottom
        >
          Welcome to Blood Donation
        </Typography>
        <Typography variant="h6" color="text.secondary">
          Together, we can save lives — one drop at a time.
        </Typography>
      </Box>

      <Paper elevation={4} sx={{ p: 4, borderRadius: 3 }}>
        <Box textAlign="center" mb={3}>
          <Typography
            variant="h5"
            fontWeight="bold"
            color="error.dark"
            gutterBottom
          >
            Donor Registration
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Please provide accurate information. Our team will contact you for
            confirmation and testing.
          </Typography>
        </Box>

        <Divider sx={{ mb: 3 }} />

        <Box
          component="form"
          onSubmit={handleSubmit}
          noValidate
          autoComplete="off"
        >
          <TextField
            fullWidth
            label="Full Name"
            name="fullName"
            value={formData.fullName}
            onChange={handleChange}
            variant="outlined"
            margin="normal"
            required
          />
          <TextField
            fullWidth
            label="Email Address"
            name="email"
            value={formData.email}
            onChange={handleChange}
            variant="outlined"
            margin="normal"
            type="email"
            required
          />
          <TextField
            fullWidth
            label="Phone Number"
            name="phone"
            value={formData.phone}
            onChange={handleChange}
            variant="outlined"
            margin="normal"
            type="tel"
            required
          />

          <FormControl fullWidth margin="normal" required>
            <InputLabel id="blood-type-label">Blood Type</InputLabel>
            <Select
              labelId="blood-type-label"
              id="blood-type"
              value={bloodType}
              onChange={handleBloodTypeChange}
              label="Blood Type"
            >
              {["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"].map(
                (type) => (
                  <MenuItem key={type} value={type}>
                    {type}
                  </MenuItem>
                )
              )}
            </Select>
          </FormControl>

          <TextField
            fullWidth
            label="Location"
            name="location"
            value={formData.location}
            onChange={handleChange}
            variant="outlined"
            margin="normal"
            required
          />

          <TextField
            fullWidth
            label="📅 Last Donation"
            name="lastDonation"
            type="date"
            value={formData.lastDonation}
            onChange={handleChange}
            variant="outlined"
            margin="normal"
            InputLabelProps={{ shrink: true }}
          />

          <FormControlLabel
            control={
              <Switch
                checked={formData.available}
                onChange={handleChange}
                name="available"
                color="success"
              />
            }
            label="📦 Available"
            sx={{ mt: 2 }}
          />

          <Box mt={4} textAlign="center">
            <Button
              variant="contained"
              color="error"
              size="large"
              type="submit"
              sx={{ px: 5, py: 1.5 }}
              disabled={loading}
            >
              {loading ? "Submitting..." : "Submit Registration"}
            </Button>
          </Box>
        </Box>
      </Paper>
    </Container>
  );
};

export default DonateBlood;
