import { pageTitle } from '@/i18n/server';
export const generateMetadata = pageTitle('signIn');

export default function AuthLoginLayout({ children }) {
  return children;
}
