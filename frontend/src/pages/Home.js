import React from 'react';
import {
  Container,
  Box,
  Typography,
  Button,
  Card,
  CardMedia,
} from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import VolunteerActivismIcon from '@mui/icons-material/VolunteerActivism';
import LocalHospitalIcon from '@mui/icons-material/LocalHospital';
import FavoriteIcon from '@mui/icons-material/Favorite';

const features = [
  {
    icon: <VolunteerActivismIcon sx={{ fontSize: 36, color: '#b71c1c' }} />,
    title: 'Donate Blood',
    desc: 'Register now and become someone’s hero today.',
    link: '/donate',
    label: 'Donate',
    bg: '#fdecea',
  },
  {
    icon: <LocalHospitalIcon sx={{ fontSize: 36, color: '#ad1457' }} />,
    title: 'Request Blood',
    desc: 'Submit your blood request and get immediate assistance.',
    link: '/request',
    label: 'Request',
    bg: '#f3e5f5',
  },
  {
    icon: <FavoriteIcon sx={{ fontSize: 36, color: '#d81b60' }} />,
    title: 'Donor List',
    desc: 'Browse our donor community to find suitable matches.',
    link: '/donors',
    label: 'View Donors',
    bg: '#fce4ec',
  },
];

const Home = () => {
  return (
    <Container maxWidth="lg" sx={{ mt: 10, mb: 8 }}>
      {/* Hero Section */}
      <Box textAlign="center" mb={10}>
        <Typography
          variant="h3"
          component="h1"
          gutterBottom
          sx={{ color: '#b71c1c', fontWeight: 700 }}
        >
          Blood Donation & Inventory Management System
        </Typography>
        <Typography
          variant="h6"
          color="text.secondary"
          maxWidth="700px"
          mx="auto"
          sx={{ mb: 4, lineHeight: 1.7 }}
        >
          A centralized platform to track and manage blood supply efficiently,
          streamline donor registration, monitor real-time inventory, and handle
          hospital requests and critical notifications.
        </Typography>
        <Box>
          <Button
            variant="contained"
            size="large"
            color="error"
            component={RouterLink}
            to="/donate"
            sx={{ mr: 2, px: 4 }}
          >
            Become a Donor
          </Button>
          <Button
            variant="outlined"
            size="large"
            color="error"
            component={RouterLink}
            to="/request"
            sx={{ px: 4 }}
          >
            Need Blood?
          </Button>
        </Box>
      </Box>

      {/* Feature Cards */}
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', md: 'repeat(3, 1fr)' },
          gap: 3,
          mb: 10,
        }}
      >
        {features.map((item, idx) => (
          <Card
            key={idx}
            sx={{
              textAlign: 'center',
              p: 4,
              borderRadius: 4,
              boxShadow: 3,
              transition: '0.3s ease',
              '&:hover': {
                boxShadow: 6,
                transform: 'translateY(-5px)',
              },
            }}
          >
            <Box
              sx={{
                width: 80,
                height: 80,
                borderRadius: '50%',
                mx: 'auto',
                mb: 3,
                backgroundColor: item.bg,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {item.icon}
            </Box>
            <Typography variant="h6" fontWeight={600} gutterBottom>
              {item.title}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              {item.desc}
            </Typography>
            <Button
              variant="outlined"
              color="error"
              size="small"
              component={RouterLink}
              to={item.link}
            >
              {item.label}
            </Button>
          </Card>
        ))}
      </Box>

      {/* Image Section */}
      <Box sx={{ borderRadius: 3, overflow: 'hidden', boxShadow: 4 }}>
        <Card>
          <CardMedia
            component="img"
            image="https://icyhealth.com/wp-content/uploads/2022/09/29137858_blood-donation.jpg"
            alt="Person donating blood"
            sx={{
              height: { xs: 250, md: 420 },
              width: '100%',
              objectFit: 'cover',
            }}
          />
        </Card>
      </Box>
    </Container>
  );
};

export default Home;
