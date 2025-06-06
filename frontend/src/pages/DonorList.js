import React, { useEffect, useState } from "react";
import {
  Container,
  Typography,
  Card,
  CardContent,
  Grid,
  Box,
  Chip,
  Avatar,
  Divider,
  Paper,
  TextField,
  MenuItem,
  InputAdornment,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  useTheme,
} from "@mui/material";
import BloodtypeIcon from "@mui/icons-material/Bloodtype";
import axios from "axios";
import { formatDistanceToNow } from "date-fns";

const bloodTypes = ["All", "A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];
const ITEMS_PER_PAGE = 5;

const DonorList = () => {
  const theme = useTheme();
  const [donors, setDonors] = useState([]);
  const [selectedType, setSelectedType] = useState("All");
  const [page, setPage] = useState(1);
  const [selectedDonor, setSelectedDonor] = useState(null);

  useEffect(() => {
    const fetchDonors = async () => {
      try {
        const res = await axios.get("http://localhost:3001/api/donors");
        setDonors(res.data);
      } catch (err) {
        console.error("Failed to fetch donors:", err);
      }
    };
    fetchDonors();
  }, []);

  const filteredDonors =
    selectedType === "All"
      ? donors
      : donors.filter((donor) => donor.bloodType === selectedType);

  const totalPages = Math.ceil(filteredDonors.length / ITEMS_PER_PAGE);
  const paginatedDonors = filteredDonors.slice(
    (page - 1) * ITEMS_PER_PAGE,
    page * ITEMS_PER_PAGE
  );

  const handleTypeChange = (e) => {
    setSelectedType(e.target.value);
    setPage(1);
  };

  const handleShowDetails = (donor) => setSelectedDonor(donor);
  const handleClose = () => setSelectedDonor(null);

  const formatDate = (date) => {
    if (!date || isNaN(new Date(date).getTime())) return "N/A";
    return formatDistanceToNow(new Date(date), { addSuffix: true });
  };

  return (
    <Box sx={{ bgcolor: theme.palette.background.default, py: 8 }}>
      <Container maxWidth="lg">
        {/* Header */}
        <Paper
          elevation={3}
          sx={{
            p: 4,
            mb: 6,
            borderRadius: 4,
            textAlign: "center",
            backgroundColor:
              theme.palette.mode === "dark" ? "#2c2c2c" : "#ffe6e6",
          }}
        >
          <Typography
            variant="h4"
            fontWeight="bold"
            color="error.main"
            gutterBottom
          >
            🩸 Find a Donor
          </Typography>
          <Typography
            variant="h6"
            color="text.secondary"
            maxWidth="700px"
            mx="auto"
          >
            Filter verified blood donors by blood type and availability.
          </Typography>
        </Paper>

        {/* Filter */}
        <Box sx={{ mb: 5, maxWidth: 300 }}>
          <TextField
            select
            label="Filter by Blood Type"
            value={selectedType}
            onChange={handleTypeChange}
            fullWidth
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <BloodtypeIcon color="error" />
                </InputAdornment>
              ),
            }}
          >
            {bloodTypes.map((type) => (
              <MenuItem key={type} value={type}>
                {type}
              </MenuItem>
            ))}
          </TextField>
        </Box>

        {/* Donors Grid */}
        <Grid container spacing={4} justifyContent="center">
          {paginatedDonors.length === 0 ? (
            <Grid item xs={12}>
              <Typography variant="body1" color="text.secondary" align="center">
                ❌ No donors found for selected blood type.
              </Typography>
            </Grid>
          ) : (
            paginatedDonors.map((donor, index) => (
              <Grid item xs={12} sm={6} md={4} key={index}>
                <Card
                  elevation={4}
                  sx={{
                    borderRadius: 4,
                    transition: "0.3s ease-in-out",
                    backgroundColor: theme.palette.background.paper,
                    "&:hover": {
                      boxShadow: 6,
                      transform: "translateY(-6px)",
                      backgroundColor:
                        theme.palette.mode === "dark"
                          ? theme.palette.action.hover
                          : "#f9f9f9",
                    },
                  }}
                >
                  <CardContent>
                    <Box display="flex" alignItems="center" mb={2}>
                      <Avatar sx={{ bgcolor: "error.main", mr: 2 }}>
                        {donor.fullName
                          ?.split(" ")
                          .map((n) => n[0])
                          .join("")
                          .slice(0, 2)}
                      </Avatar>
                      <Box>
                        <Typography variant="h6" fontWeight="bold">
                          {donor.fullName}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          📍 {donor.location}
                        </Typography>
                      </Box>
                    </Box>

                    <Divider sx={{ my: 2 }} />

                    <Box mb={1}>
                      <Typography variant="body2" fontWeight="bold">
                        🩸 Blood Type:
                      </Typography>
                      <Chip
                        label={donor.bloodType}
                        color="error"
                        variant="outlined"
                      />
                    </Box>

                    <Box mb={1}>
                      <Typography variant="body2" fontWeight="bold">
                        📅 Last Donation:
                      </Typography>
                      <Typography
                        variant="body2"
                        color="text.secondary"
                        title={donor.lastDonation || "Not provided"}
                      >
                        {formatDate(donor.lastDonation)}
                      </Typography>
                    </Box>

                    <Box mb={2}>
                      <Typography variant="body2" fontWeight="bold">
                        📦 Availability:
                      </Typography>
                      <Chip
                        label={
                          donor.available ? "✅ Available" : "❌ Unavailable"
                        }
                        color={donor.available ? "success" : "default"}
                        size="small"
                        sx={{ mt: 0.5 }}
                      />
                    </Box>

                    <Button
                      fullWidth
                      variant="outlined"
                      color="error"
                      onClick={() => handleShowDetails(donor)}
                    >
                      Show Details
                    </Button>
                  </CardContent>
                </Card>
              </Grid>
            ))
          )}
        </Grid>

        {/* Pagination */}
        {totalPages > 1 && (
          <Box mt={6} display="flex" justifyContent="center" gap={1}>
            <Button
              onClick={() => setPage(1)}
              disabled={page === 1}
              variant="outlined"
              color="error"
            >
              «
            </Button>
            <Button
              onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
              disabled={page === 1}
              variant="outlined"
              color="error"
            >
              ‹
            </Button>
            {[...Array(totalPages)].map((_, i) => (
              <Button
                key={i + 1}
                onClick={() => setPage(i + 1)}
                variant={page === i + 1 ? "contained" : "outlined"}
                color="error"
              >
                {i + 1}
              </Button>
            ))}
            <Button
              onClick={() => setPage((prev) => Math.min(prev + 1, totalPages))}
              disabled={page === totalPages}
              variant="outlined"
              color="error"
            >
              ›
            </Button>
            <Button
              onClick={() => setPage(totalPages)}
              disabled={page === totalPages}
              variant="outlined"
              color="error"
            >
              »
            </Button>
          </Box>
        )}

        {/* Dialog */}
        {selectedDonor && (
          <Dialog open onClose={handleClose} maxWidth="sm" fullWidth>
            <DialogTitle>👤 Contact {selectedDonor.fullName}</DialogTitle>
            <DialogContent dividers>
              <Typography>
                <strong>📱 Phone:</strong>{" "}
                {selectedDonor.phone || "Not Provided"}
              </Typography>
              <Typography sx={{ mt: 1 }}>
                <strong>📧 Email:</strong>{" "}
                {selectedDonor.email || "Not Provided"}
              </Typography>
              <Typography sx={{ mt: 1 }}>
                <strong>📍 Location:</strong> {selectedDonor.location}
              </Typography>
            </DialogContent>
            <DialogActions>
              <Button onClick={handleClose} color="error">
                Close
              </Button>
            </DialogActions>
          </Dialog>
        )}
      </Container>
    </Box>
  );
};

export default DonorList;
