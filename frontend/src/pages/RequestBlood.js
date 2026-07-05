import React, { useState, useRef } from 'react';
import {
    Container,
    Typography,
    TextField,
    Button,
    Paper,
    Box,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Avatar,
    IconButton,
    Tooltip,
    useTheme,
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import AddAPhotoIcon from '@mui/icons-material/AddAPhoto';
import DeleteIcon from '@mui/icons-material/Delete';

const RequestBlood = () => {
    const theme = useTheme();
    const isDark = theme.palette.mode === 'dark';
    const [bloodType, setBloodType] = useState('');
    const [urgency, setUrgency] = useState('');
    const [photoFile, setPhotoFile] = useState(null);
    const [photoPreview, setPhotoPreview] = useState(null);
    const photoInputRef = useRef(null);
    const navigate = useNavigate();

    const handlePhotoChange = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        setPhotoFile(file);
        setPhotoPreview(URL.createObjectURL(file));
    };

    const handleRemovePhoto = () => {
        setPhotoFile(null);
        setPhotoPreview(null);
        if (photoInputRef.current) photoInputRef.current.value = '';
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!bloodType) { alert('Please select a blood type.'); return; }
        if (!urgency)   { alert('Please select an urgency level.'); return; }

        const requestData = {
            hospitalName: e.target.hospitalName.value,
            patientName: e.target.patientName.value,
            bloodType,
            urgency,
            reason: e.target.reason.value,
            contact: e.target.contact.value,
        };

        let savedRequest;
        try {
            const response = await axios.post('http://localhost:3001/api/requests', requestData);
            savedRequest = response.data;
        } catch (error) {
            console.error('❌ Error submitting request:', error);
            const msg = error.response?.data?.error || error.response?.data?.message || error.message || 'Failed to submit blood request.';
            alert(msg);
            return;
        }

        if (photoFile && savedRequest._id) {
            try {
                const photoPayload = new FormData();
                photoPayload.append('photo', photoFile);
                await axios.post(`http://localhost:3001/api/requests/${savedRequest._id}/photo`, photoPayload);
            } catch (error) {
                console.error('❌ Photo upload failed:', error);
            }
        }

        navigate('/request/thank-you');
    };

    return (
        <Container maxWidth="sm" sx={{ mt: 10, mb: 10 }}>
            <Paper elevation={3} sx={{ p: 4, borderRadius: 3 }}>
                <Typography variant="h4" color="error.main" fontWeight="bold" gutterBottom textAlign="center">
                    Request Blood
                </Typography>
                <Typography variant="body1" color="text.secondary" mb={3} textAlign="center">
                    Fill in the form below to request blood for a patient in need.
                </Typography>

                {/* Profile photo upload */}
                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mb: 3, gap: 1 }}>
                    <Box sx={{ position: 'relative' }}>
                        <Avatar
                            src={photoPreview || undefined}
                            sx={{
                                width: 100,
                                height: 100,
                                border: '3px dashed',
                                borderColor: photoPreview ? 'error.main' : 'grey.400',
                                bgcolor: isDark ? 'grey.800' : 'grey.100',
                            }}
                        >
                            {!photoPreview && <AddAPhotoIcon sx={{ fontSize: 36, color: 'grey.500' }} />}
                        </Avatar>
                        <Tooltip title="Upload photo">
                            <IconButton
                                size="small"
                                onClick={() => photoInputRef.current?.click()}
                                sx={{
                                    position: 'absolute',
                                    bottom: 0,
                                    right: 0,
                                    bgcolor: 'error.main',
                                    color: 'white',
                                    '&:hover': { bgcolor: 'error.dark' },
                                    width: 30,
                                    height: 30,
                                }}
                            >
                                <AddAPhotoIcon sx={{ fontSize: 16 }} />
                            </IconButton>
                        </Tooltip>
                    </Box>
                    <input
                        ref={photoInputRef}
                        type="file"
                        accept="image/*"
                        hidden
                        onChange={handlePhotoChange}
                    />
                    {photoPreview ? (
                        <Button
                            size="small"
                            startIcon={<DeleteIcon />}
                            color="error"
                            onClick={handleRemovePhoto}
                        >
                            Remove Photo
                        </Button>
                    ) : (
                        <Typography variant="caption" color="text.secondary">
                            Optional patient/requester photo (max 5 MB)
                        </Typography>
                    )}
                </Box>

                <Box component="form" onSubmit={handleSubmit} noValidate>
                    <TextField fullWidth label="Hospital Name" name="hospitalName" margin="normal" required />
                    <TextField fullWidth label="Patient Name" name="patientName" margin="normal" required />

                    <FormControl fullWidth margin="normal" required>
                        <InputLabel id="blood-type-label">Blood Type</InputLabel>
                        <Select
                            labelId="blood-type-label"
                            value={bloodType}
                            onChange={(e) => setBloodType(e.target.value)}
                            label="Blood Type"
                        >
                            {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map((type) => (
                                <MenuItem key={type} value={type}>{type}</MenuItem>
                            ))}
                        </Select>
                    </FormControl>

                    <FormControl fullWidth margin="normal" required>
                        <InputLabel id="urgency-label">Urgency Level</InputLabel>
                        <Select
                            labelId="urgency-label"
                            value={urgency}
                            onChange={(e) => setUrgency(e.target.value)}
                            label="Urgency Level"
                        >
                            <MenuItem value="Low">Low</MenuItem>
                            <MenuItem value="Medium">Medium</MenuItem>
                            <MenuItem value="High">High</MenuItem>
                            <MenuItem value="Critical">Critical</MenuItem>
                        </Select>
                    </FormControl>

                    <TextField fullWidth label="Reason for Request" name="reason" multiline rows={3} margin="normal" required />
                    <TextField fullWidth label="Contact Number / Email" name="contact" margin="normal" required />

                    <Box mt={3} textAlign="center">
                        <Button type="submit" variant="contained" color="error" size="large">
                            Submit Request
                        </Button>
                    </Box>
                </Box>
            </Paper>
        </Container>
    );
};

export default RequestBlood;
