'use client';
import React from 'react';
import Header, { URGENT_STRIP_HEIGHT } from '@/components/Header';
import Footer from '@/components/Footer';
import ChatBotWrapper from '@/components/ChatBotWrapper';
import { Box, useTheme } from '@mui/material';

export default function PublicLayout({ children }) {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';

  return (
    <Box sx={{
      bgcolor: isDark ? '#121212' : '#f8f8f8',
      color: 'text.primary',
      minHeight: '100vh',
    }}>
      <Header />
      {/* Spacer: urgent strip + AppBar so the two fixed bars never overlap content */}
      <Box sx={{ height: { xs: 64 + URGENT_STRIP_HEIGHT, md: 68 + URGENT_STRIP_HEIGHT } }} />
      <Box component="main" sx={{ minHeight: 'calc(100vh - 200px)' }}>
        {children}
      </Box>
      <Footer />
      <ChatBotWrapper />
    </Box>
  );
}
