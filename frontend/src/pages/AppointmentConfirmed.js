import React from 'react';
import { Container, Typography, Box, Button } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';

const AppointmentConfirmed = () => {
    return (
        <Container maxWidth="sm" sx={{ mt: 10, textAlign: 'center' }}>
            <Typography variant="h3" color="success.main" fontWeight="bold" gutterBottom>
                🎉 Appointment Confirmed!
            </Typography>
            <Typography variant="h6" color="text.secondary" mb={4}>
                Thank you for scheduling your blood donation appointment. We’ll contact you shortly to confirm the details.
            </Typography>
            <Box display="flex" justifyContent="center" gap={2}>
                <Button variant="contained" color="error" component={RouterLink} to="/">
                    Back to Home
                </Button>
                <Button variant="outlined" component={RouterLink} to="/donate">
                    Register Another Donor
                </Button>
            </Box>
        </Container>
    );
};

export default AppointmentConfirmed;
