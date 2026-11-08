import { pageTitle } from '@/i18n/server';
export const generateMetadata = pageTitle('bloodRequests');

export default function DashboardHospitalRequestsLayout({ children }) {
  return children;
}
