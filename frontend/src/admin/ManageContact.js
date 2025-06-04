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
    Snackbar,
    Alert,
    useTheme,
} from '@mui/material';
import { Delete, Edit } from '@mui/icons-material';
import axios from 'axios';

const API = 'http://localhost:3001/api/contacts';

const ManageContact = () => {
    const theme = useTheme();
    const [contacts, setContacts] = useState([]);
    const [selected, setSelected] = useState(null);
    const [open, setOpen] = useState(false);
    const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

    const fetchContacts = async () => {
        try {
            const res = await axios.get(API);
            setContacts(res.data);
        } catch (error) {
            console.error('Failed to fetch contacts:', error);
        }
    };

    useEffect(() => {
        fetchContacts();
    }, []);

    const handleEditClick = (item) => {
        setSelected(item);
        setOpen(true);
    };

    const handleEditChange = (e) => {
        setSelected({ ...selected, [e.target.name]: e.target.value });
    };

    const handleUpdate = async () => {
        try {
            await axios.put(`${API}/${selected._id}`, selected);
            setOpen(false);
            fetchContacts();
            setSnackbar({ open: true, message: 'Message updated successfully!', severity: 'success' });
        } catch (err) {
            console.error('Update failed:', err);
            setSnackbar({ open: true, message: 'Update failed!', severity: 'error' });
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure you want to delete this message?')) return;
        try {
            await axios.delete(`${API}/${id}`);
            fetchContacts();
            setSnackbar({ open: true, message: 'Message deleted successfully!', severity: 'info' });
        } catch (err) {
            console.error('Delete failed:', err);
            setSnackbar({ open: true, message: 'Delete failed!', severity: 'error' });
        }
    };

    const handleCloseSnackbar = () => {
        setSnackbar({ ...snackbar, open: false });
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
                📩 Manage Contact Messages
            </Typography>

            {/* Table */}
            <TableContainer component={Paper} sx={{ borderRadius: 3, boxShadow: 3 }}>
                <Table>
                    <TableHead sx={{ backgroundColor: theme.palette.mode === 'dark' ? '#333' : '#fbe9e7' }}>
                        <TableRow>
                            <TableCell sx={{ fontWeight: 'bold' }}>Full Name</TableCell>
                            <TableCell sx={{ fontWeight: 'bold' }}>Email</TableCell>
                            <TableCell sx={{ fontWeight: 'bold' }}>Message</TableCell>
                            <TableCell sx={{ fontWeight: 'bold' }}>Created At</TableCell>
                            <TableCell align="right" sx={{ fontWeight: 'bold' }}>Actions</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {contacts.map((msg) => (
                            <TableRow
                                key={msg._id}
                                sx={{
                                    '&:nth-of-type(odd)': {
                                        backgroundColor: theme.palette.mode === 'dark' ? 'grey.900' : 'grey.100',
                                    },
                                    '&:hover': {
                                        backgroundColor: theme.palette.action.hover,
                                    },
                                }}
                            >
                                <TableCell>{msg.fullName}</TableCell>
                                <TableCell>{msg.email}</TableCell>
                                <TableCell>{msg.message}</TableCell>
                                <TableCell>{new Date(msg.createdAt).toLocaleString()}</TableCell>
                                <TableCell align="right">
                                    <IconButton color="primary" onClick={() => handleEditClick(msg)}>
                                        <Edit />
                                    </IconButton>
                                    <IconButton color="error" onClick={() => handleDelete(msg._id)}>
                                        <Delete />
                                    </IconButton>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </TableContainer>

            {/* Edit Dialog */}
            <Dialog open={open} onClose={() => setOpen(false)} maxWidth="sm" fullWidth>
                <DialogTitle fontWeight="bold">✏️ Update Contact Message</DialogTitle>
                <DialogContent dividers>
                    <TextField
                        margin="dense"
                        label="Full Name"
                        name="fullName"
                        value={selected?.fullName || ''}
                        onChange={handleEditChange}
                        fullWidth
                        variant="outlined"
                    />
                    <TextField
                        margin="dense"
                        label="Email"
                        name="email"
                        value={selected?.email || ''}
                        onChange={handleEditChange}
                        fullWidth
                        variant="outlined"
                    />
                    <TextField
                        margin="dense"
                        label="Message"
                        name="message"
                        value={selected?.message || ''}
                        onChange={handleEditChange}
                        fullWidth
                        multiline
                        rows={4}
                        variant="outlined"
                    />
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setOpen(false)} color="inherit">
                        Cancel
                    </Button>
                    <Button onClick={handleUpdate} variant="contained" color="primary">
                        Save Changes
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Snackbar */}
            <Snackbar
                open={snackbar.open}
                autoHideDuration={4000}
                onClose={handleCloseSnackbar}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
            >
                <Alert severity={snackbar.severity} variant="filled" onClose={handleCloseSnackbar}>
                    {snackbar.message}
                </Alert>
            </Snackbar>
        </Box>
    );
};

export default ManageContact;
