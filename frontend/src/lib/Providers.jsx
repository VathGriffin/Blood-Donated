'use client';
import React from 'react';
import CssBaseline from '@mui/material/CssBaseline';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { CustomThemeProvider } from '@/lib/ThemeContext';
import { AuthProvider } from '@/store/AuthContext';
import { UserAuthProvider } from '@/store/UserAuthContext';

export default function Providers({ children }) {
  return (
    <GoogleOAuthProvider clientId={process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || ''}>
      <CustomThemeProvider>
        <CssBaseline />
        <AuthProvider>
          <UserAuthProvider>
            {children}
          </UserAuthProvider>
        </AuthProvider>
      </CustomThemeProvider>
    </GoogleOAuthProvider>
  );
}
