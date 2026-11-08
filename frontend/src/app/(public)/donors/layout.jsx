import { pageTitle } from '@/i18n/server';
export const generateMetadata = pageTitle('donorDirectory');

export default function PublicDonorsLayout({ children }) {
  return children;
}
