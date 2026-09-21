'use client';
import React, { useEffect, useRef, useState } from 'react';
import {
  Box, Container, Typography, Paper, TextField, IconButton,
  useTheme, Chip, Avatar,
} from '@mui/material';
import SendIcon from '@mui/icons-material/Send';
import SmartToyIcon from '@mui/icons-material/SmartToy';
import FavoriteIcon from '@mui/icons-material/Favorite';
import WifiOffIcon from '@mui/icons-material/WifiOff';
import { useUserAuth } from '@/store/UserAuthContext';
import { detectLanguage, QUICK_PROMPTS } from '@/lib/chatbot-kb';
import { askAssistant } from '@/lib/chat-client';
import ChatMessage from '@/components/ChatMessage';
import { URGENT_STRIP_HEIGHT } from '@/components/Header';

export default function AssistantPage() {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const { token } = useUserAuth();

  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [promptLang, setPromptLang] = useState('en');
  const chatPanelRef = useRef(null);
  const messagesRef = useRef(null);
  const inputRef = useRef(null);

  // On arrival, bring the chat panel into view below the fixed header. Deferred a
  // tick so it runs after Next's own scroll-to-top on route change.
  useEffect(() => {
    const t = setTimeout(() => {
      chatPanelRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 60);
    return () => clearTimeout(t);
  }, []);

  // Keep the newest message visible by scrolling only the message list — not the page.
  useEffect(() => {
    const el = messagesRef.current;
    if (el) el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' });
  }, [messages, loading]);

  const sendMessage = async (text) => {
    const content = (text ?? input).trim();
    if (!content || loading) return;

    const lang = detectLanguage(content);
    setPromptLang(lang);

    const history = [...messages, { role: 'user', content }];
    setMessages(history);
    setInput('');
    setLoading(true);

    const reply = await askAssistant({ history, content, lang, token });
    setMessages(prev => [...prev, { role: 'assistant', content: reply.content, powered: reply.powered, offline: reply.offline }]);
    setLoading(false);
    inputRef.current?.focus();
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const border = isDark ? '#1f1f1f' : '#e5e5e5';
  const card   = isDark ? '#111111' : '#ffffff';
  const bubble = isDark ? '#1a1a1a' : '#f5f5f5';

  return (
    <Box sx={{ bgcolor: isDark ? '#0a0a0a' : '#f4f4f4', minHeight: '100vh', pt: { xs: 10, md: 12 }, pb: 6 }}>
      <Container maxWidth="lg">
        <Box sx={{
          display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 3,
          height: { md: '74vh' }, minHeight: { md: 560 },
        }}>

          {/* Sidebar */}
          <Paper elevation={0} sx={{
            width: { xs: '100%', md: 300 }, flexShrink: 0, borderRadius: 3,
            border: `1px solid ${border}`, bgcolor: card, p: 3,
            display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: 2,
          }}>
            <Box sx={{
              width: 64, height: 64, borderRadius: '50%', flexShrink: 0,
              background: 'linear-gradient(135deg, #dc2626 0%, #991b1b 100%)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 8px 24px rgba(220,38,38,0.35)',
            }}>
              <SmartToyIcon sx={{ fontSize: 32, color: 'white' }} />
            </Box>
            <Box>
              <Typography fontWeight={800} fontSize="1.05rem">How can I help you today?</Typography>
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
                Ask about eligibility, blood types, appointments, or anything about donating.
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, width: '100%', mt: 1 }}>
              {QUICK_PROMPTS[promptLang].map((q) => (
                <Chip
                  key={q} label={q} clickable onClick={() => sendMessage(q)}
                  sx={{
                    justifyContent: 'flex-start', height: 'auto', py: 1, px: 1.5,
                    fontWeight: 600, fontSize: '0.78rem', borderRadius: 2,
                    bgcolor: isDark ? 'rgba(220,38,38,0.08)' : '#fff5f5',
                    color: isDark ? '#f0f0f0' : '#333333',
                    '& .MuiChip-label': { whiteSpace: 'normal', display: 'block', textAlign: 'left' },
                    '&:hover': { bgcolor: isDark ? 'rgba(220,38,38,0.16)' : '#ffe4e4' },
                    transition: 'background-color 0.15s',
                  }}
                />
              ))}
            </Box>
          </Paper>

          {/* Chat panel */}
          <Paper ref={chatPanelRef} elevation={0} sx={{
            flex: 1, borderRadius: 3, border: `1px solid ${border}`, bgcolor: card,
            display: 'flex', flexDirection: 'column', overflow: 'hidden',
            minHeight: { xs: 520, md: 'auto' },
            scrollMarginTop: { xs: `${64 + URGENT_STRIP_HEIGHT + 12}px`, md: `${68 + URGENT_STRIP_HEIGHT + 12}px` },
          }}>
            <Box sx={{ px: 3, py: 2, borderBottom: `1px solid ${border}`, display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <Avatar sx={{ bgcolor: '#dc2626', width: 34, height: 34 }}>
                <FavoriteIcon sx={{ fontSize: 16 }} />
              </Avatar>
              <Box>
                <Typography fontWeight={700} fontSize="0.9rem">BloodLife Assistant</Typography>
                <Typography variant="caption" color="text.secondary">Ask a question below to get started</Typography>
              </Box>
            </Box>

            <Box ref={messagesRef} sx={{ flex: 1, overflowY: 'auto', px: 3, py: 2.5, display: 'flex', flexDirection: 'column', gap: 2 }}>
              {messages.length === 0 && (
                <Box sx={{ m: 'auto', textAlign: 'center', color: 'text.disabled', px: 3 }}>
                  <SmartToyIcon sx={{ fontSize: 40, mb: 1, opacity: 0.5 }} />
                  <Typography fontSize="0.85rem">
                    Pick a suggestion on the left, or type your own question.
                  </Typography>
                </Box>
              )}

              {messages.map((msg, i) => {
                const isUser = msg.role === 'user';
                return (
                  <Box key={i} sx={{ display: 'flex', justifyContent: isUser ? 'flex-end' : 'flex-start', gap: 1 }}>
                    {!isUser && (
                      <Box sx={{
                        width: 28, height: 28, borderRadius: '8px', flexShrink: 0, mt: 0.2,
                        background: 'linear-gradient(135deg, #dc2626 0%, #991b1b 100%)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                      }}>
                        <SmartToyIcon sx={{ fontSize: 14, color: 'white' }} />
                      </Box>
                    )}
                    <Box sx={{ maxWidth: '78%', display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                      <Box sx={{
                        px: 1.8, py: 1.2,
                        borderRadius: isUser ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                        background: isUser ? 'linear-gradient(135deg, #dc2626 0%, #b91c1c 100%)' : bubble,
                        border: isUser ? 'none' : `1px solid ${isDark ? '#2a2a2a' : '#ebebeb'}`,
                        color: isUser ? 'white' : isDark ? 'rgba(245,245,245,0.9)' : '#222222',
                        boxShadow: isUser ? '0 2px 8px rgba(220,38,38,0.3)' : 'none',
                      }}>
                        {isUser
                          ? <Typography variant="body2" sx={{ fontSize: '0.85rem', lineHeight: 1.7, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>{msg.content}</Typography>
                          : <ChatMessage text={msg.content} />}
                      </Box>
                      {!isUser && (
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, px: 0.5 }}>
                          {msg.offline
                            ? <WifiOffIcon sx={{ fontSize: 12, color: 'text.disabled' }} />
                            : <SmartToyIcon sx={{ fontSize: 12, color: 'text.disabled' }} />}
                          <Typography variant="caption" color="text.disabled" fontSize="0.68rem">
                            {msg.offline ? 'Offline answer — AI temporarily unavailable' : 'Powered by Claude AI'}
                          </Typography>
                        </Box>
                      )}
                    </Box>
                  </Box>
                );
              })}

              {loading && (
                <Box sx={{ display: 'flex', alignItems: 'flex-end', gap: 1 }}>
                  <Box sx={{
                    width: 28, height: 28, borderRadius: '8px', flexShrink: 0,
                    background: 'linear-gradient(135deg, #dc2626 0%, #991b1b 100%)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <SmartToyIcon sx={{ fontSize: 14, color: 'white' }} />
                  </Box>
                  <Box sx={{
                    px: 2, py: 1.3, borderRadius: '16px 16px 16px 4px', bgcolor: bubble,
                    border: `1px solid ${isDark ? '#2a2a2a' : '#ebebeb'}`,
                    display: 'flex', alignItems: 'center', gap: 0.6,
                  }}>
                    {[0, 1, 2].map((i) => (
                      <Box key={i} sx={{
                        width: 7, height: 7, borderRadius: '50%', bgcolor: '#dc2626', opacity: 0.7,
                        animation: `assistantDotBounce 1.2s ease ${i * 0.2}s infinite`,
                      }} />
                    ))}
                  </Box>
                </Box>
              )}
            </Box>

            <Box sx={{
              px: 2, py: 2, borderTop: `1px solid ${border}`, display: 'flex', alignItems: 'flex-end', gap: 1.2,
              bgcolor: isDark ? '#0f0f0f' : '#fafafa',
            }}>
              <TextField
                inputRef={inputRef}
                fullWidth multiline maxRows={4} size="small"
                placeholder="Type your question…"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: 3, bgcolor: isDark ? '#1a1a1a' : '#fff' } }}
              />
              <IconButton
                onClick={() => sendMessage()}
                disabled={loading || !input.trim()}
                sx={{
                  bgcolor: '#dc2626', color: 'white', width: 44, height: 44, borderRadius: 2.5, flexShrink: 0,
                  '&:hover': { bgcolor: '#b91c1c' },
                  '&.Mui-disabled': { bgcolor: isDark ? '#2a2a2a' : '#e0e0e0', color: 'text.disabled' },
                }}
              >
                <SendIcon fontSize="small" />
              </IconButton>
            </Box>
          </Paper>
        </Box>
      </Container>

      <style>{`
        @keyframes assistantDotBounce {
          0%, 80%, 100% { transform: translateY(0); opacity: 0.4; }
          40% { transform: translateY(-5px); opacity: 1; }
        }
      `}</style>
    </Box>
  );
}
