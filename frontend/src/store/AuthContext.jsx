'use client';
import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';
import { useRouter } from 'next/navigation';

const AuthContext = createContext({
    token: null, staff: null, isAuth: false, isAdmin: false, isHospitalStaff: false,
    login: () => {}, logout: () => {},
});

export const AuthProvider = ({ children }) => {
    const [data, setData] = useState(null);
    const router = useRouter();

    useEffect(() => {
        const stored = localStorage.getItem('staffAuth');
        if (stored) setData(JSON.parse(stored));
    }, []);

    const login = (token, staff) => {
        const next = { token, staff };
        localStorage.setItem('staffAuth', JSON.stringify(next));
        setData(next);
    };

    const logout = () => {
        localStorage.removeItem('staffAuth');
        setData(null);
    };

    const token = data?.token || null;

    // An expired/invalid staff token otherwise fails silently: isAdmin stays true
    // (it only reflects what's cached in localStorage), so guarded pages keep
    // rendering while every API call 401s. Clear the stale session and bounce to
    // login as soon as the API actually rejects this token.
    useEffect(() => {
        if (!token) return;
        const interceptor = axios.interceptors.response.use(
            (res) => res,
            (err) => {
                if (err.response?.status === 401 && err.config?.headers?.Authorization === `Bearer ${token}`) {
                    localStorage.removeItem('staffAuth');
                    setData(null);
                    router.replace('/admin/login');
                }
                return Promise.reject(err);
            }
        );
        return () => axios.interceptors.response.eject(interceptor);
    }, [token, router]);

    const role = data?.staff?.role || null;

    return (
        <AuthContext.Provider value={{
            token,
            staff: data?.staff || null,
            isAuth: !!token,
            isAdmin: role === 'admin',
            isHospitalStaff: role === 'hospital_staff',
            login,
            logout,
        }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
