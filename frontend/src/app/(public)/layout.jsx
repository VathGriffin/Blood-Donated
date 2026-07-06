export const dynamic = 'force-dynamic';
import React from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import ChatBot from '@/components/ChatBot';
import { Box, Toolbar } from '@mui/material';

export default function PublicLayout({ children }) {
  return (
    <Box sx={{ bgcolor: 'background.default', color: 'text.primary' }}>
      <Header />
      <Toolbar sx={{ minHeight: { xs: 72, md: 80 } }} />
      <Box component="main" sx={{ minHeight: 'calc(100vh - 200px)', px: 2 }}>
        {children}
      </Box>
      <Footer />
      <ChatBot />
    </Box>
  );
}
