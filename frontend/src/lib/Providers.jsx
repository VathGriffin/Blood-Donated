'use client';
import CssBaseline from '@mui/material/CssBaseline';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { CustomThemeProvider } from '@/lib/ThemeContext';
import { AuthProvider } from '@/store/AuthContext';
import { UserAuthProvider } from '@/store/UserAuthContext';
import { I18nProvider } from '@/i18n/I18nProvider';

export default function Providers({ initialMode, initialLang, children }) {
  return (
    <GoogleOAuthProvider clientId={process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || ''}>
      <CustomThemeProvider initialMode={initialMode}>
        <CssBaseline />
        <I18nProvider initialLang={initialLang}>
          <AuthProvider>
            <UserAuthProvider>
              {children}
            </UserAuthProvider>
          </AuthProvider>
        </I18nProvider>
      </CustomThemeProvider>
    </GoogleOAuthProvider>
  );
}
