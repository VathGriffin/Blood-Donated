import { pageTitle } from '@/i18n/server';
export const generateMetadata = pageTitle('myProfile');

export default function DonorProfileLayout({ children }) {
  return children;
}
