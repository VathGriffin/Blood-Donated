'use client';
import { useState } from 'react';
import Link from 'next/link';
import { Avatar, Box, Divider, ListItemIcon, MenuItem, MenuList, Popover, Typography, alpha } from '@mui/material';
import {
  AdminPanelSettings, Favorite, LocalHospital, Logout, MailOutline, WaterDrop,
} from '@mui/icons-material';
import { uploadUrl } from '@/lib/config';
import { useT } from '@/i18n/I18nProvider';

/**
 * The link that matches the current page, or null. A link with a query (e.g. /profile?tab=history)
 * needs those parameters too and wins over a plain one (/profile), so only one row is active.
 */
export function activeHref(items, pathname, search = '') {
  const current = new URLSearchParams(search);
  let best = null;
  let bestScore = 0;
  for (const { href } of items) {
    const url = new URL(href, 'http://x');
    if (url.pathname !== pathname) continue;
    const params = [...url.searchParams];
    if (!params.every(([k, v]) => current.get(k) === v)) continue;
    if (params.length + 1 > bestScore) { best = href; bestScore = params.length + 1; }
  }
  return best;
}

const ROLE_ICON = { donor: WaterDrop, admin: AdminPanelSettings, hospital: LocalHospital };

/**
 * Account dropdown shared by the public header and the dashboard top bar.
 *
 * `account`: { name, email, photo, role: 'donor' | 'admin' | 'hospital', roleLabel? } from the
 * signed-in session. `items`: [{ labelKey, href, icon, divider? }] (profileLinks in
 * lib/navigation.js). `onLogout` runs the caller's existing sign-out.
 *
 * A Popover around a MenuList: it closes on outside click, Escape and Tab, keeps itself inside
 * the viewport, returns focus to the trigger, and the arrow keys move between rows. Give the
 * trigger aria-haspopup="menu", aria-expanded and aria-controls={id}.
 */
