'use client';
import React, { useContext } from 'react';
import { AppBar, Toolbar, Typography, IconButton, Box, Tooltip, useTheme, Chip, Button } from '@mui/material';
import { Brightness4, Brightness7, Logout, LocalHospital } from '@mui/icons-material';
import { usePathname, useRouter } from 'next/navigation';
import { ColorModeContext } from '@/lib/ThemeContext';
import { useAuth } from '@/store/AuthContext';

const breadcrumbMap = {
  '/dashboard/hospital': 'Overview',
  '/dashboard/hospital/requests': 'Blood Requests',
  '/dashboard/hospital/inventory': 'Inventory',
  '/dashboard/hospital/appointments': 'Appointments',
  '/dashboard/hospital/scan': 'Scan Donor QR',
};

export default function HospitalNavbar() {
  const { toggleColorMode } = useContext(ColorModeContext);
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const pathname = usePathname();
  const router = useRouter();
  const { staff, logout } = useAuth();
  const currentPage = breadcrumbMap[pathname] || 'Hospital';

  const handleLogout = () => { logout(); router.replace('/hospital/login'); };

  return (
    <AppBar position="fixed" elevation={0} sx={{
      zIndex: (t) => t.zIndex.drawer + 1, bgcolor: isDark ? '#111' : '#fff', color: theme.palette.text.primary,
      borderBottom: `1px solid ${isDark ? '#1e1e1e' : '#f0f0f0'}`, backdropFilter: 'blur(8px)',
    }}>
      <Toolbar sx={{ justifyContent: 'space-between', minHeight: '64px !important', px: { xs: 2, md: 3 } }}>
        <Typography fontWeight={700} fontSize="0.95rem">{currentPage}</Typography>
        <Box display="flex" alignItems="center" gap={1}>
          <Chip icon={<LocalHospital sx={{ fontSize: '0.85rem !important' }} />} label={staff?.fullName || 'Hospital Staff'}
            size="small" sx={{ fontWeight: 600, fontSize: '0.75rem', bgcolor: isDark ? 'rgba(21,101,192,0.15)' : '#e8f1fc', color: '#1565c0' }} />
          <Tooltip title="Toggle theme">
            <IconButton onClick={toggleColorMode} color="inherit">
              {isDark ? <Brightness7 sx={{ fontSize: 20 }} /> : <Brightness4 sx={{ fontSize: 20 }} />}
            </IconButton>
          </Tooltip>
          <Button size="small" startIcon={<Logout fontSize="small" />} onClick={handleLogout}
            sx={{ textTransform: 'none', fontWeight: 600, color: 'text.secondary' }}>
            Sign Out
          </Button>
        </Box>
      </Toolbar>
    </AppBar>
  );
}
