import React, { useContext } from 'react';
import {
    AppBar,
    Toolbar,
    Typography,
    IconButton,
    Box,
    Tooltip,
    useTheme
} from '@mui/material';
import {
    Brightness4,
    Brightness7,
    Logout,
    Bloodtype,
} from '@mui/icons-material';
import { ColorModeContext } from '../ThemeContext'; // ✅ Ensure this exists

const AdminNavbar = () => {
    const { toggleColorMode, mode } = useContext(ColorModeContext);
    const theme = useTheme();

    return (
        <AppBar
            position="fixed"
            sx={{
                zIndex: (theme) => theme.zIndex.drawer + 1,
                backgroundColor: theme.palette.mode === 'dark' ? '#1c1c1c' : '#b71c1c',
                color: '#fff',
                boxShadow: 2,
            }}
        >
            <Toolbar sx={{ justifyContent: 'space-between' }}>
                {/* Logo + Title */}
                <Box display="flex" alignItems="center" gap={1}>
                    <Bloodtype />
                    <Typography
                        variant="h6"
                        component="div"
                        sx={{ fontWeight: 'bold', letterSpacing: 1 }}
                    >
                        Blood Donation Admin
                    </Typography>
                </Box>

                {/* Right Buttons */}
                <Box display="flex" alignItems="center" gap={1.5}>
                    <Tooltip title="Toggle theme">
                        <IconButton onClick={toggleColorMode} color="inherit">
                            {mode === 'dark' ? <Brightness7 /> : <Brightness4 />}
                        </IconButton>
                    </Tooltip>

                    <Tooltip title="Logout">
                        <IconButton color="inherit">
                            <Logout />
                        </IconButton>
                    </Tooltip>
                </Box>
            </Toolbar>
        </AppBar>
    );
};

export default AdminNavbar;