export default function AccountMenu({ id, anchorEl, onClose, labelledBy, account, items, onLogout }) {
  const open = Boolean(anchorEl);
  const [active, setActive] = useState(null);
  const t = useT();
  const RoleIcon = ROLE_ICON[account.role] || WaterDrop;
  const roleLabel = account.roleLabel || (account.role === 'donor' ? t('common.roles.donor') : null);
  const photo = uploadUrl(account.photo);

  const itemSx = (theme) => ({
    mx: 1, my: 0.25, px: 1.5, py: 1.15, borderRadius: '12px', gap: 1.5, minHeight: 0,
    fontSize: '0.92rem', fontWeight: 500, color: 'text.primary',
    transition: 'background-color .15s ease, color .15s ease',
    '& .MuiListItemIcon-root': { minWidth: 0, color: 'text.secondary', '& svg': { fontSize: 21 } },
    '&:hover': { bgcolor: alpha(theme.palette.primary.main, theme.palette.mode === 'dark' ? 0.12 : 0.06) },
    '&.Mui-focusVisible': { bgcolor: alpha(theme.palette.primary.main, 0.1), outline: `2px solid ${theme.palette.primary.main}`, outlineOffset: -2 },
    '&.Mui-selected, &.Mui-selected:hover': {
      bgcolor: alpha(theme.palette.primary.main, theme.palette.mode === 'dark' ? 0.2 : 0.1),
      color: 'primary.main', fontWeight: 700,
      '& .MuiListItemIcon-root': { color: 'primary.main' },
    },
  });

  return (
    <Popover
      id={id}
      open={open}
      anchorEl={anchorEl}
      onClose={onClose}
      marginThreshold={12}
      anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      transformOrigin={{ vertical: 'top', horizontal: 'right' }}
      transitionDuration={{ enter: 200, exit: 140 }}
      // The active row is worked out as the menu opens, from the address bar.
      slotProps={{
        transition: { onEnter: () => setActive(activeHref(items, window.location.pathname, window.location.search)) },
        paper: {
          sx: (theme) => ({
            mt: 1.25, width: 320, maxWidth: 'calc(100vw - 24px)', borderRadius: '20px', overflow: 'hidden',
            border: 1, borderColor: theme.palette.mode === 'dark' ? alpha('#fff', 0.08) : '#E2E8F0',
            boxShadow: theme.palette.mode === 'dark' ? '0 18px 48px rgba(0,0,0,0.5)' : '0 18px 48px rgba(16,43,78,0.16), 0 2px 6px rgba(16,43,78,0.06)',
            bgcolor: 'background.paper', backgroundImage: 'none',
          }),
        },
      }}
    >
      {/* Who is signed in. Not focusable: the menu rows below are. */}
      <Box
        sx={(theme) => ({
          position: 'relative', overflow: 'hidden', px: 2.5, pt: 2.5, pb: 2.25,
          display: 'flex', alignItems: 'center', gap: 2,
          background: theme.palette.mode === 'dark'
            ? `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.22)} 0%, ${alpha(theme.palette.primary.main, 0.06)} 100%)`
            : 'linear-gradient(135deg, #FFE4E8 0%, #FFF5F6 55%, #FFFFFF 100%)',
          borderBottom: 1, borderColor: 'divider',
        })}
      >
        <WaterDrop aria-hidden="true" sx={(theme) => ({
          position: 'absolute', top: 10, right: 14, fontSize: 46, color: alpha(theme.palette.primary.main, 0.22), transform: 'rotate(8deg)',
        })} />
        <Box sx={{ position: 'relative', flexShrink: 0 }}>
          <Avatar src={photo} alt="" sx={{
            width: 64, height: 64, fontSize: '1.4rem', fontWeight: 800, bgcolor: 'primary.main', color: '#fff',
            border: '3px solid', borderColor: 'background.paper', boxShadow: '0 6px 16px rgba(16,43,78,0.16)',
          }}>
            {account.name?.charAt(0)?.toUpperCase() || '?'}
          </Avatar>
          {account.role === 'donor' && (
            <Box aria-hidden="true" sx={{
              position: 'absolute', right: -2, bottom: -2, width: 24, height: 24, borderRadius: '50%',
              display: 'grid', placeItems: 'center', bgcolor: 'primary.main', color: '#fff',
              border: '2px solid', borderColor: 'background.paper', '& svg': { fontSize: 13 },
            }}>
              <Favorite />
            </Box>
          )}
        </Box>
        <Box sx={{ minWidth: 0, position: 'relative' }}>
          <Typography noWrap sx={{ fontWeight: 800, fontSize: '1.08rem', lineHeight: 1.25, color: (theme) => (theme.palette.mode === 'dark' ? 'text.primary' : '#102B4E') }}>
            {account.name}
          </Typography>
          {roleLabel && (
            <Box component="span" sx={(theme) => ({
              mt: 0.6, display: 'inline-flex', alignItems: 'center', gap: 0.5, px: 1, height: 24, maxWidth: '100%',
              borderRadius: 999, border: 1, borderColor: alpha(theme.palette.primary.main, 0.3),
              bgcolor: theme.palette.mode === 'dark' ? alpha(theme.palette.primary.main, 0.16) : '#fff',
              color: 'primary.main', fontSize: '0.75rem', fontWeight: 700,
            })}>
              <RoleIcon aria-hidden="true" sx={{ fontSize: 14 }} />
              <Box component="span" sx={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{roleLabel}</Box>
            </Box>
          )}
          {account.email && (
            <Typography noWrap title={account.email} sx={{ mt: 0.6, display: 'flex', alignItems: 'center', gap: 0.75, fontSize: '0.8rem', color: 'text.secondary' }}>
              <MailOutline aria-hidden="true" sx={{ fontSize: 16, flexShrink: 0 }} />
              <Box component="span" sx={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{account.email}</Box>
            </Typography>
          )}
        </Box>
      </Box>

      <MenuList
        autoFocusItem={open}
        aria-labelledby={labelledBy}
        aria-label={labelledBy ? undefined : t('layout.account.menu')}
        // Tab leaves the menu, like any menu: close it and let focus go back to the trigger.
        onKeyDown={(e) => { if (e.key === 'Tab') { e.preventDefault(); onClose(); } }}
        sx={{ py: 1 }}
      >
        {items.flatMap(({ labelKey, href, icon: Icon, divider }) => [
          divider && <Divider key={`${href}-divider`} sx={{ mx: 2, my: '6px !important' }} />,
          <MenuItem
            key={href}
            component={Link}
            href={href}
            onClick={onClose}
            selected={active === href}
            aria-current={active === href ? 'page' : undefined}
            sx={itemSx}
          >
            <ListItemIcon><Icon /></ListItemIcon>
            {t(labelKey)}
          </MenuItem>,
        ]).filter(Boolean)}

        <Divider sx={{ my: '6px !important' }} />
        <MenuItem
          onClick={() => { onClose(); onLogout(); }}
          sx={(theme) => ({
            ...itemSx(theme),
            mb: 0.5, color: 'error.main', fontWeight: 700,
            '& .MuiListItemIcon-root': { minWidth: 0, color: 'error.main', '& svg': { fontSize: 21 } },
            '&:hover': { bgcolor: alpha(theme.palette.error.main, 0.08) },
            '&.Mui-focusVisible': { bgcolor: alpha(theme.palette.error.main, 0.1), outline: `2px solid ${theme.palette.error.main}`, outlineOffset: -2 },
          })}
        >
          <ListItemIcon><Logout /></ListItemIcon>
          {t('common.logout')}
        </MenuItem>
      </MenuList>
    </Popover>
  );
}
