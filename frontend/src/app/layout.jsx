import { cookies } from 'next/headers';
import { inter } from '@/lib/fonts';
import Providers from '@/lib/Providers';

export const metadata = {
  title: {
    default: 'BloodLife AI — Blood Donation Platform',
    template: '%s | BloodLife AI',
  },
  description: 'Development of an Intelligent Blood Donation Management Platform Integrated with an AI Chatbot for Donor and Hospital Support. Connecting donors, patients, and hospitals across Cambodia.',
  icons: { icon: '/favicon.ico' },
  keywords: ['blood donation', 'blood bank', 'donor management', 'AI chatbot', 'hospital support', 'Cambodia'],
};

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
