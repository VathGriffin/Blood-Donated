'use client';
import { Fragment, useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import axios from 'axios';
import {
  Alert, Avatar, Box, Button, ButtonBase, Chip, CircularProgress, Dialog, DialogActions, DialogContent, IconButton,
  InputBase, Paper, Skeleton, Snackbar, Typography,
} from '@mui/material';
import { alpha } from '@mui/material/styles';
import ForumIcon from '@mui/icons-material/Forum';
import SendIcon from '@mui/icons-material/Send';
import SearchIcon from '@mui/icons-material/Search';
import CloseIcon from '@mui/icons-material/Close';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import RefreshIcon from '@mui/icons-material/Refresh';
import PersonOutlineIcon from '@mui/icons-material/PersonOutline';
import MailOutlineIcon from '@mui/icons-material/MailOutline';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import ChatBubbleOutlineIcon from '@mui/icons-material/ChatBubbleOutline';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import API_BASE from '@/lib/config';
import { useAuth } from '@/store/AuthContext';
import { CardMenu, cardSx } from '@/components/donor/ui';
import DonorPageHero from '@/components/donor/PageHero';

const CONVO_POLL_MS = 10000; // the intervals this page has always used
const MSG_POLL_MS = 8000;
const MAX_LENGTH = 2000;     // must match MAX_MESSAGE_LENGTH in Backend/src/notification/message.routes.js
const NEAR_BOTTOM_PX = 120;

// Stable avatar colour per donor (brand red first, then muted accents that keep white text readable).
const AVATAR_COLORS = ['#B91C2C', '#7C3AED', '#2563EB', '#0F766E', '#C2410C', '#BE185D'];
const colorFor = (id = '') => AVATAR_COLORS[[...String(id)].reduce((a, c) => a + c.charCodeAt(0), 0) % AVATAR_COLORS.length];
const initial = (name) => (name || '?').trim().charAt(0).toUpperCase();

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
const listTime = (d) => (new Date(d).toDateString() === new Date().toDateString()
  ? timeLabel(d) : new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }));
const signature = (list) => list.map((m) => `${m._id}:${m.deleted ? 1 : 0}`).join('|');

