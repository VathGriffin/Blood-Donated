import React from 'react';
import {
    Container,
    Typography,
    Box,
    Paper,
    Grid,
    Divider,
    Chip,
    Button,
} from '@mui/material';
import BloodtypeIcon from '@mui/icons-material/Bloodtype';
import VolunteerActivismIcon from '@mui/icons-material/VolunteerActivism';
import LocalHospitalIcon from '@mui/icons-material/LocalHospital';
import LocalShippingIcon from '@mui/icons-material/LocalShipping';

const stats = [
    { icon: <BloodtypeIcon color="error" fontSize="large" />, label: '15,000+', desc: 'Units of Blood Collected' },
    { icon: <VolunteerActivismIcon color="error" fontSize="large" />, label: '5,000+', desc: 'Active Donors' },
    { icon: <LocalHospitalIcon color="error" fontSize="large" />, label: '50+', desc: 'Partner Hospitals' },
    { icon: <LocalShippingIcon color="error" fontSize="large" />, label: '20+', desc: 'Annual Blood Drives' },
];

const reasons = [
    'Bridges hospitals, donors, and the community',
    'Enables data-driven blood management',
    'Real-time stock updates and instant notifications',
    'Prioritizes user privacy and data security',
    'Cultivates voluntary blood donation nationwide',
];

const techs = [
    'React.js', 'Node.js', 'MongoDB', 'Express',
    'GitHub Actions', 'Docker',
];

const About = () => {
    return (
        <Container maxWidth="lg" sx={{ mt: 10, mb: 12 }}>
            <Paper elevation={4} sx={{ p: { xs: 3, md: 5 }, borderRadius: 4 }}>
                <Typography
                    variant="h4"
                    fontWeight="bold"
                    color="error.main"
                    gutterBottom
                    textAlign="center"
                >
                    About Our Project
                </Typography>

                <Typography
                    variant="subtitle1"
                    color="text.secondary"
                    textAlign="center"
                    sx={{ mb: 4 }}
                >
                    Revolutionizing blood donation and inventory management across Cambodia.
                </Typography>

                {/* Description */}
                <Typography variant="body1" color="text.secondary" sx={{ lineHeight: 1.8 }}>
                    <strong>Blood Bank Management System</strong> is a full-stack web app built by 4th-year Data Science students
                    at the Institute of Technology of Cambodia. With real-time inventory, donor management, and automated alerts, the platform
                    connects hospitals, donors, and communities.
                </Typography>

                <Typography variant="body1" color="text.secondary" sx={{ mt: 2, lineHeight: 1.8 }}>
                    Built using <strong>React</strong> and <strong>Node.js</strong>, the system supports the complete cycle—from donor registration
                    and blood testing to inventory updates and hospital approvals.
                </Typography>

                {/* Statistics */}
                <Box mt={5}>
                    <Grid container spacing={4}>
                        {stats.map((item, idx) => (
                            <Grid item xs={6} sm={3} key={idx}>
                                <Box textAlign="center">
                                    <Box mb={1} sx={{ color: 'error.main' }}>{item.icon}</Box>
                                    <Typography variant="h5" fontWeight="bold">{item.label}</Typography>
                                    <Typography variant="body2" color="text.secondary">{item.desc}</Typography>
                                </Box>
                            </Grid>
                        ))}
                    </Grid>
                </Box>

                <Divider sx={{ my: 5 }} />

                {/* Why Section */}
                <Typography variant="h5" fontWeight="bold" gutterBottom color="error.dark">
                    Why This Project?
                </Typography>
                <Box component="ul" sx={{ pl: 3, mt: 2 }}>
                    {reasons.map((text, idx) => (
                        <li key={idx}>
                            <Typography variant="body1" color="text.secondary" sx={{ mb: 1 }}>
                                🩸 {text}
                            </Typography>
                        </li>
                    ))}
                </Box>

                <Divider sx={{ my: 5 }} />

                {/* DevOps Section */}
                <Typography variant="h5" fontWeight="bold" gutterBottom color="error.dark">
                    DevOps & CI/CD Practices
                </Typography>
                <Typography variant="body1" color="text.secondary" mt={1} mb={2}>
                    We implement modern deployment practices to ensure system reliability:
                </Typography>
                <Box component="ul" sx={{ pl: 3 }}>
                    <li>
                        <Typography variant="body1" color="text.secondary" sx={{ mb: 1 }}>
                            🚀 Automated integration & deployment via <strong>GitHub Actions</strong>
                        </Typography>
                    </li>
                    <li>
                        <Typography variant="body1" color="text.secondary" sx={{ mb: 1 }}>
                            🐳 Consistent containerization using <strong>Docker</strong>
                        </Typography>
                    </li>
                    <li>
                        <Typography variant="body1" color="text.secondary">
                            ⚡ Rapid, scalable feature delivery for hospitals and users
                        </Typography>
                    </li>
                </Box>

                <Divider sx={{ my: 5 }} />

                {/* Technology Stack */}
                <Typography variant="h5" fontWeight="bold" gutterBottom color="error.dark">
                    Technology Stack
                </Typography>
                <Box display="flex" flexWrap="wrap" gap={1.5} mt={2}>
                    {techs.map((tech, i) => (
                        <Chip
                            key={i}
                            label={tech}
                            variant="outlined"
                            color="error"
                            sx={{ fontWeight: 'bold', px: 1.5 }}
                        />
                    ))}
                </Box>

                {/* CTA Section */}
                <Box textAlign="center" mt={8}>
                    <Typography variant="h6" gutterBottom>
                        Ready to make a difference?
                    </Typography>
                    <Button variant="contained" color="error" size="large" href="/donate">
                        Become a Donor
                    </Button>
                </Box>
            </Paper>
        </Container>
    );
};

export default About;
