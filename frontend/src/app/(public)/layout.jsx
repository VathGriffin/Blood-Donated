'use client';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import ChatBotWrapper from '@/components/chat/ChatBotWrapper';
import CookieConsent from '@/components/layout/CookieConsent';
import { Box, useTheme } from '@mui/material';

export default function PublicLayout({ children }) {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';

  return (
    <Box sx={{
      bgcolor: isDark ? '#0B1220' : '#F6F8FC',
      color: 'text.primary',
      minHeight: '100vh',
    }}>
      <Header />
      {/* Spacer the height of the fixed header, so it never covers the page */}
      <Box sx={{ height: { xs: 64, md: 68 } }} />
      <Box component="main" sx={{ minHeight: 'calc(100vh - 200px)' }}>
        {children}
      </Box>
      <Footer />
      <ChatBotWrapper />
      <CookieConsent />
    </Box>
  );
}
