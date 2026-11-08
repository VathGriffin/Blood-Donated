import { pageTitle } from '@/i18n/server';
export const generateMetadata = pageTitle('manageDonors');

export default function DashboardAdminDonorsLayout({ children }) {
  return children;
}
