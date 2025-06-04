import React, { useState } from 'react';
import {
  Container,
  Box,
  Typography,
  Button,
  Card,
  CardMedia,
  Grid,
  Dialog,
  DialogTitle,
  DialogContent,
} from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import VolunteerActivismIcon from '@mui/icons-material/VolunteerActivism';
import LocalHospitalIcon from '@mui/icons-material/LocalHospital';
import FavoriteIcon from '@mui/icons-material/Favorite';
import PeopleIcon from '@mui/icons-material/People';
import BloodtypeIcon from '@mui/icons-material/Bloodtype';
import LocalPharmacyIcon from '@mui/icons-material/LocalPharmacy';

const features = [
  {
    icon: <VolunteerActivismIcon sx={{ fontSize: 36, color: '#b71c1c' }} />,
    title: 'Donate Blood',
    desc: 'Register now and become someone’s hero today.',
    link: '/donate',
    label: 'DONATE',
    bg: '#fdecea',
  },
  {
    icon: <LocalHospitalIcon sx={{ fontSize: 36, color: '#ad1457' }} />,
    title: 'Request Blood',
    desc: 'Submit your blood request and get immediate assistance.',
    link: '/request',
    label: 'REQUEST',
    bg: '#f3e5f5',
  },
  {
    icon: <FavoriteIcon sx={{ fontSize: 36, color: '#d81b60' }} />,
    title: 'Donor List',
    desc: 'Browse our donor community to find suitable matches.',
    link: '/donors',
    label: 'VIEW DONORS',
    bg: '#fce4ec',
  },
];

const statistics = [
  {
    icon: <PeopleIcon sx={{ fontSize: 30, color: '#e53935' }} />,
    value: '15,000+',
    label: 'Registered Donors',
  },
  {
    icon: <BloodtypeIcon sx={{ fontSize: 30, color: '#8e24aa' }} />,
    value: '7,500+',
    label: 'Units Available',
  },
  {
    icon: <LocalPharmacyIcon sx={{ fontSize: 30, color: '#3949ab' }} />,
    value: '120+',
    label: 'Hospitals Supported',
  },
];

const Home = () => {
  const [openDialog, setOpenDialog] = useState(false);

  const handleOpenDialog = () => setOpenDialog(true);
  const handleCloseDialog = () => setOpenDialog(false);

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
            BECOME A DONOR
          </Button>
          <Button
            variant="outlined"
            size="large"
            color="error"
            component={RouterLink}
            to="/request"
            sx={{ px: 4 }}
          >
            NEED BLOOD?
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

      {/* Statistics Section */}
      <Grid container spacing={4} justifyContent="center" sx={{ mb: 10 }}>
        {statistics.map((stat, idx) => (
          <Grid item xs={12} sm={4} key={idx} textAlign="center">
            <Box mb={1}>{stat.icon}</Box>
            <Typography variant="h5" fontWeight={700}>
              {stat.value}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {stat.label}
            </Typography>
          </Grid>
        ))}
      </Grid>

      {/* Clickable Image with Styled Dialog */}
      <Box
        onClick={handleOpenDialog}
        sx={{
          borderRadius: 4,
          overflow: 'hidden',
          boxShadow: 3,
          mb: 10,
          cursor: 'pointer',
          transition: '0.3s ease',
          '&:hover': {
            boxShadow: 6,
            transform: 'translateY(-5px)',
          },
        }}
      >
        <Card sx={{ borderRadius: 0 }}>
          <CardMedia
            component="img"
            image="https://img.freepik.com/free-photo/group-young-people-holding-donation-banner_53876-64902.jpg"
            alt="I'm a blood donor"
            sx={{
              height: { xs: 250, md: 400 },
              width: '100%',
              objectFit: 'cover',
            }}
          />
        </Card>
      </Box>

      {/* Beautiful Expanded Dialog */}
      <Dialog
        open={openDialog}
        onClose={handleCloseDialog}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 3,
            p: 3,
            backgroundColor: '#fff8f8',
            boxShadow: 6,
          },
        }}
      >
        <DialogTitle
          sx={{
            display: 'flex',
            alignItems: 'center',
            fontWeight: 700,
            color: '#b71c1c',
            mb: 1,
          }}
        >
          ❤️ Blood Donation Awareness
        </DialogTitle>
        <DialogContent>
          <Typography variant="body1" sx={{ lineHeight: 1.8, color: '#444', mb: 2 }}>
            This image represents the joy and connection among volunteers and donors.
          </Typography>

          <Typography variant="subtitle1" sx={{ fontWeight: 600, color: '#b71c1c', mt: 2 }}>
            🩸 Why Donate Blood?
          </Typography>
          <Typography variant="body2" sx={{ lineHeight: 1.7, color: '#555', mb: 2 }}>
            Every 2 seconds, someone in the world needs blood. Blood cannot be manufactured,
            and regular donations are essential for surgeries, cancer treatment, chronic
            illnesses, and traumatic injuries.
          </Typography>

          <Typography variant="subtitle1" sx={{ fontWeight: 600, color: '#b71c1c', mt: 2 }}>
            💡 Benefits of Donating Blood
          </Typography>
          <ul style={{ color: '#555', paddingLeft: '20px', marginTop: '8px' }}>
            <li>Helps save lives</li>
            <li>Stimulates blood cell production</li>
            <li>Free health check during donation</li>
            <li>Improves cardiovascular health</li>
            <li>Brings a sense of purpose and community</li>
          </ul>

          <Typography variant="subtitle1" sx={{ fontWeight: 600, color: '#b71c1c', mt: 3 }}>
            ✅ Who Can Donate?
          </Typography>
          <Typography variant="body2" sx={{ lineHeight: 1.7, color: '#555' }}>
            Most healthy adults between 18–60 years old who weigh at least 45kg can donate.
            It’s safe, simple, and only takes about 15 minutes.
          </Typography>

          <Box textAlign="right" mt={4}>
            <Button onClick={handleCloseDialog} variant="contained" color="error">
              Close
            </Button>
          </Box>
        </DialogContent>
      </Dialog>
    </Container>
  );
};

export default Home;
