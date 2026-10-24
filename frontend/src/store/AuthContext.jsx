'use client';
import { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';
import { usePathname, useRouter } from 'next/navigation';

// Admins and hospital staff each get their own slot, so signing in as one role (say,
// admin in another tab) never replaces the other's session. Which slot a page uses
// is decided by its URL — see areaFor().
const ROLES = ['admin', 'hospital_staff'];
const keyFor = (role) => `staffAuth:${role}`;
const LEGACY_KEY = 'staffAuth'; // the old single shared slot

const areaFor = (pathname = '') => {
    if (/^\/(dashboard\/)?hospital(\/|$)/.test(pathname)) return 'hospital_staff';
    if (/^\/(dashboard\/)?admin(\/|$)/.test(pathname)) return 'admin';
    return null;
};

// "Remember me" keeps a session in localStorage (survives restarts); otherwise it lives
// in sessionStorage and ends when the tab closes. The tab's own sessionStorage wins.
const readSlot = (role) => {
    for (const store of [sessionStorage, localStorage]) {
        try {
            const raw = store.getItem(keyFor(role));
            if (raw) return { data: JSON.parse(raw), persist: store === localStorage };
        } catch { store.removeItem(keyFor(role)); }
    }
    return null;
};

const readAll = () => {
    // Move a session saved under the old shared key into its role's slot.
    for (const store of [sessionStorage, localStorage]) {
        try {
            const raw = store.getItem(LEGACY_KEY);
            if (raw) {
                const role = JSON.parse(raw)?.staff?.role;
                if (ROLES.includes(role) && !store.getItem(keyFor(role))) store.setItem(keyFor(role), raw);
            }
        } catch { /* ignore a corrupt legacy entry */ }
        store.removeItem(LEGACY_KEY);
    }
    const out = {};
    for (const role of ROLES) {
        const slot = readSlot(role);
        if (slot) out[role] = slot;
    }
    return out;
};

const clearSlot = (role) => {
    localStorage.removeItem(keyFor(role));
    sessionStorage.removeItem(keyFor(role));
};

const writeSlot = (role, data, persist) => {
    clearSlot(role);
    (persist ? localStorage : sessionStorage).setItem(keyFor(role), JSON.stringify(data));
};

const AuthContext = createContext({
    token: null, staff: null, isAuth: false, isAdmin: false, isHospitalStaff: false, ready: false,
    login: () => {}, logout: () => {}, updateStaff: () => {},
});

export const AuthProvider = ({ children }) => {
    // { admin?: { data, persist }, hospital_staff?: { data, persist } }
    const [sessions, setSessions] = useState({});
    const [lastRole, setLastRole] = useState(null);
    // False until the stored session has been read: without it, "not signed in" and
    // "not loaded yet" look identical and guards redirect logged-in users to login.
    const [ready, setReady] = useState(false);
    const router = useRouter();
    const pathname = usePathname();

    useEffect(() => {
        setSessions(readAll());
        setReady(true);
    }, []);

    // Admin pages use the admin session, hospital pages the hospital one. Anywhere
    // else, fall back to the most recent sign-in (or whichever one exists).
    const area = areaFor(pathname);
    const activeRole = area || (lastRole && sessions[lastRole] ? lastRole : ROLES.find((r) => sessions[r]) || null);
    const data = (activeRole && sessions[activeRole]?.data) || null;

    const login = (token, staff, { remember = true } = {}) => {
        const role = staff?.role;
        if (!ROLES.includes(role)) return;
        const next = { token, staff };
        writeSlot(role, next, remember);
        setSessions((prev) => ({ ...prev, [role]: { data: next, persist: remember } }));
        setLastRole(role);
    };

    const dropSession = (role) => {
        if (!role) return;
        clearSlot(role);
        setSessions((prev) => {
            const next = { ...prev };
            delete next[role];
            return next;
        });
    };

    const logout = () => dropSession(activeRole);

    // Merge changed fields (e.g. a new photo) into the signed-in staff record without a re-login.
    const updateStaff = (fields) => {
        if (!activeRole) return;
        setSessions((prev) => {
            const cur = prev[activeRole];
            if (!cur) return prev;
            const nextData = { ...cur.data, staff: { ...cur.data.staff, ...fields } };
            writeSlot(activeRole, nextData, cur.persist);
            return { ...prev, [activeRole]: { ...cur, data: nextData } };
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
                    dropSession(staffRole);
                    router.replace(loginPath);
                }
                return Promise.reject(err);
            }
        );
        return () => axios.interceptors.response.eject(interceptor);
        // eslint-disable-next-line react-hooks/exhaustive-deps
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
