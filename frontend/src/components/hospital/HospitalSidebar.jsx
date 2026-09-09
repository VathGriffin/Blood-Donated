'use client';
import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Drawer, List, ListItemButton, ListItemIcon, ListItemText, Box, useTheme, Typography } from '@mui/material';
import { Dashboard, LocalHospital, Inventory2, CalendarMonth, QrCodeScanner, ArrowBack, Favorite } from '@mui/icons-material';

const drawerWidth = 244;

const nav = [
  { label: 'Overview',        icon: <Dashboard sx={{ fontSize: 18 }} />,        path: '/dashboard/hospital' },
  { label: 'Blood Requests',  icon: <LocalHospital sx={{ fontSize: 18 }} />,    path: '/dashboard/hospital/requests' },
  { label: 'Inventory',       icon: <Inventory2 sx={{ fontSize: 18 }} />,       path: '/dashboard/hospital/inventory' },
  { label: 'Appointments',    icon: <CalendarMonth sx={{ fontSize: 18 }} />,    path: '/dashboard/hospital/appointments' },
  { label: 'Scan Donor QR',   icon: <QrCodeScanner sx={{ fontSize: 18 }} />,    path: '/dashboard/hospital/scan' },
];

export default function HospitalSidebar() {
  const pathname = usePathname();
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const bg = isDark ? '#0a0a0a' : '#ffffff';
  const border = isDark ? '#1f1f1f' : '#e5e5e5';
  const isSelected = (path) => (path === '/dashboard/hospital' ? pathname === path : pathname.startsWith(path));

  return (
    <Drawer variant="permanent" sx={{
      width: drawerWidth, flexShrink: 0,
      [`& .MuiDrawer-paper`]: { width: drawerWidth, boxSizing: 'border-box', backgroundColor: bg, borderRight: `1px solid ${border}`, boxShadow: 'none' },
    }}>
      <Box sx={{ px: 3, pt: 11, pb: 2.5, borderBottom: `1px solid ${border}` }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.2 }}>
          <Box sx={{
            width: 32, height: 32, borderRadius: '10px', background: 'linear-gradient(135deg, #1565c0 0%, #0d47a1 100%)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 8px rgba(21,101,192,0.35)', flexShrink: 0,
          }}>
            <Favorite sx={{ fontSize: 16, color: 'white' }} />
          </Box>
          <Box>
            <Typography fontWeight={800} fontSize="0.95rem" letterSpacing="-0.02em" sx={{ color: isDark ? '#f5f5f5' : '#111111', lineHeight: 1.2 }}>
              Blood<Box component="span" sx={{ color: '#1565c0' }}>Life</Box>
            </Typography>
            <Typography variant="caption" sx={{ color: isDark ? '#555' : '#999', fontWeight: 500, fontSize: '0.68rem', letterSpacing: '0.04em', textTransform: 'uppercase' }}>
              Hospital Panel
            </Typography>
          </Box>
        </Box>
      </Box>

      <Box sx={{ flex: 1, overflowY: 'auto', px: 1.5, py: 2 }}>
        <List dense disablePadding>
          {nav.map((item) => {
            const active = isSelected(item.path);
            return (
              <ListItemButton key={item.label} component={Link} href={item.path}
                sx={{
                  borderRadius: '10px', mb: 0.5, py: 0.9, px: 1.5, transition: 'all 0.15s ease',
                  backgroundColor: active ? (isDark ? 'rgba(21,101,192,0.18)' : '#e8f1fc') : 'transparent',
                  color: active ? '#1565c0' : isDark ? 'rgba(245,245,245,0.6)' : '#555',
                  '&:hover': { backgroundColor: active ? (isDark ? 'rgba(21,101,192,0.18)' : '#e8f1fc') : (isDark ? 'rgba(255,255,255,0.04)' : '#f5f5f5') },
                  '& .MuiListItemIcon-root': { color: active ? '#1565c0' : isDark ? 'rgba(245,245,245,0.4)' : '#999' },
                }}>
                <ListItemIcon sx={{ minWidth: 34 }}>{item.icon}</ListItemIcon>
                <ListItemText primary={item.label} primaryTypographyProps={{ fontWeight: active ? 700 : 500, fontSize: '0.855rem' }} />
                {active && <Box sx={{ width: 5, height: 5, borderRadius: '50%', bgcolor: '#1565c0', flexShrink: 0 }} />}
              </ListItemButton>
            );
          })}
        </List>
      </Box>

      <Box sx={{ borderTop: `1px solid ${border}`, p: 1.5 }}>
        <ListItemButton component={Link} href="/" sx={{ borderRadius: '10px', py: 0.9, px: 1.5, color: isDark ? 'rgba(245,245,245,0.45)' : '#999', '&:hover': { color: '#1565c0' } }}>
          <ListItemIcon sx={{ minWidth: 34 }}><ArrowBack sx={{ fontSize: 18 }} /></ListItemIcon>
          <ListItemText primary="Back to Website" primaryTypographyProps={{ fontSize: '0.83rem', fontWeight: 500 }} />
        </ListItemButton>
      </Box>
    </Drawer>
  );
}
