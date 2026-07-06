'use client';
import React, { useContext, useState } from 'react';
import {
  AppBar, Toolbar, Typography, IconButton, Box, Tooltip, useTheme,
  Avatar, Badge, Chip, Popover, List, ListItem, ListItemAvatar,
  ListItemText, Divider, Button,
} from '@mui/material';
import { Brightness4, Brightness7, Notifications, NavigateNext, Logout, AdminPanelSettings, FiberManualRecord } from '@mui/icons-material';
import FavoriteIcon from '@mui/icons-material/Favorite';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { ColorModeContext } from '@/lib/ThemeContext';
import { useAuth } from '@/store/AuthContext';
import avatarImg from '@/assets/avatar.png';

const breadcrumbMap = {
  '/dashboard/admin':              'Dashboard',
  '/dashboard/admin/donors':       'Manage Donors',
  '/dashboard/admin/requests':     'Manage Requests',
  '/dashboard/admin/inventory':    'Inventory',
  '/dashboard/admin/contacts':     'Messages',
  '/dashboard/admin/appointments': 'Appointments',
};

const sampleNotifications = [
  { id: 1, text: 'New blood request submitted', sub: '2 minutes ago', avatar: 'R', color: '#ef5350', dot: '#ef5350' },
  { id: 2, text: 'Donor Sopheak registered',    sub: '15 minutes ago', avatar: 'S', color: '#42a5f5', dot: '#42a5f5' },
  { id: 3, text: 'O− stock critically low',     sub: '1 hour ago',     avatar: '!', color: '#ff9800', dot: '#ff9800' },
];

