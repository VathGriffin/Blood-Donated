'use client';
import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import {
  Avatar, Box, Button, Chip, CircularProgress, IconButton, InputBase, Paper, Snackbar, Tooltip, Typography,
} from '@mui/material';
import { alpha } from '@mui/material/styles';
import SendRoundedIcon from '@mui/icons-material/SendRounded';
import ContentCopyRoundedIcon from '@mui/icons-material/ContentCopyRounded';
import RefreshRoundedIcon from '@mui/icons-material/RefreshRounded';
import WifiOffRoundedIcon from '@mui/icons-material/WifiOffRounded';
import AutoAwesomeRoundedIcon from '@mui/icons-material/AutoAwesomeRounded';
import MenuBookRoundedIcon from '@mui/icons-material/MenuBookRounded';
import KeyboardArrowDownRoundedIcon from '@mui/icons-material/KeyboardArrowDownRounded';
import CheckRoundedIcon from '@mui/icons-material/CheckRounded';
import CalendarMonthOutlinedIcon from '@mui/icons-material/CalendarMonthOutlined';
import LocalHospitalOutlinedIcon from '@mui/icons-material/LocalHospitalOutlined';
import WaterDropOutlinedIcon from '@mui/icons-material/WaterDropOutlined';
import { useI18n } from '@/i18n/I18nProvider';
import { currentIntlLocale } from '@/i18n/config';
import ChatMessage from '@/components/chat/ChatMessage';
import EligibilityCard from './EligibilityCard';
import { BotAvatar } from './BotArt';
import { panelSx } from './SidePanels';

const MAX_LENGTH = 1000; // the API allows longer; a chat question rarely needs more
const NEAR_BOTTOM_PX = 140;

// Keys of aiChat.actions; `eligibility` is answered from the donor's record.
export const QUICK_ACTIONS = [
  { key: 'eligibility', icon: <CheckRoundedIcon /> },
  { key: 'book', icon: <CalendarMonthOutlinedIcon /> },
  { key: 'hospital', icon: <LocalHospitalOutlinedIcon /> },
  { key: 'process', icon: <WaterDropOutlinedIcon /> },
];

const clock = (date) => date.toLocaleTimeString(currentIntlLocale(), { hour: 'numeric', minute: '2-digit' });

function Meta({ name, at, align = 'left' }) {
  return (
    <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 1, mb: 0.5, justifyContent: align === 'right' ? 'flex-end' : 'flex-start' }}>
      {name && <Typography component="span" sx={{ fontWeight: 800, fontSize: '0.88rem' }}>{name}</Typography>}
      <Typography component="time" dateTime={at.toISOString()} sx={{ fontSize: '0.75rem', color: 'text.secondary' }}>{clock(at)}</Typography>
    </Box>
  );
}

const bubbleSx = (theme) => ({
  px: 2, py: 1.5, borderRadius: '4px 16px 16px 16px', maxWidth: '100%', overflowWrap: 'anywhere',
  bgcolor: theme.palette.mode === 'dark' ? alpha('#fff', 0.05) : '#F2F5FA',
  border: '1px solid', borderColor: theme.palette.mode === 'dark' ? alpha('#fff', 0.08) : '#E6EBF2',
  color: 'text.primary',
});

/**
 * The conversation card: messages with timestamps, a typing indicator, quick actions and the
 * composer (Enter sends, Shift+Enter adds a line). Sending is blocked while a reply is pending.
 */
