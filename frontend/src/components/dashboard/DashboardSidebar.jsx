'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import {
  Avatar, Box, Drawer, List, ListItemButton, ListItemIcon, ListItemText, Typography,
  useTheme,
} from '@mui/material';
import BrandLogo from './BrandLogo';
import API_BASE from '@/lib/config';
import { BRAND } from '@/lib/brand';
import { ROLE_CONFIG, isItemActive } from '@/lib/navigation';

function UserCard({ profile }) {
  const sb = useTheme().custom.sidebar;
  const photo = profile.photo ? `${API_BASE}${profile.photo}` : undefined;
  return (
    <Box sx={{ px: 2, py: 2, borderTop: `1px solid ${sb.border}`, display: 'flex', alignItems: 'center', gap: 1.5, flexShrink: 0 }}>
      <Avatar
        src={photo}
        alt=""
        sx={{ width: 38, height: 38, bgcolor: 'rgba(255,255,255,0.18)', color: '#fff', fontSize: '0.9rem', fontWeight: 700, border: '2px solid rgba(255,255,255,0.55)' }}
      >
        {profile.name?.charAt(0)?.toUpperCase()}
      </Avatar>
      <Box sx={{ minWidth: 0 }}>
        <Typography noWrap sx={{ color: '#fff', fontWeight: 700, fontSize: '0.85rem', lineHeight: 1.3 }}>{profile.name}</Typography>
        <Typography noWrap sx={{ color: sb.text, fontSize: '0.72rem', lineHeight: 1.3 }}>{profile.subtitle}</Typography>
      </Box>
    </Box>
  );
}

function SidebarContent({ role, profile, onNavigate }) {
  const pathname = usePathname();
  const sb = useTheme().custom.sidebar;
  const cfg = ROLE_CONFIG[role];

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', background: sb.bgGradient, color: sb.text }}>
      <Box sx={{ px: 2.5, height: 76, display: 'flex', alignItems: 'center', flexShrink: 0 }}>
        <BrandLogo href={cfg.homePath} caption={BRAND.tagline} onClick={onNavigate} />
      </Box>

      <Box
        component="nav"
        aria-label={`${cfg.label} navigation`}
        sx={{ flex: 1, overflowY: 'auto', px: 1.5, py: 1, '&::-webkit-scrollbar': { display: 'none' } }}
      >
        {cfg.sections.map((section, idx) => (
          <Box key={section.title || idx} sx={{ mb: 1 }}>
            {section.title && (
              <Typography sx={{ px: 1.5, mb: 0.75, fontSize: '0.66rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: sb.sectionLabel }}>
                {section.title}
              </Typography>
            )}
            <List disablePadding>
              {section.items.map((item) => {
                const active = isItemActive(item, pathname);
                const Icon = item.icon;
                return (
                  <ListItemButton
                    key={item.href}
                    component={Link}
                    href={item.href}
                    onClick={onNavigate}
                    aria-current={active ? 'page' : undefined}
                    sx={{
                      mb: 0.5, py: 1.1, px: 1.75,
                      color: active ? sb.textActive : sb.text,
                      bgcolor: active ? sb.itemActive : 'transparent',
                      transition: 'background-color .15s ease, color .15s ease',
                      '&:hover': { bgcolor: active ? sb.itemActive : sb.itemHover, color: sb.textActive },
                      '&.Mui-focusVisible': { outlineColor: '#FFFFFF' },
                    }}
                  >
                    <ListItemIcon sx={{ minWidth: 38, color: 'inherit' }}>
                      <Icon sx={{ fontSize: 20 }} />
                    </ListItemIcon>
                    <ListItemText
                      primary={item.label}
                      slotProps={{ primary: { sx: { fontSize: '0.875rem', fontWeight: active ? 700 : 500, letterSpacing: '-0.005em' } } }}
                    />
                  </ListItemButton>
                );
              })}
            </List>
          </Box>
        ))}
      </Box>

      {cfg.backToWebsite && (
        <Box sx={{ px: 1.5, pb: 1.5, flexShrink: 0 }}>
          <ListItemButton
            component={Link}
            href="/"
            onClick={onNavigate}
            sx={{ py: 1, px: 1.75, color: sb.text, '&:hover': { bgcolor: sb.itemHover, color: sb.textActive }, '&.Mui-focusVisible': { outlineColor: '#FFFFFF' } }}
          >
            <ListItemIcon sx={{ minWidth: 38, color: 'inherit' }}><ArrowBackIcon sx={{ fontSize: 20 }} /></ListItemIcon>
            <ListItemText primary="Back to Website" slotProps={{ primary: { sx: { fontSize: '0.85rem', fontWeight: 500 } } }} />
          </ListItemButton>
        </Box>
      )}

      <UserCard profile={profile} />
    </Box>
  );
}

/**
 * Role-specific navigation. A permanent rail from `md` up; below that, a slide-in
 * drawer controlled by `open` / `onClose`. Items come from ROLE_CONFIG — see the note
 * in lib/navigation.js: hiding links is presentation, not access control.
 */
export default function DashboardSidebar({ role, profile, open, onClose }) {
  const { layout } = useTheme().custom;
  const paper = { width: layout.sidebarWidth, boxSizing: 'border-box', border: 0, backgroundImage: 'none' };

  return (
    <>
      <Drawer
        variant="permanent"
        open
        sx={{ display: { xs: 'none', md: 'block' }, width: layout.sidebarWidth, flexShrink: 0, '& .MuiDrawer-paper': paper }}
      >
        <SidebarContent role={role} profile={profile} />
      </Drawer>
      <Drawer
        variant="temporary"
        open={open}
        onClose={onClose}
        ModalProps={{ keepMounted: true }}
        sx={{ display: { xs: 'block', md: 'none' }, '& .MuiDrawer-paper': { ...paper, maxWidth: '86vw' } }}
      >
        <SidebarContent role={role} profile={profile} onNavigate={onClose} />
      </Drawer>
    </>
  );
}
