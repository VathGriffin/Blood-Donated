import React from 'react';
import { Outlet } from 'react-router-dom';
import { Box, CssBaseline, Toolbar } from '@mui/material';
import Sidebar from './Sidebar';
import AdminNavbar from './AdminNavbar';

const AdminLayout = () => {
    return (
        <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: 'background.default', color: 'text.primary' }}>
            <CssBaseline />

            {/* Sidebar (cố định bên trái) */}
            <Sidebar />

            {/* Nội dung chính */}
            <Box sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
                {/* Navbar cố định bên trên */}
                <AdminNavbar />

                {/* Nội dung trang */}
                <Box component="main" sx={{ flexGrow: 1, p: 3 }}>
                    <Toolbar /> {/* Đệm chiều cao để tránh navbar đè */}
                    <Outlet />
                </Box>
            </Box>
        </Box>
    );
};

export default AdminLayout;
