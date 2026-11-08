import { pageTitle } from '@/i18n/server';
export const generateMetadata = pageTitle('settings');

export default function DashboardAdminSettingsLayout({ children }) {
  return children;
}
