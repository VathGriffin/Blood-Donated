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
import avatarImg from '../assets/avatar.png'; // ✅ Thêm dòng này

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
          {/* Theme Toggle Button */}
          <Tooltip title="Toggle theme">
            <IconButton onClick={toggleColorMode} color="inherit">
              {mode === 'dark' ? <Brightness7 /> : <Brightness4 />}
            </IconButton>
          </Tooltip>

          {/* Avatar with Image */}
          <Tooltip title="My Profile">
            <IconButton color="inherit">
              <Avatar
                alt="Admin Avatar"
                src={avatarImg} // ✅ Dùng ảnh từ assets
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
// ✅ Đảm bảo bạn đã thêm ảnh avatar vào thư mục assets và đường dẫn đúng