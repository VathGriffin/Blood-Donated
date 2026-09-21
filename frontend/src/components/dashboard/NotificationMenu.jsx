'use client';
import { useState } from 'react';
import Link from 'next/link';
import {
  Badge, Box, IconButton, List, ListItemButton, Popover, Skeleton, Tooltip, Typography,
  useTheme,
} from '@mui/material';
import NotificationsNoneIcon from '@mui/icons-material/NotificationsNone';
import DoneAllIcon from '@mui/icons-material/DoneAll';

/**
 * Bell icon with a count badge and a popover of live, role-specific items
 * (see useDashboardNotifications). Each item links to the page where you act on it.
 */
export default function NotificationMenu({ items, count, loading }) {
  const theme = useTheme();
  const [anchor, setAnchor] = useState(null);
  const close = () => setAnchor(null);
  const { tones } = theme.custom;

  return (
    <>
      <Tooltip title="Notifications">
        <IconButton
          onClick={(e) => setAnchor(e.currentTarget)}
          aria-label={count ? `Notifications, ${count} need attention` : 'Notifications'}
          aria-haspopup="true"
          sx={{ color: 'text.secondary' }}
        >
          <Badge badgeContent={count} color="error" max={99}>
            <NotificationsNoneIcon />
          </Badge>
        </IconButton>
      </Tooltip>

      <Popover
        open={Boolean(anchor)}
        anchorEl={anchor}
        onClose={close}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
        slotProps={{
          paper: {
            sx: {
              mt: 1, width: 360, maxWidth: 'calc(100vw - 32px)', borderRadius: 3,
              border: `1px solid ${theme.palette.divider}`, boxShadow: theme.custom.shadow.lg,
            },
          },
        }}
      >
        <Box sx={{ px: 2, py: 1.5, display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: 1, borderColor: 'divider' }}>
          <Typography variant="subtitle2">Notifications</Typography>
          {count > 0 && <Typography variant="caption" color="text.secondary">{count} need attention</Typography>}
        </Box>

        {loading ? (
          <Box sx={{ p: 2 }}>
            {[0, 1, 2].map((i) => <Skeleton key={i} variant="rounded" height={44} sx={{ mb: 1 }} />)}
          </Box>
        ) : items.length === 0 ? (
          <Box sx={{ py: 5, px: 2, textAlign: 'center' }}>
            <DoneAllIcon sx={{ fontSize: 32, color: 'success.main', mb: 1 }} />
            <Typography variant="subtitle2">You&apos;re all caught up</Typography>
            <Typography variant="body2" color="text.secondary">Nothing needs your attention right now.</Typography>
          </Box>
        ) : (
          <List disablePadding sx={{ p: 0.75, maxHeight: 380, overflowY: 'auto' }}>
            {items.map((item) => {
              const tone = tones[item.tone] || tones.neutral;
              return (
                <ListItemButton key={item.id} component={Link} href={item.href} onClick={close} sx={{ gap: 1.5, py: 1.25, borderRadius: 2 }}>
                  <Box
                    sx={{
                      width: 36, height: 36, borderRadius: '10px', flexShrink: 0,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      bgcolor: tone.bg, color: tone.fg, fontWeight: 800, fontSize: '0.85rem',
                    }}
                  >
                    {item.count > 99 ? '99+' : item.count}
                  </Box>
                  <Box sx={{ minWidth: 0 }}>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>{item.title}</Typography>
                    {item.detail && <Typography variant="caption" color="text.secondary">{item.detail}</Typography>}
                  </Box>
                </ListItemButton>
              );
            })}
          </List>
        )}
      </Popover>
    </>
  );
}
