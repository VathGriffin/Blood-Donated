import {
    Container,
    Typography,
    Box,
    Button,
    Paper,
} from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';

const RequestThankYou = () => {
    return (
        <Container maxWidth="sm" sx={{ mt: 12 }}>
            <Paper elevation={4} sx={{ p: 5, textAlign: 'center', borderRadius: 4 }}>
                <Box display="flex" flexDirection="column" alignItems="center">
                    <CheckCircleOutlineIcon sx={{ fontSize: 60, color: 'success.main', mb: 2 }} />
                    <Typography variant="h4" color="success.main" fontWeight="bold" gutterBottom>
                        Request Submitted!
                    </Typography>
                    <Typography variant="body1" color="text.secondary" sx={{ mb: 4, maxWidth: 400 }}>
                        Thank you for your request. Our team is currently processing your blood request and will contact you as soon as possible.
                    </Typography>
                    <Box display="flex" justifyContent="center" gap={2} flexWrap="wrap">
                        <Button
                            variant="contained"
                            color="error"
                            component={RouterLink}
                            to="/"
                        >
                            Back to Home
                        </Button>
                        <Button
                            variant="outlined"
                            color="error"
                            component={RouterLink}
                            to="/donate"
                        >
                            Become a Donor
                        </Button>
                    </Box>
                </Box>
            </Paper>
        </Container>
    );
};

export default RequestThankYou;
