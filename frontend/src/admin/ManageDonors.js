import React, { useEffect, useState } from 'react';
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
    useTheme,
} from '@mui/material';
import { Delete, Edit } from '@mui/icons-material';
import axios from 'axios';

const API = 'http://localhost:3001/api/donors';

const ManageDonors = () => {
    const theme = useTheme();
    const [donors, setDonors] = useState([]);
    const [open, setOpen] = useState(false);
    const [selectedDonor, setSelectedDonor] = useState(null);

    const fetchDonors = async () => {
        try {
            const response = await axios.get(API);
            setDonors(response.data);
        } catch (error) {
            console.error('Failed to fetch donors:', error);
        }
    };

    useEffect(() => {
        fetchDonors();
    }, []);

    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure you want to delete this donor?')) return;
        try {
            await axios.delete(`${API}/${id}`);
            fetchDonors();
        } catch (error) {
            console.error('Delete failed:', error);
        }
    };

    const handleEditClick = (donor) => {
        setSelectedDonor(donor);
        setOpen(true);
    };

    const handleEditChange = (e) => {
        const { name, value } = e.target;
        setSelectedDonor({ ...selectedDonor, [name]: value });
    };

    const handleUpdate = async () => {
        try {
            await axios.put(`${API}/${selectedDonor._id}`, selectedDonor);
            setOpen(false);
            setSelectedDonor(null);
            fetchDonors();
        } catch (error) {
            console.error('Update failed:', error);
        }
    };

    return (
        <Box sx={{ p: 3 }}>
            {/* Title */}
            <Typography
                variant="h4"
                fontWeight="bold"
                gutterBottom
                sx={{
                    background: 'linear-gradient(to right, #b71c1c, #d32f2f)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                }}
            >
                🩸 Manage Donors
            </Typography>

            {/* Donor Table */}
            <TableContainer component={Paper} sx={{ borderRadius: 3, boxShadow: 3 }}>
                <Table>
                    <TableHead sx={{ backgroundColor: theme.palette.mode === 'dark' ? '#333' : '#fbe9e7' }}>
                        <TableRow>
                            <TableCell sx={{ fontWeight: 'bold' }}>Name</TableCell>
                            <TableCell sx={{ fontWeight: 'bold' }}>Blood Type</TableCell>
                            <TableCell sx={{ fontWeight: 'bold' }}>Phone</TableCell>
                            <TableCell sx={{ fontWeight: 'bold' }}>Email</TableCell>
                            <TableCell sx={{ fontWeight: 'bold' }}>Location</TableCell>
                            <TableCell align="right" sx={{ fontWeight: 'bold' }}>Actions</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {donors.map((donor) => (
                            <TableRow
                                key={donor._id}
                                sx={{
                                    '&:nth-of-type(odd)': {
                                        backgroundColor: theme.palette.mode === 'dark' ? 'grey.900' : 'grey.100',
                                    },
                                    '&:hover': {
                                        backgroundColor: theme.palette.action.hover,
                                    },
                                }}
                            >
                                <TableCell>{donor.fullName}</TableCell>
                                <TableCell>{donor.bloodType}</TableCell>
                                <TableCell>{donor.phone}</TableCell>
                                <TableCell>{donor.email}</TableCell>
                                <TableCell>{donor.location}</TableCell>
                                <TableCell align="right">
                                    <IconButton color="primary" onClick={() => handleEditClick(donor)}>
                                        <Edit />
                                    </IconButton>
                                    <IconButton color="error" onClick={() => handleDelete(donor._id)}>
                                        <Delete />
                                    </IconButton>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </TableContainer>

            {/* Edit Donor Dialog */}
            <Dialog open={open} onClose={() => setOpen(false)} maxWidth="sm" fullWidth>
                <DialogTitle fontWeight="bold" color="primary.main">
                    ✏️ Update Donor
                </DialogTitle>
                <DialogContent dividers>
                    <TextField
                        margin="dense"
                        label="Full Name"
                        name="fullName"
                        value={selectedDonor?.fullName || ''}
                        onChange={handleEditChange}
                        fullWidth
                    />
                    <TextField
                        margin="dense"
                        label="Email"
                        name="email"
                        value={selectedDonor?.email || ''}
                        onChange={handleEditChange}
                        fullWidth
                    />
                    <TextField
                        margin="dense"
                        label="Phone"
                        name="phone"
                        value={selectedDonor?.phone || ''}
                        onChange={handleEditChange}
                        fullWidth
                    />
                    <TextField
                        margin="dense"
                        label="Blood Type"
                        name="bloodType"
                        value={selectedDonor?.bloodType || ''}
                        onChange={handleEditChange}
                        fullWidth
                    />
                    <TextField
                        margin="dense"
                        label="Location"
                        name="location"
                        value={selectedDonor?.location || ''}
                        onChange={handleEditChange}
                        fullWidth
                    />
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setOpen(false)} color="inherit">Cancel</Button>
                    <Button onClick={handleUpdate} variant="contained" color="primary">Save</Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default ManageDonors;
