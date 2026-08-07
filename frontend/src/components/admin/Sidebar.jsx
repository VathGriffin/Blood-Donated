'use client';
import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Drawer, List, ListItemButton, ListItemIcon, ListItemText,
  Box, useTheme, Typography, Divider,
} from '@mui/material';
import {
  Dashboard, PeopleAlt, LocalHospital, Inventory2, CalendarMonth,
  Chat, ArrowBack, Favorite, Assessment, NotificationsNone,
  ManageAccounts, Settings,
} from '@mui/icons-material';

const drawerWidth = 244;

const mainNav = [
  { label: 'Dashboard',       icon: <Dashboard sx={{ fontSize: 18 }} />,         path: '/dashboard/admin' },
  { label: 'Donors',          icon: <PeopleAlt sx={{ fontSize: 18 }} />,          path: '/dashboard/admin/donors' },
  { label: 'Appointments',    icon: <CalendarMonth sx={{ fontSize: 18 }} />,      path: '/dashboard/admin/appointments' },
  { label: 'Blood Inventory', icon: <Inventory2 sx={{ fontSize: 18 }} />,         path: '/dashboard/admin/inventory' },
  { label: 'Blood Requests',  icon: <LocalHospital sx={{ fontSize: 18 }} />,      path: '/dashboard/admin/requests' },
  { label: 'Messages',        icon: <Chat sx={{ fontSize: 18 }} />,               path: '/dashboard/admin/contacts' },
];

const systemNav = [
  { label: 'Reports',         icon: <Assessment sx={{ fontSize: 18 }} />,         path: '/dashboard/admin/contacts' },
  { label: 'Notifications',   icon: <NotificationsNone sx={{ fontSize: 18 }} />,  path: '/dashboard/admin/contacts' },
  { label: 'Users',           icon: <ManageAccounts sx={{ fontSize: 18 }} />,     path: '/dashboard/admin/donors' },
  { label: 'Settings',        icon: <Settings sx={{ fontSize: 18 }} />,           path: '/dashboard/admin/settings' },
];

