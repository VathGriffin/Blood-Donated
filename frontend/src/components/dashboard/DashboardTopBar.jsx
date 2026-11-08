'use client';
import { useContext } from 'react';
import { usePathname } from 'next/navigation';
import { AppBar, Box, Chip, IconButton, Toolbar, Tooltip, Typography, alpha, useTheme } from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import DarkModeOutlinedIcon from '@mui/icons-material/DarkModeOutlined';
import LightModeOutlinedIcon from '@mui/icons-material/LightModeOutlined';
import LocalHospitalIcon from '@mui/icons-material/LocalHospital';
import AdminNotifications from '@/components/notifications/AdminNotifications';
import HospitalNotifications from '@/components/notifications/HospitalNotifications';
import DonorNotifications from '@/components/layout/DonorNotifications';
import ProfileMenu from './ProfileMenu';
import { ColorModeContext } from '@/lib/ThemeContext';
import { ROLES, ROLE_CONFIG, findActive } from '@/lib/navigation';
import SiteSearch from '@/components/layout/SiteSearch';
import LanguageSwitcher from '@/components/layout/LanguageSwitcher';
import { useT } from '@/i18n/I18nProvider';

/**
 * Minimal sticky bar: utilities on the right (hospital, notifications, theme, account).
 * Page titles live in each page's own header, so the bar only shows one on phones,
 * where there is no sidebar to say where you are. It sits in normal flow beside the
 * sidebar, so pages need no top-padding "spacer" for it.
 */
export default function DashboardTopBar({ role, profile, hospitalName, onMenuClick, onLogout }) {
  const theme = useTheme();
  const { toggleColorMode, mode } = useContext(ColorModeContext);
  const pathname = usePathname();
  const active = findActive(role, pathname);
  const cfg = ROLE_CONFIG[role];
  const t = useT();

  return (
    <AppBar
      position="sticky"
      color="inherit"
      sx={{
        top: 0,
        bgcolor: alpha(theme.palette.background.paper, 0.92),
        backdropFilter: 'blur(10px)',
        color: 'text.primary',
        borderBottom: `1px solid ${alpha(theme.palette.divider, 0.8)}`,
        boxShadow: theme.custom.shadow.xs,
      }}
    >
      <Toolbar sx={{ minHeight: `${theme.custom.layout.headerHeight}px !important`, px: { xs: 1.5, md: 3 }, gap: 1 }}>
        <IconButton edge="start" onClick={onMenuClick} aria-label={t('common.openNavigation')} sx={{ display: { lg: 'none' }, color: 'text.primary' }}>
          <MenuIcon />
        </IconButton>

        <Typography component="p" noWrap sx={{ display: { lg: 'none' }, fontSize: '1rem', fontWeight: 700, letterSpacing: '-0.01em', flexGrow: 1, minWidth: 0 }}>
          {t(active?.item.labelKey || cfg.labelKey)}
        </Typography>
        {/* Donors get the site-wide search (hospitals, donor counts, their own appointments). */}
        <Box sx={{ flexGrow: 1, display: { xs: 'none', lg: 'block' }, minWidth: 0 }}>
          {role === ROLES.DONOR && <SiteSearch variant="field" />}
        </Box>
        {role === ROLES.DONOR && <Box sx={{ display: { lg: 'none' } }}><SiteSearch size={40} /></Box>}

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

        {/* Each role's real activity feed (the sidebar keeps the live to-do counts). */}
        {role === ROLES.ADMIN && <AdminNotifications />}
        {role === ROLES.DONOR && <DonorNotifications size={40} />}
        {role === ROLES.HOSPITAL_STAFF && <HospitalNotifications />}

        <LanguageSwitcher />

        <Tooltip title={t(mode === 'dark' ? 'common.lightMode' : 'common.darkMode')}>
          <IconButton onClick={toggleColorMode} aria-label={t('common.toggleColorMode')} sx={{ color: 'text.secondary' }}>
            {mode === 'dark' ? <LightModeOutlinedIcon /> : <DarkModeOutlinedIcon />}
          </IconButton>
        </Tooltip>

        <ProfileMenu role={role} profile={profile} onLogout={onLogout} />
      </Toolbar>
    </AppBar>
  );
}
