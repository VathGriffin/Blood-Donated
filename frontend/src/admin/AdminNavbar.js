import React, { useContext } from 'react';
import {
  AppBar,
  Toolbar,
  Typography,
  IconButton,
  Box,
  Tooltip,
  useTheme,
  Avatar,
} from '@mui/material';
import {
  Brightness4,
  Brightness7,
  Bloodtype,
} from '@mui/icons-material';
import { ColorModeContext } from '../ThemeContext';
import avatarImg from '../assets/avatar.png';

const AdminNavbar = () => {
  const { toggleColorMode } = useContext(ColorModeContext);
  const theme = useTheme();

  return (
    <AppBar
      position="fixed"
      sx={{
        zIndex: (theme) => theme.zIndex.drawer + 1,
        backgroundColor: theme.palette.background.paper,
        color: theme.palette.text.primary,
        boxShadow: 2,
      }}
    >
      <Toolbar sx={{ justifyContent: 'space-between' }}>
        {/* Logo + Title */}
        <Box display="flex" alignItems="center" gap={1}>
          <Bloodtype color="error" />
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
          {/* Theme Toggle Button */}
          <Tooltip title="Toggle theme">
            <IconButton onClick={toggleColorMode} color="inherit">
              {theme.palette.mode === 'dark' ? <Brightness7 /> : <Brightness4 />}
            </IconButton>
          </Tooltip>

          {/* Avatar with Image */}
          <Tooltip title="My Profile">
            <IconButton color="inherit">
              <Avatar
                alt="Admin Avatar"
                src={avatarImg}
                sx={{ width: 32, height: 32 }}
              />
            </IconButton>
          </Tooltip>
        </Box>
      </Toolbar>
    </AppBar>
  );
};

export default AdminNavbar;
