import React, { useState } from 'react';
import {
    Container,
    Typography,
    Box,
    Paper,
    TextField,
    Button,
} from '@mui/material';
import { useNavigate } from 'react-router-dom';

const Contact = () => {
    const navigate = useNavigate();
    const [form, setForm] = useState({
        fullName: '',
        email: '',
        message: ''
    });

    const [loading, setLoading] = useState(false);

    const handleChange = (e) => {
        setForm({ ...form, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const res = await fetch('http://localhost:3001/api/contacts', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(form)
            });

            if (res.ok) {
                navigate('/contact/thank-you');
            } else {
                const data = await res.json();
                alert('Submission failed: ' + (data.message || 'Unknown error'));
            }
        } catch (error) {
            console.error(error);
            alert('Server error. Please try again later.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Container maxWidth="sm" sx={{ mt: 10, mb: 10 }}>
            <Paper elevation={3} sx={{ p: 4, borderRadius: 3 }}>
                <Box textAlign="center" mb={3}>
                    <Typography variant="h4" fontWeight="bold" color="error.main" gutterBottom>
                        📬 Contact Us
                    </Typography>
                    <Typography variant="body1" color="text.secondary">
                        Have questions or feedback? Reach out to us.
                    </Typography>
                </Box>

                <Box component="form" onSubmit={handleSubmit} noValidate>
                    <TextField
                        fullWidth
                        label="Full Name"
                        name="fullName"
                        value={form.fullName}
                        onChange={handleChange}
                        required
                        margin="normal"
                    />
                    <TextField
                        fullWidth
                        label="Email Address"
                        name="email"
                        type="email"
                        value={form.email}
                        onChange={handleChange}
                        required
                        margin="normal"
                    />
                    <TextField
                        fullWidth
                        label="Your Message"
                        name="message"
                        multiline
                        rows={4}
                        value={form.message}
                        onChange={handleChange}
                        required
                        margin="normal"
                    />
                    <Box mt={3} textAlign="center">
                        <Button
                            type="submit"
                            variant="contained"
                            color="error"
                            size="large"
                            disabled={loading}
                        >
                            {loading ? 'Sending...' : 'Send Message'}
                        </Button>
                    </Box>
                </Box>
            </Paper>
        </Container>
    );
};

export default Contact;
