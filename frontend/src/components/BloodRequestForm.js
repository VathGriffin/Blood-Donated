import React, { useState } from 'react';
import {
    TextField,
    Button,
    Box,
    Paper,
    Typography,
    InputAdornment
} from '@mui/material';
import BloodtypeIcon from '@mui/icons-material/Bloodtype';
import PersonIcon from '@mui/icons-material/Person';
import NotesIcon from '@mui/icons-material/Notes';

const BloodRequestForm = ({ onSubmit }) => {
    const [formData, setFormData] = useState({
        name: '',
        bloodType: '',
        reason: '',
    });

    const handleChange = (e) => {
        setFormData((prev) => ({
            ...prev,
            [e.target.name]: e.target.value,
        }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        onSubmit(formData);
    };

    return (
        <Box
            display="flex"
            justifyContent="center"
            alignItems="center"
            minHeight="100vh"
            sx={{ backgroundColor: '#fff5f5', py: 8 }}
        >
            <Paper
                elevation={4}
                sx={{
                    p: 5,
                    borderRadius: 4,
                    maxWidth: 500,
                    width: '100%',
                    backgroundColor: '#ffffff',
                    boxShadow: '0 4px 20px rgba(255, 0, 0, 0.1)',
                }}
            >
                <Typography variant="h5" fontWeight="bold" color="error.main" gutterBottom align="center">
                    🩸 Blood Request Form
                </Typography>

                <Box component="form" onSubmit={handleSubmit}>
                    <TextField
                        fullWidth
                        label="Full Name"
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        margin="normal"
                        InputProps={{
                            startAdornment: (
                                <InputAdornment position="start">
                                    <PersonIcon color="error" />
                                </InputAdornment>
                            )
                        }}
                    />

                    <TextField
                        fullWidth
                        label="Blood Type (e.g. A+, O-)"
                        name="bloodType"
                        value={formData.bloodType}
                        onChange={handleChange}
                        margin="normal"
                        InputProps={{
                            startAdornment: (
                                <InputAdornment position="start">
                                    <BloodtypeIcon color="error" />
                                </InputAdornment>
                            )
                        }}
                    />

                    <TextField
                        fullWidth
                        label="Reason for Request"
                        name="reason"
                        value={formData.reason}
                        onChange={handleChange}
                        margin="normal"
                        multiline
                        rows={4}
                        InputProps={{
                            startAdornment: (
                                <InputAdornment position="start">
                                    <NotesIcon color="error" />
                                </InputAdornment>
                            )
                        }}
                    />

                    <Button
                        type="submit"
                        fullWidth
                        variant="contained"
                        color="error"
                        sx={{ mt: 3, py: 1.5, borderRadius: 3, fontWeight: 'bold' }}
                    >
                        🚑 Submit Request
                    </Button>
                </Box>
            </Paper>
        </Box>
    );
};

export default BloodRequestForm;
