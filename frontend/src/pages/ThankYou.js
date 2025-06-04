import React from 'react';
import { Container, Typography, Box, Button } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';

const ThankYou = () => {
    return (
        <Container maxWidth="sm" sx={{ mt: 10, textAlign: 'center' }}>
            <Typography variant="h3" color="success.main" fontWeight="bold" gutterBottom>
                🎉 Thank You!
            </Typography>
            <Typography variant="h6" color="text.secondary" mb={4}>
                Your registration has been received. Our team will reach out to schedule a testing appointment.
            </Typography>
            <Box display="flex" justifyContent="center" gap={2}>
                <Button variant="contained" color="error" component={RouterLink} to="/appointment">
                    Schedule Appointment
                </Button>
                <Button variant="outlined" component={RouterLink} to="/">
                    Back to Home
                </Button>
            </Box>
        </Container>
    );
};

export default ThankYou;
