import React from 'react';
import {
    Drawer,
    List,
    ListItemButton,
    ListItemIcon,
    ListItemText,
    Toolbar,
    Box,
    useTheme
} from '@mui/material';
import {
    Dashboard,
    PeopleAlt,
    LocalHospital,
    Inventory2,
    ContactMail
} from '@mui/icons-material';
import { Link, useLocation } from 'react-router-dom';

const drawerWidth = 240;

const navItems = [
    { label: 'Dashboard', icon: <Dashboard />, path: '/admin/dashboard' },
    { label: 'Manage Donors', icon: <PeopleAlt />, path: '/admin/donors' },
    { label: 'Manage Requests', icon: <LocalHospital />, path: '/admin/requests' },
    { label: 'Manage Contact', icon: <ContactMail />, path: '/admin/contacts' },
    { label: 'Inventory', icon: <Inventory2 />, path: '/admin/inventory' },
];

const Sidebar = () => {
    const location = useLocation();
    const theme = useTheme();

    return (
        <Drawer
            variant="permanent"
            sx={{
                width: drawerWidth,
                flexShrink: 0,
                [`& .MuiDrawer-paper`]: {
                    width: drawerWidth,
                    boxSizing: 'border-box',
                    bgcolor: theme.palette.mode === 'dark' ? '#121212' : '#fafafa',
                    borderRight: 0,
                    boxShadow: '2px 0 6px rgba(0,0,0,0.05)',
                },
            }}
        >
            <Toolbar />
            <Box sx={{ overflow: 'auto', pt: 2 }}>
                <List>
                    {navItems.map((item) => {
                        const isSelected = location.pathname === item.path;
                        return (
                            <ListItemButton
                                key={item.label}
                                component={Link}
                                to={item.path}
                                selected={isSelected}
                                sx={{
                                    borderRadius: 2,
                                    mx: 1,
                                    my: 0.5,
                                    transition: '0.3s ease',
                                    '&.Mui-selected': {
                                        background: 'linear-gradient(to right, #b71c1c, #d32f2f)',
                                        color: '#fff',
                                        '& .MuiListItemIcon-root': {
                                            color: '#fff',
                                        },
                                    },
                                    '&:hover': {
                                        bgcolor: isSelected
                                            ? undefined
                                            : theme.palette.action.hover,
                                    },
                                }}
                            >
                                <ListItemIcon sx={{ color: isSelected ? '#fff' : 'inherit' }}>
                                    {item.icon}
                                </ListItemIcon>
                                <ListItemText
                                    primary={item.label}
                                    primaryTypographyProps={{
                                        fontWeight: isSelected ? 'bold' : 500,
                                    }}
                                />
                            </ListItemButton>
                        );
                    })}
                </List>
            </Box>
        </Drawer>
    );
};

export default Sidebar;
