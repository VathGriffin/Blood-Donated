'use client';
import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Drawer, List, ListItemButton, ListItemIcon, ListItemText,
  Box, useTheme, Typography, Avatar, Button,
} from '@mui/material';
import { Dashboard, PeopleAlt, LocalHospital, Inventory2, CalendarMonth, Chat, ArrowBack, Favorite } from '@mui/icons-material';

const drawerWidth = 256;

const navItems = [
  { label: 'Dashboard',       icon: <Dashboard />,     path: '/dashboard/admin' },
  { label: 'Manage Donors',   icon: <PeopleAlt />,     path: '/dashboard/admin/donors' },
  { label: 'Manage Requests', icon: <LocalHospital />, path: '/dashboard/admin/requests' },
  { label: 'Messages',        icon: <Chat />,          path: '/dashboard/admin/contacts' },
  { label: 'Appointments',    icon: <CalendarMonth />, path: '/dashboard/admin/appointments' },
  { label: 'Inventory',       icon: <Inventory2 />,    path: '/dashboard/admin/inventory' },
];

const Sidebar = () => {
  const pathname = usePathname();
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';

  return (
    <Drawer variant="permanent" sx={{
      width: drawerWidth, flexShrink: 0,
      [`& .MuiDrawer-paper`]: {
        width: drawerWidth, boxSizing: 'border-box',
        background: isDark
          ? 'linear-gradient(180deg, #0a0000 0%, #1a0000 50%, #0d0000 100%)'
          : 'linear-gradient(180deg, #1a0000 0%, #7f0000 50%, #b71c1c 100%)',
        borderRight: 'none', boxShadow: '4px 0 24px rgba(0,0,0,0.35)',
        display: 'flex', flexDirection: 'column', overflow: 'hidden',
      },
    }}>
      <Box sx={{ px: 3, pt: 11, pb: 3, borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Avatar sx={{ width: 42, height: 42, background: 'rgba(255,255,255,0.15)', border: '2px solid rgba(255,255,255,0.25)', backdropFilter: 'blur(4px)' }}>
            <Favorite sx={{ fontSize: 22, color: '#ffcdd2' }} />
          </Avatar>
          <Box>
            <Typography fontWeight={800} fontSize="1rem" color="white" lineHeight={1.2}>Blood Donated</Typography>
            <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.55)', fontWeight: 500 }}>Admin Panel</Typography>
          </Box>
        </Box>
      </Box>

      <Box sx={{ px: 3, pt: 3, pb: 1 }}>
        <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.35)', fontWeight: 700, letterSpacing: '0.12em', fontSize: '0.65rem', textTransform: 'uppercase' }}>
          Main Menu
        </Typography>
      </Box>

      <Box sx={{ flex: 1, overflowY: 'auto', px: 1.5, pb: 2, '&::-webkit-scrollbar': { width: 4 }, '&::-webkit-scrollbar-thumb': { background: 'rgba(255,255,255,0.15)', borderRadius: 2 } }}>
        <List dense disablePadding>
          {navItems.map((item) => {
            const isSelected = pathname === item.path || (item.path === '/dashboard/admin' && pathname === '/dashboard/admin');
            return (
              <ListItemButton key={item.label} component={Link} href={item.path} selected={isSelected}
                sx={{
                  borderRadius: 2.5, mb: 0.5, py: 1.3, px: 1.5, transition: 'all 0.2s ease',
                  color: isSelected ? 'white' : 'rgba(255,255,255,0.6)',
                  '&.Mui-selected': { backgroundColor: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(8px)', border: '1px solid rgba(255,255,255,0.2)', color: 'white', '& .MuiListItemIcon-root': { color: 'white' } },
                  '&:hover:not(.Mui-selected)': { backgroundColor: 'rgba(255,255,255,0.08)', color: 'white', '& .MuiListItemIcon-root': { color: 'rgba(255,255,255,0.9)' } },
                }}>
                <ListItemIcon sx={{ minWidth: 38, color: isSelected ? 'white' : 'rgba(255,255,255,0.45)', transition: 'color 0.2s' }}>
                  {item.icon}
                </ListItemIcon>
                <ListItemText primary={item.label} primaryTypographyProps={{ fontWeight: isSelected ? 700 : 500, fontSize: '0.875rem' }} />
                {isSelected && <Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: '#ffcdd2' }} />}
              </ListItemButton>
            );
          })}
        </List>
      </Box>

      <Box sx={{ borderTop: '1px solid rgba(255,255,255,0.08)', p: 2 }}>
        <Button component={Link} href="/" fullWidth startIcon={<ArrowBack sx={{ fontSize: '1rem !important' }} />}
          sx={{ borderRadius: 2.5, textTransform: 'none', fontWeight: 600, fontSize: '0.82rem', py: 1, color: 'rgba(255,255,255,0.7)', border: '1px solid rgba(255,255,255,0.15)', '&:hover': { backgroundColor: 'rgba(255,255,255,0.1)', color: 'white', borderColor: 'rgba(255,255,255,0.3)' } }}>
          Back to Website
        </Button>
        <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.25)', display: 'block', textAlign: 'center', mt: 1.5, fontSize: '0.68rem' }}>
          v1.0.0 • Blood Donated
        </Typography>
      </Box>
    </Drawer>
  );
};

export default Sidebar;