const AdminNavbar = () => {
  const { toggleColorMode } = useContext(ColorModeContext);
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const pathname = usePathname();
  const router = useRouter();
  const { logout } = useAuth();
  const [notifAnchor, setNotifAnchor] = useState(null);
  const [notifCount, setNotifCount] = useState(3);
  const [profileAnchor, setProfileAnchor] = useState(null);

  const currentPage = breadcrumbMap[pathname] || 'Admin';

  const handleNotifOpen = (e) => { setNotifAnchor(e.currentTarget); setNotifCount(0); };
  const handleNotifClose = () => setNotifAnchor(null);
  const handleProfileOpen = (e) => setProfileAnchor(e.currentTarget);
  const handleProfileClose = () => setProfileAnchor(null);
  const handleLogout = () => { handleProfileClose(); logout(); router.replace('/admin/login'); };

  return (
    <>
      <AppBar position="fixed" elevation={0} sx={{
        zIndex: (t) => t.zIndex.drawer + 1,
        bgcolor: isDark ? '#111' : '#fff',
        color: theme.palette.text.primary,
        borderBottom: `1px solid ${isDark ? '#1e1e1e' : '#f0f0f0'}`,
        backdropFilter: 'blur(8px)',
      }}>
        <Toolbar sx={{ justifyContent: 'space-between', minHeight: '64px !important', px: { xs: 2, md: 3 } }}>
          <Box display="flex" alignItems="center" gap={1}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <FavoriteIcon sx={{ fontSize: 18, color: '#b71c1c' }} />
              <Typography fontWeight={800} fontSize="0.95rem" color="error.main" sx={{ display: { xs: 'none', sm: 'block' } }}>
                Blood Donated
              </Typography>
            </Box>
            <NavigateNext sx={{ color: 'text.disabled', fontSize: 18, display: { xs: 'none', sm: 'block' } }} />
            <Box sx={{ display: { xs: 'none', sm: 'flex' }, alignItems: 'center', gap: 0.5 }}>
              <Link href="/dashboard/admin" style={{ textDecoration: 'none', color: theme.palette.text.secondary, fontSize: '0.8rem', fontWeight: 500 }}>
                Admin
              </Link>
              <NavigateNext sx={{ color: 'text.disabled', fontSize: 14 }} />
              <Typography fontWeight={700} fontSize="0.8rem" color="text.primary">{currentPage}</Typography>
            </Box>
            <Typography variant="h6" fontWeight={700} sx={{ display: { xs: 'block', sm: 'none' } }}>{currentPage}</Typography>
          </Box>

          <Box display="flex" alignItems="center" gap={0.5}>
            <Chip label={new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
              size="small" sx={{ fontSize: '0.72rem', display: { xs: 'none', md: 'flex' }, fontWeight: 600, bgcolor: isDark ? '#1e1e1e' : '#f5f5f5' }} />

            <Tooltip title="Notifications">
              <IconButton color="inherit" onClick={handleNotifOpen} sx={{ '&:hover': { bgcolor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)' } }}>
                <Badge badgeContent={notifCount} color="error" sx={{ '& .MuiBadge-badge': { fontSize: '0.6rem', minWidth: 16, height: 16 } }}>
                  <Notifications sx={{ fontSize: 22 }} />
                </Badge>
              </IconButton>
            </Tooltip>

            <Tooltip title="Toggle theme">
              <IconButton onClick={toggleColorMode} color="inherit" sx={{ '&:hover': { bgcolor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)' } }}>
                {isDark ? <Brightness7 sx={{ fontSize: 22 }} /> : <Brightness4 sx={{ fontSize: 22 }} />}
              </IconButton>
            </Tooltip>

            <Tooltip title="Admin Profile">
              <Box onClick={handleProfileOpen} sx={{
                display: 'flex', alignItems: 'center', gap: 1, ml: 0.5, pl: 1.5, pr: 1, py: 0.6,
                borderRadius: 3, cursor: 'pointer', border: `1px solid ${isDark ? '#2a2a2a' : '#efefef'}`,
                '&:hover': { bgcolor: isDark ? 'rgba(255,255,255,0.05)' : '#fafafa' }, transition: 'all 0.2s',
              }}>
                <Box sx={{ position: 'relative' }}>
                  <Avatar alt="Admin" src={avatarImg.src} sx={{ width: 32, height: 32, border: '2px solid #b71c1c' }} />
                  <FiberManualRecord sx={{ position: 'absolute', bottom: -1, right: -1, fontSize: 10, color: '#4caf50' }} />
                </Box>
                <Box sx={{ display: { xs: 'none', sm: 'block' } }}>
                  <Typography fontSize="0.78rem" fontWeight={700} lineHeight={1.2}>Vith Vath</Typography>
                  <Typography fontSize="0.68rem" color="text.secondary" lineHeight={1}>Administrator</Typography>
                </Box>
              </Box>
            </Tooltip>
          </Box>
        </Toolbar>
      </AppBar>

      {/* Notifications Popover */}
      <Popover open={Boolean(notifAnchor)} anchorEl={notifAnchor} onClose={handleNotifClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }} transformOrigin={{ vertical: 'top', horizontal: 'right' }}
        slotProps={{ paper: { sx: { width: 340, borderRadius: 3, mt: 1, boxShadow: '0 8px 32px rgba(0,0,0,0.15)', border: `1px solid ${isDark ? '#2a2a2a' : '#f0f0f0'}` } }}}>
        <Box sx={{ px: 2.5, py: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography fontWeight={700} fontSize="0.95rem">Notifications</Typography>
          <Chip label="3 new" color="error" size="small" sx={{ fontSize: '0.68rem', height: 20 }} />
        </Box>
        <Divider />
        <List dense disablePadding>
          {sampleNotifications.map((n, i) => (
            <React.Fragment key={n.id}>
              <ListItem sx={{ py: 1.5, px: 2 }}>
                <ListItemAvatar>
                  <Avatar sx={{ bgcolor: `${n.color}20`, color: n.color, width: 38, height: 38, fontSize: '0.85rem', fontWeight: 800, border: `1.5px solid ${n.color}44` }}>{n.avatar}</Avatar>
                </ListItemAvatar>
                <ListItemText
                  primary={<Typography fontSize="0.84rem" fontWeight={600}>{n.text}</Typography>}
                  secondary={<Typography fontSize="0.74rem" color="text.secondary">{n.sub}</Typography>} />
                <FiberManualRecord sx={{ fontSize: 8, color: n.dot, flexShrink: 0 }} />
              </ListItem>
              {i < sampleNotifications.length - 1 && <Divider component="li" />}
            </React.Fragment>
          ))}
        </List>
        <Divider />
        <Box sx={{ p: 1.5, textAlign: 'center' }}>
          <Typography variant="body2" color="error" fontWeight={600} sx={{ cursor: 'pointer', fontSize: '0.82rem', '&:hover': { textDecoration: 'underline' } }} onClick={handleNotifClose}>
            Mark all as read
          </Typography>
        </Box>
      </Popover>

      {/* Profile Popover */}
      <Popover open={Boolean(profileAnchor)} anchorEl={profileAnchor} onClose={handleProfileClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }} transformOrigin={{ vertical: 'top', horizontal: 'right' }}
        slotProps={{ paper: { sx: { width: 272, borderRadius: 3, mt: 1, boxShadow: '0 8px 32px rgba(0,0,0,0.15)', overflow: 'hidden', border: `1px solid ${isDark ? '#2a2a2a' : '#f0f0f0'}` } }}}>
        <Box sx={{ p: 2.5, background: 'linear-gradient(135deg, #7f0000 0%, #b71c1c 100%)', display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Box sx={{ position: 'relative' }}>
            <Avatar alt="Admin" src={avatarImg.src} sx={{ width: 52, height: 52, border: '2px solid rgba(255,255,255,0.4)' }} />
            <FiberManualRecord sx={{ position: 'absolute', bottom: 1, right: 1, fontSize: 12, color: '#4caf50', filter: 'drop-shadow(0 0 2px #4caf50)' }} />
          </Box>
          <Box>
            <Typography fontWeight={800} fontSize="0.95rem" color="#fff">Vith Vath</Typography>
            <Typography fontSize="0.72rem" color="rgba(255,255,255,0.75)">vithvath20211006@gmail.com</Typography>
            <Chip label="Administrator" size="small" icon={<AdminPanelSettings sx={{ fontSize: '0.7rem !important', color: '#fff !important' }} />}
              sx={{ mt: 0.5, height: 18, fontSize: '0.62rem', fontWeight: 700, bgcolor: 'rgba(255,255,255,0.2)', color: '#fff', '& .MuiChip-label': { px: 0.8 } }} />
          </Box>
        </Box>
        <Divider />
        <Box sx={{ p: 1.5 }}>
          <Button fullWidth startIcon={<Logout fontSize="small" />} onClick={handleLogout}
            sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 600, fontSize: '0.83rem', py: 1, justifyContent: 'flex-start', color: 'error.main', '&:hover': { bgcolor: '#ffebee' } }}>
            Sign Out
          </Button>
        </Box>
      </Popover>
    </>
  );
};

export default AdminNavbar;
