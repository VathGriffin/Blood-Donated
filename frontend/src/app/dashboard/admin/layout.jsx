'use client';
import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Box, Toolbar, useTheme } from '@mui/material';
import Sidebar from '@/components/admin/Sidebar';
import AdminNavbar from '@/components/admin/AdminNavbar';
import { useAuth } from '@/store/AuthContext';

export default function AdminLayout({ children }) {
  const { isAuth } = useAuth();
  const router = useRouter();
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    if (mounted && !isAuth) router.replace('/admin/login');
  }, [mounted, isAuth, router]);

  if (!mounted || !isAuth) return null;

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: isDark ? '#121212' : '#f8f9fa', color: 'text.primary' }}>
      <Sidebar />
      <Box sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        <AdminNavbar />
        <Box component="main" sx={{ flexGrow: 1, p: { xs: 2, md: 3 } }}>
          <Toolbar />
          {children}
        </Box>
      </Box>
    </Box>
  );
}
