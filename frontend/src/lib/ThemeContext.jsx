'use client';
import React, { createContext, useMemo, useState, useEffect, useCallback } from 'react';
import { createTheme, ThemeProvider } from '@mui/material/styles';

export const ColorModeContext = createContext({ toggleColorMode: () => {}, mode: 'light' });

export const CustomThemeProvider = ({ children }) => {
  const [mode, setMode] = useState('light');

  useEffect(() => {
    const stored = localStorage.getItem('mui-theme');
    if (stored) setMode(stored);
  }, []);

  const toggleColorMode = useCallback(() => {
    setMode((prev) => {
      const next = prev === 'light' ? 'dark' : 'light';
      localStorage.setItem('mui-theme', next);
      return next;
    });
  }, []);

  const theme = useMemo(() => createTheme({
    palette: {
      mode,
      primary: {
        main: '#dc2626',
        light: '#ef4444',
        dark: '#b91c1c',
        contrastText: '#ffffff',
      },
      error: {
        main: '#dc2626',
      },
      background: {
        default: mode === 'dark' ? '#0a0a0a' : '#f8f8f8',
        paper: mode === 'dark' ? '#111111' : '#ffffff',
      },
      text: {
        primary: mode === 'dark' ? '#f5f5f5' : '#111111',
        secondary: mode === 'dark' ? '#888888' : '#666666',
      },
      divider: mode === 'dark' ? '#1f1f1f' : '#e5e5e5',
    },
    typography: {
      fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
      h1: { fontWeight: 800, letterSpacing: '-0.025em' },
      h2: { fontWeight: 800, letterSpacing: '-0.025em' },
      h3: { fontWeight: 700, letterSpacing: '-0.02em' },
      h4: { fontWeight: 700, letterSpacing: '-0.015em' },
      h5: { fontWeight: 700, letterSpacing: '-0.01em' },
      h6: { fontWeight: 600 },
      button: { fontWeight: 600 },
    },
    shape: { borderRadius: 12 },
    shadows: [
      'none',
      '0 1px 2px rgba(0,0,0,0.05)',
      '0 1px 3px rgba(0,0,0,0.08), 0 1px 2px rgba(0,0,0,0.04)',
      '0 4px 6px rgba(0,0,0,0.06), 0 2px 4px rgba(0,0,0,0.04)',
      '0 10px 15px rgba(0,0,0,0.08), 0 4px 6px rgba(0,0,0,0.04)',
      '0 20px 25px rgba(0,0,0,0.10), 0 8px 10px rgba(0,0,0,0.05)',
      '0 25px 50px rgba(0,0,0,0.12)',
      '0 25px 50px rgba(0,0,0,0.14)',
      '0 25px 50px rgba(0,0,0,0.16)',
      '0 25px 50px rgba(0,0,0,0.18)',
      '0 25px 50px rgba(0,0,0,0.20)',
      '0 25px 50px rgba(0,0,0,0.22)',
      '0 25px 50px rgba(0,0,0,0.24)',
      '0 25px 50px rgba(0,0,0,0.26)',
      '0 25px 50px rgba(0,0,0,0.28)',
      '0 25px 50px rgba(0,0,0,0.30)',
      '0 25px 50px rgba(0,0,0,0.32)',
      '0 25px 50px rgba(0,0,0,0.34)',
      '0 25px 50px rgba(0,0,0,0.36)',
      '0 25px 50px rgba(0,0,0,0.38)',
      '0 25px 50px rgba(0,0,0,0.40)',
      '0 25px 50px rgba(0,0,0,0.42)',
      '0 25px 50px rgba(0,0,0,0.44)',
      '0 25px 50px rgba(0,0,0,0.46)',
      '0 25px 50px rgba(0,0,0,0.48)',
    ],
    components: {
      MuiButton: {
        styleOverrides: {
          root: {
            borderRadius: 8,
            textTransform: 'none',
            fontWeight: 600,
            letterSpacing: '-0.01em',
            transition: 'all 0.2s ease',
          },
          contained: {
            boxShadow: 'none',
            '&:hover': { boxShadow: 'none' },
          },
        },
      },
      MuiPaper: {
        styleOverrides: {
          root: {
            borderRadius: 16,
            backgroundImage: 'none',
          },
        },
      },
      MuiCard: {
        styleOverrides: {
          root: {
            borderRadius: 16,
            backgroundImage: 'none',
          },
        },
      },
      MuiOutlinedInput: {
        styleOverrides: {
          root: {
            borderRadius: 10,
          },
        },
      },
      MuiChip: {
        styleOverrides: {
          root: {
            borderRadius: 8,
            fontWeight: 600,
          },
        },
      },
      MuiListItemButton: {
        styleOverrides: {
          root: {
            borderRadius: 8,
          },
        },
      },
      MuiDialog: {
        styleOverrides: {
          paper: {
            borderRadius: 20,
          },
        },
      },
    },
  }), [mode]);

  return (
    <ColorModeContext.Provider value={{ toggleColorMode, mode }}>
      <ThemeProvider theme={theme}>
        {children}
      </ThemeProvider>
    </ColorModeContext.Provider>
  );
};
