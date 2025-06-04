import React from 'react';
import { Outlet } from 'react-router-dom';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { Box, Toolbar } from '@mui/material';

const MainLayout = () => {
    return (
        <>
            <Header />
            {/* Add spacing to prevent content being hidden behind AppBar */}
            <Toolbar />
            <Box component="main" sx={{ minHeight: 'calc(100vh - 200px)', px: 2 }}>
                <Outlet />
            </Box>
            <Footer />
        </>
    );
};

export default MainLayout;
