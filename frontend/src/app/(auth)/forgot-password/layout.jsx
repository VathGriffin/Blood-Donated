import { pageTitle } from '@/i18n/server';
export const generateMetadata = pageTitle('forgotPassword');

export default function AuthForgotPasswordLayout({ children }) {
  return children;
}
