'use client';
import { Fragment, useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import {
  Alert, Avatar, Box, Button, CircularProgress, Dialog, DialogActions, DialogContent, DialogTitle, IconButton,
  InputBase, Paper, Skeleton, Snackbar, Tooltip, Typography,
} from '@mui/material';
import { alpha } from '@mui/material/styles';
import ForumIcon from '@mui/icons-material/Forum';
import SendIcon from '@mui/icons-material/Send';
import DoneIcon from '@mui/icons-material/Done';
import DoneAllIcon from '@mui/icons-material/DoneAll';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import RefreshIcon from '@mui/icons-material/Refresh';
import ContactMailOutlinedIcon from '@mui/icons-material/ContactMailOutlined';
import SmartToyOutlinedIcon from '@mui/icons-material/SmartToyOutlined';
import EventAvailableOutlinedIcon from '@mui/icons-material/EventAvailableOutlined';
import WaterDropOutlinedIcon from '@mui/icons-material/WaterDropOutlined';
import PersonOutlineIcon from '@mui/icons-material/PersonOutline';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import LockIcon from '@mui/icons-material/Lock';
import API_BASE from '@/lib/config';
import { useUserAuth } from '@/store/UserAuthContext';
import { CardMenu, cardSx } from '@/components/donor/ui';
import DonorPageHero from '@/components/donor/PageHero';
import HelpSidebar from './_components/HelpSidebar';

const POLL_MS = 8000;            // same refresh interval the page has always used
const MAX_LENGTH = 2000;         // must match MAX_MESSAGE_LENGTH in Backend/src/notification/message.routes.js
const NEAR_BOTTOM_PX = 120;

// Starters for the composer — the donor still reads, edits and sends them.
const QUICK_ACTIONS = [
  { label: 'Appointment help', icon: <EventAvailableOutlinedIcon />, text: 'Hi, I need help with my appointment: ' },
  { label: 'Blood request question', icon: <WaterDropOutlinedIcon />, text: 'Hi, I have a question about my blood request: ' },
  { label: 'Update my profile', icon: <PersonOutlineIcon />, text: 'Hi, I need help updating my profile: ' },
];

const dayKey = (d) => new Date(d).toDateString();
const dayLabel = (d) => {
  const date = new Date(d);
  const today = new Date();
  const yesterday = new Date(); yesterday.setDate(today.getDate() - 1);
  if (date.toDateString() === today.toDateString()) return 'Today';
  if (date.toDateString() === yesterday.toDateString()) return 'Yesterday';
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};
const timeLabel = (d) => new Date(d).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
// Cheap fingerprint so a poll that brings nothing new doesn't re-render the conversation.
const signature = (list) => list.map((m) => `${m._id}:${m.read ? 1 : 0}:${m.deleted ? 1 : 0}`).join('|');

function SupportAvatar({ size = 40 }) {
  return (
    <Avatar aria-hidden="true" sx={{ bgcolor: 'primary.main', color: '#fff', width: size, height: size, fontSize: size * 0.36, fontWeight: 800 }}>
      AD
    </Avatar>
  );
}

function BubbleSkeletons() {
  return (
    <Box aria-hidden="true" sx={{ display: 'flex', flexDirection: 'column', gap: 2, p: 1 }}>
      {[0, 1, 2].map((i) => (
        <Box key={i} sx={{ display: 'flex', gap: 1.25, justifyContent: i === 1 ? 'flex-end' : 'flex-start' }}>
          {i !== 1 && <Skeleton variant="circular" width={36} height={36} />}
          <Skeleton variant="rounded" width={i === 1 ? '45%' : '60%'} height={i === 2 ? 84 : 56} sx={{ borderRadius: '14px' }} />
        </Box>
      ))}
    </Box>
  );
}

/**
 * Donor ↔ BloodLife admin chat, on the existing messages API:
 *   GET /api/messages/mine   – only this donor's conversation (server-scoped to the token)
 *   POST /api/messages       – send (server trims, rejects empty or > 2000 characters)
 *   DELETE /api/messages/:id – delete one of the donor's own messages
 * "Seen" is real: the `read` flag is set when an admin opens the conversation. There is no
 * online status or typing indicator in the backend, so none is shown.
 */
export default function MessageAdminPage() {
  const router = useRouter();
  const { token, user, isAuth, logout } = useUserAuth();
  const [messages, setMessages] = useState([]);
  const [status, setStatus] = useState('loading'); // 'loading' | 'ready' | 'error'
  const [content, setContent] = useState('');
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState('');
  const [toDelete, setToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [toast, setToast] = useState(null);
  const [showJump, setShowJump] = useState(false);

  const listRef = useRef(null);
  const inputRef = useRef(null);
  const sendingRef = useRef(false);
  const sigRef = useRef('');
  const lastIdRef = useRef(null); // newest message id we've rendered
  const stickToBottom = useRef(true); // scroll to the newest message on the next render
  const logoutRef = useRef(logout);
  logoutRef.current = logout;

  const sessionExpired = useCallback((err) => {
    if (err?.response?.status !== 401) return false;
    logoutRef.current();
    router.push('/login');
    return true;
  }, [router]);

  const isNearBottom = () => {
    const el = listRef.current;
    return !el || el.scrollHeight - el.scrollTop - el.clientHeight < NEAR_BOTTOM_PX;
  };

  const fetchMessages = useCallback(async (quiet = false) => {
    if (!token) return;
    try {
      const { data } = await axios.get(`${API_BASE}/api/messages/mine`, { headers: { Authorization: `Bearer ${token}` } });
      const list = Array.isArray(data) ? data : [];
      const sig = signature(list);
      if (sig !== sigRef.current) {
        const last = list[list.length - 1]?._id || null;
        if (last !== lastIdRef.current) {
          // A new message: follow it if the reader is at the bottom (or this is the first load),
          // otherwise offer a "New messages" button instead of yanking the view.
          if (!lastIdRef.current || isNearBottom()) stickToBottom.current = true;
          else setShowJump(true);
        }
        sigRef.current = sig;
        lastIdRef.current = last;
        setMessages(list);
      }
      setStatus('ready');
    } catch (err) {
      if (sessionExpired(err)) return;
      if (!quiet) setStatus('error');
    }
  }, [token, sessionExpired]);

  // Initial load, then the existing 8-second refresh — paused while the tab is hidden, and
  // run once straight away when it becomes visible again.
  useEffect(() => {
    if (!isAuth) return undefined;
    fetchMessages();
    const id = setInterval(() => { if (document.visibilityState === 'visible') fetchMessages(true); }, POLL_MS);
    const onVisible = () => { if (document.visibilityState === 'visible') fetchMessages(true); };
    document.addEventListener('visibilitychange', onVisible);
    return () => { clearInterval(id); document.removeEventListener('visibilitychange', onVisible); };
  }, [isAuth, fetchMessages]);

  // Keep the view on the newest message when the reader is already at the bottom (or just sent).
  useLayoutEffect(() => {
    const el = listRef.current;
    if (el && stickToBottom.current) {
      el.scrollTop = el.scrollHeight;
      stickToBottom.current = false;
      setShowJump(false);
    }
  }, [messages, status]);

  const jumpToLatest = () => {
    const el = listRef.current;
    if (el) el.scrollTo({ top: el.scrollHeight, behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
    setShowJump(false);
  };

  const send = async () => {
    const text = content.trim();
    if (!text || text.length > MAX_LENGTH || sendingRef.current) return; // one send at a time
    sendingRef.current = true;
    setSending(true);
    setSendError('');
    try {
      const { data } = await axios.post(`${API_BASE}/api/messages`, { content: text }, { headers: { Authorization: `Bearer ${token}` } });
      setMessages((prev) => {
        const next = prev.some((m) => m._id === data._id) ? prev : [...prev, data];
        sigRef.current = signature(next);
        lastIdRef.current = data._id;
        return next;
      });
      stickToBottom.current = true;
      setContent(''); // only after the server has stored it
    } catch (err) {
      if (sessionExpired(err)) return;
      setSendError(err.response?.data?.message || 'Your message wasn’t sent. Check your connection and try again.');
    } finally {
      sendingRef.current = false;
      setSending(false);
      inputRef.current?.focus();
    }
  };

  const onKeyDown = (e) => {
    // Enter sends, Shift+Enter adds a line; ignore Enter while an IME is composing text.
    if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) {
      e.preventDefault();
      send();
    }
  };

  const confirmDelete = async () => {
    if (!toDelete || deleting) return;
    setDeleting(true);
    try {
      await axios.delete(`${API_BASE}/api/messages/${toDelete._id}`, { headers: { Authorization: `Bearer ${token}` } });
      setMessages((prev) => {
        const next = prev.filter((m) => m._id !== toDelete._id);
        sigRef.current = signature(next);
        lastIdRef.current = next[next.length - 1]?._id || null;
        return next;
      });
      setToast({ severity: 'success', message: 'Message deleted.' });
      setToDelete(null);
    } catch (err) {
      if (sessionExpired(err)) return;
      setToast({ severity: 'error', message: err.response?.data?.message || 'Could not delete the message.' });
    } finally {
      setDeleting(false);
    }
  };

  const applyQuickAction = (text) => {
    setContent((c) => (c.trim() ? c : text));
    requestAnimationFrame(() => {
      const el = inputRef.current;
      if (el) { el.focus(); el.setSelectionRange(el.value.length, el.value.length); }
    });
  };

  if (!isAuth) {
    return (
      <Box sx={{ minHeight: '70vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', px: 2, textAlign: 'center' }}>
        <LockIcon sx={{ fontSize: 56, color: 'primary.main', mb: 2 }} />
        <Typography variant="h5" fontWeight={700} gutterBottom>Please log in to message admin</Typography>
        <Typography variant="body2" color="text.secondary" mb={3}>You need an account to send messages.</Typography>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button variant="contained" component={Link} href="/login">Log In</Button>
          <Button variant="outlined" component={Link} href="/register">Sign Up</Button>
        </Box>
      </Box>
    );
  }

  const tooLong = content.trim().length > MAX_LENGTH;
  const canSend = !!content.trim() && !tooLong && !sending;
  const userPhoto = user?.photo ? `${API_BASE}${user.photo}` : undefined;

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: { xs: 2, md: 2.5 }, pb: 4, minWidth: 0 }}>
      <DonorPageHero id="messages-title" icon={<ForumIcon />} title="Message Admin" subtitle="Have a question? Chat directly with our team." />

      <Box sx={{ display: 'grid', gap: { xs: 2, md: 2.5 }, alignItems: 'start', gridTemplateColumns: { xs: 'minmax(0, 1fr)', md: 'minmax(0, 1fr) 290px', lg: 'minmax(0, 1fr) 340px' } }}>
        {/* ── Chat ── */}
        <Paper component="section" aria-labelledby="chat-title" elevation={0} sx={{
          ...cardSx, overflow: 'hidden', display: 'flex', flexDirection: 'column',
          height: { xs: '78vh', md: 'calc(100vh - 290px)' }, minHeight: { xs: 480, md: 560 }, maxHeight: 820,
        }}>
          {/* Header */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.75, px: { xs: 2, sm: 2.5 }, py: 2, borderBottom: '1px solid', borderColor: 'divider' }}>
            <SupportAvatar size={48} />
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Typography id="chat-title" component="h2" sx={{ fontWeight: 800, fontSize: '1.08rem' }}>BloodLife Support</Typography>
              <Typography variant="body2" color="text.secondary" noWrap>Answered by the BloodLife admin team · {status === 'ready' ? `${messages.length} message${messages.length !== 1 ? 's' : ''}` : '…'}</Typography>
            </Box>
            <CardMenu id="chat" label="the conversation" items={[
              { label: 'Refresh messages', icon: <RefreshIcon />, onClick: () => fetchMessages() },
              { label: 'Ask the AI Assistant', icon: <SmartToyOutlinedIcon />, href: '/assistant' },
              { label: 'Contact page', icon: <ContactMailOutlinedIcon />, href: '/contact' },
            ]} />
          </Box>

          {/* Conversation */}
          <Box sx={{ position: 'relative', flex: 1, minHeight: 0 }}>
            <Box ref={listRef} role="log" aria-live="polite" aria-label="Conversation with BloodLife Support" tabIndex={0}
              onScroll={() => { if (isNearBottom()) setShowJump(false); }}
              sx={{
                height: '100%', overflowY: 'auto', px: { xs: 1.5, sm: 2.5 }, py: 2, display: 'flex', flexDirection: 'column', gap: 1.75,
                bgcolor: (t) => (t.palette.mode === 'dark' ? t.custom.surface.subtle : '#FBFCFE'),
                '&:focus-visible': { outline: '2px solid', outlineColor: 'primary.main', outlineOffset: -2 },
              }}>
              {/* Intro — a fixed explainer, not a message from the team */}
              <Box sx={{ alignSelf: 'center', maxWidth: 560, width: '100%', p: 2, borderRadius: '14px', border: '1px solid', borderColor: 'divider', bgcolor: 'background.paper', textAlign: 'center' }}>
                <Typography sx={{ fontWeight: 700, fontSize: '0.95rem' }}>Welcome to BloodLife AI Support</Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                  Send us a message and an admin will reply in this conversation. You can start with one of these:
                </Typography>
                <Box sx={{ mt: 1.5, display: 'flex', gap: 1, flexWrap: 'wrap', justifyContent: 'center' }}>
                  {QUICK_ACTIONS.map((qa) => (
                    <Button key={qa.label} variant="outlined" size="small" startIcon={qa.icon} onClick={() => applyQuickAction(qa.text)}
                      sx={{ borderRadius: '10px', fontWeight: 600, color: 'text.primary', borderColor: 'divider', bgcolor: 'background.paper',
                        '& .MuiButton-startIcon': { color: 'primary.main' }, '&:hover': { borderColor: 'primary.main', bgcolor: 'background.paper' } }}>
                      {qa.label}
                    </Button>
                  ))}
                </Box>
              </Box>

              {status === 'loading' ? <BubbleSkeletons />
                : status === 'error' ? (
                  <Alert severity="error" variant="outlined" icon={<ErrorOutlineIcon />} sx={{ borderRadius: '12px', alignItems: 'center', bgcolor: 'background.paper' }}
                    action={<Button color="error" size="small" onClick={() => { setStatus('loading'); fetchMessages(); }}>Try again</Button>}>
                    We couldn&apos;t load your messages.
                  </Alert>
                ) : messages.length === 0 ? (
                  <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', mt: 2 }}>
                    No messages yet — your conversation will appear here.
                  </Typography>
                ) : messages.map((m, i) => {
                  const isUser = m.sender === 'user';
                  const newDay = i === 0 || dayKey(m.createdAt) !== dayKey(messages[i - 1].createdAt);
                  return (
                    <Fragment key={m._id}>
                      {newDay && (
                        <Box role="separator" aria-label={dayLabel(m.createdAt)} sx={{ alignSelf: 'center', px: 1.5, py: 0.4, borderRadius: '8px', fontSize: '0.78rem', fontWeight: 600, color: 'text.secondary', bgcolor: (t) => alpha(t.palette.text.primary, 0.06) }}>
                          {dayLabel(m.createdAt)}
                        </Box>
                      )}
                      <Box sx={{ display: 'flex', alignItems: 'flex-end', gap: 1.25, justifyContent: isUser ? 'flex-end' : 'flex-start', '&:hover .msg-delete, &:focus-within .msg-delete': { opacity: 1 } }}>
                        {!isUser && <Box sx={{ alignSelf: 'flex-start' }}><SupportAvatar size={38} /></Box>}
                        {isUser && (
                          <Tooltip title="Delete message">
                            <IconButton className="msg-delete" size="small" aria-label="Delete this message" onClick={() => setToDelete(m)}
                              sx={{ opacity: { xs: 1, md: 0 }, transition: 'opacity .15s', color: 'text.secondary', mb: 3, '&:hover': { color: 'error.main' } }}>
                              <DeleteOutlineIcon sx={{ fontSize: 18 }} />
                            </IconButton>
                          </Tooltip>
                        )}
                        <Box sx={{ maxWidth: { xs: '82%', sm: '72%' }, minWidth: 0 }}>
                          <Box sx={{
                            px: 1.75, py: 1.25, borderRadius: isUser ? '16px 16px 4px 16px' : '4px 16px 16px 16px',
                            bgcolor: isUser ? (t) => t.custom.tones.primary.bg : 'background.paper',
                            border: '1px solid', borderColor: isUser ? 'transparent' : 'divider',
                            boxShadow: (t) => t.custom.shadow.xs,
                          }}>
                            {m.deleted ? (
                              <Typography variant="body2" sx={{ fontSize: '0.9rem', fontStyle: 'italic', color: 'text.secondary' }}>
                                This message was deleted
                              </Typography>
                            ) : (
                              <Typography variant="body2" sx={{ fontSize: '0.92rem', lineHeight: 1.6, whiteSpace: 'pre-wrap', overflowWrap: 'anywhere', color: 'text.primary' }}>
                                {m.content}
                              </Typography>
                            )}
                          </Box>
                          <Typography variant="caption" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.4, px: 0.5, justifyContent: isUser ? 'flex-end' : 'flex-start' }}>
                            <time dateTime={m.createdAt}>{timeLabel(m.createdAt)}</time>
                            {isUser && (m.read
                              ? <><DoneAllIcon aria-hidden="true" sx={{ fontSize: 15, color: 'info.main' }} /><span>Seen</span></>
                              : <><DoneIcon aria-hidden="true" sx={{ fontSize: 15 }} /><span>Sent</span></>)}
                          </Typography>
                        </Box>
                        {isUser && (
                          <Avatar src={userPhoto} alt="" sx={{ width: 36, height: 36, mb: 3, bgcolor: 'grey.700', fontSize: '0.85rem', fontWeight: 700 }}>
                            {user?.fullName?.charAt(0)?.toUpperCase()}
                          </Avatar>
                        )}
                      </Box>
                    </Fragment>
                  );
                })}
            </Box>
            {showJump && (
              <Button onClick={jumpToLatest} variant="contained" size="small" endIcon={<KeyboardArrowDownIcon />}
                sx={{ position: 'absolute', bottom: 12, left: '50%', transform: 'translateX(-50%)', borderRadius: '999px', boxShadow: (t) => t.custom.shadow.md }}>
                New messages
              </Button>
            )}
          </Box>

          {/* Composer */}
          <Box component="form" onSubmit={(e) => { e.preventDefault(); send(); }}
            sx={{ borderTop: '1px solid', borderColor: 'divider', px: { xs: 1.5, sm: 2.5 }, py: 1.5, bgcolor: 'background.paper' }}>
            {sendError && (
              <Alert severity="error" sx={{ mb: 1.25, borderRadius: '10px', alignItems: 'center' }}
                action={<Button color="error" size="small" onClick={send} disabled={!canSend}>Retry</Button>}>
                {sendError}
              </Alert>
            )}
            <Box sx={{ display: 'flex', alignItems: 'flex-end', gap: 1.25 }}>
              <Box sx={{
                flex: 1, minWidth: 0, display: 'flex', alignItems: 'center', px: 1.75, py: 1, borderRadius: '14px',
                border: '1px solid', borderColor: tooLong ? 'error.main' : 'divider', bgcolor: 'background.paper',
                '&:focus-within': { borderColor: tooLong ? 'error.main' : 'primary.main', boxShadow: (t) => `0 0 0 3px ${alpha(t.palette.primary.main, 0.14)}` },
              }}>
                <InputBase inputRef={inputRef} value={content} onChange={(e) => { setContent(e.target.value); if (sendError) setSendError(''); }}
                  onKeyDown={onKeyDown} placeholder="Type a message..." multiline maxRows={5} fullWidth
                  inputProps={{ 'aria-label': 'Message to BloodLife Support', 'aria-describedby': 'composer-hint', maxLength: MAX_LENGTH + 200 }}
                  sx={{ fontSize: '0.95rem' }} />
              </Box>
              <IconButton type="submit" disabled={!canSend} aria-label={sending ? 'Sending message' : 'Send message'}
                sx={{
                  width: 50, height: 50, flexShrink: 0, bgcolor: 'primary.main', color: '#fff', boxShadow: (t) => t.custom.shadow.sm,
                  '&:hover': { bgcolor: 'primary.dark' },
                  '&.Mui-disabled': { bgcolor: (t) => alpha(t.palette.primary.main, 0.3), color: '#fff' },
                  '&.Mui-focusVisible': { outline: '2px solid', outlineColor: 'primary.main', outlineOffset: 2 },
                }}>
                {sending ? <CircularProgress size={20} color="inherit" /> : <SendIcon sx={{ fontSize: 22 }} />}
              </IconButton>
            </Box>
            <Typography id="composer-hint" variant="caption" sx={{ display: 'flex', justifyContent: 'space-between', mt: 0.75, px: 0.5, color: tooLong ? 'error.main' : 'text.secondary' }}>
              <span>Enter to send · Shift + Enter for a new line</span>
              {content.length > MAX_LENGTH - 300 && <span>{content.trim().length}/{MAX_LENGTH}</span>}
            </Typography>
          </Box>
        </Paper>

        {/* ── Help ── */}
        <HelpSidebar />
      </Box>

      <Dialog open={Boolean(toDelete)} onClose={() => !deleting && setToDelete(null)} maxWidth="xs" fullWidth aria-labelledby="del-msg-title"
        slotProps={{ paper: { sx: { borderRadius: '18px' } } }}>
        <DialogTitle id="del-msg-title" sx={{ fontWeight: 800, fontSize: '1.05rem' }}>Delete this message?</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary">
            It will be removed from the conversation for you and the support team. This can’t be undone.
          </Typography>
          {toDelete && (
            <Box sx={{ mt: 1.5, p: 1.25, borderRadius: '10px', bgcolor: (t) => t.custom.surface.subtle, fontSize: '0.88rem', whiteSpace: 'pre-wrap', overflowWrap: 'anywhere', maxHeight: 140, overflow: 'auto' }}>
              {toDelete.content}
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5, gap: 1 }}>
          <Button color="inherit" onClick={() => setToDelete(null)} disabled={deleting}>Keep</Button>
          <Button variant="contained" color="error" onClick={confirmDelete} disabled={deleting}
            startIcon={deleting ? <CircularProgress size={15} color="inherit" /> : <DeleteOutlineIcon />}>
            {deleting ? 'Deleting…' : 'Delete'}
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar open={Boolean(toast)} autoHideDuration={4000} onClose={() => setToast(null)} anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}>
        {toast ? <Alert onClose={() => setToast(null)} severity={toast.severity} variant="filled" sx={{ borderRadius: '10px', fontWeight: 600 }}>{toast.message}</Alert> : undefined}
      </Snackbar>
    </Box>
  );
}
