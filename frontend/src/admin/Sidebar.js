import React from 'react';
import {
    Drawer,
    List,
    ListItemButton,
    ListItemIcon,
    ListItemText,
    Box,
    useTheme,
    Typography,
    Divider,
    Button,
    Avatar,
    Tooltip,
} from '@mui/material';
import {
    Dashboard,
    PeopleAlt,
    LocalHospital,
    Inventory2,
    CalendarMonth,
    Chat,
    ArrowBack,
    Bloodtype,
} from '@mui/icons-material';
import { Link, useLocation } from 'react-router-dom';

const drawerWidth = 260;

const navItems = [
    { label: 'Dashboard', icon: <Dashboard />, path: '/admin/dashboard' },
    { label: 'Manage Donors', icon: <PeopleAlt />, path: '/admin/donors' },
    { label: 'Manage Requests', icon: <LocalHospital />, path: '/admin/requests' },
    { label: 'Messages', icon: <Chat />, path: '/admin/contacts' },
    { label: 'Appointments', icon: <CalendarMonth />, path: '/admin/appointments' },
    { label: 'Inventory', icon: <Inventory2 />, path: '/admin/inventory' },
];

const Sidebar = () => {
    const location = useLocation();
    const theme = useTheme();
    const isDark = theme.palette.mode === 'dark';

    return (
        <Drawer
            variant="permanent"
            sx={{
                width: drawerWidth,
                flexShrink: 0,
                [`& .MuiDrawer-paper`]: {
                    width: drawerWidth,
                    boxSizing: 'border-box',
                    bgcolor: isDark ? '#0f0f0f' : '#fff',
                    borderRight: `1px solid ${isDark ? '#1e1e1e' : '#f0f0f0'}`,
                    boxShadow: isDark
                        ? '2px 0 16px rgba(0,0,0,0.5)'
                        : '2px 0 16px rgba(0,0,0,0.06)',
                    display: 'flex',
                    flexDirection: 'column',
                },
            }}
        >
            {/* Brand */}
            <Box sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 1.5,
                px: 2.5,
                py: 2.5,
                mt: 8,
                borderBottom: `1px solid ${isDark ? '#1e1e1e' : '#f5f5f5'}`,
            }}>
                <Avatar sx={{ bgcolor: '#b71c1c', width: 40, height: 40 }}>
                    <Bloodtype sx={{ fontSize: 22 }} />
                </Avatar>
                <Box>
                    <Typography fontWeight={800} fontSize="0.95rem" color="error.main" lineHeight={1.2}>
                        Blood Donated
                    </Typography>
                    <Typography variant="caption" color="text.secondary" fontWeight={500}>
                        Admin Panel
                    </Typography>
                </Box>
            </Box>

            {/* Section label */}
            <Box sx={{ px: 2.5, pt: 2.5, pb: 0.5 }}>
                <Typography
                    variant="caption"
                    color="text.disabled"
                    fontWeight={700}
                    letterSpacing="0.1em"
                    fontSize="0.68rem"
                    sx={{ textTransform: 'uppercase' }}
                >
                    Main Menu
                </Typography>
            </Box>

            {/* Nav items */}
            <Box sx={{ flex: 1, overflowY: 'auto', px: 1, pb: 1 }}>
                <List dense disablePadding>
                    {navItems.map((item) => {
                        const isSelected =
                            location.pathname === item.path ||
                            (item.path === '/admin/dashboard' && location.pathname === '/admin');
                        return (
                            <Tooltip title={item.label} placement="right" key={item.label} disableHoverListener>
                                <ListItemButton
                                    component={Link}
                                    to={item.path}
                                    selected={isSelected}
                                    sx={{
                                        borderRadius: 2.5,
                                        mb: 0.5,
                                        py: 1.3,
                                        px: 1.5,
                                        transition: '0.2s ease',
                                        '&.Mui-selected': {
                                            background: 'linear-gradient(135deg, #b71c1c 0%, #d32f2f 100%)',
                                            color: '#fff',
                                            boxShadow: '0 4px 14px rgba(183,28,28,0.35)',
                                            '& .MuiListItemIcon-root': { color: '#fff' },
                                        },
                                        '&:hover:not(.Mui-selected)': {
                                            bgcolor: isDark
                                                ? 'rgba(183,28,28,0.12)'
                                                : 'rgba(183,28,28,0.06)',
                                        },
                                    }}
                                >
                                    <ListItemIcon
                                        sx={{
                                            minWidth: 40,
                                            color: isSelected ? '#fff' : 'text.secondary',
                                        }}
                                    >
                                        {item.icon}
                                    </ListItemIcon>
                                    <ListItemText
                                        primary={item.label}
                                        primaryTypographyProps={{
                                            fontWeight: isSelected ? 700 : 500,
                                            fontSize: '0.88rem',
                                        }}
                                    />
                                    {isSelected && (
                                        <Box sx={{
                                            width: 6,
                                            height: 6,
                                            borderRadius: '50%',
                                            bgcolor: 'rgba(255,255,255,0.7)',
                                        }} />
                                    )}
                                </ListItemButton>
                            </Tooltip>
                        );
                    })}
                </List>
            </Box>

            {/* Footer */}
            <Box>
                <Divider sx={{ mx: 2 }} />
                <Box sx={{ p: 2 }}>
                    <Button
                        component={Link}
                        to="/"
                        fullWidth
                        startIcon={<ArrowBack />}
                        variant="outlined"
                        color="error"
                        size="small"
                        sx={{
                            borderRadius: 2.5,
                            textTransform: 'none',
                            fontWeight: 600,
                            fontSize: '0.82rem',
                            py: 1,
                        }}
                    >
                        Back to Website
                    </Button>
                    <Typography
                        variant="caption"
                        color="text.disabled"
                        display="block"
                        textAlign="center"
                        mt={1.5}
                        fontSize="0.7rem"
                    >
                        v1.0.0 • Blood Donated
                    </Typography>
                </Box>
            </Box>
        </Drawer>
    );
};

export default Sidebar;