const Sidebar = () => {
  const pathname = usePathname();
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';

  const bg = isDark ? '#0a0a0a' : '#ffffff';
  const border = isDark ? '#1f1f1f' : '#e5e5e5';

  const isSelected = (path) =>
    path === '/dashboard/admin' ? pathname === path : pathname.startsWith(path);

  const NavItem = ({ item }) => {
    const active = isSelected(item.path);
    return (
      <ListItemButton component={Link} href={item.path}
        sx={{
          borderRadius: '10px', mb: 0.5, py: 0.9, px: 1.5,
          transition: 'all 0.15s ease',
          backgroundColor: active ? (isDark ? 'rgba(220,38,38,0.15)' : '#fff0f0') : 'transparent',
          color: active ? '#dc2626' : isDark ? 'rgba(245,245,245,0.6)' : '#555555',
          '&:hover': {
            backgroundColor: active
              ? (isDark ? 'rgba(220,38,38,0.15)' : '#fff0f0')
              : isDark ? 'rgba(255,255,255,0.04)' : '#f5f5f5',
            color: active ? '#dc2626' : isDark ? '#f5f5f5' : '#111111',
          },
          '& .MuiListItemIcon-root': {
            color: active ? '#dc2626' : isDark ? 'rgba(245,245,245,0.4)' : '#999999',
          },
        }}>
        <ListItemIcon sx={{ minWidth: 34, transition: 'color 0.15s ease' }}>
          {item.icon}
        </ListItemIcon>
        <ListItemText
          primary={item.label}
          primaryTypographyProps={{
            fontWeight: active ? 700 : 500,
            fontSize: '0.855rem',
            letterSpacing: '-0.01em',
          }}
        />
        {active && (
          <Box sx={{ width: 5, height: 5, borderRadius: '50%', bgcolor: '#dc2626', flexShrink: 0 }} />
        )}
      </ListItemButton>
    );
  };

  return (
    <Drawer variant="permanent" sx={{
      width: drawerWidth, flexShrink: 0,
      [`& .MuiDrawer-paper`]: {
        width: drawerWidth, boxSizing: 'border-box',
        backgroundColor: bg,
        borderRight: `1px solid ${border}`,
        display: 'flex', flexDirection: 'column', overflow: 'hidden',
        boxShadow: 'none',
      },
    }}>

      {/* Brand */}
      <Box sx={{ px: 3, pt: 11, pb: 2.5, borderBottom: `1px solid ${border}` }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.2 }}>
          <Box sx={{
            width: 32, height: 32, borderRadius: '10px',
            background: 'linear-gradient(135deg, #dc2626 0%, #991b1b 100%)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 2px 8px rgba(220,38,38,0.35)',
            flexShrink: 0,
          }}>
            <Favorite sx={{ fontSize: 16, color: 'white' }} />
          </Box>
          <Box>
            <Typography fontWeight={800} fontSize="0.95rem" letterSpacing="-0.02em" sx={{ color: isDark ? '#f5f5f5' : '#111111', lineHeight: 1.2 }}>
              Blood<Box component="span" sx={{ color: '#dc2626' }}>Life</Box>
            </Typography>
            <Typography variant="caption" sx={{ color: isDark ? '#555555' : '#999999', fontWeight: 500, fontSize: '0.68rem', letterSpacing: '0.04em', textTransform: 'uppercase' }}>
              Admin Panel
            </Typography>
          </Box>
        </Box>
      </Box>

      <Box sx={{ flex: 1, overflowY: 'auto', px: 1.5, py: 2, '&::-webkit-scrollbar': { display: 'none' } }}>

        {/* Management section */}
        <Typography variant="caption" sx={{
          color: isDark ? 'rgba(245,245,245,0.25)' : '#bbbbbb',
          fontWeight: 700, letterSpacing: '0.10em', fontSize: '0.63rem',
          textTransform: 'uppercase', px: 1.5, mb: 1, display: 'block',
        }}>
          Management
        </Typography>
        <List dense disablePadding sx={{ mb: 2.5 }}>
          {mainNav.map((item) => <NavItem key={item.label} item={item} />)}
        </List>

        <Divider sx={{ borderColor: border, mx: 1, mb: 2.5 }} />

        {/* System section */}
        <Typography variant="caption" sx={{
          color: isDark ? 'rgba(245,245,245,0.25)' : '#bbbbbb',
          fontWeight: 700, letterSpacing: '0.10em', fontSize: '0.63rem',
          textTransform: 'uppercase', px: 1.5, mb: 1, display: 'block',
        }}>
          System
        </Typography>
        <List dense disablePadding>
          {systemNav.map((item) => <NavItem key={item.label} item={item} />)}
        </List>
      </Box>

      {/* Back to site */}
      <Box sx={{ borderTop: `1px solid ${border}`, p: 1.5 }}>
        <ListItemButton component={Link} href="/"
          sx={{
            borderRadius: '10px', py: 0.9, px: 1.5,
            color: isDark ? 'rgba(245,245,245,0.45)' : '#999999',
            transition: 'all 0.15s ease',
            '&:hover': {
              backgroundColor: isDark ? 'rgba(255,255,255,0.04)' : '#f5f5f5',
              color: '#dc2626',
            },
            '& .MuiListItemIcon-root': { color: 'inherit' },
          }}>
          <ListItemIcon sx={{ minWidth: 34 }}>
            <ArrowBack sx={{ fontSize: 18 }} />
          </ListItemIcon>
          <ListItemText
            primary="Back to Website"
            primaryTypographyProps={{ fontSize: '0.83rem', fontWeight: 500, letterSpacing: '-0.01em' }}
          />
        </ListItemButton>
        <Typography variant="caption" sx={{
          color: isDark ? 'rgba(245,245,245,0.2)' : '#cccccc',
          display: 'block', textAlign: 'center',
          mt: 1, fontSize: '0.65rem',
        }}>
          BloodLife v1.0.0
        </Typography>
      </Box>
    </Drawer>
  );
};

export default Sidebar;
