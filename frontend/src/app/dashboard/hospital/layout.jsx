'use client';
import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Box, Toolbar, useTheme } from '@mui/material';
import HospitalSidebar from '@/components/hospital/HospitalSidebar';
import HospitalNavbar from '@/components/hospital/HospitalNavbar';
import { useAuth } from '@/store/AuthContext';

export default function HospitalLayout({ children }) {
  const { isHospitalStaff } = useAuth();
  const router = useRouter();
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    if (mounted && !isHospitalStaff) router.replace('/hospital/login');
  }, [mounted, isHospitalStaff, router]);

  if (!mounted || !isHospitalStaff) return null;

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: isDark ? '#121212' : '#f8f9fa', color: 'text.primary' }}>
      <HospitalSidebar />
      <Box sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        <HospitalNavbar />
        <Box component="main" sx={{ flexGrow: 1, p: { xs: 2, md: 3 } }}>
          <Toolbar />
          {children}
        </Box>
      </Box>
    </Box>
  );
}
