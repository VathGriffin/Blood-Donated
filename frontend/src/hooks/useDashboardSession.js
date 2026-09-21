'use client';
import { useCallback, useEffect, useRef, useState } from 'react';
import axios from 'axios';
import API_BASE from '@/lib/config';
import { useAuth } from '@/store/AuthContext';
import { useUserAuth } from '@/store/UserAuthContext';
import { ROLES, ROLE_CONFIG, fromApiRole } from '@/lib/navigation';

/**
 * Resolves the signed-in account for a dashboard area — using the app's two existing
 * sessions (staff: AuthContext, donors: UserAuthContext), never a parallel one.
 *
 * The role is NOT taken from localStorage. Whatever is stored there can be edited by
 * the user, so the session is confirmed with the server first (GET /api/staff/me or
 * /api/user/me, both of which verify the JWT and re-read the account). Until that
 * succeeds the status is 'loading' and the shell renders nothing protected.
 *
 * status:
 *   loading          – hydrating the stored session, or waiting on the server
 *   unauthenticated  – no session for this area            → send to `redirectTo`
 *   forbidden        – signed in, but as a different role → send to the actual role's home
 *   error            – server unreachable / failed          → offer a retry
 *   ready            – server confirmed the session and it matches `requiredRole`
 */
export function useDashboardSession(requiredRole) {
  const staffAuth = useAuth();
  const donorAuth = useUserAuth();
  const isDonorArea = requiredRole === ROLES.DONOR;

  const ready = staffAuth.ready && donorAuth.ready;
  const token = isDonorArea ? donorAuth.token : staffAuth.token;
  const ctxLogout = isDonorArea ? donorAuth.logout : staffAuth.logout;

  const [verified, setVerified] = useState(null); // { token, role, account }
  const [failedToken, setFailedToken] = useState(null);
  const [attempt, setAttempt] = useState(0);
  const signingOut = useRef(false);

  useEffect(() => {
    if (!ready || !token) return undefined;
    let cancelled = false;
    setFailedToken(null);
    const url = isDonorArea ? `${API_BASE}/api/user/me` : `${API_BASE}/api/staff/me`;
    axios.get(url, { headers: { Authorization: `Bearer ${token}` } })
      .then(({ data }) => {
        if (cancelled) return;
        setVerified({ token, role: isDonorArea ? ROLES.DONOR : fromApiRole(data.role), account: data });
      })
      .catch((err) => {
        if (cancelled) return;
        const status = err.response?.status;
        // These outcomes all mean the stored session is unusable, so clear it (the shell
        // then redirects to login) rather than offering a retry:
        //   401 – token invalid or expired, or the account was deleted
        //   403 – a valid token of the wrong kind (e.g. a donor JWT in the staff slot)
        //   404 on /api/user/me – the donor account was deleted
        // This is handled here, not left to AuthContext's 401 interceptor: on first load
        // this request fires before that interceptor has been registered, so it would
        // miss it and leave the user on "Checking your session…" forever.
        if (status === 401 || status === 403 || (status === 404 && isDonorArea)) { ctxLogout(); return; }
        setFailedToken(token); // network error / 5xx — offer a retry, keep the session
      });
    return () => { cancelled = true; };
    // ctxLogout is intentionally omitted: it changes identity each render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, token, isDonorArea, attempt]);

  let status;
  if (!ready) status = 'loading';
  else if (!token) status = 'unauthenticated';
  else if (verified?.token === token) status = verified.role === requiredRole ? 'ready' : 'forbidden';
  else if (failedToken === token) status = 'error';
  else status = 'loading';

  const role = status === 'ready' ? requiredRole : null;
  const actualRole = verified?.token === token ? verified.role : null;
  const cfg = ROLE_CONFIG[requiredRole];

  // Where to send the user when they have no valid session here. After a deliberate
  // sign-out donors go to the public home page instead of the login form.
  const redirectTo = signingOut.current ? cfg.signOutPath : cfg.loginPath;

  const logout = useCallback(() => {
    signingOut.current = true;
    ctxLogout();
  }, [ctxLogout]);

  const retry = useCallback(() => setAttempt((n) => n + 1), []);

  const account = verified?.token === token ? verified.account : null;
  const profile = status !== 'ready' ? null : isDonorArea
    ? {
        name: donorAuth.user?.fullName || account?.fullName || 'Donor',
        email: donorAuth.user?.email || account?.email || '',
        photo: donorAuth.user?.photo || account?.photo || null,
        subtitle: 'Donor',
      }
    : {
        // Name from the live context (settings edits update it); hospital from the server.
        name: staffAuth.staff?.fullName || account?.fullName || 'Staff',
        email: staffAuth.staff?.email || account?.email || '',
        // The live context wins so a just-uploaded (or removed) photo shows immediately.
        photo: staffAuth.staff?.photo !== undefined ? staffAuth.staff.photo : (account?.photo || null),
        subtitle: requiredRole === ROLES.ADMIN ? 'System Administrator' : account?.hospitalName || 'Hospital staff',
      };

  return { status, role, actualRole, account, profile, token, redirectTo, logout, retry };
}
