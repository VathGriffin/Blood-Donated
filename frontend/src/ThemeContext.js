// src/ThemeContext.js
import React, { createContext, useMemo, useState, useEffect } from 'react';
import { createTheme, ThemeProvider } from '@mui/material/styles';

export const ColorModeContext = createContext();

export const CustomThemeProvider = ({ children }) => {
    const [mode, setMode] = useState('light');

    useEffect(() => {
        const stored = localStorage.getItem('mui-theme');
        if (stored) setMode(stored);
    }, []);

    const toggleColorMode = () => {
        const next = mode === 'light' ? 'dark' : 'light';
        setMode(next);
        localStorage.setItem('mui-theme', next);
    };

    const theme = useMemo(() => createTheme({ palette: { mode } }), [mode]);

    return (
        <ColorModeContext.Provider value={{ toggleColorMode, mode }}>
            <ThemeProvider theme={theme}>
                {children}
            </ThemeProvider>
        </ColorModeContext.Provider>
    );
};
