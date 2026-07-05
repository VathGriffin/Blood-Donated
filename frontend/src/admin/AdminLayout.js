import React from 'react';
import { Outlet } from 'react-router-dom';
import { Box, CssBaseline, Toolbar, useTheme } from '@mui/material';
import Sidebar from './Sidebar';
import AdminNavbar from './AdminNavbar';

const AdminLayout = () => {
    const theme = useTheme();
    const isDark = theme.palette.mode === 'dark';

    return (
        <Box sx={{
            display: 'flex',
            minHeight: '100vh',
            bgcolor: isDark ? '#121212' : '#f8f9fa',
            color: 'text.primary',
        }}>
            <CssBaseline />
            <Sidebar />
            <Box sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
                <AdminNavbar />
                <Box
                    component="main"
                    sx={{
                        flexGrow: 1,
                        p: { xs: 2, md: 3 },
                        pt: { xs: 2, md: 3 },
                    }}
                >
                    <Toolbar />
                    <Outlet />
                </Box>
            </Box>
        </Box>
    );
};

export default AdminLayout;
