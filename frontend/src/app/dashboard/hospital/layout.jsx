'use client';
import { DashboardShell } from '@/components/dashboard';
import { ROLES } from '@/lib/navigation';

export default function HospitalLayout({ children }) {
  return <DashboardShell role={ROLES.HOSPITAL_STAFF}>{children}</DashboardShell>;
}
