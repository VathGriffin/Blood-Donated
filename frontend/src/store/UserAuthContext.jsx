'use client';
import { createContext, useContext, useState, useEffect, useRef } from 'react';
import axios from 'axios';

const KEY = 'userAuth';
// "Remember me" keeps the session in localStorage (survives closing the browser); without it
// the session lives in sessionStorage and ends with the tab. Only one of the two holds it.
const clearStored = () => { localStorage.removeItem(KEY); sessionStorage.removeItem(KEY); };

const UserAuthContext = createContext({
  token: null, user: null, isAuth: false, ready: false,
  login: () => {}, logout: () => {}, updateUser: () => {},
});

export const UserAuthProvider = ({ children }) => {
  const [userData, setUserData] = useState(null);
  // False until the stored session has been read (see AuthContext).
  const [ready, setReady] = useState(false);
  const tokenRef = useRef(null);
  tokenRef.current = userData?.token || null;

  useEffect(() => {
    try {
      const stored = sessionStorage.getItem(KEY) || localStorage.getItem(KEY);
      if (stored) setUserData(JSON.parse(stored));
    } catch { clearStored(); }
    setReady(true);
  }, []);

  // An expired/invalid donor token otherwise fails silently: isAuth stays true
  // (it only reflects what's cached in localStorage), so pages keep polling with a
  // dead token and every call 401s. Clear the stale session as soon as the API
  // rejects the token we're currently using. Registered once and reading the token
  // from a ref, so it's already in place for the first request after the stored
  // session loads.
  useEffect(() => {
    const interceptor = axios.interceptors.response.use(
      (res) => res,
      (err) => {
        const current = tokenRef.current;
        if (current && err.response?.status === 401 && err.config?.headers?.Authorization === `Bearer ${current}`) {
          clearStored();
          setUserData(null);
        }
        return Promise.reject(err);
      }
    );
    return () => axios.interceptors.response.eject(interceptor);
  }, []);

  const login = (token, user, { remember = true } = {}) => {
    const data = { token, ...user };
    clearStored();
    (remember ? localStorage : sessionStorage).setItem(KEY, JSON.stringify(data));
    setUserData(data);
  };

  const logout = () => {
    clearStored();
    setUserData(null);
  };

  const updateUser = (updatedFields) => {
    setUserData(prev => {
      if (!prev) return prev;
      const next = { ...prev, ...updatedFields };
      (sessionStorage.getItem(KEY) ? sessionStorage : localStorage).setItem(KEY, JSON.stringify(next));
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
      ready,
      login,
      logout,
      updateUser,
    }}>
      {children}
    </UserAuthContext.Provider>
  );
};

export const useUserAuth = () => useContext(UserAuthContext);
