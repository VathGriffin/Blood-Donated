import { pageTitle } from '@/i18n/server';
export const generateMetadata = pageTitle('adminSignIn');

export default function AuthAdminLoginLayout({ children }) {
  return children;
}
