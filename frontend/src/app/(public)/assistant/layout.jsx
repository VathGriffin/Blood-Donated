import { pageTitle } from '@/i18n/server';
export const generateMetadata = pageTitle('aiAssistant');

export default function PublicAssistantLayout({ children }) {
  return children;
}
