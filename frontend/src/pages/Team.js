import React from 'react';
import {
    Container,
    Typography,
    Grid,
    Card,
    CardContent,
    Box,
    Avatar,
    Fade,
} from '@mui/material';

const teamMembers = [
    {
        name: 'Dr. Sopheak Sok',
        role: 'System Architect',
        image: 'https://i.pravatar.cc/300?img=1',
    },
    {
        name: 'Chanthou Hem',
        role: 'Backend Developer',
        image: 'https://i.pravatar.cc/300?img=2',
    },
    {
        name: 'Dara Khieu',
        role: 'UI/UX Designer',
        image: 'https://i.pravatar.cc/300?img=3',
    },
    {
        name: 'Pisey Keo',
        role: 'Frontend Developer',
        image: 'https://i.pravatar.cc/300?img=4',
    },
];

const Team = () => {
    return (
        <Container maxWidth="lg" sx={{ mt: 10, mb: 8 }}>
            <Typography
                variant="h3"
                fontWeight="bold"
                color="error.main"
                align="center"
                gutterBottom
            >
                Meet Our Team
            </Typography>
            <Typography
                variant="body1"
                color="text.secondary"
                align="center"
                mb={6}
            >
                Our passionate team is committed to building a life-saving blood donation system.
            </Typography>

            <Grid container spacing={4} justifyContent="center">
                {teamMembers.map((member, idx) => (
                    <Grid item xs={12} sm={6} md={3} key={idx}>
                        <Fade in timeout={500 + idx * 200}>
                            <Card
                                sx={{
                                    textAlign: 'center',
                                    boxShadow: 4,
                                    borderRadius: 4,
                                    transition: 'transform 0.3s ease',
                                    '&:hover': {
                                        transform: 'translateY(-8px)',
                                        boxShadow: 6,
                                    },
                                    p: 2,
                                }}
                            >
                                <Box display="flex" justifyContent="center" mb={2}>
                                    <Avatar
                                        src={member.image}
                                        alt={member.name}
                                        sx={{ width: 100, height: 100 }}
                                    />
                                </Box>
                                <CardContent>
                                    <Typography variant="h6" fontWeight="bold">
                                        {member.name}
                                    </Typography>
                                    <Typography variant="body2" color="text.secondary">
                                        {member.role}
                                    </Typography>
                                </CardContent>
                            </Card>
                        </Fade>
                    </Grid>
                ))}
            </Grid>
        </Container>
    );
};

export default Team;
