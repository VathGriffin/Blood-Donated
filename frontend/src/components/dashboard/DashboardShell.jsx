'use client';
import { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { Alert, Box, Button, CircularProgress, Typography } from '@mui/material';
import BrandLogo from './BrandLogo';
import DashboardSidebar from './DashboardSidebar';
import DashboardTopBar from './DashboardTopBar';
import { useDashboardSession } from '@/hooks/useDashboardSession';
import { useDashboardNotifications } from '@/hooks/useDashboardNotifications';
import { ROLE_CONFIG, ROLES } from '@/lib/navigation';

// Shown instead of the page while the session is being checked or a redirect is in
// flight — protected content is never rendered before the server confirms the role.
function ShellStatus({ children }) {
  return (
    <Box
      role="status"
      sx={{
        minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        gap: 3, px: 3, textAlign: 'center', bgcolor: 'background.default',
      }}
    >
      <Box sx={{ bgcolor: 'primary.dark', borderRadius: 3, px: 2, py: 1.5 }}>
        <BrandLogo />
      </Box>
      {children}
    </Box>
  );
}

/**
 * The shared dashboard frame: role-specific sidebar (drawer on mobile), sticky top bar
 * and a responsive content area. One component serves every role — pass the role this
 * area requires and it takes care of the rest:
 *
 *   <DashboardShell role={ROLES.ADMIN}>{children}</DashboardShell>
 *
 * Access: the shell confirms the session and role with the server before rendering
 * children, and redirects to the right login (no session) or the user's own home
 * (wrong role). That is a UX guard — the API independently rejects any request whose
 * token lacks the role, which is what actually protects the data.
 */
export default function DashboardShell({ role, children }) {
  const router = useRouter();
  const pathname = usePathname();
  const session = useDashboardSession(role);
  const notifications = useDashboardNotifications(session);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    if (session.status === 'unauthenticated') router.replace(session.redirectTo);
    else if (session.status === 'forbidden') router.replace(ROLE_CONFIG[session.actualRole]?.homePath || '/');
  }, [session.status, session.redirectTo, session.actualRole, router]);

  useEffect(() => { setMobileOpen(false); }, [pathname]);

  if (session.status === 'error') {
    return (
      <ShellStatus>
        <Alert severity="error" sx={{ maxWidth: 420, textAlign: 'left' }}
          action={<Button color="inherit" size="small" onClick={session.retry}>Retry</Button>}>
          We couldn&apos;t verify your session. Check your connection and try again.
        </Alert>
        <Button color="inherit" onClick={session.logout}>Sign out</Button>
      </ShellStatus>
    );
  }

  if (session.status !== 'ready') {
    const redirecting = session.status === 'unauthenticated' || session.status === 'forbidden';
    return (
      <ShellStatus>
        <CircularProgress size={28} color="primary" />
        <Typography variant="body2" color="text.secondary">
          {redirecting ? 'Redirecting…' : 'Checking your session…'}
        </Typography>
      </ShellStatus>
    );
  }

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: 'background.default', color: 'text.primary' }}>
      <Box
        component="a"
        href="#main-content"
        sx={{
          position: 'absolute', left: 8, top: -48, zIndex: (t) => t.zIndex.tooltip + 1, px: 2, py: 1,
          borderRadius: 1, bgcolor: 'primary.main', color: 'primary.contrastText', fontWeight: 600, fontSize: '0.875rem',
          '&:focus': { top: 8 },
        }}
      >
        Skip to content
      </Box>

      <DashboardSidebar role={role} profile={session.profile} open={mobileOpen} onClose={() => setMobileOpen(false)} />

      <Box sx={{ flexGrow: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
        <DashboardTopBar
          role={role}
          profile={session.profile}
          hospitalName={role === ROLES.HOSPITAL_STAFF ? session.account?.hospitalName : null}
          notifications={notifications}
          onMenuClick={() => setMobileOpen(true)}
          onLogout={session.logout}
        />
        <Box
          component="main"
          id="main-content"
          sx={(t) => ({
            flexGrow: 1,
            width: '100%',
            maxWidth: t.custom.layout.contentMaxWidth,
            mx: 'auto',
            minWidth: 0,
            p: t.custom.layout.pagePadding,
          })}
        >
          {children}
        </Box>
      </Box>
    </Box>
  );
}
