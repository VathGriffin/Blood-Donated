'use client';
import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import axios from 'axios';
import {
  Badge, Box, Button, IconButton, List, ListItemButton, Popover, Skeleton, Tooltip, Typography, useTheme,
} from '@mui/material';
import NotificationsNoneOutlined from '@mui/icons-material/NotificationsNoneOutlined';
import ChatBubbleOutlineIcon from '@mui/icons-material/ChatBubbleOutline';
import EventAvailableOutlinedIcon from '@mui/icons-material/EventAvailableOutlined';
import AlarmOutlinedIcon from '@mui/icons-material/AlarmOutlined';
import BloodtypeOutlinedIcon from '@mui/icons-material/BloodtypeOutlined';
import DoneAllIcon from '@mui/icons-material/DoneAll';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import API_BASE from '@/lib/config';
import { useUserAuth } from '@/store/UserAuthContext';

const POLL_MS = 60 * 1000;
const RED = '#B91C2C';

const ICONS = {
  message: <ChatBubbleOutlineIcon />,
  appointment: <EventAvailableOutlinedIcon />,
  reminder: <AlarmOutlinedIcon />,
  request: <BloodtypeOutlinedIcon />,
};
const TONES = {
  info: { fg: '#1D4ED8', bg: '#DBEAFE', darkBg: 'rgba(59,130,246,0.18)', darkFg: '#93C5FD' },
  success: { fg: '#15803D', bg: '#DCFCE7', darkBg: 'rgba(34,197,94,0.16)', darkFg: '#86EFAC' },
  warning: { fg: '#B45309', bg: '#FEF3C7', darkBg: 'rgba(245,158,11,0.16)', darkFg: '#FCD34D' },
  error: { fg: RED, bg: '#FDECEE', darkBg: 'rgba(185,28,44,0.2)', darkFg: '#FCA5A5' },
};

