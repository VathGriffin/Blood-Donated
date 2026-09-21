'use client';
import { DashboardShell } from '@/components/dashboard';
import { ROLES } from '@/lib/navigation';

// Donor-only pages (/profile, /qr-card, /notification). The (donor) group name does not
// appear in URLs, so these routes are unchanged.
export default function DonorLayout({ children }) {
  return <DashboardShell role={ROLES.DONOR}>{children}</DashboardShell>;
}
