'use client';
import { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';
import { useRouter } from 'next/navigation';

const AuthContext = createContext({
    token: null, staff: null, isAuth: false, isAdmin: false, isHospitalStaff: false, ready: false,
    login: () => {}, logout: () => {}, updateStaff: () => {},
});

export const AuthProvider = ({ children }) => {
    const [data, setData] = useState(null);
    // False until the stored session has been read: without it, "not signed in" and
    // "not loaded yet" look identical and guards redirect logged-in users to login.
    const [ready, setReady] = useState(false);
    const router = useRouter();

    useEffect(() => {
        try {
            const stored = localStorage.getItem('staffAuth');
            if (stored) setData(JSON.parse(stored));
        } catch { localStorage.removeItem('staffAuth'); }
        setReady(true);
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

    // Merge changed fields (e.g. a new photo) into the signed-in staff record without a re-login.
    const updateStaff = (fields) => {
        setData((prev) => {
            if (!prev) return prev;
            const next = { ...prev, staff: { ...prev.staff, ...fields } };
            localStorage.setItem('staffAuth', JSON.stringify(next));
            return next;
        });
    };

    const token = data?.token || null;
    const staffRole = data?.staff?.role || null;

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
                    const loginPath = staffRole === 'hospital_staff' ? '/hospital/login' : '/admin/login';
                    localStorage.removeItem('staffAuth');
                    setData(null);
                    router.replace(loginPath);
                }
                return Promise.reject(err);
            }
        );
        return () => axios.interceptors.response.eject(interceptor);
    }, [token, staffRole, router]);

    const role = staffRole;

    return (
        <AuthContext.Provider value={{
            token,
            staff: data?.staff || null,
            isAuth: !!token,
            isAdmin: role === 'admin',
            isHospitalStaff: role === 'hospital_staff',
            ready,
            login,
            logout,
            updateStaff,
        }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
