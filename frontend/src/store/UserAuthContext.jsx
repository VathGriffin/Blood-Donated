'use client';
import React, { createContext, useContext, useState } from 'react';

const UserAuthContext = createContext({
  token: null, user: null, isAuth: false,
  login: () => {}, logout: () => {}, updateUser: () => {},
});

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

  const updateUser = (updatedFields) => {
    setUserData(prev => {
      if (!prev) return prev;
      const next = { ...prev, ...updatedFields };
      localStorage.setItem('userAuth', JSON.stringify(next));
      return next;
    });
  };

  return (
    <UserAuthContext.Provider value={{
      token: userData?.token || null,
      user: userData ? {
        id:       userData.id,
        fullName: userData.fullName,
        email:    userData.email,
        photo:    userData.photo || null,
        phone:    userData.phone || '',
      } : null,
      isAuth: !!userData?.token,
      login,
      logout,
      updateUser,
    }}>
      {children}
    </UserAuthContext.Provider>
  );
};

export const useUserAuth = () => useContext(UserAuthContext);
