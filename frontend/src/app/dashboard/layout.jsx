// Private staff pages: a default tab title, and keep them out of search engines.
export const metadata = { title: { default: 'Dashboard', template: '%s | BloodLife AI' }, robots: { index: false, follow: false } };

export default function DashboardLayout({ children }) {
  return children;
}
