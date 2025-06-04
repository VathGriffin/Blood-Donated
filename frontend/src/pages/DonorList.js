import React, { useState } from 'react';
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
    Pagination,
    InputAdornment,
} from '@mui/material';
import BloodtypeIcon from '@mui/icons-material/Bloodtype';

// Simulated donor data
const allDonors = [
    { name: 'Sokong Tran', bloodType: 'O+', location: 'Phnom Penh', lastDonation: '2024-12-01', available: true },
    { name: 'Rina Kem', bloodType: 'A-', location: 'Siem Reap', lastDonation: '2024-10-15', available: false },
    { name: 'Dara Chan', bloodType: 'B+', location: 'Battambang', lastDonation: '2024-09-20', available: true },
    { name: 'Lina Doe', bloodType: 'O-', location: 'Kampot', lastDonation: '2024-11-10', available: true },
    { name: 'Vuthy Seng', bloodType: 'AB+', location: 'Kandal', lastDonation: '2024-08-05', available: false },
    { name: 'Mina Pech', bloodType: 'B-', location: 'Takeo', lastDonation: '2024-10-01', available: true },
];

const bloodTypes = ['All', 'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
const ITEMS_PER_PAGE = 5;

const DonorList = () => {
    const [selectedType, setSelectedType] = useState('All');
    const [page, setPage] = useState(1);

    const filteredDonors = selectedType === 'All'
        ? allDonors
        : allDonors.filter((donor) => donor.bloodType === selectedType);

    const totalPages = Math.ceil(filteredDonors.length / ITEMS_PER_PAGE);
    const paginatedDonors = filteredDonors.slice(
        (page - 1) * ITEMS_PER_PAGE,
        page * ITEMS_PER_PAGE
    );

    const handleTypeChange = (e) => {
        setSelectedType(e.target.value);
        setPage(1);
    };

    return (
        <Box sx={{ bgcolor: '#fff8f8', py: 8 }}>
            <Container maxWidth="lg">
                {/* Header */}
                <Paper elevation={3} sx={{
                    p: 4,
                    mb: 6,
                    borderRadius: 4,
                    textAlign: 'center',
                    background: 'linear-gradient(135deg, #fff0f0 0%, #ffe6e6 100%)',
                }}>
                    <Typography variant="h4" fontWeight="bold" color="error.main" gutterBottom>
                        🩸 Find a Donor
                    </Typography>
                    <Typography variant="h6" color="text.secondary" maxWidth="700px" mx="auto">
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
                <Grid container spacing={4}>
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
                                        transition: '0.3s ease-in-out',
                                        backgroundColor: '#fff5f5',
                                        '&:hover': {
                                            boxShadow: 6,
                                            transform: 'translateY(-6px)',
                                            backgroundColor: '#ffeaea',
                                        },
                                    }}
                                >
                                    <CardContent>
                                        <Box display="flex" alignItems="center" mb={2}>
                                            <Avatar sx={{ bgcolor: 'error.main', mr: 2 }}>
                                                {donor.name.split(' ').map((n) => n[0]).join('').slice(0, 2)}
                                            </Avatar>
                                            <Box>
                                                <Typography variant="h6" fontWeight="bold" color="primary.dark">
                                                    {donor.name}
                                                </Typography>
                                                <Typography variant="body2" color="text.secondary">
                                                    📍 {donor.location}
                                                </Typography>
                                            </Box>
                                        </Box>

                                        <Divider sx={{ my: 2 }} />

                                        <Box mb={1}>
                                            <Typography variant="body2" fontWeight="bold">🩸 Blood Type:</Typography>
                                            <Chip label={donor.bloodType} color="error" variant="outlined" />
                                        </Box>

                                        <Box mb={1}>
                                            <Typography variant="body2" fontWeight="bold">📅 Last Donation:</Typography>
                                            <Typography variant="body2" color="text.secondary">
                                                {donor.lastDonation}
                                            </Typography>
                                        </Box>

                                        <Box>
                                            <Typography variant="body2" fontWeight="bold">📦 Availability:</Typography>
                                            <Chip
                                                label={donor.available ? '✅ Available' : '❌ Unavailable'}
                                                color={donor.available ? 'success' : 'default'}
                                                size="small"
                                                sx={{ mt: 0.5 }}
                                            />
                                        </Box>
                                    </CardContent>
                                </Card>
                            </Grid>
                        ))
                    )}
                </Grid>

                {/* Pagination */}
                {totalPages > 1 && (
                    <Box mt={6} display="flex" justifyContent="center">
                        <Pagination
                            count={totalPages}
                            page={page}
                            onChange={(_, val) => setPage(val)}
                            color="error"
                            shape="rounded"
                            size="large"
                        />
                    </Box>
                )}
            </Container>
        </Box>
    );
};

export default DonorList;
