import { pageTitle } from '@/i18n/server';
export const generateMetadata = pageTitle('hospitalStaffSignIn');

export default function AuthHospitalLoginLayout({ children }) {
  return children;
}