const photoSrc = (photo) => (!photo ? undefined : /^https?:\/\//.test(photo) ? photo : `${API_BASE}${photo}`);

function DonorAvatar({ id, name, photo, size = 44 }) {
  return (
    <Avatar aria-hidden="true" src={photoSrc(photo)} alt="" sx={{ width: size, height: size, bgcolor: colorFor(id), color: '#fff', fontWeight: 800, fontSize: size * 0.4 }}>
      {initial(name)}
    </Avatar>
  );
}

function DonorTag() {
  return (
    <Box component="span" sx={{ px: 0.9, py: 0.15, borderRadius: '999px', fontSize: '0.7rem', fontWeight: 700, bgcolor: (t) => t.custom.tones.primary.bg, color: 'primary.main', flexShrink: 0 }}>
      Donor
    </Box>
  );
}

/**
 * Admin ↔ donor support conversations, on the messages API:
 *   GET  /api/messages/conversations                       – one row per donor, newest first, with unread counts
 *   GET  /api/messages/conversation/:userId                – the thread (opening it marks the donor's messages read)
 *   POST /api/messages/reply/:userId                       – reply (records which admin sent it)
 *   DELETE /api/messages/conversation/:userId/:messageId   – soft-delete one of YOUR OWN replies
 * Admins have no permission to delete donor messages or other admins' replies, and messages
 * can't be edited, so those actions are not offered. The server enforces all of this.
 */
export default function AdminMessagesPage() {
  const { token } = useAuth();
  const headers = useMemo(() => ({ Authorization: `Bearer ${token}` }), [token]);

  const [conversations, setConversations] = useState([]);
  const [convoStatus, setConvoStatus] = useState('loading');
  const [selected, setSelected] = useState(null); // conversation row
  const [messages, setMessages] = useState([]);
  const [msgStatus, setMsgStatus] = useState('idle');
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState('all'); // 'all' | 'unread'
  const [reply, setReply] = useState('');
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState('');
  const [toDelete, setToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState('');
  const [toast, setToast] = useState(null);
  const [showJump, setShowJump] = useState(false);

  const listRef = useRef(null);
  const inputRef = useRef(null);
  const sendingRef = useRef(false);
  const deletingRef = useRef(false);
  const sigRef = useRef('');
  const lastIdRef = useRef(null);
  const stick = useRef(true);
  const selectedIdRef = useRef(null);
  selectedIdRef.current = selected?._id || null;

  const isNearBottom = () => {
    const el = listRef.current;
    return !el || el.scrollHeight - el.scrollTop - el.clientHeight < NEAR_BOTTOM_PX;
  };

  const fetchConversations = useCallback(async (quiet = false) => {
    try {
      const { data } = await axios.get(`${API_BASE}/api/messages/conversations`, { headers });
      setConversations(Array.isArray(data) ? data : []);
      setConvoStatus('ready');
    } catch {
      if (!quiet) setConvoStatus('error');
    }
  }, [headers]);

  const fetchMessages = useCallback(async (userId, quiet = false) => {
    if (!quiet) setMsgStatus('loading');
    try {
      const { data } = await axios.get(`${API_BASE}/api/messages/conversation/${userId}`, { headers });
      if (selectedIdRef.current !== userId) return; // the admin switched conversations meanwhile
      const list = Array.isArray(data) ? data : [];
      const sig = signature(list);
      if (sig !== sigRef.current) {
        const last = list[list.length - 1]?._id || null;
        if (last !== lastIdRef.current) {
          if (!lastIdRef.current || isNearBottom()) stick.current = true; else setShowJump(true);
        }
        sigRef.current = sig;
        lastIdRef.current = last;
        setMessages(list);
      }
      setMsgStatus('ready');
      fetchConversations(true); // opening a thread marks it read — refresh the unread counts
    } catch {
      if (selectedIdRef.current === userId && !quiet) setMsgStatus('error');
    }
  }, [headers, fetchConversations]);

  // Conversation list: load, then the existing 10-second refresh (paused while the tab is hidden).
  useEffect(() => {
    fetchConversations();
    const id = setInterval(() => { if (document.visibilityState === 'visible') fetchConversations(true); }, CONVO_POLL_MS);
    return () => clearInterval(id);
  }, [fetchConversations]);

  // Open thread: the existing 8-second refresh.
  useEffect(() => {
    if (!selected) return undefined;
    const id = setInterval(() => { if (document.visibilityState === 'visible') fetchMessages(selected._id, true); }, MSG_POLL_MS);
    return () => clearInterval(id);
  }, [selected, fetchMessages]);

  useLayoutEffect(() => {
    const el = listRef.current;
    if (el && stick.current) { el.scrollTop = el.scrollHeight; stick.current = false; setShowJump(false); }
  }, [messages, msgStatus]);

  const openConversation = (c) => {
    if (selected?._id === c._id) return;
    setSelected(c);
    setMessages([]);
    sigRef.current = '';
    lastIdRef.current = null;
    stick.current = true;
    setReply('');
    setSendError('');
    setShowJump(false);
    fetchMessages(c._id);
  };

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return conversations.filter((c) =>
      (filter === 'all' || c.unread > 0) &&
      (!q || [c.userName, c.userEmail, c.lastDeleted ? '' : c.lastMessage].some((v) => v?.toLowerCase().includes(q))));
  }, [conversations, query, filter]);
  const unreadConvos = conversations.filter((c) => c.unread > 0).length;
  const totalUnread = conversations.reduce((s, c) => s + (c.unread || 0), 0);

  // ── Reply ──
  const send = async () => {
    const text = reply.trim();
    if (!selected || !text || text.length > MAX_LENGTH || sendingRef.current) return;
    sendingRef.current = true;
    setSending(true);
    setSendError('');
    const target = selected;
    try {
      const { data } = await axios.post(`${API_BASE}/api/messages/reply/${target._id}`,
        { content: text, userName: target.userName, userEmail: target.userEmail }, { headers });
      if (selectedIdRef.current === target._id) {
        setMessages((prev) => {
          const next = prev.some((m) => m._id === data._id) ? prev : [...prev, data];
          sigRef.current = signature(next);
          lastIdRef.current = data._id;
          return next;
        });
        stick.current = true;
        setReply(''); // only after the server stored it
      }
      fetchConversations(true);
    } catch (err) {
      setSendError(err.response?.data?.message || 'The reply wasn’t sent. Check your connection and try again.');
    } finally {
      sendingRef.current = false;
      setSending(false);
      inputRef.current?.focus();
    }
  };

  const onKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) { e.preventDefault(); send(); }
  };

  // ── Copy ──
  const copy = async (m) => {
    try {
      await navigator.clipboard.writeText(m.content);
      setToast({ severity: 'success', message: 'Message copied.' });
    } catch {
      setToast({ severity: 'error', message: 'Couldn’t copy — your browser blocked clipboard access.' });
    }
  };

  // ── Delete own reply (soft delete) ──
  const askDelete = (m) => { setDeleteError(''); setToDelete(m); };
  const closeDelete = () => { if (!deletingRef.current) setToDelete(null); };
  const confirmDelete = async () => {
    if (!toDelete || !selected || deletingRef.current) return; // one request at a time
    deletingRef.current = true;
    setDeleting(true);
    setDeleteError('');
    try {
      const { data } = await axios.delete(`${API_BASE}/api/messages/conversation/${selected._id}/${toDelete._id}`, { headers });
      setMessages((prev) => {
        const next = prev.map((m) => (m._id === data._id ? data : m));
        sigRef.current = signature(next);
        return next;
      });
      setToDelete(null);
      setToast({ severity: 'success', message: data.alreadyDeleted ? 'That message had already been deleted.' : 'Message deleted.' });
      fetchConversations(true); // the preview may have been this message
    } catch (err) {
      const status = err.response?.status;
      const message = err.response?.data?.message || 'Couldn’t delete the message. Please try again.';
      if (status === 403 || status === 404) {
        // Not allowed / gone: close, explain, and show the server's real state.
        setToDelete(null);
        setToast({ severity: 'warning', message });
        fetchMessages(selected._id, true);
      } else {
        setDeleteError(message); // keep the dialog open so the admin can retry
      }
    } finally {
      deletingRef.current = false;
      setDeleting(false);
    }
  };

  const tooLong = reply.trim().length > MAX_LENGTH;
  const canSend = !!selected && !!reply.trim() && !tooLong && !sending;

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: { xs: 2, md: 2.5 }, pb: 3, minWidth: 0 }}>
      <DonorPageHero id="messages-title" icon={<ForumIcon />} title="Messages"
        badge={convoStatus === 'ready' ? `${conversations.length} conversation${conversations.length !== 1 ? 's' : ''}` : null}
        subtitle={`Manage donor conversations and respond to support requests.${totalUnread ? ` ${totalUnread} unread.` : ''}`} />

      <Paper elevation={0} sx={{
        ...cardSx, overflow: 'hidden', display: 'grid',
        gridTemplateColumns: { xs: 'minmax(0, 1fr)', md: '320px minmax(0, 1fr)', lg: '380px minmax(0, 1fr)' },
        height: { xs: 'calc(100vh - 250px)', md: 'calc(100vh - 290px)' }, minHeight: 520, maxHeight: 860,
      }}>
        {/* ── Conversation list ── */}
        <Box component="nav" aria-label="Conversations" sx={{
          display: { xs: selected ? 'none' : 'flex', md: 'flex' }, flexDirection: 'column', minHeight: 0,
          borderRight: { md: '1px solid' }, borderColor: { md: 'divider' },
        }}>
          <Box sx={{ p: 2, pb: 1.5, display: 'flex', flexDirection: 'column', gap: 1.25 }}>
            <Box role="search" sx={{
              display: 'flex', alignItems: 'center', gap: 1, px: 1.5, height: 44, borderRadius: '10px', border: '1px solid', borderColor: 'divider',
              '&:focus-within': { borderColor: 'primary.main', boxShadow: (t) => `0 0 0 3px ${alpha(t.palette.primary.main, 0.14)}` },
            }}>
              <SearchIcon aria-hidden="true" sx={{ fontSize: 21, color: 'text.secondary' }} />
              <InputBase value={query} onChange={(e) => setQuery(e.target.value)} fullWidth placeholder="Search conversations..."
                inputProps={{ 'aria-label': 'Search conversations by donor name, email or message', type: 'search' }} sx={{ fontSize: '0.9rem' }} />
              {query && <IconButton size="small" aria-label="Clear search" onClick={() => setQuery('')}><CloseIcon fontSize="small" /></IconButton>}
            </Box>
            <Box role="radiogroup" aria-label="Show" sx={{ display: 'flex', gap: 1 }}>
              {[['all', `All (${conversations.length})`], ['unread', `Unread (${unreadConvos})`]].map(([v, label]) => (
                <Chip key={v} role="radio" aria-checked={filter === v} label={label} clickable onClick={() => setFilter(v)}
                  color={filter === v ? 'primary' : 'default'} variant={filter === v ? 'filled' : 'outlined'}
                  sx={{ fontWeight: 700, height: 34, ...(filter !== v && { borderColor: 'divider' }) }} />
              ))}
            </Box>
          </Box>

          <Box sx={{ flex: 1, overflowY: 'auto', px: 1, pb: 1 }}>
            {convoStatus === 'loading' ? (
              [0, 1, 2, 3].map((i) => (
                <Box key={i} sx={{ display: 'flex', gap: 1.5, p: 1.5 }} aria-hidden="true">
                  <Skeleton variant="circular" width={44} height={44} />
                  <Box sx={{ flex: 1 }}><Skeleton width="55%" /><Skeleton width="85%" /></Box>
                </Box>
              ))
            ) : convoStatus === 'error' ? (
              <Alert severity="error" sx={{ m: 1, borderRadius: '10px' }}
                action={<Button color="error" size="small" onClick={() => { setConvoStatus('loading'); fetchConversations(); }}>Retry</Button>}>
                Couldn&apos;t load conversations.
              </Alert>
            ) : filtered.length === 0 ? (
              <Box sx={{ textAlign: 'center', py: 6, px: 2, color: 'text.secondary' }}>
                <ChatBubbleOutlineIcon sx={{ fontSize: 40, opacity: 0.5 }} />
                <Typography variant="body2" sx={{ mt: 1 }}>
                  {conversations.length === 0 ? 'No donor has messaged support yet.' : 'No conversations match.'}
                </Typography>
              </Box>
            ) : filtered.map((c) => {
              const active = selected?._id === c._id;
              const preview = c.lastDeleted ? 'This message was deleted' : c.lastMessage;
              return (
                <ButtonBase key={c._id} onClick={() => openConversation(c)} aria-current={active ? 'true' : undefined}
                  aria-label={`${c.userName}${c.unread ? `, ${c.unread} unread` : ''}`}
                  sx={{
                    width: '100%', display: 'flex', alignItems: 'center', gap: 1.5, p: 1.5, mb: 0.5, borderRadius: '12px', textAlign: 'left',
                    position: 'relative', bgcolor: active ? (t) => t.custom.tones.primary.bg : 'transparent',
                    '&::before': { content: '""', position: 'absolute', left: 0, top: 10, bottom: 10, width: 3, borderRadius: 3, bgcolor: 'primary.main', opacity: active ? 1 : 0 },
                    '&:hover': { bgcolor: active ? undefined : 'action.hover' },
                    '&.Mui-focusVisible': { outline: '2px solid', outlineColor: 'primary.main', outlineOffset: -2 },
                  }}>
                  <DonorAvatar id={c._id} name={c.userName} photo={c.photo} />
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                      <Typography noWrap sx={{ fontWeight: c.unread ? 800 : 700, fontSize: '0.95rem', minWidth: 0 }}>{c.userName}</Typography>
                      <DonorTag />
                      <Typography variant="caption" color="text.secondary" sx={{ ml: 'auto', flexShrink: 0 }}>{listTime(c.lastAt)}</Typography>
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.25 }}>
                      <Typography noWrap variant="body2" sx={{ flex: 1, minWidth: 0, color: c.unread ? 'text.primary' : 'text.secondary', fontWeight: c.unread ? 600 : 400, fontStyle: c.lastDeleted ? 'italic' : 'normal' }}>
                        {c.lastSender === 'admin' && !c.lastDeleted ? 'You: ' : ''}{preview}
                      </Typography>
                      {c.unread > 0 && (
                        <Box component="span" sx={{ minWidth: 22, height: 22, px: 0.6, borderRadius: '999px', display: 'grid', placeItems: 'center', bgcolor: 'primary.main', color: '#fff', fontSize: '0.72rem', fontWeight: 800 }}>
                          {c.unread}
                        </Box>
                      )}
                    </Box>
                  </Box>
                </ButtonBase>
              );
            })}
          </Box>
        </Box>

        {/* ── Thread ── */}
        <Box component="section" aria-label={selected ? `Conversation with ${selected.userName}` : 'Conversation'}
          sx={{ display: { xs: selected ? 'flex' : 'none', md: 'flex' }, flexDirection: 'column', minHeight: 0, minWidth: 0 }}>
          {!selected ? (
            <Box sx={{ flex: 1, display: 'grid', placeItems: 'center', textAlign: 'center', p: 4, color: 'text.secondary' }}>
              <Box>
                <ForumIcon sx={{ fontSize: 52, opacity: 0.4 }} />
                <Typography sx={{ mt: 1, fontWeight: 600 }}>Select a conversation</Typography>
                <Typography variant="body2">Choose a donor on the left to read and reply.</Typography>
              </Box>
            </Box>
          ) : (
            <>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, px: { xs: 1.5, sm: 2.5 }, py: 1.75, borderBottom: '1px solid', borderColor: 'divider' }}>
                <IconButton onClick={() => setSelected(null)} aria-label="Back to conversations" sx={{ display: { md: 'none' } }}><ArrowBackIcon /></IconButton>
                <DonorAvatar id={selected._id} name={selected.userName} photo={selected.photo} size={48} />
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Typography component="h2" noWrap sx={{ fontWeight: 800, fontSize: '1.1rem' }}>{selected.userName}</Typography>
                    <DonorTag />
                  </Box>
                  <Typography variant="body2" color="text.secondary" noWrap>{selected.userEmail}</Typography>
                </Box>
                <Button component={Link} href={`/dashboard/admin/donors?q=${encodeURIComponent(selected.userEmail || '')}`} variant="outlined"
                  startIcon={<PersonOutlineIcon />} sx={{ display: { xs: 'none', sm: 'inline-flex' }, borderRadius: '10px', fontWeight: 700, borderColor: 'divider', color: 'text.primary' }}>
                  Find in Donors
                </Button>
                <CardMenu id="thread" label={`the conversation with ${selected.userName}`} items={[
                  { label: 'Refresh conversation', icon: <RefreshIcon />, onClick: () => fetchMessages(selected._id) },
                  { label: 'Find in Donors', icon: <PersonOutlineIcon />, href: `/dashboard/admin/donors?q=${encodeURIComponent(selected.userEmail || '')}` },
                  selected.userEmail && { label: 'Email donor', icon: <MailOutlineIcon />, href: `mailto:${selected.userEmail}`, external: true },
                ].filter(Boolean)} />
              </Box>

              <Box sx={{ position: 'relative', flex: 1, minHeight: 0 }}>
                <Box ref={listRef} role="log" aria-live="polite" tabIndex={0} aria-label="Messages"
                  onScroll={() => { if (isNearBottom()) setShowJump(false); }}
                  sx={{
                    height: '100%', overflowY: 'auto', px: { xs: 1.5, sm: 2.5 }, py: 2, display: 'flex', flexDirection: 'column', gap: 1.75,
                    bgcolor: (t) => (t.palette.mode === 'dark' ? t.custom.surface.subtle : '#FBFCFE'),
                    '&:focus-visible': { outline: '2px solid', outlineColor: 'primary.main', outlineOffset: -2 },
                  }}>
                  {msgStatus === 'loading' && messages.length === 0 ? (
                    [0, 1, 2].map((i) => (
                      <Box key={i} sx={{ display: 'flex', justifyContent: i === 1 ? 'flex-end' : 'flex-start' }} aria-hidden="true">
                        <Skeleton variant="rounded" width={i === 1 ? '40%' : '55%'} height={56} sx={{ borderRadius: '14px' }} />
                      </Box>
                    ))
                  ) : msgStatus === 'error' ? (
                    <Alert severity="error" variant="outlined" icon={<ErrorOutlineIcon />} sx={{ borderRadius: '12px', bgcolor: 'background.paper' }}
                      action={<Button color="error" size="small" onClick={() => fetchMessages(selected._id)}>Retry</Button>}>
                      Couldn&apos;t load this conversation.
                    </Alert>
                  ) : messages.map((m, i) => {
                    const fromAdmin = m.sender === 'admin';
                    const newDay = i === 0 || dayKey(m.createdAt) !== dayKey(messages[i - 1].createdAt);
                    const items = m.deleted ? [] : [
                      { label: 'Copy message', icon: <ContentCopyIcon />, onClick: () => copy(m) },
                      m.mine && { label: 'Delete my message', icon: <DeleteOutlineIcon />, onClick: () => askDelete(m), danger: true },
                    ].filter(Boolean);
                    return (
                      <Fragment key={m._id}>
                        {newDay && (
                          <Box role="separator" aria-label={dayLabel(m.createdAt)} sx={{ alignSelf: 'center', px: 1.5, py: 0.4, borderRadius: '8px', fontSize: '0.78rem', fontWeight: 600, color: 'text.secondary', bgcolor: (t) => alpha(t.palette.text.primary, 0.06) }}>
                            {dayLabel(m.createdAt)}
                          </Box>
                        )}
                        <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1, justifyContent: fromAdmin ? 'flex-end' : 'flex-start' }}>
                          {!fromAdmin && <DonorAvatar id={selected._id} name={selected.userName} photo={selected.photo} size={38} />}
                          <Box sx={{ maxWidth: { xs: '80%', sm: '70%' }, minWidth: 0, order: fromAdmin ? 1 : 0 }}>
                            <Box sx={{
                              px: 1.75, py: 1.25, borderRadius: fromAdmin ? '16px 4px 16px 16px' : '4px 16px 16px 16px',
                              bgcolor: fromAdmin ? (t) => t.custom.tones.primary.bg : 'background.paper',
                              border: '1px solid', borderColor: fromAdmin ? 'transparent' : 'divider', boxShadow: (t) => t.custom.shadow.xs,
                            }}>
                              {m.deleted ? (
                                <Typography variant="body2" sx={{ fontStyle: 'italic', color: 'text.secondary' }}>This message was deleted</Typography>
                              ) : (
                                <Typography variant="body2" sx={{ fontSize: '0.92rem', lineHeight: 1.6, whiteSpace: 'pre-wrap', overflowWrap: 'anywhere' }}>{m.content}</Typography>
                              )}
                            </Box>
                            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.4, px: 0.5, textAlign: fromAdmin ? 'right' : 'left' }}>
                              <time dateTime={m.createdAt}>{timeLabel(m.createdAt)}</time>
                              {fromAdmin && !m.mine && !m.deleted && ' · another admin'}
                            </Typography>
                          </Box>
                          {items.length > 0 && (
                            <Box sx={{ order: fromAdmin ? 0 : 1, mt: 0.25 }}>
                              <CardMenu id={`msg-${m._id}`} label={`this message from ${fromAdmin ? 'support' : selected.userName}`} items={items} />
                            </Box>
                          )}
                        </Box>
                      </Fragment>
                    );
                  })}
                  {msgStatus === 'ready' && messages.length === 0 && (
                    <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', mt: 4 }}>No messages in this conversation.</Typography>
                  )}
                </Box>
                {showJump && (
                  <Button onClick={() => { const el = listRef.current; if (el) el.scrollTop = el.scrollHeight; setShowJump(false); }}
                    variant="contained" size="small" endIcon={<KeyboardArrowDownIcon />}
                    sx={{ position: 'absolute', bottom: 12, left: '50%', transform: 'translateX(-50%)', borderRadius: '999px' }}>
                    New messages
                  </Button>
                )}
              </Box>

              <Box component="form" onSubmit={(e) => { e.preventDefault(); send(); }}
                sx={{ borderTop: '1px solid', borderColor: 'divider', px: { xs: 1.5, sm: 2.5 }, py: 1.5 }}>
                {sendError && (
                  <Alert severity="error" sx={{ mb: 1.25, borderRadius: '10px', alignItems: 'center' }}
                    action={<Button color="error" size="small" onClick={send} disabled={!canSend}>Retry</Button>}>
                    {sendError}
                  </Alert>
                )}
                <Box sx={{ display: 'flex', alignItems: 'flex-end', gap: 1.25 }}>
                  <Box sx={{
                    flex: 1, minWidth: 0, display: 'flex', alignItems: 'center', px: 1.75, py: 1, borderRadius: '14px',
                    border: '1px solid', borderColor: tooLong ? 'error.main' : 'divider',
                    '&:focus-within': { borderColor: tooLong ? 'error.main' : 'primary.main', boxShadow: (t) => `0 0 0 3px ${alpha(t.palette.primary.main, 0.14)}` },
                  }}>
                    <InputBase inputRef={inputRef} value={reply} onChange={(e) => { setReply(e.target.value); if (sendError) setSendError(''); }}
                      onKeyDown={onKeyDown} placeholder="Type a reply... (Press Enter to send)" multiline maxRows={5} fullWidth
                      inputProps={{ 'aria-label': `Reply to ${selected.userName}`, maxLength: MAX_LENGTH + 200 }} sx={{ fontSize: '0.95rem' }} />
                  </Box>
                  <IconButton type="submit" disabled={!canSend} aria-label={sending ? 'Sending reply' : 'Send reply'}
                    sx={{
                      width: 52, height: 52, flexShrink: 0, bgcolor: 'primary.main', color: '#fff',
                      '&:hover': { bgcolor: 'primary.dark' },
                      '&.Mui-disabled': { bgcolor: (t) => alpha(t.palette.primary.main, 0.3), color: '#fff' },
                      '&.Mui-focusVisible': { outline: '2px solid', outlineColor: 'primary.main', outlineOffset: 2 },
                    }}>
                    {sending ? <CircularProgress size={20} color="inherit" /> : <SendIcon />}
                  </IconButton>
                </Box>
                {reply.length > MAX_LENGTH - 300 && (
                  <Typography variant="caption" sx={{ display: 'block', textAlign: 'right', mt: 0.5, color: tooLong ? 'error.main' : 'text.secondary' }}>
                    {reply.trim().length}/{MAX_LENGTH}
                  </Typography>
                )}
              </Box>
            </>
          )}
        </Box>
      </Paper>

      {/* Delete confirmation */}
      <Dialog open={Boolean(toDelete)} onClose={closeDelete} maxWidth="xs" fullWidth aria-labelledby="del-title" aria-describedby="del-text"
        slotProps={{ paper: { sx: { borderRadius: '18px' } } }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25, px: 3, pt: 2.5 }}>
          <DeleteOutlineIcon aria-hidden="true" sx={{ color: 'error.main' }} />
          <Typography id="del-title" component="h2" sx={{ fontWeight: 800, fontSize: '1.1rem', flex: 1 }}>Delete Message</Typography>
          <IconButton onClick={closeDelete} disabled={deleting} aria-label="Close"><CloseIcon /></IconButton>
        </Box>
        <DialogContent sx={{ pt: 1 }}>
          <Typography id="del-text" variant="body2" color="text.secondary">
            Are you sure you want to delete this message? The donor will see “This message was deleted” instead.
          </Typography>
          {toDelete && (
            <Box sx={{ mt: 1.5, p: 1.5, borderRadius: '12px', bgcolor: (t) => t.custom.surface.subtle }}>
              <Typography sx={{ fontSize: '0.92rem', whiteSpace: 'pre-wrap', overflowWrap: 'anywhere', maxHeight: 140, overflow: 'auto' }}>
                “{toDelete.content}”
              </Typography>
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.75 }}>
                Sent by you · {new Date(toDelete.createdAt).toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' })}
              </Typography>
            </Box>
          )}
          {deleteError && <Alert severity="error" sx={{ mt: 1.5, borderRadius: '10px' }}>{deleteError}</Alert>}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5, gap: 1 }}>
          <Button onClick={closeDelete} disabled={deleting} variant="outlined" color="inherit" fullWidth sx={{ borderColor: 'divider', height: 44 }}>Cancel</Button>
          <Button onClick={confirmDelete} disabled={deleting} variant="contained" color="primary" fullWidth sx={{ height: 44 }}
            startIcon={deleting ? <CircularProgress size={15} color="inherit" /> : null}>
            {deleting ? 'Deleting…' : 'Delete Message'}
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar open={Boolean(toast)} autoHideDuration={4000} onClose={() => setToast(null)} anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}>
        {toast ? <Alert onClose={() => setToast(null)} severity={toast.severity} variant="filled" sx={{ borderRadius: '10px', fontWeight: 600 }}>{toast.message}</Alert> : undefined}
      </Snackbar>
    </Box>
  );
}
