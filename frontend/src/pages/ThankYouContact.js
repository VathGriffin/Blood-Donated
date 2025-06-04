// src/pages/ThankYouContact.js
import React from 'react';
import { Container, Typography, Button, Box } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';

const ThankYouContact = () => {
    return (
        <Container maxWidth="sm" sx={{ mt: 10, textAlign: 'center' }}>
            <Typography variant="h3" color="success.main" fontWeight="bold" gutterBottom>
                🎉 Thank You!
            </Typography>
            <Typography variant="h6" color="text.secondary" mb={4}>
                Your message has been sent. We’ll get back to you as soon as possible.
            </Typography>
            <Box display="flex" justifyContent="center" gap={2}>
                <Button variant="contained" color="error" component={RouterLink} to="/">
                    Back to Home
                </Button>
                <Button variant="outlined" component={RouterLink} to="/contact">
                    Send Another Message
                </Button>
            </Box>
        </Container>
    );
};

export default ThankYouContact;
