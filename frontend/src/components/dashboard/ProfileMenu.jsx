'use client';
import { useState } from 'react';
import Link from 'next/link';
import {
  Avatar, Box, ButtonBase, Chip, Divider, ListItemIcon, Menu, MenuItem, Tooltip, Typography,
} from '@mui/material';
import LogoutIcon from '@mui/icons-material/Logout';
import HomeOutlinedIcon from '@mui/icons-material/HomeOutlined';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';
import API_BASE from '@/lib/config';
import { ROLE_CONFIG } from '@/lib/navigation';

/**
 * The account chip in the top bar — avatar, name and role, so it's always clear who is
 * signed in — opening a menu with a profile header (name, email, role), role-specific
 * shortcuts, back to the public site, and sign out. `profile` and `onLogout` come from
 * useDashboardSession. On phones the chip collapses to just the avatar.
 */
export default function ProfileMenu({ role, profile, onLogout }) {
  const [anchor, setAnchor] = useState(null);
  const close = () => setAnchor(null);
  const cfg = ROLE_CONFIG[role];
  const initial = profile.name?.charAt(0)?.toUpperCase() || '?';
  const photo = profile.photo ? `${API_BASE}${profile.photo}` : undefined;
  const avatarSx = { bgcolor: 'primary.main', color: 'primary.contrastText', fontWeight: 700 };

  return (
    <>
      <Tooltip title={`${cfg.label.replace(' Panel', '').replace(' Portal', '')} profile`}>
        <ButtonBase
          onClick={(e) => setAnchor(e.currentTarget)}
          aria-label="Account menu"
          aria-haspopup="true"
          sx={{
            ml: 0.5, pl: { xs: 0.5, sm: 1.25 }, pr: { xs: 0.5, sm: 1 }, py: 0.5, gap: 1,
            borderRadius: '12px', border: 1, borderColor: 'divider', bgcolor: 'background.paper',
            textAlign: 'left', transition: 'background-color .15s ease',
            '&:hover': { bgcolor: 'action.hover' },
          }}
        >
          <Box sx={{ position: 'relative', display: 'flex' }}>
            <Avatar src={photo} alt="" sx={{ ...avatarSx, width: 34, height: 34, fontSize: '0.9rem' }}>{initial}</Avatar>
            <Box sx={{ position: 'absolute', right: -1, bottom: -1, width: 10, height: 10, borderRadius: '50%', bgcolor: 'success.main', border: '2px solid', borderColor: 'background.paper' }} />
          </Box>
          <Box sx={{ display: { xs: 'none', sm: 'block' }, minWidth: 0, maxWidth: 170 }}>
            <Typography noWrap sx={{ fontSize: '0.8rem', fontWeight: 700, lineHeight: 1.25 }}>{profile.name}</Typography>
            <Typography noWrap sx={{ fontSize: '0.7rem', color: 'text.secondary', lineHeight: 1.25 }}>{profile.subtitle}</Typography>
          </Box>
        </ButtonBase>
      </Tooltip>

      <Menu
        anchorEl={anchor}
        open={Boolean(anchor)}
        onClose={close}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
        slotProps={{
          paper: { sx: { mt: 1, width: 280, maxWidth: 'calc(100vw - 32px)', overflow: 'hidden' } },
          list: { disablePadding: true },
        }}
      >
        <Box sx={(t) => ({ p: 2.5, background: t.custom.sidebar.bgGradient, display: 'flex', alignItems: 'center', gap: 1.5 })}>
          <Avatar src={photo} alt="" sx={{ ...avatarSx, width: 52, height: 52, fontSize: '1.2rem', bgcolor: 'rgba(255,255,255,0.2)', border: '2px solid rgba(255,255,255,0.45)' }}>
            {initial}
          </Avatar>
          <Box sx={{ minWidth: 0 }}>
            <Typography noWrap sx={{ color: '#fff', fontWeight: 800, fontSize: '0.95rem', lineHeight: 1.3 }}>{profile.name}</Typography>
            {profile.email && <Typography noWrap sx={{ color: 'rgba(255,255,255,0.78)', fontSize: '0.75rem' }}>{profile.email}</Typography>}
            <Chip
              size="small"
              label={profile.subtitle}
              icon={role === 'ADMIN' ? <AdminPanelSettingsIcon sx={{ fontSize: '0.8rem !important', color: '#fff !important' }} /> : undefined}
              sx={{ mt: 0.5, height: 20, maxWidth: '100%', fontSize: '0.66rem', fontWeight: 700, bgcolor: 'rgba(255,255,255,0.2) !important', color: '#fff !important' }}
            />
          </Box>
        </Box>
        <Box sx={{ height: 6 }} />
        {cfg.profileLinks.map(({ label, href, icon: Icon }) => (
          <MenuItem key={href} component={Link} href={href} onClick={close}>
            <ListItemIcon><Icon fontSize="small" /></ListItemIcon>
            {label}
          </MenuItem>
        ))}
        <MenuItem component={Link} href="/" onClick={close}>
          <ListItemIcon><HomeOutlinedIcon fontSize="small" /></ListItemIcon>
          Back to Website
        </MenuItem>
        <Divider sx={{ my: 0.5 }} />
        <MenuItem onClick={() => { close(); onLogout(); }} sx={{ color: 'error.main', mb: 0.5 }}>
          <ListItemIcon sx={{ color: 'inherit' }}><LogoutIcon fontSize="small" /></ListItemIcon>
          Sign out
        </MenuItem>
      </Menu>
    </>
  );
}
