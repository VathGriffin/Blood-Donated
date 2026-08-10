'use client';
import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext({ token: null, login: () => {}, logout: () => {}, isAuth: false });

export const AuthProvider = ({ children }) => {
    const [token, setToken] = useState(null);

    useEffect(() => {
        const stored = localStorage.getItem('adminToken');
        if (stored) setToken(stored);
    }, []);

    const login = (t) => {
        localStorage.setItem('adminToken', t);
        setToken(t);
    };

    const logout = () => {
        localStorage.removeItem('adminToken');
        setToken(null);
    };

    return (
        <AuthContext.Provider value={{ token, login, logout, isAuth: !!token }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
