'use client';
import React, { createContext, useContext, useState } from 'react';

const AuthContext = createContext({ token: null, login: () => {}, logout: () => {}, isAuth: false });

export const AuthProvider = ({ children }) => {
    const [token, setToken] = useState(() =>
        typeof window !== 'undefined' ? localStorage.getItem('adminToken') : null
    );

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
