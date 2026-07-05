import React, { useContext, useState } from 'react';
import {
    AppBar,
    Toolbar,
    Typography,
    IconButton,
    Box,
    Tooltip,
    useTheme,
    Avatar,
    Badge,
    Chip,
    Popover,
    List,
    ListItem,
    ListItemAvatar,
    ListItemText,
    Divider,
    Button,
} from '@mui/material';
import {
    Brightness4,
    Brightness7,
    Notifications,
    NavigateNext,
    Bloodtype,
    Logout,
    AdminPanelSettings,
} from '@mui/icons-material';
import { ColorModeContext } from '../ThemeContext';
import { useLocation, Link as RouterLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import avatarImg from '../assets/avatar.png';

const breadcrumbMap = {
    '/admin': 'Dashboard',
    '/admin/dashboard': 'Dashboard',
    '/admin/donors': 'Manage Donors',
    '/admin/requests': 'Manage Requests',
    '/admin/inventory': 'Inventory',
    '/admin/contacts': 'Manage Contact',
};

const sampleNotifications = [
    { id: 1, text: 'New blood request submitted', sub: '2 minutes ago', avatar: 'R', color: '#ef5350' },
    { id: 2, text: 'Donor Sopheak registered', sub: '15 minutes ago', avatar: 'S', color: '#42a5f5' },
    { id: 3, text: 'O− stock critically low', sub: '1 hour ago', avatar: '!', color: '#ff9800' },
];

const AdminNavbar = () => {
    const { toggleColorMode } = useContext(ColorModeContext);
    const theme = useTheme();
    const isDark = theme.palette.mode === 'dark';
    const location = useLocation();
    const navigate = useNavigate();
    const { logout } = useAuth();
    const [notifAnchor, setNotifAnchor] = useState(null);
    const [notifCount, setNotifCount] = useState(3);
    const [profileAnchor, setProfileAnchor] = useState(null);

    const currentPage = breadcrumbMap[location.pathname] || 'Admin';

    const handleNotifOpen = (e) => {
        setNotifAnchor(e.currentTarget);
        setNotifCount(0);
    };
    const handleNotifClose = () => setNotifAnchor(null);

    const handleProfileOpen = (e) => setProfileAnchor(e.currentTarget);
    const handleProfileClose = () => setProfileAnchor(null);

    const handleLogout = () => {
        handleProfileClose();
        logout();
        navigate('/admin/login', { replace: true });
    };

    return (
        <>
            <AppBar
                position="fixed"
                elevation={0}
                sx={{
                    zIndex: (t) => t.zIndex.drawer + 1,
                    bgcolor: isDark ? '#0f0f0f' : '#fff',
                    color: theme.palette.text.primary,
                    borderBottom: `1px solid ${isDark ? '#1e1e1e' : '#f0f0f0'}`,
                }}
            >
                <Toolbar sx={{ justifyContent: 'space-between', minHeight: '64px !important', px: { xs: 2, md: 3 } }}>
                    {/* Left: Logo + Breadcrumb */}
                    <Box display="flex" alignItems="center" gap={1.5}>
                        <Box display="flex" alignItems="center" gap={0.5}>
                            <Bloodtype color="error" sx={{ fontSize: 22 }} />
                            <Typography fontWeight={800} fontSize="1rem" color="error.main" sx={{ display: { xs: 'none', sm: 'block' } }}>
                                Blood Donated
                            </Typography>
                        </Box>

                        <NavigateNext sx={{ color: 'text.disabled', fontSize: 18, display: { xs: 'none', sm: 'block' } }} />

                        <Box sx={{ display: { xs: 'none', sm: 'block' } }}>
                            <RouterLink
                                to="/admin/dashboard"
                                style={{ textDecoration: 'none', color: theme.palette.text.secondary, fontSize: '0.8rem', fontWeight: 500 }}
                            >
                                Admin
                            </RouterLink>
                            {' '}
                            <NavigateNext sx={{ color: 'text.disabled', fontSize: 14, verticalAlign: 'middle' }} />
                            {' '}
                            <Typography component="span" fontWeight={700} fontSize="0.8rem" color="text.primary">
                                {currentPage}
                            </Typography>
                        </Box>

                        <Typography
                            variant="h6"
                            fontWeight={700}
                            sx={{ display: { xs: 'block', sm: 'none' } }}
                        >
                            {currentPage}
                        </Typography>
                    </Box>

                    {/* Right */}
                    <Box display="flex" alignItems="center" gap={0.5}>
                        <Chip
                            label={new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                            size="small"
                            sx={{ fontSize: '0.72rem', display: { xs: 'none', md: 'flex' }, fontWeight: 600 }}
                        />

                        <Tooltip title="Notifications">
                            <IconButton color="inherit" onClick={handleNotifOpen}>
                                <Badge badgeContent={notifCount} color="error">
                                    <Notifications />
                                </Badge>
                            </IconButton>
                        </Tooltip>

                        <Tooltip title="Toggle theme">
                            <IconButton onClick={toggleColorMode} color="inherit">
                                {isDark ? <Brightness7 /> : <Brightness4 />}
                            </IconButton>
                        </Tooltip>

                        <Tooltip title="Admin Profile">
                            <IconButton sx={{ p: 0.5 }} onClick={handleProfileOpen}>
                                <Avatar
                                    alt="Admin"
                                    src={avatarImg}
                                    sx={{ width: 36, height: 36, border: '2px solid #b71c1c' }}
                                />
                            </IconButton>
                        </Tooltip>
                    </Box>
                </Toolbar>
            </AppBar>

            {/* Notifications Popover */}
            <Popover
                open={Boolean(notifAnchor)}
                anchorEl={notifAnchor}
                onClose={handleNotifClose}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                transformOrigin={{ vertical: 'top', horizontal: 'right' }}
                PaperProps={{
                    sx: {
                        width: 320,
                        borderRadius: 3,
                        mt: 1,
                        boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
                    },
                }}
            >
                <Box sx={{ px: 2.5, py: 1.5, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography fontWeight={700} fontSize="0.95rem">Notifications</Typography>
                    <Chip label="3 new" color="error" size="small" sx={{ fontSize: '0.7rem' }} />
                </Box>
                <Divider />
                <List dense disablePadding>
                    {sampleNotifications.map((n, i) => (
                        <React.Fragment key={n.id}>
                            <ListItem sx={{ py: 1.5, px: 2 }}>
                                <ListItemAvatar>
                                    <Avatar sx={{ bgcolor: n.color, width: 36, height: 36, fontSize: '0.85rem', fontWeight: 700 }}>
                                        {n.avatar}
                                    </Avatar>
                                </ListItemAvatar>
                                <ListItemText
                                    primary={<Typography fontSize="0.85rem" fontWeight={600}>{n.text}</Typography>}
                                    secondary={<Typography fontSize="0.75rem" color="text.secondary">{n.sub}</Typography>}
                                />
                            </ListItem>
                            {i < sampleNotifications.length - 1 && <Divider component="li" />}
                        </React.Fragment>
                    ))}
                </List>
                <Divider />
                <Box sx={{ p: 1.5, textAlign: 'center' }}>
                    <Typography
                        variant="body2"
                        color="error"
                        fontWeight={600}
                        sx={{ cursor: 'pointer', fontSize: '0.82rem', '&:hover': { textDecoration: 'underline' } }}
                        onClick={handleNotifClose}
                    >
                        View all notifications
                    </Typography>
                </Box>
            </Popover>
            {/* Profile Popover */}
            <Popover
                open={Boolean(profileAnchor)}
                anchorEl={profileAnchor}
                onClose={handleProfileClose}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                transformOrigin={{ vertical: 'top', horizontal: 'right' }}
                PaperProps={{
                    sx: {
                        width: 260,
                        borderRadius: 3,
                        mt: 1,
                        boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
                        overflow: 'hidden',
                    },
                }}
            >
                {/* Profile Header */}
                <Box sx={{
                    p: 2.5,
                    background: 'linear-gradient(135deg, #b71c1c 0%, #d32f2f 100%)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1.5,
                }}>
                    <Avatar
                        alt="Admin"
                        src={avatarImg}
                        sx={{ width: 48, height: 48, border: '2px solid rgba(255,255,255,0.5)' }}
                    />
                    <Box>
                        <Typography fontWeight={700} fontSize="0.9rem" color="#fff">
                            Vith Vath
                        </Typography>
                        <Typography fontSize="0.75rem" color="rgba(255,255,255,0.8)">
                            vithvath20211006@gmail.com
                        </Typography>
                        <Chip
                            label="Administrator"
                            size="small"
                            icon={<AdminPanelSettings sx={{ fontSize: '0.75rem !important', color: '#fff !important' }} />}
                            sx={{
                                mt: 0.5,
                                height: 18,
                                fontSize: '0.65rem',
                                fontWeight: 700,
                                bgcolor: 'rgba(255,255,255,0.2)',
                                color: '#fff',
                                '& .MuiChip-label': { px: 0.8 },
                            }}
                        />
                    </Box>
                </Box>

                <Divider />

                <Box sx={{ p: 1.5 }}>
                    <Button
                        fullWidth
                        startIcon={<Logout fontSize="small" />}
                        onClick={handleLogout}
                        color="error"
                        variant="outlined"
                        size="small"
                        sx={{
                            borderRadius: 2,
                            textTransform: 'none',
                            fontWeight: 600,
                            fontSize: '0.83rem',
                            py: 0.9,
                            justifyContent: 'flex-start',
                        }}
                    >
                        Sign Out
                    </Button>
                </Box>
            </Popover>
        </>
    );
};

export default AdminNavbar;
