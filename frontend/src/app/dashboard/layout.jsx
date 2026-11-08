import { serverLang } from '@/i18n/server';
import { translate } from '@/i18n/translate';
// Private staff pages: a default tab title, and keep them out of search engines.
export const generateMetadata = async () => ({
  title: { default: translate(await serverLang(), 'titles.dashboard'), template: '%s | BloodLife AI' },
  robots: { index: false, follow: false },
});

export default function DashboardLayout({ children }) {
  return children;
}
