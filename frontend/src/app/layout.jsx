import { cookies } from 'next/headers';
import { inter } from '@/lib/fonts';
import Providers from '@/lib/Providers';
import { SITE_URL } from '@/lib/site-url';

const DESCRIPTION = 'Connecting blood donors, patients and hospitals across Cambodia — register as a donor, book an appointment, request blood and get answers from an AI assistant.';

export const metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: 'BloodLife AI — Blood Donation Platform',
    template: '%s | BloodLife AI',
  },
  description: DESCRIPTION,
  applicationName: 'BloodLife AI',
  openGraph: {
    type: 'website',
    siteName: 'BloodLife AI',
    title: 'BloodLife AI — Blood Donation Platform',
    description: DESCRIPTION,
  },
  twitter: { card: 'summary_large_image', title: 'BloodLife AI — Blood Donation Platform', description: DESCRIPTION },
  icons: { icon: '/favicon.ico' },
  keywords: ['blood donation', 'blood bank', 'donor management', 'AI chatbot', 'hospital support', 'Cambodia'],
};

export const viewport = { themeColor: '#C91D32' };

export default async function RootLayout({ children }) {
  // Saved light/dark choice, so the first paint already uses the right theme.
  const mode = (await cookies()).get('mui-theme')?.value;
  const initialMode = mode === 'dark' || mode === 'light' ? mode : undefined;

  return (
    // data-scroll-behavior tells Next.js the smooth scrolling (theme.js) is intentional, so it
    // switches it off during route changes instead of animating the jump to the new page's top.
    <html lang="en" className={inter.variable} style={{ colorScheme: initialMode || 'light' }} data-scroll-behavior="smooth">
      <body className={inter.className}>
        <Providers initialMode={initialMode}>
          {children}
        </Providers>
      </body>
    </html>
  );
}