export default function ChatPanel({ messages, sending, onSend, onRetry, onAction, user }) {
  const { t } = useI18n();
  const [draft, setDraft] = useState('');
  const [showJump, setShowJump] = useState(false);
  const [toast, setToast] = useState('');
  const [copiedId, setCopiedId] = useState(null);
  const [openedAt] = useState(() => new Date());
  const listRef = useRef(null);
  const inputRef = useRef(null);
  const stick = useRef(true); // follow new messages while the reader is at the bottom

  const nearBottom = () => {
    const el = listRef.current;
    return !el || el.scrollHeight - el.scrollTop - el.clientHeight < NEAR_BOTTOM_PX;
  };
  const toBottom = (smooth = true) => {
    const el = listRef.current;
    if (!el) return;
    const reduce = typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    el.scrollTo({ top: el.scrollHeight, behavior: smooth && !reduce ? 'smooth' : 'auto' });
  };

  // Follow the conversation only when the reader hasn't scrolled up to read something earlier;
  // the donor's own new message always brings the view down.
  const last = messages[messages.length - 1];
  useLayoutEffect(() => {
    if (!last) return;
    if (last.role === 'user' || stick.current) { toBottom(); setShowJump(false); } else setShowJump(true);
  }, [last, sending]);

  useEffect(() => { if (!sending) inputRef.current?.focus({ preventScroll: true }); }, [sending]);

  const submit = async () => {
    const text = draft.trim();
    if (!text || sending || text.length > MAX_LENGTH) return;
    setDraft('');
    stick.current = true;
    const ok = await onSend(text);
    if (ok === false) setDraft(text);
  };

  const onKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) {
      e.preventDefault();
      submit();
    }
  };

  const copy = async (m) => {
    try {
      await navigator.clipboard.writeText(m.content);
      setCopiedId(m.id);
      setTimeout(() => setCopiedId((id) => (id === m.id ? null : id)), 1500);
    } catch {
      setToast(t('aiChat.copyFailed'));
    }
  };

  const firstName = user?.name?.trim().split(/\s+/)[0];
  const tooLong = draft.trim().length > MAX_LENGTH;
  const canSend = !!draft.trim() && !sending && !tooLong;

  return (
    <Paper component="section" aria-label={t('aiChat.conversation')} elevation={0}
      sx={(theme) => ({ ...panelSx(theme), p: 0, display: 'flex', flexDirection: 'column', minHeight: { xs: 560, lg: 0 }, height: { lg: '100%' }, overflow: 'hidden' })}>
      <Box sx={{ position: 'relative', flex: 1, minHeight: 0 }}>
        <Box ref={listRef} role="log" aria-live="polite" aria-relevant="additions" tabIndex={0}
          onScroll={() => { stick.current = nearBottom(); if (stick.current) setShowJump(false); }}
          sx={{
            position: { lg: 'absolute' }, inset: 0, maxHeight: { xs: 560, lg: 'none' }, overflowY: 'auto',
            px: { xs: 1.75, sm: 3 }, py: { xs: 2, sm: 2.75 }, display: 'flex', flexDirection: 'column', gap: 2.25,
            '&:focus-visible': { outline: 'none', boxShadow: (theme) => `inset 0 0 0 2px ${theme.palette.primary.main}` },
          }}>
          {/* Greeting: written by the page, not the AI. */}
          <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'flex-start' }}>
            <BotAvatar />
            <Box sx={{ minWidth: 0, maxWidth: { xs: '86%', md: '75%' } }}>
              <Meta name="BloodLife AI" at={openedAt} />
              <Box sx={bubbleSx}>
                <Typography sx={{ fontSize: '0.92rem', lineHeight: 1.65 }}>
                  👋 {firstName ? t('aiChat.greeting', { name: firstName }) : t('aiChat.greetingNoName')}<br />{t('aiChat.intro')}
                </Typography>
              </Box>
            </Box>
          </Box>

          {messages.map((m) => (m.role === 'user' ? (
            <Box key={m.id} sx={{ display: 'flex', gap: 1.5, alignItems: 'flex-start', justifyContent: 'flex-end' }}>
              <Box sx={{ minWidth: 0, maxWidth: { xs: '82%', md: '70%' }, display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                <Meta at={m.at} align="right" />
                <Box sx={{
                  px: 2, py: 1.25, borderRadius: '16px 4px 16px 16px', bgcolor: '#C8102E', color: '#fff',
                  boxShadow: '0 6px 16px rgba(200,16,46,0.25)', whiteSpace: 'pre-wrap', overflowWrap: 'anywhere', fontSize: '0.92rem', lineHeight: 1.6,
                }}>
                  {m.content}
                </Box>
              </Box>
              <Avatar src={user?.photo} alt="" sx={{ width: 40, height: 40, bgcolor: 'grey.300', color: 'grey.800', fontWeight: 700, fontSize: '0.9rem' }}>
                {user?.initials}
              </Avatar>
            </Box>
          ) : (
            <Box key={m.id} sx={{ display: 'flex', gap: 1.5, alignItems: 'flex-start' }}>
              <BotAvatar />
              <Box sx={{ minWidth: 0, maxWidth: { xs: '86%', md: '78%' } }}>
                <Meta name="BloodLife AI" at={m.at} />
                <Box sx={bubbleSx}>
                  {m.kind === 'eligibility'
                    ? <EligibilityCard record={m.record} />
                    : <ChatMessage text={m.content} fontSize="0.92rem" lineHeight={1.65} />}
                </Box>
                {!m.kind && (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.5, flexWrap: 'wrap' }}>
                    <Tooltip title={copiedId === m.id ? t('aiChat.copied') : t('aiChat.copy')}>
                      <IconButton size="small" onClick={() => copy(m)} aria-label={t('aiChat.copy')} sx={{ color: 'text.secondary' }}>
                        {copiedId === m.id ? <CheckRoundedIcon sx={{ fontSize: 17 }} /> : <ContentCopyRoundedIcon sx={{ fontSize: 17 }} />}
                      </IconButton>
                    </Tooltip>
                    <Typography component="span" sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.5, fontSize: '0.72rem', color: 'text.secondary' }}>
                      {m.failed ? <WifiOffRoundedIcon sx={{ fontSize: 14 }} /> : m.offline ? <MenuBookRoundedIcon sx={{ fontSize: 14 }} /> : <AutoAwesomeRoundedIcon sx={{ fontSize: 14 }} />}
                      {t(m.failed ? 'aiChat.offlineNote' : m.offline ? 'aiChat.guideNote' : 'aiChat.aiNote')}
                    </Typography>
                    {m.failed && (
                      <Button size="small" color="error" startIcon={<RefreshRoundedIcon />} onClick={() => onRetry(m.id)} disabled={sending}
                        sx={{ fontWeight: 700, ml: 0.5 }}>
                        {t('aiChat.retry')}
                      </Button>
                    )}
                  </Box>
                )}
              </Box>
            </Box>
          )))}

          {sending && last?.kind !== 'eligibility' && (
            <Box role="status" sx={{ display: 'flex', gap: 1.5, alignItems: 'center' }}>
              <BotAvatar />
              <Box sx={(theme) => ({ ...bubbleSx(theme), display: 'flex', alignItems: 'center', gap: 0.6, py: 1.5 })}>
                <Box component="span" sx={{ position: 'absolute', width: 1, height: 1, overflow: 'hidden', clip: 'rect(0 0 0 0)' }}>{t('aiChat.typing')}</Box>
                {[0, 1, 2].map((i) => (
                  <Box key={i} aria-hidden="true" sx={{
                    width: 7, height: 7, borderRadius: '50%', bgcolor: 'primary.main', opacity: 0.5,
                    '@media (prefers-reduced-motion: no-preference)': { animation: `aiDot 1.2s ease ${i * 0.18}s infinite` },
                    '@keyframes aiDot': { '0%, 80%, 100%': { transform: 'translateY(0)', opacity: 0.35 }, '40%': { transform: 'translateY(-4px)', opacity: 1 } },
                  }} />
                ))}
              </Box>
            </Box>
          )}
        </Box>

        {showJump && (
          <Button variant="contained" size="small" onClick={() => { stick.current = true; toBottom(); setShowJump(false); }}
            endIcon={<KeyboardArrowDownRoundedIcon />}
            sx={{ position: 'absolute', bottom: 12, left: '50%', transform: 'translateX(-50%)', borderRadius: 999, fontWeight: 700, boxShadow: 3 }}>
            {t('aiChat.newMessages')}
          </Button>
        )}
      </Box>

      {/* Quick actions */}
      <Box role="group" aria-label={t('aiChat.actionsLabel')} sx={{
        display: 'flex', gap: 1, px: { xs: 1.75, sm: 3 }, pt: 1.5, pb: 0.25,
        // One row; on narrow screens it scrolls sideways instead of wrapping.
        flexWrap: 'nowrap', overflowX: 'auto', scrollbarWidth: 'none', '&::-webkit-scrollbar': { display: 'none' },
        '& > *': { flexShrink: 0 },
      }}>
        {QUICK_ACTIONS.map((a, i) => (
          <Chip key={a.key} icon={a.icon} label={t(`aiChat.actions.${a.key}`)} clickable disabled={sending} onClick={() => onAction(a.key)}
            variant="outlined"
            sx={(theme) => ({
              height: 36, borderRadius: 999, fontWeight: 600, fontSize: '0.83rem', px: 0.25,
              borderColor: i === 0 ? alpha(theme.palette.primary.main, 0.45) : 'divider',
              color: i === 0 ? 'primary.main' : 'text.primary',
              bgcolor: i === 0 ? alpha(theme.palette.primary.main, 0.06) : 'background.paper',
              '& .MuiChip-icon': { color: 'primary.main', fontSize: 18 },
              '&:hover': { borderColor: alpha(theme.palette.primary.main, 0.45) },
            })} />
        ))}
      </Box>

      {/* Composer */}
      <Box component="form" onSubmit={(e) => { e.preventDefault(); submit(); }} sx={{ px: { xs: 1.75, sm: 3 }, pt: 1.5, pb: { xs: 1.75, sm: 2.5 } }}>
        <Box sx={(theme) => ({
          display: 'flex', alignItems: 'flex-end', gap: 1, pl: 2, pr: 0.75, py: 0.75, borderRadius: '16px',
          border: '1px solid', borderColor: tooLong ? 'error.main' : 'divider', bgcolor: 'background.paper',
          transition: 'border-color .15s, box-shadow .15s',
          '&:focus-within': { borderColor: 'primary.main', boxShadow: `0 0 0 3px ${alpha(theme.palette.primary.main, 0.12)}` },
        })}>
          <InputBase inputRef={inputRef} value={draft} onChange={(e) => setDraft(e.target.value)} onKeyDown={onKeyDown}
            multiline maxRows={5} fullWidth placeholder={t('aiChat.placeholder')}
            inputProps={{ 'aria-label': t('aiChat.inputLabel'), 'aria-describedby': 'ai-composer-hint', maxLength: MAX_LENGTH + 200 }}
            sx={{ py: 0.75, fontSize: '0.95rem' }} />
          <IconButton type="submit" disabled={!canSend} aria-label={sending ? t('aiChat.sending') : t('aiChat.send')}
            sx={{
              width: 44, height: 44, borderRadius: '12px', bgcolor: '#C8102E', color: '#fff', flexShrink: 0,
              boxShadow: '0 6px 14px rgba(200,16,46,0.3)',
              '&:hover': { bgcolor: '#A50D26' },
              '&.Mui-disabled': { bgcolor: 'action.disabledBackground', color: 'action.disabled', boxShadow: 'none' },
            }}>
            {sending ? <CircularProgress size={18} color="inherit" /> : <SendRoundedIcon sx={{ fontSize: 20, transform: 'rotate(-25deg)' }} />}
          </IconButton>
        </Box>
        <Typography id="ai-composer-hint" variant="caption" sx={{ display: 'flex', justifyContent: 'space-between', mt: 0.75, px: 0.5, color: tooLong ? 'error.main' : 'text.secondary' }}>
          <span>{t('aiChat.hint')}</span>
          {draft.length > MAX_LENGTH - 200 && <span>{draft.trim().length}/{MAX_LENGTH}</span>}
        </Typography>
      </Box>

      <Snackbar open={!!toast} autoHideDuration={4000} onClose={() => setToast('')} message={toast} anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }} />
    </Paper>
  );
}
