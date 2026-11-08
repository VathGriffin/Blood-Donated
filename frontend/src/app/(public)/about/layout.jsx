import { pageTitle } from '@/i18n/server';
export const generateMetadata = pageTitle('about');

export default function PublicAboutLayout({ children }) {
  return children;
}
