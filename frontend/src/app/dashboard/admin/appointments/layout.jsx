import { pageTitle } from '@/i18n/server';
export const generateMetadata = pageTitle('appointments');

export default function DashboardAdminAppointmentsLayout({ children }) {
  return children;
}
