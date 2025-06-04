import React, { useState } from 'react';
import {
    Container,
    Typography,
    TextField,
    Button,
    Box,
    Paper,
} from '@mui/material';
import { useNavigate } from 'react-router-dom';

const Appointment = () => {
    const [date, setDate] = useState('');
    const [time, setTime] = useState('');
    const [notes, setNotes] = useState('');
    const navigate = useNavigate();

    const handleSubmit = (e) => {
        e.preventDefault();

        // You could send this to an API here:
        const appointmentData = {
            date,
            time,
            notes,
        };
        console.log('Appointment Data:', appointmentData);

        // Simulate successful submission
        navigate('/appointment/confirmed');
    };

    return (
        <Container maxWidth="sm" sx={{ mt: 10 }}>
            <Paper elevation={3} sx={{ p: 4, borderRadius: 3 }}>
                <Typography variant="h4" color="error.dark" fontWeight="bold" gutterBottom textAlign="center">
                    Book an Appointment
                </Typography>
                <Typography variant="body2" color="text.secondary" mb={3} textAlign="center">
                    Choose a convenient time for your blood testing or donation.
                </Typography>

                <Box component="form" onSubmit={handleSubmit} noValidate>
                    <TextField
                        fullWidth
                        type="date"
                        label="Preferred Date"
                        value={date}
                        onChange={(e) => setDate(e.target.value)}
                        InputLabelProps={{ shrink: true }}
                        margin="normal"
                        required
                    />
                    <TextField
                        fullWidth
                        type="time"
                        label="Preferred Time"
                        value={time}
                        onChange={(e) => setTime(e.target.value)}
                        InputLabelProps={{ shrink: true }}
                        margin="normal"
                        required
                    />
                    <TextField
                        fullWidth
                        label="Additional Notes"
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        margin="normal"
                        multiline
                        rows={3}
                    />
                    <Box mt={3} textAlign="center">
                        <Button type="submit" variant="contained" color="error" size="large">
                            Confirm Appointment
                        </Button>
                    </Box>
                </Box>
            </Paper>
        </Container>
    );
};

export default Appointment;
