'use client';
import { useContext } from 'react';
import { usePathname } from 'next/navigation';
import { AppBar, Box, Chip, IconButton, Toolbar, Tooltip, Typography, alpha, useTheme } from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import DarkModeOutlinedIcon from '@mui/icons-material/DarkModeOutlined';
import LightModeOutlinedIcon from '@mui/icons-material/LightModeOutlined';
import LocalHospitalIcon from '@mui/icons-material/LocalHospital';
import NotificationMenu from './NotificationMenu';
import ProfileMenu from './ProfileMenu';
import { ColorModeContext } from '@/lib/ThemeContext';
import { ROLE_CONFIG, findActive } from '@/lib/navigation';

/**
 * Minimal sticky bar: utilities on the right (hospital, notifications, theme, account).
 * Page titles live in each page's own header, so the bar only shows one on phones,
 * where there is no sidebar to say where you are. It sits in normal flow beside the
 * sidebar, so pages need no top-padding "spacer" for it.
 */
export default function DashboardTopBar({ role, profile, hospitalName, notifications, onMenuClick, onLogout }) {
  const theme = useTheme();
  const { toggleColorMode, mode } = useContext(ColorModeContext);
  const pathname = usePathname();
  const active = findActive(role, pathname);
  const cfg = ROLE_CONFIG[role];

  return (
    <AppBar
      position="sticky"
      color="inherit"
      sx={{
        top: 0,
        bgcolor: alpha(theme.palette.background.default, 0.85),
        backdropFilter: 'blur(10px)',
        color: 'text.primary',
        borderBottom: `1px solid ${alpha(theme.palette.divider, 0.6)}`,
      }}
    >
      <Toolbar sx={{ minHeight: `${theme.custom.layout.headerHeight}px !important`, px: { xs: 1.5, md: 3 }, gap: 1 }}>
        <IconButton edge="start" onClick={onMenuClick} aria-label="Open navigation menu" sx={{ display: { md: 'none' }, color: 'text.primary' }}>
          <MenuIcon />
        </IconButton>

        <Typography component="p" noWrap sx={{ display: { md: 'none' }, fontSize: '1rem', fontWeight: 700, letterSpacing: '-0.01em', flexGrow: 1, minWidth: 0 }}>
          {active?.item.label || cfg.label}
        </Typography>
        <Box sx={{ flexGrow: 1, display: { xs: 'none', md: 'block' } }} />

        {hospitalName && (
          <Chip
            icon={<LocalHospitalIcon sx={{ fontSize: '1.05rem !important' }} />}
            label={hospitalName}
            variant="outlined"
            sx={{
              display: { xs: 'none', sm: 'inline-flex' },
              maxWidth: 260,
              height: 36,
              mr: 0.5,
              borderRadius: '10px',
              bgcolor: 'background.paper',
              borderColor: 'divider',
              fontWeight: 600,
              '& .MuiChip-icon': { color: 'primary.main' },
            }}
          />
        )}

        <NotificationMenu items={notifications.items} count={notifications.count} loading={notifications.loading} />

        <Tooltip title={mode === 'dark' ? 'Light mode' : 'Dark mode'}>
          <IconButton onClick={toggleColorMode} aria-label="Toggle colour mode" sx={{ color: 'text.secondary' }}>
            {mode === 'dark' ? <LightModeOutlinedIcon /> : <DarkModeOutlinedIcon />}
          </IconButton>
        </Tooltip>

        <ProfileMenu role={role} profile={profile} onLogout={onLogout} />
      </Toolbar>
    </AppBar>
  );
}
