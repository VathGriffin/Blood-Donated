'use client';
import React, { createContext, useContext, useState } from 'react';

const UserAuthContext = createContext({ token: null, user: null, isAuth: false, login: () => {}, logout: () => {} });

export const UserAuthProvider = ({ children }) => {
    const [userData, setUserData] = useState(() => {
        if (typeof window === 'undefined') return null;
        const stored = localStorage.getItem('userAuth');
        return stored ? JSON.parse(stored) : null;
    });

    const login = (token, user) => {
        const data = { token, ...user };
        localStorage.setItem('userAuth', JSON.stringify(data));
        setUserData(data);
    };

    const logout = () => {
        localStorage.removeItem('userAuth');
        setUserData(null);
    };

    return (
        <UserAuthContext.Provider value={{
            token: userData?.token || null,
            user: userData ? { id: userData.id, fullName: userData.fullName, email: userData.email } : null,
            isAuth: !!userData?.token,
            login,
            logout,
        }}>
            {children}
        </UserAuthContext.Provider>
    );
};

export const useUserAuth = () => useContext(UserAuthContext);