const timeAgo = (at) => {
  const s = Math.max(0, (Date.now() - new Date(at).getTime()) / 1000);
  if (s < 60) return 'Just now';
  if (s < 3600) return `${Math.floor(s / 60)} min ago`;
  if (s < 86400) return `${Math.floor(s / 3600)} h ago`;
  if (s < 7 * 86400) return `${Math.floor(s / 86400)} d ago`;
  return new Date(at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

// Bell for signed-in donors: their real activity (team replies, appointment and blood-request
// status changes, upcoming-appointment reminders) from GET /api/notifications. Opening the list
// marks everything as seen on the server, so the badge clears on every device.
export default function DonorNotifications({ size = 38 }) {
  const isDark = useTheme().palette.mode === 'dark';
  const { token } = useUserAuth();
  const [anchor, setAnchor] = useState(null);
  const [data, setData] = useState(null); // { items, unread }
  const [error, setError] = useState(false);
  const inFlight = useRef(false);

  const load = useCallback(async () => {
    if (!token || inFlight.current) return;
    inFlight.current = true;
    try {
      const { data: feed } = await axios.get(`${API_BASE}/api/notifications`, { headers: { Authorization: `Bearer ${token}` } });
      setData(feed);
      setError(false);
    } catch {
      setError(true);
    } finally {
      inFlight.current = false;
    }
  }, [token]);

  // Load now, then refresh every minute while the tab is visible and whenever it regains focus.
  useEffect(() => {
    if (!token) return undefined;
    load();
    const tick = setInterval(() => { if (document.visibilityState === 'visible') load(); }, POLL_MS);
    const onFocus = () => load();
    window.addEventListener('focus', onFocus);
    return () => { clearInterval(tick); window.removeEventListener('focus', onFocus); };
  }, [token, load]);

  // Items that were new when the list was opened stay highlighted until it closes.
  const [highlight, setHighlight] = useState(() => new Set());
  const open = async (e) => {
    setAnchor(e.currentTarget);
    if (!data?.unread) { load(); return; }
    setHighlight(new Set(data.items.filter((i) => i.unread).map((i) => i.id)));
    setData((d) => ({ ...d, unread: 0 }));
    // Reload only after the server has recorded "seen", so the badge can't come back from a stale read.
    await axios.post(`${API_BASE}/api/notifications/seen`, {}, { headers: { Authorization: `Bearer ${token}` } }).catch(() => {});
    load();
  };
  const close = () => { setAnchor(null); setHighlight(new Set()); };

  const unread = data?.unread || 0;
  const items = (data?.items || []).map((i) => (highlight.has(i.id) ? { ...i, unread: true } : i));
  const border = isDark ? '#262626' : '#E2E8F0';

  return (
    <>
      <Tooltip title="Notifications">
        <IconButton onClick={open} aria-haspopup="dialog" aria-expanded={Boolean(anchor)}
          aria-label={unread ? `Notifications, ${unread} unread` : 'Notifications'}
          sx={{ color: isDark ? 'rgba(245,245,245,0.7)' : '#475569', width: size, height: size }}>
          <Badge badgeContent={unread} max={9} overlap="circular"
            sx={{ '& .MuiBadge-badge': { bgcolor: RED, color: '#fff', fontWeight: 700, fontSize: '0.65rem', minWidth: 17, height: 17, px: 0.5, border: `2px solid ${isDark ? '#0a0a0a' : '#fff'}` } }}>
            <NotificationsNoneOutlined sx={{ fontSize: 22 }} />
          </Badge>
        </IconButton>
      </Tooltip>

      <Popover open={Boolean(anchor)} anchorEl={anchor} onClose={close}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }} transformOrigin={{ vertical: 'top', horizontal: 'right' }}
        slotProps={{ paper: { role: 'dialog', 'aria-label': 'Notifications', sx: {
          mt: 1.25, width: 380, maxWidth: 'calc(100vw - 24px)', borderRadius: '16px', overflow: 'hidden',
          border: `1px solid ${border}`, boxShadow: '0 20px 50px rgba(15,23,42,0.16)', bgcolor: isDark ? '#111' : '#fff',
        } } }}>
        <Box sx={{ px: 2.25, py: 1.75, display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: `1px solid ${border}` }}>
          <Typography sx={{ fontWeight: 800, fontSize: '1rem' }}>Notifications</Typography>
          {items.some((i) => i.unread) && (
            <Typography sx={{ fontSize: '0.75rem', fontWeight: 700, color: RED, bgcolor: isDark ? 'rgba(185,28,44,0.2)' : '#FDECEE', px: 1, py: 0.25, borderRadius: 999 }}>
              {items.filter((i) => i.unread).length} new
            </Typography>
          )}
        </Box>

        {!data && !error && (
          <Box sx={{ p: 2 }} role="status" aria-label="Loading notifications">
            {[0, 1, 2].map((i) => (
              <Box key={i} sx={{ display: 'flex', gap: 1.5, mb: 1.5 }}>
                <Skeleton variant="circular" width={36} height={36} />
                <Box sx={{ flex: 1 }}><Skeleton width="60%" /><Skeleton width="90%" /></Box>
              </Box>
            ))}
          </Box>
        )}

        {!data && error && (
          <Box sx={{ py: 4, px: 3, textAlign: 'center' }} role="alert">
            <ErrorOutlineIcon sx={{ fontSize: 32, color: 'text.disabled', mb: 1 }} />
            <Typography sx={{ fontWeight: 700, fontSize: '0.92rem' }}>Couldn’t load notifications</Typography>
            <Button size="small" onClick={load} sx={{ mt: 1, textTransform: 'none', fontWeight: 700, color: RED }}>Try again</Button>
          </Box>
        )}

        {data && items.length === 0 && (
          <Box sx={{ py: 5, px: 3, textAlign: 'center' }}>
            <DoneAllIcon sx={{ fontSize: 32, color: '#16A34A', mb: 1 }} />
            <Typography sx={{ fontWeight: 700, fontSize: '0.95rem' }}>You’re all caught up</Typography>
            <Typography sx={{ color: 'text.secondary', fontSize: '0.84rem', mt: 0.5 }}>
              Updates on your appointments, blood requests and messages will appear here.
            </Typography>
          </Box>
        )}

        {data && items.length > 0 && (
          <List disablePadding sx={{ maxHeight: 420, overflowY: 'auto', p: 0.75 }}>
            {items.map((item) => {
              const tone = TONES[item.tone] || TONES.info;
              return (
                <ListItemButton key={item.id} component={Link} href={item.href} onClick={close}
                  sx={{ alignItems: 'flex-start', gap: 1.5, py: 1.25, px: 1.5, borderRadius: '12px', mb: 0.25,
                    bgcolor: item.unread ? (isDark ? 'rgba(185,28,44,0.1)' : '#FEF7F8') : 'transparent' }}>
                  <Box aria-hidden="true" sx={{
                    width: 36, height: 36, borderRadius: '50%', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
                    bgcolor: isDark ? tone.darkBg : tone.bg, color: isDark ? tone.darkFg : tone.fg, '& svg': { fontSize: 19 },
                  }}>
                    {ICONS[item.type] || ICONS.message}
                  </Box>
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 1 }}>
                      <Typography sx={{ flex: 1, fontWeight: item.unread ? 800 : 600, fontSize: '0.88rem', lineHeight: 1.3 }}>{item.title}</Typography>
                      <Typography component="time" dateTime={item.at} sx={{ color: 'text.secondary', fontSize: '0.72rem', flexShrink: 0 }}>{timeAgo(item.at)}</Typography>
                    </Box>
                    <Typography sx={{ color: 'text.secondary', fontSize: '0.8rem', mt: 0.25, lineHeight: 1.4, overflowWrap: 'anywhere' }}>{item.body}</Typography>
                  </Box>
                  {item.unread && <Box component="span" aria-label="unread" sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: RED, mt: 0.75, flexShrink: 0 }} />}
                </ListItemButton>
              );
            })}
          </List>
        )}

        <Box sx={{ borderTop: `1px solid ${border}`, display: 'flex' }}>
          <Button component={Link} href="/notification" onClick={close} fullWidth
            sx={{ py: 1.25, borderRadius: 0, textTransform: 'none', fontWeight: 700, color: RED }}>
            Open messages
          </Button>
          <Button component={Link} href="/profile" onClick={close} fullWidth
            sx={{ py: 1.25, borderRadius: 0, textTransform: 'none', fontWeight: 700, color: 'text.secondary', borderLeft: `1px solid ${border}` }}>
            My appointments
          </Button>
        </Box>
      </Popover>
    </>
  );
}
