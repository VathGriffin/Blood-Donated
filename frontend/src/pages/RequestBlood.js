import React, { useState } from 'react';
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
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const RequestBlood = () => {
    const [bloodType, setBloodType] = useState('');
    const [urgency, setUrgency] = useState('');
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();

        const requestData = {
            hospitalName: e.target.hospitalName.value,
            patientName: e.target.patientName.value,
            bloodType,
            urgency,
            reason: e.target.reason.value,
            contact: e.target.contact.value,
        };

        try {
            const response = await axios.post('http://localhost:3001/api/requests', requestData);
            console.log('✅ Blood Request Submitted:', response.data);

            // Redirect on success
            navigate('/request/thank-you');
        } catch (error) {
            console.error('❌ Error submitting request:', error);
            alert('Failed to submit blood request. Please try again.');
        }
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
