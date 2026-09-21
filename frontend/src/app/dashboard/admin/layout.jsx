'use client';
import { DashboardShell } from '@/components/dashboard';
import { ROLES } from '@/lib/navigation';

export default function AdminLayout({ children }) {
  return <DashboardShell role={ROLES.ADMIN}>{children}</DashboardShell>;
}
